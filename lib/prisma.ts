import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) throw new Error("DATABASE_URL is not set in environment variables.");

  const logLevel = process.env.NODE_ENV === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);

  if (url.startsWith("prisma+postgres://") || url.startsWith("prisma://")) {
    return new PrismaClient({ accelerateUrl: url, log: logLevel })
      .$extends(withAccelerate());
  }

  const adapter = new PrismaPg(url);
  return new PrismaClient({ adapter, log: logLevel });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
