import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchDispatch } from "../../state/SearchBus.jsx";

/**
 * SearchBar
 * - Debounced typeahead (Nominatim by default; MapTiler if key present)
 * - Emits search:goto on select/submit
 * - Closes dropdown deterministically on selection
 */

const DEBOUNCE_MS = 250;
const MIN_CHARS = 3;
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [focused, setFocused] = useState(false);

  const dispatch = useSearchDispatch();

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const skipNextRefetchRef = useRef(false);

  // Click-away to close (capture so it runs before other handlers, but doesn't block React)
  useEffect(() => {
    const onDocDown = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) closeMenu();
    };
    document.addEventListener("mousedown", onDocDown, true);
    return () => document.removeEventListener("mousedown", onDocDown, true);
  }, []);

  const provider = useMemo(() => (MAPTILER_KEY ? "maptiler" : "nominatim"), []);
  const requestUrl = useMemo(() => {
    const query = q.trim();
    if (!query || query.length < MIN_CHARS) return null;

    if (provider === "maptiler") {
      const url = new URL(
        "https://api.maptiler.com/geocoding/" +
          encodeURIComponent(query) +
          ".json"
      );
      url.searchParams.set("key", MAPTILER_KEY);
      url.searchParams.set("language", "en");
      url.searchParams.set("limit", "7");
      url.searchParams.set("country", "gb");
      return url.toString();
    } else {
      const url = new URL("https://nominatim.openstreetmap.org/search");
      url.searchParams.set("q", query);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("limit", "7");
      url.searchParams.set("countrycodes", "gb");
      url.searchParams.set("accept-language", "en-GB");
      return url.toString();
    }
  }, [q, provider]);

  // Debounced fetch
  useEffect(() => {
    if (!focused) return;
    if (!requestUrl) {
      setResults([]);
      setOpen(false);
      setActiveIdx(-1);
      return;
    }
    if (skipNextRefetchRef.current) {
      skipNextRefetchRef.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(requestUrl, {
          headers: { Accept: "application/json" },
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        let mapped = [];
        if (provider === "maptiler") {
          mapped = (data?.features || []).map((f) => ({
            lat: f.geometry?.coordinates?.[1],
            lng: f.geometry?.coordinates?.[0],
            label: f.place_name || f.text || "",
            category: f.properties?.type || f.properties?.class || "",
            type: f.properties?.type || "",
          }));
        } else {
          mapped = (data || []).map((d) => ({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            label: d.display_name,
            category: d.category,
            type: d.type,
          }));
        }

        setResults(mapped);
        setOpen(mapped.length > 0);
        setActiveIdx(mapped.length ? 0 : -1);
      } catch {
        setResults([]);
        setOpen(false);
        setActiveIdx(-1);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
      }
    };
  }, [requestUrl, focused, provider]);

  function closeMenu() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    setOpen(false);
    setResults([]); // hard close
    setActiveIdx(-1);
  }

  function dispatchGoto(item) {
    dispatch({
      type: "search:goto",
      payload: { lat: item.lat, lng: item.lng, label: item.label, zoom: 16 },
    });
  }

  function submitSelection(item) {
    if (!item) return;
    skipNextRefetchRef.current = true;
    dispatchGoto(item);
    setQ(item.label);
    closeMenu();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onSubmit(e) {
    e.preventDefault();
    if (results.length > 0) {
      const idx = activeIdx >= 0 ? activeIdx : 0;
      submitSelection(results[idx]);
    } else {
      closeMenu();
    }
  }

  function onKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      submitSelection(results[activeIdx >= 0 ? activeIdx : 0]);
    } else if (e.key === "Escape") {
      closeMenu();
    }
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full"
      role="search"
      aria-label="Location search"
    >
      <form onSubmit={onSubmit} className="w-full" role="searchbox">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-md focus-within:ring-2 focus-within:ring-black/10">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 opacity-60"
          >
            <path
              d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActiveIdx(-1);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => {
              setFocused(true);
              if (results.length > 0) setOpen(true);
            }}
            onBlur={() => {
              setFocused(false);
            }}
            placeholder="Search UK places, postcodes, landmarks…"
            className="w-full outline-none placeholder-gray-400 text-sm"
            aria-label="Search locations"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="search-suggestions"
            role="combobox"
          />

          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            aria-label="Search"
          >
            {loading ? "…" : "Search"}
          </button>
        </div>
      </form>

      {open && results.length > 0 && (
        <ul
          id="search-suggestions"
          ref={listRef}
          className="absolute z-[1200] mt-2 w-full max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {results.map((item, idx) => (
            <li
              key={`${item.lat},${item.lng},${idx}`}
              role="option"
              aria-selected={idx === activeIdx}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep input from blurring before we handle it
                submitSelection(item); // CLICKING A SUGGESTION WORKS
              }}
              className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-50 ${
                idx === activeIdx ? "bg-gray-50" : ""
              }`}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
