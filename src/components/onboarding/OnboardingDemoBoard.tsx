import { Image } from "expo-image";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useClickSound } from "@/src/hooks/useClickSound";
import OnboardingPiece from "./OnboardingPiece";

const DEMO_IMAGE = require("@/src/assets/images/onboarding-demo.webp");

const GRID_ROWS = 2;
const GRID_COLS = 2;

/** Hayalet + slot solması; buton bu süreden sonra gösterilir */
const CELEBRATE_MS = 520;
const ON_COMPLETE_AFTER_MS = CELEBRATE_MS + 140;

interface OnboardingDemoBoardProps {
  boardSize: number;
  onComplete: () => void;
  onProgress?: (placedCount: number) => void;
}

interface PieceState {
  id: number;
  imageRow: number;
  imageCol: number;
  correctRow: number;
  correctCol: number;
  row: number;
  col: number;
  isPlaced: boolean;
}

// Deterministic 4-cycle scramble (always identical):
//   correct: 0->(0,0) 1->(0,1) 2->(1,0) 3->(1,1)
//   start:   0@(0,1) 1@(1,0) 2@(1,1) 3@(0,0)
// Solvable in 3 swaps.
const buildInitialPieces = (): PieceState[] => [
  {
    id: 0,
    imageRow: 0,
    imageCol: 0,
    correctRow: 0,
    correctCol: 0,
    row: 0,
    col: 1,
    isPlaced: false,
  },
  {
    id: 1,
    imageRow: 0,
    imageCol: 1,
    correctRow: 0,
    correctCol: 1,
    row: 1,
    col: 0,
    isPlaced: false,
  },
  {
    id: 2,
    imageRow: 1,
    imageCol: 0,
    correctRow: 1,
    correctCol: 0,
    row: 1,
    col: 1,
    isPlaced: false,
  },
  {
    id: 3,
    imageRow: 1,
    imageCol: 1,
    correctRow: 1,
    correctCol: 1,
    row: 0,
    col: 0,
    isPlaced: false,
  },
];

const OnboardingDemoBoard: React.FC<OnboardingDemoBoardProps> = ({
  boardSize,
  onComplete,
  onProgress,
}) => {
  const pieceSize = boardSize / GRID_COLS;

  const [pieces, setPieces] = useState<PieceState[]>(buildInitialPieces);

  const celebrate = useSharedValue(0);

  const { playClick } = useClickSound();

  const allPlaced = useMemo(
    () => pieces.length > 0 && pieces.every((p) => p.isPlaced),
    [pieces],
  );

  useEffect(() => {
    if (allPlaced) {
      celebrate.value = withTiming(1, {
        duration: CELEBRATE_MS,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      celebrate.value = 0;
    }
  }, [allPlaced]);

  const ghostAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 0.26 + celebrate.value * 0.74,
  }));

  const slotsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - celebrate.value,
  }));

  // Active piece = first not-yet-placed piece (deterministic ordering by id)
  const activeId = useMemo(() => {
    const target = pieces.find((p) => !p.isPlaced);
    return target ? target.id : null;
  }, [pieces]);

  // Neighbor merge map: a placed piece "merges" with adjacent placed pieces
  // (mirrors the real game's groupId equality check in JigsawBoard.tsx)
  const neighborConnections = useMemo(() => {
    const placedMap = new Set<string>();
    pieces.forEach((p) => {
      if (p.isPlaced) placedMap.add(`${p.row},${p.col}`);
    });
    const result: Record<
      number,
      { top: boolean; bottom: boolean; left: boolean; right: boolean }
    > = {};
    pieces.forEach((p) => {
      if (!p.isPlaced) {
        result[p.id] = {
          top: false,
          bottom: false,
          left: false,
          right: false,
        };
        return;
      }
      result[p.id] = {
        top: placedMap.has(`${p.row - 1},${p.col}`),
        bottom: placedMap.has(`${p.row + 1},${p.col}`),
        left: placedMap.has(`${p.row},${p.col - 1}`),
        right: placedMap.has(`${p.row},${p.col + 1}`),
      };
    });
    return result;
  }, [pieces]);

  const handleDrop = useCallback(
    (draggedId: number, dropRow: number, dropCol: number) => {
      setPieces((prev) => {
        const dragged = prev.find((p) => p.id === draggedId);
        if (!dragged || dragged.isPlaced) return prev;

        // Same slot: nothing to do
        if (dragged.row === dropRow && dragged.col === dropCol) return prev;

        const occupant = prev.find(
          (p) =>
            p.id !== draggedId && p.row === dropRow && p.col === dropCol,
        );

        // Cannot push a locked (already placed) piece
        if (occupant && occupant.isPlaced) return prev;

        const fromRow = dragged.row;
        const fromCol = dragged.col;

        const next = prev.map((p) => {
          if (p.id === draggedId) {
            const placed =
              dropRow === p.correctRow && dropCol === p.correctCol;
            return { ...p, row: dropRow, col: dropCol, isPlaced: placed };
          }
          if (occupant && p.id === occupant.id) {
            const placed = fromRow === p.correctRow && fromCol === p.correctCol;
            return { ...p, row: fromRow, col: fromCol, isPlaced: placed };
          }
          return p;
        });

        const placedCount = next.filter((p) => p.isPlaced).length;
        const prevPlacedCount = prev.filter((p) => p.isPlaced).length;

        if (placedCount > prevPlacedCount) {
          queueMicrotask(() => playClick());
        }

        if (onProgress) {
          const pc = placedCount;
          requestAnimationFrame(() => onProgress(pc));
        }

        if (placedCount === next.length) {
          setTimeout(() => onComplete(), ON_COMPLETE_AFTER_MS);
        }

        return next;
      });
    },
    [onComplete, onProgress, playClick],
  );

  return (
    <View
      style={[
        styles.container,
        { width: boardSize, height: boardSize },
      ]}
    >
      {/* Arka plan görseli — tamamlanınca opacity ile yumuşak belirir */}
      <Animated.View
        style={[
          styles.boardGhost,
          { width: boardSize, height: boardSize },
          ghostAnimatedStyle,
        ]}
      >
        <Image
          source={DEMO_IMAGE}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* Slot çizgileri — tamamlanınca solar */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.slotsLayer,
          { width: boardSize, height: boardSize },
          slotsAnimatedStyle,
        ]}
      >
        {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, idx) => {
          const r = Math.floor(idx / GRID_COLS);
          const c = idx % GRID_COLS;
          return (
            <View
              key={`slot-${idx}`}
              style={[
                styles.slotOutline,
                {
                  left: c * pieceSize,
                  top: r * pieceSize,
                  width: pieceSize,
                  height: pieceSize,
                },
              ]}
            />
          );
        })}
      </Animated.View>

      {/* Pieces */}
      {pieces.map((p) => {
        const conn = neighborConnections[p.id];
        return (
          <OnboardingPiece
            key={p.id}
            pieceId={p.id}
            imageRow={p.imageRow}
            imageCol={p.imageCol}
            correctRow={p.correctRow}
            correctCol={p.correctCol}
            currentRow={p.row}
            currentCol={p.col}
            pieceSize={pieceSize}
            gridRows={GRID_ROWS}
            gridCols={GRID_COLS}
            imageSource={DEMO_IMAGE}
            isActive={activeId === p.id}
            isPlaced={p.isPlaced}
            hasNeighborTop={conn.top}
            hasNeighborBottom={conn.bottom}
            hasNeighborLeft={conn.left}
            hasNeighborRight={conn.right}
            onDrop={handleDrop}
            celebrateSV={celebrate}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
    borderRadius: 14,
    overflow: "visible",
    zIndex: 0,
  },
  boardGhost: {
    position: "absolute",
    left: 0,
    top: 0,
    overflow: "hidden",
    borderRadius: 12,
  },
  slotsLayer: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  slotOutline: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.26)",
    borderStyle: "dashed",
    borderRadius: 6,
  },
});

export default OnboardingDemoBoard;
