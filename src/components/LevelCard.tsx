import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/gameConfig";
import { Level, LevelProgress } from "../types";

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
    return (
      <View style={{ width: cardSize, height: cardSize, alignItems: "center" }}>
        <TouchableOpacity
          style={[
            styles.levelCard,
            { width: cardSize, height: cardSize },
            progress?.completed && {
              borderColor: chapterColor || COLORS.accent,
              borderWidth: 2,
            },
            // Highlight Last Active Level (Furthest Unlocked)
            isLastActive && {
              borderColor: COLORS.coral, // Or specific 'Active' color
              borderWidth: 6,
            },
          ]}
          onPress={onPress}
          disabled={!isUnlocked}
          activeOpacity={0.7}
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
                {[1, 2, 3].map((star) => {
                  const isFilled =
                    progress?.completed && star <= (progress?.stars || 0);
                  return (
                    <Ionicons
                      key={star}
                      name="star"
                      size={12}
                      color={isFilled ? "#fbbf24" : "rgba(255,255,255,0.4)"}
                      style={isFilled && styles.starShadow}
                    />
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.centeredContent}>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )}
        </TouchableOpacity>
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
  lockIcon: {
    fontSize: 24,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  starShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
});

export default LevelCard;
