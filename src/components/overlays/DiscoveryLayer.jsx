import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";

/**
 * DiscoveryLayer — clustered pins for My Discoveries.
 * Tapping a pin calls onSelect(id); details open in the React panel, not a popup.
 */

const pinIcon = L.divIcon({
  className: "hm-discovery-pin",
  html: `<svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="15" r="13" fill="#1c1917" stroke="#fbbf24" stroke-width="2.5"/>
    <path d="M15 7.6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#fbbf24"/>
  </svg>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function clusterIcon(cluster) {
  const n = cluster.getChildCount();
  const size = n < 10 ? 34 : 40;
  return L.divIcon({
    html: `<div class="hm-cluster hm-cluster-mine" style="width:${size}px;height:${size}px">${n}</div>`,
    className: "",
    iconSize: [size, size],
  });
}

export default function DiscoveryLayer({ items, onSelect }) {
  const map = useMap();
  const selectRef = useRef(onSelect);
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: 17,
      showCoverageOnHover: false,
      iconCreateFunction: clusterIcon,
    });
    items.forEach((item) => {
      const marker = L.marker([item.lat, item.lng], {
        icon: pinIcon,
        title: item.title,
        alt: `My discovery: ${item.title}`,
        zIndexOffset: 500, // sit above official pins at the same spot
      });
      marker.on("click", () => selectRef.current?.(item.id));
      cluster.addLayer(marker);
    });
    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
    };
  }, [map, items]);

  return null;
}
