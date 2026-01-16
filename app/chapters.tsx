import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  BOARD_PADDING,
  COLORS,
  getGridColumns,
} from "../src/constants/gameConfig";
import {
  useChapters,
  useDataActions,
  useIsDataLoading,
} from "../src/store/dataStore";
import { useProgressActions, useTotalStars } from "../src/store/progressStore";
import { Chapter } from "../src/types";

interface ChapterCardProps {
  chapter: Chapter;
  index: number;
  isUnlocked: boolean;
  progress: { completed: number; total: number; stars: number };
  cardWidth: number;
  onPress: () => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  index,
  isUnlocked,
  progress,
  cardWidth,
  onPress,
}) => {
  const progressPercent = (progress.completed / progress.total) * 100;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).springify()}
      style={{ width: cardWidth }}
    >
      <TouchableOpacity
        style={[styles.card, !isUnlocked && styles.cardLocked]}
        onPress={onPress}
        disabled={!isUnlocked}
        activeOpacity={0.7}
      >
        {/* Thumbnail Section */}
        <View style={styles.thumbnailArea}>
          <Image
            source={chapter.thumbnail}
            style={styles.thumbnail}
            contentFit="cover"
          />
          <View style={styles.overlay} />
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeTxt}>{chapter.id}</Text>
          </View>
          {!isUnlocked && (
            <View style={styles.lockedArea}>
              <Text style={styles.lockIc}>🔒</Text>
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
            <Text style={styles.starIc}>★</Text>
            <Text style={styles.starVal}>{progress.stars}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ChaptersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const totalStars = useTotalStars();
  const progressActions = useProgressActions();
  const chapters = useChapters();
  const { getChapters } = useDataActions();
  const isLoading = useIsDataLoading();

  React.useEffect(() => {
    getChapters();
  }, []);

  const numColumns = getGridColumns(width);
  const padding = BOARD_PADDING;
  const gap = 15;
  const cardWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  if (isLoading && chapters.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Bölümler",
          headerStyle: { backgroundColor: COLORS.background },
          headerTintColor: COLORS.textPrimary,
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerStars}>
              <Text style={styles.headerStarIcon}>★</Text>
              <Text style={styles.headerStarText}>{totalStars}</Text>
            </View>
          ),
        }}
      />

      <FlatList
        data={chapters}
        renderItem={({ item, index }) => (
          <ChapterCard
            chapter={item}
            index={index}
            isUnlocked={progressActions.isChapterUnlocked(item.id)}
            progress={progressActions.getChapterProgress(item.id)}
            cardWidth={cardWidth}
            onPress={() => router.push(`/levels/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={[styles.listContent, { padding }]}
        columnWrapperStyle={{ gap }}
        ItemSeparatorComponent={() => <View style={{ height: gap }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: "center", alignItems: "center" },
  headerStars: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerStarIcon: { fontSize: 16, color: COLORS.starFilled },
  headerStarText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  listContent: { paddingBottom: 40 },
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
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  idBadgeTxt: { color: COLORS.textPrimary, fontWeight: "900", fontSize: 13 },
  lockedArea: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockIc: { fontSize: 32 },
  infoArea: { padding: 15, gap: 10 },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.textPrimary },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceLight,
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
  starIc: { fontSize: 14, color: COLORS.starFilled },
  starVal: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "700" },
});
