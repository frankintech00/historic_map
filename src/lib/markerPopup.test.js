import test from "node:test";
import assert from "node:assert/strict";
import { buildMarkerPopup } from "./markerPopup.js";
import { MARKER_SOURCES } from "../config/markerSources.js";

test("listed building popup shows a listing date, reference and parish", () => {
  const html = buildMarkerPopup(MARKER_SOURCES.hesListedBuildings, {
    ENT_TITLE: "Railway Bridge, Ayton", DES_REF: "LB4", DESIGNATED: 938476800000,
    PARBUR: "Ayton", NAT_PARK: " ", AMENDED: null,
  });
  assert.match(html, /LB4/);
  assert.match(html, /Listed on/);
  assert.match(html, /28 Sept 1999/);
  assert.match(html, /Parish \/ burgh/);
  assert.doesNotMatch(html, /National park|Designation amended|Invalid Date/);
});

test("untrusted record text is escaped and unsafe links are omitted", () => {
  const html = buildMarkerPopup(MARKER_SOURCES.canmoreTerrestrial, {
    NMRSNAME: '<img src=x onerror="alert(1)">', PARISH: "<script>bad()</script>",
    URL: "javascript:alert(1)", LASTUPDATE: "not a date",
  });
  assert.doesNotMatch(html, /<img|<script|href=|Record updated/);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script/);
});

test("missing fields stay hidden and duplicate titles are not repeated", () => {
  const html = buildMarkerPopup(MARKER_SOURCES.hesListedBuildings, {
    ENT_TITLE: "Bridge", DES_TITLE: "BRIDGE", DESIGNATED: null,
    LINK: 'https://example.com/record?a=1&b=2',
  });
  assert.doesNotMatch(html, /hm-popup-details|Listed group|Listed on/);
  assert.match(html, /a=1&amp;b=2/);
});

test("record update dates are separate from historical dates and zero IDs survive", () => {
  const html = buildMarkerPopup(MARKER_SOURCES.canmoreTerrestrial, {
    NMRSNAME: "Mound", CANMOREID: 0, LASTUPDATE: 0,
  });
  assert.match(html, /Canmore ID<\/dt><dd>0/);
  assert.match(html, /Record updated<\/dt><dd>1 Jan 1970/);
});
