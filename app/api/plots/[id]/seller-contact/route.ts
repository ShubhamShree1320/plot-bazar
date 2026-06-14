import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helpers";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, userId } = requireAuth(req);
    if (error) return error;

    const { id: plotId } = await params;
    const user = await prisma.user.findUnique({ where: { id: userId! } });
    if (!user) return errorResponse("User not found", 404);
    if (user.isBlocked) return forbiddenResponse("ACCOUNT_BLOCKED");

    const plot = await prisma.plot.findUnique({
      where: { id: plotId, status: "ACTIVE" },
      include: { seller: true },
    });

    if (!plot) return notFoundResponse("Plot not found");

    if (plot.sellerId === userId) {
      return successResponse({
        seller: {
          name: plot.seller.name,
          email: plot.seller.email,
          phone: plot.seller.phone,
        },
        isOwner: true,
      });
    }

    const payment = await prisma.tokenPayment.findUnique({
      where: { buyerId_plotId: { buyerId: userId!, plotId } },
    });

    if (!payment || payment.status !== "COMPLETED") {
      return errorResponse("Please pay the token amount to view seller contact", 403);
    }

    return successResponse({
      seller: {
        name: plot.seller.name,
        email: plot.seller.email,
        phone: plot.seller.phone,
      },
      isOwner: false,
    });
  } catch (err) {
    console.error("Seller contact error:", err);
    return serverErrorResponse();
  }
}
