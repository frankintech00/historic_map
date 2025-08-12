/**
 * ControlsBar.jsx
 * Locate (blue) → Zoom (+/−) → Mode toggle
 * - Blue pin anchors at the TIP (bottom centre)
 * - Marker/circle hidden below zoom 11
 */
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import bluePin from "../../assets/blue-pin.png";
import locateImg from "../../assets/location.png";
import zoomInImg from "../../assets/zoom-in.png";
import zoomOutImg from "../../assets/zoom-out.png";

export default function ControlsBar({
  mode = "single",
  onToggleMode,
  geolocateZoom = 16,
  geolocateHighAccuracy = true,
  position = "bottomleft",
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const CARD = 36;
    const ICON = 24;
    const MIN_VISIBLE_ZOOM = 11;

    const blueIcon = L.icon({
      iconUrl: bluePin,
      iconSize: [50, 60],
      iconAnchor: [25, 60], // bottom centre → pin tip sits on the point
      popupAnchor: [0, -54],
      shadowUrl: null,
    });

    const Controls = L.Control.extend({
      options: { position },
      onAdd: function () {
        const container = L.DomUtil.create("div", "leaflet-control");
        container.style.zIndex = "1100";
        const column = L.DomUtil.create(
          "div",
          "flex flex-col items-start gap-2 pb-1",
          container
        );

        const makeCard = (extra = "", parent = column) =>
          L.DomUtil.create(
            "div",
            [
              "bg-white/90", // 90% opacity
              "border",
              "border-slate-300",
              "rounded",
              "shadow",
              "pointer-events-auto",
              extra,
            ].join(" "),
            parent
          );

        const makeIconCard = ({ title, onClick, imgSrc }) => {
          const card = makeCard();
          card.style.width = `${CARD}px`;
          const btn = L.DomUtil.create(
            "a",
            "block flex items-center justify-center rounded outline-none focus:ring-2 focus:ring-sky-400 hover:bg-slate-50",
            card
          );
          btn.href = "#";
          btn.title = title;
          btn.setAttribute("aria-label", title);
          btn.style.width = `${CARD}px`;
          btn.style.height = `${CARD}px`;
          btn.innerHTML = `<img src="${imgSrc}" alt="" width="${ICON}" height="${ICON}" />`;
          L.DomEvent.on(btn, "click", (e) => {
            L.DomEvent.preventDefault(e);
            onClick?.();
          });
          return card;
        };

        L.DomEvent.disableClickPropagation(container);

        // Locate
        makeIconCard({
          title: "Find my location",
          onClick: () =>
            locateOnce({
              map,
              blueIcon,
              minZoom: MIN_VISIBLE_ZOOM,
              targetZoom: geolocateZoom,
              highAccuracy: geolocateHighAccuracy,
            }),
          imgSrc: locateImg,
        });

        // Zoom (+/−)
        const zoomCard = makeCard();
        zoomCard.style.width = `${CARD * 2}px`;
        const row = L.DomUtil.create(
          "div",
          "flex overflow-hidden rounded",
          zoomCard
        );
        const mkZoomBtn = (title, onClick, imgSrc, addRightBorder) => {
          const a = L.DomUtil.create(
            "a",
            "flex items-center justify-center hover:bg-slate-50 outline-none focus:ring-2 focus:ring-sky-400",
            row
          );
          a.href = "#";
          a.title = title;
          a.setAttribute("aria-label", title);
          a.style.width = `${CARD}px`;
          a.style.height = `${CARD}px`;
          if (addRightBorder) a.classList.add("border-r", "border-slate-200");
          a.innerHTML = `<img src="${imgSrc}" alt="" width="${ICON}" height="${ICON}" />`;
          L.DomEvent.on(a, "click", (e) => {
            L.DomEvent.preventDefault(e);
            onClick?.();
          });
          return a;
        };
        mkZoomBtn("Zoom in", () => map.zoomIn(), zoomInImg, true);
        mkZoomBtn("Zoom out", () => map.zoomOut(), zoomOutImg, false);

        // Mode toggle
        const toggleCard = makeCard("px-3 py-2");
        const label = L.DomUtil.create(
          "label",
          "flex items-center gap-3 select-none cursor-pointer",
          toggleCard
        );
        L.DomUtil.create("span", "text-xs font-medium", label).textContent =
          "Single";
        const switchBtn = L.DomUtil.create(
          "button",
          "relative inline-flex h-6 w-12 items-center rounded-full bg-black/10 outline-none focus:ring-2 focus:ring-black/30",
          label
        );
        switchBtn.type = "button";
        switchBtn.setAttribute("role", "switch");
        switchBtn.setAttribute("aria-label", "Toggle side-by-side view");
        switchBtn.setAttribute("aria-checked", String(mode === "split"));
        const knob = L.DomUtil.create(
          "span",
          "absolute h-4 w-4 rounded-full bg-black transition-transform",
          switchBtn
        );
        setKnob(knob, mode === "split");
        L.DomEvent.on(switchBtn, "click", (e) => {
          e.preventDefault();
          onToggleMode?.();
          const next = !(mode === "split");
          setKnob(knob, next);
          switchBtn.setAttribute("aria-checked", String(next));
        });
        L.DomEvent.on(switchBtn, "keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            switchBtn.click();
          }
        });
        L.DomUtil.create("span", "text-xs font-medium", label).textContent =
          "Side-by-Side";

        try {
          const corner = map._controlCorners?.[this.getPosition()];
          if (corner) corner.insertBefore(container, corner.firstChild);
        } catch {}
        return container;
      },
    });

    const ctl = new Controls({ position });
    ctl.addTo(map);

    return () => {
      try {
        ctl.remove();
      } catch {}
    };
  }, [map, mode, onToggleMode, geolocateZoom, geolocateHighAccuracy, position]);

  return null;
}

// helpers
function setKnob(node, split) {
  node.style.transform = split ? "translateX(28px)" : "translateX(4px)";
}

// geolocation with blue pin + visibility threshold
function locateOnce({ map, blueIcon, minZoom, targetZoom, highAccuracy }) {
  const overlay = L.layerGroup().addTo(map);
  let marker = null;
  let circle = null;

  const applyVisibility = () => {
    const visible = map.getZoom() >= minZoom;
    if (marker) marker.setOpacity(visible ? 1 : 0);
    if (circle)
      circle.setStyle({
        opacity: visible ? 1 : 0,
        fillOpacity: visible ? 0.15 : 0,
      });
  };

  const onFound = (e) => {
    const { lat, lng } = e.latlng;
    const acc = e.accuracy || 0;

    overlay.clearLayers();

    marker = L.marker([lat, lng], {
      icon: blueIcon,
      title: "You are here",
      alt: "Current location",
      opacity: 1,
    }).addTo(overlay);

    circle = L.circle([lat, lng], {
      radius: acc,
      weight: 1,
      color: "#0EA5E9",
      fillColor: "#38BDF8",
      fillOpacity: 0.15,
    }).addTo(overlay);

    const z = Math.max(map.getZoom(), targetZoom, minZoom);
    map.setView([lat, lng], z, { animate: true });

    applyVisibility();
    try {
      marker.setOpacity(0.6);
      setTimeout(() => marker.setOpacity(1), 150);
    } catch {}

    map.on("zoomend", applyVisibility);
    map.off("locationerror", onError);
    map.off("locationfound", onFound);
  };

  const onError = (err) => {
    console.warn("[ControlsBar] Geolocation error:", err?.message || err);
    map.off("locationfound", onFound);
    map.off("locationerror", onError);
  };

  map.on("locationfound", onFound);
  map.on("locationerror", onError);
  map.locate({
    setView: false,
    enableHighAccuracy: highAccuracy,
    watch: false,
    maxZoom: targetZoom,
  });
}
