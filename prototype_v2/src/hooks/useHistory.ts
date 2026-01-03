import { useState, useCallback, useRef } from 'react';
import { HistoryState, HistoryEntry, Area, Actor, Flow, Cell } from '../types';

const MAX_HISTORY_SIZE = 50;

interface UseHistoryReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;
  historyLength: number;

  // Actions
  pushState: (state: HistoryState, description: string) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  reset: (initialState: HistoryState) => void;
  getCurrentState: () => HistoryState | null;
}

export function useHistory(initialState?: HistoryState): UseHistoryReturn {
  const [historyStack, setHistoryStack] = useState<HistoryEntry[]>(() => {
    if (initialState) {
      return [
        {
          state: initialState,
          description: 'Initial state',
          timestamp: Date.now(),
        },
      ];
    }
    return [];
  });

  const [currentIndex, setCurrentIndex] = useState(initialState ? 0 : -1);

  // Use ref to avoid stale closures in callbacks
  const stackRef = useRef(historyStack);
  const indexRef = useRef(currentIndex);
  stackRef.current = historyStack;
  indexRef.current = currentIndex;

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < historyStack.length - 1;

  const pushState = useCallback((state: HistoryState, description: string) => {
    setHistoryStack((prev) => {
      // Remove any future states if we're not at the end
      const newStack = prev.slice(0, indexRef.current + 1);

      // Add new entry
      const entry: HistoryEntry = {
        state: deepClone(state),
        description,
        timestamp: Date.now(),
      };

      newStack.push(entry);

      // Trim if too large
      if (newStack.length > MAX_HISTORY_SIZE) {
        return newStack.slice(-MAX_HISTORY_SIZE);
      }

      return newStack;
    });

    setCurrentIndex((prev) => {
      const newStack = stackRef.current.slice(0, prev + 1);
      const newIndex = Math.min(newStack.length, MAX_HISTORY_SIZE - 1);
      return newIndex;
    });
  }, []);

  const undo = useCallback((): HistoryState | null => {
    if (!canUndo) return null;

    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return deepClone(historyStack[newIndex].state);
  }, [canUndo, currentIndex, historyStack]);

  const redo = useCallback((): HistoryState | null => {
    if (!canRedo) return null;

    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    return deepClone(historyStack[newIndex].state);
  }, [canRedo, currentIndex, historyStack]);

  const reset = useCallback((initialState: HistoryState) => {
    setHistoryStack([
      {
        state: deepClone(initialState),
        description: 'Initial state',
        timestamp: Date.now(),
      },
    ]);
    setCurrentIndex(0);
  }, []);

  const getCurrentState = useCallback((): HistoryState | null => {
    if (currentIndex < 0 || currentIndex >= historyStack.length) {
      return null;
    }
    return deepClone(historyStack[currentIndex].state);
  }, [currentIndex, historyStack]);

  return {
    canUndo,
    canRedo,
    historyIndex: currentIndex,
    historyLength: historyStack.length,
    pushState,
    undo,
    redo,
    reset,
    getCurrentState,
  };
}

// Deep clone utility for history snapshots
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Helper to create a history state snapshot
export function createHistoryState(
  areas: Area[],
  actors: Actor[],
  flows: Flow[],
  cells: Cell[]
): HistoryState {
  return {
    areas: deepClone(areas),
    actors: deepClone(actors),
    flows: deepClone(flows),
    cells: deepClone(cells),
  };
}
