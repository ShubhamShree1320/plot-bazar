import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-helpers";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { error } = requireAdmin(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== "ALL") where.status = status;

    if (type === "token" || type === "all") {
      const tokenWhere = { ...where };
      const [tokenPayments, tokenTotal] = await Promise.all([
        prisma.tokenPayment.findMany({
          where: tokenWhere,
          skip: type === "all" ? 0 : skip,
          take: type === "all" ? 10 : limit,
          orderBy: { createdAt: "desc" },
          include: {
            buyer: { select: { name: true, email: true } },
            plot: { select: { title: true, city: true } },
          },
        }),
        prisma.tokenPayment.count({ where: tokenWhere }),
      ]);

      if (type === "token") {
        return successResponse({
          payments: tokenPayments,
          total: tokenTotal,
          page,
          limit,
          totalPages: Math.ceil(tokenTotal / limit),
        });
      }

      const [listingPayments, listingTotal] = await Promise.all([
        prisma.listingPayment.findMany({
          where,
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { name: true, email: true } },
            plot: { select: { title: true } },
          },
        }),
        prisma.listingPayment.count({ where }),
      ]);

      return successResponse({
        tokenPayments,
        listingPayments,
        tokenTotal,
        listingTotal,
      });
    }

    const [listingPayments, listingTotal] = await Promise.all([
      prisma.listingPayment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          plot: { select: { title: true } },
        },
      }),
      prisma.listingPayment.count({ where }),
    ]);

    return successResponse({
      payments: listingPayments,
      total: listingTotal,
      page,
      limit,
      totalPages: Math.ceil(listingTotal / limit),
    });
  } catch (err) {
    console.error("Admin payments error:", err);
    return serverErrorResponse();
  }
}
