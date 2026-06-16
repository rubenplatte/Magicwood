import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultFilters, type Filters } from '../lib/filter';
import { maxGradeNum, minGradeNum } from '../lib/data';
import type { AreaSlug } from '../lib/types';

interface FilterState {
  filters: Filters;
  set: (patch: Partial<Filters>) => void;
  toggleSector: (slug: string) => void;
  toggleArea: (slug: AreaSlug) => void;
  reset: () => void;
}

export const useFilters = create<FilterState>()(
  persist(
    (set) => ({
      filters: defaultFilters(minGradeNum, maxGradeNum),
      set: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
      toggleSector: (slug) =>
        set((s) => {
          const has = s.filters.sectors.includes(slug);
          return {
            filters: {
              ...s.filters,
              sectors: has
                ? s.filters.sectors.filter((x) => x !== slug)
                : [...s.filters.sectors, slug],
            },
          };
        }),
      toggleArea: (slug) =>
        set((s) => {
          const has = s.filters.areas.includes(slug);
          return {
            filters: {
              ...s.filters,
              areas: has
                ? s.filters.areas.filter((x) => x !== slug)
                : [...s.filters.areas, slug],
            },
          };
        }),
      reset: () => set({ filters: defaultFilters(minGradeNum, maxGradeNum) }),
    }),
    {
      name: 'magicwood-filters-v1',
      // Returning users have a persisted `filters` object that predates newer
      // fields (e.g. `areas`). Merge persisted values over the current defaults
      // so any field added since they last visited is always present — this
      // keeps their saved filters without crashing on `undefined`.
      merge: (persisted, current) => {
        const p = persisted as { filters?: Partial<Filters> } | undefined;
        return {
          ...current,
          filters: { ...current.filters, ...(p?.filters ?? {}) },
        };
      },
    }
  )
);
