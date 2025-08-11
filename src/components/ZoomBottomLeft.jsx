/**
 * ZoomBottomLeft.jsx — repositions Leaflet's zoom control to bottom-left.
 */
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function ZoomBottomLeft() {
  const map = useMap();

  useEffect(() => {
    const ctrl = L.control.zoom({ position: "bottomleft" });
    ctrl.addTo(map);
    return () => ctrl.remove();
  }, [map]);

  return null;
}
