import ScreenHeader from "@/src/components/ScreenHeader";
import { Ionicons } from "@expo/vector-icons";
import {Stack, useRouter} from "expo-router";
import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import OnboardingDemoBoard from "@/src/components/onboarding/OnboardingDemoBoard";
import { COLORS } from "@/src/constants/colors";
import { useClickSound } from "@/src/hooks/useClickSound";
import { useOnboardingActions } from "@/src/store/onboardingStore";

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { markSeen } = useOnboardingActions();
  const { playClick } = useClickSound();

  const [placedCount, setPlacedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Single big board - takes most of screen width, capped to a sensible max
  const boardSize = Math.min(width - 32, 380);

  const handleSkip = useCallback(() => {
    playClick();
    markSeen();
    router.replace("/");
  }, [markSeen, playClick, router]);

  const handleStart = useCallback(() => {
    playClick();
    markSeen();
    router.replace("/");
  }, [markSeen, playClick, router]);

  const handleProgress = useCallback((count: number) => {
    setPlacedCount(count);
  }, []);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Top bar with Skip */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            activeOpacity={0.7}
            hitSlop={10}
          >
            <Text style={styles.skipText}>Atla</Text>
            <Ionicons
              name="close"
              size={18}
              color={COLORS.textPrimary}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        {/* Heading */}
        <View style={styles.headingBlock}>
          <Animated.Text
            entering={FadeInDown.duration(450)}
            style={styles.title}
          >
            Nasıl Oynanır
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(150).duration(450)}
            style={styles.subtitle}
          >
            Parçaları yer değiştirerek tamamla
          </Animated.Text>
        </View>

        {/* Demo board */}
        <View style={styles.boardWrap}>
          <OnboardingDemoBoard
            boardSize={boardSize}
            onProgress={handleProgress}
            onComplete={handleComplete}
          />
        </View>

        {/* Step indicator + dots */}
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
                        : "rgba(255,255,255,0.5)",
                      width: isDone ? 22 : 8,
                    },
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.counter}>
            {placedCount} / {TOTAL_STEPS}
          </Text>

          {isComplete ? (
            <Animated.View
              entering={FadeInUp.duration(450).springify()}
              exiting={FadeOut}
            >
              <TouchableOpacity
                style={styles.startBtn}
                activeOpacity={0.85}
                onPress={handleStart}
              >
                <Text style={styles.startBtnText}>Hadi Başla</Text>
                <Text style={styles.startBtnArrow}>→</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.Text
              entering={FadeIn.delay(300)}
              style={styles.hintText}
            >
              Parmağı takip et: parçayı doğru yerine taşı
            </Animated.Text>
          )}
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
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skipText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  headingBlock: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.textPrimary,
    opacity: 0.85,
  },
  boardWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBlock: {
    alignItems: "center",
    paddingBottom: 24,
    minHeight: 130,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  counter: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.85,
    marginBottom: 16,
  },
  hintText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    opacity: 0.7,
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
