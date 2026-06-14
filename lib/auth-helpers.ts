import { cookies } from "next/headers";
import { verifyJWT } from "./jwt";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
        isVerified: true,
        freeListingsUsed: true,
      },
    });

    return user;
  } catch {
    return null;
  }
}

export async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: "global" } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "global" },
    });
  }
  return settings;
}
