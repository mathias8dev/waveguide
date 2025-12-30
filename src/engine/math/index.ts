export * from './bessel';

/**
 * Utilitaires mathématiques pour les calculs EM
 */

/**
 * Conversion degrés vers radians
 */
export function degToRad(degrees: number): number {
  return degrees * Math.PI / 180;
}

/**
 * Conversion radians vers degrés
 */
export function radToDeg(radians: number): number {
  return radians * 180 / Math.PI;
}

/**
 * Magnitude d'un vecteur 3D
 */
export function magnitude(x: number, y: number, z: number = 0): number {
  return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Normalise un vecteur
 */
export function normalize(x: number, y: number, z: number = 0): { x: number; y: number; z: number } {
  const mag = magnitude(x, y, z);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: x / mag, y: y / mag, z: z / mag };
}

/**
 * Produit scalaire de deux vecteurs 3D
 */
export function dot(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Produit vectoriel de deux vecteurs 3D
 */
export function cross(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number }
): { x: number; y: number; z: number } {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Interpolation linéaire
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp une valeur entre min et max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map une valeur d'un intervalle à un autre
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}
