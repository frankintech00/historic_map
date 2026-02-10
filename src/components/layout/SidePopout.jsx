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
 *  - open?: boolean                      // controlled mode
 *  - defaultOpen?: boolean               // uncontrolled mode
 *  - widthClasses?: string               // override widths if needed
 *  - overlay?: boolean                   // optional dim
 *  - onOpenChange?: (open: boolean) => void
 *  - header?: React.ReactNode
 *  - footer?: React.ReactNode
 *  - children?: React.ReactNode
 */
export default function SidePopout({
  open: controlledOpen,
  defaultOpen = true,
  widthClasses,
  overlay = false,
  onOpenChange,
  header,
  footer,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const drawerRef = useRef(null);

  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleToggle = (newState) => {
    if (!isControlled) {
      setInternalOpen(newState);
    }
    onOpenChange?.(newState);
  };

  useEffect(() => {
    if (!isControlled) {
      onOpenChange?.(internalOpen);
    }
  }, [internalOpen, onOpenChange, isControlled]);

  const widths = widthClasses ?? "w-[88vw] max-w-sm sm:w-80 md:w-96"; // mobile-first, clamp on larger screens

  return (
    <>
      {/* Optional backdrop */}
      {overlay && open && (
        <div
          className="fixed inset-0 z-[1090] bg-black/30"
          onClick={() => handleToggle(false)}
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
            onClick={() => handleToggle(false)}
            className="
              absolute -right-8 top-1/2 -translate-y-1/2
              h-14 w-8 flex items-center justify-center
              bg-ui-accent text-white
              border border-ui-accent shadow-lg rounded-r-xl
              hover:bg-sky-600 active:bg-sky-700
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-ui-accent focus:ring-offset-2
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
          onClick={() => handleToggle(true)}
          className="
            fixed left-0 top-1/2 -translate-y-1/2 z-[1100]
            h-14 w-8 flex items-center justify-center
            bg-ui-accent text-white
            border border-ui-accent shadow-lg rounded-r-xl
            hover:bg-sky-600 active:bg-sky-700
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-ui-accent focus:ring-offset-2
            animate-pulse
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
      width="20"
      height="20"
      aria-hidden="true"
      focusable="false"
      className={left ? "rotate-180" : ""}
    >
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
