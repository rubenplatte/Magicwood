import { areaName } from './data';
import type { AreaSlug } from './types';

// A distinct accent per area so it reads at a glance in the list. Magic Wood
// keeps the app's moss/green; the two Ticino areas get warm + cool accents.
const AREA_CHIP: Record<AreaSlug, string> = {
  'magic-wood': 'bg-moss-600/30 text-moss-200',
  chironico: 'bg-amber-500/25 text-amber-200',
  cresciano: 'bg-sky-500/25 text-sky-200',
};

export function areaChipClass(area: AreaSlug): string {
  return AREA_CHIP[area] ?? 'bg-slate-700/40 text-slate-200';
}

export { areaName };
