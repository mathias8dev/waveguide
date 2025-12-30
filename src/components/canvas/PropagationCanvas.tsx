import { useRef, useEffect, useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { CONSTANTS } from '@/types';

interface PropagationCanvasProps {
  width?: number;
  height?: number;
  showElectric?: boolean;
  showMagnetic?: boolean;
}

/**
 * Visualisation de la propagation longitudinale de l'onde
 * Montre les sinusoïdes se propageant le long du guide
 */
export function PropagationCanvas({
  width = 600,
  height = 300,
  showElectric = true,
  showMagnetic = true,
}: PropagationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const waveguide = useSimulationStore((state) => state.waveguide);
  const mode = useSimulationStore((state) => state.mode);
  const frequency = useSimulationStore((state) => state.frequency);
  const time = useSimulationStore((state) => state.time);
  const calculatedParams = useSimulationStore((state) => state.calculatedParams);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !calculatedParams) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { isPropagatif, propagationConstant: beta, cutoffFrequency: fc } = calculatedParams;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height);

    const padding = 50;
    const drawWidth = width - 2 * padding;

    // Dessiner le guide d'onde (vue latérale)
    const guideTop = padding + 20;
    const guideBottom = height - padding - 20;
    const guideHeight = guideBottom - guideTop;

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, guideTop);
    ctx.lineTo(width - padding, guideTop);
    ctx.moveTo(padding, guideBottom);
    ctx.lineTo(width - padding, guideBottom);
    ctx.stroke();

    // Lignes de direction de propagation
    ctx.strokeStyle = '#475569';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Flèche de direction de propagation
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('z →', width - padding + 10, height / 2 + 4);
    ctx.fillText('Direction de propagation', padding, height - 10);

    if (!isPropagatif) {
      // Mode évanescent - décroissance exponentielle
      ctx.fillStyle = '#f87171';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Mode évanescent (f < fc)', width / 2, height / 2);
      ctx.fillText(`fc = ${(fc / 1e9).toFixed(2)} GHz`, width / 2, height / 2 + 20);
      ctx.textAlign = 'left';

      // Dessiner l'atténuation
      const alpha = Math.sqrt(Math.pow((2 * Math.PI * fc) / CONSTANTS.c, 2) - Math.pow((2 * Math.PI * frequency) / CONSTANTS.c, 2));

      if (showElectric) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= drawWidth; x++) {
          const z = (x / drawWidth) * 0.1; // 10 cm de longueur
          const amplitude = Math.exp(-alpha * z) * (guideHeight / 3);
          const y = height / 2 - amplitude * Math.cos(2 * Math.PI * frequency * time);
          if (x === 0) {
            ctx.moveTo(padding + x, y);
          } else {
            ctx.lineTo(padding + x, y);
          }
        }
        ctx.stroke();
      }

      return;
    }

    // Calculer la longueur d'onde guidée
    const lambdaG = (2 * Math.PI) / beta;
    const omega = 2 * Math.PI * frequency;

    // Nombre de longueurs d'onde à afficher
    const numWavelengths = 3;
    const zLength = numWavelengths * lambdaG;

    // Amplitude de l'onde
    const amplitude = guideHeight / 3;

    // Dessiner le champ électrique (E)
    if (showElectric) {
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let x = 0; x <= drawWidth; x++) {
        const z = (x / drawWidth) * zLength;
        // E = E0 * sin(ωt - βz) pour une onde progressive
        const phase = omega * time - beta * z;
        const E = amplitude * Math.sin(phase);
        const y = height / 2 - E;

        if (x === 0) {
          ctx.moveTo(padding + x, y);
        } else {
          ctx.lineTo(padding + x, y);
        }
      }
      ctx.stroke();

      // Points de crête pour visualiser le mouvement
      ctx.fillStyle = '#ef4444';
      for (let i = 0; i < numWavelengths * 2; i++) {
        const peakZ = (omega * time - (i * Math.PI)) / beta;
        if (peakZ >= 0 && peakZ <= zLength) {
          const x = padding + (peakZ / zLength) * drawWidth;
          const E = amplitude * Math.sin(omega * time - beta * peakZ);
          const y = height / 2 - E;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Dessiner le champ magnétique (H)
    // Dans une onde EM guidée, E et H sont en phase temporellement
    // mais perpendiculaires spatialement. Ici on montre les amplitudes
    // qui oscillent ensemble (en phase).
    if (showMagnetic) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      // H est en phase avec E (même variation temporelle et spatiale)
      // L'amplitude relative E/H est déterminée par l'impédance du mode
      for (let x = 0; x <= drawWidth; x++) {
        const z = (x / drawWidth) * zLength;
        const phase = omega * time - beta * z;
        // H légèrement plus petit pour différencier visuellement
        const H = amplitude * 0.7 * Math.sin(phase);
        const y = height / 2 - H;

        if (x === 0) {
          ctx.moveTo(padding + x, y);
        } else {
          ctx.lineTo(padding + x, y);
        }
      }
      ctx.stroke();
    }

    // Dessiner les vecteurs de champ à intervalles réguliers
    const numVectors = 15;
    for (let i = 0; i <= numVectors; i++) {
      const x = padding + (i / numVectors) * drawWidth;
      const z = (i / numVectors) * zLength;
      const phase = omega * time - beta * z;

      if (showElectric) {
        const E = Math.sin(phase);
        const arrowLength = Math.abs(E) * 25;
        const arrowDir = E > 0 ? -1 : 1;

        if (Math.abs(E) > 0.1) {
          ctx.strokeStyle = `rgba(239, 68, 68, ${Math.abs(E)})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, height / 2);
          ctx.lineTo(x, height / 2 + arrowDir * arrowLength);
          ctx.stroke();

          // Pointe de flèche
          if (arrowLength > 5) {
            ctx.beginPath();
            ctx.moveTo(x, height / 2 + arrowDir * arrowLength);
            ctx.lineTo(x - 3, height / 2 + arrowDir * (arrowLength - 5));
            ctx.lineTo(x + 3, height / 2 + arrowDir * (arrowLength - 5));
            ctx.closePath();
            ctx.fillStyle = `rgba(239, 68, 68, ${Math.abs(E)})`;
            ctx.fill();
          }
        }
      }
    }

    // Informations
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(`λg = ${(lambdaG * 1000).toFixed(2)} mm`, padding, guideTop - 8);
    ctx.fillText(`β = ${beta.toFixed(1)} rad/m`, padding + 120, guideTop - 8);
    ctx.fillText(`Mode ${mode.type}${mode.m}${mode.n}`, width - padding - 60, guideTop - 8);

    // Légende
    const legendY = height - padding + 25;
    if (showElectric) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(padding, legendY, 20, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('E (champ électrique)', padding + 25, legendY + 4);
    }
    if (showMagnetic) {
      const legendX = showElectric ? padding + 160 : padding;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(legendX, legendY, 20, 3);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('H (champ magnétique)', legendX + 25, legendY + 4);
    }

    // Échelle de longueur d'onde
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    const lambdaWidth = drawWidth / numWavelengths;
    ctx.beginPath();
    ctx.moveTo(padding, guideBottom + 15);
    ctx.lineTo(padding + lambdaWidth, guideBottom + 15);
    ctx.moveTo(padding, guideBottom + 10);
    ctx.lineTo(padding, guideBottom + 20);
    ctx.moveTo(padding + lambdaWidth, guideBottom + 10);
    ctx.lineTo(padding + lambdaWidth, guideBottom + 20);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('λg', padding + lambdaWidth / 2, guideBottom + 28);
    ctx.textAlign = 'left';

  }, [waveguide, mode, frequency, time, calculatedParams, width, height, showElectric, showMagnetic]);

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
