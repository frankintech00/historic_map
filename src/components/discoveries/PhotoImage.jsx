import React, { useEffect, useState } from "react";
import { getPhoto } from "../../lib/discoveryDb.js";

/**
 * PhotoImage — shows a stored photograph (by id) or an unsaved one (by blob).
 * Images are read from IndexedDB only when rendered, and the object URL is
 * released when the component goes away.
 *
 * Props: id?, blob?, full (false = thumbnail), alt, className
 */
export default function PhotoImage({ id, blob, full = false, alt = "", className = "" }) {
  const [url, setUrl] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    (async () => {
      try {
        const source = blob || (await getPhoto(id).then((row) => (full ? row?.blob : row?.thumb || row?.blob)));
        if (cancelled) return;
        if (!source) {
          setMissing(true);
          return;
        }
        objectUrl = URL.createObjectURL(source);
        setUrl(objectUrl);
      } catch {
        if (!cancelled) setMissing(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, blob, full]);

  if (missing) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 text-[10px] text-stone-400 ${className}`}>
        Photo unavailable
      </div>
    );
  }
  if (!url) return <div className={`animate-pulse bg-stone-100 ${className}`} aria-hidden />;
  return <img src={url} alt={alt} className={className} loading="lazy" decoding="async" />;
}
