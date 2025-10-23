/**
 * MapView.jsx — orchestrates Single vs Side-by-Side modes.
 * Keeps view & layer state, delegates rendering to child components.
 *
 * Safe defaults:
 * - Left: "osm" (modern)
 * - Right: "nls-mt-uk-osgb1888" (historic, if present; else first historic)
 * - Single view bottom/top mirror the same logic.
 *
 * If a saved ID no longer exists (after pruning/renaming layers), we
 * silently fall back to the nearest sensible default so the map always renders.
 */

import React, { useMemo, useState, useCallback, useEffect } from "react";
import { BASE_LAYERS } from "../../config/mapSources.js";
import SingleViewMap from "./SingleViewMap.jsx";
import SideBySideView from "./SideBySideView.jsx";
import LayerOpacityPanel from "../controls/LayerOpacityPanel.jsx";
import LayerSelectors from "../controls/LayerSelectors.jsx";
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
    const historicId = histPreferredId || modernId; // final fallback just in case

    return {
      bottom: modernId,
      top: historicId,
      left: modernId,
      right: historicId,
    };
  }, []);

  // Layer state (initialised to safe, existing IDs)
  const [bottomLayer, setBottomLayer] = useState(defaults.bottom);
  const [topLayer, setTopLayer] = useState(defaults.top);
  const [opacity, setOpacity] = useState(0.7);

  const [leftLayer, setLeftLayer] = useState(defaults.left);
  const [rightLayer, setRightLayer] = useState(defaults.right);

  // If BASE_LAYERS change or code reloads with stale IDs, normalise once
  useEffect(() => {
    setBottomLayer((id) => ensureValid(id, defaults.bottom));
    setTopLayer((id) => ensureValid(id, defaults.top));
    setLeftLayer((id) => ensureValid(id, defaults.left));
    setRightLayer((id) => {
      const fixed = ensureValid(id, defaults.right);
      // Avoid identical left/right at initial mount (visually pointless)
      if (fixed === (hasLayer(leftLayer) ? leftLayer : defaults.left)) {
        const altHistoric = firstHistoric()?.id;
        return altHistoric && altHistoric !== fixed ? altHistoric : fixed;
      }
      return fixed;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once at mount

  // Search pin state
  const [searchPoint, setSearchPoint] = useState(null);

  // Locate pin state
  const [locatePoint, setLocatePoint] = useState(null);

  const handleGoto = useCallback(({ lat, lng, label, zoom: z = 16 }) => {
    const c = [lat, lng];
    setCenter(c);
    setZoom(z);
    setSearchPoint({ lat, lng, label });
  }, []);

  // Also listen to global bus directly (works even if Header isn't inside Provider)
  useSearchGoto(handleGoto);

  // Keep parent view state in sync with child map
  const onViewChange = useCallback((c, z) => {
    setCenter(c);
    setZoom(z);
  }, []);

  // --- footer control handlers (inline UI; keep behaviour unchanged) ---
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
        title="Toggle single / side-by-side"
      >
        {split ? "Side-by-Side ✓" : "Single ✓"}
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
          <>
            <SideBySideView
              center={center}
              zoom={zoom}
              style={{ height: "100%", width: "100%" }}
              leftLayerId={leftLayer}
              rightLayerId={rightLayer}
              mode="split"
              searchMarker={searchPoint}
              locateMarker={locatePoint}
              onToggleMode={() => setSplit((s) => !s)}
              onViewChange={onViewChange}
            />
            {/* <LayerSelectors
              leftLayer={leftLayer}
              rightLayer={rightLayer}
              onLeftChange={(id) => {
                const valid = ensureValid(id, defaults.left);
                setLeftLayer(valid);
                // Optional nicety: if both sides become identical, flip right to historic
                if (valid === rightLayer) {
                  const candidate = firstHistoric()?.id;
                  if (candidate && candidate !== valid)
                    setRightLayer(candidate);
                }
              }}
              onRightChange={(id) => {
                const valid = ensureValid(id, defaults.right);
                setRightLayer(valid);
              }}
              layers={BASE_LAYERS}
            /> */}
          </>
        ) : (
          <>
            <SingleViewMap
              center={center}
              zoom={zoom}
              style={{ height: "100%", width: "100%" }}
              bottomLayerId={bottomLayer}
              topLayerId={topLayer}
              opacity={opacity}
              mode="single"
              searchMarker={searchPoint}
              locateMarker={locatePoint}
              onToggleMode={() => setSplit((s) => !s)}
              onViewChange={onViewChange}
            />
            {/* <LayerOpacityPanel
              topLayer={topLayer}
              setTopLayer={(id) => setTopLayer(ensureValid(id, defaults.top))}
              bottomLayer={bottomLayer}
              setBottomLayer={(id) =>
                setBottomLayer(ensureValid(id, defaults.bottom))
              }
              opacity={opacity}
              setOpacity={setOpacity}
            /> */}
          </>
        )}

        {/* Left pop-out menu with SearchBar in header and footer controls */}
        <SidePopout header={<SearchBar />} footer={footerControls}>
          {/* Future controls (view-specific) will go here:
              - Single view: <LayerOpacityPanel ... />
              - Split view:  <LayerSelectors ... />
          */}
        </SidePopout>
      </div>
    </SearchProvider>
  );
}
