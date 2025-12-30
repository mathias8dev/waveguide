/**
 * Utilitaires mathématiques
 *
 * Fonctions mathématiques communes utilisées dans le simulateur.
 */

import { NUMERICAL } from '../constants';

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Vérifie si une valeur est un nombre valide (fini, non-NaN)
 * @param value - Valeur à vérifier
 * @returns true si la valeur est un nombre valide
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value) && !isNaN(value);
}

/**
 * Vérifie si une valeur est un nombre positif valide
 * @param value - Valeur à vérifier
 * @returns true si la valeur est un nombre positif valide
 */
export function isValidPositiveNumber(value: unknown): value is number {
  return isValidNumber(value) && value > 0;
}

/**
 * Vérifie si une valeur est proche de zéro
 * @param value - Valeur à vérifier
 * @param threshold - Seuil (défaut: NUMERICAL.ZERO_THRESHOLD)
 * @returns true si |value| < threshold
 */
export function isNearZero(value: number, threshold = NUMERICAL.ZERO_THRESHOLD): boolean {
  return Math.abs(value) < threshold;
}

// =============================================================================
// INTERPOLATION ET BORNES
// =============================================================================

/**
 * Limite une valeur entre un minimum et un maximum
 * @param value - Valeur à limiter
 * @param min - Borne inférieure
 * @param max - Borne supérieure
 * @returns Valeur limitée
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Interpolation linéaire entre deux valeurs
 * @param a - Valeur de départ
 * @param b - Valeur d'arrivée
 * @param t - Paramètre d'interpolation [0, 1]
 * @returns Valeur interpolée
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Mappe une valeur d'un intervalle à un autre
 * @param value - Valeur à mapper
 * @param inMin - Minimum de l'intervalle d'entrée
 * @param inMax - Maximum de l'intervalle d'entrée
 * @param outMin - Minimum de l'intervalle de sortie
 * @param outMax - Maximum de l'intervalle de sortie
 * @returns Valeur mappée
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = (value - inMin) / (inMax - inMin);
  return lerp(outMin, outMax, t);
}

/**
 * Normalise une valeur dans un intervalle [0, 1]
 * @param value - Valeur à normaliser
 * @param min - Minimum de l'intervalle
 * @param max - Maximum de l'intervalle
 * @returns Valeur normalisée
 */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

// =============================================================================
// FONCTIONS MATHÉMATIQUES
// =============================================================================

/** Cache pour les factorielles calculées */
const factorialCache: Map<number, number> = new Map([
  [0, 1],
  [1, 1],
]);

/**
 * Calcule la factorielle d'un entier (avec cache)
 * @param n - Entier non négatif
 * @returns n!
 * @throws Error si n < 0 ou n n'est pas entier
 */
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error(`factorial: n doit être un entier >= 0, reçu: ${n}`);
  }

  if (factorialCache.has(n)) {
    return factorialCache.get(n)!;
  }

  // Calcul itératif pour éviter stack overflow
  let result = factorialCache.get(factorialCache.size - 1)!;
  for (let i = factorialCache.size; i <= n; i++) {
    result *= i;
    factorialCache.set(i, result);
  }

  return result;
}

/**
 * Calcule le coefficient binomial C(n, k)
 * @param n - Entier non négatif
 * @param k - Entier non négatif <= n
 * @returns n! / (k! * (n-k)!)
 */
export function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;

  // Optimisation pour grands n
  if (k > n - k) {
    k = n - k;
  }

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/**
 * Approximation de la fonction Gamma pour les entiers positifs
 * Γ(n) = (n-1)! pour n entier positif
 * Pour les non-entiers, utilise l'approximation de Stirling
 * @param n - Nombre réel > 0
 * @returns Γ(n)
 */
export function gamma(n: number): number {
  if (n <= 0) {
    throw new Error(`gamma: n doit être > 0, reçu: ${n}`);
  }

  // Cas entier: Γ(n) = (n-1)!
  if (Number.isInteger(n) && n <= 170) {
    return factorial(n - 1);
  }

  // Approximation de Lanczos pour non-entiers
  // Coefficients de Lanczos (g=7)
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  let x = n;
  if (x < 0.5) {
    // Réflexion: Γ(1-x)Γ(x) = π/sin(πx)
    return Math.PI / (Math.sin(Math.PI * x) * gamma(1 - x));
  }

  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < c.length; i++) {
    a += c[i] / (x + i);
  }

  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}

// =============================================================================
// TRIGONOMÉTRIE ET COORDONNÉES
// =============================================================================

/**
 * Convertit des degrés en radians
 * @param degrees - Angle en degrés
 * @returns Angle en radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convertit des radians en degrés
 * @param radians - Angle en radians
 * @returns Angle en degrés
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Convertit des coordonnées cartésiennes en polaires
 * @param x - Coordonnée x
 * @param y - Coordonnée y
 * @returns {r, theta} où r >= 0 et theta dans [-π, π]
 */
export function cartesianToPolar(x: number, y: number): { r: number; theta: number } {
  return {
    r: Math.sqrt(x * x + y * y),
    theta: Math.atan2(y, x),
  };
}

/**
 * Convertit des coordonnées polaires en cartésiennes
 * @param r - Rayon
 * @param theta - Angle (radians)
 * @returns {x, y}
 */
export function polarToCartesian(r: number, theta: number): { x: number; y: number } {
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta),
  };
}

// =============================================================================
// FORMATAGE
// =============================================================================

/**
 * Formate un nombre avec notation ingénieur (puissances de 10³)
 * @param value - Valeur à formater
 * @param precision - Nombre de décimales (défaut: 3)
 * @returns Chaîne formatée avec suffixe SI
 */
export function formatEngineering(value: number, precision = 3): string {
  if (value === 0) return '0';
  if (!isValidNumber(value)) return 'N/A';

  const suffixes = ['', 'k', 'M', 'G', 'T', 'P'];
  const suffixesNeg = ['', 'm', 'µ', 'n', 'p', 'f'];

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1) {
    let idx = 0;
    let scaled = absValue;
    while (scaled >= 1000 && idx < suffixes.length - 1) {
      scaled /= 1000;
      idx++;
    }
    return `${sign}${scaled.toFixed(precision)}${suffixes[idx]}`;
  } else {
    let idx = 0;
    let scaled = absValue;
    while (scaled < 1 && idx < suffixesNeg.length - 1) {
      scaled *= 1000;
      idx++;
    }
    return `${sign}${scaled.toFixed(precision)}${suffixesNeg[idx]}`;
  }
}

/**
 * Formate une fréquence avec unité appropriée
 * @param frequency - Fréquence en Hz
 * @param precision - Nombre de décimales
 * @returns Chaîne formatée (ex: "10.5 GHz")
 */
export function formatFrequency(frequency: number, precision = 2): string {
  if (frequency >= 1e12) {
    return `${(frequency / 1e12).toFixed(precision)} THz`;
  } else if (frequency >= 1e9) {
    return `${(frequency / 1e9).toFixed(precision)} GHz`;
  } else if (frequency >= 1e6) {
    return `${(frequency / 1e6).toFixed(precision)} MHz`;
  } else if (frequency >= 1e3) {
    return `${(frequency / 1e3).toFixed(precision)} kHz`;
  }
  return `${frequency.toFixed(precision)} Hz`;
}
