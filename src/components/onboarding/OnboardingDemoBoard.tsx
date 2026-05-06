import { Image } from "expo-image";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { COLORS } from "@/src/constants/colors";
import { useClickSound } from "@/src/hooks/useClickSound";
import OnboardingPiece from "./OnboardingPiece";

const DEMO_IMAGE = require("@/src/assets/images/splash-icon.png");

const GRID_ROWS = 2;
const GRID_COLS = 2;

interface OnboardingDemoBoardProps {
  containerWidth: number;
  onComplete: () => void;
  onProgress?: (placedCount: number) => void;
}

interface PieceLayout {
  id: number;
  imageRow: number;
  imageCol: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
}

const OnboardingDemoBoard: React.FC<OnboardingDemoBoardProps> = ({
  containerWidth,
  onComplete,
  onProgress,
}) => {
  const TRAY_GAP_X = 10;
  const BOARD_TRAY_GAP = 36;

  const pieceSize = Math.floor((containerWidth - TRAY_GAP_X * 3) / 4);
  const boardSize = pieceSize * GRID_COLS;
  const boardLeft = (containerWidth - boardSize) / 2;
  const trayY = boardSize + BOARD_TRAY_GAP;
  const trayWidth = pieceSize * 4 + TRAY_GAP_X * 3;
  const trayLeft = (containerWidth - trayWidth) / 2;

  const totalHeight = trayY + pieceSize;

  // Fixed deterministic layout (always the same for every onboarding viewing)
  // pieceId -> imageRow/imageCol (which slice of source image)
  // Sequential active order: 0 -> 1 -> 2 -> 3
  const pieces: PieceLayout[] = [
    {
      id: 0,
      imageRow: 0,
      imageCol: 0,
      targetX: boardLeft + 0 * pieceSize,
      targetY: 0 * pieceSize,
      startX: trayLeft + 0 * (pieceSize + TRAY_GAP_X),
      startY: trayY,
    },
    {
      id: 1,
      imageRow: 0,
      imageCol: 1,
      targetX: boardLeft + 1 * pieceSize,
      targetY: 0 * pieceSize,
      startX: trayLeft + 1 * (pieceSize + TRAY_GAP_X),
      startY: trayY,
    },
    {
      id: 2,
      imageRow: 1,
      imageCol: 0,
      targetX: boardLeft + 0 * pieceSize,
      targetY: 1 * pieceSize,
      startX: trayLeft + 2 * (pieceSize + TRAY_GAP_X),
      startY: trayY,
    },
    {
      id: 3,
      imageRow: 1,
      imageCol: 1,
      targetX: boardLeft + 1 * pieceSize,
      targetY: 1 * pieceSize,
      startX: trayLeft + 3 * (pieceSize + TRAY_GAP_X),
      startY: trayY,
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [placedSet, setPlacedSet] = useState<Set<number>>(new Set());

  const { playClick } = useClickSound();

  const handlePiecePlaced = useCallback(
    (pieceId: number) => {
      playClick();
      setPlacedSet((prev) => {
        if (prev.has(pieceId)) return prev;
        const next = new Set(prev);
        next.add(pieceId);
        const placedCount = next.size;
        onProgress?.(placedCount);
        if (placedCount >= pieces.length) {
          setTimeout(() => onComplete(), 350);
        }
        return next;
      });
      setActiveIndex((prev) => Math.min(prev + 1, pieces.length - 1));
    },
    [onComplete, onProgress, pieces.length, playClick],
  );

  return (
    <View
      style={[
        styles.container,
        { width: containerWidth, height: totalHeight },
      ]}
    >
      {/* Faint board background showing target image - same pattern as real game */}
      <View
        style={[
          styles.boardGhost,
          {
            left: boardLeft,
            top: 0,
            width: boardSize,
            height: boardSize,
          },
        ]}
      >
        <Image
          source={DEMO_IMAGE}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>

      {/* Target slot outlines */}
      {pieces.map((p) => (
        <View
          key={`slot-${p.id}`}
          style={[
            styles.slotOutline,
            {
              left: p.targetX,
              top: p.targetY,
              width: pieceSize,
              height: pieceSize,
            },
          ]}
        />
      ))}

      {/* Tray background strip */}
      <View
        style={[
          styles.trayStrip,
          {
            left: trayLeft - 8,
            top: trayY - 8,
            width: trayWidth + 16,
            height: pieceSize + 16,
          },
        ]}
      />

      {/* Pieces */}
      {pieces.map((p, idx) => (
        <OnboardingPiece
          key={p.id}
          pieceId={p.id}
          imageRow={p.imageRow}
          imageCol={p.imageCol}
          startX={p.startX}
          startY={p.startY}
          targetX={p.targetX}
          targetY={p.targetY}
          pieceSize={pieceSize}
          gridRows={GRID_ROWS}
          gridCols={GRID_COLS}
          imageSource={DEMO_IMAGE}
          isActive={idx === activeIndex && !placedSet.has(p.id)}
          isPlaced={placedSet.has(p.id)}
          onPlaced={() => handlePiecePlaced(p.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignSelf: "center",
  },
  boardGhost: {
    position: "absolute",
    opacity: 0.18,
    borderRadius: 6,
    overflow: "hidden",
  },
  slotOutline: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
    borderStyle: "dashed",
    borderRadius: 4,
  },
  trayStrip: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default OnboardingDemoBoard;
