import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Actor,
  Area,
  Flow,
  ObjectToDestinationFlow,
  Point,
} from '../types';
import {
  getPositionAlongPath,
  getPathDuration,
  autoAssignActorsToDestinations,
  sortAssignmentsByDistance,
  generatePathForActor,
  Assignment,
  PathOverride,
} from '../utils/pathfinding';

// Animated actor state during simulation
export interface AnimatedActor {
  id: string;
  type: Actor['type'];
  color: string;
  currentX: number;
  currentY: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  hasArrived: boolean;
  path: Point[];
  // Per-actor timing for parallel animation
  pathDuration: number;
  startTime: number;
}

export interface FlowSimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  elapsedMs: number;
  animatedActors: AnimatedActor[];
  // Keep for backwards compatibility but now represents count of actors moving
  currentActorIndex: number;
  // All active paths for visualization (parallel mode shows all moving actors' paths)
  currentPath: Point[];
  activePaths: Point[][];
}

interface UseFlowSimulationResult {
  state: FlowSimulationState;
  speed: number;
  hasActiveFlow: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
}

const RENDER_INTERVAL = 33; // ~30fps

export function useFlowSimulation(
  actors: Actor[],
  areas: Area[],
  flows: Flow[]
): UseFlowSimulationResult {
  const [state, setState] = useState<FlowSimulationState>({
    isRunning: false,
    isPaused: false,
    isComplete: false,
    elapsedMs: 0,
    animatedActors: [],
    currentActorIndex: 0,
    currentPath: [],
    activePaths: [],
  });
  const [speed, setSpeed] = useState(1);

  // Refs for animation
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const animatedActorsRef = useRef<AnimatedActor[]>([]);
  const lastRenderTimeRef = useRef<number>(0);
  const speedRef = useRef(1);
  const pausedElapsedRef = useRef<number>(0);

  // Keep speedRef in sync
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Get ALL active object-to-destination flows
  const activeFlows = useMemo(() => {
    return flows.filter(
      (f): f is ObjectToDestinationFlow => f.flowType === 'object-to-destination'
    );
  }, [flows]);

  // Collect all path overrides from all flows
  const allPathOverrides = useMemo((): PathOverride[] => {
    const overrides: PathOverride[] = [];
    for (const flow of activeFlows) {
      if (flow.pathOverrides) {
        overrides.push(...flow.pathOverrides);
      }
    }
    return overrides;
  }, [activeFlows]);

  // Calculate assignments for ALL flows
  const assignments = useMemo((): Assignment[] => {
    if (activeFlows.length === 0) return [];

    const allAssignments: Assignment[] = [];
    const usedActorIds = new Set<string>();
    const usedDestinations = new Set<string>();

    // Process each flow
    for (const flow of activeFlows) {
      // Get actors in this flow (skip if already assigned in another flow)
      const flowActors = actors.filter(
        (a) => flow.actorIds.includes(a.id) && !usedActorIds.has(a.id)
      );
      if (flowActors.length === 0) continue;

      // Get destination area
      const destinationArea = areas.find((a) => a.id === flow.destinationAreaId);
      if (!destinationArea || destinationArea.cells.length === 0) continue;

      // Filter out already-used destination cells
      const availableCells = destinationArea.cells.filter(
        (cell) => !usedDestinations.has(`${cell.x},${cell.y}`)
      );
      if (availableCells.length === 0) continue;

      // Calculate auto-assignments for this flow
      const actorPositions = flowActors.map((a) => ({
        id: a.id,
        position: a.startPosition,
      }));

      const flowAssignments = autoAssignActorsToDestinations(
        actorPositions,
        availableCells
      );

      // Track used actors and destinations
      for (const assignment of flowAssignments) {
        usedActorIds.add(assignment.actorId);
        usedDestinations.add(`${assignment.destinationCell.x},${assignment.destinationCell.y}`);
        allAssignments.push(assignment);
      }
    }

    // Sort all assignments by distance (shortest first)
    return sortAssignmentsByDistance(allAssignments);
  }, [activeFlows, actors, areas]);

  // Initialize animated actors when assignments change
  useEffect(() => {
    if (assignments.length === 0) {
      animatedActorsRef.current = [];
      setState((prev) => ({
        ...prev,
        animatedActors: [],
        currentActorIndex: 0,
        currentPath: [],
        activePaths: [],
      }));
      return;
    }

    const animated: AnimatedActor[] = assignments.map((assignment) => {
      const actor = actors.find((a) => a.id === assignment.actorId);
      const path = generatePathForActor(
        assignment.actorId,
        assignment.actorPosition,
        assignment.destinationCell,
        allPathOverrides
      );
      return {
        id: assignment.actorId,
        type: actor?.type ?? 'pallet',
        color: actor?.color ?? '#d2bab0',
        currentX: assignment.actorPosition.x,
        currentY: assignment.actorPosition.y,
        startX: assignment.actorPosition.x,
        startY: assignment.actorPosition.y,
        targetX: assignment.destinationCell.x,
        targetY: assignment.destinationCell.y,
        isMoving: false,
        hasArrived: false,
        path,
        pathDuration: getPathDuration(path, speedRef.current),
        startTime: 0,
      };
    });

    animatedActorsRef.current = animated;
    pausedElapsedRef.current = 0;

    setState({
      isRunning: false,
      isPaused: false,
      isComplete: false,
      elapsedMs: 0,
      animatedActors: animated,
      currentActorIndex: 0,
      currentPath: [],
      activePaths: [],
    });
  }, [assignments, actors, allPathOverrides]);

  const animate = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;

    const elapsedMs = timestamp - startTimeRef.current;
    const animatedActors = animatedActorsRef.current;
    const activePaths: Point[][] = [];
    let allArrived = true;
    let movingCount = 0;

    // Update ALL actors in parallel
    for (let i = 0; i < animatedActors.length; i++) {
      const actor = animatedActors[i];

      // Skip already arrived actors
      if (actor.hasArrived) continue;

      allArrived = false;

      // Initialize start time if not moving yet
      if (!actor.isMoving) {
        animatedActors[i] = {
          ...actor,
          isMoving: true,
          startTime: timestamp,
          pathDuration: getPathDuration(actor.path, speedRef.current),
        };
      }

      const currentActor = animatedActors[i];
      const actorElapsed = timestamp - currentActor.startTime;
      const progress = currentActor.pathDuration > 0
        ? Math.min(actorElapsed / currentActor.pathDuration, 1)
        : 1;

      const position = getPositionAlongPath(currentActor.path, progress);

      // Check if arrived
      if (progress >= 1) {
        animatedActors[i] = {
          ...currentActor,
          currentX: currentActor.targetX,
          currentY: currentActor.targetY,
          isMoving: false,
          hasArrived: true,
        };
      } else {
        animatedActors[i] = {
          ...currentActor,
          currentX: position.x,
          currentY: position.y,
        };
        // Collect active paths for visualization
        activePaths.push(currentActor.path);
        movingCount++;
      }
    }

    // Check if all actors have arrived
    if (allArrived) {
      isRunningRef.current = false;
      setState({
        isRunning: false,
        isPaused: false,
        isComplete: true,
        elapsedMs,
        animatedActors: [...animatedActors],
        currentActorIndex: animatedActors.length,
        currentPath: [],
        activePaths: [],
      });
      return;
    }

    // Throttle React state updates
    if (timestamp - lastRenderTimeRef.current >= RENDER_INTERVAL) {
      lastRenderTimeRef.current = timestamp;
      setState({
        isRunning: true,
        isPaused: false,
        isComplete: false,
        elapsedMs,
        animatedActors: [...animatedActors],
        currentActorIndex: movingCount,
        currentPath: activePaths[0] ?? [],
        activePaths,
      });
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    if (assignments.length === 0) return;

    // Check if already complete (all actors arrived)
    const allArrived = animatedActorsRef.current.every((a) => a.hasArrived);
    if (allArrived && animatedActorsRef.current.length > 0) return;

    isRunningRef.current = true;
    startTimeRef.current = performance.now() - pausedElapsedRef.current;

    setState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate, assignments.length]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    pausedElapsedRef.current = performance.now() - startTimeRef.current;

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
    pausedElapsedRef.current = 0;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Reinitialize from assignments
    const animated: AnimatedActor[] = assignments.map((assignment) => {
      const actor = actors.find((a) => a.id === assignment.actorId);
      const path = generatePathForActor(
        assignment.actorId,
        assignment.actorPosition,
        assignment.destinationCell,
        allPathOverrides
      );
      return {
        id: assignment.actorId,
        type: actor?.type ?? 'pallet',
        color: actor?.color ?? '#d2bab0',
        currentX: assignment.actorPosition.x,
        currentY: assignment.actorPosition.y,
        startX: assignment.actorPosition.x,
        startY: assignment.actorPosition.y,
        targetX: assignment.destinationCell.x,
        targetY: assignment.destinationCell.y,
        isMoving: false,
        hasArrived: false,
        path,
        pathDuration: getPathDuration(path, speedRef.current),
        startTime: 0,
      };
    });

    animatedActorsRef.current = animated;

    setState({
      isRunning: false,
      isPaused: false,
      isComplete: false,
      elapsedMs: 0,
      animatedActors: animated,
      currentActorIndex: 0,
      currentPath: [],
      activePaths: [],
    });
  }, [assignments, actors, allPathOverrides]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    state,
    speed,
    hasActiveFlow: activeFlows.length > 0 && assignments.length > 0,
    start,
    stop,
    reset,
    setSpeed,
  };
}
