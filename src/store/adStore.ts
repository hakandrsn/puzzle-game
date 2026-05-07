import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

// ==========================================
// AD CONFIGURATION
// ==========================================

export const AD_RULES = {
  // Interstitial rules
  interstitial: {
    excludedLevels: [
      { chapterId: 1, levelId: 1 },
      { chapterId: 1, levelId: 2 },
      { chapterId: 1, levelId: 3 },
      { chapterId: 1, levelId: 4 },
    ],
    minTimeBetweenAds: __DEV__ ? 30000 : 300000, // Dev: 30sn, Prod: 5dk aktif süre eşiği (ms)
    showOnLevelEntry: false, // Dokümantasyon: kod şu an reklamı level tamamlanıp sonrakine geçerken gösteriyor
  },

  // Rewarded rules
  rewarded: {
    enabled: true, // Rewarded ads for hints
  },

  // Banner rules
  banner: {
    showInGame: true, // Show banner at top of game screen
    showInChapters: false, // Don't show banner in chapters (use native ads instead)
  },

  // Native ads rules
  native: {
    showInChapters: true, // Show native ad in chapters screen
    showEveryNChapters: 4, // Show ad after every 4 chapters
  },
};

// ==========================================
// AD STATE INTERFACE
// ==========================================

interface AdState {
  lastInterstitialShown: number;
  lastRewardedShown: number;

  /** Jigsaw ekranında aktifken biriken süre (AsyncStorage ile kalıcı) */
  interstitialPlaytimeAccumMs: number;

  // Ad readiness
  isInterstitialReady: boolean;
  isRewardedReady: boolean;
  isBannerReady: boolean;

  // Statistics
  totalInterstitialsShown: number;
  totalRewardedShown: number;
  totalBannersShown: number;

  // Global ad state
  isAdShowing: boolean; // True when a full-screen ad (Interstitial/Rewarded) is open
}

interface AdActions {
  interstitialEligibleByRules: (chapterId: number, levelId: number) => boolean;
  canShowInterstitial: (chapterId: number, levelId: number) => boolean;
  markInterstitialShown: () => void;
  setInterstitialReady: (ready: boolean) => void;
  addInterstitialPlaytimeMs: (deltaMs: number) => void;
  resetInterstitialPlaytime: () => void;

  // Rewarded
  canShowRewarded: () => boolean;
  markRewardedShown: () => void;
  setRewardedReady: (ready: boolean) => void;

  // Banner
  canShowBanner: () => boolean;
  setBannerReady: (ready: boolean) => void;

  // Native
  shouldShowNativeAdAtIndex: (index: number) => boolean;

  // Persistence
  loadAdState: () => Promise<void>;
  saveAdState: () => Promise<void>;

  // Global state
  setAdShowing: (showing: boolean) => void;
}

interface AdStore extends AdState {
  actions: AdActions;
}

// ==========================================
// STORAGE KEY
// ==========================================

const AD_STATE_KEY = "@puzzle_game_ad_state";

// ==========================================
// INITIAL STATE
// ==========================================

const initialState: AdState = {
  lastInterstitialShown: 0,
  lastRewardedShown: 0,
  interstitialPlaytimeAccumMs: 0,
  isInterstitialReady: false,
  isRewardedReady: false,
  isBannerReady: false,
  totalInterstitialsShown: 0,
  totalRewardedShown: 0,
  totalBannersShown: 0,
  isAdShowing: false,
};

// ==========================================
// AD STORE
// ==========================================

export const useAdStore = create<AdStore>((set, get) => ({
  ...initialState,

  actions: {
    // ==========================================
    // INTERSTITIAL ADS
    // ==========================================

    interstitialEligibleByRules: (chapterId: number, levelId: number) => {
      const state = get();

      const isExcluded = AD_RULES.interstitial.excludedLevels.some(
        (excluded) =>
          excluded.chapterId === chapterId && excluded.levelId === levelId,
      );

      if (isExcluded) {
        console.log(`📺 Level ${chapterId}-${levelId} is excluded from ads`);
        return false;
      }

      const playMs = state.interstitialPlaytimeAccumMs;
      if (playMs < AD_RULES.interstitial.minTimeBetweenAds) {
        const remainingSeconds = Math.ceil(
          (AD_RULES.interstitial.minTimeBetweenAds - playMs) / 1000,
        );
        console.log(
          `📺 Interstitial playtime not reached, ~${remainingSeconds}s active play left`,
        );
        return false;
      }

      return true;
    },

    canShowInterstitial: (chapterId: number, levelId: number) => {
      const state = get();

      if (!get().actions.interstitialEligibleByRules(chapterId, levelId)) {
        return false;
      }

      if (!state.isInterstitialReady) {
        console.log("📺 Interstitial not ready");
        return false;
      }

      return true;
    },

    markInterstitialShown: () => {
      const now = Date.now();
      set((state) => ({
        lastInterstitialShown: now,
        totalInterstitialsShown: state.totalInterstitialsShown + 1,
        isInterstitialReady: false,
        interstitialPlaytimeAccumMs: 0,
      }));
      get().actions.saveAdState();
    },

    addInterstitialPlaytimeMs: (deltaMs: number) => {
      if (deltaMs <= 0) return;
      set((state) => ({
        interstitialPlaytimeAccumMs:
          state.interstitialPlaytimeAccumMs + deltaMs,
      }));
      get().actions.saveAdState();
    },

    resetInterstitialPlaytime: () => {
      set({ interstitialPlaytimeAccumMs: 0 });
      get().actions.saveAdState();
    },

    setInterstitialReady: (ready: boolean) => {
      set({ isInterstitialReady: ready });
    },

    // ==========================================
    // REWARDED ADS
    // ==========================================

    canShowRewarded: () => {
      const state = get();

      if (!AD_RULES.rewarded.enabled) {
        console.log("🎁 Rewarded ads disabled");
        return false;
      }

      if (!state.isRewardedReady) {
        console.log("🎁 Rewarded not ready");
        return false;
      }

      return true;
    },

    markRewardedShown: () => {
      const now = Date.now();
      set((state) => ({
        lastRewardedShown: now,
        totalRewardedShown: state.totalRewardedShown + 1,
        isRewardedReady: false, // Will be reloaded
      }));
      get().actions.saveAdState();
    },

    setRewardedReady: (ready: boolean) => {
      set({ isRewardedReady: ready });
    },

    // ==========================================
    // BANNER ADS
    // ==========================================

    canShowBanner: () => {
      const state = get();
      return AD_RULES.banner.showInGame && state.isBannerReady;
    },

    setBannerReady: (ready: boolean) => {
      set({ isBannerReady: ready });
    },

    // ==========================================
    // NATIVE ADS
    // ==========================================

    shouldShowNativeAdAtIndex: (index: number) => {
      if (!AD_RULES.native.showInChapters) return false;

      // Show ad every N chapters (e.g., after chapter 4, 8, 12, etc.)
      // Index is 0-based, so we add 1
      const chapterNumber = index + 1;
      return chapterNumber % AD_RULES.native.showEveryNChapters === 0;
    },

    // ==========================================
    // PERSISTENCE
    // ==========================================

    loadAdState: async () => {
      try {
        const stored = await AsyncStorage.getItem(AD_STATE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          set({
            lastInterstitialShown: parsed.lastInterstitialShown || 0,
            lastRewardedShown: parsed.lastRewardedShown || 0,
            interstitialPlaytimeAccumMs:
              parsed.interstitialPlaytimeAccumMs ?? 0,
            totalInterstitialsShown: parsed.totalInterstitialsShown || 0,
            totalRewardedShown:
              parsed.totalRewardedShown ?? parsed.totalRewardedsShown ?? 0,
            totalBannersShown: parsed.totalBannersShown || 0,
          });
          console.log("📺 Ad state loaded from storage");
        }
      } catch (error) {
        console.error("📺 Failed to load ad state:", error);
      }
    },

    saveAdState: async () => {
      try {
        const state = get();
        const toSave = {
          lastInterstitialShown: state.lastInterstitialShown,
          lastRewardedShown: state.lastRewardedShown,
          interstitialPlaytimeAccumMs: state.interstitialPlaytimeAccumMs,
          totalInterstitialsShown: state.totalInterstitialsShown,
          totalRewardedShown: state.totalRewardedShown,
          totalBannersShown: state.totalBannersShown,
        };
        await AsyncStorage.setItem(AD_STATE_KEY, JSON.stringify(toSave));
      } catch (error) {
        console.error("📺 Failed to save ad state:", error);
      }
    },

    setAdShowing: (showing: boolean) => {
      set({ isAdShowing: showing });
    },
  },
}));

// ==========================================
// HOOKS
// ==========================================

export const useAdActions = () => useAdStore((state) => state.actions);
export const useIsInterstitialReady = () =>
  useAdStore((state) => state.isInterstitialReady);
export const useIsRewardedReady = () =>
  useAdStore((state) => state.isRewardedReady);
export const useIsBannerReady = () =>
  useAdStore((state) => state.isBannerReady);
export const useIsAdShowing = () => useAdStore((state) => state.isAdShowing);
