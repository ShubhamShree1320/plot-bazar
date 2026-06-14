import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const url = process.env.DATABASE_URL ?? "";
const isPrismaProtocol = url.startsWith("prisma+postgres://") || url.startsWith("prisma://");

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
};

function createPrismaClient() {
  const logLevel = process.env.NODE_ENV === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);

  if (isPrismaProtocol) {
    // prisma+postgres:// URL — requires prisma dev or Prisma Accelerate
    return new PrismaClient({
      accelerateUrl: url,
      log: logLevel,
    }).$extends(withAccelerate());
  }

  // Standard postgresql:// URL — use pg driver adapter
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg({ client: pool });
  return new PrismaClient({ adapter, log: logLevel });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
