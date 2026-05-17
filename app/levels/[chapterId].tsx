import ScreenHeader, {
  ScreenHeaderLevelProgressPill,
  ScreenHeaderStarsPill,
} from "@/src/components/ScreenHeader";
import { LegendList } from "@legendapp/list";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  BOARD_PADDING,
  COLORS,
  getResponsiveValue,
} from "@/src/constants/gameConfig";
import {
  useDataActions,
  useIsDataLoading,
  useLevelsByChapter,
} from "@/src/store/dataStore";
import { useProgressStore } from "@/src/store/progressStore";
import { Level } from "@/src/types";


import LevelCard from "../../src/components/LevelCard";

export default function LevelsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  // Subscribe to progress changes using selector for performance
  const userProgress = useProgressStore((state) => state.progress);

  const { getLevels, getChapterById } = useDataActions();
  const isLoading = useIsDataLoading();

  const [isNavigating, setIsNavigating] = useState(false);

  const levels = useLevelsByChapter(Number(chapterId));
  const chapter = getChapterById(Number(chapterId));

  useEffect(() => {
    if (levels.length === 0) {
      getLevels(Number(chapterId));
    }
  }, [chapterId, getLevels, levels.length]);

  const numColumns = getResponsiveValue(width, { phone: 4, tablet: 6 });
  const padding = BOARD_PADDING;
  const gap = 10;
  const cardSize = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  const chapterProgress = React.useMemo(() => {
    let completed = 0;
    let stars = 0;
    for (const level of levels) {
      const key = `${chapterId}-${level.id}`;
      const p = userProgress.completedLevels[key];
      if (p?.completed) {
        completed++;
        stars += p.stars;
      }
    }
    return { completed, total: levels.length, stars };
  }, [userProgress.completedLevels, chapterId, levels]);

  const lastOpenLevelId = React.useMemo(() => {
    if (levels.length === 0 || !chapter) return 1;

    let lastId = 1;
    const isChapterUnlocked = userProgress.unlockedChapters.includes(
      Number(chapterId),
    );

    if (isChapterUnlocked) {
      for (const lvl of levels) {
        let isUnlocked = false;
        if (lvl.id === 1) isUnlocked = true;
        else {
          const prevKey = `${chapterId}-${lvl.id - 1}`;
          isUnlocked =
            userProgress.completedLevels[prevKey]?.completed ?? false;
        }

        if (isUnlocked) {
          lastId = lvl.id;
        } else {
          break;
        }
      }
    }
    return lastId;
  }, [levels, userProgress, chapterId, chapter]);

  const handleLevelPress = useCallback(
    (levelId: number) => {
      setIsNavigating(true);
      setTimeout(() => {
        router.push(`/game/jigsaw/${chapterId}/${levelId}`);
        setTimeout(() => setIsNavigating(false), 500);
      }, 100);
    },
    [router, chapterId],
  );

  const renderLevel = useCallback(
    ({ item, index }: { item: Level; index: number }) => {
      if (!chapter) return null;

      const levelKey = `${chapter.id}-${item.id}`;
      const levelProgress = userProgress.completedLevels[levelKey] || null;
      const isLastActive = item.id === lastOpenLevelId;

      let isUnlocked = false;
      if (userProgress.unlockedChapters.includes(chapter.id)) {
        if (item.id === 1) isUnlocked = true;
        else {
          const prevKey = `${chapter.id}-${item.id - 1}`;
          isUnlocked =
            userProgress.completedLevels[prevKey]?.completed ?? false;
        }
      }

      return (
        <LevelCard
          level={item}
          index={index}
          isUnlocked={isUnlocked}
          isLastActive={isLastActive}
          progress={levelProgress}
          cardSize={cardSize}
          chapterColor={chapter.color}
          onPress={() => handleLevelPress(item.id)}
        />
      );
    },
    [chapter, userProgress, cardSize, handleLevelPress, lastOpenLevelId],
  );

  // Memoized separator - avoids inline function recreation
  const ItemSeparator = useCallback(
    () => <View style={{ height: gap }} />,
    [gap],
  );

  // Show loading only if data is not ready
  if (isLoading && levels.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!chapter) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Kategori bulunamadı</Text>
      </View>
    );
  }

  // Note: numColumns, padding, gap, cardSize already calculated above (before hooks)

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={chapter.name}
        onBack={() => router.back()}
        bottomSlot={
          <ScreenHeaderLevelProgressPill
            completed={chapterProgress.completed}
            total={chapterProgress.total}
          />
        }
        rightSlot={<ScreenHeaderStarsPill value={chapterProgress.stars} />}
      />

      <LegendList
        data={levels}
        renderItem={renderLevel}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={[styles.listContent, { padding }]}
        columnWrapperStyle={{ gap }}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={cardSize + gap}
      />

      {/* Loading Overlay */}
      {isNavigating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    textAlign: "center",
    marginTop: 24,
  },
  listContent: {
    paddingBottom: 40,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
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
});
