/**
 * imageCompress.js — shrink camera photos before they go into IndexedDB.
 * Phone photos are 3–12 MB; a 1600px JPEG is ~300–500 KB and plenty for notes.
 * Decoding with `imageOrientation: "from-image"` applies the EXIF rotation, so
 * portrait shots stay upright after re-encoding.
 */

export const MAX_INPUT_BYTES = 40 * 1024 * 1024;
const FULL_EDGE = 1600;
const THUMB_EDGE = 320;

async function decode(blob) {
  if ("createImageBitmap" in globalThis) {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // fall through to <img> decoding (older Safari, unusual formats)
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function render(source, maxEdge, quality) {
  const width = source.width || source.naturalWidth;
  const height = source.height || source.naturalHeight;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // flatten transparency (PNG/WebP) onto white
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process the photograph."))),
      "image/jpeg",
      quality
    );
  });
}

/**
 * @param {Blob} file  image chosen by the user or read from a backup
 * @returns {Promise<{ blob: Blob, thumb: Blob }>} JPEG full image + thumbnail
 */
export async function compressImage(file) {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Only image files can be attached.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("That photograph is too large (over 40 MB).");
  }
  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error("This image format is not supported by your browser.");
  }
  try {
    const blob = await render(source, FULL_EDGE, 0.82);
    const thumb = await render(source, THUMB_EDGE, 0.7);
    return { blob, thumb };
  } finally {
    source.close?.();
  }
}
