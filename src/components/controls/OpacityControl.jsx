import React from "react";

export default function OpacityControl({ opacity, setOpacity }) {
  return (
    <div className="absolute top-4 right-4 z-[1000] pointer-events-auto rounded-lg bg-white/90 shadow p-3 text-sm">
      <label className="block font-medium mb-1">
        Top layer opacity:{" "}
        <span className="tabular-nums">{Math.round(opacity * 100)}%</span>
      </label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={opacity}
        onChange={(e) => setOpacity(parseFloat(e.target.value))}
        className="w-48"
      />
      <div className="mt-2 text-xs text-slate-600">
        Bottom: OSM • Top: OpenTopoMap
      </div>
    </div>
  );
}
