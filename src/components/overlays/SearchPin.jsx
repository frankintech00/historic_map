import React from "react";
import { Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";

/**
 * SearchPin
 * - Red pin marker with circle ring to show search result location
 * - Always visible (doesn't hide at low zoom like LocatePin)
 *
 * Props:
 * - point: { lat: number, lng: number, label?: string }
 */
const icon = new L.DivIcon({
  className: "search-pin",
  html: `<div style="
    width:20px;height:20px;border-radius:9999px;background:#dc2626;
    border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function SearchPin({ point }) {
  const map = useMap();
  if (!point) return null;

  const zoom = map.getZoom();
  // Calculate radius based on zoom level (smaller at higher zoom)
  const radius = Math.max(50, 800 / Math.pow(2, zoom - 10));

  return (
    <>
      {/* Outer circle ring */}
      <Circle
        center={[point.lat, point.lng]}
        radius={radius}
        pathOptions={{
          color: "#dc2626",
          fillColor: "#dc2626",
          fillOpacity: 0.1,
          weight: 2,
          opacity: 0.6,
        }}
      />
      {/* Red pin marker */}
      <Marker position={[point.lat, point.lng]} icon={icon}>
        {point.label && <Popup>{point.label}</Popup>}
      </Marker>
    </>
  );
}
