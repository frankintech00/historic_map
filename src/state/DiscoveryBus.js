import { useEffect } from "react";

/**
 * DiscoveryBus — lets official-record popups (plain HTML strings inside
 * Leaflet) ask the React app to open a personal note for that record.
 * - dispatchRecordNote({ source, sourceLabel, id, title, url, lat, lng })
 * - useRecordNote(handler)
 * - setLinkedKeys / hasLinkedNote: which records already have a note
 */

const bus = new EventTarget();
let linkedKeys = new Set();

export function dispatchRecordNote(payload) {
  bus.dispatchEvent(new CustomEvent("discovery:record-note", { detail: payload }));
}

export function useRecordNote(handler) {
  useEffect(() => {
    const fn = (e) => handler(e.detail);
    bus.addEventListener("discovery:record-note", fn);
    return () => bus.removeEventListener("discovery:record-note", fn);
  }, [handler]);
}

export function setLinkedKeys(keys) {
  linkedKeys = new Set(keys);
}

export function hasLinkedNote(key) {
  return linkedKeys.has(key);
}
