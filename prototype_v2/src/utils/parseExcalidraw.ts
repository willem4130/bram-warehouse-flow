import { GridData, GridCell } from '../types';

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

const DOCK_COLOR = '#e9ecef';
const PALLET_COLOR = '#d2bab0';
const CELL_SIZE = 40;
const GRID_ORIGIN_X = 400;
const GRID_ORIGIN_Y = -60; // Top of grid based on pallet positions

/**
 * Snap a position to the nearest grid cell
 */
function snapToGrid(x: number, y: number): { x: number; y: number } {
  const snappedX = Math.round((x - GRID_ORIGIN_X) / CELL_SIZE) * CELL_SIZE + GRID_ORIGIN_X;
  const snappedY = Math.round((y - GRID_ORIGIN_Y) / CELL_SIZE) * CELL_SIZE + GRID_ORIGIN_Y;
  return { x: snappedX, y: snappedY };
}

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
    const isPallet = e.backgroundColor === PALLET_COLOR;
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
    } else if (e.backgroundColor === PALLET_COLOR) {
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
