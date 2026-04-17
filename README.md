# Historic Map Comparison App

A Progressive Web App (PWA) built with **React**, **Leaflet**, and **Tailwind CSS** for exploring Scotland through time by comparing historic and modern map layers. Supports both a **side-by-side slider view** and an **overlay transparency view**, with mobile-first controls and smooth performance across desktop and touch devices.

---

## Features

### Side-by-Side Map Comparison
Interactive draggable slider with fully synchronised maps.

### Overlay Mode with Opacity Control
Single-view mode with historic overlays and adjustable transparency.

### Geolocation Support
User location marker with automatic centring across all view modes.

### Scotland-Focused Search
Search bar with UK results and automatic zoom.

### Data Layer Overlays
Radio-toggle data overlays from Historic Environment Scotland (HES) and Canmore — one layer active at a time for a clean map. Sources include:

| Layer | Coverage |
|---|---|
| Canmore Sites | Terrestrial archaeology (Scotland-wide) |
| Listed Buildings | Category A, B & C (Scotland) |
| Scheduled Monuments | Nationally important sites & monuments |
| Gardens & Designed Landscapes | Inventory of GDLs |
| Historic Battlefields | Inventory of Historic Battlefields |
| World Heritage Sites | UNESCO WHS in Scotland |
| Properties in Care | HES-managed properties open to the public |
| Scottish Radiocarbon Index | Radiocarbon-dated archaeological sites |

All sources use live BBOX queries to ArcGIS FeatureServer with debounced, cancellable fetches and marker clustering. Polygon-geometry services (monuments, battlefields, etc.) are rendered as centroid markers.

---

## Map Layers

### Modern Basemaps
- OpenStreetMap
- CartoDB Light, Dark, Voyager
- OpenTopoMap
- MapTiler Satellite, Outdoor, Streets, Topo, Winter
- ESRI Satellite

### Historic Layers (National Library of Scotland via MapTiler)
| Layer | Period |
|---|---|
| OS Multi Scale 1888 | Multi-scale (various) |
| OS Six-Inch | 1888–1913 |
| OS One-Inch 'Hills' | 1885–1903 |
| OS 1:25k | 1937–1961 |
| OS One-Inch | 1955–1961 |
| OS Historical | 1919–1947 |

---

## Tech Stack

**Frontend:**
- React 18 + Vite
- Leaflet 1.9.4
- leaflet-side-by-side 2.2.0
- Tailwind CSS
- leaflet.markercluster

**Data Sources:**
- MapTiler API (modern + NLS historic tiles) — requires `VITE_MAPTILER_KEY`
- National Library of Scotland (via MapTiler)
- ArcGIS FeatureServer — Historic Environment Scotland (inspire.hes.scot)
- Canmore (RCAHMS) — archaeological sites

**Deployment:**
- Docker containerised
- Hosted on home server
- Secured with Cloudflare Access on a private subdomain

---

## Project Structure

```
src/
 ├── adapters/
 │     └── hesArcGis.js         # ArcGIS query adapter (point + polygon centroid)
 ├── components/
 │    ├── maps/
 │    │     ├── MapView.jsx
 │    │     ├── SingleViewMap.jsx
 │    │     └── SideBySideView.jsx
 │    ├── controls/
 │    │     ├── LayerSelectorsPanel.jsx
 │    │     ├── LayerOpacityPanel.jsx
 │    │     ├── ControlsBar.jsx
 │    │     └── SearchBar.jsx
 │    ├── layout/
 │    │     ├── Header.jsx
 │    │     └── SidePopout.jsx
 │    └── overlays/
 │          ├── MarkerLayer.jsx
 │          ├── SearchPin.jsx
 │          └── LocatePin.jsx
 ├── config/
 │     ├── mapSources.js         # All raster tile layer definitions
 │     └── markerSources.js      # All ArcGIS data source definitions
 └── App.jsx
```

---

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local`:
```
VITE_MAPTILER_KEY=your_key_here
```

### 3. Run Dev Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## Docker Deployment

```bash
docker build -t historic-map .
docker run -p 3000:3000 historic-map
```

---

## Roadmap
- Additional historic tile sources (direct NLS tiles, RAF aerial photography)
- Timeline slider for browsing map eras
- Offline tile bundles / service worker caching
- Measurement tools
- User-saved markers and notes
- Conservation Areas and Marine Protected Areas overlays
