/**
 * LayerSelectors.jsx — split-mode left/right selectors with category separator.
 */
import React from "react";

export default function LayerSelectors({
  leftLayer,
  rightLayer,
  onLeftChange,
  onRightChange,
  layers,
}) {
  // Separate modern and historic layers based on id prefix (or another property)
  const modernLayers = layers.filter((layer) => !layer.id.startsWith("nls-"));
  const historicLayers = layers.filter((layer) => layer.id.startsWith("nls-"));

  // Helper to render the grouped options
  const renderOptions = () => (
    <>
      {modernLayers.map((layer) => (
        <option key={layer.id} value={layer.id}>
          {layer.name}
        </option>
      ))}
      {historicLayers.length > 0 && (
        <>
          <option disabled>────────── Historic Maps ──────────</option>
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
    <>
      <div className="absolute top-4 left-4 z-[1000] pointer-events-auto bg-white/90 p-2 rounded shadow">
        <div className="mb-2 font-medium">Left Layer</div>
        <select
          value={leftLayer}
          onChange={(e) => onLeftChange(e.target.value)}
          className="w-56 p-1 rounded border border-slate-300"
        >
          {renderOptions()}
        </select>
      </div>

      <div className="absolute top-4 right-4 z-[1000] pointer-events-auto bg-white/90 p-2 rounded shadow">
        <div className="mb-2 font-medium">Right Layer</div>
        <select
          value={rightLayer}
          onChange={(e) => onRightChange(e.target.value)}
          className="w-56 p-1 rounded border border-slate-300"
        >
          {renderOptions()}
        </select>
      </div>
    </>
  );
}
