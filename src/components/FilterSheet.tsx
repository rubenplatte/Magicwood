import { useMemo } from 'react';
import { Sheet } from './Sheet';
import { useFilters } from '../store/useFilters';
import { useUI } from '../store/useUI';
import { Stars } from './Stars';
import { gradeScale, minGradeNum, maxGradeNum } from '../lib/data';
import type { SortKey } from '../lib/filter';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'rating', label: 'Top rated' },
  { key: 'ascents', label: 'Most sends' },
  { key: 'grade-asc', label: 'Grade ↑' },
  { key: 'grade-desc', label: 'Grade ↓' },
  { key: 'name', label: 'Name' },
];

const SAVED_TOGGLES: { key: 'savedOnly' | 'likedOnly' | 'projectsOnly' | 'tickedOnly' | 'untickedOnly'; label: string }[] = [
  { key: 'savedOnly', label: 'Saved' },
  { key: 'likedOnly', label: 'Liked' },
  { key: 'projectsOnly', label: 'Projects' },
  { key: 'tickedOnly', label: 'Ticked' },
  { key: 'untickedOnly', label: 'Not ticked' },
];

export function FilterSheet() {
  const open = useUI((s) => s.filterOpen);
  const setOpen = useUI((s) => s.setFilterOpen);
  const filters = useFilters((s) => s.filters);
  const set = useFilters((s) => s.set);
  const reset = useFilters((s) => s.reset);

  const minIdx = useMemo(
    () => Math.max(0, gradeScale.findIndex((g) => g.gradeNum >= filters.minGrade)),
    [filters.minGrade]
  );
  const maxIdx = useMemo(() => {
    const i = gradeScale.findIndex((g) => g.gradeNum > filters.maxGrade);
    return i === -1 ? gradeScale.length - 1 : Math.max(0, i - 1);
  }, [filters.maxGrade]);

  const lastIdx = gradeScale.length - 1;

  const setMinIdx = (i: number) => {
    const clamped = Math.min(i, maxIdx);
    set({ minGrade: gradeScale[clamped].gradeNum });
  };
  const setMaxIdx = (i: number) => {
    const clamped = Math.max(i, minIdx);
    set({ maxGrade: gradeScale[clamped].gradeNum });
  };

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="Filters"
      footer={
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-200 font-medium"
          >
            Reset
          </button>
          <button
            onClick={() => setOpen(false)}
            className="flex-[2] py-3 rounded-xl bg-moss-500 text-white font-semibold"
          >
            Show results
          </button>
        </div>
      }
    >
      {/* Grade range */}
      <Section title="Grade">
        <div className="flex justify-between text-sm font-semibold text-moss-200 mb-1">
          <span>{gradeScale[minIdx]?.grade}</span>
          <span>{gradeScale[maxIdx]?.grade}</span>
        </div>
        <div className="dual-range">
          <div className="rail" />
          <div
            className="fill"
            style={{
              left: `${(minIdx / lastIdx) * 100}%`,
              right: `${100 - (maxIdx / lastIdx) * 100}%`,
            }}
          />
          <input
            type="range"
            min={0}
            max={lastIdx}
            value={minIdx}
            aria-label="Minimum grade"
            onChange={(e) => setMinIdx(+e.target.value)}
            style={{ zIndex: 4 }}
          />
          <input
            type="range"
            min={0}
            max={lastIdx}
            value={maxIdx}
            aria-label="Maximum grade"
            onChange={(e) => setMaxIdx(+e.target.value)}
            style={{ zIndex: 3 }}
          />
        </div>
        {(filters.minGrade > minGradeNum || filters.maxGrade < maxGradeNum) && (
          <p className="text-xs text-slate-500">
            Showing {gradeScale[minIdx]?.grade}–{gradeScale[maxIdx]?.grade}
          </p>
        )}
      </Section>

      {/* Min rating */}
      <Section title="Minimum rating">
        <div className="flex items-center gap-2 flex-wrap">
          {[0, 1, 1.5, 2, 2.5].map((r) => (
            <button
              key={r}
              onClick={() => set({ minRating: r })}
              className={`px-3 py-1.5 rounded-full text-sm inline-flex items-center gap-1 ${
                filters.minRating === r
                  ? 'bg-moss-500 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {r === 0 ? 'Any' : <><Stars rating={r} size={12} /> +</>}
            </button>
          ))}
        </div>
      </Section>

      {/* Min ascents (popularity) */}
      <Section title="Minimum sends">
        <div className="flex items-center gap-2 flex-wrap">
          {[0, 10, 25, 50, 100, 250].map((n) => (
            <button
              key={n}
              onClick={() => set({ minAscents: n })}
              className={`px-3 py-1.5 rounded-full text-sm ${
                filters.minAscents === n
                  ? 'bg-moss-500 text-white'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {n === 0 ? 'Any' : `${n}+`}
            </button>
          ))}
        </div>
      </Section>

      {/* Saved-state quick filters */}
      <Section title="My boulders">
        <div className="flex items-center gap-2 flex-wrap">
          {SAVED_TOGGLES.map((t) => (
            <button
              key={t.key}
              onClick={() => set({ [t.key]: !filters[t.key] } as never)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                filters[t.key] ? 'bg-moss-500 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => set({ withVideo: !filters.withVideo })}
          className={`mt-2 px-3 py-1.5 rounded-full text-sm ${
            filters.withVideo ? 'bg-moss-500 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Has video beta
        </button>
      </Section>

      {/* Sort */}
      <Section title="Sort by">
        <div className="flex items-center gap-2 flex-wrap">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => set({ sort: s.key })}
              className={`px-3 py-1.5 rounded-full text-sm ${
                filters.sort === s.key ? 'bg-moss-500 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Section>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-slate-800 last:border-0">
      <h3 className="text-sm font-semibold text-slate-200 mb-2">{title}</h3>
      {children}
    </div>
  );
}
