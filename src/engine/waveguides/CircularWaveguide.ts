import { Waveguide } from '../core/Waveguide';
import { Mode, FieldVector, CONSTANTS, CircularParams } from '@/types';
import { besselJ, besselJPrime, getBesselJZero, getBesselJPrimeZero } from '../math/bessel';

/**
 * Guide d'onde circulaire
 * Supporte les modes TE, TM et hybrides (HE, EH)
 */
export class CircularWaveguide extends Waveguide {
  readonly radius: number;

  constructor(params: Omit<CircularParams, 'type'>) {
    super();
    this.radius = params.radius;
  }

  getCutoffFrequency(mode: Mode): number {
    const kc = this.getCutoffWavenumber(mode);
    return (CONSTANTS.c * kc) / (2 * Math.PI);
  }

  getCutoffWavenumber(mode: Mode): number {
    const { type, m, n } = mode;

    // n est l'ordre azimutal, m est l'ordre radial (p dans certaines notations)
    if (type === 'TE') {
      // kc = χ'nm / a où χ'nm est la m-ième racine de J'n(x) = 0
      const chi = getBesselJPrimeZero(n, m);
      return chi / this.radius;
    }

    if (type === 'TM') {
      // kc = χnm / a où χnm est la m-ième racine de Jn(x) = 0
      const chi = getBesselJZero(n, m);
      return chi / this.radius;
    }

    if (type === 'HE' || type === 'EH') {
      // Modes hybrides - approximation simplifiée
      // En réalité, ces modes dépendent du rapport εr
      const chi = getBesselJZero(n, m);
      return chi / this.radius;
    }

    return 0;
  }

  isModeSupported(mode: Mode): boolean {
    const { type, m, n } = mode;

    if (type === 'TE' || type === 'TM') {
      return n >= 0 && m >= 1;
    }

    if (type === 'HE' || type === 'EH') {
      return n >= 1 && m >= 1;
    }

    return false;
  }

  getAvailableModes(): Mode[] {
    const modes: Mode[] = [];

    // Modes TE
    for (let n = 0; n <= 3; n++) {
      for (let m = 1; m <= 3; m++) {
        modes.push({ type: 'TE', m, n });
      }
    }

    // Modes TM
    for (let n = 0; n <= 3; n++) {
      for (let m = 1; m <= 3; m++) {
        modes.push({ type: 'TM', m, n });
      }
    }

    // Modes hybrides
    for (let n = 1; n <= 2; n++) {
      for (let m = 1; m <= 2; m++) {
        modes.push({ type: 'HE', m, n });
        modes.push({ type: 'EH', m, n });
      }
    }

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

    // Conversion en coordonnées cylindriques
    const rho = Math.sqrt(x * x + y * y);
    const phi = Math.atan2(y, x);

    // Vérifier si on est dans le guide
    if (rho > this.radius) {
      return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
    }

    const kc = this.getCutoffWavenumber(mode);
    const beta = params.propagationConstant;
    const omega = 2 * Math.PI * frequency;

    const phaseFactor = Math.cos(omega * time - beta * z);

    if (type === 'TE') {
      return this.getTEFieldDistribution(
        rho, phi, x, y, n, m, kc, beta, omega, phaseFactor
      );
    } else if (type === 'TM') {
      return this.getTMFieldDistribution(
        rho, phi, x, y, n, m, kc, beta, omega, phaseFactor
      );
    } else if (type === 'HE' || type === 'EH') {
      return this.getHybridFieldDistribution(
        rho, phi, x, y, n, m, kc, beta, omega, phaseFactor, type
      );
    }

    return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
  }

  private getTEFieldDistribution(
    rho: number,
    phi: number,
    x: number,
    y: number,
    n: number,
    p: number,
    kc: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const chi = getBesselJPrimeZero(n, p);
    const kcRho = kc * rho;

    // Hz = Jn(kc*ρ) * cos(n*φ) * cos(ωt - βz)
    const Hz = besselJ(n, kcRho) * Math.cos(n * phi) * phaseFactor;

    const factor = 1 / (kc * kc);

    // Composantes en coordonnées cylindriques
    // Eρ = (jωμ/kc²) * (n/ρ) * Jn(kc*ρ) * sin(n*φ)
    const Erho = rho > 0 ?
      factor * omega * CONSTANTS.mu0 * (n / rho) *
      besselJ(n, kcRho) * Math.sin(n * phi) * phaseFactor : 0;

    // Eφ = -(jωμ/kc) * J'n(kc*ρ) * cos(n*φ)
    const Ephi = -factor * omega * CONSTANTS.mu0 * kc *
      besselJPrime(n, kcRho) * Math.cos(n * phi) * phaseFactor;

    // Hρ = (jβ/kc) * J'n(kc*ρ) * cos(n*φ)
    const Hrho = factor * beta * kc *
      besselJPrime(n, kcRho) * Math.cos(n * phi) * phaseFactor;

    // Hφ = -(jβ/kc²) * (n/ρ) * Jn(kc*ρ) * sin(n*φ)
    const Hphi = rho > 0 ?
      -factor * beta * (n / rho) *
      besselJ(n, kcRho) * Math.sin(n * phi) * phaseFactor : 0;

    // Conversion en coordonnées cartésiennes
    const cosPhi = rho > 0 ? x / rho : 1;
    const sinPhi = rho > 0 ? y / rho : 0;

    const norm = 1 / chi;

    return {
      E: {
        x: (Erho * cosPhi - Ephi * sinPhi) * norm,
        y: (Erho * sinPhi + Ephi * cosPhi) * norm,
        z: 0,
      },
      H: {
        x: (Hrho * cosPhi - Hphi * sinPhi) * norm,
        y: (Hrho * sinPhi + Hphi * cosPhi) * norm,
        z: Hz * norm,
      },
    };
  }

  private getTMFieldDistribution(
    rho: number,
    phi: number,
    x: number,
    y: number,
    n: number,
    p: number,
    kc: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const chi = getBesselJZero(n, p);
    const kcRho = kc * rho;

    // Ez = Jn(kc*ρ) * cos(n*φ) * cos(ωt - βz)
    const Ez = besselJ(n, kcRho) * Math.cos(n * phi) * phaseFactor;

    const factor = 1 / (kc * kc);

    // Eρ = -(jβ/kc) * J'n(kc*ρ) * cos(n*φ)
    const Erho = -factor * beta * kc *
      besselJPrime(n, kcRho) * Math.cos(n * phi) * phaseFactor;

    // Eφ = (jβ/kc²) * (n/ρ) * Jn(kc*ρ) * sin(n*φ)
    const Ephi = rho > 0 ?
      factor * beta * (n / rho) *
      besselJ(n, kcRho) * Math.sin(n * phi) * phaseFactor : 0;

    // Hρ = (jωε/kc²) * (n/ρ) * Jn(kc*ρ) * sin(n*φ)
    const Hrho = rho > 0 ?
      factor * omega * CONSTANTS.eps0 * (n / rho) *
      besselJ(n, kcRho) * Math.sin(n * phi) * phaseFactor : 0;

    // Hφ = (jωε/kc) * J'n(kc*ρ) * cos(n*φ)
    const Hphi = factor * omega * CONSTANTS.eps0 * kc *
      besselJPrime(n, kcRho) * Math.cos(n * phi) * phaseFactor;

    const cosPhi = rho > 0 ? x / rho : 1;
    const sinPhi = rho > 0 ? y / rho : 0;

    const norm = 1 / chi;

    return {
      E: {
        x: (Erho * cosPhi - Ephi * sinPhi) * norm,
        y: (Erho * sinPhi + Ephi * cosPhi) * norm,
        z: Ez * norm,
      },
      H: {
        x: (Hrho * cosPhi - Hphi * sinPhi) * norm,
        y: (Hrho * sinPhi + Hphi * cosPhi) * norm,
        z: 0,
      },
    };
  }

  private getHybridFieldDistribution(
    rho: number,
    phi: number,
    x: number,
    y: number,
    n: number,
    p: number,
    kc: number,
    beta: number,
    omega: number,
    phaseFactor: number,
    type: 'HE' | 'EH'
  ): FieldVector {
    // Approximation simplifiée des modes hybrides
    // En réalité, ils sont une combinaison de TE et TM
    const chi = getBesselJZero(n, p);
    const kcRho = kc * rho;

    // Facteur de mélange (simplifié)
    const mixFactor = type === 'HE' ? 0.7 : 0.3;

    const Ez = mixFactor * besselJ(n, kcRho) * Math.cos(n * phi) * phaseFactor;
    const Hz = (1 - mixFactor) * besselJ(n, kcRho) * Math.cos(n * phi) * phaseFactor;

    const factor = 1 / (kc * kc);

    const Erho = -factor * beta * kc * mixFactor *
      besselJPrime(n, kcRho) * Math.cos(n * phi) * phaseFactor;
    const Hrho = factor * beta * kc * (1 - mixFactor) *
      besselJPrime(n, kcRho) * Math.cos(n * phi) * phaseFactor;

    const cosPhi = rho > 0 ? x / rho : 1;
    const sinPhi = rho > 0 ? y / rho : 0;

    const norm = 1 / chi;

    return {
      E: {
        x: Erho * cosPhi * norm,
        y: Erho * sinPhi * norm,
        z: Ez * norm,
      },
      H: {
        x: Hrho * cosPhi * norm,
        y: Hrho * sinPhi * norm,
        z: Hz * norm,
      },
    };
  }
}
