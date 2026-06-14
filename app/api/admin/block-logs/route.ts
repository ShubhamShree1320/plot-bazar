import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-helpers";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = requireAdmin(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.blockLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          admin: { select: { name: true } },
        },
      }),
      prisma.blockLog.count(),
    ]);

    return successResponse({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Block logs error:", err);
    return serverErrorResponse();
  }
}
