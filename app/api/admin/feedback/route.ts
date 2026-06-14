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
    const filter = searchParams.get("filter");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filter === "genuine") where.isGenuine = true;
    if (filter === "not-genuine") where.isGenuine = false;
    if (filter === "pending") where.status = "PENDING";

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { name: true, email: true } },
          seller: { select: { name: true, email: true } },
          plot: { select: { title: true, city: true } },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const negativeByBuyer = await prisma.feedback.groupBy({
      by: ["buyerId"],
      where: { isGenuine: false, status: "SUBMITTED" },
      _count: true,
      having: { buyerId: { _count: { gte: 1 } } },
    });

    return successResponse({
      feedbacks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      negativeByBuyer,
    });
  } catch (err) {
    console.error("Admin feedback error:", err);
    return serverErrorResponse();
  }
}
