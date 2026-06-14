import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOTP } from "@/lib/otp";
import { signJWT } from "@/lib/jwt";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

const verifySchema = z.object({
  identifier: z.string(),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0].message);
    }

    const { identifier, otp } = parsed.data;

    const result = await verifyOTP(identifier, otp);
    if (!result.success) {
      return errorResponse(result.error || "Invalid OTP");
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user) return errorResponse("User not found", 404);

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    const token = await signJWT({ userId: user.id, role: user.role });

    const response = successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Verify OTP error:", err);
    return serverErrorResponse();
  }
}
