import { useRef, useEffect, useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';

interface ColorMapCanvasProps {
  width?: number;
  height?: number;
  fieldType?: 'electric' | 'magnetic';
  resolution?: number;
}

/**
 * Visualisation colorimétrique de l'intensité du champ
 * Montre l'évolution temporelle de la distribution du champ
 */
export function ColorMapCanvas({
  width = 350,
  height = 350,
  fieldType = 'electric',
  resolution = 50,
}: ColorMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const waveguide = useSimulationStore((state) => state.waveguide);
  const waveguideInstance = useSimulationStore((state) => state.waveguideInstance);
  const mode = useSimulationStore((state) => state.mode);
  const frequency = useSimulationStore((state) => state.frequency);
  const time = useSimulationStore((state) => state.time);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveguideInstance) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    const padding = 40;
    const drawWidth = width - 2 * padding;
    const drawHeight = height - 2 * padding;

    // Calculer les dimensions du guide
    let guideWidth: number, guideHeight: number;
    let isCircular = false;

    switch (waveguide.type) {
      case 'rectangular':
        guideWidth = waveguide.a;
        guideHeight = waveguide.b;
        break;
      case 'circular':
        guideWidth = waveguide.radius * 2;
        guideHeight = waveguide.radius * 2;
        isCircular = true;
        break;
      case 'coaxial':
        guideWidth = waveguide.outerRadius * 2;
        guideHeight = waveguide.outerRadius * 2;
        isCircular = true;
        break;
      default:
        return;
    }

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

    // Calculer les champs et trouver le max
    const fieldData: { x: number; y: number; value: number }[] = [];
    let maxValue = 0;

    const dx = guideWidth / resolution;
    const dy = guideHeight / resolution;

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = -guideWidth / 2 + i * dx;
        const y = -guideHeight / 2 + j * dy;

        // Pour les guides circulaires, vérifier si on est dans le cercle
        if (isCircular) {
          const r = Math.sqrt(x * x + y * y);
          if (waveguide.type === 'circular' && r > waveguide.radius) continue;
          if (waveguide.type === 'coaxial' &&
              (r < waveguide.innerRadius || r > waveguide.outerRadius)) continue;
        }

        const field = waveguideInstance.getFieldDistribution(x, y, 0, mode, frequency, time);

        let value: number;
        if (fieldType === 'electric') {
          value = Math.sqrt(field.E.x ** 2 + field.E.y ** 2 + field.E.z ** 2);
        } else {
          value = Math.sqrt(field.H.x ** 2 + field.H.y ** 2 + field.H.z ** 2);
        }

        fieldData.push({ x, y, value });
        if (Math.abs(value) > maxValue) maxValue = Math.abs(value);
      }
    }

    // Dessiner la heatmap
    const cellWidth = (guideWidth * scaleX) / resolution;
    const cellHeight = (guideHeight * scaleY) / resolution;

    for (const point of fieldData) {
      const px = offsetX + (point.x + guideWidth / 2) * scaleX;
      const py = offsetY + (guideHeight / 2 - point.y) * scaleY;

      const normalizedValue = maxValue > 0 ? point.value / maxValue : 0;

      // Colormap: bleu (négatif) -> blanc (zéro) -> rouge (positif)
      // Puisque c'est une magnitude, on utilise une échelle de 0 à 1
      const color = getHeatmapColor(normalizedValue, fieldType);

      ctx.fillStyle = color;
      ctx.fillRect(px - cellWidth / 2, py - cellHeight / 2, cellWidth + 1, cellHeight + 1);
    }

    // Dessiner le contour du guide
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;

    if (waveguide.type === 'rectangular') {
      ctx.strokeRect(offsetX, offsetY, guideWidth * scaleX, guideHeight * scaleY);
    } else if (waveguide.type === 'circular') {
      const centerX = offsetX + guideWidth * scaleX / 2;
      const centerY = offsetY + guideHeight * scaleY / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, waveguide.radius * scaleX, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (waveguide.type === 'coaxial') {
      const centerX = offsetX + guideWidth * scaleX / 2;
      const centerY = offsetY + guideHeight * scaleY / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, waveguide.outerRadius * scaleX, 0, 2 * Math.PI);
      ctx.stroke();

      // Conducteur interne
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(centerX, centerY, waveguide.innerRadius * scaleX, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    // Titre
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `Champ ${fieldType === 'electric' ? 'électrique |E|' : 'magnétique |H|'}`,
      width / 2,
      20
    );
    ctx.fillText(`Mode ${mode.type}${mode.m}${mode.n}`, width / 2, 35);
    ctx.textAlign = 'left';

    // Colorbar
    const barWidth = 15;
    const barHeight = drawHeight * 0.6;
    const barX = width - padding + 10;
    const barY = padding + (drawHeight - barHeight) / 2;

    const gradient = ctx.createLinearGradient(0, barY + barHeight, 0, barY);
    if (fieldType === 'electric') {
      gradient.addColorStop(0, '#1e1e1e');
      gradient.addColorStop(0.5, '#dc2626');
      gradient.addColorStop(1, '#fef08a');
    } else {
      gradient.addColorStop(0, '#1e1e1e');
      gradient.addColorStop(0.5, '#2563eb');
      gradient.addColorStop(1, '#7dd3fc');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = '#64748b';
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px sans-serif';
    ctx.fillText('Max', barX, barY - 5);
    ctx.fillText('0', barX, barY + barHeight + 12);

  }, [waveguide, waveguideInstance, mode, frequency, time, width, height, fieldType, resolution]);

  useEffect(() => {
    draw();
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

function getHeatmapColor(value: number, type: 'electric' | 'magnetic'): string {
  // Valeur entre 0 et 1
  const v = Math.max(0, Math.min(1, value));

  if (type === 'electric') {
    // Noir -> Rouge -> Jaune
    if (v < 0.5) {
      const t = v * 2;
      const r = Math.floor(t * 220);
      const g = Math.floor(t * 38);
      const b = Math.floor(t * 38);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (v - 0.5) * 2;
      const r = Math.floor(220 + t * 34);
      const g = Math.floor(38 + t * 202);
      const b = Math.floor(38 + t * 100);
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else {
    // Noir -> Bleu -> Cyan
    if (v < 0.5) {
      const t = v * 2;
      const r = Math.floor(t * 37);
      const g = Math.floor(t * 99);
      const b = Math.floor(t * 235);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      const t = (v - 0.5) * 2;
      const r = Math.floor(37 + t * 88);
      const g = Math.floor(99 + t * 112);
      const b = Math.floor(235 + t * 17);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
}
