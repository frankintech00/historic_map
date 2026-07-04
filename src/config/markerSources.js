// Central registry for external marker/data sources.
// centroidFromGeometry: true  → adapter computes point from polygon ring centroid

export const MARKER_SOURCES = {
  canmoreTerrestrial: {
    label: "Canmore Sites",
    description: "Historic Scotland terrestrial archaeology",
    color: "#b06424",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/CANMORE/Canmore_Points/MapServer",
    layerId: 0,
    defaultWhere: "1=1",
    pageSize: 500,
    maxPages: 1,
    minFetchZoom: 8,
    fieldMap: {
      title: "NMRSNAME",
      altName: "ALTNAME",
      siteType: "SITETYPE",
      subtitle: "COUNCIL",
      county: "COUNTY",
      gridRef: "GRIDREF",
      url: "URL",
    },
    attribution: "© Historic Environment Scotland (Canmore)",
    enableClustering: true,
  },

  hesListedBuildings: {
    label: "Listed Buildings",
    description: "Category A, B & C listed buildings (Scotland)",
    color: "#1d4ed8",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/HES/Listed_Buildings/MapServer",
    layerId: 0,
    defaultWhere: "1=1",
    pageSize: 1000,
    maxPages: 1,
    minFetchZoom: 10,
    fieldMap: {
      title: "ENT_TITLE",
      subtitle: "LOCAL_AUTH",
      siteType: "CATEGORY",
      url: "LINK",
    },
    attribution: "© Historic Environment Scotland",
    enableClustering: true,
  },

  hesScheduledMonuments: {
    label: "Scheduled Monuments",
    description: "Nationally important archaeological sites & monuments",
    color: "#b91c1c",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/HES/Scheduled_Monuments/MapServer",
    layerId: 0,
    centroidFromGeometry: true,
    defaultWhere: "1=1",
    pageSize: 1000,
    maxPages: 1,
    minFetchZoom: 7,
    fieldMap: {
      title: "DES_TITLE",
      subtitle: "LOCAL_AUTH",
      siteType: "CATEGORY",
      url: "LINK",
    },
    attribution: "© Historic Environment Scotland",
    enableClustering: true,
  },

  hesGardens: {
    label: "Gardens & Designed Landscapes",
    description: "Inventory of Gardens and Designed Landscapes",
    color: "#15803d",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/HES/Gardens_and_Designed_Landscapes/MapServer",
    layerId: 0,
    centroidFromGeometry: true,
    defaultWhere: "1=1",
    pageSize: 500,
    maxPages: 1,
    minFetchZoom: 7,
    fieldMap: {
      title: "DES_TITLE",
      subtitle: "LOCAL_AUTH",
      url: "LINK",
    },
    attribution: "© Historic Environment Scotland",
    enableClustering: true,
  },

  hesBattlefields: {
    label: "Historic Battlefields",
    description: "Inventory of Historic Battlefields in Scotland",
    color: "#7c3aed",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/HES/Battlefields_Inventory_Boundary/MapServer",
    layerId: 0,
    centroidFromGeometry: true,
    defaultWhere: "1=1",
    pageSize: 100,
    maxPages: 1,
    minFetchZoom: 5,
    fieldMap: {
      title: "DES_TITLE",
      subtitle: "LOCAL_AUTH",
      url: "LINK",
    },
    attribution: "© Historic Environment Scotland",
    enableClustering: false,
  },

  hesWorldHeritage: {
    label: "World Heritage Sites",
    description: "UNESCO World Heritage Sites in Scotland",
    color: "#0e7490",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/HES/World_Heritage_Sites/MapServer",
    layerId: 0,
    centroidFromGeometry: true,
    defaultWhere: "1=1",
    pageSize: 50,
    maxPages: 1,
    minFetchZoom: 1,
    fieldMap: {
      title: "DES_TITLE",
      subtitle: "LOCAL_AUTH",
      url: "LINK",
    },
    attribution: "© Historic Environment Scotland",
    enableClustering: false,
  },

  hesPropertiesInCare: {
    label: "Properties in Care",
    description: "HES managed historic properties open to the public",
    color: "#be185d",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/HES/Properties_in_care_points/MapServer",
    layerId: 0,
    defaultWhere: "1=1",
    pageSize: 500,
    maxPages: 1,
    minFetchZoom: 7,
    fieldMap: {
      title: "PIC_NAME",
      subtitle: "LOCAL_AUTH",
      url: "LINK",
    },
    attribution: "© Historic Environment Scotland",
    enableClustering: true,
  },

  scottishRadiocarbon: {
    label: "Scottish Radiocarbon Index",
    description: "Radiocarbon-dated archaeological sites and samples",
    color: "#4d7c0f",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/CANMORE/Scottish_Radiocarbon_Index/MapServer",
    layerId: 0,
    defaultWhere: "1=1",
    pageSize: 500,
    maxPages: 1,
    minFetchZoom: 8,
    fieldMap: {
      title: "NMRSNAME",
      altName: "ALTNAME",
      siteType: "SITETYPE",
      subtitle: "COUNCIL",
      county: "COUNTY",
      gridRef: "GRIDREF",
      url: "URL",
    },
    attribution: "© Historic Environment Scotland (Canmore)",
    enableClustering: true,
  },
};

export const DEFAULT_MARKER_SOURCE_KEY = "canmoreTerrestrial";
