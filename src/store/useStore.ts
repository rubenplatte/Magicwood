import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BoulderList, TickInfo, TickStyle } from '../lib/types';

interface UserState {
  liked: Record<string, true>;
  projects: Record<string, true>;
  ticks: Record<string, TickInfo>;
  lists: BoulderList[];

  toggleLike: (slug: string) => void;
  toggleProject: (slug: string) => void;
  setTick: (slug: string, style: TickStyle | null) => void;

  createList: (name: string) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  addToList: (id: string, slug: string) => void;
  removeFromList: (id: string, slug: string) => void;
  isInList: (id: string, slug: string) => boolean;
}

const id = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      liked: {},
      projects: {},
      ticks: {},
      lists: [],

      toggleLike: (slug) =>
        set((s) => {
          const liked = { ...s.liked };
          if (liked[slug]) delete liked[slug];
          else liked[slug] = true;
          return { liked };
        }),

      toggleProject: (slug) =>
        set((s) => {
          const projects = { ...s.projects };
          if (projects[slug]) delete projects[slug];
          else projects[slug] = true;
          return { projects };
        }),

      setTick: (slug, style) =>
        set((s) => {
          const ticks = { ...s.ticks };
          if (style === null) {
            delete ticks[slug];
          } else {
            ticks[slug] = { style, date: new Date().toISOString() };
          }
          // Ticking removes the project flag — it's done now.
          const projects = { ...s.projects };
          if (style !== null && projects[slug]) delete projects[slug];
          return { ticks, projects };
        }),

      createList: (name) => {
        const newId = id();
        set((s) => ({
          lists: [
            ...s.lists,
            { id: newId, name: name.trim() || 'New list', slugs: [], createdAt: new Date().toISOString() },
          ],
        }));
        return newId;
      },

      renameList: (listId, name) =>
        set((s) => ({
          lists: s.lists.map((l) => (l.id === listId ? { ...l, name: name.trim() || l.name } : l)),
        })),

      deleteList: (listId) =>
        set((s) => ({ lists: s.lists.filter((l) => l.id !== listId) })),

      addToList: (listId, slug) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId && !l.slugs.includes(slug)
              ? { ...l, slugs: [...l.slugs, slug] }
              : l
          ),
        })),

      removeFromList: (listId, slug) =>
        set((s) => ({
          lists: s.lists.map((l) =>
            l.id === listId ? { ...l, slugs: l.slugs.filter((x) => x !== slug) } : l
          ),
        })),

      isInList: (listId, slug) =>
        !!get().lists.find((l) => l.id === listId)?.slugs.includes(slug),
    }),
    { name: 'magicwood-user-v1' }
  )
);
