import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import { sendOTPSMS } from "@/lib/sms";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { getSettings } from "@/lib/auth-helpers";

const loginSchema = z.object({
  identifier: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { identifier } = parsed.data;
    const isEmail = identifier.includes("@");

    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier } : { phone: identifier },
    });

    if (!user) return errorResponse("User not found. Please register first.", 404);

    if (user.isBlocked) {
      return errorResponse("Your account has been suspended. Please contact support.", 403);
    }

    const settings = await getSettings();
    const otp = await createOTP(identifier, settings.otpExpiryMinutes);

    if (isEmail && user.email) {
      await sendOTPEmail(user.email, otp, user.name);
    } else if (!isEmail && user.phone) {
      await sendOTPSMS(user.phone, otp);
    }

    return successResponse({
      identifier,
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV === "development" && { devOtp: otp }),
    });
  } catch (err) {
    console.error("Login error:", err);
    return serverErrorResponse();
  }
}
