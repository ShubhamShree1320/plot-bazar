import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createOTP } from "@/lib/otp";
import { sendOTPEmail } from "@/lib/email";
import { sendOTPSMS } from "@/lib/sms";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { getSettings } from "@/lib/auth-helpers";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
}).refine((d) => d.email || d.phone, { message: "Email or phone is required" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { name, email, phone } = parsed.data;

    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return errorResponse("Email already registered");
    }

    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } });
      if (existing) return errorResponse("Phone already registered");
    }

    const user = await prisma.user.create({
      data: { name, email, phone },
    });

    const settings = await getSettings();
    const identifier = email || phone!;
    const otp = await createOTP(identifier, settings.otpExpiryMinutes);

    if (email) {
      await sendOTPEmail(email, otp, name);
    } else if (phone) {
      await sendOTPSMS(phone, otp);
    }

    return successResponse(
      { userId: user.id, identifier, message: "OTP sent successfully" },
      201
    );
  } catch (err) {
    console.error("Register error:", err);
    return serverErrorResponse();
  }
}
