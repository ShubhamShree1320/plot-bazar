"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Search, X, SlidersHorizontal, MapPin } from "lucide-react";
import PlotCard from "@/components/plots/PlotCard";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

interface MapPlot {
  id: string;
  title: string;
  price: number;
  latitude: number;
  longitude: number;
  city: string;
  imageUrl?: string | null;
}

interface ListPlot {
  id: string;
  title: string;
  price: number;
  area: number;
  areaUnit: string;
  city: string;
  state: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  tokenAmount: number | null;
  images: { imageUrl: string }[];
}

export default function ExploreMapClient() {
  const [mapMarkers, setMapMarkers] = useState<MapPlot[]>([]);
  const [listPlots, setListPlots] = useState<ListPlot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [cityQuery, setCityQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (cityQuery) p.set("city", cityQuery);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    if (minArea) p.set("minArea", minArea);
    if (maxArea) p.set("maxArea", maxArea);
    return p;
  }, [cityQuery, minPrice, maxPrice, minArea, maxArea]);

  useEffect(() => {
    const params = buildParams();
    fetch(`/api/plots/map?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setMapMarkers(d.data); });
  }, [buildParams]);

  useEffect(() => {
    setLoading(true);
    const params = buildParams();
    params.set("page", String(page));
    params.set("sortBy", sortBy);
    params.set("limit", "10");
    fetch(`/api/plots?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setListPlots(d.data.plots);
          setTotal(d.data.total);
          setTotalPages(d.data.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }, [buildParams, page, sortBy]);

  useEffect(() => {
    if (!selectedId) return;
    const card = cardRefs.current[selectedId];
    const sidebar = sidebarRef.current;
    if (card && sidebar) {
      sidebar.scrollTo({ top: card.offsetTop - 12, behavior: "smooth" });
    }
  }, [selectedId]);

  function clearFilters() {
    setCityQuery("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setSortBy("newest");
    setPage(1);
  }

  const hasFilters = cityQuery || minPrice || maxPrice || minArea || maxArea;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Filter bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0 shadow-sm">
        <div className="relative min-w-56 flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => { setCityQuery(e.target.value); setPage(1); }}
            placeholder="Search by city across India"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
            placeholder="Min ₹"
            className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
            placeholder="Max ₹"
            className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>

        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors ${
            showFilters || minArea || maxArea
              ? "bg-blue-50 border-blue-300 text-blue-700"
              : "border-gray-200 text-gray-600 hover:border-blue-200"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Area
        </button>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}

        <span className="ml-auto text-sm text-gray-500 font-medium shrink-0">
          {total.toLocaleString()} results
        </span>
      </div>

      {/* Area filter expansion */}
      {showFilters && (
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-4 shrink-0">
          <span className="text-xs font-medium text-gray-500">Area range:</span>
          <input
            type="number"
            value={minArea}
            onChange={(e) => { setMinArea(e.target.value); setPage(1); }}
            placeholder="Min area"
            className="w-28 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <span className="text-gray-400 text-sm">–</span>
          <input
            type="number"
            value={maxArea}
            onChange={(e) => { setMaxArea(e.target.value); setPage(1); }}
            placeholder="Max area"
            className="w-28 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      )}

      {/* Map + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            plots={mapMarkers.filter(
              (p): p is MapPlot & { latitude: number; longitude: number } =>
                p.latitude != null && p.longitude != null
            )}
            center={[20.5937, 78.9629]}
            zoom={5}
            onPlotHover={setHoveredId}
            onPlotClick={setSelectedId}
            hoveredId={hoveredId}
            selectedId={selectedId}
          />
          <div className="absolute bottom-5 left-3 bg-white/90 backdrop-blur-sm rounded-xl shadow px-3 py-1.5 text-xs font-medium text-gray-600 flex items-center gap-1.5 z-[1000]">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            {mapMarkers.length} plots on map
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-96 flex flex-col border-l border-gray-200 bg-gray-50 shrink-0">
          <div ref={sidebarRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl animate-pulse">
                  <div className="h-36 bg-gray-200 rounded-t-xl" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded-lg mt-2" />
                  </div>
                </div>
              ))
            ) : listPlots.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No plots found</p>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              listPlots.map((plot) => (
                <div
                  key={plot.id}
                  ref={(el) => { cardRefs.current[plot.id] = el; }}
                  onMouseEnter={() => setHoveredId(plot.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`rounded-2xl transition-all ${
                    selectedId === plot.id
                      ? "ring-2 ring-amber-400 shadow-lg"
                      : hoveredId === plot.id
                      ? "ring-2 ring-blue-500"
                      : ""
                  }`}
                >
                  <PlotCard
                    id={plot.id}
                    title={plot.title}
                    price={plot.price}
                    area={plot.area}
                    areaUnit={plot.areaUnit}
                    city={plot.city}
                    state={plot.state}
                    status={plot.status}
                    imageUrl={plot.images[0]?.imageUrl}
                    tokenAmount={plot.tokenAmount}
                  />
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="border-t border-gray-200 bg-white px-4 py-3 flex items-center justify-between shrink-0">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-blue-300 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:border-blue-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
