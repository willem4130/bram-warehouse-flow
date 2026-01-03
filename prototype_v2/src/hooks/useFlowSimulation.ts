import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Actor,
  Area,
  Flow,
  ObjectToDestinationFlow,
  Point,
} from '../types';
import {
  generatePath,
  getPositionAlongPath,
  getPathDuration,
  autoAssignActorsToDestinations,
  sortAssignmentsByDistance,
  Assignment,
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
}

export interface FlowSimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  elapsedMs: number;
  animatedActors: AnimatedActor[];
  currentActorIndex: number;
  currentPath: Point[];
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
  });
  const [speed, setSpeed] = useState(1);

  // Refs for animation
  const animationFrameRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const actorStartTimeRef = useRef<number>(0);
  const currentPathRef = useRef<Point[]>([]);
  const pathDurationRef = useRef<number>(0);
  const currentActorIndexRef = useRef(0);
  const animatedActorsRef = useRef<AnimatedActor[]>([]);
  const lastRenderTimeRef = useRef<number>(0);
  const speedRef = useRef(1);

  // Keep speedRef in sync
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Get the first active object-to-destination flow
  const activeFlow = useMemo(() => {
    return flows.find(
      (f): f is ObjectToDestinationFlow => f.flowType === 'object-to-destination'
    );
  }, [flows]);

  // Calculate assignments when flow, actors, or areas change
  const assignments = useMemo((): Assignment[] => {
    if (!activeFlow) return [];

    // Get actors in this flow
    const flowActors = actors.filter((a) => activeFlow.actorIds.includes(a.id));
    if (flowActors.length === 0) return [];

    // Get destination area
    const destinationArea = areas.find((a) => a.id === activeFlow.destinationAreaId);
    if (!destinationArea || destinationArea.cells.length === 0) return [];

    // Calculate auto-assignments
    const actorPositions = flowActors.map((a) => ({
      id: a.id,
      position: a.startPosition,
    }));

    const assigned = autoAssignActorsToDestinations(
      actorPositions,
      destinationArea.cells
    );

    // Sort by distance (shortest first)
    return sortAssignmentsByDistance(assigned);
  }, [activeFlow, actors, areas]);

  // Initialize animated actors when assignments change
  useEffect(() => {
    if (assignments.length === 0) {
      animatedActorsRef.current = [];
      setState((prev) => ({
        ...prev,
        animatedActors: [],
        currentActorIndex: 0,
        currentPath: [],
      }));
      return;
    }

    const animated: AnimatedActor[] = assignments.map((assignment) => {
      const actor = actors.find((a) => a.id === assignment.actorId);
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
        path: generatePath(assignment.actorPosition, assignment.destinationCell),
      };
    });

    animatedActorsRef.current = animated;
    currentActorIndexRef.current = 0;
    currentPathRef.current = [];

    setState({
      isRunning: false,
      isPaused: false,
      isComplete: false,
      elapsedMs: 0,
      animatedActors: animated,
      currentActorIndex: 0,
      currentPath: [],
    });
  }, [assignments, actors]);

  const animate = useCallback((timestamp: number) => {
    if (!isRunningRef.current) return;

    const elapsedMs = timestamp - startTimeRef.current;
    const currentIndex = currentActorIndexRef.current;
    const animatedActors = animatedActorsRef.current;

    // Check if all actors have arrived
    if (currentIndex >= animatedActors.length) {
      isRunningRef.current = false;
      currentPathRef.current = [];
      setState({
        isRunning: false,
        isPaused: false,
        isComplete: true,
        elapsedMs,
        animatedActors: [...animatedActors],
        currentActorIndex: currentIndex,
        currentPath: [],
      });
      return;
    }

    const currentActor = animatedActors[currentIndex];

    // Start moving if not already
    if (!currentActor.isMoving) {
      currentPathRef.current = currentActor.path;
      pathDurationRef.current = getPathDuration(currentActor.path, speedRef.current);
      actorStartTimeRef.current = timestamp;

      animatedActors[currentIndex] = {
        ...currentActor,
        isMoving: true,
      };
    }

    // Calculate position along path
    const actorElapsed = timestamp - actorStartTimeRef.current;
    const progress = pathDurationRef.current > 0
      ? Math.min(actorElapsed / pathDurationRef.current, 1)
      : 1;
    const position = getPositionAlongPath(currentPathRef.current, progress);

    animatedActors[currentIndex] = {
      ...animatedActors[currentIndex],
      currentX: position.x,
      currentY: position.y,
    };

    // Check if arrived
    if (progress >= 1) {
      animatedActors[currentIndex] = {
        ...animatedActors[currentIndex],
        currentX: currentActor.targetX,
        currentY: currentActor.targetY,
        isMoving: false,
        hasArrived: true,
      };

      currentActorIndexRef.current = currentIndex + 1;
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
        currentActorIndex: currentActorIndexRef.current,
        currentPath: [...currentPathRef.current],
      });
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    if (assignments.length === 0) return;
    if (currentActorIndexRef.current >= animatedActorsRef.current.length) return;

    isRunningRef.current = true;
    startTimeRef.current = performance.now() - (state.elapsedMs || 0);

    setState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate, assignments.length, state.elapsedMs]);

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

    // Reinitialize from assignments
    const animated: AnimatedActor[] = assignments.map((assignment) => {
      const actor = actors.find((a) => a.id === assignment.actorId);
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
        path: generatePath(assignment.actorPosition, assignment.destinationCell),
      };
    });

    animatedActorsRef.current = animated;
    currentActorIndexRef.current = 0;
    currentPathRef.current = [];

    setState({
      isRunning: false,
      isPaused: false,
      isComplete: false,
      elapsedMs: 0,
      animatedActors: animated,
      currentActorIndex: 0,
      currentPath: [],
    });
  }, [assignments, actors]);

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
    hasActiveFlow: activeFlow !== undefined && assignments.length > 0,
    start,
    stop,
    reset,
    setSpeed,
  };
}
