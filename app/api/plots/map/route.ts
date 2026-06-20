import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city") || undefined;
    const state = searchParams.get("state") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const minArea = searchParams.get("minArea") ? Number(searchParams.get("minArea")) : undefined;
    const maxArea = searchParams.get("maxArea") ? Number(searchParams.get("maxArea")) : undefined;

    const where: Record<string, unknown> = {
      status: "ACTIVE",
      latitude: { not: null },
      longitude: { not: null },
    };
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (state) where.state = { contains: state, mode: "insensitive" };
    if (minPrice !== undefined || maxPrice !== undefined)
      where.price = { gte: minPrice, lte: maxPrice };
    if (minArea !== undefined || maxArea !== undefined)
      where.area = { gte: minArea, lte: maxArea };

    const plots = await prisma.plot.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        latitude: true,
        longitude: true,
        city: true,
        state: true,
        images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return successResponse(
      plots.map((p) => ({ ...p, imageUrl: p.images[0]?.imageUrl ?? null }))
    );
  } catch (err) {
    console.error("Map plots error:", err);
    return serverErrorResponse();
  }
}
