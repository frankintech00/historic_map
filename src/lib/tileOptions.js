// Leaflet's constructor options must be applied again when switching sources.
export function tileOptions(layer) {
  const { id: _id, name: _name, category: _category, ...options } = layer;
  return options;
}
