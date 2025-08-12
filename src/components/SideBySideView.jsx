/**
 * SideBySideView.jsx — two layers with a draggable divider.
 * Uses ControlsBar; no other toggles rendered elsewhere.
 */
import React, { useEffect, useMemo } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-side-by-side";
import { BASE_LAYERS } from "../config/mapSources.js";
import ControlsBar from "./controls/ControlsBar.jsx";

function useLayerRegistry() {
  return useMemo(() => {
    const reg = new Map();
    for (const l of BASE_LAYERS) reg.set(l.id, l);
    return reg;
  }, []);
}
function sanitiseId(id, registry) {
  if (registry.has(id)) return id;
  const fallback =
    ["osm", "carto-voyager", "opentopo", "satellite"].find((k) =>
      registry.has(k)
    ) || BASE_LAYERS[0]?.id;
  console.warn("[sbs] Missing layer id:", id, "→ falling back to:", fallback);
  return fallback;
}
function mkOpts(cfg) {
  const o = { attribution: cfg.attribution };
  if (cfg.subdomains) o.subdomains = cfg.subdomains;
  if (cfg.crossOrigin) o.crossOrigin = cfg.crossOrigin;
  if (typeof cfg.tileSize === "number") o.tileSize = cfg.tileSize;
  if (typeof cfg.zoomOffset === "number") o.zoomOffset = cfg.zoomOffset;
  if (typeof cfg.minZoom === "number") o.minZoom = cfg.minZoom;
  if (typeof cfg.maxZoom === "number") o.maxZoom = cfg.maxZoom;
  return o;
}
function SideBySideControl({ leftId, rightId, onViewChange }) {
  const map = useMap();
  const registry = useLayerRegistry();
  useEffect(() => {
    const leftCfg = registry.get(sanitiseId(leftId, registry));
    const rightCfg = registry.get(sanitiseId(rightId, registry));
    if (!leftCfg || !rightCfg) return;
    const left = L.tileLayer(leftCfg.url, mkOpts(leftCfg)).addTo(map);
    const right = L.tileLayer(rightCfg.url, mkOpts(rightCfg)).addTo(map);
    const control = L.control.sideBySide(left, right).addTo(map);
    const handler = () => {
      const c = map.getCenter();
      onViewChange?.([c.lat, c.lng], map.getZoom());
    };
    map.on("moveend zoomend", handler);
    return () => {
      map.off("moveend zoomend", handler);
      try {
        control.remove();
      } catch {}
      try {
        map.removeLayer(left);
      } catch {}
      try {
        map.removeLayer(right);
      } catch {}
    };
  }, [map, leftId, rightId, onViewChange, registry]);
  return null;
}

export default function SideBySideView({
  center,
  zoom,
  leftLayerId,
  rightLayerId,
  onViewChange,
  mode = "split",
  onToggleMode,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      preferCanvas
      worldCopyJump
      attributionControl
      zoomControl={false}
    >
      <ControlsBar mode={mode} onToggleMode={onToggleMode} />
      <SideBySideControl
        leftId={leftLayerId}
        rightId={rightLayerId}
        onViewChange={onViewChange}
      />
    </MapContainer>
  );
}
