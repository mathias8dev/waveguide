import { describe, it, expect } from 'vitest';
import { CoaxialWaveguide } from '../CoaxialWaveguide';

describe('CoaxialWaveguide', () => {
  // Câble coaxial typique 50Ω
  const coax50 = new CoaxialWaveguide({
    innerRadius: 0.00091, // ~0.91 mm
    outerRadius: 0.0021,  // ~2.1 mm
  });

  describe('constructeur', () => {
    it('initialise correctement les rayons', () => {
      const g = new CoaxialWaveguide({ innerRadius: 0.001, outerRadius: 0.003 });
      expect(g.innerRadius).toBe(0.001);
      expect(g.outerRadius).toBe(0.003);
    });

    it('lance une erreur si inner >= outer', () => {
      expect(() => new CoaxialWaveguide({
        innerRadius: 0.003,
        outerRadius: 0.002
      })).toThrow();

      expect(() => new CoaxialWaveguide({
        innerRadius: 0.002,
        outerRadius: 0.002
      })).toThrow();
    });

    it('lance une erreur pour rayons négatifs', () => {
      expect(() => new CoaxialWaveguide({
        innerRadius: -0.001,
        outerRadius: 0.003
      })).toThrow();

      expect(() => new CoaxialWaveguide({
        innerRadius: 0.001,
        outerRadius: -0.003
      })).toThrow();
    });

    it('lance une erreur pour rayons nuls', () => {
      expect(() => new CoaxialWaveguide({
        innerRadius: 0,
        outerRadius: 0.003
      })).toThrow();
    });
  });

  describe('mode TEM', () => {
    it('fc = 0 pour le mode TEM', () => {
      const fc = coax50.getCutoffFrequency({ type: 'TEM', m: 0, n: 0 });
      expect(fc).toBe(0);
    });

    it('supporte le mode TEM', () => {
      expect(coax50.isModeSupported({ type: 'TEM', m: 0, n: 0 })).toBe(true);
    });

    it('le mode TEM est toujours propagatif', () => {
      const params = coax50.getCalculatedParams(1e9, { type: 'TEM', m: 0, n: 0 });
      expect(params.isPropagatif).toBe(true);
    });
  });

  describe('impédance caractéristique', () => {
    it('Z0 ≈ 50Ω pour câble 50Ω typique', () => {
      const Z0 = coax50.getCharacteristicImpedance();
      expect(Z0).toBeCloseTo(50, -1); // Dans les 10Ω
    });

    it('Z0 augmente avec ln(b/a)', () => {
      // Z0 = (η0 / 2π) * ln(b/a)
      const coax1 = new CoaxialWaveguide({ innerRadius: 0.001, outerRadius: 0.002 });
      const coax2 = new CoaxialWaveguide({ innerRadius: 0.001, outerRadius: 0.004 });

      const Z1 = coax1.getCharacteristicImpedance();
      const Z2 = coax2.getCharacteristicImpedance();

      // ln(4)/ln(2) = 2, donc Z2/Z1 ≈ 2
      expect(Z2 / Z1).toBeCloseTo(2, 1);
    });
  });

  describe('modes TE et TM', () => {
    it('les modes TE/TM ont fc > 0', () => {
      const fcTE = coax50.getCutoffFrequency({ type: 'TE', m: 1, n: 1 });
      const fcTM = coax50.getCutoffFrequency({ type: 'TM', m: 1, n: 0 });

      expect(fcTE).toBeGreaterThan(0);
      expect(fcTM).toBeGreaterThan(0);
    });

    it('supporte les modes TE avec m >= 1', () => {
      expect(coax50.isModeSupported({ type: 'TE', m: 1, n: 0 })).toBe(true);
      expect(coax50.isModeSupported({ type: 'TE', m: 1, n: 1 })).toBe(true);
    });

    it('supporte les modes TM avec m >= 1', () => {
      expect(coax50.isModeSupported({ type: 'TM', m: 1, n: 0 })).toBe(true);
      expect(coax50.isModeSupported({ type: 'TM', m: 1, n: 1 })).toBe(true);
    });
  });

  describe('modes disponibles', () => {
    it('TEM est le premier mode (fc = 0)', () => {
      const modes = coax50.getAvailableModes();
      expect(modes[0]).toEqual({ type: 'TEM', m: 0, n: 0 });
    });

    it('retourne les modes triés par fréquence de coupure', () => {
      const modes = coax50.getAvailableModes();

      for (let i = 1; i < modes.length; i++) {
        const fc1 = coax50.getCutoffFrequency(modes[i - 1]);
        const fc2 = coax50.getCutoffFrequency(modes[i]);
        expect(fc1).toBeLessThanOrEqual(fc2);
      }
    });
  });

  describe('distribution des champs', () => {
    it('retourne un champ nul à l\'intérieur du conducteur central', () => {
      const field = coax50.getFieldDistribution(
        0.0005, 0, 0, // rho < innerRadius
        { type: 'TEM', m: 0, n: 0 },
        1e9,
        0
      );

      expect(field.E.x).toBe(0);
      expect(field.E.y).toBe(0);
      expect(field.E.z).toBe(0);
    });

    it('retourne un champ nul à l\'extérieur du conducteur externe', () => {
      const field = coax50.getFieldDistribution(
        0.003, 0, 0, // rho > outerRadius
        { type: 'TEM', m: 0, n: 0 },
        1e9,
        0
      );

      expect(field.E.x).toBe(0);
      expect(field.E.y).toBe(0);
      expect(field.E.z).toBe(0);
    });

    it('le champ TEM est radial (Ez = Hz = 0)', () => {
      const field = coax50.getFieldDistribution(
        0.0015, 0, 0, // entre les conducteurs
        { type: 'TEM', m: 0, n: 0 },
        1e9,
        0
      );

      expect(field.E.z).toBe(0);
      expect(field.H.z).toBe(0);
    });

    it('le champ E TEM est radial et H est azimutal', () => {
      const field = coax50.getFieldDistribution(
        0.0015, 0, 0, // Sur l'axe x, entre les conducteurs
        { type: 'TEM', m: 0, n: 0 },
        1e9,
        0
      );

      // Sur l'axe x: E devrait être selon x, H selon y
      // Le rapport |E|/|H| devrait être proche de η0
      const Emag = Math.sqrt(field.E.x ** 2 + field.E.y ** 2);
      const Hmag = Math.sqrt(field.H.x ** 2 + field.H.y ** 2);

      if (Emag > 0 && Hmag > 0) {
        const ratio = Emag / Hmag;
        expect(ratio).toBeCloseTo(376.73, -1); // η0 ≈ 377Ω
      }
    });
  });
});
