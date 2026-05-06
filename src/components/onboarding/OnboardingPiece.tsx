import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
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
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { COLORS } from "@/src/constants/colors";
import { useSettingsStore } from "@/src/store/settingsStore";

interface OnboardingPieceProps {
  pieceId: number;
  imageRow: number;
  imageCol: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  pieceSize: number;
  gridRows: number;
  gridCols: number;
  imageSource: any;
  isActive: boolean;
  isPlaced: boolean;
  onPlaced: () => void;
}

const SNAP_THRESHOLD_RATIO = 0.5;

const triggerHaptic = () => {
  try {
    const haptics = useSettingsStore.getState().hapticsEnabled;
    if (haptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {}
};

const OnboardingPiece: React.FC<OnboardingPieceProps> = ({
  pieceId,
  imageRow,
  imageCol,
  startX,
  startY,
  targetX,
  targetY,
  pieceSize,
  gridRows,
  gridCols,
  imageSource,
  isActive,
  isPlaced,
  onPlaced,
}) => {
  const tx = useSharedValue(startX);
  const ty = useSharedValue(startY);
  const scale = useSharedValue(1);

  const hintProgress = useSharedValue(0);
  const isDragging = useSharedValue(0);

  // Active piece scale boost - draws attention
  useEffect(() => {
    if (isActive && !isPlaced) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(isPlaced ? 1 : 0.92, { duration: 250 });
    }
  }, [isActive, isPlaced]);

  // Hint finger animation - moves from start to target in a loop
  useEffect(() => {
    if (isActive && !isPlaced) {
      hintProgress.value = 0;
      hintProgress.value = withDelay(
        300,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.cubic) }),
            withTiming(1, { duration: 200 }),
            withTiming(0, { duration: 0 }),
            withTiming(0, { duration: 400 }),
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
        })
        .onUpdate((e) => {
          tx.value = startX + e.translationX;
          ty.value = startY + e.translationY;
        })
        .onEnd((e) => {
          isDragging.value = 0;
          const finalX = startX + e.translationX;
          const finalY = startY + e.translationY;
          const dx = finalX - targetX;
          const dy = finalY - targetY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < pieceSize * SNAP_THRESHOLD_RATIO) {
            tx.value = withSpring(targetX, {
              damping: 18,
              stiffness: 200,
              mass: 0.6,
            });
            ty.value = withSpring(targetY, {
              damping: 18,
              stiffness: 200,
              mass: 0.6,
            });
            runOnJS(triggerHaptic)();
            runOnJS(onPlaced)();
          } else {
            tx.value = withSpring(startX, {
              damping: 15,
              stiffness: 150,
            });
            ty.value = withSpring(startY, {
              damping: 15,
              stiffness: 150,
            });
          }
        }),
    [
      isActive,
      isPlaced,
      startX,
      startY,
      targetX,
      targetY,
      pieceSize,
      onPlaced,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
    zIndex: isActive ? 20 : isPlaced ? 5 : 10,
  }));

  const borderStyle = useAnimatedStyle(() => {
    const isHighlighted = isActive && !isPlaced;
    return {
      borderColor: isHighlighted ? COLORS.primary : "#ffffff",
      borderWidth: isHighlighted ? 3 : 2,
      opacity: isPlaced ? 1 : isActive ? 1 : 0.75,
    };
  });

  // Hint hand: animates from piece center -> target center, fading
  const hintStyle = useAnimatedStyle(() => {
    if (!isActive || isPlaced) {
      return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }] };
    }

    const dragSuppression = isDragging.value === 1 ? 0 : 1;

    const fromX = startX + pieceSize / 2;
    const fromY = startY + pieceSize / 2;
    const toX = targetX + pieceSize / 2;
    const toY = targetY + pieceSize / 2;

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
      transform: [
        { translateX: x - 14 },
        { translateY: y - 14 },
      ],
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
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, borderStyle]}
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
