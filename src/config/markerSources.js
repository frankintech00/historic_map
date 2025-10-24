// Central registry for external marker/data sources.

export const MARKER_SOURCES = {
  // CANMORE points — Terrestrial (layer 0)
  canmoreTerrestrial: {
    label: "Canmore Sites (Terrestrial)",
    type: "arcgis-feature",
    serviceUrl:
      "https://inspire.hes.scot/arcgis/rest/services/CANMORE/Canmore_Points/MapServer",
    layerId: 0,
    defaultWhere: "1=1",

    // This service does NOT support pagination; adapter will omit paging params.
    pageSize: 500, // ignored when pagination unsupported
    maxPages: 1, // ditto

    // Be conservative — Canmore is dense in cities.
    minFetchZoom: 8,

    // Field names per layer metadata
    fieldMap: {
      title: "NMRSNAME",
      subtitle: "COUNCIL",
      url: "URL",
    },

    attribution: "© Historic Environment Scotland (Canmore)",
    enableClustering: true,
    visibleByDefault: true,
  },

  // Keep the previous source available if you want to toggle later
  hesPropertiesInCare: {
    label: "HES Properties in Care (points)",
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
    visibleByDefault: false,
  },
};

export const DEFAULT_MARKER_SOURCE_KEYS = ["canmoreTerrestrial"];
