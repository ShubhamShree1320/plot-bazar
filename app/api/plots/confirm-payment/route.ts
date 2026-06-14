import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helpers";
import { verifyPaymentSignature } from "@/lib/razorpay";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const confirmSchema = z.object({
  paymentId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  plotData: z.object({
    title: z.string(),
    description: z.string().optional(),
    price: z.number(),
    area: z.number(),
    areaUnit: z.string().optional(),
    state: z.string(),
    city: z.string(),
    locality: z.string().optional(),
    pincode: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const { error, userId } = requireAuth(req);
    if (error) return error;

    const user = await prisma.user.findUnique({ where: { id: userId! } });
    if (!user) return errorResponse("User not found", 404);
    if (user.isBlocked) return forbiddenResponse("ACCOUNT_BLOCKED");

    const body = await req.json();
    const parsed = confirmSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature, plotData } = parsed.data;

    const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) return errorResponse("Payment verification failed", 400);

    const listingPayment = await prisma.listingPayment.findFirst({
      where: { id: paymentId, userId: userId!, razorpayOrderId },
    });

    if (!listingPayment) return errorResponse("Payment record not found", 404);

    const plot = await prisma.plot.create({
      data: { ...plotData, areaUnit: plotData.areaUnit || "sqft", sellerId: userId! },
    });

    await prisma.listingPayment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED", razorpayPaymentId, plotId: plot.id },
    });

    return successResponse({ plot }, 201);
  } catch (err) {
    console.error("Confirm payment error:", err);
    return serverErrorResponse();
  }
}
