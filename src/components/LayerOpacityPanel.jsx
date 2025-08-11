import React from "react";
import { BASE_LAYERS } from "../config/mapSources.js";

/**
 * LayerOpacityPanel
 * - Lets the user choose bottom and top layers (from BASE_LAYERS)
 * - Adjusts the opacity of the top layer only
 * - Renders as a compact panel on the top-right
 */
export default function LayerOpacityPanel({
  topLayer,
  setTopLayer,
  bottomLayer,
  setBottomLayer,
  opacity,
  setOpacity,
}) {
  return (
    <div className="absolute top-4 right-4 z-[1000] pointer-events-auto bg-white/90 shadow rounded-lg p-4 text-sm space-y-4 w-60">
      {/* Bottom Layer */}
      <div>
        <label className="block font-medium mb-1">Bottom Layer</label>
        <select
          value={bottomLayer}
          onChange={(e) => setBottomLayer(e.target.value)}
          className="w-full p-1 rounded border border-slate-300"
        >
          {BASE_LAYERS.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Top Layer */}
      <div>
        <label className="block font-medium mb-1">Top Layer</label>
        <select
          value={topLayer}
          onChange={(e) => setTopLayer(e.target.value)}
          className="w-full p-1 rounded border border-slate-300"
        >
          {BASE_LAYERS.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </div>

      {/* Opacity */}
      <div>
        <label className="block font-medium mb-1">
          Top Layer Opacity:{" "}
          <span className="tabular-nums">{Math.round(opacity * 100)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={opacity}
          onChange={(e) => setOpacity(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
