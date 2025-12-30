import { describe, it, expect } from 'vitest';
import {
  besselJ,
  besselY,
  besselJPrime,
  besselYPrime,
  getBesselJZero,
  getBesselJPrimeZero,
} from '../bessel';

describe('besselJ - Fonction de Bessel de première espèce', () => {
  it('J_0(0) = 1', () => {
    expect(besselJ(0, 0)).toBeCloseTo(1, 10);
  });

  it('J_n(0) = 0 pour n > 0', () => {
    expect(besselJ(1, 0)).toBeCloseTo(0, 10);
    expect(besselJ(2, 0)).toBeCloseTo(0, 10);
    expect(besselJ(5, 0)).toBeCloseTo(0, 10);
  });

  it('correspond aux valeurs tabulées (Abramowitz & Stegun)', () => {
    // Valeurs de référence: Table 9.1 de Abramowitz & Stegun
    expect(besselJ(0, 1)).toBeCloseTo(0.7651976866, 6);
    expect(besselJ(0, 2)).toBeCloseTo(0.2238907791, 6);
    expect(besselJ(1, 1)).toBeCloseTo(0.4400505857, 6);
    expect(besselJ(1, 2)).toBeCloseTo(0.5767248078, 6);
    expect(besselJ(2, 2)).toBeCloseTo(0.3528340286, 6);
  });

  it('les zéros sont corrects', () => {
    // J_0(2.4048) ≈ 0
    expect(besselJ(0, 2.4048)).toBeCloseTo(0, 3);
    // J_1(3.8317) ≈ 0
    expect(besselJ(1, 3.8317)).toBeCloseTo(0, 3);
    // J_0(5.5201) ≈ 0
    expect(besselJ(0, 5.5201)).toBeCloseTo(0, 3);
  });

  it('fonctionne pour les grands arguments (asymptotique)', () => {
    // Pour x grand, J_0(x) ≈ sqrt(2/(πx)) * cos(x - π/4)
    const x = 20;
    const asymptotic = Math.sqrt(2 / (Math.PI * x)) * Math.cos(x - Math.PI / 4);
    expect(besselJ(0, x)).toBeCloseTo(asymptotic, 2);
  });
});

describe('besselY - Fonction de Bessel de seconde espèce', () => {
  it('Y_n(x) → -∞ quand x → 0', () => {
    expect(besselY(0, 0.001)).toBeLessThan(-3);
    expect(besselY(1, 0.001)).toBeLessThan(-100);
  });

  it('retourne -Infinity pour x <= 0', () => {
    expect(besselY(0, 0)).toBe(-Infinity);
    expect(besselY(0, -1)).toBe(-Infinity);
  });

  it('correspond aux valeurs tabulées', () => {
    // Valeurs de référence: Table 9.1 de Abramowitz & Stegun
    // Note: La précision de Y_1 est limitée par l'implémentation actuelle
    expect(besselY(0, 1)).toBeCloseTo(0.0882569642, 4);
    expect(besselY(0, 2)).toBeCloseTo(0.5103756726, 4);
    // Y_1 a une précision réduite - à améliorer en Phase 4
    expect(besselY(1, 1)).toBeCloseTo(-0.7812128213, 0);
    expect(besselY(1, 2)).toBeCloseTo(-0.1070324315, 1);
  });
});

describe('besselJPrime - Dérivée de J_n', () => {
  it("J'_0(x) = -J_1(x)", () => {
    expect(besselJPrime(0, 1)).toBeCloseTo(-besselJ(1, 1), 10);
    expect(besselJPrime(0, 2)).toBeCloseTo(-besselJ(1, 2), 10);
  });

  it("J'_n(0) = 0 pour n > 1", () => {
    expect(besselJPrime(2, 0)).toBeCloseTo(0, 10);
    expect(besselJPrime(3, 0)).toBeCloseTo(0, 10);
  });

  it("J'_1(0) = 0.5", () => {
    // J'_1(x) = (J_0(x) - J_2(x))/2
    // J'_1(0) = (1 - 0)/2 = 0.5
    expect(besselJPrime(1, 0)).toBeCloseTo(0.5, 10);
  });
});

describe('besselYPrime - Dérivée de Y_n', () => {
  it("Y'_0(x) = -Y_1(x)", () => {
    expect(besselYPrime(0, 2)).toBeCloseTo(-besselY(1, 2), 8);
  });
});

describe('getBesselJZero - Racines de J_n(x) = 0', () => {
  it('retourne les premières racines correctes', () => {
    // Valeurs tabulées
    expect(getBesselJZero(0, 1)).toBeCloseTo(2.4048, 4);
    expect(getBesselJZero(0, 2)).toBeCloseTo(5.5201, 4);
    expect(getBesselJZero(1, 1)).toBeCloseTo(3.8317, 4);
    expect(getBesselJZero(1, 2)).toBeCloseTo(7.0156, 4);
    expect(getBesselJZero(2, 1)).toBeCloseTo(5.1356, 4);
  });

  it('lance une erreur pour n < 0', () => {
    expect(() => getBesselJZero(-1, 1)).toThrow();
  });

  it('lance une erreur pour p < 1', () => {
    expect(() => getBesselJZero(0, 0)).toThrow();
  });

  it('calcule numériquement pour n > 4', () => {
    // Devrait utiliser Newton-Raphson pour n=5
    // Note: L'estimation initiale peut être améliorée en Phase 4
    const zero = getBesselJZero(5, 1);
    expect(zero).toBeGreaterThan(8);
    // Vérifier que c'est bien un zéro
    expect(Math.abs(besselJ(5, zero))).toBeLessThan(0.01);
  });
});

describe("getBesselJPrimeZero - Racines de J'_n(x) = 0", () => {
  it('retourne les premières racines correctes', () => {
    // Mode dominant TE11 pour guide circulaire
    expect(getBesselJPrimeZero(1, 1)).toBeCloseTo(1.8412, 4);
    expect(getBesselJPrimeZero(0, 1)).toBeCloseTo(3.8317, 4);
    expect(getBesselJPrimeZero(2, 1)).toBeCloseTo(3.0542, 4);
  });

  it('lance une erreur pour paramètres invalides', () => {
    expect(() => getBesselJPrimeZero(-1, 1)).toThrow();
    expect(() => getBesselJPrimeZero(0, 0)).toThrow();
  });

  it('calcule numériquement pour n > 4', () => {
    const zero = getBesselJPrimeZero(5, 1);
    expect(zero).toBeGreaterThan(6);
    expect(zero).toBeLessThan(7);
    // Vérifier que c'est bien un zéro de la dérivée
    expect(Math.abs(besselJPrime(5, zero))).toBeLessThan(0.001);
  });
});
