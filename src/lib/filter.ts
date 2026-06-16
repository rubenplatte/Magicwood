import { areaRank } from './data';
import type { AreaSlug, Boulder } from './types';

export type SortKey = 'rating' | 'ascents' | 'grade-asc' | 'grade-desc' | 'name' | 'area';

export interface Filters {
  search: string;
  minGrade: number; // gradeNum
  maxGrade: number; // gradeNum
  minRating: number; // 0–3
  minAscents: number;
  areas: AreaSlug[]; // area slugs; empty = all areas
  sectors: string[]; // sector slugs; empty = all
  withVideo: boolean;
  // Saved-state filters
  savedOnly: boolean; // anything liked, projected, ticked or in a list
  likedOnly: boolean;
  projectsOnly: boolean;
  tickedOnly: boolean;
  untickedOnly: boolean;
  listId: string | null; // restrict to a specific custom list
  sort: SortKey;
}

export interface SavedState {
  liked: Record<string, true>;
  projects: Record<string, true>;
  ticked: Record<string, true>; // slug -> any tick
  listSlugs: Set<string>; // slugs in the selected list
  allListSlugs: Set<string>; // slugs in any list
}

export function defaultFilters(minGrade: number, maxGrade: number): Filters {
  return {
    search: '',
    minGrade,
    maxGrade,
    minRating: 0,
    minAscents: 0,
    areas: [],
    sectors: [],
    withVideo: false,
    savedOnly: false,
    likedOnly: false,
    projectsOnly: false,
    tickedOnly: false,
    untickedOnly: false,
    listId: null,
    sort: 'rating',
  };
}

export function countActiveFilters(f: Filters, minGrade: number, maxGrade: number): number {
  let n = 0;
  if (f.minGrade > minGrade || f.maxGrade < maxGrade) n++;
  if (f.minRating > 0) n++;
  if (f.minAscents > 0) n++;
  if (f.areas.length > 0) n++;
  if (f.sectors.length > 0) n++;
  if (f.withVideo) n++;
  if (f.savedOnly) n++;
  if (f.likedOnly) n++;
  if (f.projectsOnly) n++;
  if (f.tickedOnly) n++;
  if (f.untickedOnly) n++;
  return n;
}

function matches(b: Boulder, f: Filters, s: SavedState): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay = `${b.name} ${b.sector ?? ''} ${b.grade ?? ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  // Grade range. Boulders with no numeric grade (projects) pass only when the
  // range is at its full extent, so they aren't silently hidden.
  if (b.gradeNum != null) {
    if (b.gradeNum < f.minGrade || b.gradeNum > f.maxGrade) return false;
  }
  if (b.rating < f.minRating) return false;
  if (b.ascents < f.minAscents) return false;
  if (f.areas.length > 0 && !f.areas.includes(b.area)) return false;
  if (f.sectors.length > 0 && (!b.sectorSlug || !f.sectors.includes(b.sectorSlug)))
    return false;
  if (f.withVideo && !b.hasVideo) return false;

  if (f.likedOnly && !s.liked[b.slug]) return false;
  if (f.projectsOnly && !s.projects[b.slug]) return false;
  if (f.tickedOnly && !s.ticked[b.slug]) return false;
  if (f.untickedOnly && s.ticked[b.slug]) return false;
  if (f.listId) {
    if (!s.listSlugs.has(b.slug)) return false;
  }
  if (f.savedOnly) {
    const saved =
      s.liked[b.slug] ||
      s.projects[b.slug] ||
      s.ticked[b.slug] ||
      s.allListSlugs.has(b.slug);
    if (!saved) return false;
  }
  return true;
}

function compare(a: Boulder, b: Boulder, sort: SortKey): number {
  switch (sort) {
    case 'rating':
      return b.rating - a.rating || b.ascents - a.ascents;
    case 'ascents':
      return b.ascents - a.ascents;
    case 'grade-asc':
      return (a.gradeNum ?? Infinity) - (b.gradeNum ?? Infinity);
    case 'grade-desc':
      return (b.gradeNum ?? -Infinity) - (a.gradeNum ?? -Infinity);
    case 'name':
      return a.name.localeCompare(b.name);
    case 'area':
      // Magic Wood → Chironico → Cresciano, then best-rated within each area.
      return (
        areaRank(a.area) - areaRank(b.area) ||
        b.rating - a.rating ||
        b.ascents - a.ascents
      );
  }
}

export function applyFilters(
  boulders: Boulder[],
  f: Filters,
  s: SavedState
): Boulder[] {
  return boulders.filter((b) => matches(b, f, s)).sort((a, b) => compare(a, b, f.sort));
}
