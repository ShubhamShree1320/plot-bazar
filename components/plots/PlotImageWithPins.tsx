"use client";

import { useState } from "react";
import Image from "next/image";

interface Coordinate {
  x: number;
  y: number;
  label: string;
}

interface PlotImageWithPinsProps {
  imageUrl: string;
  coordinates?: Coordinate[];
  alt?: string;
}

export default function PlotImageWithPins({ imageUrl, coordinates = [], alt = "Plot image" }: PlotImageWithPinsProps) {
  const [activePin, setActivePin] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-gray-100">
      <div
        className="relative"
        style={{ paddingBottom: `${(dimensions.height / dimensions.width) * 100}%` }}
      >
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className="object-contain"
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {coordinates.map((coord, i) => (
            <g key={i}>
              <circle
                cx={coord.x}
                cy={coord.y}
                r={12}
                fill={activePin === i ? "#ef4444" : "#2563eb"}
                fillOpacity={0.85}
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer"
                onClick={() => setActivePin(activePin === i ? null : i)}
              />
              <text
                x={coord.x}
                y={coord.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize={14}
                fontWeight="bold"
                className="pointer-events-none select-none"
              >
                {i + 1}
              </text>

              {activePin === i && (
                <foreignObject
                  x={Math.min(coord.x + 16, dimensions.width - 180)}
                  y={Math.max(coord.y - 40, 0)}
                  width={170}
                  height={50}
                >
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                    <span className="font-semibold">#{i + 1}</span> {coord.label}
                  </div>
                </foreignObject>
              )}
            </g>
          ))}
        </svg>
      </div>

      {coordinates.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 font-medium mb-2">Pin Legend</p>
          <div className="flex flex-wrap gap-2">
            {coordinates.map((c, i) => (
              <button
                key={i}
                onClick={() => setActivePin(activePin === i ? null : i)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors
                  ${activePin === i ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}
              >
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {i + 1}
                </span>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
