import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Stores & Hooks
import { calculateStars, COLORS } from "@/src/constants/gameConfig";
import { StarIcon } from "@/src/components/StarCount";
import { useJigsawStore } from "@/src/modules/jigsaw/jigsawStore";
import { useAdStore } from "@/src/store/adStore";
import { useDataActions } from "@/src/store/dataStore";

// Components
import BackgroundMusic from "@/src/components/BackgroundMusic";
import GameBannerAd from "@/src/components/GameBannerAd";
import GameHeader from "@/src/components/game/GameHeader";
import GameStats from "@/src/components/game/GameStats";
import LevelCompleteOverlay from "@/src/components/game/LevelCompleteOverlay";

import { useClickSound } from "@/src/hooks/useClickSound";
import { useInterstitialPlaytime } from "@/src/hooks/useInterstitialPlaytime";
import JigsawBoard from "@/src/modules/jigsaw/JigsawBoard";
import { showInterstitial } from "@/src/services/adManager";
import { useProgressActions } from "@/src/store/progressStore";
import { Level } from "@/src/types";

const GAME_LAYOUT = {
  HEADER: 60, // Fixed height in pixels to prevent overlap on small screens
  // STATS, STARS removed - using natural size
  // BOARD removed - using flex: 1
  NEXT_AREA_HEIGHT: 85, // reduced by ~30% from 120
  STARS_HEIGHT: 60, // Fixed height for Stars area
  BANNER: 0.15,
};

const prefetchedImageUris = new Set<string>();
const prefetchingImageUris = new Map<string, Promise<boolean>>();

const getImageUri = (level?: Level): string | null => {
  const source = level?.imageSource;
  if (typeof source === "object" && source && "uri" in source && source.uri) {
    return source.uri;
  }
  return null;
};

const prefetchLevelImage = (level?: Level): Promise<boolean> => {
  const uri = getImageUri(level);
  if (!uri || prefetchedImageUris.has(uri)) return Promise.resolve(true);

  const inFlight = prefetchingImageUris.get(uri);
  if (inFlight) return inFlight;

  const promise = Image.prefetch(uri)
    .then((success) => {
      if (success) prefetchedImageUris.add(uri);
      return success;
    })
    .catch((error) => {
      console.warn("Prefetch failed", error);
      return false;
    })
    .finally(() => {
      prefetchingImageUris.delete(uri);
    });

  prefetchingImageUris.set(uri, promise);
  return promise;
};

export default function JigsawGameScreen() {
  const router = useRouter();

  // Sounds
  const { playClick } = useClickSound();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    chapterId: string;
    levelId: string;
  }>();

  // Local state for infinite scrolling
  const [currentChapter, setCurrentChapter] = useState(
    Number(params.chapterId),
  );
  const [currentLevelId, setCurrentLevelId] = useState(Number(params.levelId));

  const { getLevelById, getChapters, getChapterById } = useDataActions();
  const { completeLevel, setLastPlayed, unlockChapter } = useProgressActions();
  const resetGame = useJigsawStore((state) => state.actions.resetGame);
  const devSolveLevel = useJigsawStore((state) => state.actions.devSolveLevel);
  const status = useJigsawStore((state) => state.status);
  const moves = useJigsawStore((state) => state.moves);
  const initializeLevel = useJigsawStore(
    (state) => state.actions.initializeLevel,
  );

  const {
    flushPlaytime,
  } = useInterstitialPlaytime();

  const [level, setLevel] = useState<Level | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [transitionOverlayVisible, setTransitionOverlayVisible] =
    useState(false);
  const [boardRevealKey, setBoardRevealKey] = useState(0);
  const isAdvancingRef = useRef(false);
  const winTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const levelTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Win Animation SharedValues
  const headerTranslateY = useSharedValue(0);
  const movesTranslateY = useSharedValue(0);
  const star1Scale = useSharedValue(0);
  const star2Scale = useSharedValue(0);
  const star3Scale = useSharedValue(0);
  const boardScale = useSharedValue(1);
  const continueButtonScale = useSharedValue(0);

  // Layout Animation SharedValues
  const starsHeightAnim = useSharedValue(0);
  const nextAreaHeightAnim = useSharedValue(0);

  const [earnedStars, setEarnedStars] = useState(0);

  const clearWinTimeouts = () => {
    winTimeoutsRef.current.forEach((timer) => clearTimeout(timer));
    winTimeoutsRef.current = [];
  };

  const clearLevelTransitionTimeout = () => {
    if (levelTransitionTimeoutRef.current) {
      clearTimeout(levelTransitionTimeoutRef.current);
      levelTransitionTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearWinTimeouts();
      clearLevelTransitionTimeout();
    };
  }, []);

  // Initialize Data (Initial Load)
  useEffect(() => {
    const initData = async () => {
      await getChapters();
      loadLevel(currentChapter, currentLevelId);
    };
    initData();
  }, []);

  const loadLevel = async (chapId: number, lvlId: number) => {
    setIsLoading(true);

    // Board animasyon değerlerini sıfırla - önceki level'dan kalma değerleri temizle
    boardScale.value = 1;

    const l = await getLevelById(chapId, lvlId);
    if (l) {
      // Initialize game logic BEFORE hiding loader
      initializeLevel(l.gridSize);
      // Save as last played immediately when entering logic
      setLastPlayed(chapId, lvlId);
    }
    setLevel(l);
    setIsLoading(false);
  };

  useEffect(() => {
    clearWinTimeouts();

    if (status === "won" && level) {
      // Progress is saved when the player advances, regardless of ad availability.

      const prefetchNextLevel = async () => {
        try {
          let nextChapter = currentChapter;
          let nextLevel = currentLevelId + 1;

          let nextLvl = await getLevelById(nextChapter, nextLevel);
          if (!nextLvl) {
            nextChapter++;
            nextLevel = 1;
            if (!getChapterById(nextChapter)) return;
            nextLvl = await getLevelById(nextChapter, nextLevel);
          }

          await prefetchLevelImage(nextLvl);
        } catch (e) {}
      };
      prefetchNextLevel();

      // Delay before starting win sequence
      const timer = setTimeout(() => {
        // Calculate stars
        const stars = calculateStars(moves, level.gridSize);
        setEarnedStars(stars);

        // Header stays inside the safe area even during the win sequence.
        headerTranslateY.value = withTiming(0, { duration: 400 });
        movesTranslateY.value = withTiming(-30, { duration: 500 });
        // Scale handled in separate useEffect
        // boardScale.value = withTiming(0.85, { duration: 500 });

        winTimeoutsRef.current.push(setTimeout(() => {
          star1Scale.value = withTiming(1, { duration: 300 });
        }, 400));
        winTimeoutsRef.current.push(setTimeout(() => {
          star2Scale.value = withTiming(1, { duration: 300 });
        }, 600));
        winTimeoutsRef.current.push(setTimeout(() => {
          star3Scale.value = withTiming(1, { duration: 300 });
        }, 800));

        winTimeoutsRef.current.push(setTimeout(() => {
          setShowContinue(true);
          continueButtonScale.value = withTiming(1, { duration: 400 });
        }, 1200));
      }, 800);
      winTimeoutsRef.current.push(timer);
      return clearWinTimeouts;
    }
  }, [status, level, currentChapter, currentLevelId]);

  const handleBack = () => {
    router.back();
  };

  // Helper: Win UI resetleme kodunu ayır (Clean Code)
  const resetWinUI = () => {
    clearWinTimeouts();
    setShowContinue(false);
    setEarnedStars(0);
    headerTranslateY.value = 0;
    movesTranslateY.value = 0;
    boardScale.value = 1;
    continueButtonScale.value = 0;
    star1Scale.value = 0;
    star2Scale.value = 0;
    star3Scale.value = 0;
  };

  const handleNextLevel = async () => {
    if (isAdvancingRef.current) return;
    playClick();
    if (!level) return;

    isAdvancingRef.current = true;
    setIsAdvancing(true);
    setTransitionOverlayVisible(true);
    setIsLoading(true);

    const finishAdvancing = () => {
      isAdvancingRef.current = false;
      setIsAdvancing(false);
    };

    try {
      let nextChapter = currentChapter;
      let nextLevelId = currentLevelId + 1;
      let nextLvlData = await getLevelById(currentChapter, nextLevelId);

      if (!nextLvlData) {
        nextChapter++;
        nextLevelId = 1;

        const nextChapterData = getChapterById(nextChapter);
        if (!nextChapterData) {
          setTransitionOverlayVisible(false);
          router.back();
          finishAdvancing();
          return;
        }

        unlockChapter(nextChapter);
        nextLvlData = await getLevelById(nextChapter, nextLevelId);
      }

      completeLevel(currentChapter, currentLevelId, moves, level.gridSize);

      if (!nextLvlData) {
        setIsLoading(false);
        setTransitionOverlayVisible(false);
        finishAdvancing();
        return;
      }

      const imagePrefetchPromise = prefetchLevelImage(nextLvlData);

      const isEligibleForAds = currentChapter !== 1 || currentLevelId >= 4;

      if (isEligibleForAds) {
        flushPlaytime();
        if (__DEV__) {
          const s = useAdStore.getState();
          const rulesOk = s.actions.interstitialEligibleByRules(
            currentChapter,
            currentLevelId,
          );
          console.log("📺 [dev] interstitial gate", {
            playtimeMs: s.interstitialPlaytimeAccumMs,
            ready: s.isInterstitialReady,
            rulesOk,
            chapter: currentChapter,
            level: currentLevelId,
          });
        }
        const canShow = useAdStore
          .getState()
          .actions.canShowInterstitial(currentChapter, currentLevelId);
        if (canShow) {
          await showInterstitial();
        }
      }

      await imagePrefetchPromise;

      clearLevelTransitionTimeout();
      levelTransitionTimeoutRef.current = setTimeout(() => {
        resetWinUI();
        resetGame();
        initializeLevel(nextLvlData.gridSize);

        setCurrentChapter(nextChapter);
        setCurrentLevelId(nextLevelId);
        setLevel(nextLvlData);
        setLastPlayed(nextChapter, nextLevelId);

        levelTransitionTimeoutRef.current = setTimeout(() => {
          levelTransitionTimeoutRef.current = null;
          setTransitionOverlayVisible(false);
          setBoardRevealKey((key) => key + 1);
          setIsLoading(false);
          finishAdvancing();
        }, 80);
      }, 50);
    } catch (error) {
      console.warn("Level transition failed:", error);
      setIsLoading(false);
      setTransitionOverlayVisible(false);
      finishAdvancing();
    }
  };

  const handleReplay = () => {
    headerTranslateY.value = 0;
    boardScale.value = 1;
    continueButtonScale.value = 0;
    setShowContinue(false);
    star1Scale.value = 0;
    star2Scale.value = 0;
    star3Scale.value = 0;

    resetGame();
    if (level) {
      initializeLevel(level.gridSize);
    }
  };

  // Animated Styles

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));
  const movesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: movesTranslateY.value }],
  }));
  const star1Style = useAnimatedStyle(() => ({
    transform: [{ scale: star1Scale.value }],
  }));
  const star2Style = useAnimatedStyle(() => ({
    transform: [{ scale: star2Scale.value }],
  }));
  const star3Style = useAnimatedStyle(() => ({
    transform: [{ scale: star3Scale.value }],
  }));
  // Board animation sadece won durumunda tetiklenmeli, playing'de sabit kalmalı
  const boardAnimatedStyle = useAnimatedStyle(() => {
    // Scale ve translateY değerlerini uygula
    // Bu değerler sadece win animasyonunda değişiyor
    return {
      transform: [{ scale: boardScale.value }],
    };
  });
  const continueButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueButtonScale.value }],
  }));

  // Layout Calculations - STACK LAYOUT

  const HEADER_HEIGHT_CONTENT = GAME_LAYOUT.HEADER;
  const HEADER_HEIGHT_TOTAL = HEADER_HEIGHT_CONTENT + insets.top;
  const BANNER_HEIGHT = height * GAME_LAYOUT.BANNER;

  // Animation values for Layout Transition

  // Update animations when status changes to won
  useEffect(() => {
    if (status === "won") {
      starsHeightAnim.value = withTiming(GAME_LAYOUT.STARS_HEIGHT, {
        duration: 500,
      });
      nextAreaHeightAnim.value = withTiming(GAME_LAYOUT.NEXT_AREA_HEIGHT, {
        duration: 500,
      });
      boardScale.value = withTiming(0.85, {
        // Shrink to fit
        duration: 500,
      });
    } else {
      // Reset
      starsHeightAnim.value = withTiming(0, { duration: 300 });
      nextAreaHeightAnim.value = withTiming(0, { duration: 300 });
      boardScale.value = withTiming(1, { duration: 300 });
    }
  }, [status]);

  const starsAnimatedStyle = useAnimatedStyle(() => ({
    height: starsHeightAnim.value,
    width: interpolate(
      starsHeightAnim.value,
      [0, GAME_LAYOUT.STARS_HEIGHT],
      [0, 160], // Approximate width of 3 stars
    ),
    opacity: interpolate(
      starsHeightAnim.value,
      [0, GAME_LAYOUT.STARS_HEIGHT],
      [0, 1],
    ),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  }));

  const nextAreaAnimatedStyle = useAnimatedStyle(() => ({
    height: nextAreaHeightAnim.value,
    opacity: interpolate(
      nextAreaHeightAnim.value,
      [0, GAME_LAYOUT.NEXT_AREA_HEIGHT],
      [0, 1],
    ),
    overflow: "hidden",
  }));

  // Render Inner Content (The Game)
  // We extract this to render it twice (once for prev, once for next)
  // BUT 'prev' is static image, 'next' is interactive board.
  // So we handle them explicitly.

  if (isLoading && !level) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Level Hazırlanıyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: COLORS.background }}
      >
        <BackgroundMusic />

        <View style={styles.screenContent}>
          <View style={styles.gameArea}>
            {/* 1. HEADER (5% + Safe Area Top) */}
            {/* We use a container with explicit height to reserve space in the stack */}
            <View style={{ height: HEADER_HEIGHT_TOTAL, zIndex: 100 }}>
              <GameHeader
                title={level?.name || `Level ${currentLevelId}`}
                imageSource={level?.imageSource}
                onBack={handleBack}
                // onReplay removed
                onPreview={() => setShowPreview(true)}
                topInset={insets.top}
                // GameHeader logic: height prop is the content height. It adds topInset itself.
                // We want it to be visually fitting.
                height={HEADER_HEIGHT_CONTENT}
                animatedStyle={headerAnimatedStyle}
              />
            </View>

            {/* 2. & 3. INFO ROW (Stats + Stars) */}
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                zIndex: 90,
                width: "100%",
                marginTop: 8,
                marginBottom: 8,
              }}
            >
              <GameStats
                moves={moves}
                // height removed, use natural
                movesAnimatedStyle={movesAnimatedStyle}
              />
          {/*    <Text style={styles.playtimeHint} numberOfLines={1}>
                Aktif oyun: {formattedTotal} / {formattedThreshold}
                {msUntilAd > 0
                  ? ` (${formattedUntilAd} kalan)`
                  : " — süre eşiği doldu"}
              </Text>
    */}
              {/* Stars Area */}
              <Animated.View style={starsAnimatedStyle}>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {[1, 2, 3].map((star) => (
                    <Animated.View
                      key={star}
                      style={
                        star === 1
                          ? star1Style
                          : star === 2
                            ? star2Style
                            : star3Style
                      }
                    >
                      <StarIcon size={40} dimmed={earnedStars < star} />
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            </View>

            {/* 4. BOARD AREA (Flex: 1 - Takes remaining space) */}
            <View
              style={{
                flex: 1,
                width: width,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20, // Move spacing here
              }}
            >
              {/* CONFETTI - BEHIND BOARD */}
              {status === "won" && (
                <View style={styles.confettiContainer} pointerEvents="none">
                  <LottieView
                    source={require("@/src/assets/animations/confettie.json")}
                    style={{ flex: 1 }}
                    autoPlay
                    loop={true}
                  />
                </View>
              )}

              {/* BOARD CONTENT */}
              <Animated.View
                style={[
                  {
                    flex: 1,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  boardAnimatedStyle,
                ]}
              >
                {level ? (
                  <JigsawBoard
                    key={`${currentChapter}-${currentLevelId}`}
                    gridSize={level.gridSize}
                    imageSource={level.imageSource}
                    boardWidth={width}
                    // Use approximate max height to calculate piece sizes
                    // The flex container will clip/shrink the view, but piece calculations
                    // stay based on this "ideal" height.
                    boardHeight={height - HEADER_HEIGHT_TOTAL - BANNER_HEIGHT - 60}
                    canRevealPieces={!transitionOverlayVisible}
                    revealKey={boardRevealKey}
                  />
                ) : (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                  </View>
                )}
              </Animated.View>
            </View>

            {/* 5. NEXT / LEVEL COMPLETE AREA (Variable Height) */}
            <Animated.View style={nextAreaAnimatedStyle}>
              <LevelCompleteOverlay
                visible={true}
                animatedStyle={continueButtonStyle}
                onNext={handleNextLevel}
                onReplay={handleReplay}
                disabled={isAdvancing}
              />
            </Animated.View>

            {transitionOverlayVisible && (
              <View style={styles.transitionOverlay} pointerEvents="auto">
                <View style={styles.transitionLoadingBox}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.loadingText}>Level Hazırlanıyor...</Text>
                </View>
              </View>
            )}
          </View>

          <View
            style={{
              height: BANNER_HEIGHT + insets.bottom,
              paddingBottom: insets.bottom,
              justifyContent: "flex-end",
              alignItems: "center",
              backgroundColor: "transparent",
              zIndex: 50,
            }}
          >
            <GameBannerAd />
          </View>
        </View>

        {/* GLOBAL MODALS */}
        {__DEV__ && status === "playing" && level && !isLoading && (
          <TouchableOpacity
            style={[
              styles.devSolveFab,
              {
                bottom: BANNER_HEIGHT + insets.bottom + 16,
                right: 12,
              },
            ]}
            onPress={devSolveLevel}
            activeOpacity={0.85}
          >
            <Text style={styles.devSolveFabText}>Hızlı çöz (dev)</Text>
          </TouchableOpacity>
        )}

        <Modal
          visible={showPreview}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPreview(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPreview(false)}
          >
            <View style={styles.previewContainer}>
              {level && (
                <Image
                  source={level.imageSource}
                  style={{ width: width * 0.9, height: height * 0.6 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              )}
              <Text style={styles.previewText}>Tap to Close</Text>
            </View>
          </TouchableOpacity>
        </Modal>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gameArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: "hidden",
    position: "relative",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    minWidth: 150,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  transitionLoadingBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
    minWidth: 180,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    color: COLORS.textPrimary,
    marginTop: 20,
    fontSize: 16,
    opacity: 0.8,
  },
  // bottomBanner: removed
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  playtimeHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  devSolveFab: {
    position: "absolute",
    zIndex: 200,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
  },
  devSolveFabText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "700",
  },
});
