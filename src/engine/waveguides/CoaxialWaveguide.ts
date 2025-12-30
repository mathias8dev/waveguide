import { Waveguide } from '../core/Waveguide';
import { Mode, FieldVector, CONSTANTS, CoaxialParams } from '@/types';
import { besselJ, besselY, besselJPrime, besselYPrime } from '../math/bessel';

/**
 * Guide d'onde coaxial
 * Supporte le mode TEM (fondamental) et les modes TE/TM d'ordre supérieur
 */
export class CoaxialWaveguide extends Waveguide {
  readonly innerRadius: number; // Rayon du conducteur central
  readonly outerRadius: number; // Rayon du conducteur externe

  constructor(params: Omit<CoaxialParams, 'type'>) {
    super();
    this.innerRadius = params.innerRadius;
    this.outerRadius = params.outerRadius;
  }

  getCutoffFrequency(mode: Mode): number {
    const { type } = mode;

    if (type === 'TEM') {
      // Le mode TEM n'a pas de fréquence de coupure
      return 0;
    }

    const kc = this.getCutoffWavenumber(mode);
    return (CONSTANTS.c * kc) / (2 * Math.PI);
  }

  getCutoffWavenumber(mode: Mode): number {
    const { type, m, n } = mode;

    if (type === 'TEM') {
      return 0;
    }

    // Pour les modes TE et TM dans un guide coaxial,
    // on doit résoudre des équations transcendantes complexes
    // Approximation: kc ≈ π(m) / (b - a) pour les premiers modes
    const meanRadius = (this.outerRadius + this.innerRadius) / 2;
    const gap = this.outerRadius - this.innerRadius;

    if (type === 'TE') {
      // Approximation pour TEn1
      return (n * Math.PI) / gap + m / meanRadius;
    }

    if (type === 'TM') {
      // Approximation pour TMnm
      return Math.sqrt(
        Math.pow((m * Math.PI) / gap, 2) +
        Math.pow(n / meanRadius, 2)
      );
    }

    return 0;
  }

  isModeSupported(mode: Mode): boolean {
    const { type, m, n } = mode;

    if (type === 'TEM') {
      // Mode TEM unique: TEM00
      return m === 0 && n === 0;
    }

    if (type === 'TE' || type === 'TM') {
      return n >= 0 && m >= 1;
    }

    return false;
  }

  getAvailableModes(): Mode[] {
    const modes: Mode[] = [
      { type: 'TEM', m: 0, n: 0 }, // Mode fondamental
    ];

    // Modes TE
    for (let n = 0; n <= 2; n++) {
      for (let m = 1; m <= 2; m++) {
        modes.push({ type: 'TE', m, n });
      }
    }

    // Modes TM
    for (let n = 0; n <= 2; n++) {
      for (let m = 1; m <= 2; m++) {
        modes.push({ type: 'TM', m, n });
      }
    }

    return modes.sort((a, b) =>
      this.getCutoffFrequency(a) - this.getCutoffFrequency(b)
    );
  }

  /**
   * Impédance caractéristique du mode TEM
   */
  getCharacteristicImpedance(): number {
    // Z0 = (η0 / 2π) * ln(b/a)
    return (CONSTANTS.eta0 / (2 * Math.PI)) *
      Math.log(this.outerRadius / this.innerRadius);
  }

  getFieldDistribution(
    x: number,
    y: number,
    z: number,
    mode: Mode,
    frequency: number,
    time: number
  ): FieldVector {
    const { type } = mode;

    // Conversion en coordonnées cylindriques
    const rho = Math.sqrt(x * x + y * y);
    const phi = Math.atan2(y, x);

    // Vérifier si on est dans le guide (entre les deux conducteurs)
    if (rho < this.innerRadius || rho > this.outerRadius) {
      return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
    }

    const params = this.getCalculatedParams(frequency, mode);
    const beta = type === 'TEM' ?
      (2 * Math.PI * frequency) / CONSTANTS.c :
      params.propagationConstant;
    const omega = 2 * Math.PI * frequency;

    const phaseFactor = Math.cos(omega * time - beta * z);

    if (type === 'TEM') {
      return this.getTEMFieldDistribution(rho, x, y, beta, omega, phaseFactor);
    } else if (type === 'TE') {
      return this.getTEFieldDistribution(
        rho, phi, x, y, mode.m, mode.n, beta, omega, phaseFactor
      );
    } else if (type === 'TM') {
      return this.getTMFieldDistribution(
        rho, phi, x, y, mode.m, mode.n, beta, omega, phaseFactor
      );
    }

    return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
  }

  private getTEMFieldDistribution(
    rho: number,
    x: number,
    y: number,
    _beta: number,
    _omega: number,
    phaseFactor: number
  ): FieldVector {
    // Mode TEM: champs purement transverses
    // Eρ = V0 / (ρ * ln(b/a)) * cos(ωt - βz)
    // Hφ = I0 / (2πρ) * cos(ωt - βz)

    const logRatio = Math.log(this.outerRadius / this.innerRadius);

    // Amplitude normalisée
    const Erho = (1 / (rho * logRatio)) * phaseFactor;
    const Hphi = (1 / (2 * Math.PI * rho)) * phaseFactor;

    // Conversion en coordonnées cartésiennes
    const cosPhi = x / rho;
    const sinPhi = y / rho;

    return {
      E: {
        x: Erho * cosPhi,
        y: Erho * sinPhi,
        z: 0,
      },
      H: {
        x: -Hphi * sinPhi,
        y: Hphi * cosPhi,
        z: 0,
      },
    };
  }

  private getTEFieldDistribution(
    rho: number,
    phi: number,
    x: number,
    y: number,
    p: number,
    n: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const kc = this.getCutoffWavenumber({ type: 'TE', m: p, n });
    const kcRho = kc * rho;
    const a = this.innerRadius;
    const kcA = kc * a;

    // Combinaison de fonctions de Bessel pour satisfaire les conditions aux limites
    // R(ρ) = Jn(kc*ρ)*Y'n(kc*a) - J'n(kc*a)*Yn(kc*ρ)
    const Jn = besselJ(n, kcRho);
    const Yn = besselY(n, kcRho);
    const JnPrimeA = besselJPrime(n, kcA);
    const YnPrimeA = besselYPrime(n, kcA);

    const R = Jn * YnPrimeA - JnPrimeA * Yn;
    const Hz = R * Math.cos(n * phi) * phaseFactor;

    const factor = 1 / (kc * kc);

    const Erho = rho > 0 ?
      factor * omega * CONSTANTS.mu0 * (n / rho) * R *
      Math.sin(n * phi) * phaseFactor : 0;

    const JnPrime = besselJPrime(n, kcRho);
    const YnPrime = besselYPrime(n, kcRho);
    const RPrime = JnPrime * YnPrimeA - JnPrimeA * YnPrime;

    const Ephi = -factor * omega * CONSTANTS.mu0 * kc * RPrime *
      Math.cos(n * phi) * phaseFactor;

    const Hrho = factor * beta * kc * RPrime *
      Math.cos(n * phi) * phaseFactor;

    const Hphi = rho > 0 ?
      -factor * beta * (n / rho) * R *
      Math.sin(n * phi) * phaseFactor : 0;

    const cosPhi = rho > 0 ? x / rho : 1;
    const sinPhi = rho > 0 ? y / rho : 0;

    const norm = 0.1;

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
    p: number,
    n: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const kc = this.getCutoffWavenumber({ type: 'TM', m: p, n });
    const kcRho = kc * rho;
    const a = this.innerRadius;
    const kcA = kc * a;

    // R(ρ) = Jn(kc*ρ)*Yn(kc*a) - Jn(kc*a)*Yn(kc*ρ)
    const Jn = besselJ(n, kcRho);
    const Yn = besselY(n, kcRho);
    const JnA = besselJ(n, kcA);
    const YnA = besselY(n, kcA);

    const R = Jn * YnA - JnA * Yn;
    const Ez = R * Math.cos(n * phi) * phaseFactor;

    const factor = 1 / (kc * kc);

    const JnPrime = besselJPrime(n, kcRho);
    const YnPrime = besselYPrime(n, kcRho);
    const RPrime = JnPrime * YnA - JnA * YnPrime;

    const Erho = -factor * beta * kc * RPrime *
      Math.cos(n * phi) * phaseFactor;

    const Ephi = rho > 0 ?
      factor * beta * (n / rho) * R *
      Math.sin(n * phi) * phaseFactor : 0;

    const Hrho = rho > 0 ?
      factor * omega * CONSTANTS.eps0 * (n / rho) * R *
      Math.sin(n * phi) * phaseFactor : 0;

    const Hphi = factor * omega * CONSTANTS.eps0 * kc * RPrime *
      Math.cos(n * phi) * phaseFactor;

    const cosPhi = rho > 0 ? x / rho : 1;
    const sinPhi = rho > 0 ? y / rho : 0;

    const norm = 0.1;

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
}
