/**
 * LayerOpacityPanel.jsx — single range slider (0..1)
 *
 * Props:
 *  - value: number (0..1)
 *  - onChange: (n)=>void
 */
import React from "react";

export default function LayerOpacityPanel({ value = 1, onChange }) {
  return (
    <div className="space-y-2">
      <div className="ss-title">Overlay opacity</div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(e) => onChange?.(parseFloat(e.target.value))}
        className="ss-slider"
        aria-label="Overlay opacity"
      />
    </div>
  );
}
