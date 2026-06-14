import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-helpers";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = requireAdmin(req);
    if (error) return error;

    const [
      totalUsers,
      totalPlots,
      pendingPlots,
      blockedUsers,
      tokenRevenue,
      listingRevenue,
      recentPlots,
      recentRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.plot.count({ where: { status: { not: "DELETED" } } }),
      prisma.plot.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.tokenPayment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.listingPayment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.plot.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } },
        _count: true,
        orderBy: { createdAt: "asc" },
      }),
      prisma.tokenPayment.groupBy({
        by: ["createdAt"],
        where: {
          status: "COMPLETED",
          createdAt: { gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { amount: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalRevenue =
      (tokenRevenue._sum.amount || 0) + (listingRevenue._sum.amount || 0);

    return successResponse({
      totalUsers,
      totalPlots,
      pendingPlots,
      blockedUsers,
      totalRevenue,
      tokenRevenue: tokenRevenue._sum.amount || 0,
      listingRevenue: listingRevenue._sum.amount || 0,
      recentPlots,
      recentRevenue,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return serverErrorResponse();
  }
}
