// Grid coordinate (e.g., "B8", "U1")
export interface GridCoordinate {
  row: string;    // A-Z
  column: number; // 1-20
}

// Pixel position on canvas
export interface PixelPosition {
  x: number;
  y: number;
}

// Path segment between two waypoints
export interface PathSegment {
  from: GridCoordinate;
  to: GridCoordinate;
  fromPixel: PixelPosition;
  toPixel: PixelPosition;
  cellCount: number;
  durationMs: number;
}

// Result of position calculation
export interface PositionResult {
  position: PixelPosition;
  isPathComplete: boolean;
  currentSegmentIndex: number;
}
