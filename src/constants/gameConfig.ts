import { GridSize } from "../types";

export const LEVELS_PER_CHAPTER = 24;
export const TOTAL_CHAPTERS = 20;

// SHUFFLE_MOVES logic moved to puzzleLogic dynamic calculation

export const getGridSizeForLevel = (levelIndex: number): GridSize => {
  if (levelIndex <= 8) return { cols: 3, rows: 4 };
  if (levelIndex <= 16) return { cols: 4, rows: 5 };
  return { cols: 5, rows: 6 };
};

export const normalizeGridSize = (
  size: GridSize | number | undefined
): GridSize => {
  if (!size) return { cols: 3, rows: 4 }; // Default to 3x4
  if (typeof size === "number") {
    // Legacy mapping: N -> N cols x (N+1) rows (Vertical)
    return { cols: size, rows: size + 1 };
  }
  return size;
};

// ==========================================
// RESPONSIVE BREAKPOINTS
// ==========================================

export const BREAKPOINTS = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
};

export const getDeviceType = (
  width: number
): "phone" | "tablet" | "desktop" => {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "phone";
};

export const getResponsiveValue = <T>(
  width: number,
  values: { phone: T; tablet: T; desktop?: T }
): T => {
  const type = getDeviceType(width);
  if (type === "desktop") return values.desktop ?? values.tablet;
  if (type === "tablet") return values.tablet;
  return values.phone;
};

// ==========================================
// MINIMALIST DARK THEME
// ==========================================

export const COLORS = {
  // Backgrounds
  background: "#121212", // Soft Black
  surface: "#1e1e1e", // Dark Grey
  surfaceLight: "#2a2a2a", // Lighter Grey
  surfaceHover: "#333333",

  // Brand
  primary: "#3d3d3d", // Neutral Primary
  primaryDark: "#2d2d2d",
  primaryLight: "#4d4d4d",

  // Accent (Cyan)
  accent: "#00f2ff", // Cyan Accent for interactive
  accentLight: "#33f5ff",

  // Secondary (Pink)
  secondary: "#ec4899",
  secondaryLight: "#f472b6",

  // Status
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",

  // Text
  textPrimary: "#ffffff",
  textSecondary: "#b3b3b3",
  textMuted: "#7a7a7a",
  textDark: "#334155",

  // Border
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.15)",

  // Stars
  starFilled: "#ffD700",
  starEmpty: "#3a3a3a",

  // Overlay
  overlay: "rgba(0, 0, 0, 0.75)",
  overlayLight: "rgba(0, 0, 0, 0.5)",

  // Gradients
  gradientPrimary: ["#3d3d3d", "#1e1e1e"],
  gradientAccent: ["#00f2ff", "#00b8c2"],
  gradientSurface: ["#1e1e1e", "#121212"],

  // Shadows
  shadowColor: "#000000",
};

// ==========================================
// UI CONSTANTS
// ==========================================

export const BOARD_PADDING = 12;
export const TILE_GAP = 2;
export const TILE_BORDER_RADIUS = 6;

export const getBoardSize = (screenWidth: number): number => {
  const maxBoardSize = screenWidth - BOARD_PADDING * 2;
  return maxBoardSize;
};

export const getGridColumns = (screenWidth: number): number => {
  return getResponsiveValue(screenWidth, { phone: 2, tablet: 3, desktop: 4 });
};

// ==========================================
// HINT SYSTEM
// ==========================================

export const HINT_CONFIG = {
  defaultHints: 10,
  chapterBonus: 5,
  rewardedAdHints: 3,
};

// ==========================================
// AD CONFIG (Test IDs)
// ==========================================

export const AD_CONFIG = {
  interstitial: {
    android: "ca-app-pub-3940256099942544/1033173712",
    ios: "ca-app-pub-3940256099942544/4411468910",
  },
  rewarded: {
    android: "ca-app-pub-3940256099942544/5224354917",
    ios: "ca-app-pub-3940256099942544/1712485313",
  },
  banner: {
    android: "ca-app-pub-3940256099942544/6300978111",
    ios: "ca-app-pub-3940256099942544/2934735716",
  },
};

// ==========================================
// STORAGE KEYS
// ==========================================

export const STORAGE_KEYS = {
  USER_PROGRESS: "@puzzle_game_progress",
  HINT_COUNT: "@puzzle_game_hints",
  LAST_PLAYED: "@puzzle_game_last_played",
  DEVICE_ID: "@puzzle_game_device_id",
  LEVEL_STATE: "@puzzle_game_level_state",
};

// CHAPTER DATA handles moved to DataStore/Service
// generateChapters ve CHAPTERS kaldırıldı.

// ==========================================
// STAR RATING SYSTEM (Difficulty Based)
// ==========================================

export const STAR_THRESHOLDS: Record<string, { gold: number; silver: number }> =
  {
    // Vertical grids (N x N+1)
    "2x3": { gold: 10, silver: 20 }, // 6 tiles
    "3x4": { gold: 25, silver: 45 }, // 12 tiles
    "4x5": { gold: 50, silver: 90 }, // 20 tiles
    "5x6": { gold: 80, silver: 140 }, // 30 tiles
  };

export const calculateStars = (moves: number, gridSize: GridSize): number => {
  const key = `${gridSize.cols}x${gridSize.rows}`;
  const threshold = STAR_THRESHOLDS[key] || {
    gold: gridSize.cols * gridSize.rows * 4,
    silver: gridSize.cols * gridSize.rows * 6,
  };

  if (moves <= threshold.gold) return 3;
  if (moves <= threshold.silver) return 2;
  return 1;
};
