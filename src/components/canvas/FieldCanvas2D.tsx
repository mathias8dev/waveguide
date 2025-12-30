import { useRef, useEffect, useCallback, useState } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { useFieldData } from '@/hooks/useFieldData';

interface FieldCanvas2DProps {
  width?: number;
  height?: number;
  showElectric?: boolean;
  showMagnetic?: boolean;
  showVectors?: boolean;
}

export function FieldCanvas2D({
  width = 400,
  height = 400,
  showElectric = true,
  showMagnetic = false,
  showVectors = true,
}: FieldCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // État du zoom et du pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const waveguide = useSimulationStore((state) => state.waveguide);
  const { fieldData, maxValues } = useFieldData({ resolution: 25 });

  // Gestion du zoom avec la molette
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(prev * delta, 0.5), 5));
  }, []);

  // Gestion du pan avec le drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom et pan
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Attacher l'événement wheel au canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    // Appliquer la transformation (zoom et pan)
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // Calculer les dimensions du guide pour le mapping
    let guideWidth: number, guideHeight: number;

    switch (waveguide.type) {
      case 'rectangular':
        guideWidth = waveguide.a;
        guideHeight = waveguide.b;
        break;
      case 'circular':
        guideWidth = waveguide.radius * 2;
        guideHeight = waveguide.radius * 2;
        break;
      case 'coaxial':
        guideWidth = waveguide.outerRadius * 2;
        guideHeight = waveguide.outerRadius * 2;
        break;
      default:
        return;
    }

    const padding = 40;
    const drawWidth = width - 2 * padding;
    const drawHeight = height - 2 * padding;

    // Maintenir le ratio d'aspect
    const aspectRatio = guideWidth / guideHeight;
    let scaleX: number, scaleY: number;

    if (aspectRatio > drawWidth / drawHeight) {
      scaleX = drawWidth / guideWidth;
      scaleY = scaleX;
    } else {
      scaleY = drawHeight / guideHeight;
      scaleX = scaleY;
    }

    const offsetX = padding + (drawWidth - guideWidth * scaleX) / 2;
    const offsetY = padding + (drawHeight - guideHeight * scaleY) / 2;

    // Dessiner le contour du guide
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;

    if (waveguide.type === 'rectangular') {
      const rectX = offsetX;
      const rectY = offsetY;
      const rectW = waveguide.a * scaleX;
      const rectH = waveguide.b * scaleY;

      ctx.strokeRect(rectX, rectY, rectW, rectH);
    } else if (waveguide.type === 'circular') {
      const centerX = offsetX + waveguide.radius * scaleX;
      const centerY = offsetY + waveguide.radius * scaleY;
      const radius = waveguide.radius * scaleX;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (waveguide.type === 'coaxial') {
      const centerX = offsetX + waveguide.outerRadius * scaleX;
      const centerY = offsetY + waveguide.outerRadius * scaleY;

      // Conducteur externe
      ctx.beginPath();
      ctx.arc(centerX, centerY, waveguide.outerRadius * scaleX, 0, 2 * Math.PI);
      ctx.stroke();

      // Conducteur interne
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, waveguide.innerRadius * scaleX, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Fonction pour mapper les coordonnées
    const mapX = (x: number) => {
      return offsetX + (x + guideWidth / 2) * scaleX;
    };
    const mapY = (y: number) => {
      return offsetY + (guideHeight / 2 - y) * scaleY;
    };

    // Dessiner les champs
    for (const point of fieldData) {
      const px = mapX(point.x);
      const py = mapY(point.y);

      // Skip si hors du canvas
      if (px < padding || px > width - padding || py < padding || py > height - padding) {
        continue;
      }

      if (showElectric && maxValues.maxE > 0) {
        const Ex = point.field.E.x;
        const Ey = point.field.E.y;
        const magnitude = Math.sqrt(Ex * Ex + Ey * Ey);
        const normalizedMag = magnitude / maxValues.maxE;

        if (showVectors && magnitude > maxValues.maxE * 0.01) {
          // Dessiner le vecteur
          const vectorScale = 15;
          const dx = (Ex / maxValues.maxE) * vectorScale;
          const dy = -(Ey / maxValues.maxE) * vectorScale;

          // Couleur basée sur l'intensité (rouge pour E)
          const alpha = Math.min(1, normalizedMag * 2);
          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + dx, py + dy);
          ctx.stroke();

          // Pointe de flèche
          if (magnitude > maxValues.maxE * 0.05) {
            const angle = Math.atan2(dy, dx);
            const arrowSize = 4;

            ctx.beginPath();
            ctx.moveTo(px + dx, py + dy);
            ctx.lineTo(
              px + dx - arrowSize * Math.cos(angle - Math.PI / 6),
              py + dy - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(px + dx, py + dy);
            ctx.lineTo(
              px + dx - arrowSize * Math.cos(angle + Math.PI / 6),
              py + dy - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        } else {
          // Dessiner un point coloré
          const intensity = Math.floor(normalizedMag * 255);
          ctx.fillStyle = `rgb(${intensity}, ${Math.floor(intensity * 0.3)}, ${Math.floor(intensity * 0.3)})`;
          ctx.fillRect(px - 2, py - 2, 4, 4);
        }
      }

      if (showMagnetic && maxValues.maxH > 0) {
        const Hx = point.field.H.x;
        const Hy = point.field.H.y;
        const magnitude = Math.sqrt(Hx * Hx + Hy * Hy);
        const normalizedMag = magnitude / maxValues.maxH;

        if (showVectors && magnitude > maxValues.maxH * 0.01) {
          const vectorScale = 15;
          const dx = (Hx / maxValues.maxH) * vectorScale;
          const dy = -(Hy / maxValues.maxH) * vectorScale;

          const alpha = Math.min(1, normalizedMag * 2);
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + dx, py + dy);
          ctx.stroke();

          if (magnitude > maxValues.maxH * 0.05) {
            const angle = Math.atan2(dy, dx);
            const arrowSize = 4;

            ctx.beginPath();
            ctx.moveTo(px + dx, py + dy);
            ctx.lineTo(
              px + dx - arrowSize * Math.cos(angle - Math.PI / 6),
              py + dy - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(px + dx, py + dy);
            ctx.lineTo(
              px + dx - arrowSize * Math.cos(angle + Math.PI / 6),
              py + dy - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
        }
      }
    }

    // Restaurer le contexte (fin du zoom/pan)
    ctx.restore();

    // Légende (dessinée sans transformation)
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#94a3b8';

    if (showElectric) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, height - 25, 15, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('E (champ électrique)', 30, height - 20);
    }

    if (showMagnetic) {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(showElectric ? 180 : 10, height - 25, 15, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('H (champ magnétique)', showElectric ? 200 : 30, height - 20);
    }

    // Indicateur de zoom (sans transformation)
    if (zoom !== 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${Math.round(zoom * 100)}%`, width - 45, 20);
    }
  }, [fieldData, maxValues, waveguide, width, height, showElectric, showMagnetic, showVectors, zoom, pan]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {/* Contrôles de zoom */}
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}
          className="w-7 h-7 bg-slate-700/80 hover:bg-slate-600 text-white rounded text-sm font-bold"
          title="Zoom avant"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z / 1.2, 0.5))}
          className="w-7 h-7 bg-slate-700/80 hover:bg-slate-600 text-white rounded text-sm font-bold"
          title="Zoom arrière"
        >
          −
        </button>
        {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
          <button
            onClick={resetView}
            className="px-2 h-7 bg-slate-700/80 hover:bg-slate-600 text-white rounded text-xs"
            title="Réinitialiser la vue"
          >
            Reset
          </button>
        )}
      </div>
      {/* Instructions */}
      <div className="absolute bottom-8 left-2 text-xs text-slate-400/70">
        Molette: zoom | Glisser: déplacer
      </div>
    </div>
  );
}
