/**
 * Hook de dessin pour la visualisation de propagation
 *
 * Extrait la logique de dessin du PropagationCanvas pour réutilisabilité
 */

import { useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { SPEED_OF_LIGHT } from '@/constants';
import { UI, COLORS } from '@/constants';

interface DrawOptions {
  width: number;
  height: number;
  showElectric: boolean;
  showMagnetic: boolean;
}

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  padding: number;
  drawWidth: number;
  guideTop: number;
  guideBottom: number;
  guideHeight: number;
}

/**
 * Dessine le fond et la structure du guide
 */
function drawGuideStructure(dc: DrawContext): void {
  const { ctx, width, height, padding, guideTop, guideBottom } = dc;

  // Fond
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, height);

  // Parois du guide (vue latérale)
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, guideTop);
  ctx.lineTo(width - padding, guideTop);
  ctx.moveTo(padding, guideBottom);
  ctx.lineTo(width - padding, guideBottom);
  ctx.stroke();

  // Ligne centrale de propagation
  ctx.strokeStyle = '#475569';
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(padding, height / 2);
  ctx.lineTo(width - padding, height / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Labels de direction
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px sans-serif';
  ctx.fillText('z →', width - padding + 10, height / 2 + 4);
  ctx.fillText('Direction de propagation', padding, height - 10);
}

/**
 * Dessine le mode évanescent (décroissance exponentielle)
 * @param phase - Phase d'animation en radians (depuis le store)
 */
function drawEvanescentMode(
  dc: DrawContext,
  fc: number,
  frequency: number,
  phase: number,
  showElectric: boolean
): void {
  const { ctx, width, height, padding, drawWidth, guideHeight } = dc;

  // Message d'avertissement
  ctx.fillStyle = '#f87171';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Mode évanescent (f < fc)', width / 2, height / 2);
  ctx.fillText(`fc = ${(fc / 1e9).toFixed(2)} GHz`, width / 2, height / 2 + 20);
  ctx.textAlign = 'left';

  // Dessiner la décroissance exponentielle
  if (showElectric) {
    const kc = (2 * Math.PI * fc) / SPEED_OF_LIGHT;
    const k = (2 * Math.PI * frequency) / SPEED_OF_LIGHT;
    const alpha = Math.sqrt(kc * kc - k * k);

    ctx.strokeStyle = COLORS.ELECTRIC_FIELD;
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 0; x <= drawWidth; x++) {
      const z = (x / drawWidth) * 0.1; // 10 cm de longueur
      const amplitude = Math.exp(-alpha * z) * (guideHeight / 3);
      // Utiliser phase directement (pas omega * time)
      const y = height / 2 - amplitude * Math.cos(phase);

      if (x === 0) {
        ctx.moveTo(padding + x, y);
      } else {
        ctx.lineTo(padding + x, y);
      }
    }
    ctx.stroke();
  }
}

/**
 * Dessine les sinusoïdes de propagation E et H
 * @param animationPhase - Phase d'animation en radians (depuis le store)
 */
function drawPropagatingWaves(
  dc: DrawContext,
  beta: number,
  animationPhase: number,
  showElectric: boolean,
  showMagnetic: boolean
): { zLength: number; numWavelengths: number } {
  const { ctx, height, padding, drawWidth, guideHeight } = dc;

  const lambdaG = (2 * Math.PI) / beta;
  const numWavelengths = 3;
  const zLength = numWavelengths * lambdaG;
  const amplitude = guideHeight / 3;

  // Champ E
  if (showElectric) {
    ctx.strokeStyle = COLORS.ELECTRIC_FIELD;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let x = 0; x <= drawWidth; x++) {
      const z = (x / drawWidth) * zLength;
      // Phase = animationPhase - beta * z (onde progressive vers +z)
      const phase = animationPhase - beta * z;
      const E = amplitude * Math.sin(phase);
      const y = height / 2 - E;

      if (x === 0) {
        ctx.moveTo(padding + x, y);
      } else {
        ctx.lineTo(padding + x, y);
      }
    }
    ctx.stroke();

    // Points de crête (là où sin(phase) = ±1)
    ctx.fillStyle = COLORS.ELECTRIC_FIELD;
    for (let i = 0; i < numWavelengths * 2; i++) {
      const peakZ = (animationPhase - i * Math.PI) / beta;
      if (peakZ >= 0 && peakZ <= zLength) {
        const x = padding + (peakZ / zLength) * drawWidth;
        const E = amplitude * Math.sin(animationPhase - beta * peakZ);
        const y = height / 2 - E;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // Champ H (en phase avec E, amplitude réduite pour différencier)
  if (showMagnetic) {
    ctx.strokeStyle = COLORS.MAGNETIC_FIELD;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let x = 0; x <= drawWidth; x++) {
      const z = (x / drawWidth) * zLength;
      const phase = animationPhase - beta * z;
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

  return { zLength, numWavelengths };
}

/**
 * Dessine les vecteurs de champ à intervalles réguliers
 * @param animationPhase - Phase d'animation en radians
 */
function drawFieldVectors(
  dc: DrawContext,
  zLength: number,
  beta: number,
  animationPhase: number,
  showElectric: boolean
): void {
  const { ctx, height, padding, drawWidth } = dc;
  const numVectors = 15;

  for (let i = 0; i <= numVectors; i++) {
    const x = padding + (i / numVectors) * drawWidth;
    const z = (i / numVectors) * zLength;
    const phase = animationPhase - beta * z;

    if (showElectric) {
      const E = Math.sin(phase);
      const arrowLength = Math.abs(E) * 25;
      const arrowDir = E > 0 ? -1 : 1;

      if (Math.abs(E) > 0.1) {
        const alpha = Math.abs(E);
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
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
          ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.fill();
        }
      }
    }
  }
}

/**
 * Dessine les informations et la légende
 */
function drawInfoAndLegend(
  dc: DrawContext,
  lambdaG: number,
  beta: number,
  mode: { type: string; m: number; n: number },
  numWavelengths: number,
  showElectric: boolean,
  showMagnetic: boolean
): void {
  const { ctx, width, height, padding, drawWidth, guideTop, guideBottom } = dc;

  // Informations en haut
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`λg = ${(lambdaG * 1000).toFixed(2)} mm`, padding, guideTop - 8);
  ctx.fillText(`β = ${beta.toFixed(1)} rad/m`, padding + 120, guideTop - 8);
  ctx.fillText(`Mode ${mode.type}${mode.m}${mode.n}`, width - padding - 60, guideTop - 8);

  // Légende
  const legendY = height - UI.PROPAGATION_PADDING + 25;
  if (showElectric) {
    ctx.fillStyle = COLORS.ELECTRIC_FIELD;
    ctx.fillRect(padding, legendY, 20, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('E (champ électrique)', padding + 25, legendY + 4);
  }
  if (showMagnetic) {
    const legendX = showElectric ? padding + 160 : padding;
    ctx.fillStyle = COLORS.MAGNETIC_FIELD;
    ctx.fillRect(legendX, legendY, 20, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('H (champ magnétique)', legendX + 25, legendY + 4);
  }

  // Échelle de longueur d'onde
  const lambdaWidth = drawWidth / numWavelengths;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
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
}

/**
 * Hook pour le dessin de la visualisation de propagation
 *
 * Note: Le `time` du store est maintenant une phase d'animation en radians,
 * pas le temps physique. Cela permet une animation visible.
 */
export function usePropagationDraw(options: DrawOptions) {
  const mode = useSimulationStore((state) => state.mode);
  const frequency = useSimulationStore((state) => state.frequency);
  // `animationPhase` est en radians, évolue lentement pour être visible
  const animationPhase = useSimulationStore((state) => state.time);
  const calculatedParams = useSimulationStore((state) => state.calculatedParams);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!calculatedParams) return;

      const { width, height, showElectric, showMagnetic } = options;
      const padding = UI.PROPAGATION_PADDING;
      const drawWidth = width - 2 * padding;
      const guideTop = padding + 20;
      const guideBottom = height - padding - 20;
      const guideHeight = guideBottom - guideTop;

      const dc: DrawContext = {
        ctx,
        width,
        height,
        padding,
        drawWidth,
        guideTop,
        guideBottom,
        guideHeight,
      };

      const { isPropagatif, propagationConstant: beta, cutoffFrequency: fc } = calculatedParams;

      // Dessiner la structure de base
      drawGuideStructure(dc);

      if (!isPropagatif) {
        drawEvanescentMode(dc, fc, frequency, animationPhase, showElectric);
        return;
      }

      const lambdaG = (2 * Math.PI) / beta;

      // Dessiner les ondes propagatives
      const { zLength, numWavelengths } = drawPropagatingWaves(
        dc,
        beta,
        animationPhase,
        showElectric,
        showMagnetic
      );

      // Dessiner les vecteurs de champ
      drawFieldVectors(dc, zLength, beta, animationPhase, showElectric);

      // Dessiner les informations
      drawInfoAndLegend(dc, lambdaG, beta, mode, numWavelengths, showElectric, showMagnetic);
    },
    [options, mode, frequency, animationPhase, calculatedParams]
  );

  return { draw, calculatedParams };
}
