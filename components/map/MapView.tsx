"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

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
  center?: [number, number];
  zoom?: number;
  onPlotHover?: (id: string | null) => void;
  onPlotClick?: (id: string) => void;
  hoveredId?: string | null;
  selectedId?: string | null;
}

export default function MapView({ plots, center, zoom = 10, onPlotHover, onPlotClick, hoveredId, selectedId }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);

  const defaultCenter: [number, number] = center || [20.5937, 78.9629]; // India center

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || leafletRef.current) return;

    // Dynamic import of leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");

      // Fix default icon path
      const iconDefault = L.Icon.Default.prototype as unknown as Record<string, unknown>;
      delete iconDefault._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, { zoomControl: true }).setView(defaultCenter, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      leafletRef.current = { map, markers: [] as unknown[] };
      setMapLoaded(true);

      return () => { map.remove(); leafletRef.current = null; };
    });
  }, []);

  useEffect(() => {
    if (!mapLoaded || !leafletRef.current) return;

    import("leaflet").then((L) => {
      const { map, markers } = leafletRef.current;

      markers.forEach((m: { remove: () => void }) => m.remove());
      leafletRef.current.markers = [];

      plots.forEach((plot) => {
        if (!plot.latitude || !plot.longitude) return;

        const isSelected = selectedId === plot.id;
        const isHovered = hoveredId === plot.id;
        const isActive = isSelected || isHovered;
        const icon = L.divIcon({
          html: `<div style="
            background: ${isSelected ? "#1e3a8a" : isHovered ? "#1d4ed8" : "#2563eb"};
            color: white;
            padding: ${isActive ? "5px 10px" : "4px 8px"};
            border-radius: 999px;
            font-size: ${isActive ? "12px" : "11px"};
            font-weight: 700;
            border: ${isSelected ? "3px solid #fbbf24" : "2px solid white"};
            box-shadow: ${isSelected ? "0 0 0 2px #1e3a8a, 0 4px 12px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.3)"};
            white-space: nowrap;
            transform: ${isActive ? "scale(1.15)" : "scale(1)"};
            transition: all 0.15s;
            z-index: ${isSelected ? 1000 : 1};
          ">₹${(plot.price / 100000).toFixed(1)}L</div>`,
          className: "",
          iconAnchor: [0, 0],
        });

        const marker = L.marker([plot.latitude, plot.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="width:200px; padding:4px;">
              ${plot.imageUrl ? `<img src="${plot.imageUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;" alt="${plot.title}"/>` : ""}
              <p style="font-weight:600;font-size:13px;margin:0 0 4px;">${plot.title}</p>
              <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">${plot.city}</p>
              <a href="/plots/${plot.id}" style="background:#2563eb;color:white;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;display:block;text-align:center;">View Details</a>
            </div>
          `);

        marker.on("mouseover", () => onPlotHover?.(plot.id));
        marker.on("mouseout", () => onPlotHover?.(null));
        marker.on("click", () => onPlotClick?.(plot.id));

        leafletRef.current.markers.push(marker);
      });
    });
  }, [plots, mapLoaded, hoveredId, selectedId, onPlotHover, onPlotClick]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
          <MapPin className="w-8 h-8 text-gray-400 animate-bounce mb-2" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  );
}
