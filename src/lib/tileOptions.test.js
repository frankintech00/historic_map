import test from "node:test";
import assert from "node:assert/strict";
import { tileOptions } from "./tileOptions.js";

test("historic tile geometry and zoom limits reach Leaflet without UI metadata", () => {
  const layer = { id: "historic", name: "Historic map", category: "historic", url: "https://example.com/{z}/{x}/{y}.png", tileSize: 512, zoomOffset: -1, maxNativeZoom: 15, maxZoom: 21, attribution: "Source", crossOrigin: true };
  const options = tileOptions(layer);
  assert.equal(options.tileSize * 2 ** options.zoomOffset, 256);
  assert.equal(options.maxNativeZoom, 15);
  assert.equal(options.maxZoom, 21);
  assert.equal(options.crossOrigin, true);
  assert.equal(options.attribution, "Source");
  assert.equal("id" in options, false);
  assert.equal("category" in options, false);
  assert.equal(layer.id, "historic");
});

test("multi-tileset and WMS layers expand into Leaflet layer parts", async () => {
  const { layerParts, outsideCoverage } = await import("./tileOptions.js");
  const shared = { id: "x", name: "X", category: "lidar", attribution: "Source", maxNativeZoom: 16, coverage: [[54.5, -8.8], [60.95, -0.6]] };

  const multi = layerParts({ ...shared, sources: [
    { url: "https://example.com/a/{z}/{x}/{y}.png", bounds: [[55, -5], [56, -4]] },
    { url: "https://example.com/b/{z}/{x}/{y}.png" },
  ] });
  assert.deepEqual(multi.map((p) => [p.kind, p.url]), [
    ["xyz", "https://example.com/a/{z}/{x}/{y}.png"],
    ["xyz", "https://example.com/b/{z}/{x}/{y}.png"],
  ]);
  assert.deepEqual(multi[0].options, { attribution: "Source", maxNativeZoom: 16, bounds: [[55, -5], [56, -4]] });
  assert.equal("bounds" in multi[1].options, false);

  const [wms] = layerParts({ ...shared, url: "https://example.com/ows", wms: { layers: "a,b", styles: "s,s", transparent: true } });
  assert.equal(wms.kind, "wms");
  assert.equal(wms.url, "https://example.com/ows");
  assert.deepEqual(wms.options, { attribution: "Source", maxNativeZoom: 16, layers: "a,b", styles: "s,s", transparent: true });

  const [plain] = layerParts({ id: "osm", name: "OSM", category: "modern", url: "https://example.com/{z}/{x}/{y}.png", maxZoom: 22 });
  assert.deepEqual(plain, { kind: "xyz", url: "https://example.com/{z}/{x}/{y}.png", options: { maxZoom: 22 } });

  assert.equal(outsideCoverage(shared, [51.5, -0.12]), true);
  assert.equal(outsideCoverage(shared, [55.79, -3.84]), false);
  assert.equal(outsideCoverage({ id: "osm" }, [0, 0]), false);
});
