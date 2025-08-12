// Centralised map tile sources (React + Leaflet friendly).
// Keep secrets out of Git: put VITE_MAPTILER_KEY in .env.local
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

// Helper to build MapTiler tile URLs
const mtTiles = (path) =>
  `https://api.maptiler.com/${path}?key=${MAPTILER_KEY}`;

// Shared attribution fragments
const ATTR_OSM = "&copy; OpenStreetMap contributors";
const ATTR_NLS =
  'Historic maps &copy; <a href="https://www.nls.uk" target="_blank" rel="noopener">National Library of Scotland</a>';
const ATTR_MAPTILER =
  '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">&copy; MapTiler</a>';

export const BASE_LAYERS = [
  // --- Modern basemaps ------------------------------------------------------
  {
    id: "osm",
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: ATTR_OSM,
    subdomains: ["a", "b", "c"],
  },
  {
    id: "opentopo",
    name: "OpenTopoMap",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: `Map data: ${ATTR_OSM}, SRTM | Map style: &copy; OpenTopoMap (CC‑BY‑SA)`,
    subdomains: ["a", "b", "c"],
  },
  // RESTORED so existing selections keep working
  {
    id: "carto-voyager",
    name: "Carto Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    attribution: `${ATTR_OSM} &copy; CARTO`,
    subdomains: ["a", "b", "c", "d"],
  },
  // Modern Satellite (MapTiler)
  {
    id: "satellite",
    name: "Satellite (MapTiler)",
    url: mtTiles("tiles/satellite-v2/{z}/{x}/{y}.jpg"),
    attribution: `${ATTR_MAPTILER}`,
    crossOrigin: true,
  },

  // --- Historic (MapTiler / NLS) -------------------------------------------
  {
    id: "nls-os-sixinch-1888",
    name: "NLS OS Six‑Inch 1888–1913",
    url: mtTiles("tiles/uk-osgb10k1888/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    crossOrigin: true,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
  },
  {
    id: "nls-os-oneinch-hills-1885",
    name: "NLS OS One‑Inch ‘Hills’ 1885–1903",
    url: mtTiles("tiles/uk-osgb63k1885/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    crossOrigin: true,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
  },
  {
    id: "nls-os-provisional-25k-1937",
    name: "NLS OS 1:25k ‘Provisional’ 1937–1961",
    url: mtTiles("tiles/uk-osgb25k1937/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    crossOrigin: true,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
  },
  {
    id: "nls-os-oneinch-seventh-1955",
    name: "NLS OS One‑Inch Seventh Series 1955–1961",
    url: mtTiles("tiles/uk-osgb63k1955/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    crossOrigin: true,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
  },
  {
    id: "nls-os-historical-1919-1947",
    name: "NLS OS Historical 1919–1947",
    url: mtTiles("tiles/uk-osgb1919/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    crossOrigin: true,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
  },
];

export default BASE_LAYERS;
