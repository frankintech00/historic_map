# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Historic Map Comparison App** - A Progressive Web App enabling users to explore historical and modern map layers of the UK side-by-side or via overlay transparency.

- **Data Sources**: National Library of Scotland (historic maps), MapTiler (modern/historic tiles), ArcGIS FeatureServer (Canmore dataset)
- **Deployment**: Docker container on home server, secured with Cloudflare Access on private subdomain
- **Tech Stack**: React + Vite, Leaflet.js, Tailwind CSS

## Developer Context

- **Developer**: Senior software engineer learning Claude Code features
- **Learning Goals**: Use this project to explore Claude Code capabilities (hooks, slash commands, skills, agents, teams) while making real improvements
- **Following**: YouTube tutorials on Claude Code - applying features as they're learned

## Tech Stack

**Frontend:**
- React 18 with Vite build tooling
- Leaflet 1.9.4 (mapping library)
- leaflet-side-by-side 2.2.0 (comparison plugin)
- Tailwind CSS (styling)
- MarkerCluster and ESRI-Leaflet libraries

**APIs & Data:**
- MapTiler API (requires `VITE_MAPTILER_KEY` env var)
- National Library of Scotland datasets
- ArcGIS FeatureServer (Canmore terrestrial data)
- OpenStreetMap basemaps

**Infrastructure:**
- Docker containerization
- Home server deployment
- Cloudflare Access security layer

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Docker build (if needed)
docker build -t historic-map .
docker run -p 3000:3000 historic-map
```

## Project Structure

```
src/
├── components/     # React components (maps, controls, overlays)
├── config/         # Configuration (mapSources, markerSources)
├── utils/          # Utilities (ArcGIS integration, helpers)
└── App.jsx         # Main application component
```

## Current Features

**Comparison Modes:**
- Interactive slider for side-by-side map viewing with synchronized panning
- Overlay mode with adjustable transparency controls

**User Features:**
- Geolocation detection with automatic centering
- UK-specific location search with auto-zoom
- Live marker clustering from ArcGIS FeatureServer
- Multipoint geometry handling with debounced, cancellable fetches

## Potential Enhancements (Map to Claude Code Learning)

**Testing & Quality** (Hooks)
- Pre-commit hooks for linting, type checking
- Pre-push hooks for test validation
- Automated bundle size checks

**Deployment Automation** (Slash Commands & Skills)
- Custom `/deploy` command for Docker build + home server deployment
- `/sync-maps` skill for updating map layer configurations
- `/test-apis` command to validate external data sources

**Performance & Monitoring** (Agents)
- Agent-based performance testing across different map layers
- Parallel API health checks for all data sources
- Automated lighthouse audits

**Feature Development**
- Additional historic map sources
- Timeline slider for different historical periods
- Offline-first PWA capabilities with service worker
- Screenshot/share functionality
- Custom map annotations

## Environment Variables

Required:
- `VITE_MAPTILER_KEY` - MapTiler API key for map tiles

## Notes for Claude Code Instances

- This is a real, deployed project - changes should be tested before deployment
- The home server deployment process may involve manual steps initially (good candidate for automation)
- MapTiler API has rate limits - be mindful when testing
- ArcGIS FeatureServer queries are debounced to avoid overwhelming the service
- PWA features should maintain offline capability where possible
