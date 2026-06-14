import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helpers";
import { verifyPaymentSignature, DEV_PAYMENT_MODE } from "@/lib/razorpay";
import { signFeedbackToken } from "@/lib/jwt";
import { sendFeedbackEmail } from "@/lib/email";
import { sendFeedbackSMS } from "@/lib/sms";
import { getSettings } from "@/lib/auth-helpers";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const schema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { error, userId } = requireAuth(req);
    if (error) return error;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    const isValid = DEV_PAYMENT_MODE || verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) return errorResponse("Payment verification failed");

    const payment = await prisma.tokenPayment.findFirst({
      where: { buyerId: userId!, razorpayOrderId },
      include: {
        plot: { include: { seller: true } },
        buyer: true,
      },
    });

    if (!payment) return notFoundResponse("Payment record not found");

    await prisma.tokenPayment.update({
      where: { id: payment.id },
      data: { status: "COMPLETED", razorpayPaymentId },
    });

    const settings = await getSettings();
    const feedbackToken = await signFeedbackToken({
      feedbackId: "",
      buyerId: userId!,
      plotId: payment.plotId,
    });

    const feedback = await prisma.feedback.create({
      data: {
        plotId: payment.plotId,
        buyerId: userId!,
        sellerId: payment.plot.sellerId,
        tokenPaymentId: payment.id,
        feedbackToken,
        status: "PENDING",
      },
    });

    const updatedToken = await signFeedbackToken({
      feedbackId: feedback.id,
      buyerId: userId!,
      plotId: payment.plotId,
    });

    await prisma.feedback.update({
      where: { id: feedback.id },
      data: { feedbackToken: updatedToken },
    });

    // Schedule feedback notification after configured delay
    const delayMs = settings.feedbackDelayHours * 60 * 60 * 1000;
    setTimeout(async () => {
      try {
        const seller = payment.plot.seller;
        if (seller.email) {
          await sendFeedbackEmail(
            seller.email,
            seller.name,
            payment.buyer.name,
            payment.plot.title,
            updatedToken
          );
        }
        if (seller.phone) {
          await sendFeedbackSMS(seller.phone, payment.buyer.name, updatedToken);
        }
        await prisma.feedback.update({
          where: { id: feedback.id },
          data: { sentAt: new Date() },
        });
      } catch (e) {
        console.error("Feedback notification error:", e);
      }
    }, delayMs);

    return successResponse({ message: "Payment verified. Seller contact unlocked." });
  } catch (err) {
    console.error("Verify token payment error:", err);
    return serverErrorResponse();
  }
}
