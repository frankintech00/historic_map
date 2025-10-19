import React, { useMemo } from "react";
import { BASE_LAYERS } from "../../config/mapSources";

/**
 * LayerOpacityPanel
 * - Lets the user choose bottom and top layers (from BASE_LAYERS)
 * - Adds a visual delimiter between modern and historic layers
 * - Adjusts the opacity of the top layer only
 * - Renders as a compact panel on the top-left
 *
 * Functionality unchanged — only the position moved from right to left.
 */
export default function LayerOpacityPanel({
  topLayer,
  setTopLayer,
  bottomLayer,
  setBottomLayer,
  opacity,
  setOpacity,
}) {
  // Categorise layers once per render; prefix "nls-" marks historic.
  const { modernLayers, historicLayers } = useMemo(() => {
    const modern = [];
    const historic = [];
    for (const l of BASE_LAYERS) {
      (l.id?.startsWith("nls-") ? historic : modern).push(l);
    }
    return { modernLayers: modern, historicLayers: historic };
  }, []);

  const renderOptions = () => (
    <>
      {modernLayers.map((layer) => (
        <option key={layer.id} value={layer.id}>
          {layer.name}
        </option>
      ))}

      {historicLayers.length > 0 && (
        <>
          <option disabled value="__sep_historic__">
            ────────── Historic Maps ──────────
          </option>
          {historicLayers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </>
      )}
    </>
  );

  return (
    <div className="absolute top-4 left-4 z-[1000] pointer-events-auto bg-white/90 shadow rounded-lg p-4 text-sm space-y-4 w-60">
      {/* Bottom Layer */}
      <div>
        <label className="block font-medium mb-1" htmlFor="lop-bottom-select">
          Bottom Layer
        </label>
        <select
          id="lop-bottom-select"
          aria-label="Bottom map layer"
          value={bottomLayer}
          onChange={(e) => setBottomLayer(e.target.value)}
          className="w-full p-1 rounded border border-slate-300"
        >
          {renderOptions()}
        </select>
      </div>

      {/* Top Layer */}
      <div>
        <label className="block font-medium mb-1" htmlFor="lop-top-select">
          Top Layer
        </label>
        <select
          id="lop-top-select"
          aria-label="Top map layer"
          value={topLayer}
          onChange={(e) => setTopLayer(e.target.value)}
          className="w-full p-1 rounded border border-slate-300"
        >
          {renderOptions()}
        </select>
      </div>

      {/* Opacity */}
      <div>
        <label className="block font-medium mb-1" htmlFor="lop-opacity">
          Top Layer Opacity:{" "}
          <span className="tabular-nums">{Math.round(opacity * 100)}%</span>
        </label>
        <input
          id="lop-opacity"
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
