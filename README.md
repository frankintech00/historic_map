# Historic Map Comparison App

A Progressive Web App (PWA) built with **React**, **Leaflet**, and **Tailwind CSS** for exploring Scotland through time by comparing historic and modern map layers. Supports both a **side-by-side slider view** and an **overlay transparency view**, with mobile-first controls and smooth performance across desktop and touch devices.

---

## Features

### Share a Map View
Use the share button to copy a link containing the current location, zoom, map layers, view mode, opacity and data overlay. Shared links take precedence over the recipient's saved view. If clipboard access is unavailable, select and copy the link manually.

### Side-by-Side Map Comparison
Interactive draggable slider with fully synchronised maps.

### Overlay Mode with Opacity Control
Single-view mode with historic overlays and adjustable transparency.

### Geolocation Support
User location marker with automatic centring across all view modes.

### Scotland-Focused Search
Search bar with UK results and automatic zoom.

### Data Layer Overlays

Marker popups show additional source details where available: site group, parish, record references, designation dates and location accuracy. Longer popups scroll on mobile. Missing values are omitted; designation and record-update dates are labelled separately from the site's historical period. The map feeds do not include full record narratives or photo collections.

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
| Conservation Areas | Areas of special architectural or historic interest |
| Historic Marine Protected Areas | Protected wrecks and marine historic assets |

All sources use live BBOX queries to ArcGIS FeatureServer with debounced, cancellable fetches and marker clustering. Polygon-geometry services (monuments, battlefields, etc.) are rendered as centroid markers.

---

## Map Layers

Every layer below can be chosen as the base map, the overlay (with the opacity slider) or either side of the compare view.

### Modern Basemaps
- OpenStreetMap
- CartoDB Light, Dark, Voyager
- OpenTopoMap
- MapTiler Satellite, Hybrid, Outdoor, Streets, Topo, Winter, Bright, Dataviz
- ESRI Satellite

### Historic Maps (National Library of Scotland)
| Layer | Period | Served by |
|---|---|---|
| Roy Military Survey (Highlands, Lowlands) | 1747–55 | NLS tiles |
| OS Six-Inch 1st edition | 1843–1882 | NLS tiles |
| OS 25-Inch (Scotland) | 1892–1914 | NLS tiles |
| OS Multi Scale 1888 | various | MapTiler |
| OS Six-Inch | 1888–1913 | MapTiler |
| OS One-Inch 'Hills' | 1885–1903 | MapTiler |
| OS Historical | 1919–1947 | MapTiler |
| OS 1:25k | 1937–1961 | MapTiler |
| OS One-Inch | 1955–1961 | MapTiler |

### Historical Aerial Photography
| Layer | Period | Coverage |
|---|---|---|
| OS Air Photo Mosaics | 1944–1950 | Scottish towns and selected surrounding areas only (for example Edinburgh, Stirling, Paisley and parts of Lanarkshire are covered; Renfrew and central Glasgow are not). Detail stops at zoom 15. |

This is the only openly served historical aerial layer found. Later decades (1950s–1990s) are held by the National Collection of Aerial Photography and Britain from Above as individual, licensed images with no open map service, so they are not included.

### LiDAR & Terrain
| Layer | What it shows | Source |
|---|---|---|
| LiDAR hillshade (DTM, multi-directional) | Bare-earth relief lit from several directions. The best layer for earthworks, ditches, old field systems, railway cuttings and features under trees. Detail to zoom 16. | NLS-hosted tiles built from Scottish Government LiDAR phases 1–6 and the Outer Hebrides survey |
| LiDAR surface model (DSM, elevation tint) | Heights including buildings and trees, coloured by elevation | Scottish Remote Sensing Portal WMS |
| LiDAR terrain model (DTM, elevation tint) | Bare-earth heights coloured by elevation | Scottish Remote Sensing Portal WMS |
| BGS bedrock geology 1:625k | Generalised bedrock geology of Great Britain | British Geological Survey WMS |

LiDAR does not cover all of Scotland. Where a layer has little or nothing to show, the app displays "Little or no imagery here for …" and the rest of the map carries on working.

Tip: put **LiDAR hillshade** on one side of the compare view and **OS 25-Inch** or the **air photo mosaics** on the other.

### Licensing and Attribution
| Data | Licence / terms | Attribution shown in the map |
|---|---|---|
| Scottish LiDAR (hillshade, DSM, DTM) | Open Government Licence v3 | Crown copyright Scottish Government, SEPA, Fugro and Scottish Water; hillshade processing by Richard Pearson (RVT), hosted by NLS |
| NLS historic maps and air photos | NLS re-use terms; personal, non-commercial use with attribution | National Library of Scotland |
| BGS 1:625k geology | Free for all uses with acknowledgement | Contains British Geological Survey materials © UKRI |
| HES / Canmore records | Open Government Licence | © Historic Environment Scotland |

The NLS-hosted tilesets (`mapseries-tilesets.s3.amazonaws.com`) are the ones the NLS viewer itself uses. They are not a guaranteed public API, so a layer may move or disappear; if that happens only that layer is affected. This app is private and non-commercial. Check with NLS before any commercial or public use.

---

## My Discoveries

Personal pins with notes and photographs, for recording what you find on the ground.

- **Add**: tap the dark pin button (bottom-left). Move the map under the crosshair and choose **Set here**, or choose **Use my GPS**. Then add a title, category, notes, the date observed and any photographs (**Take photo** opens the phone camera; **Add photos** selects several from the library).
- **View / edit / delete**: tap a star pin, or open **Layers → My Discoveries → Manage** for the list. Delete asks for confirmation. **Directions** opens Google Maps for that location.
- **Show / hide**: **Layers → My Discoveries → Show my pins**.
- **Link to an official record**: open any Canmore/HES marker and choose **Add personal note**. The note is stored with the record's reference; the official record is never changed. If a note already exists the button reads **View my note**, so duplicates are not created.

### Where the data lives

Everything is stored **only in the browser you are using**, in IndexedDB. Nothing is uploaded to the server: there is no backend, database or account. Each browser and device therefore has its own separate collection.

Photographs are resized to at most 1600 px and saved as JPEG (typically 300–500 KB each) with a small thumbnail, so the phone is not filled with full-size originals. Keep the originals in your camera roll if you want them.

**Browser data can be lost.** Clearing site data or browsing history, uninstalling the browser, using a private/incognito window, or moving to a new phone will remove your discoveries. iOS Safari may also clear data for sites not visited for several weeks unless the app is added to the Home Screen. The app asks the browser for persistent storage, but that is not a guarantee.

### Backup and restore

In **Layers → My Discoveries → Manage**:

- **Export backup (ZIP with photos)** saves `my-discoveries-backup-YYYY-MM-DD.zip` containing `discoveries.geojson` and a `photos/` folder. This is the complete backup.
- **GeoJSON** saves locations and notes only (no photos). It opens directly in QGIS, geojson.io and similar tools.
- **Import backup** accepts either file. Discoveries already on the device are skipped, a newer version of the same discovery replaces the older one, and importing the same file twice duplicates nothing.

To move to a new phone or browser: export a backup on the old one, transfer the ZIP yourself (for example through your own cloud drive), then import it on the new one. Export a backup after any trip you would not want to lose.

Imports are checked: only the expected files are read from the archive, every record is validated, and files that are not real images are ignored.

---

## Tech Stack

**Frontend:**
- React 19 + Vite
- Leaflet 1.9.4
- leaflet-side-by-side 2.2.0
- Tailwind CSS
- leaflet.markercluster

**Data Sources:**
- MapTiler API (modern + NLS historic tiles) — requires `VITE_MAPTILER_KEY`
- National Library of Scotland (via MapTiler)
- ArcGIS FeatureServer — Historic Environment Scotland (inspire.hes.scot)
- Canmore (RCAHMS) — archaeological sites
- NLS tilesets — Roy, OS six-inch 1st edition, OS 25-inch, air photo mosaics, LiDAR hillshade (no key)
- Scottish Remote Sensing Portal WMS (`srsp-ows.jncc.gov.uk/ows`) — LiDAR DSM/DTM (no key)
- British Geological Survey WMS — bedrock geology (no key)
- `fflate` — ZIP export/import of My Discoveries (the only new dependency)

**Deployment:**
- Docker containerised
- Hosted on home server
- Secured with Cloudflare Access on a private subdomain

---

## Project Structure

```
src/
 ├── adapters/hesArcGis.js          # ArcGIS query adapter (point + polygon centroid)
 ├── components/
 │    ├── maps/                     # MapView (controller), SingleViewMap, SideBySideView, RasterLayer
 │    ├── layout/TopBar.jsx
 │    ├── panels/LayerPanel.jsx
 │    ├── controls/                 # SearchBar, MapControlDock, OpacityControl
 │    ├── overlays/                 # MarkerLayer, DiscoveryLayer, SearchPin, LocatePin
 │    └── discoveries/              # DiscoveryPanel, DiscoveryForm, LocationPicker, PhotoImage
 ├── config/
 │     ├── mapSources.js            # all raster layers (XYZ, multi-tileset, WMS)
 │     └── markerSources.js         # all ArcGIS data sources
 ├── lib/                           # discoveryDb (IndexedDB), discoveryModel, discoveryBackup (ZIP),
 │                                  # imageCompress, tileOptions, markerPopup, shareView …
 └── state/                         # SearchBus, DiscoveryBus, useDiscoveries
```

### Adding a map layer

Edit `src/config/mapSources.js` only. A layer is one of:

- an XYZ tileset: `url: "https://…/{z}/{x}/{y}.png"`
- several tilesets drawn as one: `sources: [{ url, bounds? }, …]`
- a WMS service: `url: "<endpoint>"` plus `wms: { layers, styles?, format, transparent }`

Set `category` to `modern`, `historic`, `aerial` or `lidar`, and optionally `coverage: [[south, west], [north, east]]` for the "no imagery here" hint.

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

The app is a static site: one nginx container (`maps`, image `safeshares/maps:latest`, compose project `historic_map`) published on port 8090 and reached through Cloudflare. There is no backend, database or volume. My Discoveries lives in each browser, so rebuilding or restarting the container never touches personal data.

```bash
npm test && npm run lint && npm run build                     # check first
docker tag safeshares/maps:latest safeshares/maps:rollback    # keep the current image
docker compose up -d --build                                  # rebuild and replace the container
docker compose ps                                             # should report "healthy"
```

Set `VITE_MAPTILER_KEY` in `.env` before building. Compose passes it to Vite at build time; the key is included in the public frontend bundle, so restrict it by origin in the MapTiler dashboard. Environment files are excluded from the Docker build context.

**Rollback:** `docker tag safeshares/maps:rollback safeshares/maps:latest && docker compose up -d --no-build`

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| "Little or no imagery here for …" | The layer has no data at this place (LiDAR and air photos are patchy) or the provider is down. Try another layer or zoom out. |
| LiDAR DSM/DTM is slow or blank | The Scottish Remote Sensing Portal WMS is slow or unavailable. The hillshade layer is served separately and usually still works. |
| Historic MapTiler layers are blank | `VITE_MAPTILER_KEY` was missing at build time, or the MapTiler quota is used up. |
| An NLS layer stops loading everywhere | NLS has moved the tileset. Check the layer in the NLS viewer and update the URL in `mapSources.js`. |
| Photo will not attach | The browser cannot decode the format (some HEIC files on desktop). Take the photo from the app or convert it to JPEG. |
| "Saving failed (storage may be full)" | Free up device storage, or export a backup and delete old discoveries. |
| Discoveries missing | You are in a different browser, profile or private window, or site data was cleared. Import your latest backup. |
| Old version still showing after a deploy | Hard-refresh the page, or close and reopen the installed app. |

---

## Roadmap
- Former railways, stations and canals from OpenStreetMap (the public Overpass API took about 30 s per query when tested, so it needs a cached extract first)
- Geolocated archive photographs (Geograph / Wikimedia Commons)
- Later aerial photography if an openly licensed service appears
- Timeline slider for browsing map eras
- Offline tile bundles / service worker caching
- Measurement tools
