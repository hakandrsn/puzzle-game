import { useCallback } from "react";
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const STEP_MS = 36;

/** Kilitli karta dokunuşta hafif titreme — Reanimated UI thread, tek animasyon zinciri */
export function useLockedCardShake() {
  const tx = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const shake = useCallback(() => {
    tx.value = withSequence(
      withTiming(-5, { duration: STEP_MS }),
      withTiming(5, { duration: STEP_MS }),
      withTiming(-3, { duration: STEP_MS }),
      withTiming(3, { duration: STEP_MS }),
      withTiming(0, { duration: STEP_MS }),
    );
  }, []);

  return { shake, shakeStyle };
}
