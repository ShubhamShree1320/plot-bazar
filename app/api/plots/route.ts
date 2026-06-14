import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helpers";
import { createOrder, DEV_PAYMENT_MODE } from "@/lib/razorpay";
import { getSettings } from "@/lib/auth-helpers";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const plotSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  area: z.number().positive(),
  areaUnit: z.enum(["sqft", "sqyd", "acre"]).default("sqft"),
  state: z.string().min(2),
  city: z.string().min(2),
  locality: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state") || undefined;
    const city = searchParams.get("city") || undefined;
    const locality = searchParams.get("locality") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const minArea = searchParams.get("minArea") ? Number(searchParams.get("minArea")) : undefined;
    const maxArea = searchParams.get("maxArea") ? Number(searchParams.get("maxArea")) : undefined;
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (state) where.state = { contains: state, mode: "insensitive" };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (locality) where.locality = { contains: locality, mode: "insensitive" };
    if (minPrice || maxPrice) where.price = { gte: minPrice, lte: maxPrice };
    if (minArea || maxArea) where.area = { gte: minArea, lte: maxArea };

    const orderBy =
      sortBy === "price_asc"
        ? { price: "asc" as const }
        : sortBy === "price_desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

    const [plots, total] = await Promise.all([
      prisma.plot.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          seller: { select: { id: true, name: true } },
          _count: { select: { tokenPayments: true } },
        },
      }),
      prisma.plot.count({ where }),
    ]);

    return successResponse({ plots, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("Get plots error:", err);
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, userId } = requireAuth(req);
    if (error) return error;

    const user = await prisma.user.findUnique({ where: { id: userId! } });
    if (!user) return unauthorizedResponse();
    if (user.isBlocked) return forbiddenResponse("ACCOUNT_BLOCKED");

    const body = await req.json();
    const parsed = plotSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const settings = await getSettings();

    if (user.freeListingsUsed >= settings.freeListingLimit) {
      // Dev mode: skip Razorpay and create the plot directly
      if (DEV_PAYMENT_MODE) {
        const plot = await prisma.plot.create({
          data: { ...parsed.data, sellerId: userId! },
        });
        await prisma.listingPayment.create({
          data: {
            userId: userId!,
            amount: settings.listingFeeAmount,
            razorpayOrderId: `dev_order_${Date.now()}`,
            razorpayPaymentId: `dev_pay_${Date.now()}`,
            status: "COMPLETED",
            plotId: plot.id,
          },
        });
        return successResponse({ plot, devMode: true }, 201);
      }

      const order = await createOrder(
        settings.listingFeeAmount,
        "INR",
        `listing-${userId}-${Date.now()}`
      );

      const payment = await prisma.listingPayment.create({
        data: {
          userId: userId!,
          amount: settings.listingFeeAmount,
          razorpayOrderId: order.id as string,
          status: "PENDING",
        },
      });

      return successResponse(
        {
          requiresPayment: true,
          paymentId: payment.id,
          razorpayOrderId: order.id,
          amount: settings.listingFeeAmount,
          plotData: parsed.data,
        },
        402
      );
    }

    const plot = await prisma.plot.create({
      data: { ...parsed.data, sellerId: userId! },
    });

    await prisma.user.update({
      where: { id: userId! },
      data: { freeListingsUsed: { increment: 1 } },
    });

    return successResponse({ plot }, 201);
  } catch (err) {
    console.error("Create plot error:", err);
    return serverErrorResponse();
  }
}
