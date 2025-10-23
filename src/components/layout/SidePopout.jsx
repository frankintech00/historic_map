import React, { useEffect, useRef, useState } from "react";

/**
 * SidePopout (left)
 * - Full-height drawer that slides from the left with a constant-width chevron tab.
 * - ~70% background on drawer + tab (children not faded).
 * - Sticky header/footer; scrollable middle content; responsive widths.
 *
 * Props:
 * - defaultOpen?: boolean
 * - widthClasses?: string         // responsive width classes; defaults provided
 * - overlay?: boolean
 * - onOpenChange?: (open: boolean) => void
 * - header?: React.ReactNode      // pinned at top (e.g., <SearchBar />)
 * - footer?: React.ReactNode      // pinned at bottom (e.g., Locate/Toggle/Zoom row)
 * - children?: React.ReactNode    // scrollable middle content
 */
export default function SidePopout({
  defaultOpen = false,
  widthClasses = "w-72 sm:w-80 md:w-96 lg:w-[28rem] max-w-[92vw]",
  overlay = false,
  onOpenChange,
  header = null,
  footer = null,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelRef = useRef(null);

  // Notify parent on state changes
  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Polite focus when opened
  useEffect(() => {
    if (open && panelRef.current) {
      if (!document.activeElement || document.activeElement === document.body) {
        panelRef.current.focus();
      }
    }
  }, [open]);

  // Chevron icon (no external deps)
  const Chevron = ({ left = false }) => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={left ? "rotate-180" : ""}
    >
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <>
      {/* Optional overlay (kept off by default so the map remains interactive) */}
      {overlay && (
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-[1099] transition-opacity duration-200 ${
            open ? "bg-black/30 opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />
      )}

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal={overlay ? "true" : "false"}
        aria-label="Side menu"
        tabIndex={-1}
        ref={panelRef}
        className={[
          "fixed top-0 left-0 h-screen z-[1100]",
          "bg-white/70 backdrop-blur",
          "border-r border-gray-200 shadow-lg",
          "transition-transform duration-200 ease-out",
          widthClasses,
          open ? "translate-x-0" : "-translate-x-full",
          "focus:outline-none flex flex-col",
        ].join(" ")}
        // Keep scrollbar space stable to avoid layout shifts
        style={{ scrollbarGutter: "stable" }}
      >
        {/* Sticky header (e.g., SearchBar) */}
        {header && (
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/70 backdrop-blur px-4 py-3">
            {header}
          </div>
        )}

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3"
          style={{ scrollbarGutter: "stable" }}
        >
          {children}
        </div>

        {/* Sticky footer (e.g., Locate / Toggle / Zoom) */}
        {footer && (
          <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white/70 backdrop-blur px-4 py-3">
            {/* 
              Tip for callers: wrap footer content in 
              'flex items-center justify-between gap-2 flex-wrap'
              so buttons space evenly and wrap on narrow screens.
            */}
            {footer}
          </div>
        )}

        {/* Close tab (visible only when open) */}
        {open && (
          <button
            type="button"
            aria-label="Hide menu"
            onClick={() => setOpen(false)}
            className="
              absolute -right-7 top-1/2 -translate-y-1/2 z-[1101]
              h-12 w-7 flex items-center justify-center
              bg-white/70 border border-gray-200 shadow rounded-r-xl
            "
          >
            <Chevron left />
          </button>
        )}
      </aside>

      {/* Open tab (visible only when closed) */}
      {!open && (
        <button
          type="button"
          aria-label="Show menu"
          onClick={() => setOpen(true)}
          className="
            fixed left-0 top-1/2 -translate-y-1/2 z-[1100]
            h-12 w-7 flex items-center justify-center
            bg-white/70 border border-gray-200 shadow rounded-r-xl
          "
        >
          <Chevron />
        </button>
      )}
    </>
  );
}
