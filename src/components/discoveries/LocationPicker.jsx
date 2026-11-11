import React from "react";
import { Crosshair, LocateFixed, Loader2, Check } from "lucide-react";

/**
 * LocationPicker — choose where a discovery goes.
 * A crosshair sits at the centre of the map; the user pans the map under it
 * (works well one-handed on a phone) or jumps straight to their GPS position.
 */
export default function LocationPicker({ onConfirm, onUseGps, onCancel, locating }) {
  return (
    <>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1040] -translate-x-1/2 -translate-y-1/2 text-stone-900 drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]"
        aria-hidden
      >
        <Crosshair size={44} strokeWidth={1.75} />
      </div>

      <section
        aria-label="Choose discovery location"
        className="hm-surface absolute inset-x-3 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[1100] p-3 sm:inset-x-auto sm:left-1/2 sm:w-[26rem] sm:-translate-x-1/2"
      >
        <p className="mb-2.5 text-[13px] leading-snug text-stone-700">
          Move the map so the crosshair marks the spot, or use your GPS position.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="hm-btn hm-btn-primary flex-1" onClick={onConfirm}>
            <Check size={16} aria-hidden /> Set here
          </button>
          <button type="button" className="hm-btn flex-1" onClick={onUseGps} disabled={locating} aria-busy={locating}>
            {locating ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <LocateFixed size={16} aria-hidden />}
            Use my GPS
          </button>
          <button type="button" className="hm-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    </>
  );
}
