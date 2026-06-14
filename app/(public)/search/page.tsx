"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PlotCard from "@/components/plots/PlotCard";
import SearchBar from "@/components/ui/SearchBar";
import { List, Map, SlidersHorizontal, X } from "lucide-react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false });

interface Plot {
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

function SearchResults() {
  const searchParams = useSearchParams();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const state = searchParams.get("state") || "";
  const city = searchParams.get("city") || "";
  const locality = searchParams.get("locality") || "";
  const q = searchParams.get("q") || "";

  useEffect(() => {
    async function fetchPlots() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), sortBy });
        if (state) params.set("state", state);
        if (city) params.set("city", city);
        if (locality) params.set("locality", locality);
        if (q) params.set("q", q);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        if (minArea) params.set("minArea", minArea);
        if (maxArea) params.set("maxArea", maxArea);

        const res = await fetch(`/api/plots?${params}`);
        const data = await res.json();
        if (data.success) {
          setPlots(data.data.plots);
          setTotal(data.data.total);
          setTotalPages(data.data.totalPages);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPlots();
  }, [state, city, locality, q, page, sortBy, minPrice, maxPrice, minArea, maxArea]);

  const searchLabel = city || state || locality || q || "All Plots";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <SearchBar defaultValue={q || city || state} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Plots in {searchLabel}</h1>
          <p className="text-sm text-gray-500">{total.toLocaleString()} listings found</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 border border-gray-200 rounded-xl px-3 py-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <div className="flex border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-sm ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("map")}
              className={`px-3 py-2 text-sm ${viewMode === "map" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Min Price (₹)</label>
            <input type="number" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Max Price (₹)</label>
            <input type="number" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="Any" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Min Area</label>
            <input type="number" value={minArea} onChange={(e) => { setMinArea(e.target.value); setPage(1); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Max Area</label>
            <input type="number" value={maxArea} onChange={(e) => { setMaxArea(e.target.value); setPage(1); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="Any" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Sort By</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
          <button onClick={() => { setMinPrice(""); setMaxPrice(""); setMinArea(""); setMaxArea(""); setSortBy("newest"); setPage(1); }}
            className="col-span-2 md:col-span-5 flex items-center justify-center gap-1 text-xs text-red-500 hover:text-red-600">
            <X className="w-3 h-3" /> Clear Filters
          </button>
        </div>
      )}

      {viewMode === "list" ? (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-gray-100 animate-pulse">
                  <div className="h-52 bg-gray-200 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : plots.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">No plots found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {plots.map((plot) => (
                <PlotCard
                  key={plot.id}
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
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:border-blue-300">
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:border-blue-300">
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex gap-4 h-[70vh]">
          <div className="flex-1 rounded-xl overflow-hidden border border-gray-200">
            <MapView
              plots={plots.filter(p => p.latitude && p.longitude).map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                latitude: p.latitude!,
                longitude: p.longitude!,
                city: p.city,
                imageUrl: p.images[0]?.imageUrl,
              }))}
              onPlotHover={setHoveredId}
              hoveredId={hoveredId}
            />
          </div>
          <div className="w-80 overflow-y-auto space-y-3">
            {plots.map(plot => (
              <div key={plot.id} onMouseEnter={() => setHoveredId(plot.id)} onMouseLeave={() => setHoveredId(null)}
                className={`transition-shadow ${hoveredId === plot.id ? "ring-2 ring-blue-500 rounded-2xl" : ""}`}>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
