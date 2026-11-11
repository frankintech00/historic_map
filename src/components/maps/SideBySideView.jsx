import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-side-by-side";
import { BASE_LAYERS } from "../../config/mapSources.js";
import RasterLayer from "./RasterLayer.jsx";
import SearchPin from "../overlays/SearchPin.jsx";
import LocatePin from "../overlays/LocatePin.jsx";
import MarkerLayer from "../overlays/MarkerLayer.jsx";

/**
 * SideBySideView
 * --------------
 * Two map layers with a draggable comparison divider.
 * RasterLayer draws each side (one or more Leaflet layers); the plugin only
 * clips them and draws the divider.
 */

function ViewSync({ onViewChange }) {
  const map = useMapEvents({
    moveend: () =>
      onViewChange([map.getCenter().lat, map.getCenter().lng], map.getZoom()),
    zoomend: () =>
      onViewChange([map.getCenter().lat, map.getCenter().lng], map.getZoom()),
  });
  return null;
}

function CaptureMap({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);
  return null;
}

function SideBySideControl({ leftLayers, rightLayers }) {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    if (!map || leftLayers.length === 0 || rightLayers.length === 0) return;

    // The plugin clips one Leaflet layer per side. Give it the first of each
    // and mirror its clip onto the rest (multi-tileset layers such as LiDAR).
    const control = L.control.sideBySide([leftLayers[0]], [rightLayers[0]]);
    const extras = (clip) =>
      [leftLayers, rightLayers].forEach((side) => {
        const value = clip ? side[0].getContainer()?.style.clip || "" : "";
        side.slice(1).forEach((layer) => {
          const el = layer.getContainer();
          if (el) el.style.clip = value;
        });
      });
    // "dividermove" fires just before the plugin writes its own clip, so copy
    // it on the next microtask.
    let live = true;
    const syncClip = () => queueMicrotask(() => live && extras(true));
    control.on("dividermove", syncClip);
    controlRef.current = control.addTo(map);
    syncClip();
    controlRef.current.getContainer()?.querySelector("input")?.setAttribute("aria-label", "Map comparison divider");

    return () => {
      live = false;
      control.off("dividermove", syncClip);
      extras(false);
      try {
        controlRef.current?.setLeftLayers([]);
        controlRef.current?.setRightLayers([]);
        controlRef.current?.remove();
      } catch {
        // control already detached during map teardown
      }
      controlRef.current = null;
    };
  }, [map, leftLayers, rightLayers]);

  return null;
}

export default function SideBySideView({
  center,
  zoom,
  style,
  leftLayerId,
  rightLayerId,
  searchMarker,
  locateMarker,
  onViewChange,
  onMapReady,
  activeSource,
  onCoverage,
  children,
}) {
  // Resolve layer objects from ids
  const { leftLayer, rightLayer } = useMemo(() => {
    const byId = Object.fromEntries(BASE_LAYERS.map((l) => [l.id, l]));
    return {
      leftLayer: byId[leftLayerId] || BASE_LAYERS[0],
      rightLayer: byId[rightLayerId] || BASE_LAYERS[0],
    };
  }, [leftLayerId, rightLayerId]);

  // Live Leaflet layers for each side (used by the side-by-side control)
  const [leftLayers, setLeftLayers] = useState([]);
  const [rightLayers, setRightLayers] = useState([]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={2}
      maxZoom={22}
      style={style}
      zoomControl={false}
      attributionControl={true}
      className="h-full w-full"
    >
      <RasterLayer
        key={`left-${leftLayer.id}`}
        layer={leftLayer}
        onLayers={setLeftLayers}
        onCoverage={onCoverage}
      />
      <RasterLayer
        key={`right-${rightLayer.id}`}
        layer={rightLayer}
        onLayers={setRightLayers}
        onCoverage={onCoverage}
      />

      {/* Build the divider from those layers */}
      <SideBySideControl leftLayers={leftLayers} rightLayers={rightLayers} />

      {/* Data layer markers overlay */}
      {activeSource && <MarkerLayer sourceKey={activeSource} />}

      {/* Overlays */}
      {searchMarker && <SearchPin point={searchMarker} />}
      {locateMarker && <LocatePin point={locateMarker} />}

      {children}

      {/* Controllers */}
      <ViewSync onViewChange={onViewChange} />
      <CaptureMap onMapReady={onMapReady} />
    </MapContainer>
  );
}
