import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Tooltip,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import { SlidersHorizontal, Locate, Layers } from 'lucide-react';
import { useFilteredBoulders } from '../lib/hooks';
import { useUI } from '../store/useUI';
import { useFilters } from '../store/useFilters';
import { countActiveFilters } from '../lib/filter';
import { defaultArea, sectors, minGradeNum, maxGradeNum } from '../lib/data';
import { LAYERS, type LayerKey } from '../lib/tiles';
import { Sheet } from '../components/Sheet';
import { BoulderCard } from '../components/BoulderCard';
import type { Boulder, Sector } from '../lib/types';

// Sector names appear only at the deepest zoom (where you're looking at a
// small area). Tying this to zoom alone — not the live in-view count — keeps it
// stable while panning, so labels don't flicker on/off as you move the map.
const LABEL_ZOOM = 20;

// Auto-fit the map to whatever areas are currently in the filtered results:
// pick one area in the filter and the map zooms to it; with no area filter it
// fits all three. Keyed on the set of areas present (not every minor filter
// tweak) so the view only jumps when you actually change areas, never mid-pan.
function FitToAreas({
  bounds,
  areaKey,
}: {
  bounds: [number, number][];
  areaKey: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length === 0) return;
    if (bounds.length === 1) {
      map.setView(bounds[0], Math.max(map.getZoom(), 14), { animate: true });
    } else {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
    }
    // Only refit when the area composition changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaKey]);
  return null;
}

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMapEvents({ zoomend: () => onZoom(map.getZoom()) });
  // Expose the map for debugging / screenshot tooling.
  useEffect(() => {
    (window as unknown as { __mwmap?: unknown }).__mwmap = map;
  }, [map]);
  return null;
}

interface UserPos {
  lat: number;
  lng: number;
  accuracy: number;
}

function LocateControl({ onPos }: { onPos: (p: UserPos) => void }) {
  const map = useMap();
  const [busy, setBusy] = useState(false);
  const watchId = useRef<number | null>(null);

  const locate = () => {
    if (!('geolocation' in navigator)) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        onPos(p);
        map.flyTo([p.lat, p.lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
        setBusy(false);
        // Keep tracking after the first fix so the dot follows you at the crag.
        if (watchId.current == null) {
          watchId.current = navigator.geolocation.watchPosition(
            (w) =>
              onPos({
                lat: w.coords.latitude,
                lng: w.coords.longitude,
                accuracy: w.coords.accuracy,
              }),
            undefined,
            { enableHighAccuracy: true, maximumAge: 5000 }
          );
        }
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button
      onClick={locate}
      className="absolute bottom-4 right-3 z-[1000] p-3 rounded-full bg-slate-900/90 backdrop-blur text-slate-100 shadow-lg active:scale-95 transition"
      aria-label="Show my location"
    >
      <Locate size={20} className={busy ? 'animate-pulse text-moss-300' : ''} />
    </button>
  );
}

export function MapScreen() {
  const results = useFilteredBoulders();
  const setFilterOpen = useUI((s) => s.setFilterOpen);
  const filters = useFilters((s) => s.filters);
  const activeCount = countActiveFilters(filters, minGradeNum, maxGradeNum);
  const [selected, setSelected] = useState<Sector | null>(null);
  const [zoom, setZoom] = useState(defaultArea.zoom);
  const [layer, setLayer] = useState<LayerKey>('map');
  const [userPos, setUserPos] = useState<UserPos | null>(null);

  const bySector = useMemo(() => {
    const m = new Map<string, Boulder[]>();
    for (const b of results) {
      if (!b.sectorSlug) continue;
      const arr = m.get(b.sectorSlug);
      if (arr) arr.push(b);
      else m.set(b.sectorSlug, [b]);
    }
    return m;
  }, [results]);

  const points = useMemo(
    () =>
      sectors
        .map((s) => ({ sector: s, count: bySector.get(s.slug)?.length ?? 0 }))
        .filter((p) => p.count > 0),
    [bySector]
  );

  // Bounds + an area signature for auto-fitting the view.
  const bounds = useMemo(
    () => points.map((p) => [p.sector.lat, p.sector.lng] as [number, number]),
    [points]
  );
  const areaKey = useMemo(
    () => [...new Set(results.map((b) => b.area))].sort().join(','),
    [results]
  );

  const showLabels = zoom >= LABEL_ZOOM;
  const selectedBoulders = selected ? bySector.get(selected.slug) ?? [] : [];
  const tiles = LAYERS[layer];

  return (
    <div className="relative h-full">
      <MapContainer
        center={[defaultArea.lat, defaultArea.lng]}
        zoom={defaultArea.zoom}
        maxZoom={20}
        className="h-full w-full"
        zoomControl={false}
      >
        {/* Tiles are only fetched up to z19 (what we cache offline); z20 is
            scaled from z19 so deep zoom still works without a connection. */}
        <TileLayer
          key={layer}
          attribution={tiles.attribution}
          url={tiles.url}
          maxZoom={20}
          maxNativeZoom={19}
        />
        <ZoomTracker onZoom={setZoom} />
        <FitToAreas bounds={bounds} areaKey={areaKey} />
        <LocateControl onPos={setUserPos} />

        {points.map(({ sector, count }) => {
          const active = selected?.slug === sector.slug;
          return (
            <CircleMarker
              key={sector.slug}
              center={[sector.lat, sector.lng]}
              radius={active ? 11 : 8}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: active ? '#a3e635' : '#5b8546',
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => setSelected(sector) }}
            >
              {/* The key forces a remount when the label mode flips, so Leaflet
                  re-binds the tooltip with the new `permanent` option. */}
              <Tooltip
                key={showLabels ? 'perm' : 'hover'}
                permanent={showLabels}
                direction="top"
                offset={[0, -6]}
                className="mw-label"
              >
                {sector.name} · {count}
              </Tooltip>
            </CircleMarker>
          );
        })}

        {userPos && (
          <>
            <Circle
              center={[userPos.lat, userPos.lng]}
              radius={userPos.accuracy}
              pathOptions={{ color: '#38bdf8', weight: 1, fillColor: '#38bdf8', fillOpacity: 0.12 }}
            />
            <CircleMarker
              center={[userPos.lat, userPos.lng]}
              radius={7}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#0ea5e9', fillOpacity: 1 }}
            />
          </>
        )}
      </MapContainer>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-[1000] safe-top p-3 flex items-start justify-between pointer-events-none">
        <div className="px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur text-sm shadow-lg pointer-events-auto">
          <span className="font-semibold">{results.length}</span>
          <span className="text-slate-400"> boulders · {points.length} sectors</span>
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className="relative p-3 rounded-xl bg-slate-900/90 backdrop-blur text-slate-100 shadow-lg pointer-events-auto"
          aria-label="Filters"
        >
          <SlidersHorizontal size={20} />
          {activeCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-moss-500 text-white text-xs flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Layer toggle */}
      <button
        onClick={() => setLayer((l) => (l === 'map' ? 'satellite' : 'map'))}
        className="absolute bottom-4 left-3 z-[1000] px-3 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur text-slate-100 shadow-lg inline-flex items-center gap-2 text-sm font-medium"
      >
        <Layers size={18} />
        {layer === 'map' ? 'Satellite' : 'Map'}
      </button>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.name} · ${selectedBoulders.length}` : ''}
      >
        <div className="space-y-2.5 pb-2">
          {selectedBoulders.map((b) => (
            <BoulderCard key={b.slug} boulder={b} />
          ))}
        </div>
      </Sheet>
    </div>
  );
}
