import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helpers";
import { createOrder, DEV_PAYMENT_MODE } from "@/lib/razorpay";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const schema = z.object({ plotId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const { error, userId } = requireAuth(req);
    if (error) return error;

    const user = await prisma.user.findUnique({ where: { id: userId! } });
    if (!user) return errorResponse("User not found", 404);
    if (user.isBlocked) return forbiddenResponse("ACCOUNT_BLOCKED");

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { plotId } = parsed.data;

    const plot = await prisma.plot.findUnique({ where: { id: plotId, status: "ACTIVE" } });
    if (!plot) return notFoundResponse("Plot not found");
    if (plot.sellerId === userId) return errorResponse("You cannot pay for your own plot");
    if (!plot.tokenAmount) return errorResponse("Token amount not set by admin yet");

    const existing = await prisma.tokenPayment.findUnique({
      where: { buyerId_plotId: { buyerId: userId!, plotId } },
    });

    if (existing?.status === "COMPLETED") {
      return errorResponse("You have already unlocked this seller's contact");
    }

    const orderId = DEV_PAYMENT_MODE
      ? `dev_order_${Date.now()}`
      : (await createOrder(plot.tokenAmount, "INR", `token-${userId}-${plotId}-${Date.now()}`)).id;

    const payment = await prisma.tokenPayment.upsert({
      where: { buyerId_plotId: { buyerId: userId!, plotId } },
      create: {
        buyerId: userId!,
        plotId,
        amount: plot.tokenAmount,
        razorpayOrderId: orderId,
        status: "PENDING",
      },
      update: {
        razorpayOrderId: orderId,
        status: "PENDING",
      },
    });

    return successResponse({
      paymentId: payment.id,
      razorpayOrderId: orderId,
      amount: plot.tokenAmount,
      plotTitle: plot.title,
      devMode: DEV_PAYMENT_MODE,
    });
  } catch (err) {
    console.error("Create token order error:", err);
    return serverErrorResponse();
  }
}
