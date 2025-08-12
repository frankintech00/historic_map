/**
 * SingleViewMap.jsx — one map, two TileLayers (bottom + top with opacity).
 * Uses ControlsBar; no other toggles rendered elsewhere.
 */
import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { BASE_LAYERS } from "../config/mapSources.js";
import ControlsBar from "./controls/ControlsBar.jsx";

function findLayer(id) {
  return BASE_LAYERS.find((l) => l.id === id);
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

export default function SingleViewMap({
  center,
  zoom,
  bottomLayerId,
  topLayerId,
  opacity = 0.7,
  onViewChange,
  mode = "single",
  onToggleMode,
}) {
  const bottom = findLayer(bottomLayerId);
  const top = findLayer(topLayerId);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      preferCanvas
      worldCopyJump
      attributionControl
      zoomControl={false}
      whenCreated={(m) => {
        m.on("moveend zoomend", () => {
          const c = m.getCenter();
          onViewChange?.([c.lat, c.lng], m.getZoom());
        });
      }}
    >
      <ControlsBar mode={mode} onToggleMode={onToggleMode} />
      {bottom && <TileLayer url={bottom.url} opacity={1} {...mkOpts(bottom)} />}
      {top && <TileLayer url={top.url} opacity={opacity} {...mkOpts(top)} />}
    </MapContainer>
  );
}
