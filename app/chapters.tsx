import {
  BOARD_PADDING,
  COLORS,
  getGridColumns,
} from "@/src/constants/gameConfig";
import { useAdActions } from "@/src/store/adStore";
import {
  useChapters,
  useDataActions,
  useIsDataLoading,
} from "@/src/store/dataStore";
import { useProgressActions, useTotalStars } from "@/src/store/progressStore";
import { Chapter } from "@/src/types";
import { LegendList } from "@legendapp/list";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import ChapterCard from "../src/components/ChapterCard";
import ChapterNativeAd from "../src/components/ChapterNativeAd";

export default function ChaptersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const totalStars = useTotalStars();
  const progressActions = useProgressActions();
  const chapters = useChapters();
  const { getChapters } = useDataActions();
  const isLoading = useIsDataLoading();
  const adActions = useAdActions();
  // Performance: Defer heavy render until navigation animation completes
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setCanRender(true);
    });
    return () => task.cancel();
  }, []);

  React.useEffect(() => {
    getChapters();
  }, []);

  const numColumns = getGridColumns(width);
  const padding = BOARD_PADDING;
  const gap = 15;
  const cardWidth = (width - padding * 2 - gap * (numColumns - 1)) / numColumns;

  // Create rows of chapters with ads inserted at appropriate positions
  const listData = React.useMemo(() => {
    const rows: Array<{ type: "row" | "ad"; items?: Chapter[]; id: string }> =
      [];
    let currentRow: Chapter[] = [];
    let adAdded = false;

    chapters.forEach((chapter, index) => {
      currentRow.push(chapter);

      // When row is full or it's the last chapter
      if (currentRow.length === numColumns || index === chapters.length - 1) {
        rows.push({
          type: "row",
          items: [...currentRow],
          id: `row-${rows.length}`,
        });
        currentRow = [];
      }

      // Add ad only once
      if (!adAdded && adActions.shouldShowNativeAdAtIndex(index)) {
        rows.push({
          type: "ad",
          id: `ad-${index}`,
        });
        adAdded = true;
      }
    });

    return rows;
  }, [chapters, numColumns, adActions]);

  // Memoized renderItem - prevents re-creating function on each render
  const renderItem = useCallback(
    ({ item }: { item: (typeof listData)[0] }) => {
      if (item.type === "ad") {
        return <ChapterNativeAd index={parseInt(item.id.split("-")[1])} />;
      }

      // Render row of chapters
      return (
        <View style={[styles.chapterRow, { gap }]}>
          {item.items?.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              index={chapters.indexOf(chapter)}
              isUnlocked={progressActions.isChapterUnlocked(chapter.id)}
              progress={progressActions.getChapterProgress(chapter.id)}
              cardWidth={cardWidth}
              onPress={() => router.push(`/levels/${chapter.id}`)}
            />
          ))}
        </View>
      );
    },
    [cardWidth, gap, chapters, progressActions, router],
  );

  // Memoized separator - avoids inline function recreation
  const ItemSeparator = useCallback(
    () => <View style={{ height: gap }} />,
    [gap],
  );

  // getItemLayout - eliminates layout measurement overhead for fixed-size rows
  const ROW_HEIGHT = cardWidth * 1.5 + 100; // card aspect ratio + info area padding

  // Show loading until navigation animation completes AND data is ready
  if (!canRender || (isLoading && chapters.length === 0)) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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

      <LegendList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { padding }]}
        ItemSeparatorComponent={ItemSeparator}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={ROW_HEIGHT}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { justifyContent: "center", alignItems: "center" },
  chapterRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  headerStars: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  headerStarIcon: { fontSize: 16, color: COLORS.starFilled },
  headerStarText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  listContent: { paddingBottom: 40 },
});
