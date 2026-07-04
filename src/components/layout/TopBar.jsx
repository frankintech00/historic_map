import React from "react";
import { Compass, Layers, Square, Columns2 } from "lucide-react";
import SearchBar from "../controls/SearchBar.jsx";

/**
 * TopBar — floating chrome across the top of the map.
 * Brand · Search · Single/Compare toggle · Layers panel toggle
 */
export default function TopBar({ mode, onModeChange, panelOpen, onTogglePanel }) {
  return (
    <header className="pointer-events-none absolute inset-x-3 top-3 z-[1050] flex items-start gap-2">
      {/* Brand */}
      <div className="hm-surface pointer-events-auto hidden h-11 shrink-0 items-center gap-2.5 px-3.5 lg:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bronze-600 text-white">
          <Compass className="h-4.5 w-4.5" size={18} aria-hidden />
        </span>
        <div className="leading-none">
          <div className="font-display text-[15px] font-semibold tracking-tight text-stone-900">
            Historic Maps
          </div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
            United Kingdom
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="pointer-events-auto min-w-0 flex-1 sm:max-w-md">
        <SearchBar />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {/* Mode toggle */}
        <div className="hm-surface pointer-events-auto flex h-11 items-center px-1.5">
          <div className="hm-seg" role="group" aria-label="View mode">
            <button
              type="button"
              className="hm-seg-btn"
              aria-pressed={mode === "single"}
              onClick={() => onModeChange("single")}
              title="Single map with overlay"
            >
              <Square size={15} aria-hidden />
              <span className="hidden sm:inline">Single</span>
            </button>
            <button
              type="button"
              className="hm-seg-btn"
              aria-pressed={mode === "split"}
              onClick={() => onModeChange("split")}
              title="Side-by-side comparison"
            >
              <Columns2 size={15} aria-hidden />
              <span className="hidden sm:inline">Compare</span>
            </button>
          </div>
        </div>

        {/* Layers panel toggle */}
        <button
          type="button"
          onClick={onTogglePanel}
          aria-pressed={panelOpen}
          aria-label={panelOpen ? "Hide layers panel" : "Show layers panel"}
          title="Map layers"
          className={`hm-surface pointer-events-auto flex h-11 w-11 items-center justify-center transition-colors ${
            panelOpen
              ? "!bg-bronze-600 text-white hover:!bg-bronze-700"
              : "text-stone-700 hover:bg-white"
          }`}
        >
          <Layers size={18} aria-hidden />
        </button>
      </div>
    </header>
  );
}
