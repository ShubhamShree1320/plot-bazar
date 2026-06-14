"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Ruler, Tag } from "lucide-react";

interface PlotCardProps {
  id: string;
  title: string;
  price: number;
  area: number;
  areaUnit: string;
  city: string;
  state: string;
  status: string;
  imageUrl?: string;
  tokenAmount?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  SOLD: "bg-red-100 text-red-700",
  PENDING: "bg-yellow-100 text-yellow-700",
};

export default function PlotCard({
  id, title, price, area, areaUnit, city, state, status, imageUrl, tokenAmount,
}: PlotCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow group border border-gray-100">
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
            {status}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
            ₹{price.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-base line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{city}, {state}</span>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <Ruler className="w-4 h-4 flex-shrink-0" />
          <span>{area.toLocaleString()} {areaUnit}</span>
        </div>

        {tokenAmount && (
          <div className="flex items-center gap-1 text-amber-600 text-xs mb-3">
            <Tag className="w-3 h-3" />
            <span>Token: ₹{tokenAmount.toLocaleString("en-IN")}</span>
          </div>
        )}

        <Link
          href={`/plots/${id}`}
          className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl text-sm transition-colors"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
