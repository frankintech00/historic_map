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
 * Leaflet map for the single-view mode: base layer + transparent overlay.
 * The map owns its view after mount; state flows up via onViewChange and
 * the live map instance is exposed via onMapReady.
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
  onMapReady,
  activeSource,
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
      className="h-full w-full"
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

      {/* Data layer markers — bbox-scoped, debounced, clustered */}
      {activeSource && <MarkerLayer sourceKey={activeSource} />}

      {/* Pins */}
      {searchMarker && <SearchPin point={searchMarker} />}
      {locateMarker && <LocatePin point={locateMarker} />}

      {/* Controllers */}
      <ViewSync onViewChange={onViewChange} />
      <CaptureMap onMapReady={onMapReady} />
    </MapContainer>
  );
}
