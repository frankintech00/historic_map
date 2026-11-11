import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { layerParts } from "../../lib/tileOptions.js";

/**
 * RasterLayer
 * -----------
 * Draws one configured map layer (XYZ, multi-tileset or WMS) on the map.
 *
 * Props:
 *  - layer: entry from mapSources.js
 *  - opacity, zIndex
 *  - onLayers(leafletLayers): live Leaflet layers (used by the compare divider)
 *  - onCoverage(layerId, hasImagery): reported after tiles settle, so the UI can
 *    say when a layer has little or nothing to show for the current view
 */
export default function RasterLayer({ layer, opacity = 1, zIndex, onLayers, onCoverage }) {
  const map = useMap();
  const layersRef = useRef([]);

  useEffect(() => {
    const layers = layerParts(layer).map(({ kind, url, options }) =>
      kind === "wms"
        ? L.tileLayer.wms(url, { ...options, zIndex })
        : L.tileLayer(url, { ...options, zIndex })
    );

    // Tile bookkeeping, per tile position (a multi-tileset layer only needs one
    // of its tilesets to answer). Mostly-missing views mean "no imagery here".
    let covered = new Set();
    let missing = new Set();
    let timer;
    const key = (e) => `${e.coords.z}/${e.coords.x}/${e.coords.y}`;
    const settle = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const gaps = [...missing].filter((k) => !covered.has(k)).length;
        const total = covered.size + gaps;
        if (total > 0) onCoverage?.(layer.id, covered.size >= total / 2);
      }, 1200);
    };
    const onLoad = (e) => { covered.add(key(e)); settle(); };
    const onError = (e) => { missing.add(key(e)); settle(); };
    const reset = () => { covered = new Set(); missing = new Set(); };

    layers.forEach((l) => {
      l.on("tileload", onLoad);
      l.on("tileerror", onError);
      l.addTo(map);
    });
    map.on("movestart", reset);
    layersRef.current = layers;
    onLayers?.(layers);

    return () => {
      clearTimeout(timer);
      map.off("movestart", reset);
      layers.forEach((l) => {
        l.off("tileload", onLoad);
        l.off("tileerror", onError);
        map.removeLayer(l);
      });
      layersRef.current = [];
      onLayers?.([]);
    };
  }, [map, layer, zIndex, onLayers, onCoverage]);

  useEffect(() => {
    layersRef.current.forEach((l) => l.setOpacity(opacity));
  }, [opacity, layer]);

  return null;
}
