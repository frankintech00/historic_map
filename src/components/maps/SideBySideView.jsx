import React, { useEffect, useRef } from "react";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet-side-by-side";
import { BASE_LAYERS } from "../../config/mapSources";
import ControlsBar from "../controls/ControlsBar.jsx";
import SearchPin from "../overlays/SearchPin.jsx";

// Add tiny equality helpers to avoid feedback loops
const EPS = 1e-6;
const approxEqual = (a, b, eps = EPS) => Math.abs(a - b) <= eps;

/** Keep external centre/zoom applied to Leaflet */
function ViewSync({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    const cur = map.getCenter();
    const curZoom = map.getZoom();
    const sameCenter =
      approxEqual(cur.lat, center[0]) && approxEqual(cur.lng, center[1]);
    const sameZoom = curZoom === zoom;
    if (sameCenter && sameZoom) return; // no-op, prevents moveend loop
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

/** Bubble move events back up to MapView */
function MapEvents({ onViewChange }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => {
      const c = map.getCenter();
      onViewChange?.([c.lat, c.lng], map.getZoom());
    };
    map.on("moveend", handler);
    return () => map.off("moveend", handler);
  }, [map, onViewChange]);
  return null;
}

/** Resolve layer by id from either an array or object export */
function getLayer(defs, id) {
  if (!defs) return undefined;
  if (Array.isArray(defs)) return defs.find((l) => l.id === id);
  return defs[id];
}

/** Imperatively attach leaflet-side-by-side once the map is ready */
function SideBySideLayers({ leftLayerId, rightLayerId }) {
  const map = useMap();
  const layersRef = useRef({ left: null, right: null, ctrl: null });

  // Ensure the map paints immediately when this mode mounts
  useEffect(() => {
    // tiny delay helps when switching views so the container has size
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map]);

  useEffect(() => {
    const tearDown = () => {
      const { left, right, ctrl } = layersRef.current;
      if (ctrl) {
        try {
          ctrl.remove();
        } catch {}
        layersRef.current.ctrl = null;
      }
      if (left) {
        try {
          map.removeLayer(left);
        } catch {}
        layersRef.current.left = null;
      }
      if (right) {
        try {
          map.removeLayer(right);
        } catch {}
        layersRef.current.right = null;
      }
    };

    // Build fresh layers + control
    const leftDef = getLayer(BASE_LAYERS, leftLayerId);
    const rightDef = getLayer(BASE_LAYERS, rightLayerId);
    if (!leftDef || !rightDef) {
      console.error("[SideBySideView] Missing layer def", {
        leftLayerId,
        rightLayerId,
        leftDef,
        rightDef,
      });
      tearDown();
      return () => tearDown();
    }

    const leftTL = L.tileLayer(leftDef.url, {
      attribution: leftDef.attribution,
      // noWrap avoids edge tile explosions near the antimeridian
      noWrap: true,
      // honour provider native zooms if present
      maxNativeZoom: leftDef.maxNativeZoom ?? undefined,
      minNativeZoom: leftDef.minNativeZoom ?? undefined,
    });

    const rightTL = L.tileLayer(rightDef.url, {
      attribution: rightDef.attribution,
      noWrap: true,
      maxNativeZoom: rightDef.maxNativeZoom ?? undefined,
      minNativeZoom: rightDef.minNativeZoom ?? undefined,
    });

    leftTL.addTo(map);
    rightTL.addTo(map);

    const control = L.control.sideBySide(leftTL, rightTL).addTo(map);
    layersRef.current = { left: leftTL, right: rightTL, ctrl: control };

    // After the control is added, ensure layout is correct
    map.invalidateSize();

    return () => tearDown();
  }, [map, leftLayerId, rightLayerId]);

  return null;
}

export default function SideBySideView({
  center,
  zoom,
  style,
  leftLayerId,
  rightLayerId,
  searchMarker, // {lat, lng, label} | null
  mode = "split",
  onToggleMode,
  onViewChange,
}) {
  return (
    <MapContainer center={center} zoom={zoom} style={style} zoomControl={false}>
      <ViewSync center={center} zoom={zoom} />
      <MapEvents onViewChange={onViewChange} />
      <SideBySideLayers leftLayerId={leftLayerId} rightLayerId={rightLayerId} />

      {/* Search pin (blue, hidden below zoom 11) */}
      {searchMarker && (
        <SearchPin
          lat={searchMarker.lat}
          lng={searchMarker.lng}
          label={searchMarker.label}
        />
      )}

      {/* Custom controls */}
      <ControlsBar
        mode={mode}
        onToggleMode={onToggleMode}
        position="bottomleft"
      />
    </MapContainer>
  );
}
