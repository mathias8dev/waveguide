import { describe, it, expect } from 'vitest';
import { RectangularWaveguide } from '../RectangularWaveguide';

describe('RectangularWaveguide', () => {
  // Guide WR-90: a=22.86mm, b=10.16mm - Standard X-band
  const wr90 = new RectangularWaveguide({ a: 0.02286, b: 0.01016 });

  describe('constructeur', () => {
    it('normalise les dimensions (a >= b)', () => {
      const guide = new RectangularWaveguide({ a: 0.01, b: 0.02 });
      expect(guide.a).toBe(0.02);
      expect(guide.b).toBe(0.01);
    });

    it('lance une erreur pour dimensions négatives', () => {
      expect(() => new RectangularWaveguide({ a: -0.01, b: 0.01 })).toThrow();
      expect(() => new RectangularWaveguide({ a: 0.01, b: -0.01 })).toThrow();
    });

    it('lance une erreur pour dimensions nulles', () => {
      expect(() => new RectangularWaveguide({ a: 0, b: 0.01 })).toThrow();
      expect(() => new RectangularWaveguide({ a: 0.01, b: 0 })).toThrow();
    });

    it('lance une erreur pour dimensions non finies', () => {
      expect(() => new RectangularWaveguide({ a: Infinity, b: 0.01 })).toThrow();
      expect(() => new RectangularWaveguide({ a: NaN, b: 0.01 })).toThrow();
    });
  });

  describe('fréquences de coupure', () => {
    it('TE10 cutoff ≈ 6.56 GHz pour WR-90', () => {
      const fc = wr90.getCutoffFrequency({ type: 'TE', m: 1, n: 0 });
      expect(fc / 1e9).toBeCloseTo(6.56, 1);
    });

    it('TE20 cutoff ≈ 13.12 GHz pour WR-90', () => {
      const fc = wr90.getCutoffFrequency({ type: 'TE', m: 2, n: 0 });
      expect(fc / 1e9).toBeCloseTo(13.12, 1);
    });

    it('TE01 cutoff ≈ 14.76 GHz pour WR-90', () => {
      const fc = wr90.getCutoffFrequency({ type: 'TE', m: 0, n: 1 });
      expect(fc / 1e9).toBeCloseTo(14.76, 1);
    });

    it('TM11 a la même fc que TE11', () => {
      const fcTE = wr90.getCutoffFrequency({ type: 'TE', m: 1, n: 1 });
      const fcTM = wr90.getCutoffFrequency({ type: 'TM', m: 1, n: 1 });
      expect(fcTE).toBeCloseTo(fcTM, 6);
    });

    it('TE10 est le mode dominant (fc la plus basse)', () => {
      const fcTE10 = wr90.getCutoffFrequency({ type: 'TE', m: 1, n: 0 });
      const fcTE01 = wr90.getCutoffFrequency({ type: 'TE', m: 0, n: 1 });
      const fcTE20 = wr90.getCutoffFrequency({ type: 'TE', m: 2, n: 0 });
      const fcTM11 = wr90.getCutoffFrequency({ type: 'TM', m: 1, n: 1 });

      expect(fcTE10).toBeLessThan(fcTE01);
      expect(fcTE10).toBeLessThan(fcTE20);
      expect(fcTE10).toBeLessThan(fcTM11);
    });
  });

  describe('support des modes', () => {
    it('supporte TE10', () => {
      expect(wr90.isModeSupported({ type: 'TE', m: 1, n: 0 })).toBe(true);
    });

    it('supporte TE01', () => {
      expect(wr90.isModeSupported({ type: 'TE', m: 0, n: 1 })).toBe(true);
    });

    it('supporte TM11', () => {
      expect(wr90.isModeSupported({ type: 'TM', m: 1, n: 1 })).toBe(true);
    });

    it('ne supporte pas TE00', () => {
      expect(wr90.isModeSupported({ type: 'TE', m: 0, n: 0 })).toBe(false);
    });

    it('ne supporte pas TM10 (m et n doivent être >= 1 pour TM)', () => {
      expect(wr90.isModeSupported({ type: 'TM', m: 1, n: 0 })).toBe(false);
      expect(wr90.isModeSupported({ type: 'TM', m: 0, n: 1 })).toBe(false);
    });

    it('ne supporte pas TEM', () => {
      expect(wr90.isModeSupported({ type: 'TEM', m: 0, n: 0 })).toBe(false);
    });
  });

  describe('modes disponibles', () => {
    it('retourne les modes triés par fréquence de coupure', () => {
      const modes = wr90.getAvailableModes();

      for (let i = 1; i < modes.length; i++) {
        const fc1 = wr90.getCutoffFrequency(modes[i - 1]);
        const fc2 = wr90.getCutoffFrequency(modes[i]);
        expect(fc1).toBeLessThanOrEqual(fc2);
      }
    });

    it('le premier mode est TE10', () => {
      const modes = wr90.getAvailableModes();
      expect(modes[0]).toEqual({ type: 'TE', m: 1, n: 0 });
    });
  });

  describe('paramètres calculés', () => {
    it('mode propagatif quand f > fc', () => {
      const params = wr90.getCalculatedParams(10e9, { type: 'TE', m: 1, n: 0 });
      expect(params.isPropagatif).toBe(true);
      expect(params.propagationConstant).toBeGreaterThan(0);
    });

    it('mode évanescent quand f < fc', () => {
      const params = wr90.getCalculatedParams(5e9, { type: 'TE', m: 1, n: 0 });
      expect(params.isPropagatif).toBe(false);
    });

    it('vitesse de phase > c pour mode propagatif', () => {
      const params = wr90.getCalculatedParams(10e9, { type: 'TE', m: 1, n: 0 });
      expect(params.phaseVelocity).toBeGreaterThan(299792458);
    });

    it('vitesse de groupe < c pour mode propagatif', () => {
      const params = wr90.getCalculatedParams(10e9, { type: 'TE', m: 1, n: 0 });
      expect(params.groupVelocity).toBeLessThan(299792458);
    });

    it('vp * vg = c² (relation de dispersion)', () => {
      const params = wr90.getCalculatedParams(10e9, { type: 'TE', m: 1, n: 0 });
      const c = 299792458;
      expect(params.phaseVelocity * params.groupVelocity).toBeCloseTo(c * c, -10);
    });
  });
});
