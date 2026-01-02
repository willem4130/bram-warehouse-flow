export interface Point {
  x: number;
  y: number;
}

const SPEED = 200; // pixels per second

/**
 * Calculate Manhattan distance between two points
 */
export function manhattanDistance(from: Point, to: Point): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}

/**
 * Generate a path from start to end using Manhattan movement (no diagonals)
 * Returns array of points: start -> horizontal waypoint -> end
 */
export function generatePath(start: Point, end: Point): Point[] {
  // If same position, just return start
  if (start.x === end.x && start.y === end.y) {
    return [{ ...start }];
  }

  // Manhattan path: first horizontal, then vertical
  // Create waypoint at (end.x, start.y)
  const waypoint = { x: end.x, y: start.y };

  // If already aligned horizontally, just go vertical
  if (start.x === end.x) {
    return [{ ...start }, { ...end }];
  }

  // If already aligned vertically, just go horizontal
  if (start.y === end.y) {
    return [{ ...start }, { ...end }];
  }

  // Full L-shaped path
  return [{ ...start }, waypoint, { ...end }];
}

/**
 * Linear interpolation between two values
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Get position along path at given progress (0 to 1)
 */
export function getPositionAlongPath(path: Point[], progress: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return { ...path[0] };
  if (progress <= 0) return { ...path[0] };
  if (progress >= 1) return { ...path[path.length - 1] };

  // Calculate total path length
  let totalLength = 0;
  const segmentLengths: number[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const length = Math.abs(path[i + 1].x - path[i].x) + Math.abs(path[i + 1].y - path[i].y);
    segmentLengths.push(length);
    totalLength += length;
  }

  if (totalLength === 0) return { ...path[0] };

  // Find which segment we're on based on progress
  const targetDistance = progress * totalLength;
  let accumulatedDistance = 0;

  for (let i = 0; i < segmentLengths.length; i++) {
    const segmentLength = segmentLengths[i];
    if (accumulatedDistance + segmentLength >= targetDistance) {
      // We're in this segment
      const segmentProgress = segmentLength > 0
        ? (targetDistance - accumulatedDistance) / segmentLength
        : 0;
      return {
        x: lerp(path[i].x, path[i + 1].x, segmentProgress),
        y: lerp(path[i].y, path[i + 1].y, segmentProgress),
      };
    }
    accumulatedDistance += segmentLength;
  }

  return { ...path[path.length - 1] };
}

/**
 * Calculate total path length in pixels
 */
export function getPathLength(path: Point[]): number {
  if (path.length <= 1) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += Math.abs(path[i + 1].x - path[i].x) + Math.abs(path[i + 1].y - path[i].y);
  }
  return total;
}

/**
 * Calculate duration for path based on speed
 */
export function getPathDuration(path: Point[]): number {
  const length = getPathLength(path);
  return (length / SPEED) * 1000; // milliseconds
}

/**
 * Shuffle array in place (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
