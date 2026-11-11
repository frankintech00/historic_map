import test from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import { buildBackup, readBackup, sniffImageType, GEOJSON_NAME } from "./discoveryBackup.js";
import { sanitiseDiscovery, toGeoJSON, fromGeoJSON, planImport } from "./discoveryModel.js";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 1, 0]);
const ID = "11111111-1111-4111-8111-111111111111";
const PHOTO = "22222222-2222-4222-8222-222222222222";

function record(overrides = {}) {
  return sanitiseDiscovery({
    id: ID, title: "Estate wall", notes: "Rubble <b>wall</b>", category: "historic-estate",
    lat: 55.7905, lng: -3.8405, createdAt: "2026-11-01T10:00:00.000Z", updatedAt: "2026-11-02T10:00:00.000Z",
    observedOn: "2026-11-01", photos: [{ id: PHOTO, caption: "North face" }],
    linkedRecord: { source: "canmoreTerrestrial", sourceLabel: "Canmore Sites", id: 45678, title: "Allanton House", url: "https://canmore.org.uk/site/45678" },
    ...overrides,
  });
}

test("a backup round-trips discoveries, metadata and photographs", () => {
  const zip = buildBackup([record()], new Map([[PHOTO, JPEG]]), "2026-11-10T00:00:00.000Z");
  const { records, photos } = readBackup(zip);
  assert.deepEqual(records, [record()]);
  assert.deepEqual([...photos.keys()], [PHOTO]);
  assert.deepEqual(photos.get(PHOTO), JPEG);
  assert.equal(records[0].linkedRecord.id, "45678");
});

test("GeoJSON export is standard point features and imports on its own", () => {
  const geojson = toGeoJSON([record()]);
  assert.equal(geojson.type, "FeatureCollection");
  assert.deepEqual(geojson.features[0].geometry, { type: "Point", coordinates: [-3.8405, 55.7905] });
  const { records, photos } = readBackup(strToU8(JSON.stringify(geojson)));
  assert.equal(records[0].title, "Estate wall");
  assert.equal(photos.size, 0);
});

test("re-importing the same backup adds nothing; newer edits update", () => {
  const mine = [record()];
  assert.deepEqual(planImport(mine, [record()]), { add: [], update: [], skipped: 1 });
  const newer = record({ title: "Wall (revisited)", updatedAt: "2026-11-09T10:00:00.000Z" });
  const plan = planImport(mine, [newer, record({ id: "33333333-3333-4333-8333-333333333333" })]);
  assert.equal(plan.update.length, 1);
  assert.equal(plan.add.length, 1);
  assert.equal(plan.skipped, 0);
});

test("malformed and hostile records are dropped or neutralised", () => {
  const records = fromGeoJSON({
    type: "FeatureCollection",
    features: [
      { type: "Feature", id: "../../etc/passwd", geometry: { type: "Point", coordinates: [0, 0] }, properties: {} },
      { type: "Feature", id: ID, geometry: { type: "Point", coordinates: [999, 0] }, properties: {} },
      { type: "Feature", id: ID, geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] }, properties: {} },
      null,
      { type: "Feature", id: ID, geometry: { type: "Point", coordinates: [-4, 56] },
        properties: { title: 7, category: "nonsense", observedOn: "yesterday", photos: [{ id: "../x" }, { id: PHOTO }, { id: PHOTO }],
          linkedRecord: { source: "canmoreTerrestrial", id: 1, url: "javascript:alert(1)" } } },
    ],
  });
  assert.equal(records.length, 1);
  assert.equal(records[0].title, "Untitled discovery");
  assert.equal(records[0].category, "other");
  assert.equal(records[0].observedOn, "");
  assert.deepEqual(records[0].photos, [{ id: PHOTO, caption: "" }]);
  assert.equal(records[0].linkedRecord.url, "");
  assert.throws(() => fromGeoJSON({ type: "Feature" }), /not a discoveries/);
});

test("archives cannot smuggle in unexpected files or fake images", () => {
  const geojson = strToU8(JSON.stringify(toGeoJSON([record()])));
  const zip = zipSync({
    [GEOJSON_NAME]: geojson,
    "../../evil.sh": strToU8("rm -rf /"),
    "photos/../../escape.jpg": JPEG,
    "photos/44444444-4444-4444-8444-444444444444.jpg": JPEG, // not referenced by any record
    [`photos/${PHOTO}.jpg`]: strToU8("<script>alert(1)</script> definitely not a jpeg"),
  });
  const { records, photos } = readBackup(zip);
  assert.equal(records.length, 1);
  assert.equal(photos.size, 0);
  assert.throws(() => readBackup(strToU8("PK not really a zip")), /not a readable ZIP/);
  assert.throws(() => readBackup(zipSync({ "other.txt": strToU8("x") })), /does not contain/);
});

test("image sniffing recognises JPEG, PNG and WebP only", () => {
  assert.equal(sniffImageType(JPEG), "image/jpeg");
  assert.equal(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 13])), "image/png");
  assert.equal(sniffImageType(strToU8("RIFF\0\0\0\0WEBPVP8 ")), "image/webp");
  assert.equal(sniffImageType(strToU8("GIF89a not supported")), "");
});
