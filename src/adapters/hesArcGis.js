/**
 * ArcGIS Feature/MapServer adapter for HES/Canmore-style services.
 * - Omits pagination params when unsupported.
 * - Handles Point and MultiPoint geometries (uses first point).
 */

/** @typedef {{getWest:Function,getSouth:Function,getEast:Function,getNorth:Function}} BoundsLike */

function boundsToArcGisEnvelope(bounds) {
  const xmin = bounds.getWest();
  const ymin = bounds.getSouth();
  const xmax = bounds.getEast();
  const ymax = bounds.getNorth();
  return JSON.stringify({
    xmin,
    ymin,
    xmax,
    ymax,
    spatialReference: { wkid: 4326 },
  });
}

function buildQueryUrl(serviceUrl, layerId) {
  const base = serviceUrl.endsWith("/") ? serviceUrl.slice(0, -1) : serviceUrl;
  return `${base}/${layerId}/query`;
}

/**
 * Convert ArcGIS JSON feature to GeoJSON Feature.
 * Supports:
 *  - Point: { x, y }
 *  - MultiPoint: { points: [[x,y], ...] } -> take first point
 */
function arcFeatureToGeoJSON(arcFeature) {
  if (!arcFeature || !arcFeature.geometry) return null;

  // Point
  if (
    typeof arcFeature.geometry.x === "number" &&
    typeof arcFeature.geometry.y === "number"
  ) {
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [arcFeature.geometry.x, arcFeature.geometry.y],
      },
      properties: { ...arcFeature.attributes },
    };
  }

  // MultiPoint
  if (
    Array.isArray(arcFeature.geometry.points) &&
    arcFeature.geometry.points.length > 0
  ) {
    const [x, y] = arcFeature.geometry.points[0];
    if (typeof x === "number" && typeof y === "number") {
      return {
        type: "Feature",
        geometry: { type: "Point", coordinates: [x, y] },
        properties: { ...arcFeature.attributes },
      };
    }
  }

  return null;
}

async function fetchQuery(url, params, signal) {
  const qs = new URLSearchParams(params);
  const resp = await fetch(`${url}?${qs.toString()}`, { signal });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `ArcGIS query failed (${resp.status}): ${text || resp.statusText}`
    );
  }
  return resp.json();
}

/**
 * Query features by BBOX (no pagination unless caller sets supportsPagination=true).
 *
 * @param {Object} config
 * @param {string} config.serviceUrl
 * @param {number} config.layerId
 * @param {string} [config.defaultWhere]
 * @param {number} [config.minFetchZoom]
 * @param {number} [config.pageSize]
 * @param {number} [config.maxPages]
 * @param {boolean} [config.supportsPagination]
 *
 * @param {Object} options
 * @param {BoundsLike} options.bounds
 * @param {number} options.zoom
 * @param {string[]} [options.fields]
 * @param {string} [options.where]
 * @param {AbortSignal} [options.signal]
 *
 * @returns {Promise<{type:'FeatureCollection', features:Object[]}>}
 */
export async function queryFeaturesByBbox(
  config,
  { bounds, zoom, fields, where, signal } = {}
) {
  if (!config || !config.serviceUrl || typeof config.layerId !== "number") {
    throw new Error("Invalid config for ArcGIS adapter");
  }
  if (!bounds || typeof bounds.getWest !== "function") {
    throw new Error("Bounds are required (Leaflet-like LatLngBounds expected)");
  }
  if (typeof zoom !== "number") {
    throw new Error("Zoom is required");
  }

  const minZoom =
    typeof config.minFetchZoom === "number" ? config.minFetchZoom : 0;
  if (zoom < minZoom) {
    return { type: "FeatureCollection", features: [] };
  }

  const url = buildQueryUrl(config.serviceUrl, config.layerId);
  const whereClause = (where && where.trim()) || config.defaultWhere || "1=1";
  const outFields =
    Array.isArray(fields) && fields.length > 0 ? fields.join(",") : "*";
  const geometry = boundsToArcGisEnvelope(bounds);

  const baseParams = {
    f: "json",
    where: whereClause,
    geometry,
    geometryType: "esriGeometryEnvelope",
    inSR: 4326,
    spatialRel: "esriSpatialRelIntersects",
    outFields,
    returnGeometry: "true",
    outSR: 4326,
  };

  const supportsPagination = !!config.supportsPagination;

  // Non-paginated (Canmore, Properties in Care, etc.)
  if (!supportsPagination) {
    const data = await fetchQuery(url, baseParams, signal);
    if (data.error) {
      const msg = data.error?.message || "Unknown ArcGIS error";
      throw new Error(`ArcGIS error: ${msg}`);
    }
    const features = (data.features || [])
      .map(arcFeatureToGeoJSON)
      .filter(Boolean);
    return { type: "FeatureCollection", features };
  }

  // Paginated path (for future layers that support it)
  const pageSize = Math.max(1, Math.min(config.pageSize || 500, 1000));
  const maxPages = Math.max(1, config.maxPages || 5);

  const features = [];
  for (let page = 0; page < maxPages; page++) {
    const params = {
      ...baseParams,
      resultOffset: page * pageSize,
      resultRecordCount: pageSize,
    };
    const data = await fetchQuery(url, params, signal);
    if (data.error) {
      const msg = data.error?.message || "Unknown ArcGIS error";
      throw new Error(`ArcGIS error: ${msg}`);
    }
    const pageFeatures = (data.features || [])
      .map(arcFeatureToGeoJSON)
      .filter(Boolean);
    features.push(...pageFeatures);
    if (pageFeatures.length < pageSize) break;
  }
  return { type: "FeatureCollection", features };
}

export function fieldsFromFieldMap(fieldMap = {}) {
  const vals = Object.values(fieldMap).filter(Boolean);
  return Array.from(new Set(vals));
}
