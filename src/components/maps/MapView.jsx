/**
 * MapView.jsx — orchestrates the map plus all floating chrome.
 * Owns view/layer/mode state; children render the map and controls.
 */

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { BASE_LAYERS, getLayerById } from "../../config/mapSources.js";
import { MARKER_SOURCES } from "../../config/markerSources.js";
import SingleViewMap from "./SingleViewMap.jsx";
import SideBySideView from "./SideBySideView.jsx";
import TopBar from "../layout/TopBar.jsx";
import LayerPanel from "../panels/LayerPanel.jsx";
import MapControlDock from "../controls/MapControlDock.jsx";
import OpacityControl from "../controls/OpacityControl.jsx";
import { useSearchGoto } from "../../state/SearchBus.jsx";
import { createShareUrl, readSharedView } from "../../lib/shareView.js";
import { outsideCoverage } from "../../lib/tileOptions.js";
import { linkedKey, newId } from "../../lib/discoveryModel.js";
import { useDiscoveries } from "../../state/useDiscoveries.js";
import { useRecordNote } from "../../state/DiscoveryBus.js";
import DiscoveryLayer from "../overlays/DiscoveryLayer.jsx";
import DiscoveryPanel from "../discoveries/DiscoveryPanel.jsx";
import LocationPicker from "../discoveries/LocationPicker.jsx";

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

// ---------- persisted state ----------
const STORAGE_KEY = "hm:app-state:v1";

function loadSavedState() {
  const shared = readSharedView(window.location.hash);
  if (shared) return shared;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function emptyDraft(overrides = {}) {
  return {
    id: newId(),
    title: "",
    notes: "",
    category: "other",
    lat: null,
    lng: null,
    observedOn: new Date().toISOString().slice(0, 10),
    photos: [],
    linkedRecord: null,
    ...overrides,
  };
}

function isValidCenter(c) {
  return (
    Array.isArray(c) &&
    c.length === 2 &&
    Number.isFinite(c[0]) &&
    Number.isFinite(c[1]) &&
    Math.abs(c[0]) <= 90 &&
    Math.abs(c[1]) <= 180
  );
}

export default function MapView() {
  // Snapshot persisted in localStorage (read once; every field validated below)
  const [saved] = useState(loadSavedState);

  // View state (map is source of truth after mount; this survives mode switches)
  const [center, setCenter] = useState(
    isValidCenter(saved?.center) ? saved.center : HOME_CENTER
  );
  const [zoom, setZoom] = useState(
    Number.isFinite(saved?.zoom)
      ? Math.min(Math.max(saved.zoom, 2), 22)
      : HOME_ZOOM
  );

  // Mode + panel
  const [mode, setMode] = useState(saved?.mode === "split" ? "split" : "single");
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

  const [bottomLayer, setBottomLayer] = useState(
    ensureValid(saved?.bottomLayer, defaults.bottom)
  );
  const [topLayer, setTopLayer] = useState(
    ensureValid(saved?.topLayer, defaults.top)
  );
  const [opacity, setOpacity] = useState(
    Number.isFinite(saved?.opacity)
      ? Math.min(Math.max(saved.opacity, 0), 1)
      : 0.7
  );

  const [leftLayer, setLeftLayer] = useState(
    ensureValid(saved?.leftLayer, defaults.bottom)
  );
  const [rightLayer, setRightLayer] = useState(
    ensureValid(saved?.rightLayer, defaults.top)
  );

  // Data source — null means "none"
  const [activeSource, setActiveSource] = useState(
    typeof saved?.activeSource === "string" && Object.hasOwn(MARKER_SOURCES, saved.activeSource)
      ? saved.activeSource
      : null
  );

  // My Discoveries (stored in this browser only — see state/useDiscoveries.js)
  const discoveries = useDiscoveries();
  const [showDiscoveries, setShowDiscoveries] = useState(saved?.showDiscoveries !== false);
  // disc.view: null | "list" | "detail" | "form" | "pick"
  const [disc, setDisc] = useState({ view: null, id: null, draft: null, isNew: false });
  const closeDisc = useCallback(() => setDisc({ view: null, id: null, draft: null, isNew: false }), []);

  // Layers that report no imagery for the current view: { [layerId]: true }
  const [noTiles, setNoTiles] = useState({});
  const handleCoverage = useCallback((layerId, hasImagery) => {
    setNoTiles((prev) => (!!prev[layerId] === !hasImagery ? prev : { ...prev, [layerId]: !hasImagery }));
  }, []);

  // Persist app state so a refresh restores the same view
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            center,
            zoom,
            mode,
            bottomLayer,
            topLayer,
            leftLayer,
            rightLayer,
            opacity,
            activeSource,
            showDiscoveries,
          })
        );
      } catch {
        // storage unavailable (private mode, quota) — skip silently
      }
    }, 300);
    return () => clearTimeout(t);
  }, [
    center,
    zoom,
    mode,
    bottomLayer,
    topLayer,
    leftLayer,
    rightLayer,
    opacity,
    activeSource,
    showDiscoveries,
  ]);

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
  const [notice, setNotice] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  function handleShare() {
    const map = mapRef.current;
    const position = map?.getCenter();
    setShareUrl(createShareUrl(window.location.href, {
      center: position ? [position.lat, position.lng] : center,
      zoom: map?.getZoom() ?? zoom,
      mode, bottomLayer, topLayer, leftLayer, rightLayer, opacity, activeSource,
    }));
    setNotice("");
  }
  async function copyShareUrl() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setNotice("Map link copied.");
    } catch {
      setNotice("Select the link above and copy it to share this view.");
    }
  }
  const handleLocate = useCallback(() => {
    setNotice("");
    if (!("geolocation" in navigator)) {
      setNotice("Location is unavailable in this browser. Search for a place instead.");
      return;
    }
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
      (error) => {
        setLocating(false);
        setNotice(error.code === 1
          ? "Location access was denied. Allow location in your browser settings or search for a place."
          : "Could not find your location. Try again or search for a place.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  const handleZoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  const maxZoom = mapRef.current?.getMaxZoom?.() ?? 22;
  const minZoom = 2;

  // ---------- My Discoveries ----------
  const openDiscPanel = useCallback((next) => {
    setDisc(next);
    if (window.innerWidth < 768) setPanelOpen(false);
  }, []);

  const startAddDiscovery = useCallback(() => {
    setNotice("");
    openDiscPanel({ view: "pick", id: null, draft: emptyDraft(), isNew: true });
  }, [openDiscPanel]);

  const confirmPickedLocation = useCallback(() => {
    const position = mapRef.current?.getCenter();
    if (!position) return;
    setDisc((d) => ({ ...d, view: "form", draft: { ...d.draft, lat: position.lat, lng: position.lng } }));
  }, []);

  const [pickLocating, setPickLocating] = useState(false);
  const locateForDiscovery = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setNotice("Location is unavailable in this browser. Move the map to the spot instead.");
      return;
    }
    setPickLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPickLocating(false);
        setLocatePoint({ lat: latitude, lng: longitude, label: "You are here" });
        const map = mapRef.current;
        map?.setView([latitude, longitude], Math.max(map.getZoom(), 17));
        setDisc((d) => (d.view === "pick"
          ? { ...d, view: "form", draft: { ...d.draft, lat: latitude, lng: longitude } }
          : d));
      },
      (error) => {
        setPickLocating(false);
        setNotice(error.code === 1
          ? "Location access was denied. Move the map to the spot instead."
          : "Could not find your location. Move the map to the spot instead.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  const saveDiscovery = useCallback(async (draft) => {
    const record = await discoveries.save(draft);
    setShowDiscoveries(true);
    setDisc({ view: "detail", id: record.id, draft: null, isNew: false });
  }, [discoveries]);

  const showDiscoveryOnMap = useCallback((record) => {
    setShowDiscoveries(true);
    const map = mapRef.current;
    map?.flyTo([record.lat, record.lng], Math.max(map.getZoom(), 16), { duration: 1.1 });
    if (window.innerWidth < 768) closeDisc();
  }, [closeDisc]);

  const selectDiscovery = useCallback((id) => {
    openDiscPanel({ view: "detail", id, draft: null, isNew: false });
  }, [openDiscPanel]);

  // "Add personal note" from an official record popup: reuse the existing
  // note for that record if there is one, otherwise start a linked draft.
  const handleRecordNote = useCallback((record) => {
    const linkedRecord = {
      source: record.source,
      sourceLabel: record.sourceLabel,
      id: record.id,
      title: record.title,
      url: record.url,
    };
    const existing = discoveries.items.find((d) => linkedKey(d.linkedRecord) === linkedKey(linkedRecord));
    if (existing) {
      openDiscPanel({ view: "detail", id: existing.id, draft: null, isNew: false });
      return;
    }
    openDiscPanel({
      view: "form",
      id: null,
      isNew: true,
      draft: emptyDraft({ title: record.title, lat: record.lat, lng: record.lng, linkedRecord }),
    });
  }, [discoveries.items, openDiscPanel]);
  useRecordNote(handleRecordNote);

  const selectedDiscovery = disc.id ? discoveries.items.find((d) => d.id === disc.id) || null : null;
  const picking = disc.view === "pick";

  // ---------- coverage hint ----------
  const shownLayerIds = mode === "split" ? [leftLayer, rightLayer] : [bottomLayer, topLayer];
  const uncovered = [...new Set(shownLayerIds)]
    .map(getLayerById)
    .filter((layer) => layer && (noTiles[layer.id] || outsideCoverage(layer, center)));

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
          onCoverage={handleCoverage}
        >
          {showDiscoveries && <DiscoveryLayer items={discoveries.items} onSelect={selectDiscovery} />}
        </SideBySideView>
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
          onCoverage={handleCoverage}
        >
          {showDiscoveries && <DiscoveryLayer items={discoveries.items} onSelect={selectDiscovery} />}
        </SingleViewMap>
      )}

      <TopBar
        onShare={handleShare}
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
        discoveries={{
          count: discoveries.items.length,
          visible: showDiscoveries,
          onToggle: setShowDiscoveries,
          onManage: () => openDiscPanel({ view: "list", id: null, draft: null, isNew: false }),
        }}
      />

      <MapControlDock
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        canZoomIn={zoom < maxZoom}
        canZoomOut={zoom > minZoom}
        onLocate={handleLocate}
        locating={locating}
        onAddDiscovery={disc.view ? undefined : startAddDiscovery}
      />

      {uncovered.length > 0 && (
        <div role="status" className="hm-surface pointer-events-none absolute left-1/2 top-[7.25rem] z-[1040] max-w-[calc(100%-1.5rem)] -translate-x-1/2 px-3 py-1.5 text-center text-[12px] font-medium text-stone-700 sm:top-[4.25rem]">
          Little or no imagery here for {uncovered.map((layer) => layer.name).join(" or ")}
        </div>
      )}

      {picking && (
        <LocationPicker
          onConfirm={confirmPickedLocation}
          onUseGps={locateForDiscovery}
          onCancel={() => (disc.draft?.lat != null ? setDisc((d) => ({ ...d, view: "form" })) : closeDisc())}
          locating={pickLocating}
        />
      )}
      {disc.view && !picking && (
        <DiscoveryPanel
          view={disc.view}
          store={discoveries}
          selected={selectedDiscovery}
          draft={disc.draft}
          isNew={disc.isNew}
          onClose={closeDisc}
          onOpenList={() => setDisc({ view: "list", id: null, draft: null, isNew: false })}
          onSelect={(id) => {
            const record = discoveries.items.find((d) => d.id === id);
            if (record) {
              setShowDiscoveries(true);
              mapRef.current?.flyTo([record.lat, record.lng], Math.max(mapRef.current.getZoom(), 15), { duration: 1.1 });
            }
            setDisc({ view: "detail", id, draft: null, isNew: false });
          }}
          onAdd={startAddDiscovery}
          onEdit={(record) => setDisc({ view: "form", id: record.id, draft: { ...record }, isNew: false })}
          onShowOnMap={showDiscoveryOnMap}
          onSave={saveDiscovery}
          onCancelForm={() => (disc.isNew ? closeDisc() : setDisc({ view: "detail", id: disc.id, draft: null, isNew: false }))}
          onChangeLocation={(draft) => {
            if (draft.lat != null) mapRef.current?.setView([draft.lat, draft.lng], Math.max(mapRef.current.getZoom(), 16));
            setDisc((d) => ({ ...d, view: "pick", draft }));
          }}
          onDeleted={() => setDisc({ view: "list", id: null, draft: null, isNew: false })}
        />
      )}
      {!isSplit && !panelOpen && !disc.view && (
        <section aria-label="Map opacity" className="hm-surface absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-16 right-3 z-[1050] max-w-sm px-3 py-2 md:hidden">
          <OpacityControl opacity={opacity} onChange={setOpacity} />
        </section>
      )}
      {shareUrl && (
        <section aria-label="Share map view" className="hm-surface absolute inset-x-3 top-28 z-[1100] p-4 sm:inset-x-auto sm:right-3 sm:top-16 sm:w-96">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Share this map view</h2>
            <button className="hm-seg-btn" onClick={() => setShareUrl("")} aria-label="Close share panel">Close</button>
          </div>
          <p className="mb-3 text-sm text-stone-600">Open this link to restore the location, map layers and view mode.</p>
          <input autoFocus aria-label="Map link" readOnly value={shareUrl} onFocus={(e) => e.target.select()} className="hm-select cursor-text" />
          <button className="hm-seg-btn mt-3 bg-bronze-50" onClick={copyShareUrl}>Copy link</button>
        </section>
      )}
      {notice && (
        <div role="status" className={`hm-surface absolute ${!isSplit && !panelOpen ? "bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+7rem)] md:bottom-8" : "bottom-8"} left-16 right-3 z-[1100] flex items-center gap-3 p-3 text-sm sm:left-20 sm:right-auto sm:max-w-md`}>
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="hm-seg-btn" aria-label="Dismiss message">Close</button>
        </div>
      )}
    </div>
  );
}
