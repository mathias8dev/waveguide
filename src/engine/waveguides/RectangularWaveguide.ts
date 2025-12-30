import { Waveguide } from '../core/Waveguide';
import { Mode, FieldVector, CONSTANTS, RectangularParams } from '@/types';

/**
 * Guide d'onde rectangulaire
 *
 * Structure métallique creuse de section rectangulaire a × b.
 * Convention: a ≥ b (a est la dimension large).
 *
 * ## Modes supportés
 *
 * **Modes TE (Transverse Électrique)**: Ez = 0, Hz ≠ 0
 * - TEₘₙ avec m ≥ 0, n ≥ 0, mais pas m = n = 0
 * - Mode dominant: TE₁₀
 *
 * **Modes TM (Transverse Magnétique)**: Hz = 0, Ez ≠ 0
 * - TMₘₙ avec m ≥ 1, n ≥ 1
 *
 * ## Fréquence de coupure
 *
 * fc = (c/2) × √((m/a)² + (n/b)²)
 *
 * Pour le mode dominant TE₁₀: fc = c / (2a)
 *
 * ## Standards
 *
 * | Nom   | Bande | a (mm)  | b (mm) | fc TE₁₀ (GHz) |
 * |-------|-------|---------|--------|---------------|
 * | WR-90 | X     | 22.86   | 10.16  | 6.56          |
 * | WR-75 | X     | 19.05   | 9.53   | 7.87          |
 * | WR-62 | Ku    | 15.80   | 7.90   | 9.49          |
 *
 * @example
 * const guide = new RectangularWaveguide({ a: 0.02286, b: 0.01016 });
 * guide.getCutoffFrequency({ type: 'TE', m: 1, n: 0 }) // ~6.56 GHz
 */
export class RectangularWaveguide extends Waveguide {
  /** Largeur du guide (dimension grande, m) */
  readonly a: number;
  /** Hauteur du guide (dimension petite, m) */
  readonly b: number;

  /**
   * Crée un guide d'onde rectangulaire
   * @param params - Dimensions du guide
   * @param params.a - Largeur (m)
   * @param params.b - Hauteur (m)
   * @throws {Error} Si les dimensions sont négatives, nulles ou non finies
   */
  constructor(params: Omit<RectangularParams, 'type'>) {
    super();

    // Validation des dimensions
    if (params.a <= 0 || !isFinite(params.a)) {
      throw new Error(`RectangularWaveguide: dimension 'a' doit être positive, reçu: ${params.a}`);
    }
    if (params.b <= 0 || !isFinite(params.b)) {
      throw new Error(`RectangularWaveguide: dimension 'b' doit être positive, reçu: ${params.b}`);
    }

    // Par convention, a >= b
    this.a = Math.max(params.a, params.b);
    this.b = Math.min(params.a, params.b);
  }

  /**
   * Calcule la fréquence de coupure d'un mode
   * @param mode - Mode (type, m, n)
   * @returns Fréquence de coupure en Hz
   */
  getCutoffFrequency(mode: Mode): number {
    const kc = this.getCutoffWavenumber(mode);
    return (CONSTANTS.c * kc) / (2 * Math.PI);
  }

  /**
   * Calcule le nombre d'onde de coupure
   * kc = √((mπ/a)² + (nπ/b)²)
   * @param mode - Mode (type, m, n)
   * @returns Nombre d'onde de coupure en rad/m
   */
  getCutoffWavenumber(mode: Mode): number {
    const { m, n } = mode;
    return Math.sqrt(
      Math.pow((m * Math.PI) / this.a, 2) +
      Math.pow((n * Math.PI) / this.b, 2)
    );
  }

  /**
   * Vérifie si un mode est physiquement supporté
   * - TE: m ≥ 0, n ≥ 0, pas les deux à 0
   * - TM: m ≥ 1, n ≥ 1
   * - TEM: non supporté (guide creux)
   * @param mode - Mode à vérifier
   * @returns true si le mode est supporté
   */
  isModeSupported(mode: Mode): boolean {
    const { type, m, n } = mode;

    if (type === 'TE') {
      // TE: m ≥ 0, n ≥ 0, mais pas les deux à 0
      return m >= 0 && n >= 0 && !(m === 0 && n === 0);
    }

    if (type === 'TM') {
      // TM: m ≥ 1, n ≥ 1 (les deux doivent être non nuls)
      return m >= 1 && n >= 1;
    }

    // TEM non supporté dans un guide rectangulaire creux
    return false;
  }

  /**
   * Retourne les modes disponibles triés par fréquence de coupure
   * @returns Liste des modes supportés, triés par fc croissante
   */
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

  /**
   * Calcule la distribution des champs E et H en un point
   *
   * @param x - Coordonnée x relative au centre (m)
   * @param y - Coordonnée y relative au centre (m)
   * @param z - Coordonnée z de propagation (m)
   * @param mode - Mode de propagation
   * @param frequency - Fréquence d'opération (Hz)
   * @param time - Instant temporel (s)
   * @returns Vecteurs E et H au point donné
   */
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

    // Coordonnées locales: origine au coin (0,0), x ∈ [0,a], y ∈ [0,b]
    const xLocal = x + this.a / 2;
    const yLocal = y + this.b / 2;

    // Vérifier si on est dans le guide
    if (xLocal < 0 || xLocal > this.a || yLocal < 0 || yLocal > this.b) {
      return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
    }

    // Mode évanescent
    if (!params.isPropagatif) {
      return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
    }

    const kc = this.getCutoffWavenumber(mode);
    const beta = params.propagationConstant;
    const omega = 2 * Math.PI * frequency;

    // Phase de propagation: cos(φ - βz) pour onde progressive vers +z
    // Note: `time` est interprété comme phase d'animation (en radians)
    // pour permettre une visualisation à vitesse humaine
    const phaseFactor = Math.cos(time - beta * z);

    if (type === 'TE') {
      return this.getTEFieldDistribution(xLocal, yLocal, m, n, kc, beta, omega, phaseFactor);
    } else if (type === 'TM') {
      return this.getTMFieldDistribution(xLocal, yLocal, m, n, kc, beta, omega, phaseFactor);
    }

    return { E: { x: 0, y: 0, z: 0 }, H: { x: 0, y: 0, z: 0 } };
  }

  /**
   * Distribution des champs pour les modes TE (Ez = 0)
   *
   * Fonction génératrice: Hz = H0 * cos(mπx/a) * cos(nπy/b) * e^(j(ωt-βz))
   *
   * Les composantes transverses sont dérivées via les équations de Maxwell:
   *   Ex = (jωμ/kc²) * (∂Hz/∂y) = (jωμ/kc²) * ky * cos(kx·x) * sin(ky·y)
   *   Ey = -(jωμ/kc²) * (∂Hz/∂x) = -(jωμ/kc²) * kx * sin(kx·x) * cos(ky·y)
   *   Hx = (jβ/kc²) * (∂Hz/∂x) = (jβ/kc²) * kx * sin(kx·x) * cos(ky·y)
   *   Hy = (jβ/kc²) * (∂Hz/∂y) = (jβ/kc²) * ky * cos(kx·x) * sin(ky·y)
   *
   * Le facteur j introduit un déphasage de 90° entre Hz et les composantes transverses.
   */
  private getTEFieldDistribution(
    x: number,
    y: number,
    m: number,
    n: number,
    kc: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const kx = (m * Math.PI) / this.a;
    const ky = (n * Math.PI) / this.b;

    // Fonctions trigonométriques de base
    const cosKxX = Math.cos(kx * x);
    const sinKxX = Math.sin(kx * x);
    const cosKyY = Math.cos(ky * y);
    const sinKyY = Math.sin(ky * y);

    // Hz = cos(kx·x) * cos(ky·y) * cos(ωt - βz)
    const Hz = cosKxX * cosKyY * phaseFactor;

    // Facteur commun 1/kc²
    const invKc2 = 1 / (kc * kc);

    // Impédance du mode TE: ZTE = ωμ/β
    const ZTE = (omega * CONSTANTS.mu0) / beta;

    // Composantes transverses du champ E
    // Ex = (ωμ·ky/kc²) * cos(kx·x) * sin(ky·y)
    const Ex = invKc2 * omega * CONSTANTS.mu0 * ky * cosKxX * sinKyY * phaseFactor;

    // Ey = -(ωμ·kx/kc²) * sin(kx·x) * cos(ky·y)
    const Ey = -invKc2 * omega * CONSTANTS.mu0 * kx * sinKxX * cosKyY * phaseFactor;

    // Composantes transverses du champ H (perpendiculaires à E)
    // Hx = (β·kx/kc²) * sin(kx·x) * cos(ky·y)
    const Hx = invKc2 * beta * kx * sinKxX * cosKyY * phaseFactor;

    // Hy = (β·ky/kc²) * cos(kx·x) * sin(ky·y)
    const Hy = invKc2 * beta * ky * cosKxX * sinKyY * phaseFactor;

    // Normalisation basée sur l'impédance du mode
    // Pour une visualisation cohérente: E/H ~ ZTE
    const visualNorm = 1 / (ZTE * kc);

    return {
      E: {
        x: Ex * visualNorm,
        y: Ey * visualNorm,
        z: 0,  // Ez = 0 pour mode TE
      },
      H: {
        x: Hx * visualNorm,
        y: Hy * visualNorm,
        z: Hz * visualNorm,
      },
    };
  }

  /**
   * Distribution des champs pour les modes TM (Hz = 0)
   *
   * Fonction génératrice: Ez = E0 * sin(mπx/a) * sin(nπy/b) * e^(j(ωt-βz))
   *
   * Les composantes transverses sont dérivées via les équations de Maxwell:
   *   Ex = -(jβ/kc²) * (∂Ez/∂x) = -(jβ/kc²) * kx * cos(kx·x) * sin(ky·y)
   *   Ey = -(jβ/kc²) * (∂Ez/∂y) = -(jβ/kc²) * ky * sin(kx·x) * cos(ky·y)
   *   Hx = (jωε/kc²) * (∂Ez/∂y) = (jωε/kc²) * ky * sin(kx·x) * cos(ky·y)
   *   Hy = -(jωε/kc²) * (∂Ez/∂x) = -(jωε/kc²) * kx * cos(kx·x) * sin(ky·y)
   */
  private getTMFieldDistribution(
    x: number,
    y: number,
    m: number,
    n: number,
    kc: number,
    beta: number,
    omega: number,
    phaseFactor: number
  ): FieldVector {
    const kx = (m * Math.PI) / this.a;
    const ky = (n * Math.PI) / this.b;

    // Fonctions trigonométriques de base
    const cosKxX = Math.cos(kx * x);
    const sinKxX = Math.sin(kx * x);
    const cosKyY = Math.cos(ky * y);
    const sinKyY = Math.sin(ky * y);

    // Ez = sin(kx·x) * sin(ky·y) * cos(ωt - βz)
    const Ez = sinKxX * sinKyY * phaseFactor;

    // Facteur commun 1/kc²
    const invKc2 = 1 / (kc * kc);

    // Impédance du mode TM: ZTM = β/(ωε)
    const ZTM = beta / (omega * CONSTANTS.eps0);

    // Composantes transverses du champ E
    // Ex = -(β·kx/kc²) * cos(kx·x) * sin(ky·y)
    const Ex = -invKc2 * beta * kx * cosKxX * sinKyY * phaseFactor;

    // Ey = -(β·ky/kc²) * sin(kx·x) * cos(ky·y)
    const Ey = -invKc2 * beta * ky * sinKxX * cosKyY * phaseFactor;

    // Composantes transverses du champ H
    // Hx = (ωε·ky/kc²) * sin(kx·x) * cos(ky·y)
    const Hx = invKc2 * omega * CONSTANTS.eps0 * ky * sinKxX * cosKyY * phaseFactor;

    // Hy = -(ωε·kx/kc²) * cos(kx·x) * sin(ky·y)
    const Hy = -invKc2 * omega * CONSTANTS.eps0 * kx * cosKxX * sinKyY * phaseFactor;

    // Normalisation basée sur l'impédance du mode
    const visualNorm = 1 / (ZTM * kc);

    return {
      E: {
        x: Ex * visualNorm,
        y: Ey * visualNorm,
        z: Ez * visualNorm,
      },
      H: {
        x: Hx * visualNorm,
        y: Hy * visualNorm,
        z: 0,  // Hz = 0 pour mode TM
      },
    };
  }
}
