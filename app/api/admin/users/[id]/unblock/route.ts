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

const schema = z.object({ reason: z.string().optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, userId: adminId } = requireAdmin(req);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return notFoundResponse("User not found");
    if (!user.isBlocked) return errorResponse("User is not blocked");

    await prisma.user.update({ where: { id }, data: { isBlocked: false } });

    await prisma.blockLog.create({
      data: { userId: id, adminId: adminId!, action: "UNBLOCKED", reason: parsed.data.reason },
    });

    return successResponse({ message: "User unblocked" });
  } catch (err) {
    console.error("Unblock user error:", err);
    return serverErrorResponse();
  }
}
