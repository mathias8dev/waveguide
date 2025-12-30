import { describe, it, expect } from 'vitest';
import {
  isValidNumber,
  isValidPositiveNumber,
  isNearZero,
  clamp,
  lerp,
  mapRange,
  normalize,
  factorial,
  binomial,
  gamma,
  degToRad,
  radToDeg,
  cartesianToPolar,
  polarToCartesian,
  formatFrequency,
  formatEngineering,
} from '../math';

describe('Validation', () => {
  describe('isValidNumber', () => {
    it('retourne true pour nombres finis', () => {
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(42)).toBe(true);
      expect(isValidNumber(-3.14)).toBe(true);
      expect(isValidNumber(1e-10)).toBe(true);
    });

    it('retourne false pour valeurs invalides', () => {
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber('42')).toBe(false);
    });
  });

  describe('isValidPositiveNumber', () => {
    it('retourne true pour nombres positifs', () => {
      expect(isValidPositiveNumber(1)).toBe(true);
      expect(isValidPositiveNumber(0.001)).toBe(true);
    });

    it('retourne false pour zéro et négatifs', () => {
      expect(isValidPositiveNumber(0)).toBe(false);
      expect(isValidPositiveNumber(-1)).toBe(false);
    });
  });

  describe('isNearZero', () => {
    it('détecte valeurs proches de zéro', () => {
      expect(isNearZero(0)).toBe(true);
      expect(isNearZero(1e-13)).toBe(true);
      expect(isNearZero(-1e-13)).toBe(true);
    });

    it('rejette valeurs non nulles', () => {
      expect(isNearZero(1e-10)).toBe(false);
      expect(isNearZero(0.1)).toBe(false);
    });
  });
});

describe('Interpolation et bornes', () => {
  describe('clamp', () => {
    it('limite les valeurs', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('interpole correctement', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });
  });

  describe('mapRange', () => {
    it('mappe entre intervalles', () => {
      expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
      expect(mapRange(0, 0, 10, 100, 200)).toBe(100);
      expect(mapRange(10, 0, 10, 100, 200)).toBe(200);
    });
  });

  describe('normalize', () => {
    it('normalise dans [0, 1]', () => {
      expect(normalize(5, 0, 10)).toBe(0.5);
      expect(normalize(0, 0, 10)).toBe(0);
      expect(normalize(10, 0, 10)).toBe(1);
    });

    it('gère intervalle nul', () => {
      expect(normalize(5, 5, 5)).toBe(0);
    });
  });
});

describe('Fonctions mathématiques', () => {
  describe('factorial', () => {
    it('calcule correctement', () => {
      expect(factorial(0)).toBe(1);
      expect(factorial(1)).toBe(1);
      expect(factorial(5)).toBe(120);
      expect(factorial(10)).toBe(3628800);
    });

    it('utilise le cache', () => {
      factorial(15);
      expect(factorial(15)).toBe(1307674368000);
    });

    it('lance erreur pour n < 0', () => {
      expect(() => factorial(-1)).toThrow();
    });
  });

  describe('binomial', () => {
    it('calcule C(n, k)', () => {
      expect(binomial(5, 2)).toBe(10);
      expect(binomial(10, 5)).toBe(252);
      expect(binomial(5, 0)).toBe(1);
      expect(binomial(5, 5)).toBe(1);
    });

    it('retourne 0 pour k > n', () => {
      expect(binomial(5, 6)).toBe(0);
    });
  });

  describe('gamma', () => {
    it('Γ(n) = (n-1)! pour entiers', () => {
      expect(gamma(1)).toBeCloseTo(1, 10);
      expect(gamma(5)).toBeCloseTo(24, 10);
      expect(gamma(6)).toBeCloseTo(120, 10);
    });

    it('Γ(0.5) = √π', () => {
      expect(gamma(0.5)).toBeCloseTo(Math.sqrt(Math.PI), 5);
    });

    it('lance erreur pour n <= 0', () => {
      expect(() => gamma(0)).toThrow();
      expect(() => gamma(-1)).toThrow();
    });
  });
});

describe('Trigonométrie et coordonnées', () => {
  describe('degToRad / radToDeg', () => {
    it('convertit correctement', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 10);
      expect(radToDeg(Math.PI)).toBeCloseTo(180, 10);
    });

    it('sont inverses', () => {
      expect(radToDeg(degToRad(45))).toBeCloseTo(45, 10);
    });
  });

  describe('cartesianToPolar / polarToCartesian', () => {
    it('convertit correctement', () => {
      const polar = cartesianToPolar(1, 0);
      expect(polar.r).toBeCloseTo(1, 10);
      expect(polar.theta).toBeCloseTo(0, 10);

      const polar2 = cartesianToPolar(0, 1);
      expect(polar2.r).toBeCloseTo(1, 10);
      expect(polar2.theta).toBeCloseTo(Math.PI / 2, 10);
    });

    it('sont inverses', () => {
      const cart = polarToCartesian(5, Math.PI / 4);
      const polar = cartesianToPolar(cart.x, cart.y);
      expect(polar.r).toBeCloseTo(5, 10);
      expect(polar.theta).toBeCloseTo(Math.PI / 4, 10);
    });
  });
});

describe('Formatage', () => {
  describe('formatFrequency', () => {
    it('utilise les bonnes unités', () => {
      expect(formatFrequency(1e3)).toBe('1.00 kHz');
      expect(formatFrequency(1e6)).toBe('1.00 MHz');
      expect(formatFrequency(1e9)).toBe('1.00 GHz');
      expect(formatFrequency(1e12)).toBe('1.00 THz');
    });
  });

  describe('formatEngineering', () => {
    it('utilise notation ingénieur', () => {
      expect(formatEngineering(1e6, 0)).toBe('1M');
      expect(formatEngineering(1e-3, 0)).toBe('1m');
      expect(formatEngineering(0)).toBe('0');
    });
  });
});
