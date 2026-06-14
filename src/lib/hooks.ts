import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useFilters } from '../store/useFilters';
import { applyFilters, type SavedState } from './filter';
import { boulders } from './data';
import type { Boulder } from './types';

export function useSavedState(): SavedState {
  const liked = useStore((s) => s.liked);
  const projects = useStore((s) => s.projects);
  const ticks = useStore((s) => s.ticks);
  const lists = useStore((s) => s.lists);
  const filters = useFilters((s) => s.filters);

  return useMemo(() => {
    const ticked: Record<string, true> = {};
    for (const slug of Object.keys(ticks)) ticked[slug] = true;

    const allListSlugs = new Set<string>();
    for (const l of lists) for (const slug of l.slugs) allListSlugs.add(slug);

    const selected = filters.listId ? lists.find((l) => l.id === filters.listId) : null;
    const listSlugs = new Set<string>(selected?.slugs ?? []);

    return { liked, projects, ticked, listSlugs, allListSlugs };
  }, [liked, projects, ticks, lists, filters.listId]);
}

export function useFilteredBoulders(): Boulder[] {
  const filters = useFilters((s) => s.filters);
  const saved = useSavedState();
  return useMemo(() => applyFilters(boulders, filters, saved), [filters, saved]);
}
