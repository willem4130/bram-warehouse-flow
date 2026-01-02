import { GridCoordinate, PixelPosition } from '../types';
import { GRID_CONFIG } from '../constants/config';

/**
 * Convert a grid coordinate (e.g., "B8") to pixel position.
 *
 * Grid coordinate system:
 * - Row A is at the BOTTOM (highest Y pixel value in Excalidraw)
 * - Row Z is at the TOP (lowest Y pixel value in Excalidraw)
 * - Column 1 is at LEFT, Column 20 at RIGHT
 *
 * Note: Excalidraw Y-axis increases downward in screen coordinates,
 * but the warehouse grid has A at bottom, so we need to invert.
 */
export function gridToPixel(coord: GridCoordinate): PixelPosition {
  const { originX, originY, cellSize, rows } = GRID_CONFIG;

  // Column: 1-based, so column 1 starts at originX
  const x = originX + (coord.column - 1) * cellSize;

  // Row: A=0, B=1, ..., Z=25
  // Row A should be at bottom (high Y), Row Z at top (low Y)
  // In Excalidraw, Y increases downward, so:
  // - Row A (index 0) is at originY + (rows-1) * cellSize (bottom)
  // - Row Z (index 25) is at originY (top)
  const rowIndex = coord.row.charCodeAt(0) - 'A'.charCodeAt(0);
  const y = originY + (rows - 1 - rowIndex) * cellSize;

  return { x, y };
}

/**
 * Parse a string coordinate like "B8" into a GridCoordinate object.
 */
export function parseCoordinate(coord: string): GridCoordinate {
  const row = coord.charAt(0).toUpperCase();
  const column = parseInt(coord.substring(1), 10);
  return { row, column };
}

/**
 * Calculate the number of cells between two grid coordinates.
 * Uses Manhattan distance (no diagonals).
 */
export function getCellDistance(from: GridCoordinate, to: GridCoordinate): number {
  const rowDiff = Math.abs(
    to.row.charCodeAt(0) - from.row.charCodeAt(0)
  );
  const colDiff = Math.abs(to.column - from.column);
  return rowDiff + colDiff;
}

/**
 * Format a grid coordinate as a string (e.g., "B8")
 */
export function formatCoordinate(coord: GridCoordinate): string {
  return `${coord.row}${coord.column}`;
}
