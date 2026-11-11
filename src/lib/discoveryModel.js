/**
 * discoveryModel.js — the shape of a personal discovery, plus GeoJSON conversion.
 * Pure functions only (no browser APIs), so they run under `node --test`.
 *
 * Record:
 *   { id, title, notes, category, lat, lng, createdAt, updatedAt, observedOn,
 *     photos: [{ id, caption }],
 *     linkedRecord: { source, sourceLabel, id, title, url } | null }
 */

export const CATEGORIES = [
  { id: "historic-building", label: "Historic building" },
  { id: "ruins", label: "Ruins" },
  { id: "former-railway", label: "Former railway" },
  { id: "industrial-heritage", label: "Industrial heritage" },
  { id: "historic-estate", label: "Historic estate" },
  { id: "archaeological-feature", label: "Archaeological feature" },
  { id: "historic-photo-location", label: "Historic photograph location" },
  { id: "landscape-feature", label: "Landscape feature" },
  { id: "other", label: "Other" },
];

export const GEOJSON_FORMAT = "historic-map-discoveries";
export const MAX_PHOTOS_PER_DISCOVERY = 30;

const ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidId(value) {
  return typeof value === "string" && ID_PATTERN.test(value);
}

export function newId() {
  return crypto.randomUUID();
}

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || "Other";
}

function text(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isoDate(value, fallback) {
  const time = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? fallback : new Date(time).toISOString();
}

function safeUrl(value) {
  try {
    const url = new URL(text(value, 2000));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function cleanLinkedRecord(raw) {
  if (!raw || typeof raw !== "object") return null;
  const source = text(raw.source, 60);
  const id = text(String(raw.id ?? ""), 120);
  if (!source || !id) return null;
  return {
    source,
    sourceLabel: text(raw.sourceLabel, 120),
    id,
    title: text(raw.title, 300),
    url: safeUrl(raw.url),
  };
}

/** Stable key for "is there already a note for this official record?" */
export function linkedKey(linkedRecord) {
  return linkedRecord ? `${linkedRecord.source}:${linkedRecord.id}` : "";
}

/**
 * Validate and normalise untrusted input (form data or an imported file).
 * Returns a clean record, or null when it cannot be a discovery.
 */
export function sanitiseDiscovery(raw, now = new Date().toISOString()) {
  if (!raw || typeof raw !== "object" || !isValidId(raw.id)) return null;
  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;

  const seen = new Set();
  const photos = (Array.isArray(raw.photos) ? raw.photos : [])
    .filter((p) => p && isValidId(p.id) && !seen.has(p.id) && seen.add(p.id))
    .slice(0, MAX_PHOTOS_PER_DISCOVERY)
    .map((p) => ({ id: p.id, caption: text(p.caption, 300) }));

  const createdAt = isoDate(raw.createdAt, now);
  return {
    id: raw.id,
    title: text(raw.title, 200) || "Untitled discovery",
    notes: text(raw.notes, 20000),
    category: CATEGORIES.some((c) => c.id === raw.category) ? raw.category : "other",
    lat,
    lng,
    createdAt,
    updatedAt: isoDate(raw.updatedAt, createdAt),
    observedOn: DATE_PATTERN.test(raw.observedOn || "") ? raw.observedOn : "",
    photos,
    linkedRecord: cleanLinkedRecord(raw.linkedRecord),
  };
}

/** Records → GeoJSON FeatureCollection (photo files are referenced by path). */
export function toGeoJSON(records, exportedAt = new Date().toISOString()) {
  return {
    type: "FeatureCollection",
    format: GEOJSON_FORMAT,
    version: 1,
    exportedAt,
    features: records.map((r) => ({
      type: "Feature",
      id: r.id,
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
      properties: {
        title: r.title,
        notes: r.notes,
        category: r.category,
        categoryLabel: categoryLabel(r.category),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        observedOn: r.observedOn,
        photos: r.photos.map((p) => ({ id: p.id, caption: p.caption, file: `photos/${p.id}.jpg` })),
        linkedRecord: r.linkedRecord,
      },
    })),
  };
}

/** GeoJSON (untrusted) → clean records. Invalid features are dropped. */
export function fromGeoJSON(geojson) {
  if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    throw new Error("This is not a discoveries GeoJSON file.");
  }
  const records = [];
  const seen = new Set();
  for (const feature of geojson.features.slice(0, 50000)) {
    const coords = feature?.geometry?.type === "Point" ? feature.geometry.coordinates : null;
    if (!Array.isArray(coords)) continue;
    const record = sanitiseDiscovery({
      ...(feature.properties || {}),
      id: feature.id ?? feature.properties?.id,
      lng: coords[0],
      lat: coords[1],
    });
    if (record && !seen.has(record.id)) {
      seen.add(record.id);
      records.push(record);
    }
  }
  return records;
}

/**
 * Decide what an import does to the existing collection.
 * Same id + same or older timestamp → skipped (re-importing a backup is a no-op).
 */
export function planImport(existing, incoming) {
  const current = new Map(existing.map((r) => [r.id, r]));
  const plan = { add: [], update: [], skipped: 0 };
  for (const record of incoming) {
    const mine = current.get(record.id);
    if (!mine) plan.add.push(record);
    else if (record.updatedAt > mine.updatedAt) plan.update.push(record);
    else plan.skipped += 1;
  }
  return plan;
}
