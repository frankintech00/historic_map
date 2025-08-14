import React, { createContext, useContext, useMemo } from "react";

/**
 * SearchBus: tiny event bus to route "go to this place" actions
 * from the Header's SearchBar to MapView without prop drilling.
 */

const SearchCtx = createContext(null);

export function SearchProvider({ children, onGoto }) {
  const api = useMemo(
    () => ({
      dispatch: (action) => {
        if (action?.type === "search:goto" && typeof onGoto === "function") {
          onGoto(action.payload);
        }
      },
    }),
    [onGoto]
  );

  return <SearchCtx.Provider value={api}>{children}</SearchCtx.Provider>;
}

export function useSearchDispatch() {
  const ctx = useContext(SearchCtx);
  if (!ctx) {
    throw new Error("useSearchDispatch must be used within <SearchProvider>");
  }
  return ctx.dispatch;
}
