import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-side-by-side";
import { BASE_LAYERS } from "../../config/mapSources.js";
import SearchPin from "../overlays/SearchPin.jsx";
import LocatePin from "../overlays/LocatePin.jsx";
import MarkerLayer from "../overlays/MarkerLayer.jsx";

/**
 * SideBySideView
 * --------------
 * Two tile layers with a draggable comparison divider.
 * React renders both TileLayers; the plugin only draws the divider.
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

function SideBySideControl({ leftLayerRef, rightLayerRef }) {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    const left = leftLayerRef.current;
    const right = rightLayerRef.current;
    if (!map || !left || !right) return;

    controlRef.current = L.control.sideBySide(left, right).addTo(map);

    return () => {
      try {
        controlRef.current?.remove();
      } catch {
        // control already detached during map teardown
      }
      controlRef.current = null;
    };
  }, [map, leftLayerRef, rightLayerRef]);

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
}) {
  // Resolve layer objects from ids
  const { leftLayer, rightLayer } = useMemo(() => {
    const byId = Object.fromEntries(BASE_LAYERS.map((l) => [l.id, l]));
    return {
      leftLayer: byId[leftLayerId] || BASE_LAYERS[0],
      rightLayer: byId[rightLayerId] || BASE_LAYERS[0],
    };
  }, [leftLayerId, rightLayerId]);

  // Refs to the TileLayer instances (used by the side-by-side control)
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={style}
      zoomControl={false}
      attributionControl={true}
      className="h-full w-full"
    >
      {/* Render both layers via react-leaflet; refs expose Leaflet instances */}
      <TileLayer
        ref={leftRef}
        url={leftLayer.url}
        attribution={leftLayer.attribution}
      />
      <TileLayer
        ref={rightRef}
        url={rightLayer.url}
        attribution={rightLayer.attribution}
      />

      {/* Build the divider from those layers */}
      <SideBySideControl leftLayerRef={leftRef} rightLayerRef={rightRef} />

      {/* Data layer markers overlay */}
      {activeSource && <MarkerLayer sourceKey={activeSource} />}

      {/* Overlays */}
      {searchMarker && <SearchPin point={searchMarker} />}
      {locateMarker && <LocatePin point={locateMarker} />}

      {/* Controllers */}
      <ViewSync onViewChange={onViewChange} />
      <CaptureMap onMapReady={onMapReady} />
    </MapContainer>
  );
}
