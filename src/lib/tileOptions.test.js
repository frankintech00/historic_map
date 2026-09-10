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
