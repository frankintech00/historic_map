/**
 * ModeToggleInline.jsx — same toggle as your screenshot, but inline-friendly.
 * Use inside other controls (no absolute positioning).
 */
import React from "react";

export default function ModeToggleInline({ split, onToggle }) {
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle?.();
    }
  };

  return (
    <div className="bg-white text-black border border-black/20 rounded shadow px-3 py-2">
      <label className="flex items-center gap-3 select-none cursor-pointer">
        <span className="text-xs font-medium">Single</span>

        <button
          type="button"
          role="switch"
          aria-checked={split}
          aria-label="Toggle side-by-side view"
          onClick={onToggle}
          onKeyDown={handleKey}
          className="relative inline-flex h-6 w-12 items-center rounded-full bg-black/10 outline-none focus:ring-2 focus:ring-black/30"
        >
          <span
            className={
              "absolute h-4 w-4 rounded-full bg-black transition-transform " +
              (split ? "translate-x-7" : "translate-x-1")
            }
          />
        </button>

        <span className="text-xs font-medium">Side-by-Side</span>
      </label>
    </div>
  );
}
