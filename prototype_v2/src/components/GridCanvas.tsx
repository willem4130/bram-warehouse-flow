import { useRef, useEffect } from 'react';
import { GridData, Pallet, Dock } from '../types';

const CELL_SIZE = 40;
const PALLET_SIZE = 36;
const PALLET_OFFSET = (CELL_SIZE - PALLET_SIZE) / 2;

// Colors
const GRID_STROKE = '#ced4da';
const DOCK_FILL = '#e9ecef';
const PALLET_FILL = '#d2bab0';
const PALLET_STROKE = '#a89080';
const BACKGROUND = '#ffffff';

interface GridCanvasProps {
  gridData: GridData | null;
  pallets: Pallet[];
  docks: Dock[];
}

export function GridCanvas({ gridData, pallets, docks }: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate canvas size from grid bounds
    const { bounds } = gridData;
    const padding = 20;
    const width = bounds.maxX - bounds.minX + padding * 2;
    const height = bounds.maxY - bounds.minY + padding * 2;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);

    // Offset for drawing (translate grid to start at padding)
    const offsetX = padding - bounds.minX;
    const offsetY = padding - bounds.minY;

    // Draw empty cells
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

    // Draw docks (grey background)
    docks.forEach((dock) => {
      ctx.fillStyle = DOCK_FILL;
      ctx.fillRect(dock.x + offsetX, dock.y + offsetY, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = GRID_STROKE;
      ctx.strokeRect(dock.x + offsetX, dock.y + offsetY, CELL_SIZE, CELL_SIZE);
    });

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
      ctx.lineWidth = 2;
      ctx.strokeRect(
        pallet.x + offsetX + PALLET_OFFSET,
        pallet.y + offsetY + PALLET_OFFSET,
        PALLET_SIZE,
        PALLET_SIZE
      );
      ctx.lineWidth = 1;
    });
  }, [gridData, pallets, docks]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#fff',
      }}
    />
  );
}
