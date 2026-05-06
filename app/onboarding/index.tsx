import ScreenHeader from "@/src/components/ScreenHeader";
import OnboardingDemoBoard from "@/src/components/onboarding/OnboardingDemoBoard";
import { COLORS } from "@/src/constants/colors";
import { useClickSound } from "@/src/hooks/useClickSound";
import { useOnboardingActions } from "@/src/store/onboardingStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { markSeen } = useOnboardingActions();
  const { playClick } = useClickSound();

  const [placedCount, setPlacedCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

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
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <ScreenHeader
          titlesAlign="center"
          contentStyle={styles.headerArea}
          titleNode={
            <Animated.Text
              entering={FadeInDown.duration(420)}
              style={styles.title}
            >
              Nasıl Oynanır
            </Animated.Text>
          }
          bottomSlot={
            <View style={styles.headerMeta}>
              <Animated.Text
                entering={FadeInDown.delay(100).duration(400)}
                style={styles.subtitle}
              >
                Parçaları yer değiştirerek tamamla
              </Animated.Text>
              <View style={styles.stepChip}>
                <Text style={styles.stepChipText}>
                  {placedCount} / {TOTAL_STEPS} parça
                </Text>
              </View>
            </View>
          }
          rightSlot={
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipBtn}
              activeOpacity={0.75}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.skipText}>Atla</Text>
              <Ionicons name="close" size={17} color={COLORS.textPrimary} />
            </TouchableOpacity>
          }
        />

        <View style={styles.boardWrap}>
          <OnboardingDemoBoard
            boardSize={boardSize}
            onProgress={handleProgress}
            onComplete={handleComplete}
          />
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
              entering={FadeIn.delay(280)}
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
  headerArea: {
    paddingBottom: 14,
  },
  headerMeta: {
    width: "100%",
    alignItems: "center",
    gap: 10,
    marginTop: 6,
  },
  title: {
    width: "100%",
    fontSize: 23,
    fontWeight: "800",
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  subtitle: {
    width: "100%",
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textPrimary,
    opacity: 0.88,
    textAlign: "center",
  },
  stepChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
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
  boardWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },
  bottomBlock: {
    alignItems: "center",
    paddingBottom: 22,
    minHeight: 112,
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
    opacity: 0.72,
    textAlign: "center",
    paddingHorizontal: 12,
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
