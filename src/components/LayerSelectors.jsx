/**
 * LayerSelectors.jsx — split-mode left/right selectors in one tidy component.
 */
import React from "react";

export default function LayerSelectors({
  leftLayer,
  rightLayer,
  onLeftChange,
  onRightChange,
  layers,
}) {
  return (
    <>
      <div className="absolute top-4 left-4 z-[1000] pointer-events-auto bg-white/90 p-2 rounded shadow">
        <div className="mb-2 font-medium">Left Layer</div>
        <select
          value={leftLayer}
          onChange={(e) => onLeftChange(e.target.value)}
          className="w-56 p-1 rounded border border-slate-300"
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </div>

      <div className="absolute top-4 right-4 z-[1000] pointer-events-auto bg-white/90 p-2 rounded shadow">
        <div className="mb-2 font-medium">Right Layer</div>
        <select
          value={rightLayer}
          onChange={(e) => onRightChange(e.target.value)}
          className="w-56 p-1 rounded border border-slate-300"
        >
          {layers.map((layer) => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
