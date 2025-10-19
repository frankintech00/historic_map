import React, { useEffect, useMemo, useState } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import bluePin from "../../assets/blue-pin.png";

/**
 * SearchPin
 * - Uses the same blue pin as geolocate
 * - Anchored at the TIP (bottom centre)
 * - Hidden below minZoom (default 11), just like ControlsBar's locate
 */
export default function SearchPin({ lat, lng, label, minZoom = 11 }) {
  const map = useMap();
  const [visible, setVisible] = useState(() =>
    map ? map.getZoom() >= minZoom : false
  );

  // One icon instance
  const icon = useMemo(
    () =>
      L.icon({
        iconUrl: bluePin,
        iconSize: [30, 30],
        iconAnchor: [15, 30], // tip of the pin sits on the coordinate
        popupAnchor: [0, -54],
        shadowUrl: null,
      }),
    []
  );

  // Update visibility on zoom changes
  useEffect(() => {
    if (!map) return;
    const onZoom = () => setVisible(map.getZoom() >= minZoom);
    onZoom(); // initial
    map.on("zoomend", onZoom);
    return () => map.off("zoomend", onZoom);
  }, [map, minZoom]);

  if (lat == null || lng == null) return null;
  if (!visible) return null;

  return (
    <Marker position={[lat, lng]} icon={icon}>
      {label ? <Popup>{label}</Popup> : null}
    </Marker>
  );
}
