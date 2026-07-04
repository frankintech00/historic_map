import React, { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, MapPin } from "lucide-react";
import { dispatchSearchGoto } from "../../state/SearchBus";

/**
 * SearchBar
 * - Debounced MapTiler geocoding (GB only)
 * - Direct "lat, lng" coordinate entry
 * - Full keyboard navigation (arrows / Enter / Escape)
 */
export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Debounced geocoding search
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    // Direct coordinate entry short-circuits the API
    const coord = parseCoordinates(query);
    if (coord) {
      setResults([coord]);
      setActiveIndex(0);
      setOpen(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const apiKey = import.meta.env.VITE_MAPTILER_KEY;
        if (!apiKey) throw new Error("MapTiler API key not configured");

        const params = new URLSearchParams({
          key: apiKey,
          limit: "8",
          language: "en",
          country: "gb",
          fuzzyMatch: "true",
          autocomplete: "true",
        });
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
          query
        )}.json?${params.toString()}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);

        const data = await res.json();
        const mapped = (data.features || []).map((f) => {
          const [lng, lat] = f.geometry.coordinates;
          return {
            lat,
            lng,
            label:
              f.place_name || f.text || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            zoom:
              inferZoomFromBbox(f.bbox) || inferZoomFromPlaceType(f.place_type),
            type: getResultType(f.place_type?.[0] || f.properties?.category),
          };
        });

        setResults(mapped);
        setActiveIndex(mapped.length ? 0 : -1);
        setOpen(true);
        setLoading(false);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[SearchBar]", err);
          setResults([]);
          setOpen(false);
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [q]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Keep the active option scrolled into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    listRef.current
      .querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function goto(item) {
    dispatchSearchGoto({
      lat: item.lat,
      lng: item.lng,
      label: item.label,
      zoom: item.zoom ?? 14,
    });
    setOpen(false);
    setResults([]);
    inputRef.current?.blur();
  }

  function clear() {
    setQ("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[activeIndex] ?? results[0];
      if (item) goto(item);
    }
  }

  return (
    <div className="relative min-w-0 w-full" ref={boxRef}>
      <div className="hm-surface flex h-11 min-w-0 items-center gap-2 px-3">
        <Search className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search places, postcodes or coordinates…"
          aria-label="Search UK places"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          size={1}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
        />
        {loading && (
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-bronze-600"
            aria-hidden
          />
        )}
        {q && !loading && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="hm-surface absolute left-0 right-0 top-[calc(100%+6px)] overflow-hidden">
          {results.length > 0 ? (
            <ul
              ref={listRef}
              role="listbox"
              className="hm-scroll max-h-72 overflow-y-auto py-1"
            >
              {results.map((r, idx) => (
                <li key={`${r.lat}-${r.lng}-${idx}`} role="option" aria-selected={idx === activeIndex}>
                  <button
                    type="button"
                    data-index={idx}
                    onClick={() => goto(r)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      idx === activeIndex ? "bg-bronze-50" : ""
                    }`}
                  >
                    <MapPin
                      className={`h-4 w-4 shrink-0 ${
                        idx === activeIndex
                          ? "text-bronze-600"
                          : "text-stone-300"
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
                      {r.label}
                    </span>
                    <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
                      {r.type}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            !loading && (
              <div className="px-4 py-4 text-center text-sm text-stone-500">
                No results found
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

/** Recognise "lat, lng" input and return a synthetic result. */
function parseCoordinates(query) {
  const m = query.match(/^(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return {
    lat,
    lng,
    label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    zoom: 15,
    type: "Coordinates",
  };
}

/** Get a friendly label for the result type */
function getResultType(t) {
  const typeLabels = {
    country: "Country",
    region: "Region",
    state: "Region",
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
    island: "Island",
    postcode: "Postcode",
    street: "Street",
    address: "Address",
    road: "Street",
    pedestrian: "Pedestrian Way",
    footway: "Footpath",
    house: "Address",
    building: "Building",
    poi: "Place",
    tourism: "Attraction",
    historic: "Historic Site",
    amenity: "Amenity",
    railway: "Station",
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
  const maxDim = Math.max(east - west, north - south);
  if (maxDim > 10) return 6;
  if (maxDim > 2) return 9;
  if (maxDim > 0.5) return 11;
  if (maxDim > 0.1) return 13;
  if (maxDim > 0.01) return 15;
  return 17;
}

/** Infer zoom from MapTiler place type */
function inferZoomFromPlaceType(placeTypes) {
  if (!placeTypes || !placeTypes.length) return 14;
  switch (placeTypes[0]) {
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
