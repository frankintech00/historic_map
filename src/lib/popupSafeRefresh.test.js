import test from "node:test";
import assert from "node:assert/strict";
import { createPopupSafeRefresh } from "./popupSafeRefresh.js";

test("popup auto-pan refresh leaves markers intact until the popup closes", () => {
  let open = false;
  const applied = [];
  const refresh = createPopupSafeRefresh(() => open, (value) => applied.push(value));
  refresh.update("initial markers");
  open = true;
  refresh.update("auto-pan result");
  refresh.update("latest bounds result");
  refresh.flush();
  assert.deepEqual(applied, ["initial markers"]);
  open = false;
  refresh.flush();
  refresh.flush();
  assert.deepEqual(applied, ["initial markers", "latest bounds result"]);
});

test("switching directly to another popup keeps the replacement deferred", () => {
  let open = true;
  const applied = [];
  const refresh = createPopupSafeRefresh(() => open, (value) => applied.push(value));
  refresh.update({ features: [] });
  refresh.flush();
  assert.equal(applied.length, 0);
  refresh.clear(); // Source switch or component teardown.
  open = false;
  refresh.flush();
  assert.equal(applied.length, 0);
});
