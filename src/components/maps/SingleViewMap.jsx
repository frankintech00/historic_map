import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BASE_LAYERS } from "../../config/mapSources";
import ControlsBar from "../controls/ControlsBar.jsx";
import SearchPin from "../overlays/SearchPin.jsx";

/** Sync external center/zoom into the Leaflet map */
function ViewSync({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

/** Works for array or keyed object exports */
function getLayer(defs, id) {
  if (!defs) return undefined;
  if (Array.isArray(defs)) return defs.find((l) => l.id === id);
  return defs[id];
}

export default function SingleViewMap({
  center,
  zoom,
  style,
  bottomLayerId,
  topLayerId,
  opacity,
  searchMarker, // {lat, lng, label} | null
  mode,
  onToggleMode,
  onViewChange,
}) {
  const mapRef = useRef(null);

  const bottom = getLayer(BASE_LAYERS, bottomLayerId);
  const top = getLayer(BASE_LAYERS, topLayerId);

  return (
    <MapContainer
      ref={mapRef}
      center={center}
      zoom={zoom}
      style={style}
      zoomControl={false} // we use our own zoom buttons
      whenReady={() => {
        const map = mapRef.current;
        if (map) {
          map.on("moveend", () => {
            const c = map.getCenter();
            onViewChange?.([c.lat, c.lng], map.getZoom());
          });
        }
      }}
    >
      <ViewSync center={center} zoom={zoom} />

      {/* Bottom/base layer */}
      {bottom ? (
        <TileLayer url={bottom.url} attribution={bottom.attribution} />
      ) : null}

      {/* Optional top overlay with opacity */}
      {top && (!bottom || top.id !== bottom.id) ? (
        <TileLayer
          url={top.url}
          attribution={top.attribution}
          opacity={opacity}
        />
      ) : null}

      {/* Search pin (blue, hidden below zoom 11) */}
      {searchMarker && (
        <SearchPin
          lat={searchMarker.lat}
          lng={searchMarker.lng}
          label={searchMarker.label}
        />
      )}

      {/* Custom controls */}
      {/* <ControlsBar
        mode={mode}
        onToggleMode={onToggleMode}
        position="bottomleft"
      /> */}
    </MapContainer>
  );
}
