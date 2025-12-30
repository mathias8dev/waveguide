import { useMemo } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { FieldVector } from '@/types';

interface FieldDataPoint {
  x: number;
  y: number;
  field: FieldVector;
}

interface UseFieldDataOptions {
  resolution?: number;
  z?: number;
}

/**
 * Hook pour calculer les données de champ pour la visualisation
 */
export function useFieldData(options: UseFieldDataOptions = {}) {
  const { resolution = 20, z = 0 } = options;

  const waveguide = useSimulationStore((state) => state.waveguide);
  const waveguideInstance = useSimulationStore((state) => state.waveguideInstance);
  const mode = useSimulationStore((state) => state.mode);
  const frequency = useSimulationStore((state) => state.frequency);
  const time = useSimulationStore((state) => state.time);

  const fieldData = useMemo(() => {
    if (!waveguideInstance) return [];

    const data: FieldDataPoint[] = [];

    let xMin: number, xMax: number, yMin: number, yMax: number;

    switch (waveguide.type) {
      case 'rectangular':
        xMin = -waveguide.a / 2;
        xMax = waveguide.a / 2;
        yMin = -waveguide.b / 2;
        yMax = waveguide.b / 2;
        break;
      case 'circular':
        xMin = -waveguide.radius;
        xMax = waveguide.radius;
        yMin = -waveguide.radius;
        yMax = waveguide.radius;
        break;
      case 'coaxial':
        xMin = -waveguide.outerRadius;
        xMax = waveguide.outerRadius;
        yMin = -waveguide.outerRadius;
        yMax = waveguide.outerRadius;
        break;
      default:
        return [];
    }

    const dx = (xMax - xMin) / resolution;
    const dy = (yMax - yMin) / resolution;

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = xMin + i * dx;
        const y = yMin + j * dy;

        const field = waveguideInstance.getFieldDistribution(x, y, z, mode, frequency, time);

        data.push({ x, y, field });
      }
    }

    return data;
  }, [waveguide, waveguideInstance, mode, frequency, time, resolution, z]);

  // Trouver les valeurs max pour la normalisation
  const maxValues = useMemo(() => {
    let maxE = 0;
    let maxH = 0;

    for (const point of fieldData) {
      const eMag = Math.sqrt(
        point.field.E.x ** 2 + point.field.E.y ** 2 + point.field.E.z ** 2
      );
      const hMag = Math.sqrt(
        point.field.H.x ** 2 + point.field.H.y ** 2 + point.field.H.z ** 2
      );

      if (eMag > maxE) maxE = eMag;
      if (hMag > maxH) maxH = hMag;
    }

    return { maxE, maxH };
  }, [fieldData]);

  return { fieldData, maxValues };
}
