"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { X, Plus } from "lucide-react";

interface Coordinate {
  x: number;
  y: number;
  label: string;
}

interface CoordinateTaggerProps {
  imageUrl: string;
  onSave: (coordinates: Coordinate[]) => void;
  initialCoords?: Coordinate[];
}

export default function CoordinateTagger({ imageUrl, onSave, initialCoords = [] }: CoordinateTaggerProps) {
  const [coords, setCoords] = useState<Coordinate[]>(initialCoords);
  const [pendingCoord, setPendingCoord] = useState<{ x: number; y: number } | null>(null);
  const [label, setLabel] = useState("");
  const imgRef = useRef<HTMLDivElement>(null);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const naturalWidth = 800;
    const naturalHeight = 600;

    const relX = ((e.clientX - rect.left) / rect.width) * naturalWidth;
    const relY = ((e.clientY - rect.top) / rect.height) * naturalHeight;

    setPendingCoord({ x: Math.round(relX), y: Math.round(relY) });
    setLabel("");
  }

  function addPin() {
    if (!pendingCoord || !label.trim()) return;
    const newCoords = [...coords, { ...pendingCoord, label: label.trim() }];
    setCoords(newCoords);
    setPendingCoord(null);
    setLabel("");
    onSave(newCoords);
  }

  function removePin(index: number) {
    const newCoords = coords.filter((_, i) => i !== index);
    setCoords(newCoords);
    onSave(newCoords);
  }

  return (
    <div className="space-y-4">
      <div
        ref={imgRef}
        className="relative cursor-crosshair rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300"
        style={{ paddingBottom: "56.25%" }}
        onClick={handleImageClick}
      >
        <Image src={imageUrl} alt="Tag coordinates" fill className="object-contain" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
          {coords.map((c, i) => (
            <g key={i}>
              <circle cx={c.x} cy={c.y} r={10} fill="#2563eb" fillOpacity={0.85} stroke="white" strokeWidth={2} />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">{i + 1}</text>
            </g>
          ))}
          {pendingCoord && (
            <circle cx={pendingCoord.x} cy={pendingCoord.y} r={10} fill="#f59e0b" stroke="white" strokeWidth={2} strokeDasharray="4" />
          )}
        </svg>
      </div>

      <p className="text-xs text-gray-500">Click on the image to place a pin</p>

      {pendingCoord && (
        <div className="flex gap-2 items-center p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="w-6 h-6 rounded-full bg-amber-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Pin label (e.g. North boundary)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPin()}
            className="flex-1 text-sm border-0 bg-transparent outline-none"
            autoFocus
          />
          <button onClick={addPin} disabled={!label.trim()}
            className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50">
            <Plus className="w-3 h-3" /> Add
          </button>
          <button onClick={() => setPendingCoord(null)}
            className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {coords.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Pins ({coords.length})</p>
          {coords.map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="flex-1 text-gray-700">{c.label}</span>
              <span className="text-xs text-gray-400">({c.x}, {c.y})</span>
              <button onClick={() => removePin(i)} className="text-gray-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
