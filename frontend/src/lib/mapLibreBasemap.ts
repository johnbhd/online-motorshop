import type { Layer, Map as LeafletMap } from "leaflet";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  ALD_MAP_ATTRIBUTION,
  ALD_MAP_MAX_ZOOM,
  ALD_MAP_MIN_ZOOM,
  ALD_MAP_STYLE_URL,
} from "./mapConfig";

let workerConfigured = false;

export type AldMapBasemap = {
  layer: Layer;
  maplibre: MapLibreMap;
};

export async function addAldMapBasemap(
  map: LeafletMap,
): Promise<AldMapBasemap> {
  const [{ maplibreGL }, { setWorkerUrl }] = await Promise.all([
    import("@maplibre/maplibre-gl-leaflet"),
    import("maplibre-gl"),
  ]);

  if (!workerConfigured) {
    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
    workerConfigured = true;
  }

  const layer = maplibreGL({
    attributionControl: {
      customAttribution: ALD_MAP_ATTRIBUTION,
    },
    interactive: false,
    maxZoom: ALD_MAP_MAX_ZOOM,
    minZoom: ALD_MAP_MIN_ZOOM,
    style: ALD_MAP_STYLE_URL,
  }).addTo(map);

  return {
    layer,
    maplibre: layer.getMaplibreMap(),
  };
}
