import React, { createContext, useContext, useMemo, useEffect } from "react";

/**
 * SearchBus
 * Global singleton bus + optional Provider.
 * - dispatchSearchGoto({ lat, lng, label, zoom })
 * - useSearchGoto(handler): subscribe from any component
 * - <SearchProvider onGoto={fn}> is still supported, but optional.
 */

const bus = new EventTarget();

export function dispatchSearchGoto(payload) {
  bus.dispatchEvent(new CustomEvent("search:goto", { detail: payload }));
}

export function useSearchGoto(handler) {
  useEffect(() => {
    if (typeof handler !== "function") return;
    const fn = (e) => handler(e.detail);
    bus.addEventListener("search:goto", fn);
    return () => bus.removeEventListener("search:goto", fn);
  }, [handler]);
}

// ---- Optional React context (kept for API compatibility) ----
const SearchCtx = createContext(null);

export function SearchProvider({ children, onGoto }) {
  // Bridge to global bus if consumer passes onGoto
  useSearchGoto(onGoto);

  const api = useMemo(
    () => ({
      dispatch: (action) => {
        if (action?.type === "search:goto") {
          dispatchSearchGoto(action.payload);
        }
      },
    }),
    []
  );

  return <SearchCtx.Provider value={api}>{children}</SearchCtx.Provider>;
}

export function useSearchDispatch() {
  const ctx = useContext(SearchCtx);
  // Fallback to global if no Provider above
  if (!ctx) {
    return (action) => {
      if (action?.type === "search:goto") dispatchSearchGoto(action.payload);
    };
  }
  return ctx.dispatch;
}
