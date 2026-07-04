import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Leaflet CSS + icon compatibility (before app styles so ours win)
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
