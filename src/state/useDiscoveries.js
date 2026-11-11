import { useCallback, useEffect, useState } from "react";
import {
  listDiscoveries,
  putDiscoveries,
  deleteDiscovery,
  getPhoto,
  requestPersistence,
} from "../lib/discoveryDb.js";
import { sanitiseDiscovery, toGeoJSON, planImport, linkedKey } from "../lib/discoveryModel.js";
import { buildBackup, readBackup, sniffImageType } from "../lib/discoveryBackup.js";
import { compressImage } from "../lib/imageCompress.js";
import { setLinkedKeys } from "./DiscoveryBus.js";

const MAX_IMPORT_BYTES = 1024 * 1024 * 1024; // 1 GB

function byNewest(a, b) {
  return b.updatedAt.localeCompare(a.updatedAt);
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * useDiscoveries — the personal discoveries collection for this browser.
 * Loads records from IndexedDB once and keeps React state in step with writes.
 */
export function useDiscoveries() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const records = (await listDiscoveries()).map((r) => sanitiseDiscovery(r)).filter(Boolean);
      setItems(records.sort(byNewest));
      setError("");
    } catch (e) {
      setError(e?.message || "Could not read your discoveries.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Official-record popups ask whether a note already exists.
  useEffect(() => {
    setLinkedKeys(items.map((r) => linkedKey(r.linkedRecord)).filter(Boolean));
  }, [items]);

  /**
   * Create or update. `draft.photos` may hold new photos as
   * { id, caption, blob, thumb }; existing ones are just { id, caption }.
   */
  const save = useCallback(async (draft) => {
    const now = new Date().toISOString();
    const previous = items.find((r) => r.id === draft.id);
    const record = sanitiseDiscovery({
      ...draft,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
    }, now);
    if (!record) throw new Error("This discovery has no valid location.");

    const kept = new Set(record.photos.map((p) => p.id));
    const newPhotos = draft.photos
      .filter((p) => p.blob && kept.has(p.id))
      .map((p) => ({ id: p.id, blob: p.blob, thumb: p.thumb }));
    const removed = (previous?.photos || []).map((p) => p.id).filter((id) => !kept.has(id));

    await putDiscoveries([record], newPhotos, removed);
    requestPersistence();
    setItems((list) => [record, ...list.filter((r) => r.id !== record.id)].sort(byNewest));
    return record;
  }, [items]);

  const remove = useCallback(async (id) => {
    const record = items.find((r) => r.id === id);
    if (!record) return;
    await deleteDiscovery(record);
    setItems((list) => list.filter((r) => r.id !== id));
  }, [items]);

  const exportGeoJSON = useCallback(() => {
    const json = JSON.stringify(toGeoJSON(items), null, 2);
    download(new Blob([json], { type: "application/geo+json" }), `my-discoveries-${stamp()}.geojson`);
  }, [items]);

  const exportBackup = useCallback(async () => {
    const photoBytes = new Map();
    for (const record of items) {
      for (const photo of record.photos) {
        const row = await getPhoto(photo.id);
        if (row?.blob) photoBytes.set(photo.id, new Uint8Array(await row.blob.arrayBuffer()));
      }
    }
    const zip = buildBackup(items, photoBytes);
    download(new Blob([zip], { type: "application/zip" }), `my-discoveries-backup-${stamp()}.zip`);
    return { discoveries: items.length, photos: photoBytes.size };
  }, [items]);

  /** Import a ZIP backup or GeoJSON export. Returns counts for the UI. */
  const importFile = useCallback(async (file) => {
    if (file.size > MAX_IMPORT_BYTES) throw new Error("That file is too large to import (over 1 GB).");
    const { records, photos } = readBackup(new Uint8Array(await file.arrayBuffer()));
    const plan = planImport(items, records);

    const rows = [];
    const removed = [];
    const toWrite = [];
    let photoCount = 0;
    for (const incoming of [...plan.add, ...plan.update]) {
      const keptPhotos = [];
      for (const photo of incoming.photos) {
        const bytes = photos.get(photo.id);
        if (bytes) {
          try {
            const blob = new Blob([bytes], { type: sniffImageType(bytes) });
            const { thumb } = await compressImage(blob);
            rows.push({ id: photo.id, blob, thumb });
            keptPhotos.push(photo);
            photoCount += 1;
          } catch {
            // undecodable image — leave it out rather than store junk
          }
        } else if (await getPhoto(photo.id)) {
          keptPhotos.push(photo); // GeoJSON-only import: keep the photo we already hold
        }
      }
      const keptIds = new Set(keptPhotos.map((p) => p.id));
      const previous = items.find((r) => r.id === incoming.id);
      removed.push(...(previous?.photos || []).map((p) => p.id).filter((id) => !keptIds.has(id)));
      toWrite.push({ ...incoming, photos: keptPhotos });
    }

    if (toWrite.length > 0) {
      await putDiscoveries(toWrite, rows, removed);
      requestPersistence();
      await reload();
    }
    return {
      added: plan.add.length,
      updated: plan.update.length,
      skipped: plan.skipped,
      photos: photoCount,
    };
  }, [items, reload]);

  return { items, ready, error, save, remove, exportGeoJSON, exportBackup, importFile };
}
