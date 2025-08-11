/**
 * SideBySideView.jsx — one map, two L.tileLayer with draggable divider.
 * Uses leaflet-side-by-side. Reports pan/zoom via onViewChange.
 */
import React, { useEffect } from "react";
import { MapContainer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-side-by-side";
import { BASE_LAYERS } from "../config/mapSources.js";
import ZoomBottomLeft from "./ZoomBottomLeft.jsx";

function findLayer(id) {
  return BASE_LAYERS.find((l) => l.id === id);
}

function SideBySideControl({ leftId, rightId, onViewChange }) {
  const map = useMap();

  useEffect(() => {
    const leftCfg = findLayer(leftId);
    const rightCfg = findLayer(rightId);
    if (!leftCfg || !rightCfg) return;

    const left = L.tileLayer(leftCfg.url, {
      attribution: leftCfg.attribution,
      ...(leftCfg.subdomains ? { subdomains: leftCfg.subdomains } : {}),
    }).addTo(map);

    const right = L.tileLayer(rightCfg.url, {
      attribution: rightCfg.attribution,
      ...(rightCfg.subdomains ? { subdomains: rightCfg.subdomains } : {}),
    }).addTo(map);

    const control = L.control.sideBySide(left, right).addTo(map);

    const handler = () => {
      const c = map.getCenter();
      onViewChange?.([c.lat, c.lng], map.getZoom());
    };
    map.on("moveend zoomend", handler);

    return () => {
      map.off("moveend zoomend", handler);
      control.remove();
      map.removeLayer(left);
      map.removeLayer(right);
    };
  }, [map, leftId, rightId, onViewChange]);

  return null;
}

export default function SideBySideView({
  center,
  zoom,
  leftLayerId,
  rightLayerId,
  onViewChange,
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      preferCanvas
      worldCopyJump
      attributionControl
      zoomControl={false} // move zoom to bottom-left
    >
      <SideBySideControl
        leftId={leftLayerId}
        rightId={rightLayerId}
        onViewChange={onViewChange}
      />

      {/* Put zoom at bottom-left */}
      <ZoomBottomLeft />
    </MapContainer>
  );
}
