// Force Leaflet default marker icons to work with Vite/React bundling.
// Uses explicit asset URLs + full icon sizing/anchors.

import L from "leaflet";

// Resolve asset URLs via the bundler
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Create a concrete default Icon and set it globally for all L.marker(...)
const DefaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

// Apply as the default for all markers
L.Marker.prototype.options.icon = DefaultIcon;
