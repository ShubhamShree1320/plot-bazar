"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2 } from "lucide-react";

interface Suggestion {
  type: string;
  label: string;
  value: { state?: string; city?: string; locality?: string };
}

interface SearchBarProps {
  large?: boolean;
  defaultValue?: string;
}

export default function SearchBar({ large = false, defaultValue = "" }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInput(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.data.suggestions);
          setShowDropdown(true);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(suggestion: Suggestion) {
    setQuery(suggestion.label);
    setShowDropdown(false);

    const params = new URLSearchParams();
    if (suggestion.value.state) params.set("state", suggestion.value.state);
    if (suggestion.value.city) params.set("city", suggestion.value.city);
    if (suggestion.value.locality) params.set("locality", suggestion.value.locality);

    router.push(`/search?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setShowDropdown(false);
  }

  const inputClass = large
    ? "w-full text-lg pl-14 pr-32 py-5 rounded-2xl border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
    : "w-full pl-10 pr-24 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400";

  const iconClass = large ? "w-6 h-6 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2" : "w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2";

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className={iconClass} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Search by city, state, or locality..."
          className={inputClass}
        />
        {loading && (
          <Loader2 className={`absolute ${large ? "right-36 top-1/2 -translate-y-1/2 w-5 h-5" : "right-28 top-1/2 -translate-y-1/2 w-4 h-4"} animate-spin text-gray-400`} />
        )}
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors
            ${large ? "px-6 py-3 text-base" : "px-4 py-2 text-sm"}`}
        >
          Search
        </button>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left transition-colors"
            >
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-400 capitalize">{s.type}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
