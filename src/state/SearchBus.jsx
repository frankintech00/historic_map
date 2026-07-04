import { useEffect } from "react";

/**
 * SearchBus — tiny global event bus decoupling the SearchBar from the map.
 * - dispatchSearchGoto({ lat, lng, label, zoom })
 * - useSearchGoto(handler): subscribe from any component
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
