import { describe, it, expect } from 'vitest';
import { CircularWaveguide } from '../CircularWaveguide';

describe('CircularWaveguide', () => {
  // Guide circulaire de rayon 1 cm
  const guide = new CircularWaveguide({ radius: 0.01 });

  describe('constructeur', () => {
    it('initialise correctement le rayon', () => {
      const g = new CircularWaveguide({ radius: 0.02 });
      expect(g.radius).toBe(0.02);
    });

    it('lance une erreur pour rayon négatif', () => {
      expect(() => new CircularWaveguide({ radius: -0.01 })).toThrow();
    });

    it('lance une erreur pour rayon nul', () => {
      expect(() => new CircularWaveguide({ radius: 0 })).toThrow();
    });

    it('lance une erreur pour rayon non fini', () => {
      expect(() => new CircularWaveguide({ radius: Infinity })).toThrow();
      expect(() => new CircularWaveguide({ radius: NaN })).toThrow();
    });
  });

  describe('fréquences de coupure', () => {
    it('TE11 est le mode dominant', () => {
      const modes = guide.getAvailableModes();
      const fcTE11 = guide.getCutoffFrequency({ type: 'TE', m: 1, n: 1 });

      // TE11 devrait avoir la plus basse fréquence de coupure
      for (const mode of modes) {
        if (mode.type !== 'TE' || mode.m !== 1 || mode.n !== 1) {
          expect(guide.getCutoffFrequency(mode)).toBeGreaterThanOrEqual(fcTE11);
        }
      }
    });

    it('TM01 a une fc plus élevée que TE11', () => {
      const fcTE11 = guide.getCutoffFrequency({ type: 'TE', m: 1, n: 1 });
      const fcTM01 = guide.getCutoffFrequency({ type: 'TM', m: 1, n: 0 });
      expect(fcTE11).toBeLessThan(fcTM01);
    });

    it('fc est inversement proportionnelle au rayon', () => {
      const guide1 = new CircularWaveguide({ radius: 0.01 });
      const guide2 = new CircularWaveguide({ radius: 0.02 });

      const fc1 = guide1.getCutoffFrequency({ type: 'TE', m: 1, n: 1 });
      const fc2 = guide2.getCutoffFrequency({ type: 'TE', m: 1, n: 1 });

      // fc ∝ 1/a, donc fc1/fc2 ≈ a2/a1 = 2
      expect(fc1 / fc2).toBeCloseTo(2, 1);
    });
  });

  describe('support des modes', () => {
    it('supporte TE11', () => {
      expect(guide.isModeSupported({ type: 'TE', m: 1, n: 1 })).toBe(true);
    });

    it('supporte TM01', () => {
      expect(guide.isModeSupported({ type: 'TM', m: 1, n: 0 })).toBe(true);
    });

    it('ne supporte pas TEM', () => {
      expect(guide.isModeSupported({ type: 'TEM', m: 0, n: 0 })).toBe(false);
    });

    it('ne supporte pas les modes avec m < 1', () => {
      expect(guide.isModeSupported({ type: 'TE', m: 0, n: 0 })).toBe(false);
      expect(guide.isModeSupported({ type: 'TM', m: 0, n: 1 })).toBe(false);
    });
  });

  describe('modes disponibles', () => {
    it('retourne les modes triés par fréquence de coupure', () => {
      const modes = guide.getAvailableModes();

      for (let i = 1; i < modes.length; i++) {
        const fc1 = guide.getCutoffFrequency(modes[i - 1]);
        const fc2 = guide.getCutoffFrequency(modes[i]);
        expect(fc1).toBeLessThanOrEqual(fc2);
      }
    });
  });

  describe('distribution des champs', () => {
    it('retourne un champ nul à l\'extérieur du guide', () => {
      const field = guide.getFieldDistribution(
        0.02, 0, 0, // rho > radius
        { type: 'TE', m: 1, n: 1 },
        15e9,
        0
      );

      expect(field.E.x).toBe(0);
      expect(field.E.y).toBe(0);
      expect(field.E.z).toBe(0);
      expect(field.H.x).toBe(0);
      expect(field.H.y).toBe(0);
      expect(field.H.z).toBe(0);
    });

    it('retourne un champ non nul à l\'intérieur pour mode propagatif', () => {
      const field = guide.getFieldDistribution(
        0.005, 0, 0, // rho < radius
        { type: 'TE', m: 1, n: 1 },
        15e9, // f > fc
        0
      );

      // Au moins une composante devrait être non nulle
      const hasNonZero =
        field.E.x !== 0 ||
        field.E.y !== 0 ||
        field.E.z !== 0 ||
        field.H.x !== 0 ||
        field.H.y !== 0 ||
        field.H.z !== 0;

      expect(hasNonZero).toBe(true);
    });

    it('Ez = 0 pour mode TE', () => {
      const field = guide.getFieldDistribution(
        0.005, 0, 0,
        { type: 'TE', m: 1, n: 1 },
        15e9,
        0
      );

      expect(field.E.z).toBe(0);
    });

    it('Hz = 0 pour mode TM', () => {
      const field = guide.getFieldDistribution(
        0.005, 0, 0,
        { type: 'TM', m: 1, n: 0 },
        25e9, // Fréquence assez haute pour que TM01 se propage
        0
      );

      expect(field.H.z).toBe(0);
    });
  });
});
