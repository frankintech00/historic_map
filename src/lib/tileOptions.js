// Leaflet's constructor options must be applied again when switching sources.
export function tileOptions(layer) {
  const {
    id: _id, name: _name, category: _category,
    sources: _sources, wms: _wms, coverage: _coverage,
    ...options
  } = layer;
  return options;
}

/**
 * Break a configured layer into the Leaflet layers that draw it:
 * one WMS layer, one XYZ layer, or several XYZ tilesets shown as one.
 * Returns [{ kind: "xyz" | "wms", url, options }].
 */
export function layerParts(layer) {
  const { url, ...shared } = tileOptions(layer);
  if (layer.wms) return [{ kind: "wms", url, options: { ...shared, ...layer.wms } }];
  if (Array.isArray(layer.sources) && layer.sources.length > 0) {
    return layer.sources.map(({ url: sourceUrl, ...own }) => ({
      kind: "xyz",
      url: sourceUrl,
      options: { ...shared, ...own },
    }));
  }
  return [{ kind: "xyz", url, options: shared }];
}

/** True when a [lat, lng] point lies outside the layer's declared coverage box. */
export function outsideCoverage(layer, center) {
  if (!layer?.coverage || !Array.isArray(center)) return false;
  const [[south, west], [north, east]] = layer.coverage;
  const [lat, lng] = center;
  return lat < south || lat > north || lng < west || lng > east;
}
