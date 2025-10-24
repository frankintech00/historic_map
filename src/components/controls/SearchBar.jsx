import React, { useEffect, useRef, useState } from "react";
import { dispatchSearchGoto } from "../../state/SearchBus";

/**
 * SearchBar
 * - Debounced Nominatim search (GB only)
 * - Closes dropdown after selecting a result
 * - Closes on outside click or Escape
 */
export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search (Nominatim, constrained to UK)
  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        // UK bounding box (approx) incl. NI:
        // west=-8.65, south=49.79, east=1.78, north=60.95
        const params = new URLSearchParams({
          q: query,
          format: "jsonv2",
          addressdetails: "1",
          "accept-language": "en-GB",
          countrycodes: "gb",
          viewbox: "-8.65,60.95,1.78,49.79",
          bounded: "1",
          limit: "8",
        });

        const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();

        const mapped = (data || []).map((r) => {
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lon);
          const label =
            r.display_name || r.name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          const zoom = inferZoom(r);
          return { lat, lng, label, zoom, raw: r };
        });

        setResults(mapped);
        setOpen(mapped.length > 0);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setResults([]);
          setOpen(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [q]);

  // Close on outside click and Escape
  useEffect(() => {
    function onDocClick(e) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function goto(item) {
    dispatchSearchGoto({
      lat: item.lat,
      lng: item.lng,
      label: item.label,
      zoom: item.zoom ?? 14,
    });
    // Immediately close and tidy the dropdown
    setOpen(false);
    setResults([]);
    inputRef.current?.blur();
  }

  return (
    <div className="relative" ref={boxRef}>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search UK places…"
        className="ss-input w-full"
        onFocus={() => {
          if (results.length) setOpen(true);
        }}
        aria-label="Search UK places"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          <ul className="divide-y divide-neutral-100">
            {results.map((r, idx) => (
              <li key={`${r.lat}-${r.lng}-${idx}`}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-ui-ring rounded-lg"
                  onClick={() => goto(r)}
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Infer a sensible zoom level from a Nominatim result */
function inferZoom(r) {
  const t = r.type || r.class || "";
  switch (t) {
    case "country":
    case "state":
    case "administrative":
      return 6;
    case "county":
    case "region":
    case "district":
      return 9;
    case "city":
      return 11;
    case "town":
      return 12;
    case "village":
    case "suburb":
    case "neighbourhood":
      return 13;
    case "postcode":
      return 14;
    case "road":
      return 16;
    case "house":
    case "building":
      return 18;
    default:
      return 14;
  }
}
