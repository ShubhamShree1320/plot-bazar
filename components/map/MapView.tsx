"use client";

import { useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import Link from "next/link";

interface PlotMarker {
  id: string;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  city: string;
}

interface MapViewProps {
  plots: PlotMarker[];
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  onPlotHover?: (id: string | null) => void;
  onPlotClick?: (id: string) => void;
  hoveredId?: string | null;
  selectedId?: string | null;
}

const STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;

export default function MapView({
  plots,
  center = [20.5937, 78.9629],
  zoom = 5,
  onPlotHover,
  onPlotClick,
  hoveredId,
  selectedId,
}: MapViewProps) {
  const [popup, setPopup] = useState<PlotMarker | null>(null);
  const [style, setStyle] = useState<keyof typeof STYLES>("streets");

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
        <div className="text-center text-gray-500 p-6">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">Mapbox token not configured</p>
          <p className="text-xs mt-1 text-gray-400">Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        mapboxAccessToken={token}
        initialViewState={{ latitude: center[0], longitude: center[1], zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={STYLES[style]}
      >
        <NavigationControl position="top-right" />

        {plots.map((plot) => {
          const isSelected = selectedId === plot.id;
          const isHovered = hoveredId === plot.id;
          const isActive = isSelected || isHovered;

          return (
            <Marker
              key={plot.id}
              latitude={plot.latitude}
              longitude={plot.longitude}
              anchor="bottom"
            >
              <div
                onClick={() => { onPlotClick?.(plot.id); setPopup(plot); }}
                onMouseEnter={() => onPlotHover?.(plot.id)}
                onMouseLeave={() => onPlotHover?.(null)}
                style={{
                  background: isSelected ? "#1e3a8a" : isHovered ? "#1d4ed8" : "#2563eb",
                  color: "white",
                  padding: isActive ? "5px 10px" : "4px 8px",
                  borderRadius: "999px",
                  fontSize: isActive ? "12px" : "11px",
                  fontWeight: 700,
                  border: isSelected ? "3px solid #fbbf24" : "2px solid white",
                  boxShadow: isSelected
                    ? "0 0 0 2px #1e3a8a, 0 4px 12px rgba(0,0,0,0.4)"
                    : "0 2px 8px rgba(0,0,0,0.3)",
                  whiteSpace: "nowrap",
                  transform: isActive ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.15s",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                ₹{(plot.price / 100000).toFixed(1)}L
              </div>
            </Marker>
          );
        })}

        {popup && (
          <Popup
            latitude={popup.latitude}
            longitude={popup.longitude}
            anchor="top"
            onClose={() => setPopup(null)}
            closeOnClick={false}
            maxWidth="220px"
          >
            <div className="p-1">
              {popup.imageUrl && (
                <img
                  src={popup.imageUrl}
                  className="w-full h-20 object-cover rounded-lg mb-2"
                  alt={popup.title}
                />
              )}
              <p className="font-semibold text-sm text-gray-900 mb-0.5 leading-tight">{popup.title}</p>
              <p className="text-gray-500 text-xs mb-1">{popup.city}</p>
              <p className="text-blue-600 font-bold text-sm mb-2">
                ₹{popup.price.toLocaleString("en-IN")}
              </p>
              <Link
                href={`/plots/${popup.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                View Details
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map / Satellite toggle */}
      <div className="absolute top-3 left-3 z-10 flex rounded-xl overflow-hidden shadow-md border border-gray-200">
        <button
          onClick={() => setStyle("streets")}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            style === "streets" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setStyle("satellite")}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            style === "satellite" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
}
