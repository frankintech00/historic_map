import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-side-by-side";
import { BASE_LAYERS } from "../../config/mapSources.js";
import SearchPin from "../overlays/SearchPin.jsx";
import LocatePin from "../overlays/LocatePin.jsx";

/**
 * SideBySideView
 * React renders both TileLayers; the plugin only draws the divider.
 * Re-centres when external center/zoom change AND when a new locateMarker arrives.
 *
 * Props:
 *  - center: [lat, lng]
 *  - zoom: number
 *  - style: object
 *  - leftLayerId: string
 *  - rightLayerId: string
 *  - searchMarker: { lat, lng, label? } | null
 *  - locateMarker: { lat, lng, label? } | null
 *  - onViewChange: (centerArray, zoomNumber) => void
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

/** Keep map aligned to external center/zoom; fly when locateMarker changes */
function RecenterController({ center, zoom, locateMarker }) {
  const map = useMap();

  // Sync to props (no animation to avoid tug-of-war)
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [map, center[0], center[1], zoom]);

  // Fly to new device location
  useEffect(() => {
    if (!locateMarker) return;
    const target = [locateMarker.lat, locateMarker.lng];
    const nextZoom = Math.max(map.getZoom() ?? 0, 14);
    map.flyTo(target, nextZoom, { duration: 0.6 });
  }, [map, locateMarker?.lat, locateMarker?.lng]);

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
      } catch {}
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
      className="w-full h-full"
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

      {/* Overlays */}
      {searchMarker && <SearchPin point={searchMarker} />}
      {locateMarker && <LocatePin point={locateMarker} />}

      {/* Controllers */}
      <ViewSync onViewChange={onViewChange} />
      <RecenterController
        center={center}
        zoom={zoom}
        locateMarker={locateMarker}
      />
    </MapContainer>
  );
}
