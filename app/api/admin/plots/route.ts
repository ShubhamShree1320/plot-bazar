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
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: { not: "DELETED" } };
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { state: { contains: search, mode: "insensitive" } },
      ];
    }

    const [plots, total] = await Promise.all([
      prisma.plot.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          seller: { select: { name: true, email: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { tokenPayments: { where: { status: "COMPLETED" } } } },
        },
      }),
      prisma.plot.count({ where }),
    ]);

    return successResponse({ plots, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Admin plots error:", err);
    return serverErrorResponse();
  }
}
