/**
 * SingleViewMap.jsx — one map, two TileLayers (bottom + top with opacity).
 * Reports pan/zoom via onViewChange.
 */
import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { BASE_LAYERS } from "../config/mapSources.js";
import ZoomBottomLeft from "./ZoomBottomLeft.jsx";

function findLayer(id) {
  return BASE_LAYERS.find((l) => l.id === id);
}

export default function SingleViewMap({
  center,
  zoom,
  bottomLayerId,
  topLayerId,
  opacity = 0.7,
  onViewChange,
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
      zoomControl={false} // we’ll add our own at bottom-left
      whenCreated={(m) => {
        m.on("moveend zoomend", () => {
          const c = m.getCenter();
          onViewChange?.([c.lat, c.lng], m.getZoom());
        });
      }}
    >
      {bottom && (
        <TileLayer
          url={bottom.url}
          attribution={bottom.attribution}
          {...(bottom.subdomains ? { subdomains: bottom.subdomains } : {})}
        />
      )}
      {top && (
        <TileLayer
          url={top.url}
          attribution={top.attribution}
          opacity={opacity}
          {...(top.subdomains ? { subdomains: top.subdomains } : {})}
        />
      )}

      {/* Put zoom at bottom-left */}
      <ZoomBottomLeft />
    </MapContainer>
  );
}
