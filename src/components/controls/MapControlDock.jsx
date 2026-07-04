import React from "react";
import { Plus, Minus, LocateFixed, House, Loader2 } from "lucide-react";

/**
 * MapControlDock — floating map controls, bottom-left.
 * Zoom in/out, locate me, reset to home view.
 */
export default function MapControlDock({
  onZoomIn,
  onZoomOut,
  canZoomIn = true,
  canZoomOut = true,
  onLocate,
  locating = false,
  onHome,
}) {
  return (
    <div className="absolute bottom-6 left-3 z-[1050] flex flex-col gap-2">
      {/* Zoom */}
      <div className="hm-surface flex flex-col overflow-hidden">
        <button
          type="button"
          className="hm-icon-btn"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus size={18} />
        </button>
        <div className="mx-2 h-px bg-stone-200" aria-hidden />
        <button
          type="button"
          className="hm-icon-btn"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus size={18} />
        </button>
      </div>

      {/* Locate + home */}
      <div className="hm-surface flex flex-col overflow-hidden">
        <button
          type="button"
          className="hm-icon-btn"
          onClick={onLocate}
          title="Find my location"
          aria-label="Find my location"
        >
          {locating ? (
            <Loader2 size={17} className="animate-spin text-bronze-600" />
          ) : (
            <LocateFixed size={17} />
          )}
        </button>
        <div className="mx-2 h-px bg-stone-200" aria-hidden />
        <button
          type="button"
          className="hm-icon-btn"
          onClick={onHome}
          title="Reset view"
          aria-label="Reset view"
        >
          <House size={17} />
        </button>
      </div>
    </div>
  );
}
