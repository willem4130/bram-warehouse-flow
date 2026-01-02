export interface GridCell {
  x: number;
  y: number;
  type: 'empty' | 'dock' | 'pallet';
}

export interface Pallet {
  id: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetDock: GridCell | null;
  isMoving: boolean;
  hasArrived: boolean;
}

export interface Dock {
  x: number;
  y: number;
  isFilled: boolean;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  elapsedMs: number;
  pallets: Pallet[];
  docks: Dock[];
  currentPalletIndex: number;
}

export interface GridData {
  docks: GridCell[];
  pallets: GridCell[];
  emptyCells: GridCell[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}
