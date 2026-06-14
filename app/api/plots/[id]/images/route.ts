import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/middleware-helpers";
import { uploadFile, deleteFile } from "@/lib/storage";
import {
  successResponse,
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, userId, role } = requireAuth(req);
    if (error) return error;

    const { id: plotId } = await params;
    const plot = await prisma.plot.findUnique({ where: { id: plotId } });
    if (!plot) return notFoundResponse("Plot not found");

    if (plot.sellerId !== userId && role !== "ADMIN") {
      return forbiddenResponse("Not authorized");
    }

    const existingCount = await prisma.plotImage.count({ where: { plotId } });
    if (existingCount >= 20) {
      return errorResponse("Maximum 20 images allowed per plot");
    }

    const formData = await req.formData();
    const imageFile = formData.get("imageFile") as File | null;
    const imageName = formData.get("imageName") as string || "image";
    const coordinatesRaw = formData.get("coordinates") as string | null;

    if (!imageFile) return errorResponse("Image file is required");

    let coordinates = null;
    if (coordinatesRaw) {
      try {
        coordinates = JSON.parse(coordinatesRaw);
      } catch {
        return errorResponse("Invalid coordinates format");
      }
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageUrl = await uploadFile(buffer, imageName, imageFile.type);

    const isPrimary = existingCount === 0;
    const image = await prisma.plotImage.create({
      data: {
        plotId,
        imageName,
        imageUrl,
        coordinates,
        isPrimary,
        order: existingCount,
      },
    });

    return successResponse({ image }, 201);
  } catch (err) {
    console.error("Upload image error:", err);
    return serverErrorResponse();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, userId, role } = requireAuth(req);
    if (error) return error;

    const { id: plotId } = await params;
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) return errorResponse("imageId is required");

    const image = await prisma.plotImage.findFirst({
      where: { id: imageId, plotId },
      include: { plot: true },
    });

    if (!image) return notFoundResponse("Image not found");

    if (image.plot.sellerId !== userId && role !== "ADMIN") {
      return forbiddenResponse("Not authorized");
    }

    await deleteFile(image.imageUrl);
    await prisma.plotImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const nextImage = await prisma.plotImage.findFirst({
        where: { plotId },
        orderBy: { order: "asc" },
      });
      if (nextImage) {
        await prisma.plotImage.update({ where: { id: nextImage.id }, data: { isPrimary: true } });
      }
    }

    return successResponse({ message: "Image deleted" });
  } catch (err) {
    console.error("Delete image error:", err);
    return serverErrorResponse();
  }
}
