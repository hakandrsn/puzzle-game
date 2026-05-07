import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { COLORS } from "@/src/constants/colors";
import { useSettingsStore } from "@/src/store/settingsStore";

interface OnboardingPieceProps {
  pieceId: number;
  imageRow: number;
  imageCol: number;
  correctRow: number;
  correctCol: number;
  currentRow: number;
  currentCol: number;
  pieceSize: number;
  gridRows: number;
  gridCols: number;
  imageSource: any;
  isActive: boolean;
  isPlaced: boolean;
  hasNeighborTop?: boolean;
  hasNeighborBottom?: boolean;
  hasNeighborLeft?: boolean;
  hasNeighborRight?: boolean;
  onDrop: (id: number, dropRow: number, dropCol: number) => void;
  /** 0–1 tamamlanma kutlaması — çerçeve soldurur */
  celebrateSV?: SharedValue<number>;
}

const BORDER_WIDTH = 2;
const ACTIVE_BORDER_WIDTH = 3;

const triggerHaptic = (success: boolean) => {
  try {
    const haptics = useSettingsStore.getState().hapticsEnabled;
    if (!haptics) return;
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {}
};

/** JS thread'de state güncellemesini jest tamamlandıktan sonraya kaydırır */
const deferDrop = (fn: () => void) => {
  queueMicrotask(fn);
};

const OnboardingPieceInner: React.FC<OnboardingPieceProps> = ({
  pieceId,
  imageRow,
  imageCol,
  correctRow,
  correctCol,
  currentRow,
  currentCol,
  pieceSize,
  gridRows,
  gridCols,
  imageSource,
  isActive,
  isPlaced,
  hasNeighborTop = false,
  hasNeighborBottom = false,
  hasNeighborLeft = false,
  hasNeighborRight = false,
  onDrop,
  celebrateSV,
}) => {
  const targetX = currentCol * pieceSize;
  const targetY = currentRow * pieceSize;

  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const visualOffsetX = useSharedValue(0);
  const visualOffsetY = useSharedValue(0);
  const scalePulse = useSharedValue(1);
  const hintProgress = useSharedValue(0);
  const isDragging = useSharedValue(0);

  const targetXSV = useSharedValue(targetX);
  const targetYSV = useSharedValue(targetY);
  const isActiveSV = useSharedValue(isActive ? 1 : 0);
  const isPlacedSV = useSharedValue(isPlaced ? 1 : 0);

  const svPieceSize = useSharedValue(pieceSize);
  const svCurrentCol = useSharedValue(currentCol);
  const svCurrentRow = useSharedValue(currentRow);
  const svCorrectCol = useSharedValue(correctCol);
  const svCorrectRow = useSharedValue(correctRow);

  const prevTarget = useRef({ x: targetX, y: targetY });

  useEffect(() => {
    isActiveSV.value = isActive ? 1 : 0;
    isPlacedSV.value = isPlaced ? 1 : 0;
    svPieceSize.value = pieceSize;
    svCurrentCol.value = currentCol;
    svCurrentRow.value = currentRow;
    svCorrectCol.value = correctCol;
    svCorrectRow.value = correctRow;
  }, [
    isActive,
    isPlaced,
    pieceSize,
    currentCol,
    currentRow,
    correctCol,
    correctRow,
  ]);

  useLayoutEffect(() => {
    const newX = currentCol * pieceSize;
    const newY = currentRow * pieceSize;
    const diffX = newX - prevTarget.current.x;
    const diffY = newY - prevTarget.current.y;

    targetXSV.value = newX;
    targetYSV.value = newY;

    if (Math.abs(diffX) > 0.1 || Math.abs(diffY) > 0.1) {
      visualOffsetX.value = visualOffsetX.value - diffX;
      visualOffsetY.value = visualOffsetY.value - diffY;
      visualOffsetX.value = withTiming(0, { duration: 280 });
      visualOffsetY.value = withTiming(0, { duration: 280 });
    }

    prevTarget.current = { x: newX, y: newY };
  }, [currentCol, currentRow, pieceSize]);

  useEffect(() => {
    if (isActive && !isPlaced) {
      scalePulse.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(scalePulse);
      scalePulse.value = withTiming(1, { duration: 200 });
    }
  }, [isActive, isPlaced]);

  useEffect(() => {
    if (isActive && !isPlaced) {
      hintProgress.value = 0;
      hintProgress.value = withDelay(
        400,
        withRepeat(
          withSequence(
            withTiming(1, {
              duration: 1100,
              easing: Easing.inOut(Easing.cubic),
            }),
            withTiming(1, { duration: 250 }),
            withTiming(0, { duration: 0 }),
            withTiming(0, { duration: 500 }),
          ),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(hintProgress);
      hintProgress.value = withTiming(0, { duration: 150 });
    }
  }, [isActive, isPlaced]);

  const runDeferredDrop = useCallback(
    (id: number, dropRow: number, dropCol: number) => {
      deferDrop(() => onDrop(id, dropRow, dropCol));
    },
    [onDrop],
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isActive && !isPlaced)
        .onStart(() => {
          isDragging.value = 1;
          dragX.value = 0;
          dragY.value = 0;
        })
        .onUpdate((e) => {
          dragX.value = e.translationX;
          dragY.value = e.translationY;
        })
        .onEnd((e) => {
          isDragging.value = 0;

          const dropPxX = currentCol * pieceSize + e.translationX;
          const dropPxY = currentRow * pieceSize + e.translationY;

          const dropCol = Math.round(dropPxX / pieceSize);
          const dropRow = Math.round(dropPxY / pieceSize);

          const inBounds =
            dropRow >= 0 &&
            dropRow < gridRows &&
            dropCol >= 0 &&
            dropCol < gridCols;

          const moved = dropRow !== currentRow || dropCol !== currentCol;

          dragX.value = withTiming(0, { duration: 220 });
          dragY.value = withTiming(0, { duration: 220 });

          if (inBounds && moved) {
            const willBePlaced =
              dropRow === correctRow && dropCol === correctCol;
            runOnJS(triggerHaptic)(willBePlaced);
            runOnJS(runDeferredDrop)(pieceId, dropRow, dropCol);
          }
        }),
    [
      isActive,
      isPlaced,
      pieceId,
      pieceSize,
      currentRow,
      currentCol,
      correctRow,
      correctCol,
      gridRows,
      gridCols,
      runDeferredDrop,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: targetXSV.value + visualOffsetX.value + dragX.value,
      },
      {
        translateY: targetYSV.value + visualOffsetY.value + dragY.value,
      },
      { scale: scalePulse.value },
    ],
  }));

  const pieceFrameStyle = useMemo(
    () => ({
      position: "absolute" as const,
      overflow: "hidden" as const,
      borderRadius: 4,
      width: pieceSize,
      height: pieceSize,
      zIndex: isActive ? 500 : isPlaced ? 5 : 10 + pieceId,
    }),
    [pieceSize, isActive, isPlaced, pieceId],
  );

  const isHighlighted = isActive && !isPlaced;
  const sideWidth = isHighlighted ? ACTIVE_BORDER_WIDTH : BORDER_WIDTH;
  const borderOverlayStyle = useMemo(
    () => ({
      ...StyleSheet.absoluteFillObject,
      borderColor: isHighlighted ? COLORS.primary : "#ffffff",
      borderTopWidth: hasNeighborTop ? 0 : sideWidth,
      borderBottomWidth: hasNeighborBottom ? 0 : sideWidth,
      borderLeftWidth: hasNeighborLeft ? 0 : sideWidth,
      borderRightWidth: hasNeighborRight ? 0 : sideWidth,
    }),
    [
      isHighlighted,
      sideWidth,
      hasNeighborTop,
      hasNeighborBottom,
      hasNeighborLeft,
      hasNeighborRight,
    ],
  );

  const imageStyle = useMemo(
    () => ({
      width: gridCols * pieceSize,
      height: gridRows * pieceSize,
      transform: [
        { translateX: -imageCol * pieceSize },
        { translateY: -imageRow * pieceSize },
      ],
    }),
    [gridCols, gridRows, pieceSize, imageCol, imageRow],
  );

  const hintStyle = useAnimatedStyle(() => {
    if (!isActiveSV.value || isPlacedSV.value) {
      return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }] };
    }

    const dragSuppression = isDragging.value === 1 ? 0 : 1;
    const ps = svPieceSize.value;

    const fromX = svCurrentCol.value * ps + ps / 2;
    const fromY = svCurrentRow.value * ps + ps / 2;
    const toX = svCorrectCol.value * ps + ps / 2;
    const toY = svCorrectRow.value * ps + ps / 2;

    const x = interpolate(
      hintProgress.value,
      [0, 1],
      [fromX, toX],
      Extrapolation.CLAMP,
    );
    const y = interpolate(
      hintProgress.value,
      [0, 1],
      [fromY, toY],
      Extrapolation.CLAMP,
    );

    const op = interpolate(
      hintProgress.value,
      [0, 0.1, 0.85, 1],
      [0, 1, 1, 0],
      Extrapolation.CLAMP,
    );

    return {
      opacity: op * dragSuppression,
      transform: [{ translateX: x - 14 }, { translateY: y - 14 }],
    };
  });

  const celebrateBorderStyle = useAnimatedStyle(() => {
    if (!celebrateSV) {
      return { opacity: 1 };
    }
    return {
      opacity: interpolate(
        celebrateSV.value,
        [0, 1],
        [1, 0],
        Extrapolation.CLAMP,
      ),
    };
  });

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[pieceFrameStyle, animatedStyle]}>
          <Image
            source={imageSource}
            style={imageStyle}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <Animated.View
            pointerEvents="none"
            style={[borderOverlayStyle, celebrateBorderStyle]}
          />
        </Animated.View>
      </GestureDetector>

      {isActive && !isPlaced && (
        <Animated.View
          pointerEvents="none"
          style={[styles.hintHand, hintStyle]}
        >
          <Ionicons name="hand-left" size={28} color={COLORS.accent} />
        </Animated.View>
      )}
    </>
  );
};

function propsEqual(
  prev: OnboardingPieceProps,
  next: OnboardingPieceProps,
): boolean {
  return (
    prev.pieceId === next.pieceId &&
    prev.imageRow === next.imageRow &&
    prev.imageCol === next.imageCol &&
    prev.correctRow === next.correctRow &&
    prev.correctCol === next.correctCol &&
    prev.currentRow === next.currentRow &&
    prev.currentCol === next.currentCol &&
    prev.pieceSize === next.pieceSize &&
    prev.gridRows === next.gridRows &&
    prev.gridCols === next.gridCols &&
    prev.imageSource === next.imageSource &&
    prev.isActive === next.isActive &&
    prev.isPlaced === next.isPlaced &&
    prev.hasNeighborTop === next.hasNeighborTop &&
    prev.hasNeighborBottom === next.hasNeighborBottom &&
    prev.hasNeighborLeft === next.hasNeighborLeft &&
    prev.hasNeighborRight === next.hasNeighborRight &&
    prev.onDrop === next.onDrop &&
    prev.celebrateSV === next.celebrateSV
  );
}

const OnboardingPiece = React.memo(OnboardingPieceInner, propsEqual);

const styles = StyleSheet.create({
  hintHand: {
    position: "absolute",
    width: 28,
    height: 28,
    zIndex: 999,
  },
});

export default OnboardingPiece;
