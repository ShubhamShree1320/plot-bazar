import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyFeedbackToken } from "@/lib/jwt";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(req.url);
    const response = searchParams.get("response");

    let payload: { feedbackId: string; buyerId: string; plotId: string };
    try {
      payload = await verifyFeedbackToken(token);
    } catch {
      return errorResponse("Invalid or expired feedback link", 400);
    }

    const feedback = await prisma.feedback.findFirst({
      where: { feedbackToken: token, id: payload.feedbackId },
      include: {
        buyer: { select: { name: true } },
        plot: { select: { title: true } },
      },
    });

    if (!feedback) return notFoundResponse("Feedback record not found");
    if (feedback.status === "SUBMITTED") {
      return successResponse({ alreadySubmitted: true });
    }

    // Handle quick response via query param (from email buttons)
    if (response === "genuine" || response === "not-genuine") {
      const isGenuine = response === "genuine";
      await submitFeedback(feedback.id, feedback.buyerId, isGenuine, null);
      return successResponse({ submitted: true, isGenuine });
    }

    return successResponse({
      feedbackId: feedback.id,
      buyerName: feedback.buyer.name,
      plotTitle: feedback.plot.title,
      alreadySubmitted: false,
    });
  } catch (err) {
    console.error("Get feedback error:", err);
    return serverErrorResponse();
  }
}

const submitSchema = z.object({
  isGenuine: z.boolean(),
  comment: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    let payload: { feedbackId: string; buyerId: string; plotId: string };
    try {
      payload = await verifyFeedbackToken(token);
    } catch {
      return errorResponse("Invalid or expired feedback link", 400);
    }

    const feedback = await prisma.feedback.findFirst({
      where: { feedbackToken: token, id: payload.feedbackId },
    });

    if (!feedback) return notFoundResponse("Feedback not found");
    if (feedback.status === "SUBMITTED") {
      return errorResponse("Feedback already submitted");
    }

    const body = await req.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    await submitFeedback(feedback.id, feedback.buyerId, parsed.data.isGenuine, parsed.data.comment || null);

    return successResponse({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("Submit feedback error:", err);
    return serverErrorResponse();
  }
}

async function submitFeedback(
  feedbackId: string,
  buyerId: string,
  isGenuine: boolean,
  comment: string | null
) {
  await prisma.feedback.update({
    where: { id: feedbackId },
    data: { isGenuine, comment, status: "SUBMITTED", submittedAt: new Date() },
  });

  if (!isGenuine) {
    const negativeCount = await prisma.feedback.count({
      where: { buyerId, isGenuine: false, status: "SUBMITTED" },
    });

    if (negativeCount >= 3) {
      const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
      if (buyer && !buyer.isBlocked) {
        await prisma.user.update({ where: { id: buyerId }, data: { isBlocked: true } });

        // Find a system admin to log this
        const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
        if (admin) {
          await prisma.blockLog.create({
            data: {
              userId: buyerId,
              adminId: admin.id,
              action: "BLOCKED",
              reason: "Auto-blocked: 3 negative buyer feedback reports",
            },
          });
        }
      }
    }
  }
}
