/**
 * Hook de dessin pour la visualisation de propagation
 *
 * Extrait la logique de dessin du PropagationCanvas pour réutilisabilité
 *
 * La forme d'onde dépend du mode de propagation:
 * - TE (Transverse Électrique): Ez = 0, distribution selon sin(mπx/a)·sin(nπy/b)
 * - TM (Transverse Magnétique): Hz = 0, distribution selon cos(mπx/a)·cos(nπy/b)
 * - TEM (câble coaxial): Distribution uniforme, pas de variation transversale
 */

import { useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { SPEED_OF_LIGHT } from '@/constants';
import { UI, COLORS } from '@/constants';
import { Mode } from '@/types';

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
 * Calcule le facteur de modulation transversale selon le mode
 * Pour un mode TEmn ou TMmn, le champ varie selon sin(mπx/a)·sin(nπy/b)
 * On représente ici la variation selon y (position verticale dans la vue latérale)
 */
function getTransverseModulation(mode: Mode, yNormalized: number): number {
  const { type, n } = mode;

  if (type === 'TEM') {
    // Mode TEM: distribution uniforme
    return 1;
  }

  // Pour les modes TE et TM, la modulation dépend de n (variation en y)
  // yNormalized est entre 0 et 1 (0 = paroi inférieure, 1 = paroi supérieure)
  if (n === 0) {
    // n=0: pas de variation en y, amplitude maximale au centre
    return 1;
  }

  // Pour n > 0, le champ varie sinusoïdalement en y
  // sin(nπy) où y va de 0 à 1
  return Math.sin(n * Math.PI * yNormalized);
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
 * @param mode - Mode de propagation (TE, TM, TEM avec indices m, n)
 *
 * Physique: Dans une onde plane EM se propageant en +z:
 * - E = E₀ sin(ωt - βz) × f(y) où f(y) dépend du mode
 * - H = H₀ sin(ωt - βz) × g(y) où g(y) dépend du mode
 *
 * Pour les modes avec n > 0, on affiche plusieurs courbes à différentes
 * positions transversales pour montrer la variation du champ.
 */
function drawPropagatingWaves(
  dc: DrawContext,
  beta: number,
  animationPhase: number,
  showElectric: boolean,
  showMagnetic: boolean,
  mode: Mode
): { zLength: number; numWavelengths: number } {
  const { ctx, height, padding, drawWidth, guideHeight, guideTop, guideBottom } = dc;

  const lambdaG = (2 * Math.PI) / beta;
  const numWavelengths = 3;
  const zLength = numWavelengths * lambdaG;
  const baseAmplitudeE = guideHeight / 3;
  const baseAmplitudeH = guideHeight / 4;

  // Nombre de courbes à afficher selon le mode
  // Pour n=0: une seule courbe au centre
  // Pour n>0: plusieurs courbes à différentes positions y
  const numCurves = mode.n === 0 ? 1 : Math.min(mode.n + 1, 3);

  // Positions y normalisées pour les courbes (0 = bas, 1 = haut)
  const yPositions: number[] = [];
  if (numCurves === 1) {
    yPositions.push(0.5); // Centre
  } else {
    for (let i = 0; i < numCurves; i++) {
      yPositions.push((i + 1) / (numCurves + 1));
    }
  }

  // Champ E (oscillation verticale - rouge)
  if (showElectric) {
    for (let curveIdx = 0; curveIdx < yPositions.length; curveIdx++) {
      const yNorm = yPositions[curveIdx];
      const modulation = getTransverseModulation(mode, yNorm);
      const amplitudeE = baseAmplitudeE * Math.abs(modulation);

      // Opacité variable selon la position (plus opaque au centre)
      const opacity = numCurves === 1 ? 1 : 0.4 + 0.6 * Math.abs(modulation);

      // Position verticale de la courbe dans le guide
      const curveY = guideTop + yNorm * (guideBottom - guideTop);

      ctx.strokeStyle = `rgba(239, 68, 68, ${opacity})`;
      ctx.lineWidth = numCurves === 1 ? 2.5 : 2;
      ctx.beginPath();

      for (let x = 0; x <= drawWidth; x++) {
        const z = (x / drawWidth) * zLength;
        const phase = animationPhase - beta * z;
        // Pour TM, le signe peut changer selon la position
        const sign = modulation >= 0 ? 1 : -1;
        const E = amplitudeE * Math.sin(phase) * sign;

        // Dessiner autour de la position y de la courbe
        const y = curveY - E * 0.3; // Facteur 0.3 pour ne pas sortir du guide

        if (x === 0) {
          ctx.moveTo(padding + x, y);
        } else {
          ctx.lineTo(padding + x, y);
        }
      }
      ctx.stroke();
    }

    // Points de crête E (seulement pour la courbe principale)
    ctx.fillStyle = COLORS.ELECTRIC_FIELD;
    const mainModulation = getTransverseModulation(mode, 0.5);
    const mainAmplitudeE = baseAmplitudeE * Math.abs(mainModulation);

    for (let i = 0; i < numWavelengths * 2 + 1; i++) {
      const peakPhase = Math.PI / 2 + i * Math.PI;
      const peakZ = (animationPhase - peakPhase) / beta;
      if (peakZ >= 0 && peakZ <= zLength) {
        const x = padding + (peakZ / zLength) * drawWidth;
        const E = mainAmplitudeE * Math.sin(animationPhase - beta * peakZ);
        const y = height / 2 - E * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // Champ H (en phase avec E pour mode TE guidé - bleu)
  if (showMagnetic) {
    for (let curveIdx = 0; curveIdx < yPositions.length; curveIdx++) {
      const yNorm = yPositions[curveIdx];
      const modulation = getTransverseModulation(mode, yNorm);
      const amplitudeH = baseAmplitudeH * Math.abs(modulation);

      const opacity = numCurves === 1 ? 1 : 0.4 + 0.6 * Math.abs(modulation);
      const curveY = guideTop + yNorm * (guideBottom - guideTop);

      ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
      ctx.lineWidth = numCurves === 1 ? 2 : 1.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();

      for (let x = 0; x <= drawWidth; x++) {
        const z = (x / drawWidth) * zLength;
        const phase = animationPhase - beta * z;
        const sign = modulation >= 0 ? 1 : -1;
        const H = amplitudeH * Math.sin(phase) * sign;
        const y = curveY - H * 0.3;

        if (x === 0) {
          ctx.moveTo(padding + x, y);
        } else {
          ctx.lineTo(padding + x, y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Points de crête H
    ctx.fillStyle = COLORS.MAGNETIC_FIELD;
    const mainModulation = getTransverseModulation(mode, 0.5);
    const mainAmplitudeH = baseAmplitudeH * Math.abs(mainModulation);

    for (let i = 0; i < numWavelengths * 2 + 1; i++) {
      const peakPhase = Math.PI / 2 + i * Math.PI;
      const peakZ = (animationPhase - peakPhase) / beta;
      if (peakZ >= 0 && peakZ <= zLength) {
        const x = padding + (peakZ / zLength) * drawWidth;
        const H = mainAmplitudeH * Math.sin(animationPhase - beta * peakZ);
        const y = height / 2 - H * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  return { zLength, numWavelengths };
}

/**
 * Dessine les vecteurs de champ à intervalles réguliers
 * @param animationPhase - Phase d'animation en radians
 * @param mode - Mode de propagation
 *
 * Les vecteurs E sont verticaux (perpendiculaires à z)
 * Les vecteurs H seraient perpendiculaires à E et z (hors du plan)
 * On les représente par des cercles avec un point/croix pour indiquer la direction
 *
 * Pour les modes avec n > 0, les vecteurs sont modulés selon la position transversale
 */
function drawFieldVectors(
  dc: DrawContext,
  zLength: number,
  beta: number,
  animationPhase: number,
  showElectric: boolean,
  showMagnetic: boolean,
  mode: Mode
): void {
  const { ctx, padding, drawWidth, guideTop, guideBottom } = dc;
  const numVectors = 12;
  const maxArrowLength = 28;

  // Pour les modes avec n > 0, on dessine des vecteurs à plusieurs positions y
  const numRows = mode.n === 0 ? 1 : Math.min(mode.n + 1, 3);
  const yPositions: number[] = [];
  if (numRows === 1) {
    yPositions.push(0.5);
  } else {
    for (let i = 0; i < numRows; i++) {
      yPositions.push((i + 1) / (numRows + 1));
    }
  }

  for (let i = 0; i <= numVectors; i++) {
    const x = padding + (i / numVectors) * drawWidth;
    const z = (i / numVectors) * zLength;
    const phase = animationPhase - beta * z;
    const baseFieldValue = Math.sin(phase);

    for (const yNorm of yPositions) {
      const modulation = getTransverseModulation(mode, yNorm);
      const fieldValue = baseFieldValue * modulation;
      const curveY = guideTop + yNorm * (guideBottom - guideTop);

      // Vecteur E (vertical - dans le plan)
      if (showElectric) {
        const arrowLength = Math.abs(fieldValue) * maxArrowLength * (numRows === 1 ? 1 : 0.7);
        const arrowDir = fieldValue > 0 ? -1 : 1;

        if (Math.abs(fieldValue) > 0.08) {
          const alpha = 0.3 + Math.abs(fieldValue) * 0.7;
          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x, curveY);
          ctx.lineTo(x, curveY + arrowDir * arrowLength);
          ctx.stroke();

          // Pointe de flèche
          if (arrowLength > 6) {
            ctx.beginPath();
            ctx.moveTo(x, curveY + arrowDir * arrowLength);
            ctx.lineTo(x - 3, curveY + arrowDir * (arrowLength - 5));
            ctx.lineTo(x + 3, curveY + arrowDir * (arrowLength - 5));
            ctx.closePath();
            ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
            ctx.fill();
          }
        }
      }

      // Vecteur H (perpendiculaire au plan - représenté par cercle avec point/croix)
      // Seulement pour la position centrale si plusieurs rows
      if (showMagnetic && Math.abs(fieldValue) > 0.15 && (numRows === 1 || yNorm === 0.5 || Math.abs(yNorm - 0.5) < 0.2)) {
        const alpha = 0.3 + Math.abs(fieldValue) * 0.7;
        const radius = 4 + Math.abs(fieldValue) * 4;
        const yOffset = showElectric ? 25 : 0;

        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.lineWidth = 1.5;

        // Cercle
        ctx.beginPath();
        ctx.arc(x, curveY + yOffset, radius, 0, 2 * Math.PI);
        ctx.stroke();

        // Point (sortant) ou croix (entrant)
        if (fieldValue > 0) {
          ctx.beginPath();
          ctx.arc(x, curveY + yOffset, 2, 0, 2 * Math.PI);
          ctx.fill();
        } else {
          const crossSize = radius * 0.6;
          ctx.beginPath();
          ctx.moveTo(x - crossSize, curveY + yOffset - crossSize);
          ctx.lineTo(x + crossSize, curveY + yOffset + crossSize);
          ctx.moveTo(x + crossSize, curveY + yOffset - crossSize);
          ctx.lineTo(x - crossSize, curveY + yOffset + crossSize);
          ctx.stroke();
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
  let legendX = padding;

  if (showElectric) {
    // Ligne E
    ctx.strokeStyle = COLORS.ELECTRIC_FIELD;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 20, legendY);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('E (vertical)', legendX + 25, legendY + 4);
    legendX += 110;
  }

  if (showMagnetic) {
    // Ligne H pointillée
    ctx.strokeStyle = COLORS.MAGNETIC_FIELD;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 20, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('H (⊙ sortant, ⊗ entrant)', legendX + 25, legendY + 4);
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

      // Dessiner les ondes propagatives (dépend du mode)
      const { zLength, numWavelengths } = drawPropagatingWaves(
        dc,
        beta,
        animationPhase,
        showElectric,
        showMagnetic,
        mode
      );

      // Dessiner les vecteurs de champ (dépend du mode)
      drawFieldVectors(dc, zLength, beta, animationPhase, showElectric, showMagnetic, mode);

      // Dessiner les informations
      drawInfoAndLegend(dc, lambdaG, beta, mode, numWavelengths, showElectric, showMagnetic);
    },
    [options, mode, frequency, animationPhase, calculatedParams]
  );

  return { draw, calculatedParams };
}
