/**
 * mapSources.js
 * Centralised raster tile sources for React + Leaflet, with controlled overzoom.
 *
 * IDs are STABLE. Secrets via VITE_MAPTILER_KEY in .env.local.
 * Each layer declares a `category` ("modern" | "historic" | "aerial" | "lidar")
 * used by the UI (see LAYER_GROUPS).
 *
 * Besides a plain XYZ `url`, a layer may declare:
 * - `sources: [{ url, bounds? }]`  several tilesets drawn as one layer
 * - `wms: { layers, styles?, ... }` the `url` is then a WMS endpoint
 * - `coverage: [[s, w], [n, e]]`    outside it the UI says "no coverage here"
 *
 * Note:
 * - Most layers keep maxNativeZoom + maxZoom for tasteful overzoom.
 * - EXCEPTION: `nls-mt-uk-osgb1888` has NO maxNativeZoom/maxZoom so MapTiler can
 *   handle its own multi-scale switching; set the map's maxZoom high globally.
 */

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
// tile datasets (satellite, NLS historic)
const mtTiles = (path) =>
  `https://api.maptiler.com/tiles/${path}?key=${MAPTILER_KEY}`;
// styled raster maps (outdoor, streets, topo, etc.)
const mtMaps = (style, ext = "png") =>
  `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.${ext}?key=${MAPTILER_KEY}`;

const ATTR_OSM = "&copy; OpenStreetMap contributors";
const ATTR_NLS =
  'Historic maps &copy; <a href="https://www.nls.uk" target="_blank" rel="noopener">National Library of Scotland</a>';
const ATTR_MAPTILER =
  '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">&copy; MapTiler</a>';
const ATTR_CARTO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// NLS-hosted tilesets (same host the Roy maps already use).
const NLS_TILES = "https://mapseries-tilesets.s3.amazonaws.com";
// Scottish Remote Sensing Portal (Scottish Government / JNCC) GeoServer WMS.
const SRSP_WMS = "https://srsp-ows.jncc.gov.uk/ows";
const lidarPhases = (model) =>
  [1, 2, 3, 4, 5, 6].map((n) => `scotland:scotland-lidar-${n}-${model}`).join(",");
const ATTR_LIDAR =
  'LiDAR &copy; Crown copyright Scottish Government, SEPA, Fugro &amp; Scottish Water (<a href="https://remotesensingdata.gov.scot/" target="_blank" rel="noopener">OGL</a>)';
// Rough mainland + islands box used for "no coverage here" hints.
const SCOTLAND = [[54.5, -8.8], [60.95, -0.6]];

export const BASE_LAYERS = [
  // --- Modern basemaps: OSM & CartoDB -----------------------------------------
  {
    id: "osm",
    name: "OpenStreetMap",
    category: "modern",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: ATTR_OSM,
    subdomains: ["a", "b", "c"],
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "carto-light",
    name: "CartoDB Light",
    category: "modern",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: ATTR_CARTO,
    subdomains: ["a", "b", "c", "d"],
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "carto-dark",
    name: "CartoDB Dark",
    category: "modern",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: ATTR_CARTO,
    subdomains: ["a", "b", "c", "d"],
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "carto-voyager",
    name: "CartoDB Voyager",
    category: "modern",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: ATTR_CARTO,
    subdomains: ["a", "b", "c", "d"],
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },

  // --- Modern basemaps: satellite & terrain -----------------------------------
  {
    id: "satellite",
    name: "MapTiler Satellite",
    category: "modern",
    url: mtTiles("satellite-v2/{z}/{x}/{y}.jpg"),
    attribution: `${ATTR_MAPTILER}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 23,
    crossOrigin: true,
  },
  {
    id: "mt-hybrid",
    name: "MapTiler Hybrid",
    category: "modern",
    url: mtMaps("hybrid", "jpg"),
    attribution: `${ATTR_MAPTILER} | ${ATTR_OSM}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "esri-satellite",
    name: "ESRI Satellite",
    category: "modern",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    minZoom: 1,
    maxNativeZoom: 18,
    maxZoom: 21,
    crossOrigin: true,
  },
  {
    id: "topo",
    name: "OpenTopoMap",
    category: "modern",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    subdomains: ["a", "b", "c"],
    minZoom: 1,
    maxNativeZoom: 17,
    maxZoom: 20,
    crossOrigin: true,
  },

  // --- Modern basemaps: MapTiler styled maps ----------------------------------
  {
    id: "mt-outdoor",
    name: "MapTiler Outdoor",
    category: "modern",
    url: mtMaps("outdoor-v2"),
    attribution: `${ATTR_MAPTILER} | ${ATTR_OSM}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "mt-streets",
    name: "MapTiler Streets",
    category: "modern",
    url: mtMaps("streets-v2"),
    attribution: `${ATTR_MAPTILER} | ${ATTR_OSM}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "mt-topo",
    name: "MapTiler Topo",
    category: "modern",
    url: mtMaps("topo-v2"),
    attribution: `${ATTR_MAPTILER} | ${ATTR_OSM}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "mt-winter",
    name: "MapTiler Winter",
    category: "modern",
    url: mtMaps("winter-v2"),
    attribution: `${ATTR_MAPTILER} | ${ATTR_OSM}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "mt-bright",
    name: "MapTiler Bright",
    category: "modern",
    url: mtMaps("bright-v2"),
    attribution: `${ATTR_MAPTILER} | ${ATTR_OSM}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },
  {
    id: "mt-dataviz",
    name: "MapTiler Dataviz",
    category: "modern",
    url: mtMaps("dataviz"),
    attribution: `${ATTR_MAPTILER} | ${ATTR_OSM}`,
    minZoom: 1,
    maxNativeZoom: 19,
    maxZoom: 22,
    crossOrigin: true,
  },

  // --- Historic (NLS direct — no API key needed) -----------------------------
  {
    id: "nls-roy-highlands",
    name: "Roy Military Survey 1747–55 (Highlands)",
    category: "historic",
    url: "https://mapseries-tilesets.s3.amazonaws.com/roy/highlands/{z}/{x}/{y}.png",
    attribution: ATTR_NLS,
    minZoom: 1,
    maxNativeZoom: 16,
    maxZoom: 20,
    crossOrigin: true,
  },
  {
    id: "nls-roy-lowlands",
    name: "Roy Military Survey 1747–55 (Lowlands)",
    category: "historic",
    url: "https://mapseries-tilesets.s3.amazonaws.com/roy/lowlands/{z}/{x}/{y}.png",
    attribution: ATTR_NLS,
    minZoom: 1,
    maxNativeZoom: 16,
    maxZoom: 20,
    crossOrigin: true,
  },

  // --- Historic (NLS via MapTiler) --------------------------------------------
  {
    id: "nls-mt-uk-osgb1888",
    name: "OS Multi Scale 1888",
    category: "historic",
    url: mtTiles("uk-osgb1888/{z}/{x}/{y}.png"),
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
    category: "historic",
    url: mtTiles("uk-osgb10k1888/{z}/{x}/{y}.png"),
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
    name: "OS One‑Inch 'Hills' 1885–1903",
    category: "historic",
    url: mtTiles("uk-osgb63k1885/{z}/{x}/{y}.png"),
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
    category: "historic",
    url: mtTiles("uk-osgb25k1937/{z}/{x}/{y}.png"),
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
    category: "historic",
    url: mtTiles("uk-osgb63k1955/{z}/{x}/{y}.png"),
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
    category: "historic",
    url: mtTiles("uk-osgb1919/{z}/{x}/{y}.png"),
    tileSize: 512,
    zoomOffset: -1,
    minZoom: 1,
    attribution: `${ATTR_NLS} | ${ATTR_MAPTILER}`,
    maxNativeZoom: 14,
    maxZoom: 20,
    crossOrigin: true,
  },

  // --- Historic (NLS direct, large scale) -------------------------------------
  {
    id: "nls-os-sixinch-first",
    name: "OS Six‑Inch 1st edition 1843–1882",
    category: "historic",
    url: `${NLS_TILES}/os/6inchfirst/{z}/{x}/{y}.png`,
    attribution: ATTR_NLS,
    minZoom: 1,
    maxNativeZoom: 17,
    maxZoom: 21,
    crossOrigin: true,
    coverage: SCOTLAND,
  },
  {
    id: "nls-os-25inch-1892",
    name: "OS 25‑Inch 1892–1914 (Scotland)",
    category: "historic",
    sources: [
      { url: `${NLS_TILES}/25_inch/scotland_1/{z}/{x}/{y}.png` },
      { url: `${NLS_TILES}/25_inch/scotland_2/{z}/{x}/{y}.png` },
    ],
    attribution: ATTR_NLS,
    minZoom: 1,
    maxNativeZoom: 18,
    maxZoom: 22,
    crossOrigin: true,
    coverage: SCOTLAND,
  },

  // --- Historical aerial photography ------------------------------------------
  {
    id: "nls-air-photos-1944",
    name: "OS Air Photo Mosaics 1944–1950",
    category: "aerial",
    url: `${NLS_TILES}/air-photo/{z}/{x}/{y}.png`,
    attribution:
      'Air photo mosaics 1944–1950 &copy; <a href="https://maps.nls.uk/os/air-photos/" target="_blank" rel="noopener">National Library of Scotland</a>',
    minZoom: 1,
    maxNativeZoom: 15,
    maxZoom: 19,
    crossOrigin: true,
    // Towns and selected areas only; uncovered tiles simply fail to load.
    coverage: [[54.6, -5.3], [57.6, -1.9]],
  },

  // --- LiDAR & terrain ---------------------------------------------------------
  {
    // Pre-rendered multi-directional hillshade of the bare-earth model (DTM).
    // One tileset per survey phase; `bounds` stops requests outside each phase.
    id: "lidar-dtm-hillshade",
    name: "LiDAR hillshade (DTM, multi‑directional)",
    category: "lidar",
    sources: [
      { url: `${NLS_TILES}/lidar/rgb/phase1/{z}/{x}/{y}.png`, bounds: [[54.754, -5.641], [59.165, -1.751]] },
      { url: `${NLS_TILES}/lidar/rgb/phase2/{z}/{x}/{y}.png`, bounds: [[55.423, -6.458], [60.214, -1.104]] },
      { url: `${NLS_TILES}/lidar/rgb/phase3/{z}/{x}/{y}.png`, bounds: [[54.584, -5.209], [56.163, -1.762]] },
      { url: `${NLS_TILES}/lidar/rgb/phase4/{z}/{x}/{y}.png`, bounds: [[55.031, -5.063], [56.549, -2.001]] },
      { url: `${NLS_TILES}/lidar/rgb/phase5/{z}/{x}/{y}.png`, bounds: [[55.031, -5.063], [56.549, -2.001]] },
      { url: `${NLS_TILES}/lidar/rgb/phase6/{z}/{x}/{y}.png`, bounds: [[55.534, -5.033], [55.988, -4.146]] },
      { url: `${NLS_TILES}/lidar/rgb/hebrides/{z}/{x}/{y}.png`, bounds: [[57.041, -7.48], [58.522, -6.124]] },
    ],
    attribution: `${ATTR_LIDAR} | Hillshade: <a href="https://maps.nls.uk/" target="_blank" rel="noopener">NLS</a> / R. Pearson (RVT)`,
    minZoom: 1,
    maxNativeZoom: 16,
    maxZoom: 21,
    crossOrigin: true,
    coverage: SCOTLAND,
  },
  {
    // Elevation-tinted surface model: buildings, trees and structures included.
    id: "lidar-dsm-elevation",
    name: "LiDAR surface model (DSM, elevation tint)",
    category: "lidar",
    url: SRSP_WMS,
    wms: {
      layers: lidarPhases("dsm"),
      styles: Array(6).fill("scotland:lidar-dem").join(","),
      format: "image/png",
      transparent: true,
    },
    attribution: ATTR_LIDAR,
    minZoom: 1,
    maxZoom: 21,
    coverage: SCOTLAND,
  },
  {
    // Elevation-tinted bare-earth model (vegetation and buildings removed).
    id: "lidar-dtm-elevation",
    name: "LiDAR terrain model (DTM, elevation tint)",
    category: "lidar",
    url: SRSP_WMS,
    wms: {
      layers: lidarPhases("dtm"),
      styles: Array(6).fill("scotland:lidar-dem").join(","),
      format: "image/png",
      transparent: true,
    },
    attribution: ATTR_LIDAR,
    minZoom: 1,
    maxZoom: 21,
    coverage: SCOTLAND,
  },
  {
    id: "bgs-bedrock-625k",
    name: "BGS bedrock geology 1:625k",
    category: "lidar",
    url: "https://ogc.bgs.ac.uk/cgi-bin/BGS_Bedrock_and_Superficial_Geology/wms",
    wms: { layers: "GBR_BGS_625k_BLS", format: "image/png", transparent: true },
    attribution:
      'Contains British Geological Survey materials &copy; UKRI',
    minZoom: 1,
    maxZoom: 21,
  },
];

/** Selector groups, in display order. */
export const LAYER_GROUPS = [
  { category: "modern", label: "Modern" },
  { category: "historic", label: "Historic maps" },
  { category: "aerial", label: "Historical aerial photography" },
  { category: "lidar", label: "LiDAR & terrain" },
];

/** Layers grouped for UI selectors: [{ label, layers }]. */
export function groupedBaseLayers() {
  return LAYER_GROUPS.map(({ category, label }) => ({
    label,
    layers: BASE_LAYERS.filter((l) => l.category === category),
  })).filter((group) => group.layers.length > 0);
}
export function getLayerById(id) {
  return BASE_LAYERS.find((l) => l.id === id) || null;
}

export default BASE_LAYERS;
