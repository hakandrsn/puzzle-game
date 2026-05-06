import { Image } from "expo-image";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { COLORS } from "@/src/constants/colors";
import { useClickSound } from "@/src/hooks/useClickSound";
import OnboardingPiece from "./OnboardingPiece";

const DEMO_IMAGE = require("@/src/assets/images/splash-icon.png");

const GRID_ROWS = 2;
const GRID_COLS = 2;

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

  const { playClick } = useClickSound();

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
          playClick();
        }

        if (onProgress) {
          // Defer to avoid setState-in-render warning
          setTimeout(() => onProgress(placedCount), 0);
        }

        if (placedCount === next.length) {
          setTimeout(() => onComplete(), 400);
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
      {/* Faint board background showing target image */}
      <View
        style={[
          styles.boardGhost,
          { width: boardSize, height: boardSize },
        ]}
      >
        <Image
          source={DEMO_IMAGE}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>

      {/* Slot outlines */}
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
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    overflow: "visible",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  boardGhost: {
    position: "absolute",
    left: 0,
    top: 0,
    opacity: 0.18,
    overflow: "hidden",
    borderRadius: 6,
  },
  slotOutline: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    borderStyle: "dashed",
    borderRadius: 4,
  },
});

export default OnboardingDemoBoard;
