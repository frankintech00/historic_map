import React, { useEffect, useRef, useState } from "react";
import { dispatchSearchGoto } from "../../state/SearchBus";

/**
 * Transparent, centred search box with Nominatim fallback.
 */
export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q || q.length < 3) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}`
        );
        const data = await res.json();
        setResults(
          (data || []).slice(0, 8).map((d) => ({
            label: d.display_name,
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
          }))
        );
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const go = (item) => {
    dispatchSearchGoto({
      lat: item.lat,
      lng: item.lng,
      label: item.label,
      zoom: 13,
    });
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Search places…"
        className="
          w-full rounded-full border border-gray-200
          bg-white/70 backdrop-blur-md
          px-5 py-2 shadow-md
          focus:outline-none focus:ring-2 focus:ring-blue-500
          placeholder-gray-500
        "
      />
      {open && results.length > 0 && (
        <div
          className="
            absolute left-0 right-0 mt-1 bg-white/70 border border-gray-200
            rounded-lg shadow-lg max-h-80 overflow-auto z-[1200]
          "
        >
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
              onClick={() => go(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
