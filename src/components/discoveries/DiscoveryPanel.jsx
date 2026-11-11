import React, { useRef, useState } from "react";
import {
  X, ChevronLeft, MapPin, Navigation, Pencil, Trash2, Download, Upload,
  ExternalLink, Loader2, MapPinPlus, TriangleAlert,
} from "lucide-react";
import { categoryLabel } from "../../lib/discoveryModel.js";
import DiscoveryForm from "./DiscoveryForm.jsx";
import PhotoImage from "./PhotoImage.jsx";

/**
 * DiscoveryPanel — My Discoveries UI: list & backup, detail, and the form.
 * Desktop: floating card on the left. Mobile: bottom sheet.
 *
 * Props:
 *  - view: "list" | "detail" | "form"
 *  - store: result of useDiscoveries()
 *  - selected: record shown in detail view
 *  - draft / isNew: form state
 *  - onClose, onOpenList, onSelect(id), onAdd, onEdit(record), onShowOnMap(record)
 *  - onSave(draft), onCancelForm, onChangeLocation(draft), onDeleted
 */
export default function DiscoveryPanel({
  view, store, selected, draft, isNew,
  onClose, onOpenList, onSelect, onAdd, onEdit, onShowOnMap,
  onSave, onCancelForm, onChangeLocation, onDeleted,
}) {
  const title =
    view === "form" ? (isNew ? "New discovery" : "Edit discovery")
    : view === "detail" ? "Discovery"
    : "My Discoveries";

  return (
    <aside
      role="dialog"
      aria-label={title}
      className="z-[1100] max-md:fixed max-md:inset-x-0 max-md:bottom-0 md:absolute md:left-16 md:top-[4.25rem] md:w-[23rem]"
    >
      <div className="hm-surface flex max-h-[78vh] flex-col overflow-hidden !bg-white/95 max-md:rounded-b-none md:max-h-[calc(100vh-6rem)]">
        <div className="flex items-center gap-1 px-3 pb-1 pt-3">
          {view === "detail" && (
            <button type="button" onClick={onOpenList} aria-label="Back to list" className="hm-icon-btn !h-8 !w-8 rounded-full">
              <ChevronLeft size={18} />
            </button>
          )}
          <h2 className="flex-1 px-1 font-display text-base font-semibold text-stone-900">{title}</h2>
          <button
            type="button"
            onClick={view === "form" ? onCancelForm : onClose}
            aria-label="Close"
            className="hm-icon-btn !h-8 !w-8 rounded-full"
          >
            <X size={16} />
          </button>
        </div>

        <div className="hm-scroll flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
          {view === "form" && draft && (
            <DiscoveryForm
              key={draft.id}
              draft={draft}
              isNew={isNew}
              onSave={onSave}
              onCancel={onCancelForm}
              onChangeLocation={onChangeLocation}
            />
          )}
          {view === "detail" && selected && (
            <Detail
              key={selected.id}
              record={selected}
              onEdit={() => onEdit(selected)}
              onShowOnMap={() => onShowOnMap(selected)}
              onDelete={async () => {
                await store.remove(selected.id);
                onDeleted();
              }}
            />
          )}
          {view === "detail" && !selected && (
            <p className="py-6 text-center text-sm text-stone-500">This discovery no longer exists.</p>
          )}
          {view === "list" && (
            <List store={store} onSelect={onSelect} onAdd={onAdd} />
          )}
        </div>
      </div>
    </aside>
  );
}

/* ---------------- detail ---------------- */

function formatDate(iso, withTime = false) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function Detail({ record, onEdit, onShowOnMap, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${record.lat},${record.lng}`;

  return (
    <div className="space-y-3.5">
      <div>
        <h3 className="font-display text-lg font-semibold leading-snug text-stone-900">{record.title}</h3>
        <span className="mt-1.5 inline-block rounded-full bg-stone-900 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
          {categoryLabel(record.category)}
        </span>
      </div>

      {record.notes && (
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-stone-700">{record.notes}</p>
      )}

      {record.photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-1.5">
          {record.photos.map((photo) => (
            <li key={photo.id}>
              <button
                type="button"
                className="block w-full overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze-500"
                onClick={() => setLightbox(photo)}
                aria-label={photo.caption ? `View photograph: ${photo.caption}` : "View photograph"}
              >
                <PhotoImage id={photo.id} alt={photo.caption} className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {record.linkedRecord && (
        <div className="rounded-lg border border-bronze-200 bg-bronze-50 px-3 py-2 text-[12px] text-stone-700">
          <div className="hm-label mb-0.5">Official record</div>
          {record.linkedRecord.url ? (
            <a href={record.linkedRecord.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-bronze-700 underline">
              {record.linkedRecord.title || record.linkedRecord.id} <ExternalLink size={12} aria-hidden />
            </a>
          ) : (
            <span className="font-semibold">{record.linkedRecord.title || record.linkedRecord.id}</span>
          )}
          <div className="text-stone-500">
            {[record.linkedRecord.sourceLabel, record.linkedRecord.id].filter(Boolean).join(" · ")}
          </div>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-stone-200 pt-3 text-[12px]">
        {record.observedOn && (
          <div><dt className="text-stone-500">Observed</dt><dd className="text-stone-800">{formatDate(record.observedOn)}</dd></div>
        )}
        <div><dt className="text-stone-500">Location</dt><dd className="tabular-nums text-stone-800">{record.lat.toFixed(5)}, {record.lng.toFixed(5)}</dd></div>
        <div><dt className="text-stone-500">Created</dt><dd className="text-stone-800">{formatDate(record.createdAt, true)}</dd></div>
        <div><dt className="text-stone-500">Last changed</dt><dd className="text-stone-800">{formatDate(record.updatedAt, true)}</dd></div>
      </dl>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="hm-btn" onClick={onShowOnMap}>
          <MapPin size={15} aria-hidden /> Show on map
        </button>
        <a className="hm-btn" href={directions} target="_blank" rel="noopener noreferrer" title="Opens Google Maps with this location">
          <Navigation size={15} aria-hidden /> Directions
        </a>
        <button type="button" className="hm-btn" onClick={onEdit}>
          <Pencil size={15} aria-hidden /> Edit
        </button>
        <button type="button" className="hm-btn text-red-700" onClick={() => setConfirming(true)}>
          <Trash2 size={15} aria-hidden /> Delete
        </button>
      </div>

      {confirming && (
        <div role="alertdialog" aria-label="Confirm delete" className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[13px] text-red-900">
            Delete this discovery{record.photos.length > 0 ? ` and its ${record.photos.length} photograph${record.photos.length === 1 ? "" : "s"}` : ""}? This cannot be undone.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              className="hm-btn hm-btn-danger flex-1"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  await onDelete();
                } catch (e) {
                  setError(e?.message || "Could not delete.");
                  setDeleting(false);
                }
              }}
            >
              {deleting && <Loader2 size={15} className="animate-spin" aria-hidden />} Delete permanently
            </button>
            <button type="button" className="hm-btn" onClick={() => setConfirming(false)} disabled={deleting}>Keep</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-[13px] text-red-700">{error}</p>}

      {lightbox && (
        <div
          role="dialog"
          aria-label="Photograph"
          className="fixed inset-0 z-[1300] flex flex-col items-center justify-center bg-stone-950/95 p-3"
          onClick={() => setLightbox(null)}
        >
          <PhotoImage id={lightbox.id} full alt={lightbox.caption} className="max-h-[82vh] max-w-full rounded-lg object-contain" />
          {lightbox.caption && <p className="mt-3 max-w-prose text-center text-sm text-stone-200">{lightbox.caption}</p>}
          <button type="button" className="hm-btn mt-3" onClick={() => setLightbox(null)}>Close</button>
        </div>
      )}
    </div>
  );
}

/* ---------------- list + backup ---------------- */

function List({ store, onSelect, onAdd }) {
  const { items, ready, error } = store;
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");
  const fileRef = useRef(null);

  async function run(label, task) {
    setBusy(label);
    setMessage("");
    setProblem("");
    try {
      setMessage(await task());
    } catch (e) {
      setProblem(e?.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
  }

  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4">
      <button type="button" className="hm-btn hm-btn-primary w-full" onClick={onAdd}>
        <MapPinPlus size={16} aria-hidden /> Add discovery
      </button>

      {error && <p role="alert" className="text-[13px] text-red-700">{error}</p>}

      {ready && items.length === 0 && !error && (
        <p className="py-3 text-center text-[13px] leading-relaxed text-stone-500">
          No discoveries yet. Add one to record a place, your notes and photographs.
        </p>
      )}

      {items.length > 0 && (
        <ul className="-mx-1 space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" className="hm-radio-row items-center" onClick={() => onSelect(item.id)}>
                {item.photos[0] ? (
                  <PhotoImage id={item.photos[0].id} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-stone-900 text-amber-400" aria-hidden>
                    <MapPin size={16} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium leading-tight text-stone-800">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-stone-500">
                    {categoryLabel(item.category)} · {formatDate(item.observedOn || item.createdAt)}
                    {item.photos.length > 0 ? ` · ${plural(item.photos.length, "photo")}` : ""}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-2 border-t border-stone-200 pt-3">
        <span className="hm-label block">Backup &amp; restore</span>
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            Discoveries are stored only in this browser on this device. They are not uploaded or synced, and
            will be lost if you clear site data, uninstall the browser or change device. Export a backup regularly
            and keep it somewhere safe.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="hm-btn col-span-2"
            disabled={!!busy || items.length === 0}
            onClick={() => run("backup", async () => {
              const r = await store.exportBackup();
              return `Backup saved: ${r.discoveries === 1 ? "1 discovery" : `${r.discoveries} discoveries`}, ${plural(r.photos, "photo")}.`;
            })}
          >
            {busy === "backup" ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Download size={15} aria-hidden />}
            Export backup (ZIP with photos)
          </button>
          <button
            type="button"
            className="hm-btn"
            disabled={!!busy || items.length === 0}
            onClick={() => run("geojson", async () => {
              store.exportGeoJSON();
              return "GeoJSON saved (locations and notes, no photos).";
            })}
          >
            <Download size={15} aria-hidden /> GeoJSON
          </button>
          <button type="button" className="hm-btn" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            {busy === "import" ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Upload size={15} aria-hidden />}
            Import backup
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,.geojson,.json,application/zip,application/geo+json,application/json"
          className="hidden"
          data-testid="discovery-import-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            run("import", async () => {
              const r = await store.importFile(file);
              return `Import complete: ${r.added} added, ${r.updated} updated, ${r.skipped} already present (${plural(r.photos, "photo")} restored).`;
            });
          }}
        />
        {message && <p role="status" className="text-[12px] text-green-800">{message}</p>}
        {problem && <p role="alert" className="text-[12px] text-red-700">{problem}</p>}
      </section>
    </div>
  );
}
