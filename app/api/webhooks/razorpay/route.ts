import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!verifyWebhookSignature(body, signature)) {
      return errorResponse("Invalid webhook signature", 400);
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      const tokenPayment = await prisma.tokenPayment.findFirst({
        where: { razorpayOrderId: orderId },
      });

      if (tokenPayment && tokenPayment.status !== "COMPLETED") {
        await prisma.tokenPayment.update({
          where: { id: tokenPayment.id },
          data: { status: "COMPLETED", razorpayPaymentId: paymentId },
        });
      }

      const listingPayment = await prisma.listingPayment.findFirst({
        where: { razorpayOrderId: orderId },
      });

      if (listingPayment && listingPayment.status !== "COMPLETED") {
        await prisma.listingPayment.update({
          where: { id: listingPayment.id },
          data: { status: "COMPLETED", razorpayPaymentId: paymentId },
        });
      }
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      await prisma.tokenPayment.updateMany({
        where: { razorpayOrderId: orderId, status: "PENDING" },
        data: { status: "FAILED" },
      });

      await prisma.listingPayment.updateMany({
        where: { razorpayOrderId: orderId, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }

    return successResponse({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return errorResponse("Webhook processing failed", 500);
  }
}
