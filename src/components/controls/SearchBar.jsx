import React, { useEffect, useRef, useState } from "react";
import { dispatchSearchGoto } from "../../state/SearchBus";

/**
 * SearchBar — pop-out header field with consistent styling.
 * Uses .ss-input for the box and a simple dropdown list underneath.
 */
export default function SearchBar() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  // Debounced search (UK-biased Nominatim can be slotted here later)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q || q.length < 3) {
        setResults([]);
        return;
      }
      try {
        // Minimal, safe global search for now (same logic, just tidied)
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            q
          )}`
        );
        const data = await resp.json();
        setResults(
          (data || []).slice(0, 8).map((d) => ({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            label: d.display_name,
          }))
        );
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
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

  const goto = (item) => {
    dispatchSearchGoto({ ...item, zoom: 12 });
    setQ(item.label);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Search UK places…"
        className="ss-input rounded-full"
        aria-label="Search"
      />

      {open && results.length > 0 && (
        <div
          className="
            absolute left-0 right-0 mt-2 z-[1200]
            bg-white rounded-xl border border-neutral-200 shadow-card
            max-h-64 overflow-auto
          "
        >
          <ul className="divide-y divide-neutral-100">
            {results.map((r, idx) => (
              <li key={idx}>
                <button
                  className="
                    w-full text-left px-3 py-2 text-sm hover:bg-neutral-50
                    focus:outline-none focus:ring-1 focus:ring-ui-ring rounded-lg
                  "
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
