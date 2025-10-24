import React, { useEffect, useRef, useState } from "react";

/**
 * SidePopout (left) — mobile-first, consistent styling
 * - One unified surface (bg-white/80 + blur) for header, content, footer.
 * - Sticky header/footer; scrollable content.
 * - Chevron/tab is shown in BOTH states:
 *     • When OPEN: a left-chevron tab to close.
 *     • When CLOSED: a right-chevron tab to open.
 *
 * Props:
 *  - defaultOpen?: boolean
 *  - widthClasses?: string               // override widths if needed
 *  - overlay?: boolean                   // optional dim
 *  - onOpenChange?: (open: boolean) => void
 *  - header?: React.ReactNode
 *  - footer?: React.ReactNode
 *  - children?: React.ReactNode
 */
export default function SidePopout({
  defaultOpen = true,
  widthClasses,
  overlay = false,
  onOpenChange,
  header,
  footer,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const drawerRef = useRef(null);

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  const widths = widthClasses ?? "w-[88vw] max-w-sm sm:w-80 md:w-96"; // mobile-first, clamp on larger screens

  return (
    <>
      {/* Optional backdrop */}
      {overlay && open && (
        <div
          className="fixed inset-0 z-[1090] bg-black/30"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        ref={drawerRef}
        className={`
          fixed left-0 top-0 z-[1100] h-full
          transform transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          ${widths}
        `}
        role="dialog"
        aria-label="Map tools"
        aria-hidden={!open}
      >
        {/* Unified, translucent surface */}
        <div
          className="
            relative flex h-full flex-col
            bg-white/80 backdrop-blur-md
            border-r border-neutral-200 shadow-card
          "
        >
          {/* CLOSE TAB (visible when open) */}
          <button
            type="button"
            aria-label="Hide menu"
            onClick={() => setOpen(false)}
            className="
              absolute -right-7 top-1/2 -translate-y-1/2
              h-12 w-7 flex items-center justify-center
              bg-white/80 backdrop-blur-md
              border border-gray-200 shadow rounded-r-xl
            "
          >
            <Chevron left />
          </button>

          {/* Header (sticky) */}
          <div className="sticky top-0 z-[1] ss-section border-b border-neutral-200">
            {header}
          </div>

          {/* Content (scroll) */}
          <div className="flex-1 overflow-y-auto">
            <div className="ss-section">{children}</div>
          </div>

          {/* Footer (sticky) */}
          <div className="sticky bottom-0 z-[1] ss-toolbar bg-transparent">
            {footer}
          </div>
        </div>
      </aside>

      {/* OPEN TAB (visible when closed) */}
      {!open && (
        <button
          type="button"
          aria-label="Show menu"
          onClick={() => setOpen(true)}
          className="
            fixed left-0 top-1/2 -translate-y-1/2 z-[1100]
            h-12 w-7 flex items-center justify-center
            bg-white/80 backdrop-blur-md
            border border-gray-200 shadow rounded-r-xl
          "
        >
          {/* pointing right */}
          <Chevron />
        </button>
      )}
    </>
  );
}

function Chevron({ left = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
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
}
