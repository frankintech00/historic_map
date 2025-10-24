/**
 * LayerSelectorsPanel.jsx — mobile-first selectors for your array-based BASE_LAYERS.
 *
 * Props:
 *  - a: { label: string, value: string, onChange: (id)=>void }
 *  - b: same as a
 *  - layers?: Array<{ id: string, name: string, ... }>
 *
 * Notes:
 *  - Uses your BASE_LAYERS array by default (so callers don’t need to pass it).
 *  - Groups options by id prefix "nls-" → Historic, otherwise Modern.
 *  - Null-safe; if layers are missing, shows a disabled placeholder.
 */
import React from "react";
import BASE_LAYERS from "../../config/mapSources.js";

export default function LayerSelectorsPanel({ a, b, layers }) {
  const all = Array.isArray(layers)
    ? layers
    : Array.isArray(BASE_LAYERS)
    ? BASE_LAYERS
    : [];
  const { modern, historic } = groupLayers(all);

  const hasAny = modern.length > 0 || historic.length > 0;

  return (
    <div className="space-y-3">
      {/* A selector */}
      <div className="ss-title">{a?.label ?? "Top layer"}</div>
      <select
        className="ss-input"
        value={a?.value ?? ""}
        onChange={(e) => a?.onChange?.(e.target.value)}
        disabled={!hasAny || !a?.onChange}
        aria-label={a?.label ?? "Top layer"}
      >
        {hasAny ? renderGroups(modern, historic) : <NoOptions />}
      </select>

      {/* B selector */}
      <div className="ss-title pt-2">{b?.label ?? "Bottom layer"}</div>
      <select
        className="ss-input"
        value={b?.value ?? ""}
        onChange={(e) => b?.onChange?.(e.target.value)}
        disabled={!hasAny || !b?.onChange}
        aria-label={b?.label ?? "Bottom layer"}
      >
        {hasAny ? renderGroups(modern, historic) : <NoOptions />}
      </select>
    </div>
  );
}

/* -------- helpers -------- */

function groupLayers(arr) {
  const modern = [];
  const historic = [];
  for (const item of arr) {
    if (!item || !item.id || !item.name) continue;
    const entry = [item.id, item.name];
    (String(item.id).startsWith("nls-") ? historic : modern).push(entry);
  }
  modern.sort((a, b) => a[1].localeCompare(b[1]));
  historic.sort((a, b) => a[1].localeCompare(b[1]));
  return { modern, historic };
}

function renderGroups(modern, historic) {
  return (
    <>
      {modern.length > 0 && (
        <optgroup label="Modern">
          {modern.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </optgroup>
      )}
      {historic.length > 0 && (
        <optgroup label="Historic">
          {historic.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

function NoOptions() {
  return (
    <option value="" disabled>
      No layers available
    </option>
  );
}
