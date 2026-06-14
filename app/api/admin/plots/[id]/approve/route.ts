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

const schema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = requireAdmin(req);
    if (error) return error;

    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const plot = await prisma.plot.findUnique({ where: { id } });
    if (!plot) return notFoundResponse("Plot not found");

    const status = parsed.data.action === "approve" ? "ACTIVE" : "DELETED";
    const updated = await prisma.plot.update({ where: { id }, data: { status } });

    return successResponse({ plot: updated, message: `Plot ${parsed.data.action}d` });
  } catch (err) {
    console.error("Admin approve plot error:", err);
    return serverErrorResponse();
  }
}
