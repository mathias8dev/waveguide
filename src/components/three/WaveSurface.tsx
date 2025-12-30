import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '@/stores/simulationStore';

interface WaveSurfaceProps {
  resolution?: number;
  opacity?: number;
  animated?: boolean;
}

/**
 * Visualisation de la surface d'onde se propageant dans le guide
 * Affiche l'amplitude du champ E comme une surface colorée
 */
export function WaveSurface({ resolution = 40, opacity = 0.6, animated = true }: WaveSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const waveguide = useSimulationStore((state) => state.waveguide);
  const waveguideInstance = useSimulationStore((state) => state.waveguideInstance);
  const mode = useSimulationStore((state) => state.mode);
  const frequency = useSimulationStore((state) => state.frequency);
  const storeTime = useSimulationStore((state) => state.time);
  const calculatedParams = useSimulationStore((state) => state.calculatedParams);

  // Utiliser le temps animé ou un temps fixe selon la prop
  const time = animated ? storeTime : 0;

  const geometry = useMemo(() => {
    if (!waveguideInstance || !calculatedParams?.isPropagatif) {
      return null;
    }

    let width: number, zLength: number;

    switch (waveguide.type) {
      case 'rectangular':
        width = waveguide.a;
        zLength = Math.max(waveguide.a, waveguide.b) * 2;
        break;
      case 'circular':
        width = waveguide.radius * 2;
        zLength = waveguide.radius * 4;
        break;
      case 'coaxial':
        width = waveguide.outerRadius * 2;
        zLength = waveguide.outerRadius * 4;
        break;
      default:
        return null;
    }

    const geo = new THREE.PlaneGeometry(width, zLength, resolution, resolution);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, zLength / 2);

    const positions = geo.getAttribute('position');
    const colorArray = new Float32Array(positions.count * 3);

    let maxAmp = 0;
    const amplitudes: number[] = [];

    // Calculer les amplitudes
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      // Calculer le champ au centre du guide (y=0)
      const field = waveguideInstance.getFieldDistribution(x, 0, z, mode, frequency, time);
      const amp = Math.sqrt(field.E.x ** 2 + field.E.y ** 2 + field.E.z ** 2);

      amplitudes.push(amp);
      if (amp > maxAmp) maxAmp = amp;
    }

    // Appliquer les couleurs et déplacer les vertices
    for (let i = 0; i < positions.count; i++) {
      const amp = amplitudes[i];
      const normalizedAmp = maxAmp > 0 ? amp / maxAmp : 0;

      // Déplacer le vertex selon l'amplitude
      const y = positions.getY(i);
      positions.setY(i, y + normalizedAmp * width * 0.3);

      // Couleur: bleu froid -> rouge chaud
      const color = new THREE.Color();
      color.setHSL(0.6 - normalizedAmp * 0.6, 0.8, 0.4 + normalizedAmp * 0.3);

      colorArray[i * 3] = color.r;
      colorArray[i * 3 + 1] = color.g;
      colorArray[i * 3 + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();

    return geo;
  }, [waveguide, waveguideInstance, mode, frequency, time, calculatedParams, resolution]);

  if (!geometry) return null;

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        metalness={0.3}
        roughness={0.6}
      />
    </mesh>
  );
}

interface FieldLinesProps {
  animated?: boolean;
}

/**
 * Lignes de champ animées le long du guide
 */
export function FieldLines({ animated = true }: FieldLinesProps) {
  const waveguide = useSimulationStore((state) => state.waveguide);
  const calculatedParams = useSimulationStore((state) => state.calculatedParams);
  const storeTime = useSimulationStore((state) => state.time);

  // Utiliser le temps animé ou un temps fixe selon la prop
  const time = animated ? storeTime : 0;

  const lines = useMemo(() => {
    if (!calculatedParams?.isPropagatif) return [];

    let zLength: number;
    let yPositions: number[];

    switch (waveguide.type) {
      case 'rectangular':
        zLength = Math.max(waveguide.a, waveguide.b) * 2;
        yPositions = [-waveguide.b * 0.3, 0, waveguide.b * 0.3];
        break;
      case 'circular':
        zLength = waveguide.radius * 4;
        yPositions = [-waveguide.radius * 0.5, 0, waveguide.radius * 0.5];
        break;
      case 'coaxial':
        zLength = waveguide.outerRadius * 4;
        const midRadius = (waveguide.innerRadius + waveguide.outerRadius) / 2;
        yPositions = [-midRadius, 0, midRadius];
        break;
      default:
        return [];
    }

    const beta = calculatedParams.propagationConstant;
    const numPoints = 50;
    const lineData: THREE.Vector3[][] = [];

    for (const y of yPositions) {
      const points: THREE.Vector3[] = [];

      for (let i = 0; i <= numPoints; i++) {
        const z = (i / numPoints) * zLength;
        const phase = time - beta * z;
        const amplitude = Math.sin(phase) * 0.003;

        points.push(new THREE.Vector3(amplitude, y, z));
      }

      lineData.push(points);
    }

    return lineData;
  }, [waveguide, calculatedParams, time]);

  return (
    <group>
      {lines.map((points, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={points.length}
              array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ffaa00" linewidth={2} />
        </line>
      ))}
    </group>
  );
}
