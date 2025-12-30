import { Waveguide } from '../core/Waveguide';
import { Mode, FieldVector, CONSTANTS, CircularParams } from '@/types';
import { besselJ, besselJPrime, getBesselJZero, getBesselJPrimeZero } from '../math/bessel';

/**
 * Guide d'onde circulaire
 * Supporte les modes TE et TM
 *
 * Convention de notation: TE_nm et TM_nm où
 * - n = ordre azimutal (nombre de variations en φ)
 * - m = ordre radial (m-ième racine de la fonction de Bessel)
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

    // n = ordre azimutal, m = ordre radial (m-ième racine)
    if (type === 'TE') {
      // kc = χ'_nm / a où χ'_nm est la m-ième racine de J'_n(x) = 0
      const chi = getBesselJPrimeZero(n, m);
      return chi / this.radius;
    }

    if (type === 'TM') {
      // kc = χ_nm / a où χ_nm est la m-ième racine de J_n(x) = 0
      const chi = getBesselJZero(n, m);
      return chi / this.radius;
    }

    return 0;
  }

  isModeSupported(mode: Mode): boolean {
    const { type, m, n } = mode;

    // Seuls les modes TE et TM sont supportés dans un guide creux
    if (type === 'TE' || type === 'TM') {
      return n >= 0 && m >= 1;
    }

    // Les modes hybrides HE/EH nécessitent un guide diélectrique (non supporté)
    return false;
  }

  getAvailableModes(): Mode[] {
    const modes: Mode[] = [];

    // Modes TE (le mode dominant est TE11)
    for (let n = 0; n <= 3; n++) {
      for (let m = 1; m <= 3; m++) {
        modes.push({ type: 'TE', m, n });
      }
    }

    // Modes TM (TM01 est le premier mode TM)
    for (let n = 0; n <= 3; n++) {
      for (let m = 1; m <= 3; m++) {
        modes.push({ type: 'TM', m, n });
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

    // Mode évanescent: champs décroissants
    if (!params.isPropagatif) {
      return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
    }

    const kc = this.getCutoffWavenumber(mode);
    const beta = params.propagationConstant;
    const omega = 2 * Math.PI * frequency;

    // Phase de propagation: cos(ωt - βz) pour onde progressive vers +z
    const phaseFactor = Math.cos(omega * time - beta * z);

    if (type === 'TE') {
      return this.getTEFieldDistribution(
        rho, phi, x, y, n, m, kc, beta, omega, phaseFactor
      );
    } else if (type === 'TM') {
      return this.getTMFieldDistribution(
        rho, phi, x, y, n, m, kc, beta, omega, phaseFactor
      );
    }

    return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
  }

  /**
   * Distribution des champs pour les modes TE (Ez = 0)
   *
   * Hz = H0 * Jn(kc*ρ) * cos(n*φ) * cos(ωt - βz)
   *
   * Composantes transverses dérivées de Hz via les équations de Maxwell:
   * Eρ = (jωμ/kc²) * (n/ρ) * Jn(kc*ρ) * sin(n*φ)
   * Eφ = (jωμ/kc) * J'n(kc*ρ) * cos(n*φ)
   * Hρ = (jβ/kc) * J'n(kc*ρ) * cos(n*φ)
   * Hφ = (jβ/kc²) * (n/ρ) * Jn(kc*ρ) * sin(n*φ)
   */
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

    // Amplitude à la limite du guide pour normalisation
    const JnAtBoundary = besselJ(n, chi);
    const normFactor = 1 / (Math.abs(JnAtBoundary) > 1e-10 ? JnAtBoundary : 1);

    // Hz normalisé
    const Jn = besselJ(n, kcRho) * normFactor;
    const JnPrime = besselJPrime(n, kcRho) * normFactor;
    const Hz = Jn * Math.cos(n * phi) * phaseFactor;

    // Impédance du mode TE: ZTE = ωμ/β
    const ZTE = (omega * CONSTANTS.mu0) / beta;

    // Composantes transverses (le j devient un déphasage de 90°,
    // représenté ici en utilisant phaseFactor pour la partie réelle)
    const commonFactor = 1 / (kc * kc);

    // Eρ = (ωμ/kc²) * (n/ρ) * Jn * sin(n*φ)
    const Erho = rho > 1e-10 ?
      commonFactor * omega * CONSTANTS.mu0 * (n / rho) * Jn * Math.sin(n * phi) * phaseFactor : 0;

    // Eφ = -(ωμ/kc) * J'n * cos(n*φ)  (le signe - vient de la dérivée ∂Hz/∂ρ)
    const Ephi = -commonFactor * omega * CONSTANTS.mu0 * kc * JnPrime * Math.cos(n * phi) * phaseFactor;

    // Hρ = (β/kc) * J'n * cos(n*φ)
    const Hrho = commonFactor * beta * kc * JnPrime * Math.cos(n * phi) * phaseFactor;

    // Hφ = -(β/kc²) * (n/ρ) * Jn * sin(n*φ)
    const Hphi = rho > 1e-10 ?
      -commonFactor * beta * (n / rho) * Jn * Math.sin(n * phi) * phaseFactor : 0;

    // Conversion coordonnées cylindriques -> cartésiennes
    const cosPhi = rho > 1e-10 ? x / rho : 1;
    const sinPhi = rho > 1e-10 ? y / rho : 0;

    // Normalisation pour la visualisation (basée sur l'impédance)
    const visualNorm = 1 / (ZTE * kc);

    return {
      E: {
        x: (Erho * cosPhi - Ephi * sinPhi) * visualNorm,
        y: (Erho * sinPhi + Ephi * cosPhi) * visualNorm,
        z: 0,  // Ez = 0 pour mode TE
      },
      H: {
        x: (Hrho * cosPhi - Hphi * sinPhi) * visualNorm,
        y: (Hrho * sinPhi + Hphi * cosPhi) * visualNorm,
        z: Hz * visualNorm,
      },
    };
  }

  /**
   * Distribution des champs pour les modes TM (Hz = 0)
   *
   * Ez = E0 * Jn(kc*ρ) * cos(n*φ) * cos(ωt - βz)
   *
   * Composantes transverses dérivées de Ez via les équations de Maxwell:
   * Eρ = -(jβ/kc) * J'n(kc*ρ) * cos(n*φ)
   * Eφ = (jβ/kc²) * (n/ρ) * Jn(kc*ρ) * sin(n*φ)
   * Hρ = (jωε/kc²) * (n/ρ) * Jn(kc*ρ) * sin(n*φ)
   * Hφ = (jωε/kc) * J'n(kc*ρ) * cos(n*φ)
   */
  private getTMFieldDistribution(
    rho: number,
    phi: number,
    x: number,
    y: number,
    n: number,
    _p: number,
    kc: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const kcRho = kc * rho;

    // Pour TM, Jn(χ) = 0 à la frontière, donc on normalise par la valeur max
    // La valeur max de Jn est environ 1 pour n=0, moins pour n>0
    const JnMax = n === 0 ? 1 : 0.5;
    const normFactor = 1 / JnMax;

    // Ez normalisé
    const Jn = besselJ(n, kcRho) * normFactor;
    const JnPrime = besselJPrime(n, kcRho) * normFactor;
    const Ez = Jn * Math.cos(n * phi) * phaseFactor;

    // Impédance du mode TM: ZTM = β/(ωε)
    const ZTM = beta / (omega * CONSTANTS.eps0);

    const commonFactor = 1 / (kc * kc);

    // Eρ = -(β/kc) * J'n * cos(n*φ)
    const Erho = -commonFactor * beta * kc * JnPrime * Math.cos(n * phi) * phaseFactor;

    // Eφ = (β/kc²) * (n/ρ) * Jn * sin(n*φ)
    const Ephi = rho > 1e-10 ?
      commonFactor * beta * (n / rho) * Jn * Math.sin(n * phi) * phaseFactor : 0;

    // Hρ = (ωε/kc²) * (n/ρ) * Jn * sin(n*φ)
    const Hrho = rho > 1e-10 ?
      commonFactor * omega * CONSTANTS.eps0 * (n / rho) * Jn * Math.sin(n * phi) * phaseFactor : 0;

    // Hφ = (ωε/kc) * J'n * cos(n*φ)
    const Hphi = commonFactor * omega * CONSTANTS.eps0 * kc * JnPrime * Math.cos(n * phi) * phaseFactor;

    // Conversion coordonnées cylindriques -> cartésiennes
    const cosPhi = rho > 1e-10 ? x / rho : 1;
    const sinPhi = rho > 1e-10 ? y / rho : 0;

    // Normalisation pour la visualisation
    const visualNorm = 1 / (ZTM * kc);

    return {
      E: {
        x: (Erho * cosPhi - Ephi * sinPhi) * visualNorm,
        y: (Erho * sinPhi + Ephi * cosPhi) * visualNorm,
        z: Ez * visualNorm,
      },
      H: {
        x: (Hrho * cosPhi - Hphi * sinPhi) * visualNorm,
        y: (Hrho * sinPhi + Hphi * cosPhi) * visualNorm,
        z: 0,  // Hz = 0 pour mode TM
      },
    };
  }
}
