import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { SlidersHorizontal } from 'lucide-react';
import { useFilteredBoulders } from '../lib/hooks';
import { useUI } from '../store/useUI';
import { useFilters } from '../store/useFilters';
import { countActiveFilters } from '../lib/filter';
import { crag, sectors, minGradeNum, maxGradeNum } from '../lib/data';
import { Sheet } from '../components/Sheet';
import { BoulderCard } from '../components/BoulderCard';
import type { Boulder, Sector } from '../lib/types';

export function MapScreen() {
  const results = useFilteredBoulders();
  const setFilterOpen = useUI((s) => s.setFilterOpen);
  const filters = useFilters((s) => s.filters);
  const activeCount = countActiveFilters(filters, minGradeNum, maxGradeNum);
  const [selected, setSelected] = useState<Sector | null>(null);

  // Group filtered boulders by sector slug.
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

  const radius = (count: number) => Math.min(26, 7 + Math.sqrt(count) * 3);
  const selectedBoulders = selected ? bySector.get(selected.slug) ?? [] : [];

  return (
    <div className="relative h-full">
      <MapContainer
        center={[crag.lat, crag.lng]}
        zoom={crag.zoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {points.map(({ sector, count }) => (
          <CircleMarker
            key={sector.slug}
            center={[sector.lat, sector.lng]}
            radius={radius(count)}
            pathOptions={{
              color: '#1f2937',
              weight: 1.5,
              fillColor: '#79a263',
              fillOpacity: 0.85,
            }}
            eventHandlers={{ click: () => setSelected(sector) }}
          >
            <Tooltip direction="top" offset={[0, -4]}>
              <span className="font-medium">{sector.name}</span> · {count}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <button
        onClick={() => setFilterOpen(true)}
        className="absolute top-3 right-3 z-[1000] safe-top p-3 rounded-xl bg-slate-900/90 backdrop-blur text-slate-100 shadow-lg"
        aria-label="Filters"
      >
        <SlidersHorizontal size={20} />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-moss-500 text-white text-xs flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      <div className="absolute top-3 left-3 z-[1000] safe-top px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur text-sm shadow-lg">
        <span className="font-semibold">{results.length}</span>
        <span className="text-slate-400"> boulders · {points.length} sectors</span>
      </div>

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
