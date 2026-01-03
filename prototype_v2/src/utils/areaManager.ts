import {
  Area,
  AreaType,
  Point,
  Cell,
  AREA_TYPE_CONFIGS,
} from '../types';

// Generate a unique ID for a new area
export function generateAreaId(): string {
  return `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get the default configuration for an area type
export function getAreaTypeConfig(type: AreaType) {
  return AREA_TYPE_CONFIGS.find((config) => config.type === type);
}

// Get the default color for an area type
export function getDefaultColor(type: AreaType): string {
  const config = getAreaTypeConfig(type);
  return config?.defaultColor ?? '#dee2e6';
}

// Check if an area type is traversable
export function isAreaTypeTraversable(type: AreaType): boolean {
  const config = getAreaTypeConfig(type);
  return config?.traversable ?? true;
}

// Create a new area with default settings
export function createArea(
  type: AreaType,
  label?: string,
  color?: string
): Area {
  const config = getAreaTypeConfig(type);
  return {
    id: generateAreaId(),
    type,
    label: label ?? config?.label ?? 'Area',
    color: color ?? config?.defaultColor ?? '#dee2e6',
    cells: [],
  };
}

// Add a cell to an area
export function addCellToArea(area: Area, point: Point): Area {
  // Check if cell already exists in area
  const exists = area.cells.some(
    (cell) => cell.x === point.x && cell.y === point.y
  );
  if (exists) {
    return area;
  }
  return {
    ...area,
    cells: [...area.cells, { x: point.x, y: point.y }],
  };
}

// Remove a cell from an area
export function removeCellFromArea(area: Area, point: Point): Area {
  return {
    ...area,
    cells: area.cells.filter(
      (cell) => !(cell.x === point.x && cell.y === point.y)
    ),
  };
}

// Check if a point is in an area
export function isPointInArea(area: Area, point: Point): boolean {
  return area.cells.some(
    (cell) => cell.x === point.x && cell.y === point.y
  );
}

// Find which area contains a point (from a list of areas)
export function findAreaAtPoint(
  areas: Area[],
  point: Point
): Area | undefined {
  return areas.find((area) => isPointInArea(area, point));
}

// Update an area in a list of areas
export function updateAreaInList(areas: Area[], updatedArea: Area): Area[] {
  return areas.map((area) =>
    area.id === updatedArea.id ? updatedArea : area
  );
}

// Remove an area from a list
export function removeAreaFromList(areas: Area[], areaId: string): Area[] {
  return areas.filter((area) => area.id !== areaId);
}

// Get or create an area of a specific type in the list
export function getOrCreateAreaOfType(
  areas: Area[],
  type: AreaType
): { areas: Area[]; area: Area } {
  const existing = areas.find((a) => a.type === type);
  if (existing) {
    return { areas, area: existing };
  }
  const newArea = createArea(type);
  return {
    areas: [...areas, newArea],
    area: newArea,
  };
}

// Toggle a cell in an area (add if not present, remove if present)
export function toggleCellInArea(area: Area, point: Point): Area {
  const exists = isPointInArea(area, point);
  if (exists) {
    return removeCellFromArea(area, point);
  }
  return addCellToArea(area, point);
}

// Move a cell from one area to another
export function moveCellBetweenAreas(
  areas: Area[],
  point: Point,
  targetAreaId: string
): Area[] {
  return areas.map((area) => {
    if (area.id === targetAreaId) {
      // Add to target area
      return addCellToArea(area, point);
    } else {
      // Remove from other areas
      return removeCellFromArea(area, point);
    }
  });
}

// Assign a cell to an area type (removes from others, adds to matching type)
export function assignCellToAreaType(
  areas: Area[],
  point: Point,
  type: AreaType
): Area[] {
  // First, find or create an area of the target type
  const { areas: updatedAreas, area: targetArea } = getOrCreateAreaOfType(
    areas,
    type
  );

  // Then move the cell to that area
  return moveCellBetweenAreas(updatedAreas, point, targetArea.id);
}

// Convert areas to cells (for the grid)
export function areasToGridCells(areas: Area[]): Cell[] {
  const cellMap = new Map<string, Cell>();

  for (const area of areas) {
    const config = getAreaTypeConfig(area.type);
    const traversable = config?.traversable ?? true;

    for (const point of area.cells) {
      const key = `${point.x},${point.y}`;
      cellMap.set(key, {
        x: point.x,
        y: point.y,
        areaId: area.id,
        traversable,
      });
    }
  }

  return Array.from(cellMap.values());
}

// Get the color for a cell based on its area
export function getCellColor(
  areas: Area[],
  point: Point,
  defaultColor = '#ffffff'
): string {
  const area = findAreaAtPoint(areas, point);
  return area?.color ?? defaultColor;
}

// Clear all cells from an area
export function clearArea(area: Area): Area {
  return {
    ...area,
    cells: [],
  };
}

// Merge multiple areas of the same type into one
export function mergeAreasOfType(areas: Area[], type: AreaType): Area[] {
  const areasOfType = areas.filter((a) => a.type === type);
  const otherAreas = areas.filter((a) => a.type !== type);

  if (areasOfType.length <= 1) {
    return areas;
  }

  // Combine all cells into the first area
  const allCells: Point[] = [];
  for (const area of areasOfType) {
    allCells.push(...area.cells);
  }

  // Remove duplicates
  const uniqueCells = allCells.filter(
    (cell, index, self) =>
      index === self.findIndex((c) => c.x === cell.x && c.y === cell.y)
  );

  const mergedArea: Area = {
    ...areasOfType[0],
    cells: uniqueCells,
  };

  return [...otherAreas, mergedArea];
}

// Calculate the bounding box of all areas
export function calculateAreasBounds(areas: Area[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const area of areas) {
    for (const cell of area.cells) {
      minX = Math.min(minX, cell.x);
      maxX = Math.max(maxX, cell.x);
      minY = Math.min(minY, cell.y);
      maxY = Math.max(maxY, cell.y);
    }
  }

  // If no cells, return default bounds
  if (minX === Infinity) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  return { minX, maxX, minY, maxY };
}
