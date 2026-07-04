/**
 * MapView.jsx — orchestrates the map plus all floating chrome.
 * Owns view/layer/mode state; children render the map and controls.
 */

import React, { useMemo, useState, useCallback, useRef } from "react";
import { BASE_LAYERS } from "../../config/mapSources.js";
import SingleViewMap from "./SingleViewMap.jsx";
import SideBySideView from "./SideBySideView.jsx";
import TopBar from "../layout/TopBar.jsx";
import LayerPanel from "../panels/LayerPanel.jsx";
import MapControlDock from "../controls/MapControlDock.jsx";
import { useSearchGoto } from "../../state/SearchBus.jsx";

const HOME_CENTER = [55.8642, -4.2518]; // Glasgow
const HOME_ZOOM = 12;

// ---------- helpers ----------
function hasLayer(id) {
  return !!BASE_LAYERS.find((l) => l.id === id);
}
function firstModern() {
  return BASE_LAYERS.find((l) => l.category !== "historic") || BASE_LAYERS[0];
}
function firstHistoric() {
  return BASE_LAYERS.find((l) => l.category === "historic") || BASE_LAYERS[0];
}
function ensureValid(id, fallbackId) {
  return hasLayer(id) ? id : fallbackId;
}

export default function MapView() {
  // View state (map is source of truth after mount; this survives mode switches)
  const [center, setCenter] = useState(HOME_CENTER);
  const [zoom, setZoom] = useState(HOME_ZOOM);

  // Mode + panel
  const [mode, setMode] = useState("single");
  const [panelOpen, setPanelOpen] = useState(() => window.innerWidth >= 768);

  // Live Leaflet map instance (re-captured whenever the view remounts)
  const mapRef = useRef(null);
  const handleMapReady = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // ---------- layer state ----------
  const defaults = useMemo(() => {
    const modernId = firstModern()?.id || "osm";
    const historicId = hasLayer("nls-mt-uk-osgb1888")
      ? "nls-mt-uk-osgb1888"
      : firstHistoric()?.id || modernId;
    return { bottom: modernId, top: historicId };
  }, []);

  const [bottomLayer, setBottomLayer] = useState(defaults.bottom);
  const [topLayer, setTopLayer] = useState(defaults.top);
  const [opacity, setOpacity] = useState(0.7);

  const [leftLayer, setLeftLayer] = useState(defaults.bottom);
  const [rightLayer, setRightLayer] = useState(defaults.top);

  // Data source — null means "none"
  const [activeSource, setActiveSource] = useState(null);

  // ---------- map interactions ----------
  const onViewChange = useCallback((c, z) => {
    setCenter(c);
    setZoom(z);
  }, []);

  // Search results fly the live map
  const [searchPoint, setSearchPoint] = useState(null);
  const handleGoto = useCallback((payload) => {
    if (!payload) return;
    const { lat, lng, zoom: z, label } = payload;
    setSearchPoint({ lat, lng, label });
    const map = mapRef.current;
    const targetZoom = Number.isFinite(z) ? z : 14;
    if (map) {
      map.flyTo([lat, lng], targetZoom, { duration: 1.1 });
    } else {
      setCenter([lat, lng]);
      setZoom(targetZoom);
    }
    // Get the chrome out of the way on small screens
    if (window.innerWidth < 768) setPanelOpen(false);
  }, []);
  useSearchGoto(handleGoto);

  // Locate
  const [locatePoint, setLocatePoint] = useState(null);
  const [locating, setLocating] = useState(false);
  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocatePoint({ lat: latitude, lng: longitude, label: "You are here" });
        const map = mapRef.current;
        if (map) {
          map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
            duration: 1.1,
          });
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  const handleHome = useCallback(() => {
    mapRef.current?.flyTo(HOME_CENTER, HOME_ZOOM, { duration: 1.1 });
  }, []);

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  const maxZoom = mapRef.current?.getMaxZoom?.() ?? 22;
  const minZoom = 2;

  // ---------- panel wiring ----------
  const isSplit = mode === "split";
  const layerA = isSplit
    ? {
        label: "Left map",
        value: leftLayer,
        onChange: (id) => setLeftLayer(ensureValid(id, defaults.bottom)),
      }
    : {
        label: "Base map",
        value: bottomLayer,
        onChange: (id) => setBottomLayer(ensureValid(id, defaults.bottom)),
      };
  const layerB = isSplit
    ? {
        label: "Right map",
        value: rightLayer,
        onChange: (id) => setRightLayer(ensureValid(id, defaults.top)),
      }
    : {
        label: "Overlay map",
        value: topLayer,
        onChange: (id) => setTopLayer(ensureValid(id, defaults.top)),
      };
  const handleSwap = useCallback(() => {
    if (mode === "split") {
      setLeftLayer(rightLayer);
      setRightLayer(leftLayer);
    } else {
      setBottomLayer(topLayer);
      setTopLayer(bottomLayer);
    }
  }, [mode, leftLayer, rightLayer, bottomLayer, topLayer]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {isSplit ? (
        <SideBySideView
          center={center}
          zoom={zoom}
          style={{ position: "absolute", inset: 0 }}
          leftLayerId={leftLayer}
          rightLayerId={rightLayer}
          searchMarker={searchPoint}
          locateMarker={locatePoint}
          onViewChange={onViewChange}
          onMapReady={handleMapReady}
          activeSource={activeSource}
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
          onViewChange={onViewChange}
          onMapReady={handleMapReady}
          activeSource={activeSource}
        />
      )}

      <TopBar
        mode={mode}
        onModeChange={setMode}
        panelOpen={panelOpen}
        onTogglePanel={() => setPanelOpen((o) => !o)}
      />

      <LayerPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        mode={mode}
        layerA={layerA}
        layerB={layerB}
        onSwap={handleSwap}
        opacity={opacity}
        onOpacityChange={setOpacity}
        activeSource={activeSource}
        onSourceChange={setActiveSource}
      />

      <MapControlDock
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canZoomIn={zoom < maxZoom}
        canZoomOut={zoom > minZoom}
        onLocate={handleLocate}
        locating={locating}
        onHome={handleHome}
      />
    </div>
  );
}
