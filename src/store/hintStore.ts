import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, HINT_CONFIG } from '../constants/gameConfig';

interface HintState {
  hintCount: number;
  isLoaded: boolean;
}

interface HintActions {
  loadHints: () => Promise<void>;
  saveHints: () => Promise<void>;
  useHint: () => boolean;
  addHints: (amount: number) => void;
  addChapterBonus: () => void;
  resetHints: () => void;
}

interface HintStore extends HintState {
  actions: HintActions;
}

export const useHintStore = create<HintStore>((set, get) => ({
  hintCount: HINT_CONFIG.defaultHints,
  isLoaded: false,

  actions: {
    loadHints: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.HINT_COUNT);
        if (stored) {
          set({ hintCount: parseInt(stored, 10), isLoaded: true });
        } else {
          set({ isLoaded: true });
        }
      } catch {
        set({ isLoaded: true });
      }
    },

    saveHints: async () => {
      try {
        const { hintCount } = get();
        await AsyncStorage.setItem(STORAGE_KEYS.HINT_COUNT, hintCount.toString());
      } catch {}
    },

    useHint: () => {
      const { hintCount } = get();
      if (hintCount <= 0) return false;

      set({ hintCount: hintCount - 1 });
      get().actions.saveHints();
      return true;
    },

    addHints: (amount: number) => {
      const { hintCount } = get();
      set({ hintCount: hintCount + amount });
      get().actions.saveHints();
    },

    addChapterBonus: () => {
      get().actions.addHints(HINT_CONFIG.chapterBonus);
    },

    resetHints: () => {
      set({ hintCount: HINT_CONFIG.defaultHints });
      get().actions.saveHints();
    },
  },
}));

export const useHintCount = () => useHintStore((state) => state.hintCount);
export const useHintActions = () => useHintStore((state) => state.actions);
