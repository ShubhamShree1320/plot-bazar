import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function createOTP(identifier: string, expiryMinutes: number = 10): Promise<string> {
  const otp = generateOTP();
  const hashedOtp = await hashOTP(otp);

  await prisma.oTP.updateMany({
    where: { identifier, isUsed: false },
    data: { isUsed: true },
  });

  await prisma.oTP.create({
    data: {
      identifier,
      code: hashedOtp,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    },
  });

  return otp;
}

export async function verifyOTP(
  identifier: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const record = await prisma.oTP.findFirst({
    where: { identifier, isUsed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { success: false, error: "OTP not found or already used" };
  }

  if (record.lockedUntil && record.lockedUntil > new Date()) {
    return { success: false, error: "Too many failed attempts. Try again later." };
  }

  if (record.expiresAt < new Date()) {
    return { success: false, error: "OTP has expired" };
  }

  const isValid = await bcrypt.compare(otp, record.code);

  if (!isValid) {
    const newAttempts = record.attempts + 1;
    const lockedUntil = newAttempts >= 3 ? new Date(Date.now() + 15 * 60 * 1000) : null;

    await prisma.oTP.update({
      where: { id: record.id },
      data: { attempts: newAttempts, lockedUntil },
    });

    if (newAttempts >= 3) {
      return { success: false, error: "Account locked for 15 minutes due to too many failed attempts" };
    }

    return { success: false, error: `Invalid OTP. ${3 - newAttempts} attempts remaining.` };
  }

  await prisma.oTP.update({
    where: { id: record.id },
    data: { isUsed: true },
  });

  return { success: true };
}
