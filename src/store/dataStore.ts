import { create } from "zustand";
import { fetchChapters, fetchLevels } from "../services/dataService";
import { Chapter, Level } from "../types";

interface DataState {
  chapters: Chapter[];
  levelsCache: Record<number, Level[]>; // chapterId -> Level[]
  isLoading: boolean;
}

interface DataActions {
  getChapters: () => Promise<Chapter[]>;
  getLevels: (chapterId: number) => Promise<Level[]>;
  getChapterById: (id: number) => Chapter | undefined;
  getLevelById: (
    chapterId: number,
    levelId: number,
  ) => Promise<Level | undefined>;
}

interface DataStore extends DataState {
  actions: DataActions;
}

let chaptersPromise: Promise<Chapter[]> | null = null;
const levelsPromiseByChapter: Partial<Record<number, Promise<Level[]>>> = {};

export const useDataStore = create<DataStore>((set, get) => ({
  chapters: [],
  levelsCache: {},
  isLoading: false,

  actions: {
    getChapters: async () => {
      const { chapters } = get();
      if (chapters.length > 0) return chapters;
      if (chaptersPromise) return chaptersPromise;

      set({ isLoading: true });
      chaptersPromise = fetchChapters()
        .then((fetchedChapters) => {
          set({ chapters: fetchedChapters, isLoading: false });
          return fetchedChapters;
        })
        .catch((error) => {
          set({ isLoading: false });
          throw error;
        })
        .finally(() => {
          chaptersPromise = null;
        });

      return chaptersPromise;
    },

    getLevels: async (chapterId: number) => {
      const { levelsCache } = get();
      if (levelsCache[chapterId]) return levelsCache[chapterId];
      if (levelsPromiseByChapter[chapterId]) {
        return levelsPromiseByChapter[chapterId];
      }

      set({ isLoading: true });
      levelsPromiseByChapter[chapterId] = fetchLevels(chapterId)
        .then((fetchedLevels) => {
          set((state) => ({
            levelsCache: { ...state.levelsCache, [chapterId]: fetchedLevels },
            isLoading: false,
          }));
          return fetchedLevels;
        })
        .catch((error) => {
          set({ isLoading: false });
          throw error;
        })
        .finally(() => {
          delete levelsPromiseByChapter[chapterId];
        });

      return levelsPromiseByChapter[chapterId];
    },

    getChapterById: (id: number) => {
      return get().chapters.find((c) => c.id === id);
    },

    getLevelById: async (chapterId: number, levelId: number) => {
      const levels = await get().actions.getLevels(chapterId);
      return levels.find((l) => l.id === levelId);
    },
  },
}));

// Stable empty array to prevent infinite re-renders
const EMPTY_LEVELS: Level[] = [];

export const useChapters = () => useDataStore((state) => state.chapters);
export const useDataActions = () => useDataStore((state) => state.actions);
export const useIsDataLoading = () => useDataStore((state) => state.isLoading);

// Selector for levels by chapter - prevents re-renders when other chapters update
// CRITICAL: Must return a stable reference (not a new array [] on each call)
export const useLevelsByChapter = (chapterId: number) =>
  useDataStore((state) => state.levelsCache[chapterId] ?? EMPTY_LEVELS);
