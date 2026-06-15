import { sectors, boulders } from './data';
import { tilesForBounds, type Bounds } from './tiles';

const TILE_CACHE = 'mw-tiles';
const PHOTO_CACHE = 'mw-photos';
const OFFLINE_MIN_ZOOM = 13;
const OFFLINE_MAX_ZOOM = 18;

// Bounding box around all sectors, padded slightly so the edges aren't bare.
function cragBounds(): Bounds {
  const lats = sectors.map((s) => s.lat);
  const lngs = sectors.map((s) => s.lng);
  const pad = 0.004;
  return {
    minLat: Math.min(...lats) - pad,
    maxLat: Math.max(...lats) + pad,
    minLng: Math.min(...lngs) - pad,
    maxLng: Math.max(...lngs) + pad,
  };
}

// All small thumbnails (deduped) — the list view only ever needs these, so
// caching them makes the whole catalogue browsable offline for a few MB.
function thumbUrls(): string[] {
  return [...new Set(boulders.map((b) => b.thumb).filter((u): u is string => !!u))];
}

export function offlineUrlPlan(): { tiles: string[]; photos: string[] } {
  const bounds = cragBounds();
  const tiles = [
    ...tilesForBounds('map', bounds, OFFLINE_MIN_ZOOM, OFFLINE_MAX_ZOOM),
    ...tilesForBounds('satellite', bounds, OFFLINE_MIN_ZOOM, OFFLINE_MAX_ZOOM),
  ];
  return { tiles, photos: thumbUrls() };
}

export interface DownloadProgress {
  done: number;
  total: number;
  phase: 'tiles' | 'photos';
}

async function cacheAll(
  cacheName: string,
  urls: string[],
  phase: DownloadProgress['phase'],
  base: number,
  total: number,
  onProgress: (p: DownloadProgress) => void,
  concurrency = 6
) {
  const cache = await caches.open(cacheName);
  let i = 0;
  let done = 0;
  async function worker() {
    while (i < urls.length) {
      const url = urls[i++];
      try {
        const existing = await cache.match(url);
        if (!existing) {
          // no-cors → opaque response; CacheFirst serves these to <img>/tiles.
          const res = await fetch(url, { mode: 'no-cors', cache: 'no-store' });
          await cache.put(url, res);
        }
      } catch {
        /* skip failed tiles/photos; they'll just fetch live if reachable */
      }
      done++;
      onProgress({ done: base + done, total, phase });
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
}

export async function downloadOffline(onProgress: (p: DownloadProgress) => void) {
  const { tiles, photos } = offlineUrlPlan();
  const total = tiles.length + photos.length;
  onProgress({ done: 0, total, phase: 'tiles' });
  await cacheAll(TILE_CACHE, tiles, 'tiles', 0, total, onProgress);
  await cacheAll(PHOTO_CACHE, photos, 'photos', tiles.length, total, onProgress);
}

export async function offlineCachedCount(): Promise<number> {
  if (!('caches' in window)) return 0;
  let n = 0;
  for (const name of [TILE_CACHE, PHOTO_CACHE]) {
    try {
      const c = await caches.open(name);
      n += (await c.keys()).length;
    } catch {
      /* ignore */
    }
  }
  return n;
}

export async function clearOffline() {
  await caches.delete(TILE_CACHE);
  await caches.delete(PHOTO_CACHE);
}
