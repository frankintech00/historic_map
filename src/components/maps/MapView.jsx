/**
 * MapView.jsx — orchestrates Single vs Side-by-Side modes.
 * Keeps view & layer state, delegates rendering to child components.
 */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { BASE_LAYERS } from "../../config/mapSources.js";
import SingleViewMap from "./SingleViewMap.jsx";
import SideBySideView from "./SideBySideView.jsx";
import LayerOpacityPanel from "../controls/LayerOpacityPanel.jsx";
import LayerSelectors from "../controls/LayerSelectors.jsx";

export default function MapView({ gotoPayload }) {
  const defaultCenter = useMemo(() => [55.8642, -4.2518], []);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);

  const [split, setSplit] = useState(false);

  const [bottomLayer, setBottomLayer] = useState("osm");
  const [topLayer, setTopLayer] = useState("opentopo");
  const [opacity, setOpacity] = useState(0.7);

  const [leftLayer, setLeftLayer] = useState("osm");
  const [rightLayer, setRightLayer] = useState("carto-voyager");

  // Search pin
  const [searchPoint, setSearchPoint] = useState(null);

  // Apply external "go to" commands coming from the header SearchBar
  useEffect(() => {
    if (!gotoPayload) return;
    const { lat, lng, label, zoom: z = 16 } = gotoPayload;
    const c = [lat, lng];
    setCenter(c);
    setZoom(z);
    setSearchPoint({ lat, lng, label });
  }, [gotoPayload]);

  const onViewChange = useCallback((c, z) => {
    setCenter(c);
    setZoom(z);
  }, []);

  const mode = split ? "split" : "single";
  const toggleMode = () => setSplit((s) => !s);

  return (
    <div className="relative h-full w-full">
      {split ? (
        <>
          <SideBySideView
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            leftLayerId={leftLayer}
            rightLayerId={rightLayer}
            searchMarker={searchPoint}
            mode={mode}
            onToggleMode={toggleMode}
            onViewChange={onViewChange}
          />

          {/* Split-mode selectors (top-left & top-right) */}
          <LayerSelectors
            leftLayer={leftLayer}
            rightLayer={rightLayer}
            onLeftChange={setLeftLayer}
            onRightChange={setRightLayer}
            layers={BASE_LAYERS}
          />
        </>
      ) : (
        <>
          <SingleViewMap
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            bottomLayerId={bottomLayer}
            topLayerId={topLayer}
            opacity={opacity}
            searchMarker={searchPoint}
            mode={mode}
            onToggleMode={toggleMode}
            onViewChange={onViewChange}
          />

          {/* Single-mode layer/opacity panel (top-right) */}
          <LayerOpacityPanel
            topLayer={topLayer}
            setTopLayer={setTopLayer}
            bottomLayer={bottomLayer}
            setBottomLayer={setBottomLayer}
            opacity={opacity}
            setOpacity={setOpacity}
          />
        </>
      )}
    </div>
  );
}
