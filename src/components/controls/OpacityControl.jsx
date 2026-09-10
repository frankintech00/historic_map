import React, { useId } from "react";

export default function OpacityControl({ opacity, onChange }) {
  const id = useId();
  const percent = Math.round(opacity * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="hm-label">Overlay opacity</label>
        <span className="text-xs font-semibold tabular-nums text-bronze-700">
          {percent}%
        </span>
      </div>
      <div className="flex h-11 items-center">
        <input
          id={id}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={(event) => onChange(Number(event.target.value))}
          className="hm-range"
          style={{
            "--hm-range-fill": `${percent}%`,
            height: "2.75rem",
            backgroundSize: "100% 6px",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          aria-valuetext={`${percent}%`}
        />
      </div>
      <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-stone-400" aria-hidden="true">
        <span>Base map</span>
        <span>Overlay</span>
      </div>
    </div>
  );
}
