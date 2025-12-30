/**
 * Utilitaires de dessin Canvas 2D
 *
 * Fonctions réutilisables pour le rendu des visualisations.
 */

import { COLORS, UI } from '../constants';

// =============================================================================
// TYPES
// =============================================================================

export interface DrawOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  padding?: number;
}

export interface GridOptions extends DrawOptions {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  xLabel?: string;
  yLabel?: string;
  xTicks?: number;
  yTicks?: number;
  color?: string;
}

export interface VectorOptions {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color?: string;
  scale?: number;
  headSize?: number;
}

export interface LegendItem {
  label: string;
  color: string;
}

// =============================================================================
// FONCTIONS DE BASE
// =============================================================================

/**
 * Efface le canvas avec une couleur de fond
 * @param ctx - Contexte de rendu
 * @param width - Largeur du canvas
 * @param height - Hauteur du canvas
 * @param backgroundColor - Couleur de fond (défaut: blanc)
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundColor = COLORS.BACKGROUND
): void {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Configure le contexte pour le dessin haute résolution (HiDPI)
 * @param canvas - Élément canvas
 * @param width - Largeur logique
 * @param height - Hauteur logique
 * @returns Contexte configuré
 */
export function setupHiDPICanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  return ctx;
}

// =============================================================================
// GRILLE ET AXES
// =============================================================================

/**
 * Dessine une grille avec axes et labels
 */
export function drawGrid(options: GridOptions): void {
  const {
    ctx,
    width,
    height,
    padding = UI.CANVAS_PADDING,
    xMin,
    xMax,
    yMin,
    yMax,
    xLabel = '',
    yLabel = '',
    xTicks = 5,
    yTicks = 5,
    color = COLORS.GRID,
  } = options;

  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  // Lignes verticales
  for (let i = 0; i <= xTicks; i++) {
    const x = padding + (i / xTicks) * plotWidth;
    ctx.beginPath();
    ctx.moveTo(x, padding);
    ctx.lineTo(x, height - padding);
    ctx.stroke();
  }

  // Lignes horizontales
  for (let i = 0; i <= yTicks; i++) {
    const y = padding + (i / yTicks) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = COLORS.TEXT;
  ctx.lineWidth = 1;

  // Axe X
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Axe Y
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  // Labels des ticks
  ctx.fillStyle = COLORS.TEXT_SECONDARY;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';

  // Ticks X
  for (let i = 0; i <= xTicks; i++) {
    const x = padding + (i / xTicks) * plotWidth;
    const value = xMin + (i / xTicks) * (xMax - xMin);
    ctx.fillText(value.toFixed(1), x, height - padding + 15);
  }

  // Ticks Y
  ctx.textAlign = 'right';
  for (let i = 0; i <= yTicks; i++) {
    const y = height - padding - (i / yTicks) * plotHeight;
    const value = yMin + (i / yTicks) * (yMax - yMin);
    ctx.fillText(value.toFixed(1), padding - 5, y + 3);
  }

  // Labels des axes
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = '12px sans-serif';

  if (xLabel) {
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, width / 2, height - 5);
  }

  if (yLabel) {
    ctx.save();
    ctx.translate(12, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
}

// =============================================================================
// FORMES DE GUIDES D'ONDES
// =============================================================================

/**
 * Dessine le contour d'un guide rectangulaire
 * @param ctx - Contexte de rendu
 * @param centerX - Centre X
 * @param centerY - Centre Y
 * @param scaleX - Échelle X (pixels par mètre)
 * @param scaleY - Échelle Y (pixels par mètre)
 * @param a - Largeur du guide (m)
 * @param b - Hauteur du guide (m)
 */
export function drawRectangularGuide(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  scaleX: number,
  scaleY: number,
  a: number,
  b: number
): void {
  const w = a * scaleX;
  const h = b * scaleY;

  ctx.strokeStyle = COLORS.WAVEGUIDE;
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - w / 2, centerY - h / 2, w, h);
}

/**
 * Dessine le contour d'un guide circulaire
 * @param ctx - Contexte de rendu
 * @param centerX - Centre X
 * @param centerY - Centre Y
 * @param scale - Échelle (pixels par mètre)
 * @param radius - Rayon du guide (m)
 */
export function drawCircularGuide(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  scale: number,
  radius: number
): void {
  const r = radius * scale;

  ctx.strokeStyle = COLORS.WAVEGUIDE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
  ctx.stroke();
}

/**
 * Dessine le contour d'un guide coaxial
 * @param ctx - Contexte de rendu
 * @param centerX - Centre X
 * @param centerY - Centre Y
 * @param scale - Échelle (pixels par mètre)
 * @param innerRadius - Rayon interne (m)
 * @param outerRadius - Rayon externe (m)
 */
export function drawCoaxialGuide(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  scale: number,
  innerRadius: number,
  outerRadius: number
): void {
  const rInner = innerRadius * scale;
  const rOuter = outerRadius * scale;

  // Conducteur externe
  ctx.strokeStyle = COLORS.WAVEGUIDE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rOuter, 0, 2 * Math.PI);
  ctx.stroke();

  // Conducteur interne (rempli)
  ctx.fillStyle = COLORS.CONDUCTOR;
  ctx.beginPath();
  ctx.arc(centerX, centerY, rInner, 0, 2 * Math.PI);
  ctx.fill();
}

// =============================================================================
// VECTEURS
// =============================================================================

/**
 * Dessine un vecteur (flèche) à une position donnée
 */
export function drawVector(options: VectorOptions): void {
  const {
    ctx,
    x,
    y,
    dx,
    dy,
    color = COLORS.ELECTRIC_FIELD,
    scale = 1,
    headSize = 5,
  } = options;

  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag < 0.001) return;

  const endX = x + dx * scale;
  const endY = y + dy * scale;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  // Corps du vecteur
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Tête de flèche
  const angle = Math.atan2(dy, dx);
  const headAngle = Math.PI / 6;

  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headSize * Math.cos(angle - headAngle),
    endY - headSize * Math.sin(angle - headAngle)
  );
  ctx.lineTo(
    endX - headSize * Math.cos(angle + headAngle),
    endY - headSize * Math.sin(angle + headAngle)
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Dessine un cercle représentant un vecteur perpendiculaire au plan
 * @param ctx - Contexte de rendu
 * @param x - Position X
 * @param y - Position Y
 * @param value - Valeur (positive = vers l'avant, négative = vers l'arrière)
 * @param maxValue - Valeur maximum pour normalisation
 * @param color - Couleur
 * @param maxRadius - Rayon maximum
 */
export function drawPerpendicularVector(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  maxValue: number,
  color: string,
  maxRadius = 8
): void {
  if (Math.abs(value) < 0.001 * maxValue) return;

  const radius = Math.min(maxRadius, (Math.abs(value) / maxValue) * maxRadius);
  const isOutward = value > 0;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.stroke();

  if (isOutward) {
    // Point central (vecteur sortant)
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fill();
  } else {
    // Croix (vecteur entrant)
    const crossSize = radius * 0.7;
    ctx.beginPath();
    ctx.moveTo(x - crossSize, y - crossSize);
    ctx.lineTo(x + crossSize, y + crossSize);
    ctx.moveTo(x + crossSize, y - crossSize);
    ctx.lineTo(x - crossSize, y + crossSize);
    ctx.stroke();
  }
}

// =============================================================================
// LÉGENDE
// =============================================================================

/**
 * Dessine une légende
 * @param ctx - Contexte de rendu
 * @param x - Position X
 * @param y - Position Y
 * @param items - Éléments de la légende
 */
export function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  items: LegendItem[]
): void {
  const lineHeight = 18;
  const boxSize = 12;
  const gap = 5;

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  items.forEach((item, index) => {
    const itemY = y + index * lineHeight;

    // Boîte de couleur
    ctx.fillStyle = item.color;
    ctx.fillRect(x, itemY - boxSize / 2, boxSize, boxSize);

    // Label
    ctx.fillStyle = COLORS.TEXT;
    ctx.fillText(item.label, x + boxSize + gap, itemY);
  });
}

// =============================================================================
// BARRE DE COULEUR
// =============================================================================

/**
 * Dessine une barre de couleur (colorbar)
 * @param ctx - Contexte de rendu
 * @param x - Position X
 * @param y - Position Y
 * @param width - Largeur
 * @param height - Hauteur
 * @param minValue - Valeur minimum
 * @param maxValue - Valeur maximum
 * @param colorMap - Fonction de mapping couleur (t: 0-1 -> couleur)
 * @param label - Label optionnel
 */
export function drawColorbar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  minValue: number,
  maxValue: number,
  colorMap: (t: number) => string,
  label?: string
): void {
  // Gradient
  for (let i = 0; i < height; i++) {
    const t = 1 - i / height; // Inverser pour que max soit en haut
    ctx.fillStyle = colorMap(t);
    ctx.fillRect(x, y + i, width, 1);
  }

  // Bordure
  ctx.strokeStyle = COLORS.TEXT;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Ticks et valeurs
  ctx.fillStyle = COLORS.TEXT;
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const ticks = 5;
  for (let i = 0; i <= ticks; i++) {
    const tickY = y + (i / ticks) * height;
    const value = maxValue - (i / ticks) * (maxValue - minValue);

    ctx.beginPath();
    ctx.moveTo(x + width, tickY);
    ctx.lineTo(x + width + 3, tickY);
    ctx.stroke();

    ctx.fillText(value.toFixed(2), x + width + 5, tickY);
  }

  // Label
  if (label) {
    ctx.save();
    ctx.translate(x + width + 35, y + height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
}

// =============================================================================
// FONCTIONS DE MAPPING COULEUR
// =============================================================================

/**
 * Colormap "jet" (bleu -> cyan -> vert -> jaune -> rouge)
 * @param t - Valeur normalisée [0, 1]
 * @returns Couleur CSS
 */
export function colormapJet(t: number): string {
  const r = Math.min(255, Math.max(0, Math.round(255 * (1.5 - Math.abs(t - 0.75) * 4))));
  const g = Math.min(255, Math.max(0, Math.round(255 * (1.5 - Math.abs(t - 0.5) * 4))));
  const b = Math.min(255, Math.max(0, Math.round(255 * (1.5 - Math.abs(t - 0.25) * 4))));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Colormap "viridis" (approximation)
 * @param t - Valeur normalisée [0, 1]
 * @returns Couleur CSS
 */
export function colormapViridis(t: number): string {
  // Approximation linéaire de viridis
  const r = Math.round(68 + t * 187);
  const g = Math.round(1 + t * 180 * (1 - t * 0.3));
  const b = Math.round(84 + t * 50 - t * t * 120);
  return `rgb(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.max(0, b)})`;
}

/**
 * Colormap divergent (bleu -> blanc -> rouge)
 * @param t - Valeur normalisée [0, 1], 0.5 = neutre
 * @returns Couleur CSS
 */
export function colormapDivergent(t: number): string {
  if (t < 0.5) {
    const s = t * 2;
    return `rgb(${Math.round(s * 255)}, ${Math.round(s * 255)}, 255)`;
  } else {
    const s = (1 - t) * 2;
    return `rgb(255, ${Math.round(s * 255)}, ${Math.round(s * 255)})`;
  }
}
