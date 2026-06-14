import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-helpers";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = requireAdmin(req);
    if (error) return error;

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        plots: {
          where: { status: { not: "DELETED" } },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
        tokenPayments: { orderBy: { createdAt: "desc" }, take: 10 },
        feedbacksAsBuyer: { orderBy: { createdAt: "desc" }, take: 5 },
        blockLogs: { orderBy: { createdAt: "desc" }, take: 5, include: { admin: { select: { name: true } } } },
      },
    });

    if (!user) return notFoundResponse("User not found");

    return successResponse({ user });
  } catch (err) {
    console.error("Admin get user error:", err);
    return serverErrorResponse();
  }
}

const updateSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  name: z.string().min(2).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = requireAdmin(req);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const user = await prisma.user.update({ where: { id }, data: parsed.data });
    return successResponse({ user });
  } catch (err) {
    console.error("Admin update user error:", err);
    return serverErrorResponse();
  }
}
