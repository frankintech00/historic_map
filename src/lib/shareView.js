const FIELDS = ["center", "zoom", "mode", "bottomLayer", "topLayer", "leftLayer", "rightLayer", "opacity", "activeSource"];

// Only recognised fields are restored; MapView validates their values.
export function readSharedView(hash) {
  try {
    const value = new URLSearchParams(hash.replace(/^#/, "")).get("view");
    if (!value || value.length > 4096) return null;
    const parsed = JSON.parse(value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") return null;
    return Object.fromEntries(FIELDS.filter((key) => Object.hasOwn(parsed, key)).map((key) => [key, parsed[key]]));
  } catch {
    return null;
  }
}

export function createShareUrl(href, state) {
  const url = new URL(href);
  const view = Object.fromEntries(FIELDS.map((key) => [key, state[key]]));
  url.hash = new URLSearchParams({ view: JSON.stringify(view) }).toString();
  return url.toString();
}
