import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

/**
 * SearchPin
 * Red teardrop pin with an animated pulse ring — marks a search result.
 *
 * Props:
 * - point: { lat: number, lng: number, label?: string }
 */
const icon = new L.DivIcon({
  className: "hm-search-pin",
  html: `
    <div style="position:relative;width:32px;height:40px;">
      <div class="hm-search-pulse" style="
        position:absolute;left:50%;bottom:0;width:28px;height:28px;
        margin-left:-14px;margin-bottom:-14px;border-radius:9999px;
        background:rgba(220,38,38,.35);
      "></div>
      <svg width="32" height="40" viewBox="0 0 26 34" xmlns="http://www.w3.org/2000/svg"
           style="position:absolute;inset:0;filter:drop-shadow(0 2px 3px rgba(28,25,23,.4));">
        <path d="M13 1C6.4 1 1 6.3 1 12.8 1 21.5 13 33 13 33s12-11.5 12-20.2C25 6.3 19.6 1 13 1Z"
              fill="#dc2626" stroke="#ffffff" stroke-width="2"/>
        <circle cx="13" cy="12.8" r="4.2" fill="#ffffff"/>
      </svg>
    </div>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

export default function SearchPin({ point }) {
  if (!point) return null;

  return (
    <Marker position={[point.lat, point.lng]} icon={icon}>
      {point.label && <Popup>{point.label}</Popup>}
    </Marker>
  );
}
