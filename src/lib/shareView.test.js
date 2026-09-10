import test from "node:test";
import assert from "node:assert/strict";
import { createShareUrl, readSharedView } from "./shareView.js";

test("shared comparison survives a URL round trip without private state", () => {
  const state = { center: [55.86, -4.25], zoom: 15, mode: "split", leftLayer: "osm", rightLayer: "historic", opacity: 0, activeSource: null, privateNote: "excluded" };
  const url = new URL(createShareUrl("https://example.com/maps?preview=1", state));
  assert.equal(url.pathname, "/maps");
  assert.equal(url.search, "?preview=1");
  const restored = readSharedView(url.hash);
  const { privateNote: _privateNote, ...expected } = state;
  assert.deepEqual(restored, expected);
});

test("malformed or unrelated links safely fall back to saved state", () => {
  for (const hash of ["", "#other=value", "#view=%7B", "#view=null", "#view=[]", "#view=42", `#view=${"x".repeat(4097)}`]) {
    assert.equal(readSharedView(hash), null);
  }
  assert.deepEqual(readSharedView('#view={"zoom":12,"unexpected":true}'), { zoom: 12 });
});
