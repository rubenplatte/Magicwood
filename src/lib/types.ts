export type AreaSlug = 'magic-wood' | 'chironico' | 'cresciano' | 'gottardo';

export interface Area {
  slug: AreaSlug;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  count: number;
}

export interface Boulder {
  slug: string;
  area: AreaSlug;
  name: string;
  grade: string | null;
  gradeNum: number | null;
  type: string;
  ascents: number;
  rating: number; // 0–3
  votes: number;
  sectorSlug: string | null;
  sector: string | null;
  thumb: string | null;
  image: string | null; // high-res (size_xl) when available, else same as thumb
  hasVideo: boolean;
  url: string;
  lat: number | null;
  lng: number | null;
}

export interface BoulderData {
  areas: Area[];
  scrapedAt: string;
  count: number;
  boulders: Boulder[];
}

export interface Sector {
  slug: string;
  area: AreaSlug;
  name: string;
  lat: number;
  lng: number;
  kind: string;
  count: number;
}

export interface SectorData {
  areas: Area[];
  sectors: Sector[];
}

export type TickStyle = 'redpoint' | 'flash';

export interface TickInfo {
  style: TickStyle;
  date: string; // ISO
}

export interface BoulderList {
  id: string;
  name: string;
  slugs: string[];
  createdAt: string;
}
