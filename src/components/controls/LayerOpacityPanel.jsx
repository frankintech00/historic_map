/**
 * LayerOpacityPanel.jsx
 * Pop-out control for adjusting the TOP layer opacity in SingleViewMap.
 *
 * Props:
 *  - value: number (0–1)
 *  - onChange: (number) => void
 *
 * Behaviour:
 *  - Shows 0–100% with a range slider.
 *  - Debounces calls to onChange to reduce re-renders.
 *  - Keyboard accessible; matches Leaflet-esque black-on-white styling.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";

export default function LayerOpacityPanel({ value = 0.7, onChange }) {
  // Represent as 0–100 for the UI
  const initial = Math.round((Number.isFinite(value) ? value : 0.7) * 100);
  const [percent, setPercent] = useState(initial);

  // Debounce: batch rapid slider moves (120ms feels snappy)
  const timerRef = useRef(null);
  const debouncedNotify = useMemo(() => {
    return (p) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (typeof onChange === "function") onChange(p / 100);
      }, 120);
    };
  }, [onChange]);

  useEffect(() => {
    // Keep UI in sync if value prop changes from outside
    const next = Math.round((Number.isFinite(value) ? value : 0.7) * 100);
    if (next !== percent) setPercent(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInput = (e) => {
    const p = Math.min(100, Math.max(0, Number(e.target.value) || 0));
    setPercent(p);
    debouncedNotify(p);
  };

  return (
    <div className="mt-4">
      <div className="mb-1 text-sm font-medium text-gray-800">
        Top layer opacity
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percent}
          onChange={handleInput}
          className="flex-1 accent-black"
          aria-label="Top layer opacity"
        />
        <div className="w-14 text-right tabular-nums text-sm">{percent}%</div>
      </div>

      <div className="mt-1 text-xs text-gray-600">
        Drag to reveal more of the bottom layer.
      </div>
    </div>
  );
}
