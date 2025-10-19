import React, { useEffect, useRef, useState } from "react";

/**
 * SidePopout (left)
 * - Full-height drawer from the left with constant-width chevron tab.
 * - ~70% bg on drawer + tab (children not faded).
 * - Responsive widths; sticky header/footer; scrollable content with stable scrollbars.
 *
 * Props:
 * - defaultOpen?: boolean
 * - widthClasses?: string         // responsive width classes; defaults provided
 * - overlay?: boolean
 * - onOpenChange?: (open: boolean) => void
 * - header?: ReactNode            // pinned at top (e.g., <SearchBar />)
 * - footer?: ReactNode            // pinned at bottom (optional actions)
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

  // Polite focus on open
  useEffect(() => {
    if (open && panelRef.current) {
      if (!document.activeElement || document.activeElement === document.body) {
        panelRef.current.focus();
      }
    }
  }, [open]);

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
        // Keep scrollbar space to prevent layout shift across breakpoints
        style={{ scrollbarGutter: "stable" }}
      >
        {/* Sticky header (e.g., SearchBar) */}
        {header && (
          <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/70 backdrop-blur px-4 py-3">
            {header}
          </div>
        )}

        {/* Scrollable content area */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3"
          style={{ scrollbarGutter: "stable" }}
        >
          {children}
        </div>

        {/* Sticky footer (optional) */}
        {footer && (
          <div className="sticky bottom-0 z-10 border-t border-gray-200 bg-white/70 backdrop-blur px-4 py-3">
            {footer}
          </div>
        )}

        {/* Close tab (OPEN) */}
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

      {/* Open tab (CLOSED) */}
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
