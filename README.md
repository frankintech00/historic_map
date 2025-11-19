# **Historic Map Comparison App**

A Progressive Web App (PWA) built with **React**, **Leaflet**, and **Tailwind CSS** for exploring places through time by comparing historic and modern map layers. The app supports both a **side-by-side slider view** and an **overlay transparency view**, with mobile-first controls and smooth performance across desktop and touch devices.

---

## **Features**

### **Side-by-Side Map Comparison**
Interactive draggable slider with fully synced maps.

### **Overlay Mode with Opacity Control**
Single-view mode with historic overlays and adjustable transparency.

### **Geolocation Support**
User location marker with automatic centring across all view modes.

### **UK-Focused Search**
Search bar with UK-only results and automatic zoom, dismissing results after selection.

### **Marker Clustering (ArcGIS / Canmore)**
Live BBOX queries to ArcGIS FeatureServer layers including:
- Canmore Terrestrial
- MultiPoint geometry handling
- Debounced and cancellable fetches
- Marker clustering for performance

---

## **Map Layers**

### **Modern Basemaps**
- OpenStreetMap
- MapTiler styles (Basic, Satellite, Terrain)

### **Historic Layers (National Library of Scotland)**
Integrated via **MapTiler with licensed API access**:
- OS Historic
- Additional NLS tilesets (configurable)

---

## **Tech Stack**

### **Frontend**
- React (Vite)
- Leaflet 1.9.4
- leaflet-side-by-side 2.2.0
- Tailwind CSS
- MarkerCluster
- ESRI-Leaflet

### **API Services**
- MapTiler (modern + historic tiles)
- NLS historic layers (via MapTiler)
- ArcGIS FeatureServer (Canmore)

### **Deployment**
- Docker containerised
- Hosted on home server
- Secured with Cloudflare Access on a private subdomain

---

## **Project Structure**

```
src/
 ├── components/
 │    ├── maps/
 │    │     ├── SingleViewMap.jsx
 │    │     ├── SideBySideView.jsx
 │    │     └── MarkerLayer.jsx
 │    ├── controls/
 │    │     ├── LayerSelectorsPanel.jsx
 │    │     ├── ModeToggle.jsx
 │    │     ├── OpacityControl.jsx
 │    │     └── SearchBar.jsx
 │    └── overlays/
 │          └── LocatePin.jsx
 ├── config/
 │     ├── mapSources.js
 │     └── markerSources.js
 ├── utils/
 │     └── hesArcGis.js
 └── App.jsx
```

---

## **Setup Instructions**

### 1. Install Dependencies
```
npm install
```

### 2. Environment Variables
Create `.env`:
```
VITE_MAPTILER_KEY=your_key_here
```

### 3. Run Dev Server
```
npm run dev
```

### 4. Build for Production
```
npm run build
```

---

## **Docker Deployment**

```
docker build -t historic-map-app .
docker run -p 8080:80 historic-map-app
```

---

## **Roadmap**
- Additional NLS layers
- More historic datasets
- Offline tile bundles
- Measurement tools
- User-saved markers and notes
