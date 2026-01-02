import { GridCoordinate } from '../types';

// Grid configuration based on Excalidraw analysis
export const GRID_CONFIG = {
  // Origin in Excalidraw coordinates (top-left of cell A1)
  // These values may need calibration after visual testing
  originX: 400,
  originY: 300,

  // Cell dimensions (from Excalidraw file)
  cellSize: 40,

  // Grid dimensions
  columns: 20,  // 1-20
  rows: 26,     // A-Z
};

// Pallet appearance
export const PALLET_CONFIG = {
  color: '#8B4513',      // SaddleBrown - wood/cardboard color
  borderColor: '#5D3A1A', // Darker brown border
  size: 36,              // Slightly smaller than cell (40px) for visual margin
  offset: 2,             // Center offset: (40-36)/2 = 2
};

// Animation timing
export const ANIMATION_CONFIG = {
  msPerCell: 1000,    // 1 second per cell
  waitTimeMs: 2000,   // 2 second wait at destination
};

// Define the path waypoints: B8 → B9 → I9 → I3 → U3 → U1
export const PATH_WAYPOINTS: GridCoordinate[] = [
  { row: 'B', column: 8 },   // Start: B8
  { row: 'B', column: 9 },   // B9
  { row: 'I', column: 9 },   // I9
  { row: 'I', column: 3 },   // I3
  { row: 'U', column: 3 },   // U3
  { row: 'U', column: 1 },   // U1 (destination)
];
