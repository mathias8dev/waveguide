/**
 * Constantes centralisées du simulateur de guides d'ondes
 *
 * Ce fichier regroupe toutes les constantes utilisées dans l'application
 * pour éviter les nombres magiques et faciliter la maintenance.
 */

// =============================================================================
// CONSTANTES PHYSIQUES
// Sources: CODATA 2018 (NIST)
// =============================================================================

/**
 * Vitesse de la lumière dans le vide (m/s)
 * Valeur exacte depuis 2019 (définition du mètre)
 */
export const SPEED_OF_LIGHT = 299792458;

/**
 * Perméabilité magnétique du vide (H/m)
 * μ₀ = 4π × 10⁻⁷ H/m
 */
export const MU_0 = 4 * Math.PI * 1e-7;

/**
 * Permittivité électrique du vide (F/m)
 * ε₀ = 1/(μ₀c²) ≈ 8.854187817 × 10⁻¹² F/m
 */
export const EPSILON_0 = 8.854187817e-12;

/**
 * Impédance caractéristique du vide (Ω)
 * η₀ = √(μ₀/ε₀) ≈ 376.730313668 Ω
 */
export const ETA_0 = 376.730313668;

/**
 * Objet regroupant les constantes physiques
 * @deprecated Utilisez les constantes individuelles à la place
 */
export const PHYSICS = {
  c: SPEED_OF_LIGHT,
  mu0: MU_0,
  eps0: EPSILON_0,
  eta0: ETA_0,
} as const;

// =============================================================================
// CONSTANTES NUMÉRIQUES
// Paramètres pour les algorithmes numériques
// =============================================================================

export const NUMERICAL = {
  /** Epsilon machine pour comparaisons flottantes */
  EPSILON: 1e-10,

  /** Tolérance pour Newton-Raphson */
  NEWTON_TOLERANCE: 1e-8,

  /** Nombre max d'itérations Newton-Raphson */
  NEWTON_MAX_ITER: 50,

  /** Petit nombre pour éviter division par zéro */
  SMALL_NUMBER: 1e-15,

  /** Seuil pour considérer une valeur comme zéro */
  ZERO_THRESHOLD: 1e-12,

  /** Nombre de termes série de Bessel */
  BESSEL_SERIES_TERMS: 100,

  /** Seuil pour approximation asymptotique de Bessel */
  BESSEL_ASYMPTOTIC_THRESHOLD: 20,
} as const;

// =============================================================================
// LIMITES DE SIMULATION
// Bornes physiques et pratiques
// =============================================================================

export const LIMITS = {
  /** Fréquence minimum (Hz) - 1 MHz */
  MIN_FREQUENCY: 1e6,

  /** Fréquence maximum (Hz) - 1 THz */
  MAX_FREQUENCY: 1e12,

  /** Dimension minimum (m) - 1 µm */
  MIN_DIMENSION: 1e-6,

  /** Dimension maximum (m) - 1 m */
  MAX_DIMENSION: 1,

  /** Ordre de mode maximum */
  MAX_MODE_ORDER: 10,

  /** Nombre de zéros de Bessel tabulés */
  MAX_BESSEL_ZEROS: 5,
} as const;

// =============================================================================
// CONSTANTES UI / CANVAS
// Paramètres d'affichage
// =============================================================================

export const UI = {
  /** Padding standard des canvas (px) */
  CANVAS_PADDING: 40,

  /** Padding du canvas de propagation (px) */
  PROPAGATION_PADDING: 50,

  /** Largeur par défaut des canvas 2D (px) */
  DEFAULT_CANVAS_WIDTH: 400,

  /** Hauteur par défaut des canvas 2D (px) */
  DEFAULT_CANVAS_HEIGHT: 400,

  /** Largeur canvas propagation (px) */
  PROPAGATION_CANVAS_WIDTH: 600,

  /** Hauteur canvas propagation (px) */
  PROPAGATION_CANVAS_HEIGHT: 300,

  /** Résolution grille champs 2D */
  FIELD_RESOLUTION_2D: 25,

  /** Résolution color map */
  COLORMAP_RESOLUTION: 50,

  /** Résolution vecteurs 3D */
  FIELD_RESOLUTION_3D: 8,

  /** FPS cible animation */
  TARGET_FPS: 30,

  /** Intervalle animation (ms) */
  ANIMATION_INTERVAL: 1000 / 30,
} as const;

// =============================================================================
// COULEURS
// Palette de couleurs pour visualisation
// =============================================================================

export const COLORS = {
  /** Couleur champ E */
  ELECTRIC_FIELD: '#e74c3c',

  /** Couleur champ H */
  MAGNETIC_FIELD: '#3498db',

  /** Couleur guide d'onde */
  WAVEGUIDE: '#2c3e50',

  /** Couleur conducteur */
  CONDUCTOR: '#7f8c8d',

  /** Couleur grille */
  GRID: '#ecf0f1',

  /** Couleur texte */
  TEXT: '#2c3e50',

  /** Couleur texte secondaire */
  TEXT_SECONDARY: '#7f8c8d',

  /** Couleur fond */
  BACKGROUND: '#ffffff',

  /** Couleur mode propagatif */
  PROPAGATING: '#27ae60',

  /** Couleur mode évanescent */
  EVANESCENT: '#e74c3c',
} as const;

// =============================================================================
// GUIDES D'ONDES STANDARDS
// Dimensions normalisées (m)
// =============================================================================

export const STANDARD_WAVEGUIDES = {
  /** WR-90: X-band (8.2-12.4 GHz) */
  WR90: { a: 0.02286, b: 0.01016 },

  /** WR-75: X-band (10-15 GHz) */
  WR75: { a: 0.01905, b: 0.00953 },

  /** WR-62: Ku-band (12.4-18 GHz) */
  WR62: { a: 0.01580, b: 0.00790 },

  /** WR-42: K-band (18-26.5 GHz) */
  WR42: { a: 0.01067, b: 0.00432 },

  /** Câble coaxial 50Ω typique */
  COAX_50OHM: { innerRadius: 0.00091, outerRadius: 0.0021 },

  /** Câble coaxial 75Ω typique */
  COAX_75OHM: { innerRadius: 0.00058, outerRadius: 0.0021 },
} as const;
