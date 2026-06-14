import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { BoulderCard } from '../components/BoulderCard';
import { useFilteredBoulders } from '../lib/hooks';
import { useFilters } from '../store/useFilters';
import { useUI } from '../store/useUI';
import { countActiveFilters } from '../lib/filter';
import { minGradeNum, maxGradeNum } from '../lib/data';
import { useStore } from '../store/useStore';

const PAGE = 30;

export function ExploreScreen() {
  const results = useFilteredBoulders();
  const filters = useFilters((s) => s.filters);
  const set = useFilters((s) => s.set);
  const setFilterOpen = useUI((s) => s.setFilterOpen);
  const lists = useStore((s) => s.lists);

  const activeCount = countActiveFilters(filters, minGradeNum, maxGradeNum);
  const activeList = filters.listId ? lists.find((l) => l.id === filters.listId) : null;

  const [visible, setVisible] = useState(PAGE);
  const sentinel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // Reset paging + scroll when the result set changes.
  useEffect(() => {
    setVisible(PAGE);
    scroller.current?.scrollTo({ top: 0 });
  }, [filters]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setVisible((v) => v + PAGE),
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <header className="safe-top px-3 pt-2 pb-2 bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
              placeholder="Search boulders, sectors…"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-800 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-moss-500"
            />
            {filters.search && (
              <button
                onClick={() => set({ search: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="relative p-2.5 rounded-xl bg-slate-800 text-slate-200"
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

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{results.length} boulders</span>
          {activeList && (
            <button
              onClick={() => set({ listId: null })}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-moss-500/20 text-moss-200"
            >
              List: {activeList.name} <X size={12} />
            </button>
          )}
        </div>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {results.length === 0 ? (
          <div className="text-center text-slate-500 py-16">
            <p className="font-medium">No boulders match your filters.</p>
            <p className="text-sm mt-1">Try widening the grade range or clearing filters.</p>
          </div>
        ) : (
          <>
            {results.slice(0, visible).map((b) => (
              <BoulderCard key={b.slug} boulder={b} />
            ))}
            {visible < results.length && <div ref={sentinel} className="h-10" />}
          </>
        )}
      </div>
    </div>
  );
}
