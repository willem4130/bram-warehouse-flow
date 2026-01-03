import { useRef, useEffect, useCallback, MouseEvent } from 'react';
import { GridData, Pallet, Dock, Point, Area, EditModeState, AreaType } from '../types';

const CELL_SIZE = 40;
const PALLET_SIZE = 30;
const PALLET_OFFSET = (CELL_SIZE - PALLET_SIZE) / 2;
const COORD_MARGIN = 30; // Space for coordinate labels

// Colors
const GRID_STROKE = '#ced4da';
const COORD_COLOR = '#ced4da';
const DOCK_FILL = '#e9ecef';
const PALLET_FILL = '#d2bab0';
const PALLET_STROKE = '#a89080';
const BACKGROUND = '#ffffff';
const PATH_STROKE = '#4dabf7';

interface GridCanvasProps {
  gridData: GridData | null;
  pallets: Pallet[];
  docks: Dock[];
  currentPath: Point[];
  // New props for edit mode
  areas?: Area[];
  editMode?: EditModeState;
  onCellClick?: (point: Point, areaType: AreaType) => void;
}

export function GridCanvas({
  gridData,
  pallets,
  docks,
  currentPath,
  areas = [],
  editMode,
  onCellClick,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boundsRef = useRef<{ offsetX: number; offsetY: number; bounds: GridData['bounds'] } | null>(null);

  // Convert screen coordinates to grid cell
  const screenToGridCell = useCallback((clientX: number, clientY: number): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas || !boundsRef.current) return null;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const { offsetX, offsetY, bounds } = boundsRef.current;

    // Convert canvas position to grid coordinate space
    const rawX = x - offsetX;
    const rawY = y - offsetY;

    // Calculate cell index relative to grid origin, then convert back to grid position
    const cellIndexX = Math.floor((rawX - bounds.minX) / CELL_SIZE);
    const cellIndexY = Math.floor((rawY - bounds.minY) / CELL_SIZE);
    const gridX = bounds.minX + cellIndexX * CELL_SIZE;
    const gridY = bounds.minY + cellIndexY * CELL_SIZE;

    // Check if within grid bounds
    if (gridX < bounds.minX || gridX >= bounds.maxX || gridY < bounds.minY || gridY >= bounds.maxY) {
      return null;
    }

    return { x: gridX, y: gridY };
  }, []);

  // Handle canvas click
  const handleClick = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    if (!editMode?.isEditMode || editMode.target !== 'areas' || !onCellClick) return;

    const point = screenToGridCell(event.clientX, event.clientY);
    if (point) {
      onCellClick(point, editMode.selectedAreaType);
    }
  }, [editMode, onCellClick, screenToGridCell]);

  // Handle mouse drag for painting
  const handleMouseMove = useCallback((event: MouseEvent<HTMLCanvasElement>) => {
    if (!editMode?.isEditMode || editMode.target !== 'areas' || !onCellClick) return;

    // Only paint if mouse button is pressed
    if (event.buttons !== 1) return;

    const point = screenToGridCell(event.clientX, event.clientY);
    if (point) {
      onCellClick(point, editMode.selectedAreaType);
    }
  }, [editMode, onCellClick, screenToGridCell]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate canvas size from grid bounds
    const { bounds } = gridData;
    const padding = 20;
    const width = bounds.maxX - bounds.minX + padding * 2 + COORD_MARGIN;
    const height = bounds.maxY - bounds.minY + padding * 2 + COORD_MARGIN;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // Offset for drawing (translate grid to start at padding + margin for labels)
    const offsetX = padding - bounds.minX + COORD_MARGIN;
    const offsetY = padding - bounds.minY + COORD_MARGIN;

    // Store bounds for click handling
    boundsRef.current = { offsetX, offsetY, bounds };

    // Calculate grid dimensions in cells
    const gridWidthCells = Math.round((bounds.maxX - bounds.minX) / CELL_SIZE);
    const gridHeightCells = Math.round((bounds.maxY - bounds.minY) / CELL_SIZE);

    // Draw coordinate labels
    ctx.fillStyle = COORD_COLOR;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Horizontal letters (A, B, C, ...) at the top - columns
    for (let i = 0; i < gridWidthCells; i++) {
      const x = bounds.minX + i * CELL_SIZE + CELL_SIZE / 2 + offsetX;
      const y = padding / 2 + COORD_MARGIN / 2;
      const letter = String.fromCharCode(65 + i); // A=65
      ctx.fillText(letter, x, y);
    }

    // Vertical numbers (1, 2, 3, ...) on the left - rows
    for (let i = 0; i < gridHeightCells; i++) {
      const x = padding / 2 + COORD_MARGIN / 2;
      const y = bounds.minY + i * CELL_SIZE + CELL_SIZE / 2 + offsetY;
      ctx.fillText((i + 1).toString(), x, y);
    }

    // Draw empty cells (grid lines)
    ctx.strokeStyle = GRID_STROKE;
    ctx.lineWidth = 1;
    gridData.emptyCells.forEach((cell) => {
      ctx.strokeRect(
        cell.x + offsetX,
        cell.y + offsetY,
        CELL_SIZE,
        CELL_SIZE
      );
    });

    // Draw areas with their colors (new architecture)
    if (areas.length > 0) {
      areas.forEach((area) => {
        ctx.fillStyle = area.color;
        area.cells.forEach((cell) => {
          ctx.fillRect(cell.x + offsetX, cell.y + offsetY, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = GRID_STROKE;
          ctx.strokeRect(cell.x + offsetX, cell.y + offsetY, CELL_SIZE, CELL_SIZE);
        });
      });
    } else {
      // Fallback: Draw docks using legacy system (grey background)
      docks.forEach((dock) => {
        ctx.fillStyle = DOCK_FILL;
        ctx.fillRect(dock.x + offsetX, dock.y + offsetY, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = GRID_STROKE;
        ctx.strokeRect(dock.x + offsetX, dock.y + offsetY, CELL_SIZE, CELL_SIZE);
      });
    }

    // Draw current path
    if (currentPath.length >= 2) {
      ctx.strokeStyle = PATH_STROKE;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const centerOffset = CELL_SIZE / 2;
      ctx.moveTo(
        currentPath[0].x + offsetX + centerOffset,
        currentPath[0].y + offsetY + centerOffset
      );
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(
          currentPath[i].x + offsetX + centerOffset,
          currentPath[i].y + offsetY + centerOffset
        );
      }
      ctx.stroke();

      // Reset line style
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }

    // Draw pallets that haven't moved yet (at their start positions)
    gridData.pallets.forEach((cell) => {
      // Only draw if this pallet is not in our active pallets list
      const activePallet = pallets.find((p) => p.startX === cell.x && p.startY === cell.y);
      if (activePallet) return; // Will be drawn as moving pallet

      ctx.fillStyle = PALLET_FILL;
      ctx.fillRect(
        cell.x + offsetX + PALLET_OFFSET,
        cell.y + offsetY + PALLET_OFFSET,
        PALLET_SIZE,
        PALLET_SIZE
      );
      ctx.strokeStyle = PALLET_STROKE;
      ctx.strokeRect(
        cell.x + offsetX + PALLET_OFFSET,
        cell.y + offsetY + PALLET_OFFSET,
        PALLET_SIZE,
        PALLET_SIZE
      );
    });

    // Draw active/moving pallets
    pallets.forEach((pallet) => {
      ctx.fillStyle = PALLET_FILL;
      ctx.fillRect(
        pallet.x + offsetX + PALLET_OFFSET,
        pallet.y + offsetY + PALLET_OFFSET,
        PALLET_SIZE,
        PALLET_SIZE
      );
      ctx.strokeStyle = PALLET_STROKE;
      ctx.strokeRect(
        pallet.x + offsetX + PALLET_OFFSET,
        pallet.y + offsetY + PALLET_OFFSET,
        PALLET_SIZE,
        PALLET_SIZE
      );
    });

    // Draw edit mode indicator (cursor highlight)
    if (editMode?.isEditMode && editMode.target === 'areas') {
      canvas.style.cursor = 'crosshair';
    } else {
      canvas.style.cursor = 'default';
    }
  }, [gridData, pallets, docks, currentPath, areas, editMode]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#fff',
      }}
    />
  );
}
