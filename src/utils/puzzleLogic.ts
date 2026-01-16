import { GridSize, TilePosition } from "../types";

export const createSolvedGrid = (gridSize: GridSize): number[] => {
  const totalTiles = gridSize.cols * gridSize.rows;
  return Array.from({ length: totalTiles }, (_, i) => i);
};

export const indexToPosition = (
  index: number,
  gridSize: GridSize
): TilePosition => ({
  row: Math.floor(index / gridSize.cols),
  col: index % gridSize.cols,
});

export const positionToIndex = (
  position: TilePosition,
  gridSize: GridSize
): number => {
  return position.row * gridSize.cols + position.col;
};

export const getAdjacentIndices = (
  index: number,
  gridSize: GridSize
): number[] => {
  const { row, col } = indexToPosition(index, gridSize);
  const adjacent: number[] = [];

  if (row > 0) adjacent.push(positionToIndex({ row: row - 1, col }, gridSize));
  if (row < gridSize.rows - 1)
    adjacent.push(positionToIndex({ row: row + 1, col }, gridSize));
  if (col > 0) adjacent.push(positionToIndex({ row, col: col - 1 }, gridSize));
  if (col < gridSize.cols - 1)
    adjacent.push(positionToIndex({ row, col: col + 1 }, gridSize));

  return adjacent;
};

export const canMoveTile = (
  tileIndex: number,
  emptyIndex: number,
  gridSize: GridSize
): boolean => {
  return getAdjacentIndices(emptyIndex, gridSize).includes(tileIndex);
};

export const swapTiles = (
  grid: number[],
  index1: number,
  index2: number
): number[] => {
  const newGrid = [...grid];
  [newGrid[index1], newGrid[index2]] = [newGrid[index2], newGrid[index1]];
  return newGrid;
};

export const performMove = (
  grid: number[],
  tileIndex: number,
  emptyIndex: number,
  gridSize: GridSize
): { grid: number[]; emptyIndex: number; moved: boolean } => {
  if (!canMoveTile(tileIndex, emptyIndex, gridSize)) {
    return { grid, emptyIndex, moved: false };
  }
  const newGrid = swapTiles(grid, tileIndex, emptyIndex);
  return { grid: newGrid, emptyIndex: tileIndex, moved: true };
};

export const shuffleGrid = (
  gridSize: GridSize
): { grid: number[]; emptyIndex: number } => {
  let grid = createSolvedGrid(gridSize);
  const totalTiles = gridSize.cols * gridSize.rows;
  let emptyIndex = totalTiles - 1;
  const moves = totalTiles * 5; // Dynamic shuffle count
  let lastMove = -1;

  for (let i = 0; i < moves; i++) {
    const adjacent = getAdjacentIndices(emptyIndex, gridSize);
    const validMoves = adjacent.filter((idx) => idx !== lastMove);
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    const tileToMove = validMoves[randomIndex];
    lastMove = emptyIndex;
    grid = swapTiles(grid, tileToMove, emptyIndex);
    emptyIndex = tileToMove;
  }

  return { grid, emptyIndex };
};

export const isSolved = (grid: number[]): boolean => {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== i) return false;
  }
  return true;
};

export const getProgressPercentage = (grid: number[]): number => {
  let correct = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === i) correct++;
  }
  return Math.round((correct / grid.length) * 100);
};

export const calculateTilePosition = (
  index: number,
  gridSize: GridSize,
  tileSize: number,
  gap: number
): { x: number; y: number } => {
  const { row, col } = indexToPosition(index, gridSize);
  return {
    x: col * (tileSize + gap),
    y: row * (tileSize + gap),
  };
};

export const calculateImageOffset = (
  tileValue: number,
  gridSize: GridSize,
  tileSize: number
): { top: number; left: number } => {
  const { row, col } = indexToPosition(tileValue, gridSize);
  return {
    top: -(row * tileSize),
    left: -(col * tileSize),
  };
};
