import { NextRequest } from "next/server";
import { z } from "zod";
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
    const { id } = await params;
    const plot = await prisma.plot.findUnique({
      where: { id, status: { not: "DELETED" } },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
        seller: { select: { id: true, name: true } },
        _count: { select: { tokenPayments: { where: { status: "COMPLETED" } } } },
      },
    });

    if (!plot) return notFoundResponse("Plot not found");

    return successResponse({ plot });
  } catch (err) {
    console.error("Get plot error:", err);
    return serverErrorResponse();
  }
}

const updateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  area: z.number().positive().optional(),
  areaUnit: z.enum(["sqft", "sqyd", "acre"]).optional(),
  state: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  locality: z.string().optional(),
  pincode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, userId, role } = requireAuth(req);
    if (error) return error;

    const { id } = await params;
    const plot = await prisma.plot.findUnique({ where: { id } });
    if (!plot) return notFoundResponse("Plot not found");

    if (plot.sellerId !== userId && role !== "ADMIN") {
      return forbiddenResponse("You don't have permission to edit this plot");
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const updated = await prisma.plot.update({
      where: { id },
      data: parsed.data,
    });

    return successResponse({ plot: updated });
  } catch (err) {
    console.error("Update plot error:", err);
    return serverErrorResponse();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, userId, role } = requireAuth(req);
    if (error) return error;

    const { id } = await params;
    const plot = await prisma.plot.findUnique({ where: { id } });
    if (!plot) return notFoundResponse("Plot not found");

    if (plot.sellerId !== userId && role !== "ADMIN") {
      return forbiddenResponse("You don't have permission to delete this plot");
    }

    await prisma.plot.update({ where: { id }, data: { status: "DELETED" } });

    return successResponse({ message: "Plot deleted" });
  } catch (err) {
    console.error("Delete plot error:", err);
    return serverErrorResponse();
  }
}
