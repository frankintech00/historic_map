/**
 * LocateControl.jsx
 * A minimal Leaflet-styled geolocation button.
 * - One click: request current location, pan/zoom, drop marker + accuracy circle.
 * - Uses the Leaflet "bar" UI to match built-in controls.
 */
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function LocateControl({
  position = "bottomright",
  zoom = 14,
  highAccuracy = true,
  className = "",
}) {
  const map = useMap();
  const controlRef = useRef(null);
  const layerRef = useRef(null); // holds marker + circle

  useEffect(() => {
    if (!map) return;

    // Layer group for marker + accuracy circle
    const layer = L.layerGroup().addTo(map);
    layerRef.current = layer;

    // Build a Leaflet control with a single button
    const Locate = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create(
          "div",
          `leaflet-bar ${className}`.trim()
        );
        container.style.background = "#fff";
        container.style.border = "1px solid rgba(0,0,0,0.2)";
        container.style.borderRadius = "4px";
        container.style.boxShadow = "0 1px 4px rgba(0,0,0,0.1)";

        const btn = L.DomUtil.create("a", "", container);
        btn.href = "#";
        btn.title = "Find my location";
        btn.setAttribute("aria-label", "Find my location");
        btn.style.width = "28px";
        btn.style.height = "28px";
        btn.style.lineHeight = "28px";
        btn.style.textAlign = "center";
        btn.style.display = "inline-block";

        // Simple SVG target icon
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 8a4 4 0 104 4 4 4 0 00-4-4zm9 3h-2.07A7.006 7.006 0 0013 5.07V3a1 1 0 00-2 0v2.07A7.006 7.006 0 005.07 11H3a1 1 0 000 2h2.07A7.006 7.006 0 0011 18.93V21a1 1 0 002 0v-2.07A7.006 7.006 0 0018.93 13H21a1 1 0 000-2z" fill="currentColor"/></svg>';

        // Prevent map from panning when clicking the control
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.on(btn, "click", (e) => {
          L.DomEvent.preventDefault(e);
          locateOnce();
        });

        return container;
      },
    });

    const control = new Locate({ position });
    control.addTo(map);
    controlRef.current = control;

    // Location events
    const onFound = (e) => {
      const { lat, lng } = e.latlng;
      const acc = e.accuracy || 0;

      // Clear old layers
      layer.clearLayers();

      // Marker
      const marker = L.marker([lat, lng], {
        title: "You are here",
        alt: "Current location",
      });

      // Accuracy circle
      const circle = L.circle([lat, lng], {
        radius: acc,
        weight: 1,
        fillOpacity: 0.1,
      });

      marker.addTo(layer);
      circle.addTo(layer);

      // Pan/zoom
      map.setView([lat, lng], Math.max(map.getZoom(), zoom), { animate: true });
    };

    const onError = (err) => {
      // Keep it quiet but visible in dev tools
      console.warn("[LocateControl] Geolocation error:", err?.message || err);
    };

    map.on("locationfound", onFound);
    map.on("locationerror", onError);

    function locateOnce() {
      // Trigger the browser geolocation prompt
      map.locate({
        setView: false, // we do our own setView after drawing layers
        enableHighAccuracy: highAccuracy,
        watch: false,
        maxZoom: zoom,
      });
    }

    return () => {
      map.off("locationfound", onFound);
      map.off("locationerror", onError);
      try {
        control.remove();
      } catch {}
      try {
        layer.remove();
      } catch {}
    };
  }, [map, position, zoom, highAccuracy, className]);

  return null; // control is imperative; nothing to render in React tree
}
