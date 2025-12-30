import { create } from 'zustand';
import {
  SimulationState,
  Mode,
  AnyWaveguideParams,
  RectangularParams,
  CalculatedParams,
} from '@/types';
import { RectangularWaveguide, CircularWaveguide, CoaxialWaveguide, Waveguide } from '@/engine';

interface SimulationStore extends SimulationState {
  // Paramètres calculés
  calculatedParams: CalculatedParams | null;
  waveguideInstance: Waveguide | null;

  // Actions
  setWaveguideType: (type: AnyWaveguideParams['type']) => void;
  setWaveguideParams: (params: Partial<AnyWaveguideParams>) => void;
  setMode: (mode: Mode) => void;
  setFrequency: (frequency: number) => void;
  setTime: (time: number) => void;
  toggleAnimation: () => void;
  updateCalculatedParams: () => void;
  reset: () => void;
}

const DEFAULT_RECTANGULAR: RectangularParams = {
  type: 'rectangular',
  a: 0.02286, // 22.86mm (standard WR-90)
  b: 0.01016, // 10.16mm
};

const DEFAULT_MODE: Mode = {
  type: 'TE',
  m: 1,
  n: 0,
};

const DEFAULT_FREQUENCY = 10e9; // 10 GHz

function createWaveguideInstance(params: AnyWaveguideParams): Waveguide {
  switch (params.type) {
    case 'rectangular':
      return new RectangularWaveguide({ a: params.a, b: params.b });
    case 'circular':
      return new CircularWaveguide({ radius: params.radius });
    case 'coaxial':
      return new CoaxialWaveguide({
        innerRadius: params.innerRadius,
        outerRadius: params.outerRadius,
      });
    default:
      return new RectangularWaveguide({ a: 0.02286, b: 0.01016 });
  }
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // État initial
  waveguide: DEFAULT_RECTANGULAR,
  mode: DEFAULT_MODE,
  frequency: DEFAULT_FREQUENCY,
  time: 0,
  isAnimating: false,
  calculatedParams: null,
  waveguideInstance: createWaveguideInstance(DEFAULT_RECTANGULAR),

  setWaveguideType: (type) => {
    let newParams: AnyWaveguideParams;

    switch (type) {
      case 'rectangular':
        newParams = {
          type: 'rectangular',
          a: 0.02286,
          b: 0.01016,
        };
        break;
      case 'circular':
        newParams = {
          type: 'circular',
          radius: 0.01,
        };
        break;
      case 'coaxial':
        newParams = {
          type: 'coaxial',
          innerRadius: 0.001,
          outerRadius: 0.003,
        };
        break;
      default:
        return;
    }

    const waveguideInstance = createWaveguideInstance(newParams);
    const availableModes = waveguideInstance.getAvailableModes();
    const mode = availableModes[0] || DEFAULT_MODE;

    set({
      waveguide: newParams,
      waveguideInstance,
      mode,
    });

    get().updateCalculatedParams();
  },

  setWaveguideParams: (params) => {
    const current = get().waveguide;
    const newParams = { ...current, ...params } as AnyWaveguideParams;
    const waveguideInstance = createWaveguideInstance(newParams);

    set({
      waveguide: newParams,
      waveguideInstance,
    });

    get().updateCalculatedParams();
  },

  setMode: (mode) => {
    set({ mode });
    get().updateCalculatedParams();
  },

  setFrequency: (frequency) => {
    set({ frequency });
    get().updateCalculatedParams();
  },

  setTime: (time) => {
    set({ time });
  },

  toggleAnimation: () => {
    set((state) => ({ isAnimating: !state.isAnimating }));
  },

  updateCalculatedParams: () => {
    const { waveguideInstance, mode, frequency } = get();

    if (!waveguideInstance) return;

    const calculatedParams = waveguideInstance.getCalculatedParams(frequency, mode);
    set({ calculatedParams });
  },

  reset: () => {
    const waveguideInstance = createWaveguideInstance(DEFAULT_RECTANGULAR);
    set({
      waveguide: DEFAULT_RECTANGULAR,
      mode: DEFAULT_MODE,
      frequency: DEFAULT_FREQUENCY,
      time: 0,
      isAnimating: false,
      waveguideInstance,
      calculatedParams: waveguideInstance.getCalculatedParams(DEFAULT_FREQUENCY, DEFAULT_MODE),
    });
  },
}));

// Initialiser les paramètres calculés au démarrage
useSimulationStore.getState().updateCalculatedParams();
