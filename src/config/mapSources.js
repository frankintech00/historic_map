/**
 * mapSources.js
 * Centralised raster tile sources for React + Leaflet, with controlled overzoom.
 *
 * IDs are STABLE. Secrets via VITE_MAPTILER_KEY in .env.local.
 *
 * Note:
 * - Most layers keep maxNativeZoom + maxZoom for tasteful overzoom.
 * - EXCEPTION: `nls-mt-uk-osgb1888` has NO maxNativeZoom/maxZoom so MapTiler can
 *   handle its own multi-scale switching; set the map’s maxZoom high globally.
 */

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const mtTiles = (path) =>
  `https://api.maptiler.com/${path}?key=${MAPTILER_KEY}`;

const ATTR_OSM = "&copy; OpenStreetMap contributors";
const ATTR_NLS =
  'Historic maps &copy; <a href="https://www.nls.uk" target="_blank" rel="noopener">National Library of Scotland</a>';
const ATTR_MAPTILER =
  '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">&copy; MapTiler</a>';

export const BASE_LAYERS = [
  // --- Modern basemaps ------------------------------------------------------
  {
    id: "osm",
    name: "Open Street Map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: ATTR_OSM,
    subdomains: ["a", "b", "c"],
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "satellite",
    name: "Satellite View",
    url: mtTiles("tiles/satellite-v2/{z}/{x}/{y}.jpg"),
    attribution: `${ATTR_MAPTILER}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 23,
    crossOrigin: true,
  },

  // --- Historic -------------------------------------------------------------
  {
    id: "nls-mt-uk-osgb1888",
    name: "OS Multi Scale 1888",
    url: mtTiles("tiles/uk-osgb1888/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
    crossOrigin: true,
    // no maxNativeZoom/maxZoom here: let MapTiler handle multi-scale switching
  },
  {
    id: "nls-os-sixinch-1888",
    name: "OS Six‑Inch 1888–1913",
    url: mtTiles("tiles/uk-osgb10k1888/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
    maxNativeZoom: 15,
    maxZoom: 21,
    crossOrigin: true,
  },
  {
    id: "nls-os-oneinch-hills-1885",
    name: "OS One‑Inch ‘Hills’ 1885–1903",
    url: mtTiles("tiles/uk-osgb63k1885/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
    maxNativeZoom: 14,
    maxZoom: 20,
    crossOrigin: true,
  },
  {
    id: "nls-os-provisional-25k-1937",
    name: "OS 1:25k 1937–1961",
    url: mtTiles("tiles/uk-osgb25k1937/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
    maxNativeZoom: 15,
    maxZoom: 21,
    crossOrigin: true,
  },
  {
    id: "nls-os-oneinch-seventh-1955",
    name: "OS One‑Inch 1955–1961",
    url: mtTiles("tiles/uk-osgb63k1955/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
    maxNativeZoom: 14,
    maxZoom: 20,
    crossOrigin: true,
  },
  {
    id: "nls-os-historical-1919-1947",
    name: "OS Historical 1919–1947",
    url: mtTiles("tiles/uk-osgb1919/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
    maxNativeZoom: 14,
    maxZoom: 20,
    crossOrigin: true,
  },
];

export default BASE_LAYERS;
