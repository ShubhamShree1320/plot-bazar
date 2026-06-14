import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/middleware-helpers";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

const updateSchema = z.object({
  freeListingLimit: z.number().int().positive().optional(),
  listingFeeAmount: z.number().positive().optional(),
  otpExpiryMinutes: z.number().int().positive().optional(),
  feedbackDelayHours: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { error } = requireAdmin(req);
    if (error) return error;

    let settings = await prisma.settings.findUnique({ where: { id: "global" } });
    if (!settings) {
      settings = await prisma.settings.create({ data: { id: "global" } });
    }

    return successResponse({ settings });
  } catch (err) {
    console.error("Get settings error:", err);
    return serverErrorResponse();
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error } = requireAdmin(req);
    if (error) return error;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const settings = await prisma.settings.upsert({
      where: { id: "global" },
      create: { id: "global", ...parsed.data },
      update: parsed.data,
    });

    return successResponse({ settings });
  } catch (err) {
    console.error("Update settings error:", err);
    return serverErrorResponse();
  }
}
