import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
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

const OnboardingPiece: React.FC<OnboardingPieceProps> = ({
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

  const prevTarget = useRef({ x: targetX, y: targetY });

  // Smooth layout transitions when currentRow/Col changes (mirrors JigsawPiece)
  useLayoutEffect(() => {
    const diffX = targetX - prevTarget.current.x;
    const diffY = targetY - prevTarget.current.y;

    if (Math.abs(diffX) > 0.1 || Math.abs(diffY) > 0.1) {
      visualOffsetX.value = visualOffsetX.value - diffX;
      visualOffsetY.value = visualOffsetY.value - diffY;
      visualOffsetX.value = withTiming(0, { duration: 280 });
      visualOffsetY.value = withTiming(0, { duration: 280 });
    }

    prevTarget.current = { x: targetX, y: targetY };
  }, [targetX, targetY]);

  // Active piece pulse
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

  // Hint finger animation - loops from current slot center to correct slot center
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

          // Snap drag back; final position now controlled by props (currentRow/Col)
          dragX.value = withTiming(0, { duration: 220 });
          dragY.value = withTiming(0, { duration: 220 });

          if (inBounds && moved) {
            const willBePlaced =
              dropRow === correctRow && dropCol === correctCol;
            runOnJS(triggerHaptic)(willBePlaced);
            runOnJS(onDrop)(pieceId, dropRow, dropCol);
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
      onDrop,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: targetX + visualOffsetX.value + dragX.value },
      { translateY: targetY + visualOffsetY.value + dragY.value },
      { scale: scalePulse.value },
    ],
    zIndex: isDragging.value === 1 ? 9999 : isActive ? 20 : isPlaced ? 5 : 10,
  }));

  const isHighlighted = isActive && !isPlaced;
  const sideWidth = isHighlighted ? ACTIVE_BORDER_WIDTH : BORDER_WIDTH;
  const borderOverlayStyle = {
    ...StyleSheet.absoluteFillObject,
    borderColor: isHighlighted ? COLORS.primary : "#ffffff",
    borderTopWidth: hasNeighborTop ? 0 : sideWidth,
    borderBottomWidth: hasNeighborBottom ? 0 : sideWidth,
    borderLeftWidth: hasNeighborLeft ? 0 : sideWidth,
    borderRightWidth: hasNeighborRight ? 0 : sideWidth,
  };

  // Hint finger: loops from current slot center to correct slot center
  const hintStyle = useAnimatedStyle(() => {
    if (!isActive || isPlaced) {
      return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }] };
    }

    const dragSuppression = isDragging.value === 1 ? 0 : 1;

    const fromX = currentCol * pieceSize + pieceSize / 2;
    const fromY = currentRow * pieceSize + pieceSize / 2;
    const toX = correctCol * pieceSize + pieceSize / 2;
    const toY = correctRow * pieceSize + pieceSize / 2;

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

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.piece,
            { width: pieceSize, height: pieceSize },
            animatedStyle,
          ]}
        >
          <Image
            source={imageSource}
            style={{
              width: gridCols * pieceSize,
              height: gridRows * pieceSize,
              transform: [
                { translateX: -imageCol * pieceSize },
                { translateY: -imageRow * pieceSize },
              ],
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <View pointerEvents="none" style={borderOverlayStyle} />
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

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    overflow: "hidden",
    borderRadius: 4,
  },
  hintHand: {
    position: "absolute",
    width: 28,
    height: 28,
    zIndex: 999,
  },
});

export default OnboardingPiece;
