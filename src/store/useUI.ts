import { create } from 'zustand';

export type Tab = 'explore' | 'map' | 'lists';

interface UIState {
  tab: Tab;
  setTab: (tab: Tab) => void;
  // slug whose detail sheet is open
  detailSlug: string | null;
  // slug whose "add to list" picker is open
  listPickerSlug: string | null;
  filterOpen: boolean;

  openDetail: (slug: string) => void;
  closeDetail: () => void;
  openListPicker: (slug: string) => void;
  closeListPicker: () => void;
  setFilterOpen: (open: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  tab: 'explore',
  setTab: (tab) => set({ tab }),
  detailSlug: null,
  listPickerSlug: null,
  filterOpen: false,
  openDetail: (slug) => set({ detailSlug: slug }),
  closeDetail: () => set({ detailSlug: null }),
  openListPicker: (slug) => set({ listPickerSlug: slug }),
  closeListPicker: () => set({ listPickerSlug: null }),
  setFilterOpen: (filterOpen) => set({ filterOpen }),
}));
