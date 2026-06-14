import rawBoulders from '../data/boulders.json';
import rawSectors from '../data/sectors.json';
import type { Boulder, BoulderData, Sector, SectorData } from './types';

const boulderData = rawBoulders as BoulderData;
const sectorData = rawSectors as SectorData;

export const crag = boulderData.crag;
export const scrapedAt = boulderData.scrapedAt;
export const boulders: Boulder[] = boulderData.boulders;
export const sectors: Sector[] = sectorData.sectors;

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
