/**
 * MapView.jsx — orchestrates Single vs Side-by-Side modes.
 * Keeps view & layer state, delegates rendering to child components.
 */

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { BASE_LAYERS } from "../../config/mapSources.js";
import SingleViewMap from "./SingleViewMap.jsx";
import SideBySideView from "./SideBySideView.jsx";
import LayerSelectorsPanel from "../controls/LayerSelectorsPanel.jsx";
import LayerOpacityPanel from "../controls/LayerOpacityPanel.jsx";
import { SearchProvider, useSearchGoto } from "../../state/SearchBus.jsx";

import SidePopout from "../layout/SidePopout.jsx";
import SearchBar from "../controls/SearchBar.jsx";

// ---------- helpers ----------
function hasLayer(id) {
  return !!BASE_LAYERS.find((l) => l.id === id);
}
function firstModern() {
  return BASE_LAYERS.find((l) => !l.id.startsWith("nls-")) || BASE_LAYERS[0];
}
function firstHistoric() {
  return BASE_LAYERS.find((l) => l.id.startsWith("nls-")) || BASE_LAYERS[0];
}
function ensureValid(id, fallbackId) {
  return hasLayer(id) ? id : fallbackId;
}

export default function MapView() {
  // View state
  const defaultCenter = useMemo(() => [55.8642, -4.2518], []);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);

  // Mode
  const [split, setSplit] = useState(false);

  // ---------- compute safe defaults once ----------
  const defaults = useMemo(() => {
    const modern = firstModern();
    const histPreferredId = hasLayer("nls-mt-uk-osgb1888")
      ? "nls-mt-uk-osgb1888"
      : firstHistoric()?.id;

    const modernId = modern?.id || "osm";
    const historicId = histPreferredId || modernId;

    return {
      bottom: modernId,
      top: historicId,
      left: modernId,
      right: historicId,
    };
  }, []);

  // Layer state
  const [bottomLayer, setBottomLayer] = useState(defaults.bottom);
  const [topLayer, setTopLayer] = useState(defaults.top);
  const [opacity, setOpacity] = useState(0.7); // 0–1, applies to TOP layer

  const [leftLayer, setLeftLayer] = useState(defaults.left);
  const [rightLayer, setRightLayer] = useState(defaults.right);

  // Normalise IDs if config changes
  useEffect(() => {
    setBottomLayer((id) => ensureValid(id, defaults.bottom));
    setTopLayer((id) => ensureValid(id, defaults.top));
    setLeftLayer((id) => ensureValid(id, defaults.left));
    setRightLayer((id) => ensureValid(id, defaults.right));
  }, [defaults.bottom, defaults.top, defaults.left, defaults.right]);

  // Search/jump integration
  const [searchPoint, setSearchPoint] = useState(null);
  const handleGoto = useCallback((payload) => {
    if (!payload) return;
    const { lat, lng, zoom: z } = payload;
    setCenter([lat, lng]);
    if (Number.isFinite(z)) setZoom(z);
    setSearchPoint({ lat, lng, label: payload.label });
  }, []);

  // Also listen to global bus directly
  useSearchGoto(handleGoto);

  // Keep parent view state in sync with child map
  const onViewChange = useCallback((c, z) => {
    setCenter(c);
    setZoom(z);
  }, []);

  // Locate
  const [locatePoint, setLocatePoint] = useState(null);
  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const c = [latitude, longitude];
        setCenter(c);
        setZoom((z) => Math.max(z, 14));
        setLocatePoint({
          lat: latitude,
          lng: longitude,
          label: "You are here",
        });
      },
      () => {}
    );
  }, []);

  // -------- NEW: marker visibility toggle (Canmore) --------
  const [canmoreVisible, setCanmoreVisible] = useState(true);

  // Footer controls
  const footerControls = (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      {/* Locate */}
      <button
        type="button"
        onClick={handleLocate}
        className="px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 shadow-sm"
        title="Locate me"
      >
        📍 Locate
      </button>

      {/* Mode toggle */}
      <button
        type="button"
        onClick={() => setSplit((s) => !s)}
        className="px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 shadow-sm"
        title="Toggle split view"
      >
        {split ? "Single view" : "Side-by-side"}
      </button>

      {/* Zoom controls */}
      <div className="inline-flex rounded-md overflow-hidden border border-gray-300 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(2, z - 1))}
          className="px-3 py-2 hover:bg-gray-50"
          title="Zoom out"
        >
          −
        </button>
        <div className="px-3 py-2 border-l border-r border-gray-300 select-none tabular-nums">
          {zoom}
        </div>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(19, z + 1))}
          className="px-3 py-2 hover:bg-gray-50"
          title="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <SearchProvider onGoto={handleGoto}>
      <div className="relative h-full w-full">
        {split ? (
          <SideBySideView
            center={center}
            zoom={zoom}
            style={{ position: "absolute", inset: 0 }}
            leftLayerId={leftLayer}
            rightLayerId={rightLayer}
            mode="split"
            searchMarker={searchPoint}
            locateMarker={locatePoint}
            onToggleMode={() => setSplit((s) => !s)}
            onViewChange={onViewChange}
            /* NEW: pass marker visibility */
            canmoreVisible={canmoreVisible}
          />
        ) : (
          <SingleViewMap
            center={center}
            zoom={zoom}
            style={{ position: "absolute", inset: 0 }}
            bottomLayerId={bottomLayer}
            topLayerId={topLayer}
            opacity={opacity}
            searchMarker={searchPoint}
            locateMarker={locatePoint}
            onToggleMode={() => setSplit((s) => !s)}
            onViewChange={onViewChange}
            /* NEW: pass marker visibility */
            canmoreVisible={canmoreVisible}
          />
        )}

        {/* Left pop-out with SearchBar in header and footer controls */}
        <SidePopout header={<SearchBar />} footer={footerControls}>
          {/* Single view: Bottom/Top selectors + Opacity */}
          {!split ? (
            <>
              <LayerSelectorsPanel
                a={{
                  label: "Bottom layer",
                  value: bottomLayer,
                  onChange: (id) =>
                    setBottomLayer(ensureValid(id, defaults.bottom)),
                }}
                b={{
                  label: "Top layer",
                  value: topLayer,
                  onChange: (id) => setTopLayer(ensureValid(id, defaults.top)),
                }}
              />

              <LayerOpacityPanel value={opacity} onChange={setOpacity} />

              {/* NEW: Data layers block (below existing single-view content) */}
              <div className="mt-3 pt-3 border-t border-black/10">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1">
                  Data layers
                </div>
                <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-black cursor-pointer"
                    checked={canmoreVisible}
                    onChange={() => setCanmoreVisible((v) => !v)}
                  />
                  <span>Canmore Sites (Terrestrial)</span>
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Split view: Left/Right selectors (no opacity control here) */}
              <LayerSelectorsPanel
                a={{
                  label: "Left layer",
                  value: leftLayer,
                  onChange: (id) =>
                    setLeftLayer(ensureValid(id, defaults.left)),
                }}
                b={{
                  label: "Right layer",
                  value: rightLayer,
                  onChange: (id) =>
                    setRightLayer(ensureValid(id, defaults.right)),
                }}
              />

              {/* NEW: Data layers block (below existing split-view content) */}
              <div className="mt-3 pt-3 border-t border-black/10">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1">
                  Data layers
                </div>
                <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-black cursor-pointer"
                    checked={canmoreVisible}
                    onChange={() => setCanmoreVisible((v) => !v)}
                  />
                  <span>Canmore Sites (Terrestrial)</span>
                </label>
              </div>
            </>
          )}
        </SidePopout>
      </div>
    </SearchProvider>
  );
}
