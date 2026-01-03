import {
  GridData,
  GridCell,
  Area,
  AreaType,
  Actor,
  Point,
  AREA_TYPE_CONFIGS,
  ACTOR_TYPE_CONFIGS,
} from '../types';
import { generateAreaId } from './areaManager';

interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  isDeleted: boolean;
}

interface ExcalidrawFile {
  elements: ExcalidrawElement[];
}

// =============================================================================
// COLOR TO AREA TYPE MAPPING
// =============================================================================

// Map Excalidraw background colors to area types
const COLOR_TO_AREA_TYPE: Record<string, AreaType> = {
  '#e9ecef': 'dock',      // Grey - loading docks
  '#d2bab0': 'staging',   // Brown - staging area (pallets parsed separately)
  '#a5d8ff': 'storage',   // Blue - storage/racking
  '#b2f2bb': 'picking',   // Green - pick face
  '#ffec99': 'packing',   // Yellow - pack stations
  '#495057': 'obstacle',  // Dark grey - obstacles/walls
  '#868e96': 'obstacle',  // Medium grey - also obstacles
};

// Colors that represent actors (not areas)
const ACTOR_COLORS: Record<string, { type: 'pallet' | 'forklift' | 'picker' | 'cart' }> = {
  '#d2bab0': { type: 'pallet' },    // Brown squares are pallets
  '#ffc078': { type: 'forklift' },  // Orange - forklift
  '#74c0fc': { type: 'picker' },    // Blue circle - picker
  '#b197fc': { type: 'cart' },      // Purple - cart
};

const CELL_SIZE = 40;
const GRID_ORIGIN_X = 400;
const GRID_ORIGIN_Y = -60;

// =============================================================================
// PARSING UTILITIES
// =============================================================================

/**
 * Snap a position to the nearest grid cell
 */
function snapToGrid(x: number, y: number): { x: number; y: number } {
  const snappedX = Math.round((x - GRID_ORIGIN_X) / CELL_SIZE) * CELL_SIZE + GRID_ORIGIN_X;
  const snappedY = Math.round((y - GRID_ORIGIN_Y) / CELL_SIZE) * CELL_SIZE + GRID_ORIGIN_Y;
  return { x: snappedX, y: snappedY };
}

/**
 * Determine the area type from an Excalidraw element's background color
 */
function getAreaTypeFromColor(color: string): AreaType | null {
  return COLOR_TO_AREA_TYPE[color] ?? null;
}

/**
 * Check if an element is a small square (likely an actor like pallet)
 */
function isActorElement(element: ExcalidrawElement): boolean {
  // Actors are typically smaller squares (around 30x30) vs cells (40x40)
  const isSmallSquare = element.width <= 35 && element.height <= 35;
  return isSmallSquare && ACTOR_COLORS[element.backgroundColor] !== undefined;
}

// =============================================================================
// NEW ARCHITECTURE PARSER
// =============================================================================

export interface ParsedScenarioData {
  areas: Area[];
  actors: Actor[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

/**
 * Parse Excalidraw file into new Area/Actor architecture
 */
export function parseExcalidrawToScenario(data: ExcalidrawFile): ParsedScenarioData {
  const elements = data.elements.filter(
    (e) => e.isDeleted === false && e.type === 'rectangle'
  );

  // Group cells by area type
  const areaTypeMap = new Map<AreaType, Point[]>();
  const actors: Actor[] = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  elements.forEach((e) => {
    // Track bounds
    minX = Math.min(minX, e.x);
    maxX = Math.max(maxX, e.x + e.width);
    minY = Math.min(minY, e.y);
    maxY = Math.max(maxY, e.y + e.height);

    // Check if this is an actor (small square with actor color)
    if (isActorElement(e)) {
      const actorInfo = ACTOR_COLORS[e.backgroundColor];
      const pos = snapToGrid(e.x, e.y);
      const config = ACTOR_TYPE_CONFIGS.find((c) => c.type === actorInfo.type);

      actors.push({
        id: `actor_${e.id}`,
        type: actorInfo.type,
        label: config?.label,
        color: config?.defaultColor ?? e.backgroundColor,
        startPosition: { x: pos.x, y: pos.y },
      });
      return;
    }

    // Otherwise, treat as an area cell
    const areaType = getAreaTypeFromColor(e.backgroundColor);
    if (areaType) {
      const pos = { x: Math.round(e.x), y: Math.round(e.y) };

      if (!areaTypeMap.has(areaType)) {
        areaTypeMap.set(areaType, []);
      }
      areaTypeMap.get(areaType)!.push(pos);
    }
  });

  // Convert grouped cells to Area objects
  const areas: Area[] = [];
  areaTypeMap.forEach((cells, type) => {
    const config = AREA_TYPE_CONFIGS.find((c) => c.type === type);
    areas.push({
      id: generateAreaId(),
      type,
      label: config?.label ?? type,
      color: config?.defaultColor ?? '#dee2e6',
      cells,
    });
  });

  return {
    areas,
    actors,
    bounds: {
      minX: minX === Infinity ? 0 : Math.round(minX),
      maxX: maxX === -Infinity ? 0 : Math.round(maxX),
      minY: minY === Infinity ? 0 : Math.round(minY),
      maxY: maxY === -Infinity ? 0 : Math.round(maxY),
    },
  };
}

// =============================================================================
// LEGACY PARSER (for backward compatibility)
// =============================================================================

const DOCK_COLOR = '#e9ecef';
const PALLET_COLOR = '#d2bab0';

/**
 * Legacy parser - returns GridData for backward compatibility
 */
export function parseExcalidrawData(data: ExcalidrawFile): GridData {
  const elements = data.elements.filter(
    (e) => e.isDeleted === false && e.type === 'rectangle'
  );

  const docks: GridCell[] = [];
  const pallets: GridCell[] = [];
  const emptyCells: GridCell[] = [];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  elements.forEach((e) => {
    // Snap pallets to grid, keep docks and empty cells as-is
    const isPallet = e.backgroundColor === PALLET_COLOR && e.width <= 35;
    const pos = isPallet ? snapToGrid(e.x, e.y) : { x: Math.round(e.x), y: Math.round(e.y) };

    const cell: GridCell = {
      x: pos.x,
      y: pos.y,
      type: 'empty',
    };

    minX = Math.min(minX, e.x);
    maxX = Math.max(maxX, e.x + e.width);
    minY = Math.min(minY, e.y);
    maxY = Math.max(maxY, e.y + e.height);

    if (e.backgroundColor === DOCK_COLOR) {
      cell.type = 'dock';
      docks.push(cell);
    } else if (isPallet) {
      cell.type = 'pallet';
      pallets.push(cell);
    } else {
      emptyCells.push(cell);
    }
  });

  return {
    docks,
    pallets,
    emptyCells,
    bounds: {
      minX: Math.round(minX),
      maxX: Math.round(maxX),
      minY: Math.round(minY),
      maxY: Math.round(maxY),
    },
  };
}

export async function loadExcalidrawFile(path: string): Promise<GridData> {
  const response = await fetch(path);
  const data: ExcalidrawFile = await response.json();
  return parseExcalidrawData(data);
}

/**
 * Load Excalidraw file and parse into new architecture
 */
export async function loadExcalidrawToScenario(path: string): Promise<ParsedScenarioData> {
  const response = await fetch(path);
  const data: ExcalidrawFile = await response.json();
  return parseExcalidrawToScenario(data);
}
