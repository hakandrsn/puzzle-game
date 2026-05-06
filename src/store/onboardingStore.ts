import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface OnboardingState {
  hasSeenOnboarding: boolean;
  isHydrated: boolean;

  actions: {
    markSeen: () => void;
    reset: () => void;
    setHydrated: () => void;
  };
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasSeenOnboarding: false,
      isHydrated: false,

      actions: {
        markSeen: () => set({ hasSeenOnboarding: true }),
        reset: () => set({ hasSeenOnboarding: false }),
        setHydrated: () => set({ isHydrated: true }),
      },
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
      onRehydrateStorage: () => (state) => {
        state?.actions.setHydrated();
      },
    },
  ),
);

export const useHasSeenOnboarding = () =>
  useOnboardingStore((state) => state.hasSeenOnboarding);
export const useOnboardingHydrated = () =>
  useOnboardingStore((state) => state.isHydrated);
export const useOnboardingActions = () =>
  useOnboardingStore((state) => state.actions);
