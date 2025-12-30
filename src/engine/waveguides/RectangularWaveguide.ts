import { Waveguide } from '../core/Waveguide';
import { Mode, FieldVector, CONSTANTS, RectangularParams } from '@/types';

/**
 * Guide d'onde rectangulaire
 * Supporte les modes TE et TM
 */
export class RectangularWaveguide extends Waveguide {
  readonly a: number; // Largeur (dimension grande)
  readonly b: number; // Hauteur (dimension petite)

  constructor(params: Omit<RectangularParams, 'type'>) {
    super();
    // Par convention, a >= b
    this.a = Math.max(params.a, params.b);
    this.b = Math.min(params.a, params.b);
  }

  getCutoffFrequency(mode: Mode): number {
    const kc = this.getCutoffWavenumber(mode);
    return (CONSTANTS.c * kc) / (2 * Math.PI);
  }

  getCutoffWavenumber(mode: Mode): number {
    const { m, n } = mode;
    // kc = √((mπ/a)² + (nπ/b)²)
    return Math.sqrt(
      Math.pow((m * Math.PI) / this.a, 2) +
      Math.pow((n * Math.PI) / this.b, 2)
    );
  }

  isModeSupported(mode: Mode): boolean {
    const { type, m, n } = mode;

    if (type === 'TE') {
      // TE: m et n >= 0, mais pas les deux à 0
      return m >= 0 && n >= 0 && !(m === 0 && n === 0);
    }

    if (type === 'TM') {
      // TM: m et n >= 1
      return m >= 1 && n >= 1;
    }

    // TEM et modes hybrides non supportés
    return false;
  }

  getAvailableModes(): Mode[] {
    const modes: Mode[] = [];

    // Modes TE
    for (let m = 0; m <= 3; m++) {
      for (let n = 0; n <= 3; n++) {
        if (m === 0 && n === 0) continue;
        modes.push({ type: 'TE', m, n });
      }
    }

    // Modes TM
    for (let m = 1; m <= 3; m++) {
      for (let n = 1; n <= 3; n++) {
        modes.push({ type: 'TM', m, n });
      }
    }

    // Trier par fréquence de coupure
    return modes.sort((a, b) =>
      this.getCutoffFrequency(a) - this.getCutoffFrequency(b)
    );
  }

  getFieldDistribution(
    x: number,
    y: number,
    z: number,
    mode: Mode,
    frequency: number,
    time: number
  ): FieldVector {
    const { type, m, n } = mode;
    const params = this.getCalculatedParams(frequency, mode);

    // Décalage pour centrer le guide (x, y de -a/2 à a/2 et -b/2 à b/2)
    const xLocal = x + this.a / 2;
    const yLocal = y + this.b / 2;

    // Vérifier si on est dans le guide
    if (xLocal < 0 || xLocal > this.a || yLocal < 0 || yLocal > this.b) {
      return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
    }

    const kc = this.getCutoffWavenumber(mode);
    const beta = params.propagationConstant;
    const omega = 2 * Math.PI * frequency;

    // Facteur de phase temporelle et spatiale
    const phaseFactor = Math.cos(omega * time - beta * z);
    const phaseFactorSin = Math.sin(omega * time - beta * z);

    if (type === 'TE') {
      return this.getTEFieldDistribution(
        xLocal, yLocal, m, n, kc, beta, omega, phaseFactor, phaseFactorSin
      );
    } else if (type === 'TM') {
      return this.getTMFieldDistribution(
        xLocal, yLocal, m, n, kc, beta, omega, phaseFactor, phaseFactorSin
      );
    }

    return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
  }

  private getTEFieldDistribution(
    x: number,
    y: number,
    m: number,
    n: number,
    kc: number,
    beta: number,
    omega: number,
    phaseFactor: number,
    _phaseFactorSin: number
  ): FieldVector {
    const kx = (m * Math.PI) / this.a;
    const ky = (n * Math.PI) / this.b;

    // Hz = H0 * cos(kx*x) * cos(ky*y) * cos(ωt - βz)
    const Hz = Math.cos(kx * x) * Math.cos(ky * y) * phaseFactor;

    // Composantes transverses (normalisées)
    const factor = 1 / (kc * kc);

    // Ex = (jωμ/kc²) * ky * cos(kx*x) * sin(ky*y)
    const Ex = factor * omega * CONSTANTS.mu0 * ky *
               Math.cos(kx * x) * Math.sin(ky * y) * phaseFactor;

    // Ey = -(jωμ/kc²) * kx * sin(kx*x) * cos(ky*y)
    const Ey = -factor * omega * CONSTANTS.mu0 * kx *
               Math.sin(kx * x) * Math.cos(ky * y) * phaseFactor;

    // Hx = (jβ/kc²) * kx * sin(kx*x) * cos(ky*y)
    const Hx = factor * beta * kx *
               Math.sin(kx * x) * Math.cos(ky * y) * phaseFactor;

    // Hy = (jβ/kc²) * ky * cos(kx*x) * sin(ky*y)
    const Hy = factor * beta * ky *
               Math.cos(kx * x) * Math.sin(ky * y) * phaseFactor;

    // Normalisation pour la visualisation
    const norm = 1e-6;

    return {
      E: { x: Ex * norm, y: Ey * norm, z: 0 },
      H: { x: Hx * norm, y: Hy * norm, z: Hz * norm },
    };
  }

  private getTMFieldDistribution(
    x: number,
    y: number,
    m: number,
    n: number,
    kc: number,
    beta: number,
    omega: number,
    phaseFactor: number,
    _phaseFactorSin: number
  ): FieldVector {
    const kx = (m * Math.PI) / this.a;
    const ky = (n * Math.PI) / this.b;

    // Ez = E0 * sin(kx*x) * sin(ky*y) * cos(ωt - βz)
    const Ez = Math.sin(kx * x) * Math.sin(ky * y) * phaseFactor;

    const factor = 1 / (kc * kc);

    // Ex = -(jβ/kc²) * kx * cos(kx*x) * sin(ky*y)
    const Ex = -factor * beta * kx *
               Math.cos(kx * x) * Math.sin(ky * y) * phaseFactor;

    // Ey = -(jβ/kc²) * ky * sin(kx*x) * cos(ky*y)
    const Ey = -factor * beta * ky *
               Math.sin(kx * x) * Math.cos(ky * y) * phaseFactor;

    // Hx = (jωε/kc²) * ky * sin(kx*x) * cos(ky*y)
    const Hx = factor * omega * CONSTANTS.eps0 * ky *
               Math.sin(kx * x) * Math.cos(ky * y) * phaseFactor;

    // Hy = -(jωε/kc²) * kx * cos(kx*x) * sin(ky*y)
    const Hy = -factor * omega * CONSTANTS.eps0 * kx *
               Math.cos(kx * x) * Math.sin(ky * y) * phaseFactor;

    const norm = 1e-6;

    return {
      E: { x: Ex * norm, y: Ey * norm, z: Ez * norm },
      H: { x: Hx * norm, y: Hy * norm, z: 0 },
    };
  }
}
