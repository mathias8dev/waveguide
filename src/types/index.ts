// Types pour le simulateur de guides d'ondes

export type WaveguideType = 'rectangular' | 'circular' | 'coaxial';

export type ModeType = 'TE' | 'TM' | 'TEM' | 'HE' | 'EH';

export interface Mode {
  type: ModeType;
  m: number;
  n: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface ComplexNumber {
  real: number;
  imag: number;
}

export interface FieldVector {
  E: Vector3D;  // Champ électrique
  H: Vector3D;  // Champ magnétique
}

export interface WaveguideParams {
  type: WaveguideType;
}

export interface RectangularParams extends WaveguideParams {
  type: 'rectangular';
  a: number;  // Largeur (m)
  b: number;  // Hauteur (m)
}

export interface CircularParams extends WaveguideParams {
  type: 'circular';
  radius: number;  // Rayon (m)
}

export interface CoaxialParams extends WaveguideParams {
  type: 'coaxial';
  innerRadius: number;  // Rayon interne (m)
  outerRadius: number;  // Rayon externe (m)
}

export type AnyWaveguideParams = RectangularParams | CircularParams | CoaxialParams;

export interface SimulationState {
  waveguide: AnyWaveguideParams;
  mode: Mode;
  frequency: number;  // Fréquence (Hz)
  time: number;       // Temps (s)
  isAnimating: boolean;
}

export interface CalculatedParams {
  cutoffFrequency: number;     // fc (Hz)
  cutoffWavelength: number;    // λc (m)
  propagationConstant: number; // β (rad/m)
  phaseVelocity: number;       // vp (m/s)
  groupVelocity: number;       // vg (m/s)
  wavelengthGuide: number;     // λg (m)
  impedance: number;           // Z (Ω)
  isPropagatif: boolean;       // true si f > fc
}

// Constantes physiques
export const CONSTANTS = {
  c: 299792458,           // Vitesse de la lumière (m/s)
  mu0: 4 * Math.PI * 1e-7, // Perméabilité du vide (H/m)
  eps0: 8.854187817e-12,   // Permittivité du vide (F/m)
  eta0: 376.730313668,     // Impédance du vide (Ω)
} as const;
