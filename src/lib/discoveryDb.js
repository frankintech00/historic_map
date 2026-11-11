/**
 * discoveryDb.js — IndexedDB storage for My Discoveries.
 *
 * Everything stays in this browser: nothing here talks to a server.
 *   discoveries  { id, title, notes, ... photos: [{ id, caption }] }
 *   photos       { id, blob, thumb }   (compressed image + small thumbnail)
 */

const DB_NAME = "hm-discoveries";
const DB_VERSION = 1;

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!("indexedDB" in globalThis)) {
        reject(new Error("This browser cannot store discoveries (IndexedDB is unavailable)."));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("discoveries")) db.createObjectStore("discoveries", { keyPath: "id" });
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open local storage."));
      request.onblocked = () => reject(new Error("Local storage is in use by another tab."));
    });
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}

function asPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Saving failed."));
    tx.onabort = () => reject(tx.error || new Error("Saving failed (storage may be full)."));
  });
}

export async function listDiscoveries() {
  const db = await openDb();
  return asPromise(db.transaction("discoveries").objectStore("discoveries").getAll());
}

/**
 * Write records and their photos in one transaction.
 * @param {object[]} records           clean records to upsert
 * @param {{id, blob, thumb}[]} photos new photo rows
 * @param {string[]} removedPhotoIds   photo rows to delete
 */
export async function putDiscoveries(records, photos = [], removedPhotoIds = []) {
  const db = await openDb();
  const tx = db.transaction(["discoveries", "photos"], "readwrite");
  const finished = done(tx);
  photos.forEach((photo) => tx.objectStore("photos").put(photo));
  removedPhotoIds.forEach((id) => tx.objectStore("photos").delete(id));
  records.forEach((record) => tx.objectStore("discoveries").put(record));
  await finished;
}

export async function deleteDiscovery(record) {
  const db = await openDb();
  const tx = db.transaction(["discoveries", "photos"], "readwrite");
  const finished = done(tx);
  record.photos.forEach((photo) => tx.objectStore("photos").delete(photo.id));
  tx.objectStore("discoveries").delete(record.id);
  await finished;
}

/** @returns {Promise<{id, blob, thumb} | undefined>} */
export async function getPhoto(id) {
  const db = await openDb();
  return asPromise(db.transaction("photos").objectStore("photos").get(id));
}

/** Ask the browser not to evict our data under storage pressure (best effort). */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // not supported — the backup guidance in the UI still applies
  }
}
