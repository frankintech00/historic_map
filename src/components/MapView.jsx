/**
 * MapView.jsx — orchestrates Single vs Side-by-Side modes.
 * Keeps view & layer state, delegates rendering to child components.
 */
import React, { useMemo, useState } from "react";
import { BASE_LAYERS } from "../config/mapSources.js";
import SingleViewMap from "./SingleViewMap.jsx";
import SideBySideView from "./SideBySideView.jsx";
import LayerOpacityPanel from "./LayerOpacityPanel.jsx";
import LayerSelectors from "./LayerSelectors.jsx";

export default function MapView() {
  const defaultCenter = useMemo(() => [55.8642, -4.2518], []);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(12);

  const [split, setSplit] = useState(false);

  const [bottomLayer, setBottomLayer] = useState("osm");
  const [topLayer, setTopLayer] = useState("opentopo");
  const [opacity, setOpacity] = useState(0.7);

  const [leftLayer, setLeftLayer] = useState("osm");
  const [rightLayer, setRightLayer] = useState("carto-voyager");

  return (
    <div className="relative h-screen w-full">
      {split ? (
        <>
          <SideBySideView
            center={center}
            zoom={zoom}
            leftLayerId={leftLayer}
            rightLayerId={rightLayer}
            mode="split"
            onToggleMode={() => setSplit((s) => !s)}
            onViewChange={(c, z) => {
              setCenter(c);
              setZoom(z);
            }}
          />
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
            bottomLayerId={bottomLayer}
            topLayerId={topLayer}
            opacity={opacity}
            mode="single"
            onToggleMode={() => setSplit((s) => !s)}
            onViewChange={(c, z) => {
              setCenter(c);
              setZoom(z);
            }}
          />
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
      {/* Removed separate ModeToggle — it now lives inside ControlsBar */}
    </div>
  );
}
