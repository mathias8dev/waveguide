import { useRef, useEffect } from 'react';
import { usePropagationDraw } from '@/hooks/usePropagationDraw';
import { UI } from '@/constants';

interface PropagationCanvasProps {
  width?: number;
  height?: number;
  showElectric?: boolean;
  showMagnetic?: boolean;
}

/**
 * Visualisation de la propagation longitudinale de l'onde
 *
 * Affiche les sinusoïdes E et H se propageant le long du guide d'onde.
 * En mode évanescent (f < fc), montre la décroissance exponentielle.
 */
export function PropagationCanvas({
  width = UI.PROPAGATION_CANVAS_WIDTH,
  height = UI.PROPAGATION_CANVAS_HEIGHT,
  showElectric = true,
  showMagnetic = true,
}: PropagationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { draw } = usePropagationDraw({
    width,
    height,
    showElectric,
    showMagnetic,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    draw(ctx);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg"
    />
  );
}
