import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { AD_RULES, useAdStore } from "@/src/store/adStore";

function formatMs(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Jigsaw oyun ekranı odaktayken ve uygulama aktifken geçen süreyi biriktirip AsyncStorage ile kalıcı tutar.
 * Reklam açıkken veya arka planda sayım durur.
 */
export function useInterstitialPlaytime() {
  const accum = useAdStore((s) => s.interstitialPlaytimeAccumMs);
  const isAdShowing = useAdStore((s) => s.isAdShowing);

  const segmentStartRef = useRef<number | null>(null);
  const screenFocusedRef = useRef(false);
  const [, setTick] = useState(0);

  const flushPlaytime = useCallback(() => {
    const start = segmentStartRef.current;
    if (start == null) return;
    const delta = Date.now() - start;
    if (delta > 0) {
      useAdStore.getState().actions.addInterstitialPlaytimeMs(delta);
    }
    const canResume =
      screenFocusedRef.current &&
      AppState.currentState === "active" &&
      !useAdStore.getState().isAdShowing;
    segmentStartRef.current = canResume ? Date.now() : null;
  }, []);

  useFocusEffect(
    useCallback(() => {
      screenFocusedRef.current = true;
      if (
        AppState.currentState === "active" &&
        !useAdStore.getState().isAdShowing
      ) {
        segmentStartRef.current = Date.now();
      }

      const interval = setInterval(() => setTick((t) => t + 1), 1000);

      return () => {
        clearInterval(interval);
        screenFocusedRef.current = false;
        const start = segmentStartRef.current;
        if (
          start != null &&
          AppState.currentState === "active" &&
          !useAdStore.getState().isAdShowing
        ) {
          const delta = Date.now() - start;
          if (delta > 0) {
            useAdStore.getState().actions.addInterstitialPlaytimeMs(delta);
          }
        }
        segmentStartRef.current = null;
      };
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        const start = segmentStartRef.current;
        if (start != null && screenFocusedRef.current) {
          const delta = Date.now() - start;
          if (delta > 0) {
            useAdStore.getState().actions.addInterstitialPlaytimeMs(delta);
          }
          segmentStartRef.current = null;
        }
      } else if (
        screenFocusedRef.current &&
        !useAdStore.getState().isAdShowing
      ) {
        segmentStartRef.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isAdShowing) {
      const start = segmentStartRef.current;
      if (start != null) {
        const delta = Date.now() - start;
        if (delta > 0) {
          useAdStore.getState().actions.addInterstitialPlaytimeMs(delta);
        }
        segmentStartRef.current = null;
      }
    } else if (
      screenFocusedRef.current &&
      AppState.currentState === "active"
    ) {
      segmentStartRef.current = Date.now();
    }
  }, [isAdShowing]);

  const appActive = AppState.currentState === "active";
  const liveExtraMs =
    screenFocusedRef.current &&
    segmentStartRef.current != null &&
    appActive &&
    !isAdShowing
      ? Date.now() - segmentStartRef.current
      : 0;

  const totalDisplayMs = accum + liveExtraMs;
  const threshold = AD_RULES.interstitial.minTimeBetweenAds;
  const msUntilAd = Math.max(0, threshold - totalDisplayMs);

  return {
    flushPlaytime,
    accumulatedMs: accum,
    totalDisplayMs,
    msUntilAd,
    formattedTotal: formatMs(totalDisplayMs),
    formattedUntilAd: formatMs(msUntilAd),
    formattedThreshold: formatMs(threshold),
    thresholdMs: threshold,
  };
}
