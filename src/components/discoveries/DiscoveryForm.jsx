import React, { useId, useRef, useState } from "react";
import { Camera, ImagePlus, MapPin, Trash2, Loader2, Link2 } from "lucide-react";
import { CATEGORIES, MAX_PHOTOS_PER_DISCOVERY, newId } from "../../lib/discoveryModel.js";
import { compressImage } from "../../lib/imageCompress.js";
import PhotoImage from "./PhotoImage.jsx";

/**
 * DiscoveryForm — create or edit one discovery.
 *
 * Props:
 *  - draft: starting values (see discoveryModel.js); photos may carry blobs
 *  - isNew
 *  - onSave(draft): Promise
 *  - onCancel()
 *  - onChangeLocation(draft): hand the in-progress draft back while the user
 *    re-picks the position on the map
 */
export default function DiscoveryForm({ draft, isNew, onSave, onCancel, onChangeLocation }) {
  const [form, setForm] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const ids = useId();
  const cameraRef = useRef(null);
  const libraryRef = useRef(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function addFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;
    setError("");
    setAdding(true);
    const added = [];
    const problems = [];
    for (const file of files) {
      if (form.photos.length + added.length >= MAX_PHOTOS_PER_DISCOVERY) {
        problems.push(`A discovery can hold up to ${MAX_PHOTOS_PER_DISCOVERY} photographs.`);
        break;
      }
      try {
        const { blob, thumb } = await compressImage(file);
        added.push({ id: newId(), caption: "", blob, thumb });
      } catch (e) {
        problems.push(`${file.name || "Photo"}: ${e.message}`);
      }
    }
    setForm((f) => ({ ...f, photos: [...f.photos, ...added] }));
    setError(problems.join(" "));
    setAdding(false);
  }

  function setCaption(id, caption) {
    setForm((f) => ({ ...f, photos: f.photos.map((p) => (p.id === id ? { ...p, caption } : p)) }));
  }

  function removePhoto(id) {
    setForm((f) => ({ ...f, photos: f.photos.filter((p) => p.id !== id) }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give the discovery a title.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(form);
    } catch (err) {
      setError(err?.message || "Could not save. Your device storage may be full.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3.5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor={`${ids}-title`} className="hm-label block">Title</label>
        <input
          id={`${ids}-title`}
          className="hm-input"
          value={form.title}
          onChange={set("title")}
          maxLength={200}
          placeholder="e.g. Estate wall near the old lodge"
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${ids}-category`} className="hm-label block">Category</label>
        <select id={`${ids}-category`} className="hm-select" value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${ids}-notes`} className="hm-label block">Notes</label>
        <textarea
          id={`${ids}-notes`}
          className="hm-input min-h-[6rem] resize-y"
          value={form.notes}
          onChange={set("notes")}
          maxLength={20000}
          placeholder="What did you find? Condition, access, sources…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={`${ids}-date`} className="hm-label block">Observed on</label>
          <input id={`${ids}-date`} type="date" className="hm-input" value={form.observedOn} onChange={set("observedOn")} />
        </div>
        <div className="space-y-1.5">
          <span className="hm-label block">Location</span>
          <button
            type="button"
            className="hm-btn w-full justify-start tabular-nums"
            onClick={() => onChangeLocation(form)}
            title="Change location on the map"
          >
            <MapPin size={15} className="shrink-0 text-bronze-600" aria-hidden />
            <span className="truncate">{form.lat.toFixed(5)}, {form.lng.toFixed(5)}</span>
          </button>
        </div>
      </div>

      {form.linkedRecord && (
        <div className="flex items-start gap-2 rounded-lg border border-bronze-200 bg-bronze-50 px-3 py-2 text-[12px] text-stone-700">
          <Link2 size={14} className="mt-0.5 shrink-0 text-bronze-600" aria-hidden />
          <span className="min-w-0 flex-1">
            Linked to <strong className="font-semibold">{form.linkedRecord.title || form.linkedRecord.id}</strong>
            {form.linkedRecord.sourceLabel ? ` (${form.linkedRecord.sourceLabel})` : ""}. The official record is not changed.
          </span>
          <button
            type="button"
            className="shrink-0 font-medium text-bronze-700 underline"
            onClick={() => setForm((f) => ({ ...f, linkedRecord: null }))}
          >
            Unlink
          </button>
        </div>
      )}

      {/* Photographs */}
      <div className="space-y-2">
        <span className="hm-label block">Photographs</span>
        {form.photos.length > 0 && (
          <ul className="space-y-2">
            {form.photos.map((photo) => (
              <li key={photo.id} className="flex items-center gap-2">
                <PhotoImage
                  id={photo.blob ? undefined : photo.id}
                  blob={photo.thumb || photo.blob}
                  alt={photo.caption || "Attached photograph"}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <input
                  className="hm-input"
                  value={photo.caption}
                  onChange={(e) => setCaption(photo.id, e.target.value)}
                  maxLength={300}
                  placeholder="Caption (optional)"
                  aria-label="Photograph caption"
                />
                <button
                  type="button"
                  className="hm-btn w-10 shrink-0 px-0"
                  onClick={() => removePhoto(photo.id)}
                  aria-label="Remove photograph"
                  title="Remove photograph"
                >
                  <Trash2 size={15} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <button type="button" className="hm-btn flex-1" onClick={() => cameraRef.current?.click()} disabled={adding}>
            {adding ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Camera size={16} aria-hidden />}
            Take photo
          </button>
          <button type="button" className="hm-btn flex-1" onClick={() => libraryRef.current?.click()} disabled={adding}>
            <ImagePlus size={16} aria-hidden /> Add photos
          </button>
        </div>
        {/* Hidden inputs: camera capture (phones) and multi-select library */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          data-testid="discovery-camera-input"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          data-testid="discovery-photo-input"
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
        <p className="text-[11px] leading-relaxed text-stone-400">
          Photos are resized and kept only in this browser — nothing is uploaded.
        </p>
      </div>

      {error && <p role="alert" className="text-[13px] text-red-700">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" className="hm-btn hm-btn-primary flex-1" disabled={busy || adding}>
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {isNew ? "Save discovery" : "Save changes"}
        </button>
        <button type="button" className="hm-btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
