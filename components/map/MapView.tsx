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
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  onPlotHover?: (id: string | null) => void;
  onPlotClick?: (id: string) => void;
  hoveredId?: string | null;
  selectedId?: string | null;
}

const MAP_STYLES = {
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
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>("streets");

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import("mapbox-gl").then((mod) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // CSS must be imported dynamically alongside the JS to avoid SSR issues
      import("mapbox-gl/dist/mapbox-gl.css");

      const mapboxgl = mod.default;
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) return;

      mapboxgl.accessToken = token;

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: MAP_STYLES.streets,
        center: [center[1], center[0]], // Mapbox uses [lng, lat]
        zoom,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      map.on("load", () => { if (!cancelled) setMapLoaded(true); });

      mapRef.current = { map, mapboxgl };
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-render markers when plots / hover / selection change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const { map, mapboxgl } = mapRef.current;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    plots.forEach((plot) => {
      const isSelected = selectedId === plot.id;
      const isHovered = hoveredId === plot.id;
      const isActive = isSelected || isHovered;

      const el = document.createElement("div");
      el.style.cssText = `
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
        cursor: pointer;
        user-select: none;
      `;
      el.textContent = `₹${(plot.price / 100000).toFixed(1)}L`;

      el.addEventListener("mouseenter", () => onPlotHover?.(plot.id));
      el.addEventListener("mouseleave", () => onPlotHover?.(null));
      el.addEventListener("click", () => {
        onPlotClick?.(plot.id);

        const content = document.createElement("div");
        content.style.cssText = "width:200px;padding:4px;";
        content.innerHTML = `
          ${plot.imageUrl ? `<img src="${plot.imageUrl}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;" alt="${plot.title}"/>` : ""}
          <p style="font-weight:600;font-size:13px;margin:0 0 4px;">${plot.title}</p>
          <p style="color:#6b7280;font-size:12px;margin:0 0 4px;">${plot.city}</p>
          <p style="color:#2563eb;font-weight:700;font-size:13px;margin:0 0 8px;">₹${plot.price.toLocaleString("en-IN")}</p>
          <a href="/plots/${plot.id}" style="background:#2563eb;color:white;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none;display:block;text-align:center;">View Details</a>
        `;

        new mapboxgl.Popup({ closeButton: true, maxWidth: "230px" })
          .setLngLat([plot.longitude, plot.latitude])
          .setDOMContent(content)
          .addTo(map);
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([plot.longitude, plot.latitude])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [plots, mapLoaded, hoveredId, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch map style (streets ↔ satellite)
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.map.setStyle(MAP_STYLES[mapStyle]);
  }, [mapStyle]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
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
      <div ref={containerRef} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
          <MapPin className="w-8 h-8 text-gray-400 animate-bounce mb-2" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      )}

      {/* Streets / Satellite toggle */}
      <div className="absolute top-3 left-3 z-10 flex rounded-xl overflow-hidden shadow-md border border-gray-200">
        <button
          onClick={() => setMapStyle("streets")}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            mapStyle === "streets" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Map
        </button>
        <button
          onClick={() => setMapStyle("satellite")}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            mapStyle === "satellite" ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Satellite
        </button>
      </div>
    </div>
  );
}
