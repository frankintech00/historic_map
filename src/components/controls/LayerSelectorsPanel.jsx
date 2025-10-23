/**
 * LayerSelectorsPanel.jsx
 * Pop-out friendly stacked selectors for choosing map layers.
 *
 * Usage:
 *  <LayerSelectorsPanel
 *     a={{ label: "Left layer", value: leftId, onChange: setLeft }}
 *     b={{ label: "Right layer", value: rightId, onChange: setRight }}
 *     layers={BASE_LAYERS}
 *  />
 *
 * - Groups options into Modern / Historic via id prefix 'nls-'
 * - Uses <optgroup> for clarity and matches Leaflet UI feel
 */
import React from "react";
import { BASE_LAYERS } from "../../config/mapSources";

export default function LayerSelectorsPanel({ a, b, layers = BASE_LAYERS }) {
  const modern = layers.filter((l) => !l.id.startsWith("nls-"));
  const historic = layers.filter((l) => l.id.startsWith("nls-"));

  const renderOptions = () => (
    <>
      {modern.length > 0 && (
        <optgroup label="Modern">
          {modern.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </optgroup>
      )}
      {historic.length > 0 && (
        <optgroup label="Historic">
          {historic.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-sm font-medium text-gray-800">
          {a?.label ?? "Layer A"}
        </div>
        <select
          value={a?.value}
          onChange={(e) => a?.onChange && a.onChange(e.target.value)}
          className="w-full p-2 rounded border border-slate-300 bg-white"
        >
          {renderOptions()}
        </select>
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-gray-800">
          {b?.label ?? "Layer B"}
        </div>
        <select
          value={b?.value}
          onChange={(e) => b?.onChange && b.onChange(e.target.value)}
          className="w-full p-2 rounded border border-slate-300 bg-white"
        >
          {renderOptions()}
        </select>
      </div>
    </div>
  );
}
