export interface Boulder {
  slug: string;
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
  hasVideo: boolean;
  url: string;
  lat: number | null;
  lng: number | null;
}

export interface BoulderData {
  crag: { name: string; lat: number; lng: number; zoom: number };
  scrapedAt: string;
  count: number;
  boulders: Boulder[];
}

export interface Sector {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  kind: string;
  count: number;
}

export interface SectorData {
  crag: { name: string; lat: number; lng: number; zoom: number };
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
