import React from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

/**
 * LocatePin
 * Simple blue dot marker, same visual style as the SearchPin.
 * Props:
 *  - point: { lat: number, lng: number, label?: string }
 */
const icon = new L.DivIcon({
  className: "locate-pin",
  html: `<div style="
    width:18px;
    height:18px;
    border-radius:9999px;
    background:#2563eb; /* Tailwind blue-600 */
    border:2px solid white;
    box-shadow:0 0 0 1px rgba(0,0,0,.2);
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
