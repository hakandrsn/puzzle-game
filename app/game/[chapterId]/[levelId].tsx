import ConfirmModal from "@/src/components/ConfirmModal";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { SafeAreaView as SafeAreaContextView } from "react-native-safe-area-context";
import PuzzleBoard from "../../../src/components/PuzzleBoard";
import WinModal from "../../../src/components/WinModal";
import {
  BOARD_PADDING,
  calculateStars,
  COLORS,
  getBoardSize,
  HINT_CONFIG,
  LEVELS_PER_CHAPTER,
} from "../../../src/constants/gameConfig";
import { usePuzzleGame } from "../../../src/hooks/usePuzzleGame";
import {
  showInterstitial,
  showRewarded,
} from "../../../src/services/adManager";
import { useDataActions, useIsDataLoading } from "../../../src/store/dataStore";
import { useHintActions, useHintCount } from "../../../src/store/hintStore";
import { useProgressActions } from "../../../src/store/progressStore";
import { Chapter, Level } from "../../../src/types";

export default function GameBoardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { chapterId, levelId } = useLocalSearchParams<{
    chapterId: string;
    levelId: string;
  }>();
  const [showWinModal, setShowWinModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showSolvedInfoModal, setShowSolvedInfoModal] = useState(false);
  const [showAdSuccessModal, setShowAdSuccessModal] = useState(false);

  const { getChapterById, getLevelById, getChapters } = useDataActions();
  const isLoading = useIsDataLoading();

  const [chapter, setChapter] = useState<Chapter | undefined>();
  const [level, setLevel] = useState<Level | undefined>();

  const progressActions = useProgressActions();
  const hintCount = useHintCount();
  const hintActions = useHintActions();

  useEffect(() => {
    const initData = async () => {
      await getChapters();
      const c = getChapterById(Number(chapterId));
      const l = await getLevelById(Number(chapterId), Number(levelId));
      setChapter(c);
      setLevel(l);
    };
    initData();
  }, [chapterId, levelId]);

  const boardSize = getBoardSize(width);

  useEffect(() => {
    if (level) {
      progressActions.setLastPlayed(level.chapterId, level.id);
    }
  }, [level]);

  const handleWin = useCallback(
    async (moves: number) => {
      if (level) {
        const stars = calculateStars(moves, gridSize);
        setEarnedStars(stars);
        setShowWinModal(true);
        if (level.id === LEVELS_PER_CHAPTER) {
          hintActions.addChapterBonus();
        }
        await showInterstitial();
      }
    },
    [level, hintActions]
  );

  const {
    grid,
    moveCount,
    isSolved,
    gridSize,
    isInitialized,
    handleTilePress,
    resetGame,
    useHint,
    saveState,
    completeAndSave,
  } = usePuzzleGame({
    level: level,
    onWin: handleWin,
  });

  const isUnlocked =
    chapterId && levelId
      ? progressActions.isLevelUnlocked(Number(chapterId), Number(levelId))
      : false;
  const levelProgress =
    chapterId && levelId
      ? progressActions.getLevelProgress(Number(chapterId), Number(levelId))
      : null;
  const isPreviouslyWon = levelProgress?.completed ?? false;
  const [isReplaying, setIsReplaying] = useState(false);
  const effectiveIsSolved = isSolved || (isPreviouslyWon && !isReplaying);

  const handleReplay = () => {
    setIsReplaying(true);
    resetGame();
  };

  const handleResetPress = () => {
    if (effectiveIsSolved && !isReplaying) {
      handleReplay();
      return;
    }

    if (moveCount > 0 && !isSolved) {
      setShowResetModal(true);
    } else {
      resetGame();
    }
  };

  useEffect(() => {
    if (showWinModal) completeAndSave();
  }, [showWinModal, completeAndSave]);

  const handleGetHints = async () => {
    if (hintCount > 0) {
      const isEverythingCorrect = grid.every(
        (val: number, idx: number) =>
          val === idx || val === gridSize.cols * gridSize.rows - 1
      );
      if (isEverythingCorrect) {
        setShowSolvedInfoModal(true);
        return;
      }
      useHint();
      hintActions.useHint();
    } else {
      setShowAdModal(true);
    }
  };

  const handleBack = () => {
    saveState?.();
    router.back();
  };

  if (isLoading || !chapter || !level) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    );
  }

  const isLastLevel = level.id === LEVELS_PER_CHAPTER;
  const currentStars = calculateStars(moveCount, gridSize);

  return (
    <SafeAreaContextView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Optimized HUD Header */}
      <View style={styles.hud}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={32} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>
              {chapter.id}-{level.id}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => setShowPreviewModal(true)}
          >
            <Image source={level.imageSource} style={styles.previewThumb} />
            <Text style={styles.zoomTag}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row: Stars - Moves - Reset */}
        <View style={styles.statsRow}>
          {/* Left: Stars */}
          <View style={styles.starsArea}>
            {[1, 2, 3].map((s) => (
              <Text
                key={s}
                style={[
                  styles.bigStar,
                  s <= currentStars && styles.bigStarFilled,
                ]}
              >
                ★
              </Text>
            ))}
          </View>

          {/* Center: Moves Count */}
          <View style={styles.movesArea}>
            <Text style={styles.movesVal}>{moveCount}</Text>
          </View>

          {/* Right: Reset Button */}
          <TouchableOpacity
            style={styles.resetBtnHeader}
            onPress={handleResetPress}
          >
            <Ionicons name="refresh" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Puzzle Board or Solved Image */}
      <View style={styles.boardWrapper}>
        {effectiveIsSolved && !isSolved && !isReplaying ? (
          <Animated.View
            entering={FadeIn}
            style={{ width: boardSize, height: boardSize }}
          >
            <Image
              source={level.imageSource}
              style={{ width: "100%", height: "100%", borderRadius: 8 }}
            />
          </Animated.View>
        ) : (
          <Animated.View
            entering={FadeIn}
            key={isInitialized ? "board" : "loading"}
          >
            {isInitialized && (
              <PuzzleBoard
                grid={grid}
                gridSize={gridSize}
                imageSource={level.imageSource}
                onTilePress={handleTilePress}
                boardSize={boardSize}
              />
            )}
          </Animated.View>
        )}
      </View>

      {/* Floating Bottom Controls */}
      {/* Floating Bottom Controls - Only Hint or Empty */}
      <View style={styles.controls}>
        {!effectiveIsSolved && (
          <TouchableOpacity
            style={[styles.controlBtn, styles.btnPrimary]}
            onPress={handleGetHints}
          >
            {hintCount > 0 && (
              <View style={[styles.badge, styles.badgeActive]}>
                <Text style={styles.badgeTxt}>{hintCount}</Text>
              </View>
            )}
            <Text style={styles.controlBtnIcon}>💡</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Zoom Preview Modal */}
      <Modal visible={showPreviewModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPreviewModal(false)}
        >
          <Animated.View entering={FadeInUp} style={styles.modalBox}>
            <Image
              source={level.imageSource}
              style={styles.fullImg}
              contentFit="contain"
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowPreviewModal(false)}
            >
              <Text style={styles.modalCloseTxt}>GİZLE</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* --- MODALS --- */}

      {/* 1. Reset Confirmation */}
      <ConfirmModal
        visible={showResetModal}
        title="Yeniden Başlat"
        message="Bölüm ilerlemeniz sıfırlanacak. Emin misiniz?"
        confirmText="Sıfırla"
        cancelText="Vazgeç"
        isDestructive
        onConfirm={() => {
          setShowResetModal(false);
          resetGame();
        }}
        onCancel={() => setShowResetModal(false)}
      />

      {/* 2. Watch Ad Confirmation */}
      <ConfirmModal
        visible={showAdModal}
        title="Hamle Al"
        message={`Reklam izleyerek ${HINT_CONFIG.rewardedAdHints} hamle hakkı kazan!`}
        confirmText="Reklam İzle"
        cancelText="İptal"
        onConfirm={async () => {
          setShowAdModal(false);
          const rewarded = await showRewarded();
          if (rewarded) {
            hintActions.addHints(HINT_CONFIG.rewardedAdHints);
            setTimeout(() => setShowAdSuccessModal(true), 500);
          }
        }}
        onCancel={() => setShowAdModal(false)}
      />

      {/* 3. Already Solved Info */}
      <ConfirmModal
        visible={showSolvedInfoModal}
        title="Zaten Çözüldü"
        message="Tüm parçalar doğru yerinde!"
        confirmText="Tamam"
        onConfirm={() => setShowSolvedInfoModal(false)}
      />

      {/* 4. Ad Success Info */}
      <ConfirmModal
        visible={showAdSuccessModal}
        title="Tebrikler!"
        message={`${HINT_CONFIG.rewardedAdHints} hamle hakkı kazandın!`}
        confirmText="Harika"
        onConfirm={() => setShowAdSuccessModal(false)}
      />

      <WinModal
        visible={showWinModal}
        moves={moveCount}
        stars={earnedStars}
        isLastLevel={isLastLevel}
        chapterColor={chapter.color}
        onNextLevel={() => {
          setShowWinModal(false);
          if (!isLastLevel)
            router.replace(`/game/${chapterId}/${Number(levelId) + 1}`);
        }}
        onReplay={() => {
          setShowWinModal(false);
          handleReplay();
        }}
        onBackToLevels={() => {
          setShowWinModal(false);
          router.replace(`/levels/${chapterId}`);
        }}
      />
    </SafeAreaContextView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hud: {
    paddingHorizontal: BOARD_PADDING,
    paddingTop: 10,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
    paddingHorizontal: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  levelInfo: { flex: 1, alignItems: "center" },
  levelLabel: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  previewBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  previewThumb: { width: "100%", height: "100%" },
  zoomTag: {
    position: "absolute",
    bottom: 0,
    right: 0,
    fontSize: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  starsArea: {
    flexDirection: "row",
    gap: 4,
    width: 60,
  },
  bigStar: { fontSize: 24, color: COLORS.starEmpty },
  bigStarFilled: { color: COLORS.starFilled },

  movesArea: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  movesVal: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.textPrimary,
  },

  resetBtnHeader: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  boardWrapper: {
    flex: 1,
    padding: BOARD_PADDING,
  },
  controls: {
    position: "absolute",
    bottom: 40, // Moved up
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 50, // Increased gap
    zIndex: 100,
  },
  controlBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "transparent",
    borderWidth: 0.5, // Thicker border for visibility
    borderColor: COLORS.accent,
  },
  btnSecondary: {
    backgroundColor: "transparent",
  },
  controlBtnIcon: { fontSize: 32 },
  replayIcon: { fontSize: 48, color: "#fafafa" }, // Much larger
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.surfaceLight,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.background,
    zIndex: 1,
  },
  badgeActive: { backgroundColor: COLORS.accent },
  badgeTxt: { color: COLORS.textPrimary, fontSize: 10, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "90%",
    aspectRatio: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 12,
    alignItems: "center",
  },
  fullImg: { width: "100%", height: "100%", borderRadius: 16 },
  modalClose: { marginTop: 20, padding: 10 },
  modalCloseTxt: {
    color: COLORS.textPrimary,
    fontWeight: "800",
    letterSpacing: 2,
  },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
