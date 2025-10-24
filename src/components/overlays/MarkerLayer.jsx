import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Ensure default marker icons are wired for bundlers (Vite)
import "../../lib/leaflet-setup.js";

import { MARKER_SOURCES } from "../../config/markerSources.js";
import {
  queryFeaturesByBbox,
  fieldsFromFieldMap,
} from "../../adapters/hesArcGis.js";

/**
 * MarkerLayer
 * -----------
 * API-driven, clustered markers for a configured source.
 *
 * - Fetches feature GeoJSON by current map bbox (debounced on move/zoom)
 * - Respects per-source minFetchZoom
 * - Loads layer metadata once to honour server maxRecordCount/pagination
 * - Builds popups in this order:
 *     NMRSNAME
 *     ALTNAME
 *     SITETYPE
 *     COUNCIL
 *     COUNTY
 *     GRIDREF
 *     URL (Details link)
 */

const DEV_DEBUG = true;

export default function MarkerLayer({ sourceKey, debounceMs = 350 }) {
  const map = useMap();

  // Leaflet/Misc refs
  const clusterRef = useRef(null); // L.MarkerClusterGroup
  const debTimerRef = useRef(null); // debounce timer
  const abortRef = useRef(null); // AbortController for fetches
  const mountedRef = useRef(false); // component mounted flag

  // Per-layer metadata cache (supportsPagination, maxRecordCount)
  const metaRef = useRef({
    supportsPagination: false,
    maxRecordCount: 1000,
    loaded: false,
  });

  /* ----------------------- utilities ----------------------- */

  function dlog(...args) {
    if (DEV_DEBUG) console.log("[MarkerLayer]", ...args);
  }

  async function ensureLayerMeta(cfg) {
    if (metaRef.current.loaded) return metaRef.current;

    const base = cfg.serviceUrl.endsWith("/")
      ? cfg.serviceUrl.slice(0, -1)
      : cfg.serviceUrl;
    const metaUrl = `${base}/${cfg.layerId}?f=json`;

    try {
      const res = await fetch(metaUrl);
      if (!res.ok) throw new Error(`Meta ${res.status}`);
      const json = await res.json();

      const supportsPagination =
        !!json?.advancedQueryCapabilities?.supportsPagination;
      const maxRecordCount =
        typeof json?.maxRecordCount === "number" ? json.maxRecordCount : 1000;

      metaRef.current = { supportsPagination, maxRecordCount, loaded: true };
      dlog("meta loaded", { supportsPagination, maxRecordCount });
    } catch (e) {
      metaRef.current = {
        supportsPagination: false,
        maxRecordCount: 1000,
        loaded: true,
      };
      dlog("meta load failed; using defaults", e?.message || e);
    }
    return metaRef.current;
  }

  function clearAllMarkers() {
    if (clusterRef.current) {
      clusterRef.current.clearLayers();
    }
  }

  function setClusterGeoJSON(geojson) {
    if (!clusterRef.current) return;

    // Reset cluster content
    clusterRef.current.clearLayers();

    const fm = MARKER_SOURCES[sourceKey]?.fieldMap || {};

    // Build a lightweight GeoJSON layer; popups are strings for speed.
    const gjLayer = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => L.marker(latlng),
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const nmrs = p[fm.title] ?? "Site";
        const alt = p[fm.altName] ?? "";
        const type = p[fm.siteType] ?? "";
        const council = p[fm.subtitle] ?? "";
        const county = p[fm.county] ?? "";
        const grid = p[fm.gridRef] ?? "";
        const href = p[fm.url];

        const html = `
          <div class="space-y-1">
            <div style="font-weight:600">${escapeHtml(nmrs)}</div>
            ${
              alt
                ? `<div style="font-size:.95em;opacity:.9">${escapeHtml(
                    alt
                  )}</div>`
                : ""
            }
            ${
              type
                ? `<div style="font-size:.9em;opacity:.9">${escapeHtml(
                    type
                  )}</div>`
                : ""
            }
            ${
              council
                ? `<div style="font-size:.9em;opacity:.8">${escapeHtml(
                    council
                  )}</div>`
                : ""
            }
            ${
              county
                ? `<div style="font-size:.85em;opacity:.75">${escapeHtml(
                    county
                  )}</div>`
                : ""
            }
            ${
              grid
                ? `<div style="font-size:.85em;opacity:.75">${escapeHtml(
                    grid
                  )}</div>`
                : ""
            }
            ${
              href
                ? `<div style="margin-top:.3em"><a href="${escapeAttr(
                    href
                  )}" target="_blank" rel="noopener">Details</a></div>`
                : ""
            }
          </div>
        `;
        layer.bindPopup(html, { maxWidth: 300 });
      },
    });

    clusterRef.current.addLayer(gjLayer);
    dlog("cluster set", { count: geojson.features?.length || 0 });
  }

  async function runFetch() {
    const cfg = MARKER_SOURCES[sourceKey];
    if (!cfg) {
      dlog("no config for sourceKey", sourceKey);
      return;
    }

    const zoom = map.getZoom();
    const bounds = map.getBounds();
    const center = map.getCenter();

    const minZoom = typeof cfg.minFetchZoom === "number" ? cfg.minFetchZoom : 0;
    if (zoom < minZoom) {
      dlog("skip: zoom below minFetchZoom", {
        zoom,
        minFetchZoom: minZoom,
        center,
      });
      setClusterGeoJSON({ type: "FeatureCollection", features: [] });
      return;
    }

    // Cancel any in-flight fetch
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    // Prepare outFields from fieldMap (only fields we know exist on the layer)
    const fields = fieldsFromFieldMap(cfg.fieldMap);

    // Honour server-side limits
    const meta = await ensureLayerMeta(cfg);
    const safeCfg = {
      ...cfg,
      supportsPagination: !!meta.supportsPagination,
      pageSize: Math.min(cfg.pageSize || 500, meta.maxRecordCount || 1000),
      maxPages: cfg.maxPages || 1,
    };

    try {
      dlog("fetch start", {
        zoom,
        center,
        bbox: boundsToReadable(bounds),
        supportsPagination: safeCfg.supportsPagination,
      });

      // Adapter signature: queryFeaturesByBbox(config, options)
      const geojson = await queryFeaturesByBbox(safeCfg, {
        bounds,
        zoom,
        fields,
        where: cfg.defaultWhere,
        signal: abortRef.current.signal,
      });

      dlog("fetch success", { features: geojson.features?.length || 0 });
      setClusterGeoJSON(geojson);
    } catch (err) {
      if (err?.name === "AbortError") {
        dlog("fetch aborted");
        return;
      }
      dlog("fetch error", err?.message || err);
      setClusterGeoJSON({ type: "FeatureCollection", features: [] });
    }
  }

  function scheduleFetch() {
    if (!mountedRef.current) return;
    if (debTimerRef.current) clearTimeout(debTimerRef.current);
    debTimerRef.current = setTimeout(runFetch, debounceMs);
  }

  /* ----------------------- lifecycle ----------------------- */

  useEffect(() => {
    mountedRef.current = true;

    // Create and attach the cluster group once
    const cluster = L.markerClusterGroup({
      spiderfyOnEveryZoom: false,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 15,
    });
    clusterRef.current = cluster;
    map.addLayer(cluster);

    dlog("mounted; scheduling initial fetch");
    scheduleFetch();

    const onMoveOrZoom = () => {
      dlog("map moveend/zoomend");
      scheduleFetch();
    };
    map.on("moveend zoomend", onMoveOrZoom);

    return () => {
      mountedRef.current = false;

      map.off("moveend zoomend", onMoveOrZoom);

      if (debTimerRef.current) {
        clearTimeout(debTimerRef.current);
        debTimerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
      dlog("unmounted");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, sourceKey, debounceMs]);

  return null;
}

/* ----------------------- helpers ----------------------- */

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeAttr(s) {
  return String(s).replaceAll('"', "&quot;");
}
function boundsToReadable(bounds) {
  return {
    west: +bounds.getWest().toFixed(6),
    south: +bounds.getSouth().toFixed(6),
    east: +bounds.getEast().toFixed(6),
    north: +bounds.getNorth().toFixed(6),
  };
}
