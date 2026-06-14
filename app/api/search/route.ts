import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (q.length < 2) {
      return successResponse({ suggestions: [] });
    }

    const [cities, states, localities] = await Promise.all([
      prisma.plot.findMany({
        where: { city: { contains: q, mode: "insensitive" }, status: "ACTIVE" },
        select: { city: true, state: true },
        distinct: ["city"],
        take: 5,
      }),
      prisma.plot.findMany({
        where: { state: { contains: q, mode: "insensitive" }, status: "ACTIVE" },
        select: { state: true },
        distinct: ["state"],
        take: 3,
      }),
      prisma.plot.findMany({
        where: { locality: { contains: q, mode: "insensitive" }, status: "ACTIVE" },
        select: { locality: true, city: true, state: true },
        distinct: ["locality"],
        take: 5,
      }),
    ]);

    const suggestions = [
      ...states.map((s) => ({
        type: "state",
        label: s.state,
        value: { state: s.state },
      })),
      ...cities.map((c) => ({
        type: "city",
        label: `${c.city}, ${c.state}`,
        value: { city: c.city, state: c.state },
      })),
      ...localities
        .filter((l) => l.locality)
        .map((l) => ({
          type: "locality",
          label: `${l.locality}, ${l.city}`,
          value: { locality: l.locality!, city: l.city, state: l.state },
        })),
    ];

    return successResponse({ suggestions });
  } catch (err) {
    console.error("Search suggestions error:", err);
    return serverErrorResponse();
  }
}
