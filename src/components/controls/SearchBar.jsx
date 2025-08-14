import React, { useEffect, useRef, useState } from "react";
import { useSearchDispatch } from "../../state/SearchBus.jsx";

/**
 * SearchBar.jsx
 * - Debounced typeahead against Nominatim (UK bias)
 * - On select/submit, dispatches "search:goto" and cleanly closes the menu
 */
export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const dispatch = useSearchDispatch();

  const abortRef = useRef(null);
  const timerRef = useRef(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const suppressNextFetchRef = useRef(false);

  // Close helpers
  function closeMenu() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    setResults([]);
    setOpen(false);
    setActiveIdx(-1);
    // Blur the input to avoid re-open on focus/keyboard
    try {
      inputRef.current?.blur();
    } catch {}
  }

  // Click-away to close
  useEffect(() => {
    function onDocMouseDown(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) closeMenu();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Debounced fetch of suggestions (UK biased)
  useEffect(() => {
    // If we just selected an item, skip one fetch cycle
    if (suppressNextFetchRef.current) {
      suppressNextFetchRef.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    const query = q.trim();
    if (!query || query.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }

    // Only fetch while the input is focused
    if (document.activeElement !== inputRef.current) return;

    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", query);
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "7");
        url.searchParams.set("countrycodes", "gb");
        url.searchParams.set("accept-language", "en-GB");

        const res = await fetch(url.toString(), {
          headers: {
            "User-Agent": "HistoricMapApp/1.0 (https://example.org)",
            Accept: "application/json",
          },
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const mapped = (data || []).map((d) => ({
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          label: d.display_name,
          category: d.category,
          type: d.type,
        }));
        setResults(mapped);
        setOpen(mapped.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [q]);

  function submitSelection(item) {
    if (!item) return;

    // Prevent the next effect cycle from refetching/reopening
    suppressNextFetchRef.current = true;

    dispatch({
      type: "search:goto",
      payload: { lat: item.lat, lng: item.lng, label: item.label, zoom: 16 },
    });

    // Keep the label in the input, then close dropdown
    setQ(item.label);
    closeMenu();
  }

  function onSubmit(e) {
    e.preventDefault();
    if (results.length > 0) {
      const idx = activeIdx >= 0 ? activeIdx : 0;
      submitSelection(results[idx]);
    } else {
      setOpen(false);
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
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <form onSubmit={onSubmit} className="w-full">
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
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search UK places, postcodes, landmarks…"
            className="w-full outline-none placeholder-gray-400 text-sm"
            aria-label="Search locations"
          />
          <button
            type="submit"
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
          >
            {loading ? "…" : "Search"}
          </button>
        </div>
      </form>

      {open && results.length > 0 && (
        <ul className="absolute z-[1200] mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {results.map((item, idx) => (
            <li
              key={`${item.lat},${item.lng},${idx}`}
              onMouseDown={(e) => {
                // Use mousedown so the input doesn’t blur before we handle click
                e.preventDefault();
                submitSelection(item);
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
