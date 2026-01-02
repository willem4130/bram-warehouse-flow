import { useRef, useEffect } from 'react';
import { PixelPosition } from '../types';
import { PALLET_CONFIG } from '../constants/config';

interface WarehouseViewProps {
  palletPosition: PixelPosition;
}

export function WarehouseView({ palletPosition }: WarehouseViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageLoadedRef = useRef(false);

  // Load the background image once
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      imageLoadedRef.current = true;
      // Trigger initial draw
      drawCanvas();
    };
    img.src = '/warehouse-background.png';
  }, []);

  // Draw canvas whenever pallet position changes
  useEffect(() => {
    drawCanvas();
  }, [palletPosition]);

  function drawCanvas() {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoadedRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match image
    if (canvas.width !== img.width || canvas.height !== img.height) {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw pallet
    ctx.fillStyle = PALLET_CONFIG.color;
    ctx.fillRect(
      palletPosition.x + PALLET_CONFIG.offset,
      palletPosition.y + PALLET_CONFIG.offset,
      PALLET_CONFIG.size,
      PALLET_CONFIG.size
    );

    // Draw pallet border
    ctx.strokeStyle = PALLET_CONFIG.borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      palletPosition.x + PALLET_CONFIG.offset,
      palletPosition.y + PALLET_CONFIG.offset,
      PALLET_CONFIG.size,
      PALLET_CONFIG.size
    );
  }

  return (
    <div className="warehouse-container">
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          height: 'auto',
          border: '1px solid #ccc',
        }}
      />
    </div>
  );
}
