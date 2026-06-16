import rawBoulders from '../data/boulders.json';
import rawSectors from '../data/sectors.json';
import type { Area, AreaSlug, Boulder, BoulderData, Sector, SectorData } from './types';

const boulderData = rawBoulders as unknown as BoulderData;
const sectorData = rawSectors as unknown as SectorData;

export const scrapedAt = boulderData.scrapedAt;
export const boulders: Boulder[] = boulderData.boulders;
export const sectors: Sector[] = sectorData.sectors;

// Areas in their canonical display / sort order: Magic Wood → Chironico →
// Cresciano. We derive the order from this list rather than the data file so
// the app stays stable even if the scrape order ever changes.
export const AREA_ORDER: AreaSlug[] = ['magic-wood', 'chironico', 'cresciano'];

export const areas: Area[] = [...boulderData.areas].sort(
  (a, b) => AREA_ORDER.indexOf(a.slug) - AREA_ORDER.indexOf(b.slug)
);

export const areaBySlug: Map<AreaSlug, Area> = new Map(areas.map((a) => [a.slug, a]));

export function areaName(slug: AreaSlug): string {
  return areaBySlug.get(slug)?.name ?? slug;
}

export function areaRank(slug: AreaSlug): number {
  const i = AREA_ORDER.indexOf(slug);
  return i === -1 ? AREA_ORDER.length : i;
}

// Default map view: centre on Magic Wood (the first area), falling back to the
// first available area. The map auto-fits to the visible boulders anyway.
export const defaultArea: Area = areaBySlug.get('magic-wood') ?? areas[0];

export const bouldersBySlug: Map<string, Boulder> = new Map(
  boulders.map((b) => [b.slug, b])
);

export function getBoulder(slug: string): Boulder | undefined {
  return bouldersBySlug.get(slug);
}

// Ordered, unique grade scale derived from the real data. Boulders without a
// numeric grade (open projects) are excluded from the scale.
export interface GradeStep {
  grade: string;
  gradeNum: number;
}

export const gradeScale: GradeStep[] = (() => {
  const map = new Map<number, string>();
  for (const b of boulders) {
    if (b.gradeNum != null && b.grade) map.set(b.gradeNum, b.grade);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gradeNum, grade]) => ({ gradeNum, grade }));
})();

export const minGradeNum = gradeScale[0]?.gradeNum ?? 0;
export const maxGradeNum = gradeScale[gradeScale.length - 1]?.gradeNum ?? 0;

export function gradeLabelForNum(gradeNum: number): string {
  // Nearest step at or below the value.
  let label = gradeScale[0]?.grade ?? '';
  for (const step of gradeScale) {
    if (step.gradeNum <= gradeNum) label = step.grade;
    else break;
  }
  return label;
}

export const allSectors: Sector[] = sectors;

// Sectors that actually contain at least one boulder, sorted by boulder count.
export const sectorsByCount = [...sectors].sort((a, b) => b.count - a.count);

export const maxAscents = boulders.reduce((m, b) => Math.max(m, b.ascents), 0);
