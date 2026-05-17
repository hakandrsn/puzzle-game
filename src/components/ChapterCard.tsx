import { LockIcon, StarCountInline } from "@/src/components/StarCount";
import { COLORS } from "@/src/constants/gameConfig";
import { useLockedCardShake } from "@/src/hooks/useLockedCardShake";
import { Chapter } from "@/src/types";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  isUnlocked: boolean;
  progress: { completed: number; total: number; stars: number };
  cardWidth: number;
  onPress: () => void;
}

const ChapterCard = React.memo<ChapterCardProps>(
  ({ chapter, index, isUnlocked, progress, cardWidth, onPress }) => {
    const progressPercent = (progress.completed / progress.total) * 100;
    const { shake, shakeStyle } = useLockedCardShake();

    const handlePress = () => {
      if (!isUnlocked) {
        shake();
        return;
      }
      onPress();
    };

    return (
      <View style={{ width: cardWidth }}>
        <Pressable
          style={({ pressed }) => ({
            opacity: isUnlocked && pressed ? 0.92 : 1,
          })}
          onPress={handlePress}
        >
          <Animated.View
            style={[styles.card, !isUnlocked && styles.cardLocked, shakeStyle]}
          >
          {/* Thumbnail Section */}
          <View style={styles.thumbnailArea}>
            <Image
              source={chapter.thumbnail}
              style={styles.thumbnail}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            <View style={styles.overlay} />
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeTxt}>{chapter.id}</Text>
            </View>
            {!isUnlocked && (
              <View style={styles.lockedArea}>
                <LockIcon size={50} />
              </View>
            )}
          </View>

          {/* Content Section */}
          <View style={styles.infoArea}>
            <Text style={styles.name} numberOfLines={1}>
              {chapter.name}
            </Text>
            <View style={styles.progressRow}>
              <View style={styles.barBg}>
                <View
                  style={[styles.barFill, { width: `${progressPercent}%` }]}
                />
              </View>
              <Text style={styles.progressStats}>
                {progress.completed}/{progress.total}
              </Text>
            </View>
            <View style={styles.starInfo}>
              <StarCountInline
                count={progress.stars}
                iconSize={14}
                gap={5}
                textStyle={styles.starVal}
              />
            </View>
          </View>
          </Animated.View>
        </Pressable>
      </View>
    );
  },
  (prev, next) => {
    return (
      prev.isUnlocked === next.isUnlocked &&
      prev.progress.completed === next.progress.completed &&
      prev.progress.stars === next.progress.stars &&
      prev.cardWidth === next.cardWidth &&
      prev.index === next.index
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLocked: { opacity: 0.6 },
  thumbnailArea: { aspectRatio: 1.5, position: "relative" },
  thumbnail: { width: "100%", height: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  idBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  idBadgeTxt: { color: COLORS.textPrimary, fontWeight: "900", fontSize: 13 },
  lockedArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoArea: { padding: 15, gap: 10 },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: COLORS.accent },
  progressStats: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  starInfo: { flexDirection: "row", alignItems: "center", gap: 5 },
  starVal: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "700" },
});

export default ChapterCard;
