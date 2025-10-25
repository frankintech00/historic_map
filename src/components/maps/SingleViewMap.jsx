import React, { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Ensure default marker icons are wired before any markers render
import "../../lib/leaflet-setup.js";

import { BASE_LAYERS } from "../../config/mapSources.js";
import SearchPin from "../overlays/SearchPin.jsx";
import LocatePin from "../overlays/LocatePin.jsx";
import MarkerLayer from "../overlays/MarkerLayer.jsx";

/**
 * SingleViewMap
 * -------------
 * Controlled Leaflet map for the single-view mode.
 *
 * Props:
 *  - center: [lat, lng]
 *  - zoom: number
 *  - style: object
 *  - bottomLayerId: string
 *  - topLayerId: string
 *  - opacity: number
 *  - searchMarker: { lat, lng, label? } | null
 *  - locateMarker: { lat, lng, label? } | null
 *  - onViewChange: (centerArray, zoomNumber) => void
 *  - canmoreVisible: boolean            // NEW: toggle visibility of Canmore markers
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

function RecenterController({ center, zoom, locateMarker }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [map, center[0], center[1], zoom]);

  useEffect(() => {
    if (!locateMarker) return;
    const target = [locateMarker.lat, locateMarker.lng];
    const nextZoom = Math.max(map.getZoom() ?? 0, 14);
    map.flyTo(target, nextZoom, { duration: 0.6 });
  }, [map, locateMarker?.lat, locateMarker?.lng]);

  return null;
}

export default function SingleViewMap({
  center,
  zoom,
  style,
  bottomLayerId,
  topLayerId,
  opacity,
  searchMarker,
  locateMarker,
  onViewChange,
  // NEW:
  canmoreVisible,
}) {
  const { bottomLayer, topLayer } = useMemo(() => {
    const byId = Object.fromEntries(BASE_LAYERS.map((l) => [l.id, l]));
    return {
      bottomLayer: byId[bottomLayerId] || BASE_LAYERS[0],
      topLayer: byId[topLayerId] || null,
    };
  }, [bottomLayerId, topLayerId]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full"
      style={style}
      zoomControl={false}
      attributionControl={true}
    >
      <TileLayer url={bottomLayer.url} attribution={bottomLayer.attribution} />
      {topLayer && (
        <TileLayer
          url={topLayer.url}
          attribution={topLayer.attribution}
          opacity={opacity}
        />
      )}

      {/* Canmore Terrestrial markers — bbox-scoped, debounced, clustered */}
      {canmoreVisible && <MarkerLayer sourceKey="canmoreTerrestrial" />}

      {/* Pins */}
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
