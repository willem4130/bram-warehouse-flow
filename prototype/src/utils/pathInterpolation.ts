import { PixelPosition, GridCoordinate, PathSegment, PositionResult } from '../types';
import { gridToPixel, getCellDistance } from './gridCoordinates';
import { ANIMATION_CONFIG } from '../constants/config';

/**
 * Linear interpolation between two values.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Interpolate position between two pixel positions.
 */
export function lerpPosition(
  from: PixelPosition,
  to: PixelPosition,
  t: number
): PixelPosition {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
  };
}

/**
 * Calculate path segments from waypoints.
 * Each segment is one waypoint to the next with timing info.
 */
export function calculatePathSegments(
  waypoints: GridCoordinate[]
): PathSegment[] {
  const segments: PathSegment[] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = waypoints[i];
    const to = waypoints[i + 1];
    const cellCount = getCellDistance(from, to);

    segments.push({
      from,
      to,
      fromPixel: gridToPixel(from),
      toPixel: gridToPixel(to),
      cellCount,
      durationMs: cellCount * ANIMATION_CONFIG.msPerCell,
    });
  }

  return segments;
}

/**
 * Get the current pallet position based on elapsed time.
 * Returns the pixel position and whether the path is complete.
 */
export function getPositionAtTime(
  segments: PathSegment[],
  elapsedMs: number
): PositionResult {
  let accumulatedTime = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (elapsedMs < accumulatedTime + segment.durationMs) {
      // We're in this segment
      const segmentElapsed = elapsedMs - accumulatedTime;
      const t = segment.durationMs > 0 ? segmentElapsed / segment.durationMs : 1;

      return {
        position: lerpPosition(segment.fromPixel, segment.toPixel, t),
        isPathComplete: false,
        currentSegmentIndex: i,
      };
    }

    accumulatedTime += segment.durationMs;
  }

  // Path is complete - return final position
  const lastSegment = segments[segments.length - 1];
  return {
    position: lastSegment.toPixel,
    isPathComplete: true,
    currentSegmentIndex: segments.length - 1,
  };
}

/**
 * Calculate total duration of the path in milliseconds.
 */
export function getTotalPathDuration(segments: PathSegment[]): number {
  return segments.reduce((sum, seg) => sum + seg.durationMs, 0);
}
