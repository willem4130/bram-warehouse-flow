import { useRef, useState, useCallback, useEffect } from 'react';
import { PixelPosition } from '../types';
import {
  calculatePathSegments,
  getPositionAtTime,
  PathSegment
} from '../utils/pathInterpolation';
import { gridToPixel } from '../utils/gridCoordinates';
import { ANIMATION_CONFIG, PATH_WAYPOINTS } from '../constants/config';

interface UseAnimationReturn {
  position: PixelPosition;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
}

export function useAnimation(): UseAnimationReturn {
  // Pre-calculate path segments
  const segmentsRef = useRef<PathSegment[]>(
    calculatePathSegments(PATH_WAYPOINTS)
  );

  // Animation state
  const [isRunning, setIsRunning] = useState(false);
  const [position, setPosition] = useState<PixelPosition>(
    gridToPixel(PATH_WAYPOINTS[0])
  );

  // Animation timing refs (don't trigger re-renders)
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const isWaitingRef = useRef(false);
  const waitStartRef = useRef<number>(0);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    // Handle waiting state at destination
    if (isWaitingRef.current) {
      const waitElapsed = timestamp - waitStartRef.current;

      if (waitElapsed >= ANIMATION_CONFIG.waitTimeMs) {
        // Wait complete - restart animation
        isWaitingRef.current = false;
        startTimeRef.current = timestamp;
        setPosition(gridToPixel(PATH_WAYPOINTS[0]));
      }
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const elapsed = timestamp - startTimeRef.current;
    const result = getPositionAtTime(segmentsRef.current, elapsed);

    setPosition(result.position);

    if (result.isPathComplete) {
      // Start waiting period
      isWaitingRef.current = true;
      waitStartRef.current = timestamp;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = 0;
    isWaitingRef.current = false;
    setPosition(gridToPixel(PATH_WAYPOINTS[0]));
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Reset to start position
    setPosition(gridToPixel(PATH_WAYPOINTS[0]));
    startTimeRef.current = 0;
    isWaitingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return { position, isRunning, start, stop };
}
