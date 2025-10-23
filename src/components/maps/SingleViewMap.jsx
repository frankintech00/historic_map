import React, { useMemo } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BASE_LAYERS } from "../../config/mapSources.js";
import SearchPin from "../overlays/SearchPin.jsx";
import LocatePin from "../overlays/LocatePin.jsx";

/**
 * SingleViewMap
 * Controlled by props; recentering handled inside the Leaflet context.
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

/** Recenter whenever center/zoom change OR a new locateMarker arrives */
function RecenterController({ center, zoom, locateMarker }) {
  const map = useMap();

  // Keep map synced to external center/zoom
  React.useEffect(() => {
    // setView avoids weird animation conflicts
    map.setView(center, zoom, { animate: false });
  }, [map, center[0], center[1], zoom]);

  // Nudge focus on new locate point (even if zoom unchanged)
  React.useEffect(() => {
    if (!locateMarker) return;
    const target = [locateMarker.lat, locateMarker.lng];
    const nextZoom = Math.max(map.getZoom() ?? 0, 14);
    // flyTo is fine now that we’re inside the map context
    map.flyTo(target, nextZoom, { duration: 0.6 });
  }, [map, locateMarker?.lat, locateMarker?.lng]); // run when coords change

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
}) {
  // Resolve layer objects from ids
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
      {/* Base layer */}
      <TileLayer url={bottomLayer.url} attribution={bottomLayer.attribution} />

      {/* Top layer with opacity */}
      {topLayer && (
        <TileLayer
          url={topLayer.url}
          attribution={topLayer.attribution}
          opacity={opacity}
        />
      )}

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
