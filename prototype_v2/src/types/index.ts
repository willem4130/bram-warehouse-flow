// =============================================================================
// LEGACY TYPES (for backward compatibility during migration)
// =============================================================================

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

export interface Point {
  x: number;
  y: number;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  elapsedMs: number;
  pallets: Pallet[];
  docks: Dock[];
  currentPalletIndex: number;
  currentPath: Point[];
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

// =============================================================================
// NEW ARCHITECTURE TYPES
// =============================================================================

// Area types available in the system
export type AreaType =
  | 'dock'      // Loading/unloading bays
  | 'staging'   // Temporary holding areas
  | 'storage'   // Racking/shelving
  | 'picking'   // Pick face locations
  | 'packing'   // Pack stations
  | 'obstacle'  // Walls, columns, non-traversable
  | 'empty'     // Traversable empty space
  | 'custom';   // User-defined

// Actor types available in the system
export type ActorType =
  | 'pallet'    // Palletized goods
  | 'forklift'  // Material handling equipment
  | 'picker'    // Human worker
  | 'cart'      // Pick cart
  | 'custom';   // User-defined

// A single cell in the grid
export interface Cell {
  x: number;
  y: number;
  areaId?: string;       // Which area this cell belongs to
  traversable: boolean;  // Can actors move through here?
}

// A named region on the grid
export interface Area {
  id: string;
  type: AreaType;
  label: string;
  color: string;         // Hex color for rendering
  cells: Point[];        // Which cells belong to this area
}

// An object that can move through the warehouse
export interface Actor {
  id: string;
  type: ActorType;
  label?: string;
  color: string;
  startPosition: Point;
  // speed: number;      // Future: per-actor speed multiplier
}

// Connection between an actor and its destination (for manual assignment)
export interface Connection {
  actorId: string;
  destinationCell: Point;
}

// Custom path override for an actor
export interface PathOverride {
  actorId: string;
  waypoints: Point[];    // Custom path instead of auto-calculated
}

// Object-to-destination flow (pallets to docks, etc.)
export interface ObjectToDestinationFlow {
  id: string;
  name: string;
  flowType: 'object-to-destination';
  actorIds: string[];           // Which actors participate
  destinationAreaId: string;    // Target area
  assignment: 'auto-nearest' | 'manual';
  connections?: Connection[];   // If manual: explicit pairings
  pathOverrides?: PathOverride[]; // User-drawn paths
}

// Route-tour flow (picker visiting multiple locations)
export interface RouteTourFlow {
  id: string;
  name: string;
  flowType: 'route-tour';
  actorId: string;              // Single actor for this route
  waypoints: Point[];           // Ordered stops
  returnToStart: boolean;       // Loop back to start?
}

// Union type for all flow types
export type Flow = ObjectToDestinationFlow | RouteTourFlow;

// View configuration for comparison mode
export interface View {
  id: string;
  name: string;                 // "Current State", "Proposed"
  flowIds: string[];            // Which flows to show
  canvas: 'primary' | 'secondary'; // For side-by-side
}

// Complete scenario definition
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;

  // The physical layout
  grid: {
    source: 'excalidraw' | 'native';
    excalidrawFile?: string;
    cells: Cell[];
    bounds: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    };
  };

  // Named regions on the grid
  areas: Area[];

  // Things that move
  actors: Actor[];

  // Movement definitions
  flows: Flow[];

  // View configurations (for comparison)
  views: View[];

  // Global settings
  settings: {
    speedMultiplier: number;
    showPaths: boolean;
    showLabels: boolean;
  };
}

// =============================================================================
// UNDO/REDO HISTORY TYPES
// =============================================================================

// Snapshot of scenario state for undo/redo
export interface HistoryState {
  areas: Area[];
  actors: Actor[];
  flows: Flow[];
  cells: Cell[];
}

// History entry with metadata
export interface HistoryEntry {
  state: HistoryState;
  description: string;  // What action was performed
  timestamp: number;
}

// =============================================================================
// EDIT MODE TYPES
// =============================================================================

export type EditTarget = 'areas' | 'actors' | 'paths' | 'none';

export interface EditModeState {
  isEditMode: boolean;
  target: EditTarget;
  selectedAreaType: AreaType;
  selectedActorType: ActorType;
  selectedActorId?: string;  // For path editing
}

// =============================================================================
// AREA TYPE CONFIGURATION
// =============================================================================

export interface AreaTypeConfig {
  type: AreaType;
  label: string;
  defaultColor: string;
  traversable: boolean;
}

export const AREA_TYPE_CONFIGS: AreaTypeConfig[] = [
  { type: 'dock', label: 'Dock', defaultColor: '#e9ecef', traversable: true },
  { type: 'staging', label: 'Staging', defaultColor: '#d2bab0', traversable: true },
  { type: 'storage', label: 'Storage', defaultColor: '#a5d8ff', traversable: true },
  { type: 'picking', label: 'Picking', defaultColor: '#b2f2bb', traversable: true },
  { type: 'packing', label: 'Packing', defaultColor: '#ffec99', traversable: true },
  { type: 'obstacle', label: 'Obstacle', defaultColor: '#495057', traversable: false },
  { type: 'empty', label: 'Empty', defaultColor: '#ffffff', traversable: true },
  { type: 'custom', label: 'Custom', defaultColor: '#dee2e6', traversable: true },
];

// =============================================================================
// ACTOR TYPE CONFIGURATION
// =============================================================================

export interface ActorTypeConfig {
  type: ActorType;
  label: string;
  defaultColor: string;
  shape: 'square' | 'circle' | 'rounded';
}

export const ACTOR_TYPE_CONFIGS: ActorTypeConfig[] = [
  { type: 'pallet', label: 'Pallet', defaultColor: '#d2bab0', shape: 'square' },
  { type: 'forklift', label: 'Forklift', defaultColor: '#ffc078', shape: 'square' },
  { type: 'picker', label: 'Picker', defaultColor: '#74c0fc', shape: 'circle' },
  { type: 'cart', label: 'Cart', defaultColor: '#b197fc', shape: 'rounded' },
  { type: 'custom', label: 'Custom', defaultColor: '#868e96', shape: 'square' },
];
