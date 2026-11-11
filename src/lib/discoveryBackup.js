/**
 * discoveryBackup.js — portable ZIP backup of My Discoveries.
 *
 * Archive layout:
 *   discoveries.geojson      all records (standard GeoJSON, opens in QGIS etc.)
 *   photos/<photoId>.jpg     one file per photograph
 *   README.txt               how to restore
 *
 * Reading is defensive: only the expected file names are extracted, sizes are
 * capped, and entry names are never used as paths.
 */

import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { fromGeoJSON, toGeoJSON, isValidId } from "./discoveryModel.js";

export const GEOJSON_NAME = "discoveries.geojson";
const PHOTO_NAME = /^photos\/([A-Za-z0-9_-]{8,64})\.(?:jpe?g|png|webp)$/i;
const MAX_GEOJSON_BYTES = 50 * 1024 * 1024;
const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
const MAX_PHOTOS = 20000;
const BOM = new RegExp(`^${String.fromCharCode(0xfeff)}`);

const README = `Historic Maps - My Discoveries backup

discoveries.geojson  Your discoveries (locations, notes, categories, dates).
photos/              Your photographs, named by the ids used in the GeoJSON.

To restore: open the app, go to Layers > My Discoveries > Manage,
choose "Import backup" and select this ZIP file.
Discoveries already present on the device are not duplicated.
`;

/** Image type from magic bytes, or "" when the bytes are not a supported image. */
export function sniffImageType(bytes) {
  if (!bytes || bytes.length < 12) return "";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (strFromU8(bytes.subarray(0, 4), true) === "RIFF" && strFromU8(bytes.subarray(8, 12), true) === "WEBP") return "image/webp";
  return "";
}

/**
 * @param {object[]} records
 * @param {Map<string, Uint8Array>} photoBytes  photo id → image bytes
 * @returns {Uint8Array} ZIP file
 */
export function buildBackup(records, photoBytes, exportedAt) {
  const files = {
    [GEOJSON_NAME]: strToU8(JSON.stringify(toGeoJSON(records, exportedAt), null, 2)),
    "README.txt": strToU8(README),
  };
  for (const record of records) {
    for (const photo of record.photos) {
      const bytes = photoBytes.get(photo.id);
      // Photographs are already compressed, so store them as-is (level 0).
      if (bytes) files[`photos/${photo.id}.jpg`] = [bytes, { level: 0 }];
    }
  }
  return zipSync(files, { level: 6 });
}

/**
 * Read a backup ZIP (or a bare GeoJSON export).
 * @returns {{ records: object[], photos: Map<string, Uint8Array> }}
 *          photos only contains valid images referenced by a record.
 */
export function readBackup(bytes) {
  // Bare GeoJSON: starts with "{" (optionally after whitespace / BOM).
  const head = strFromU8(bytes.subarray(0, 64)).replace(BOM, "").trimStart();
  if (head.startsWith("{")) {
    if (bytes.length > MAX_GEOJSON_BYTES) throw new Error("The GeoJSON file is too large.");
    return { records: fromGeoJSON(parseJson(bytes)), photos: new Map() };
  }

  let photoCount = 0;
  let entries;
  try {
    entries = unzipSync(bytes, {
      filter: (file) => {
        if (file.name === GEOJSON_NAME) return file.originalSize <= MAX_GEOJSON_BYTES;
        if (!PHOTO_NAME.test(file.name) || file.originalSize > MAX_PHOTO_BYTES) return false;
        photoCount += 1;
        return photoCount <= MAX_PHOTOS;
      },
    });
  } catch {
    throw new Error("This file is not a readable ZIP backup.");
  }

  const geojson = entries[GEOJSON_NAME];
  if (!geojson) throw new Error(`The backup does not contain ${GEOJSON_NAME}.`);
  const records = fromGeoJSON(parseJson(geojson));

  const wanted = new Set(records.flatMap((r) => r.photos.map((p) => p.id)));
  const photos = new Map();
  for (const [name, data] of Object.entries(entries)) {
    const id = PHOTO_NAME.exec(name)?.[1];
    if (id && isValidId(id) && wanted.has(id) && sniffImageType(data)) photos.set(id, data);
  }
  return { records, photos };
}

function parseJson(bytes) {
  try {
    return JSON.parse(strFromU8(bytes).replace(BOM, ""));
  } catch {
    throw new Error("The discoveries file is not valid JSON.");
  }
}
