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
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search (Nominatim, constrained to UK)
  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    // Skip very short queries (less than 2 chars) to avoid too many results
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const apiKey = import.meta.env.VITE_MAPTILER_KEY;
        if (!apiKey) {
          console.error("[SearchBar] Missing VITE_MAPTILER_KEY");
          throw new Error("MapTiler API key not configured");
        }

        // MapTiler Geocoding API - better CORS support, reliable, and you already have a key!
        const params = new URLSearchParams({
          key: apiKey,
          q: query,
          limit: "10",
          language: "en",
          country: "gb", // Limit to UK
          fuzzyMatch: "true",
          autocomplete: "true",
        });

        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params.toString()}`;
        console.log("[SearchBar] Searching:", query);

        const res = await fetch(url, { signal: controller.signal });

        if (!res.ok) {
          console.error("[SearchBar] HTTP error:", res.status, res.statusText);
          throw new Error(`Search failed: ${res.status}`);
        }

        const data = await res.json();
        const features = data.features || [];
        console.log("[SearchBar] Results:", features.length, "items");

        const mapped = features.map((f) => {
          const [lng, lat] = f.geometry.coordinates;
          const label = f.place_name || f.text || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          const zoom = inferZoomFromBbox(f.bbox) || inferZoomFromPlaceType(f.place_type);
          return {
            lat,
            lng,
            label,
            zoom,
            raw: { type: f.place_type?.[0], class: f.properties?.category },
          };
        });

        if (mapped.length === 0) {
          console.log("[SearchBar] No results for:", query);
        }

        setResults(mapped);
        setOpen(true); // Always show dropdown when search completes (even if empty)
        setLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[SearchBar] Search error:", err);
          setResults([]);
          setOpen(false);
          setLoading(false);
        }
      }
    }, 500); // Increased to 500ms to respect Nominatim rate limits (1 req/sec)

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
      <div className="relative">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search UK places…"
          className="ss-input w-full pr-10"
          onFocus={() => {
            if (results.length) setOpen(true);
          }}
          aria-label="Search UK places"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-ui-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      {open && (
        <div className="absolute left-0 right-0 mt-2 max-h-64 overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg z-10">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((r, idx) => (
                <li key={`${r.lat}-${r.lng}-${idx}`}>
                  <button
                    type="button"
                    className="ss-result-item"
                    onClick={() => goto(r)}
                  >
                    <div className="ss-result-label">{r.label}</div>
                    <div className="ss-result-type">{getResultType(r.raw)}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !loading && (
              <div className="px-4 py-3 text-sm text-ui-sub text-center">
                No results found
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/** Get a friendly label for the result type */
function getResultType(raw) {
  const t = raw?.type || raw?.class || "";
  const typeLabels = {
    // Administrative (MapTiler place_type)
    country: "Country",
    region: "Region",
    state: "State/Region",
    county: "County",
    district: "District",
    municipality: "City",
    city: "City",
    town: "Town",
    village: "Village",
    hamlet: "Hamlet",
    suburb: "Suburb",
    neighbourhood: "Neighbourhood",
    locality: "Locality",
    quarter: "Quarter",

    // Places
    island: "Island",

    // Addresses & Streets
    postcode: "Postcode",
    street: "Street",
    address: "Address",
    road: "Street",
    pedestrian: "Pedestrian Way",
    footway: "Footpath",
    house: "Address",
    building: "Building",

    // Points of Interest
    poi: "Point of Interest",
    tourism: "Tourist Attraction",
    historic: "Historic Site",
    amenity: "Amenity",
    railway: "Railway Station",
    aeroway: "Airport",
    natural: "Natural Feature",
    waterway: "Waterway",
    landuse: "Area",
  };
  return typeLabels[t] || "Place";
}

/** Infer zoom from MapTiler bounding box */
function inferZoomFromBbox(bbox) {
  if (!bbox || bbox.length !== 4) return null;
  const [west, south, east, north] = bbox;
  const width = east - west;
  const height = north - south;
  const maxDim = Math.max(width, height);

  // Approximate zoom levels based on bbox size
  if (maxDim > 10) return 6; // Country/region
  if (maxDim > 2) return 9; // County
  if (maxDim > 0.5) return 11; // City
  if (maxDim > 0.1) return 13; // Town/suburb
  if (maxDim > 0.01) return 15; // Village/street
  return 17; // Address/building
}

/** Infer zoom from MapTiler place type */
function inferZoomFromPlaceType(placeTypes) {
  if (!placeTypes || !placeTypes.length) return 14;
  const t = placeTypes[0]; // Primary type

  switch (t) {
    case "country":
      return 6;
    case "region":
    case "state":
      return 8;
    case "county":
    case "district":
      return 10;
    case "municipality":
    case "city":
      return 11;
    case "town":
      return 12;
    case "village":
    case "suburb":
    case "neighbourhood":
    case "locality":
      return 13;
    case "postcode":
      return 14;
    case "street":
    case "address":
      return 16;
    case "poi":
      return 17;
    default:
      return 14;
  }
}
