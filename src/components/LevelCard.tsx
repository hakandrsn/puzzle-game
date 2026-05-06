import { LockIcon, StarRatingMini } from "@/src/components/StarCount";
import { COLORS } from "../constants/gameConfig";
import { useLockedCardShake } from "@/src/hooks/useLockedCardShake";
import { Level, LevelProgress } from "../types";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

interface LevelCardProps {
  level: Level;
  index: number;
  isUnlocked: boolean;
  isLastActive?: boolean; // New prop
  progress: LevelProgress | null;
  cardSize: number;
  chapterColor?: string;
  onPress: () => void;
}

const LevelCard = React.memo<LevelCardProps>(
  ({
    level,
    index,
    isUnlocked,
    isLastActive,
    progress,
    cardSize,
    chapterColor,
    onPress,
  }) => {
    const { shake, shakeStyle } = useLockedCardShake();

    const handlePress = () => {
      if (!isUnlocked) {
        shake();
        return;
      }
      onPress();
    };

    return (
      <View style={{ width: cardSize, height: cardSize, alignItems: "center" }}>
        <Pressable
          style={({ pressed }) => ({
            opacity: isUnlocked && pressed ? 0.92 : 1,
          })}
          onPress={handlePress}
        >
          <Animated.View
            style={[
              styles.levelCard,
              { width: cardSize, height: cardSize },
              shakeStyle,
              progress?.completed && {
                borderColor: chapterColor || COLORS.accent,
                borderWidth: 2,
              },
              isLastActive && {
                borderColor: COLORS.coral,
                borderWidth: 6,
              },
            ]}
          >
          {/* Background Image */}
          <Image
            source={level.imageSource}
            style={[StyleSheet.absoluteFill, styles.cardBgImage]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />

          {/* Dark Overlay for Readability (Only when locked) */}
          {!isUnlocked && (
            <View style={[StyleSheet.absoluteFill, styles.cardOverlayLocked]} />
          )}

          {isUnlocked ? (
            /* Redesigned Bottom Bar: Number + Stars */
            <View style={styles.cardBottomBar}>
              <Text style={styles.levelNumber}>{level.id}</Text>

              {/* Stars next to number */}
              <View style={styles.starsRowInline}>
                <StarRatingMini
                  filledStars={
                    progress?.completed
                      ? Math.min(3, progress.stars ?? 0)
                      : 0
                  }
                  starSize={12}
                  gap={1}
                />
              </View>
            </View>
          ) : (
            <View style={styles.centeredContent}>
              <LockIcon size={28} />
            </View>
          )}
          </Animated.View>
        </Pressable>
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.isUnlocked === next.isUnlocked &&
      prev.isLastActive === next.isLastActive &&
      prev.progress?.completed === next.progress?.completed &&
      prev.progress?.stars === next.progress?.stars &&
      prev.cardSize === next.cardSize &&
      prev.chapterColor === next.chapterColor
    );
  },
);

const styles = StyleSheet.create({
  levelCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden", // Important for image masking
  },
  cardBgImage: {
    opacity: 1, // Full vibrancy!
  },
  cardOverlayLocked: {
    backgroundColor: "rgba(0,0,0,0.6)", // Lighter lock overlay
  },
  cardBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.6)", // Semi-transparent dark overlay
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
  },
  levelNumber: {
    fontSize: 14,
    fontWeight: "900",
    color: "#ffffff",
  },
  starsRowInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LevelCard;
