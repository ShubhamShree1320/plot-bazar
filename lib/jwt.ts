import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-change-in-production");

export interface JWTPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function signJWT(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}

export function signFeedbackToken(payload: { feedbackId: string; buyerId: string; plotId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyFeedbackToken(token: string): Promise<{ feedbackId: string; buyerId: string; plotId: string }> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as { feedbackId: string; buyerId: string; plotId: string };
}
