import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { defaultFilters, type Filters } from '../lib/filter';
import { maxGradeNum, minGradeNum } from '../lib/data';

interface FilterState {
  filters: Filters;
  set: (patch: Partial<Filters>) => void;
  toggleSector: (slug: string) => void;
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
      reset: () => set({ filters: defaultFilters(minGradeNum, maxGradeNum) }),
    }),
    { name: 'magicwood-filters-v1' }
  )
);
