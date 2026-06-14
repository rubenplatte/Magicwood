import { useMemo, useRef, useState } from 'react';
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
import { crag, sectors, minGradeNum, maxGradeNum } from '../lib/data';
import { Sheet } from '../components/Sheet';
import { BoulderCard } from '../components/BoulderCard';
import type { Boulder, Sector } from '../lib/types';

// Above this zoom we show sector names as permanent labels.
const LABEL_ZOOM = 17;

const LAYERS = {
  map: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap, &copy; CARTO',
    maxZoom: 20,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri',
    maxZoom: 19,
  },
} as const;

type LayerKey = keyof typeof LAYERS;

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
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
  const [zoom, setZoom] = useState(crag.zoom);
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

  const showLabels = zoom >= LABEL_ZOOM;
  const selectedBoulders = selected ? bySector.get(selected.slug) ?? [] : [];
  const tiles = LAYERS[layer];

  return (
    <div className="relative h-full">
      <MapContainer
        center={[crag.lat, crag.lng]}
        zoom={crag.zoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer key={layer} attribution={tiles.attribution} url={tiles.url} maxZoom={tiles.maxZoom} />
        <ZoomTracker onZoom={setZoom} />
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
