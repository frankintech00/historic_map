function text(value) {
  return value == null ? "" : String(value).trim();
}

function escapeHtml(value) {
  return text(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function formatValue(value, format) {
  if (!text(value)) return "";
  if (format !== "date") return text(value);
  // ArcGIS dates are UTC epoch milliseconds; never infer dates from prose.
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(date);
}

function safeLink(value) {
  try {
    const url = new URL(text(value));
    return ["http:", "https:"].includes(url.protocol) ? escapeHtml(url.href) : "";
  } catch {
    return "";
  }
}

export function buildMarkerPopup(source, properties = {}) {
  const fields = source.fieldMap || {};
  const title = text(properties[fields.title]) || "Site";
  const alt = text(properties[fields.altName]);
  const type = text(properties[fields.siteType]);
  const meta = [fields.subtitle, fields.county, fields.gridRef]
    .map((field) => text(properties[field])).filter(Boolean).map(escapeHtml).join(" · ");
  const details = (source.detailFields || []).flatMap(({ field, label, format }) => {
    const value = formatValue(properties[field], format);
    if (!value || value.toLowerCase() === title.toLowerCase()) return [];
    return [`<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`];
  }).join("");
  const href = safeLink(properties[fields.url]);

  return `<div>
    <div class="hm-popup-title">${escapeHtml(title)}</div>
    ${alt ? `<div class="hm-popup-subtitle">${escapeHtml(alt)}</div>` : ""}
    ${type ? `<span class="hm-popup-chip">${escapeHtml(type)}</span>` : ""}
    ${meta ? `<div class="hm-popup-meta">${meta}</div>` : ""}
    ${details ? `<dl class="hm-popup-details">${details}</dl>` : ""}
    <div class="hm-popup-source">${escapeHtml(source.attribution || source.label || "")}</div>
    ${href ? `<a href="${href}" class="hm-popup-link" target="_blank" rel="noopener noreferrer">View full record →</a>` : ""}
  </div>`;
}
