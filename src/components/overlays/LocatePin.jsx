import React from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

/**
 * LocatePin
 * Blue "you are here" dot with a white halo.
 * Props:
 *  - point: { lat: number, lng: number, label?: string }
 */
const icon = new L.DivIcon({
  className: "locate-pin",
  html: `<div style="
    width:18px;
    height:18px;
    border-radius:9999px;
    background:#2563eb;
    border:3px solid white;
    box-shadow:0 0 0 2px rgba(37,99,235,.3), 0 2px 6px rgba(28,25,23,.35);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function LocatePin({ point }) {
  const map = useMap();
  if (!point) return null;
  if (map.getZoom() < 11) return null;

  return (
    <Marker position={[point.lat, point.lng]} icon={icon}>
      {point.label && <Popup>{point.label}</Popup>}
    </Marker>
  );
}
