import React from "react";
import { X, ArrowUpDown, Check } from "lucide-react";
import { groupedBaseLayers } from "../../config/mapSources.js";
import { MARKER_SOURCES } from "../../config/markerSources.js";

/**
 * LayerPanel — all layer & data controls in one place.
 * Desktop (md+): floating card below the top-bar, right side.
 * Mobile: bottom sheet with backdrop.
 *
 * Props:
 *  - open, onClose
 *  - mode: "single" | "split"
 *  - layerA / layerB: { label, value, onChange }   (base/overlay or left/right)
 *  - onSwap: () => void
 *  - opacity, onOpacityChange                       (single mode only)
 *  - activeSource, onSourceChange
 */
export default function LayerPanel({
  open,
  onClose,
  mode,
  layerA,
  layerB,
  onSwap,
  opacity,
  onOpacityChange,
  activeSource,
  onSourceChange,
}) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-[1090] bg-stone-900/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-label="Map layers"
        aria-hidden={!open}
        className={`z-[1100] transition-transform duration-300 ease-out
          max-md:fixed max-md:inset-x-0 max-md:bottom-0
          md:absolute md:right-3 md:top-[4.25rem] md:w-[21rem]
          ${
            open
              ? "translate-y-0 md:translate-x-0"
              : "max-md:translate-y-full md:pointer-events-none md:translate-x-[calc(100%+1rem)]"
          }`}
      >
        <div className="hm-surface flex max-h-[72vh] flex-col overflow-hidden max-md:rounded-b-none md:max-h-[calc(100vh-9.5rem)]">
          {/* Grab handle (mobile) */}
          <div className="flex justify-center pt-2 md:hidden" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-stone-300" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-1 pt-3">
            <h2 className="font-display text-base font-semibold text-stone-900">
              Map Layers
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              className="flex h-7 w-7 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 md:hidden"
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="hm-scroll flex-1 space-y-5 overflow-y-auto px-4 pb-5 pt-2">
            {/* Layer selectors */}
            <section className="space-y-1.5">
              <LayerSelect
                label={layerA.label}
                value={layerA.value}
                onChange={layerA.onChange}
              />

              <div className="flex items-center gap-2 py-0.5">
                <div className="h-px flex-1 bg-stone-200" />
                <button
                  type="button"
                  onClick={onSwap}
                  title="Swap layers"
                  aria-label="Swap layers"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors hover:border-bronze-300 hover:bg-bronze-50 hover:text-bronze-700"
                >
                  <ArrowUpDown size={13} />
                </button>
                <div className="h-px flex-1 bg-stone-200" />
              </div>

              <LayerSelect
                label={layerB.label}
                value={layerB.value}
                onChange={layerB.onChange}
              />
            </section>

            {/* Opacity (single mode) */}
            {mode === "single" && (
              <section className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="hm-label">Overlay opacity</span>
                  <span className="text-xs font-semibold tabular-nums text-bronze-700">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                  className="hm-range"
                  style={{ "--hm-range-fill": `${opacity * 100}%` }}
                  aria-label="Overlay opacity"
                />
                <div className="flex justify-between text-[10px] font-medium uppercase tracking-wider text-stone-400">
                  <span>Modern</span>
                  <span>Historic</span>
                </div>
              </section>
            )}

            <div className="h-px bg-stone-200" />

            {/* Data layers */}
            <section className="space-y-2">
              <span className="hm-label">Historic sites &amp; data</span>
              <div className="-mx-1 space-y-0.5">
                <SourceRow
                  checked={activeSource === null}
                  onSelect={() => onSourceChange(null)}
                  label="None"
                  description="Hide all site markers"
                  color="#d6d3d1"
                />
                {Object.entries(MARKER_SOURCES).map(([key, src]) => (
                  <SourceRow
                    key={key}
                    checked={activeSource === key}
                    onSelect={() => onSourceChange(key)}
                    label={src.label}
                    description={src.description}
                    color={src.color}
                  />
                ))}
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-stone-400">
                Site data &copy; Historic Environment Scotland. Markers load for
                the visible map area as you pan and zoom.
              </p>
            </section>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ---------------- helpers ---------------- */

function LayerSelect({ label, value, onChange }) {
  const { modern, historic } = groupedBaseLayers();
  return (
    <div className="space-y-1.5">
      <label className="hm-label block">{label}</label>
      <select
        className="hm-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <optgroup label="Modern">
          {modern.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </optgroup>
        <optgroup label="Historic">
          {historic.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

function SourceRow({ checked, onSelect, label, description, color }) {
  return (
    <label className="hm-radio-row" data-checked={checked}>
      <input
        type="radio"
        name="dataSource"
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="hm-dot" style={{ background: color }} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium leading-tight text-stone-800">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-snug text-stone-500">
            {description}
          </span>
        )}
      </span>
      {checked && (
        <Check size={15} className="mt-0.5 shrink-0 text-bronze-600" aria-hidden />
      )}
    </label>
  );
}
