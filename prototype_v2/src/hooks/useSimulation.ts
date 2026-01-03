import { useState, useRef, useCallback, useEffect } from 'react';
import { GridData, Pallet, Dock, SimulationState } from '../types';
import {
  generatePath,
  getPositionAlongPath,
  getPathDuration,
  shuffleArray,
  Point,
} from '../utils/pathfinding';
const NUM_PALLETS_TO_MOVE = 15;

interface UseSimulationResult {
  state: SimulationState;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSimulation(gridData: GridData | null): UseSimulationResult {
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    isPaused: false,
    isComplete: false,
    elapsedMs: 0,
    pallets: [],
    docks: [],
    currentPalletIndex: 0,
  });

  // Use refs for animation state to avoid re-renders during animation
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const palletStartTimeRef = useRef<number>(0);
  const currentPathRef = useRef<Point[]>([]);
  const pathDurationRef = useRef<number>(0);
  const currentPalletIndexRef = useRef(0);
  const palletsRef = useRef<Pallet[]>([]);
  const docksRef = useRef<Dock[]>([]);
  const lastRenderTimeRef = useRef<number>(0);
  const RENDER_INTERVAL = 33; // ~30fps for React state updates

  // Initialize pallets and docks from grid data
  useEffect(() => {
    if (!gridData) return;

    // Shuffle and select 15 pallets
    const shuffledPallets = shuffleArray(gridData.pallets).slice(0, NUM_PALLETS_TO_MOVE);

    const pallets: Pallet[] = shuffledPallets.map((cell, index) => ({
      id: `pallet-${index}`,
      x: cell.x,
      y: cell.y,
      startX: cell.x,
      startY: cell.y,
      targetDock: null,
      isMoving: false,
      hasArrived: false,
    }));

    // Sort docks: highest Y first (back/farthest from pallets), then random within same Y
    const sortedDocks = [...gridData.docks].sort((a, b) => {
      // First sort by Y descending (farthest from pallets first)
      if (b.y !== a.y) return b.y - a.y;
      // Random order within same Y row
      return Math.random() - 0.5;
    });
    const docks: Dock[] = sortedDocks.map((cell) => ({
      x: cell.x,
      y: cell.y,
      isFilled: false,
    }));

    palletsRef.current = pallets;
    docksRef.current = docks;
    currentPalletIndexRef.current = 0;

    setState({
      isRunning: false,
      isPaused: false,
      isComplete: false,
      elapsedMs: 0,
      pallets,
      docks,
      currentPalletIndex: 0,
    });
  }, [gridData]);

  const animate = useCallback((timestamp: number) => {
    if (!isRunningRef.current) {
      console.log('Animation stopped - isRunningRef is false');
      return;
    }

    const elapsedMs = timestamp - startTimeRef.current;
    const currentIndex = currentPalletIndexRef.current;
    const pallets = palletsRef.current;
    const docks = docksRef.current;

    // Debug log every 500ms
    if (Math.floor(elapsedMs / 500) !== Math.floor((elapsedMs - 16) / 500)) {
      console.log('Animating:', { elapsedMs, currentIndex, palletsLength: pallets.length });
    }

    // Check if all pallets have arrived
    if (currentIndex >= pallets.length) {
      isRunningRef.current = false;
      setState({
        isRunning: false,
        isPaused: false,
        isComplete: true,
        elapsedMs,
        pallets: [...pallets],
        docks: [...docks],
        currentPalletIndex: currentIndex,
      });
      return;
    }

    const currentPallet = pallets[currentIndex];
    const targetDock = docks[currentIndex];

    // If pallet hasn't started moving, start it
    if (!currentPallet.isMoving) {
      const path = generatePath(
        { x: currentPallet.x, y: currentPallet.y },
        { x: targetDock.x, y: targetDock.y }
      );
      currentPathRef.current = path;
      pathDurationRef.current = getPathDuration(path);
      palletStartTimeRef.current = timestamp;

      pallets[currentIndex] = {
        ...currentPallet,
        isMoving: true,
        targetDock: { x: targetDock.x, y: targetDock.y, type: 'dock' },
      };
    }

    // Calculate pallet position along path
    const palletElapsed = timestamp - palletStartTimeRef.current;
    const progress = pathDurationRef.current > 0
      ? Math.min(palletElapsed / pathDurationRef.current, 1)
      : 1;
    const position = getPositionAlongPath(currentPathRef.current, progress);

    pallets[currentIndex] = {
      ...pallets[currentIndex],
      x: position.x,
      y: position.y,
    };

    // If pallet has arrived, mark it and move to next
    if (progress >= 1) {
      pallets[currentIndex] = {
        ...pallets[currentIndex],
        x: targetDock.x,
        y: targetDock.y,
        isMoving: false,
        hasArrived: true,
      };

      docks[currentIndex] = {
        ...targetDock,
        isFilled: true,
      };

      currentPalletIndexRef.current = currentIndex + 1;
    }

    // Throttle React state updates to ~30fps
    if (timestamp - lastRenderTimeRef.current >= RENDER_INTERVAL) {
      lastRenderTimeRef.current = timestamp;
      setState({
        isRunning: true,
        isPaused: false,
        isComplete: false,
        elapsedMs,
        pallets: [...pallets],
        docks: [...docks],
        currentPalletIndex: currentPalletIndexRef.current,
      });
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const start = useCallback(() => {
    console.log('Start clicked');
    console.log('isRunningRef:', isRunningRef.current);
    console.log('palletsRef.current.length:', palletsRef.current.length);
    console.log('currentPalletIndexRef:', currentPalletIndexRef.current);

    if (isRunningRef.current) {
      console.log('Already running, returning');
      return;
    }
    if (currentPalletIndexRef.current >= palletsRef.current.length) {
      console.log('No pallets to move, returning');
      return;
    }

    isRunningRef.current = true;
    startTimeRef.current = performance.now() - (state.elapsedMs || 0);

    setState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));

    console.log('Starting animation');
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate, state.elapsedMs]);

  const stop = useCallback(() => {
    isRunningRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));
  }, []);

  const reset = useCallback(() => {
    isRunningRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (!gridData) return;

    // Reshuffle and reinitialize
    const shuffledPallets = shuffleArray(gridData.pallets).slice(0, NUM_PALLETS_TO_MOVE);

    const pallets: Pallet[] = shuffledPallets.map((cell, index) => ({
      id: `pallet-${index}`,
      x: cell.x,
      y: cell.y,
      startX: cell.x,
      startY: cell.y,
      targetDock: null,
      isMoving: false,
      hasArrived: false,
    }));

    // Sort docks: highest Y first (back/farthest from pallets), then random within same Y
    const sortedDocks = [...gridData.docks].sort((a, b) => {
      if (b.y !== a.y) return b.y - a.y;
      return Math.random() - 0.5;
    });
    const docks: Dock[] = sortedDocks.map((cell) => ({
      x: cell.x,
      y: cell.y,
      isFilled: false,
    }));

    palletsRef.current = pallets;
    docksRef.current = docks;
    currentPalletIndexRef.current = 0;

    setState({
      isRunning: false,
      isPaused: false,
      isComplete: false,
      elapsedMs: 0,
      pallets,
      docks,
      currentPalletIndex: 0,
    });
  }, [gridData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return { state, start, stop, reset };
}
