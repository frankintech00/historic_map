/**
 * LayerOpacityPanel.jsx — single range slider (0..1)
 *
 * Props:
 *  - value: number (0..1)
 *  - onChange: (n)=>void
 */
import React from "react";

export default function LayerOpacityPanel({ value = 1, onChange }) {
  const percent = Math.round(value * 100);

  return (
    <div className="space-y-2">
      <div className="ss-row">
        <div className="ss-title">Overlay opacity</div>
        <div className="text-sm font-medium tabular-nums text-ui-sub">
          {percent}%
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value))}
        className="ss-slider-enhanced"
        aria-label="Overlay opacity"
      />
    </div>
  );
}
