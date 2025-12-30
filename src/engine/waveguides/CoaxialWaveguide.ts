import { Waveguide } from '../core/Waveguide';
import { Mode, FieldVector, CONSTANTS, CoaxialParams } from '@/types';
import { besselJ, besselY, besselJPrime, besselYPrime } from '../math/bessel';

/**
 * Guide d'onde coaxial
 *
 * Supporte principalement le mode TEM (fondamental) qui est le mode
 * le plus utilisé dans les câbles coaxiaux.
 *
 * Le mode TEM existe à toutes les fréquences (pas de fréquence de coupure).
 * Les modes TE et TM ont des fréquences de coupure et nécessitent la
 * résolution d'équations transcendantales impliquant les fonctions de Bessel.
 *
 * Pour les modes d'ordre supérieur, on utilise une approximation basée sur
 * les conditions aux limites coaxiales.
 */
export class CoaxialWaveguide extends Waveguide {
  readonly innerRadius: number; // Rayon du conducteur central (a)
  readonly outerRadius: number; // Rayon du conducteur externe (b)

  constructor(params: Omit<CoaxialParams, 'type'>) {
    super();

    // Validation des rayons
    if (params.innerRadius <= 0 || !isFinite(params.innerRadius)) {
      throw new Error(`CoaxialWaveguide: rayon interne doit être positif, reçu: ${params.innerRadius}`);
    }
    if (params.outerRadius <= 0 || !isFinite(params.outerRadius)) {
      throw new Error(`CoaxialWaveguide: rayon externe doit être positif, reçu: ${params.outerRadius}`);
    }
    if (params.innerRadius >= params.outerRadius) {
      throw new Error(`CoaxialWaveguide: rayon interne (${params.innerRadius}) doit être inférieur au rayon externe (${params.outerRadius})`);
    }

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
    const a = this.innerRadius;
    const b = this.outerRadius;

    if (type === 'TEM') {
      return 0;
    }

    // Pour les modes TE et TM coaxiaux, le nombre d'onde de coupure kc
    // est solution de l'équation transcendantale:
    // TE: J'n(kc*a)*Y'n(kc*b) = J'n(kc*b)*Y'n(kc*a)
    // TM: Jn(kc*a)*Yn(kc*b) = Jn(kc*b)*Yn(kc*a)
    //
    // Approximation pour le premier mode TE11:
    // kc ≈ 2/(a+b) pour le mode TE11 (approximation du rayon moyen)
    //
    // Pour une approximation plus générale:
    // Le mode dominant TE est TE11 avec fc ≈ c/(π(a+b))

    const meanRadius = (a + b) / 2;
    const ratio = b / a;

    if (type === 'TE') {
      // Approximation pour les modes TE_nm
      // Le premier mode TE (n=1, m=1) a kc ≈ 2/(a+b)
      // Pour les modes d'ordre supérieur, on utilise une approximation
      if (n === 0) {
        // TE0m : modes axisymétriques
        return (m * Math.PI) / (b - a);
      } else {
        // TEnm : approximation basée sur le rayon moyen
        return Math.sqrt(
          Math.pow(n / meanRadius, 2) +
          Math.pow((m * Math.PI) / (b - a), 2)
        );
      }
    }

    if (type === 'TM') {
      // TM0m : les premiers modes TM sont les TM01, TM02, etc.
      if (n === 0) {
        // Pour TM01, kc ≈ π/(b-a) * correction pour la géométrie coaxiale
        return (m * Math.PI) / (b - a) * (1 + 0.1 * (ratio - 1));
      } else {
        // TMnm avec n > 0
        return Math.sqrt(
          Math.pow(n / meanRadius, 2) +
          Math.pow((m * Math.PI) / (b - a), 2)
        );
      }
    }

    return 0;
  }

  isModeSupported(mode: Mode): boolean {
    const { type, m, n } = mode;

    if (type === 'TEM') {
      // Mode TEM unique: TEM (m=0, n=0)
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

    // Modes TE (les plus courants sont TE11, TE01, TE21)
    for (let n = 0; n <= 2; n++) {
      for (let m = 1; m <= 2; m++) {
        modes.push({ type: 'TE', m, n });
      }
    }

    // Modes TM (les plus courants sont TM01, TM11)
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
   * Z0 = (η0 / 2π) * ln(b/a)
   */
  getCharacteristicImpedance(): number {
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

    // Vérifier si on est dans le guide (entre les deux conducteurs)
    if (rho < this.innerRadius || rho > this.outerRadius) {
      return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
    }

    const phi = Math.atan2(y, x);
    const params = this.getCalculatedParams(frequency, mode);

    // Pour le mode TEM, β = ω/c (pas de dispersion)
    // Pour les autres modes, utiliser la constante de propagation calculée
    const beta = type === 'TEM' ?
      (2 * Math.PI * frequency) / CONSTANTS.c :
      params.propagationConstant;

    // Mode évanescent pour TE/TM
    if (type !== 'TEM' && !params.isPropagatif) {
      return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
    }

    const omega = 2 * Math.PI * frequency;
    // Phase de propagation: cos(φ - βz) pour onde progressive vers +z
    // Note: `time` est interprété comme phase d'animation (en radians)
    const phaseFactor = Math.cos(time - beta * z);

    if (type === 'TEM') {
      return this.getTEMFieldDistribution(rho, x, y, phaseFactor);
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

  /**
   * Distribution des champs pour le mode TEM
   *
   * Le mode TEM est le mode fondamental du guide coaxial.
   * Les champs sont purement transverses et radiaux:
   *
   * E_ρ = V0 / (ρ * ln(b/a)) * cos(ωt - βz)
   * H_φ = V0 / (ρ * Z0 * ln(b/a)) * cos(ωt - βz)  où Z0 = η0*ln(b/a)/(2π)
   *
   * Les champs varient en 1/ρ, typique du potentiel cylindrique.
   */
  private getTEMFieldDistribution(
    rho: number,
    x: number,
    y: number,
    phaseFactor: number
  ): FieldVector {
    const a = this.innerRadius;
    const b = this.outerRadius;
    const logRatio = Math.log(b / a);

    // Normalisation: on fixe le champ E à la surface interne à 1 V/m
    // E(a) = V0/(a*ln(b/a)) = 1  =>  V0 = a*ln(b/a)
    const V0 = a * logRatio;

    // Champ électrique radial: E_ρ = V0 / (ρ * ln(b/a))
    const Erho = (V0 / (rho * logRatio)) * phaseFactor;

    // Champ magnétique azimutal: H_φ = E_ρ / η0 (relation TEM)
    // En mode TEM: E/H = η0 (impédance de l'espace libre)
    const Hphi = Erho / CONSTANTS.eta0;

    // Conversion en coordonnées cartésiennes
    const cosPhi = x / rho;
    const sinPhi = y / rho;

    // Normalisation pour visualisation
    const visualNorm = 1;

    return {
      E: {
        x: Erho * cosPhi * visualNorm,
        y: Erho * sinPhi * visualNorm,
        z: 0,  // Pas de composante axiale en mode TEM
      },
      H: {
        x: -Hphi * sinPhi * visualNorm,
        y: Hphi * cosPhi * visualNorm,
        z: 0,  // Pas de composante axiale en mode TEM
      },
    };
  }

  /**
   * Distribution des champs pour les modes TE (Ez = 0)
   *
   * Pour les modes TE coaxiaux, Hz ≠ 0 et les champs transverses
   * sont dérivés de Hz. La fonction radiale est une combinaison
   * de Jn et Yn pour satisfaire les conditions aux limites.
   */
  private getTEFieldDistribution(
    rho: number,
    phi: number,
    x: number,
    y: number,
    m: number,
    n: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const kc = this.getCutoffWavenumber({ type: 'TE', m, n });
    const a = this.innerRadius;

    const kcRho = kc * rho;
    const kcA = kc * a;

    // Fonction radiale R(ρ) satisfaisant R'(a) = R'(b) = 0
    // R(ρ) = Jn(kc*ρ)*Y'n(kc*a) - J'n(kc*a)*Yn(kc*ρ)
    const Jn = besselJ(n, kcRho);
    const Yn = besselY(n, kcRho);
    const JnPrimeA = besselJPrime(n, kcA);
    const YnPrimeA = besselYPrime(n, kcA);

    const R = Jn * YnPrimeA - JnPrimeA * Yn;

    // Dérivée de R par rapport à ρ
    const JnPrime = besselJPrime(n, kcRho);
    const YnPrime = besselYPrime(n, kcRho);
    const RPrime = (JnPrime * YnPrimeA - JnPrimeA * YnPrime) * kc;

    // Hz = R(ρ) * cos(n*φ) * cos(ωt - βz)
    const Hz = R * Math.cos(n * phi) * phaseFactor;

    // Impédance TE: ZTE = ωμ/β
    const ZTE = (omega * CONSTANTS.mu0) / beta;
    const factor = 1 / (kc * kc);

    // Composantes transverses
    const Erho = rho > 1e-10 ?
      factor * omega * CONSTANTS.mu0 * (n / rho) * R *
      Math.sin(n * phi) * phaseFactor : 0;

    const Ephi = -factor * omega * CONSTANTS.mu0 * RPrime *
      Math.cos(n * phi) * phaseFactor / kc;

    const Hrho = factor * beta * RPrime *
      Math.cos(n * phi) * phaseFactor / kc;

    const Hphi = rho > 1e-10 ?
      -factor * beta * (n / rho) * R *
      Math.sin(n * phi) * phaseFactor : 0;

    // Conversion en coordonnées cartésiennes
    const cosPhi = rho > 1e-10 ? x / rho : 1;
    const sinPhi = rho > 1e-10 ? y / rho : 0;

    // Normalisation pour visualisation
    const visualNorm = 1 / (ZTE * kc);

    return {
      E: {
        x: (Erho * cosPhi - Ephi * sinPhi) * visualNorm,
        y: (Erho * sinPhi + Ephi * cosPhi) * visualNorm,
        z: 0,
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
   * Pour les modes TM coaxiaux, Ez ≠ 0 et les champs transverses
   * sont dérivés de Ez. La fonction radiale satisfait Ez(a) = Ez(b) = 0.
   */
  private getTMFieldDistribution(
    rho: number,
    phi: number,
    x: number,
    y: number,
    m: number,
    n: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const kc = this.getCutoffWavenumber({ type: 'TM', m, n });
    const a = this.innerRadius;

    const kcRho = kc * rho;
    const kcA = kc * a;

    // Fonction radiale R(ρ) satisfaisant R(a) = R(b) = 0
    // R(ρ) = Jn(kc*ρ)*Yn(kc*a) - Jn(kc*a)*Yn(kc*ρ)
    const Jn = besselJ(n, kcRho);
    const Yn = besselY(n, kcRho);
    const JnA = besselJ(n, kcA);
    const YnA = besselY(n, kcA);

    const R = Jn * YnA - JnA * Yn;

    // Dérivée de R par rapport à ρ
    const JnPrime = besselJPrime(n, kcRho);
    const YnPrime = besselYPrime(n, kcRho);
    const RPrime = (JnPrime * YnA - JnA * YnPrime) * kc;

    // Ez = R(ρ) * cos(n*φ) * cos(ωt - βz)
    const Ez = R * Math.cos(n * phi) * phaseFactor;

    // Impédance TM: ZTM = β/(ωε)
    const ZTM = beta / (omega * CONSTANTS.eps0);
    const factor = 1 / (kc * kc);

    // Composantes transverses
    const Erho = -factor * beta * RPrime *
      Math.cos(n * phi) * phaseFactor / kc;

    const Ephi = rho > 1e-10 ?
      factor * beta * (n / rho) * R *
      Math.sin(n * phi) * phaseFactor : 0;

    const Hrho = rho > 1e-10 ?
      factor * omega * CONSTANTS.eps0 * (n / rho) * R *
      Math.sin(n * phi) * phaseFactor : 0;

    const Hphi = factor * omega * CONSTANTS.eps0 * RPrime *
      Math.cos(n * phi) * phaseFactor / kc;

    // Conversion en coordonnées cartésiennes
    const cosPhi = rho > 1e-10 ? x / rho : 1;
    const sinPhi = rho > 1e-10 ? y / rho : 0;

    // Normalisation pour visualisation
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
        z: 0,
      },
    };
  }
}
