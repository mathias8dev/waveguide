import { Mode, FieldVector, CalculatedParams, CONSTANTS } from '@/types';

/**
 * Classe abstraite de base pour tous les guides d'ondes
 */
export abstract class Waveguide {
  /**
   * Calcule la fréquence de coupure pour un mode donné
   */
  abstract getCutoffFrequency(mode: Mode): number;

  /**
   * Calcule le nombre d'onde de coupure kc
   */
  abstract getCutoffWavenumber(mode: Mode): number;

  /**
   * Calcule la distribution des champs à un point donné
   * Les coordonnées sont relatives au centre du guide
   */
  abstract getFieldDistribution(
    x: number,
    y: number,
    z: number,
    mode: Mode,
    frequency: number,
    time: number
  ): FieldVector;

  /**
   * Vérifie si un mode est supporté par ce guide
   */
  abstract isModeSupported(mode: Mode): boolean;

  /**
   * Retourne la liste des modes disponibles
   */
  abstract getAvailableModes(): Mode[];

  /**
   * Calcule la constante de propagation β
   */
  getPropagationConstant(frequency: number, mode: Mode): number {
    const fc = this.getCutoffFrequency(mode);

    if (frequency <= fc) {
      // Mode évanescent
      const k = (2 * Math.PI * frequency) / CONSTANTS.c;
      const kc = this.getCutoffWavenumber(mode);
      return Math.sqrt(kc * kc - k * k); // Constante d'atténuation α
    }

    // Mode propagatif
    const k = (2 * Math.PI * frequency) / CONSTANTS.c;
    const kc = this.getCutoffWavenumber(mode);
    return Math.sqrt(k * k - kc * kc);
  }

  /**
   * Calcule tous les paramètres pour un mode et une fréquence donnés
   */
  getCalculatedParams(frequency: number, mode: Mode): CalculatedParams {
    const fc = this.getCutoffFrequency(mode);
    const lambdaC = CONSTANTS.c / fc;
    const isPropagatif = frequency > fc;

    let beta = 0;
    let vp = 0;
    let vg = 0;
    let lambdaG = 0;
    let impedance = 0;

    if (isPropagatif) {
      const k = (2 * Math.PI * frequency) / CONSTANTS.c;
      const kc = this.getCutoffWavenumber(mode);
      beta = Math.sqrt(k * k - kc * kc);

      // Vitesse de phase: vp = ω/β = c/√(1-(fc/f)²)
      vp = CONSTANTS.c / Math.sqrt(1 - Math.pow(fc / frequency, 2));

      // Vitesse de groupe: vg = c * √(1-(fc/f)²)
      vg = CONSTANTS.c * Math.sqrt(1 - Math.pow(fc / frequency, 2));

      // Longueur d'onde guidée: λg = λ/√(1-(fc/f)²)
      const lambda = CONSTANTS.c / frequency;
      lambdaG = lambda / Math.sqrt(1 - Math.pow(fc / frequency, 2));

      // Impédance du guide (dépend du type de mode)
      if (mode.type === 'TE') {
        impedance = CONSTANTS.eta0 / Math.sqrt(1 - Math.pow(fc / frequency, 2));
      } else if (mode.type === 'TM') {
        impedance = CONSTANTS.eta0 * Math.sqrt(1 - Math.pow(fc / frequency, 2));
      } else if (mode.type === 'TEM') {
        impedance = CONSTANTS.eta0;
      }
    }

    return {
      cutoffFrequency: fc,
      cutoffWavelength: lambdaC,
      propagationConstant: beta,
      phaseVelocity: vp,
      groupVelocity: vg,
      wavelengthGuide: lambdaG,
      impedance,
      isPropagatif,
    };
  }
}
