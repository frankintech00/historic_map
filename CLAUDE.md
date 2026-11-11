# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Historic Map Comparison App** - A Progressive Web App for exploring historical and modern map layers of the UK, either as a transparent overlay on a single map or side-by-side with a draggable divider.

- **Data Sources**: National Library of Scotland (historic maps), MapTiler (modern tiles + geocoding), Historic Environment Scotland ArcGIS FeatureServers (Canmore, listed buildings, monuments, etc.)
- **Deployment**: Docker container on home server, secured with Cloudflare Access on private subdomain
- **Tech Stack**: React 19 + Vite 7, Leaflet 1.9 via react-leaflet 5, Tailwind CSS 3.4, lucide-react icons

## Developer Context

- **Developer**: Senior software engineer learning Claude Code features
- **Learning Goals**: Use this project to explore Claude Code capabilities (hooks, slash commands, skills, agents, teams) while making real improvements
- **Following**: YouTube tutorials on Claude Code - applying features as they're learned

## Development Commands

```bash
npm install        # install dependencies
npm run dev        # dev server (http://localhost:5173)
npm run lint       # ESLint (keep this clean)
npm run build      # production build
npm run preview    # preview production build

# Docker
docker build -t historic-map .
docker run -p 3000:3000 historic-map
```

## Project Structure

```
src/
├── components/
│   ├── maps/         # MapView (orchestrator/controller), SingleViewMap, SideBySideView
│   ├── layout/       # TopBar (brand, search, mode toggle, panel toggle)
│   ├── panels/       # LayerPanel (layer selects, opacity, data sources)
│   ├── controls/     # SearchBar, MapControlDock (zoom/locate/home)
│   ├── overlays/     # MarkerLayer (clustered API markers), DiscoveryLayer, SearchPin, LocatePin
│   └── discoveries/  # DiscoveryPanel (list/detail), DiscoveryForm, LocationPicker, PhotoImage
├── config/           # mapSources.js (tile layers), markerSources.js (ArcGIS sources)
├── adapters/         # hesArcGis.js (ArcGIS FeatureServer queries)
├── state/            # SearchBus.jsx, DiscoveryBus.js (popup → app), useDiscoveries.js
├── lib/              # discoveryDb (IndexedDB), discoveryModel, discoveryBackup (ZIP), imageCompress, tileOptions…
└── index.css         # ALL styling: Tailwind layers, hm-* components, Leaflet overrides
```

## Architecture Notes

- **MapView is the controller**: owns mode (single/split), view center/zoom, layer ids, opacity, active data source, and a `mapRef` to the live Leaflet instance (captured via `onMapReady` from either map view). All chrome (TopBar, LayerPanel, MapControlDock) is plain React floating above the map.
- **Map owns its view after mount**: `center`/`zoom` props only seed the map; state flows back via `onViewChange` so the view survives single↔split remounts. Programmatic moves (search, locate, home, zoom buttons) go through `mapRef` (`flyTo`, `zoomIn`…), never by pushing props into the map.
- **SearchBus**: SearchBar dispatches `search:goto` on a global EventTarget; MapView subscribes with `useSearchGoto`. Keeps search decoupled from the map.
- **Config-driven layers**: `mapSources.js` entries carry a `category: "modern" | "historic"` used to group UI selects (`groupedBaseLayers()`). `markerSources.js` entries carry a `color` used for pin/cluster tinting and panel swatches. Add new layers/sources by editing config only — no component changes needed.
- **Styling**: single design system in `src/index.css` with `hm-*` component classes (hm-surface, hm-select, hm-range, hm-cluster, hm-popup-*…). Palette: warm stone neutrals + `bronze` accent scale defined in `tailwind.config.js`. Leaflet chrome (popups, attribution, side-by-side divider) is restyled there too.
- **Raster layers**: `RasterLayer.jsx` draws any `mapSources.js` entry imperatively: plain XYZ (`url`), several tilesets as one (`sources: [{url, bounds}]`, e.g. LiDAR phases) or WMS (`wms: {layers, styles}`). It reports per-view tile coverage so MapView can show "Little or no imagery here". In compare view the side-by-side plugin clips only one Leaflet layer per side; `SideBySideView` mirrors that clip onto the other sub-layers.
- **My Discoveries is browser-only by design**: records and compressed photos live in IndexedDB (`lib/discoveryDb.js`); export/import is a ZIP of GeoJSON + photos (`lib/discoveryBackup.js`, via `fflate`). Do NOT add a backend, uploads or accounts for it. Imported data is untrusted: always pass it through `sanitiseDiscovery`.
- **Official record → personal note**: popups are HTML strings, so the "Add personal note" button talks to React through `DiscoveryBus`; a source needs an `idField` in `markerSources.js` for the button to appear.
- **MarkerLayer**: bbox-scoped, debounced, abortable ArcGIS fetches; clustered with leaflet.markercluster; popup HTML is built as strings for speed (escape user data via `escapeHtml`/`escapeAttr`).

## Current Features

- Single view: base map + historic overlay with opacity slider
- Compare view: side-by-side with draggable divider, independent layer choice per side
- Layer panel: desktop floating card / mobile bottom sheet; swap-layers button
- Search: MapTiler geocoding (GB), keyboard navigation (arrows/Enter/Escape), direct "lat, lng" coordinate entry
- Geolocation + home (reset view) in the control dock
- Data layers: 10 HES/Canmore sources, colour-coded pins & clusters, styled popups
- LiDAR (NLS multi-directional hillshade; Scottish Remote Sensing Portal DSM/DTM WMS), 1944–50 air photo mosaics, OS 25-inch and six-inch 1st edition, BGS geology
- My Discoveries: personal pins with notes/photos, linked to official records, ZIP backup/restore

## Environment Variables

Required:
- `VITE_MAPTILER_KEY` - MapTiler API key (tiles + geocoding), in `.env`

## Notes for Claude Code Instances

- Tests: `npm test` (node --test on `src/lib/*.test.js`; test files must not import modules that read `import.meta.env`, e.g. `mapSources.js`)
- This is a real, deployed project - changes should be tested (`npm run lint` + `npm run build` minimum) before deployment
- MapTiler API has rate limits - be mindful when testing
- ArcGIS FeatureServer queries are debounced/aborted to avoid overwhelming the service
- PWA features should maintain offline capability where possible
- Keep new UI consistent with the `hm-*` design system in `index.css`; don't reintroduce ad-hoc styles
