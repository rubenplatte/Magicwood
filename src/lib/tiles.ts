// Map tile layers. The CARTO subdomain is pinned (no {s} rotation) so the URLs
// the map requests are identical to the ones we pre-cache for offline use.
export const LAYERS = {
  map: {
    label: 'Map',
    url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
    minZoom: 1,
    maxZoom: 20,
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri',
    minZoom: 1,
    maxZoom: 19,
  },
} as const;

export type LayerKey = keyof typeof LAYERS;

export function lngLatToTile(lng: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x: Math.max(0, Math.min(n - 1, x)), y: Math.max(0, Math.min(n - 1, y)) };
}

export function tileUrl(layer: LayerKey, z: number, x: number, y: number) {
  return LAYERS[layer].url
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y));
}

export interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Every tile URL covering `bounds` for a layer across the given zoom range.
export function tilesForBounds(
  layer: LayerKey,
  bounds: Bounds,
  minZoom: number,
  maxZoom: number
): string[] {
  const urls: string[] = [];
  const max = Math.min(maxZoom, LAYERS[layer].maxZoom);
  for (let z = minZoom; z <= max; z++) {
    const a = lngLatToTile(bounds.minLng, bounds.maxLat, z); // top-left
    const b = lngLatToTile(bounds.maxLng, bounds.minLat, z); // bottom-right
    for (let x = a.x; x <= b.x; x++) {
      for (let y = a.y; y <= b.y; y++) {
        urls.push(tileUrl(layer, z, x, y));
      }
    }
  }
  return urls;
}
