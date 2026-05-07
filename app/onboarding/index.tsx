import OnboardingDemoBoard from "@/src/components/onboarding/OnboardingDemoBoard";
import { BOARD_PADDING } from "@/src/constants/gameConfig";
import { COLORS } from "@/src/constants/colors";
import { useClickSound } from "@/src/hooks/useClickSound";
import { useOnboardingActions } from "@/src/store/onboardingStore";
import {
  useProgressActions,
  useProgressStore,
} from "@/src/store/progressStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const { markSeen } = useOnboardingActions();
  const { playClick } = useClickSound();
  const { getNextPlayableLevel } = useProgressActions();

  const hasProgress = useProgressStore(
    (state) => Object.keys(state.progress.completedLevels).length > 0,
  );

  const [placedCount, setPlacedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const startBtnPop = useSharedValue(0);

  const boardSize = Math.min(width - BOARD_PADDING * 2, 380);

  useEffect(() => {
    if (isComplete) {
      startBtnPop.value = 0;
      startBtnPop.value = withTiming(1, {
        duration: 320,
        easing: Easing.out(Easing.back(1.12)),
      });
    }
  }, [isComplete]);

  const startBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: startBtnPop.value }],
    opacity: startBtnPop.value,
  }));

  const handleSkip = useCallback(() => {
    playClick();
    markSeen();
    router.replace("/");
  }, [markSeen, playClick, router]);

  const handleStart = useCallback(async () => {
    playClick();
    markSeen();
    try {
      const target = getNextPlayableLevel() || { chapterId: 1, levelId: 1 };
      const chapterId = target.chapterId || 1;
      const levelId = target.levelId || 1;
      router.replace(`/game/jigsaw/${chapterId}/${levelId}`);
    } catch {
      router.replace("/game/jigsaw/1/1");
    }
  }, [getNextPlayableLevel, markSeen, playClick, router]);

  const handleProgress = useCallback((count: number) => {
    setPlacedCount(count);
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={[styles.skipBar, { paddingTop: top }]}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.skipText}>Atla</Text>
            <Ionicons name="close" size={17} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.boardColumn}>
            <View style={styles.instructionsBlock}>
              <Animated.Text
                entering={FadeInDown.duration(380)}
                style={styles.instructionTitle}
              >
                Nasıl Oynanır
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(70).duration(360)}
                style={styles.instructionBody}
              >
                Parmağınızla parçayı tutup sürükleyin; doğru kareye bırakın.
                İki parça yer değiştirir — dördü de doğru kutuya oturunca oyun
                biter.
              </Animated.Text>
            </View>

            <OnboardingDemoBoard
              boardSize={boardSize}
              onProgress={handleProgress}
              onComplete={handleComplete}
            />

            <View style={styles.stepChip}>
              <Text style={styles.stepChipText}>
                {placedCount} / {TOTAL_STEPS} parça
              </Text>
            </View>
          </View>

          <View style={styles.bottomBlock}>
            <View style={styles.dotsRow}>
              {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
                const isDone = idx < placedCount;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isDone
                          ? COLORS.primary
                          : "rgba(255,255,255,0.45)",
                        width: isDone ? 22 : 8,
                      },
                    ]}
                  />
                );
              })}
            </View>

            {isComplete ? (
              <Animated.View
                style={[styles.startBtnOuter, startBtnAnimatedStyle]}
              >
                <TouchableOpacity
                  style={styles.startBtn}
                  activeOpacity={0.85}
                  onPress={handleStart}
                >
                  <Text style={styles.startBtnText}>
                    {hasProgress ? "Devam Et" : "Başla"}
                  </Text>
                  <Text style={styles.startBtnArrow}>→</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.Text
                entering={FadeIn.delay(280)}
                style={styles.hintText}
              >
                İpucu: tahtanın üzerinde hareket eden parmağı izleyin — doğru
                kutuyu gösterir.
              </Animated.Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safe: {
    flex: 1,
    paddingHorizontal: BOARD_PADDING,
  },
  skipBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 6,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  skipText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    minHeight: 0,
    justifyContent: "space-between",
  },
  boardColumn: {
    flex: 1,
    minHeight: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  instructionsBlock: {
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  instructionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  instructionBody: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textPrimary,
    fontWeight: "500",
    opacity: 0.82,
    textAlign: "center",
  },
  stepChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
  },
  stepChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
  bottomBlock: {
    alignItems: "center",
    paddingBottom: 18,
    paddingTop: 8,
    gap: 14,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  hintText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    opacity: 0.78,
    textAlign: "center",
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  startBtnOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    gap: 10,
    minWidth: 200,
  },
  startBtnText: {
    color: COLORS.primaryText,
    fontSize: 17,
    fontWeight: "800",
  },
  startBtnArrow: {
    color: COLORS.primaryText,
    fontSize: 20,
    fontWeight: "700",
  },
});
