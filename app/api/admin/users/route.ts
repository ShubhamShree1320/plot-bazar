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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status === "blocked") where.isBlocked = true;
    if (status === "active") where.isBlocked = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isBlocked: true,
          isVerified: true,
          freeListingsUsed: true,
          createdAt: true,
          _count: {
            select: {
              plots: { where: { status: { not: "DELETED" } } },
              tokenPayments: { where: { status: "COMPLETED" } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Admin users error:", err);
    return serverErrorResponse();
  }
}
