import { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '@/stores/simulationStore';

interface FieldVectors3DProps {
  showElectric?: boolean;
  showMagnetic?: boolean;
}

export function FieldVectors3D({
  showElectric = true,
  showMagnetic = false,
}: FieldVectors3DProps) {
  const waveguide = useSimulationStore((state) => state.waveguide);
  const waveguideInstance = useSimulationStore((state) => state.waveguideInstance);
  const mode = useSimulationStore((state) => state.mode);
  const frequency = useSimulationStore((state) => state.frequency);
  const time = useSimulationStore((state) => state.time);

  const vectors = useMemo(() => {
    if (!waveguideInstance) return { electric: [], magnetic: [] };

    const electric: { position: THREE.Vector3; direction: THREE.Vector3; magnitude: number }[] = [];
    const magnetic: { position: THREE.Vector3; direction: THREE.Vector3; magnitude: number }[] = [];

    let xMin: number, xMax: number, yMin: number, yMax: number, zLength: number;

    switch (waveguide.type) {
      case 'rectangular':
        xMin = -waveguide.a / 2;
        xMax = waveguide.a / 2;
        yMin = -waveguide.b / 2;
        yMax = waveguide.b / 2;
        zLength = Math.max(waveguide.a, waveguide.b) * 2;
        break;
      case 'circular':
        xMin = -waveguide.radius;
        xMax = waveguide.radius;
        yMin = -waveguide.radius;
        yMax = waveguide.radius;
        zLength = waveguide.radius * 4;
        break;
      case 'coaxial':
        xMin = -waveguide.outerRadius;
        xMax = waveguide.outerRadius;
        yMin = -waveguide.outerRadius;
        yMax = waveguide.outerRadius;
        zLength = waveguide.outerRadius * 4;
        break;
      default:
        return { electric: [], magnetic: [] };
    }

    const resolution = 8;
    const zResolution = 10;

    const dx = (xMax - xMin) / resolution;
    const dy = (yMax - yMin) / resolution;
    const dz = zLength / zResolution;

    let maxE = 0;
    let maxH = 0;

    // Premier passage pour trouver les max
    const tempData: { x: number; y: number; z: number; field: ReturnType<typeof waveguideInstance.getFieldDistribution> }[] = [];

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        for (let k = 0; k <= zResolution; k++) {
          const x = xMin + i * dx;
          const y = yMin + j * dy;
          const z = k * dz;

          const field = waveguideInstance.getFieldDistribution(x, y, z, mode, frequency, time);

          const eMag = Math.sqrt(field.E.x ** 2 + field.E.y ** 2 + field.E.z ** 2);
          const hMag = Math.sqrt(field.H.x ** 2 + field.H.y ** 2 + field.H.z ** 2);

          if (eMag > maxE) maxE = eMag;
          if (hMag > maxH) maxH = hMag;

          tempData.push({ x, y, z, field });
        }
      }
    }

    // Deuxième passage pour créer les vecteurs normalisés
    for (const { x, y, z, field } of tempData) {
      if (showElectric && maxE > 0) {
        const eMag = Math.sqrt(field.E.x ** 2 + field.E.y ** 2 + field.E.z ** 2);

        if (eMag > maxE * 0.05) {
          electric.push({
            position: new THREE.Vector3(x, y, z),
            direction: new THREE.Vector3(field.E.x, field.E.y, field.E.z).normalize(),
            magnitude: eMag / maxE,
          });
        }
      }

      if (showMagnetic && maxH > 0) {
        const hMag = Math.sqrt(field.H.x ** 2 + field.H.y ** 2 + field.H.z ** 2);

        if (hMag > maxH * 0.05) {
          magnetic.push({
            position: new THREE.Vector3(x, y, z),
            direction: new THREE.Vector3(field.H.x, field.H.y, field.H.z).normalize(),
            magnitude: hMag / maxH,
          });
        }
      }
    }

    return { electric, magnetic };
  }, [waveguide, waveguideInstance, mode, frequency, time, showElectric, showMagnetic]);

  const scale = 0.003; // Échelle des vecteurs

  return (
    <group>
      {/* Vecteurs du champ électrique */}
      {vectors.electric.map((vec, i) => (
        <Arrow
          key={`e-${i}`}
          position={vec.position}
          direction={vec.direction}
          length={vec.magnitude * scale}
          color="#ef4444"
        />
      ))}

      {/* Vecteurs du champ magnétique */}
      {vectors.magnetic.map((vec, i) => (
        <Arrow
          key={`h-${i}`}
          position={vec.position}
          direction={vec.direction}
          length={vec.magnitude * scale}
          color="#3b82f6"
        />
      ))}
    </group>
  );
}

interface ArrowProps {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  color: string;
}

function Arrow({ position, direction, length, color }: ArrowProps) {
  const quaternion = useMemo(() => {
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    return quaternion;
  }, [direction]);

  const shaftLength = length * 0.7;
  const headLength = length * 0.3;
  const shaftRadius = length * 0.05;
  const headRadius = length * 0.15;

  return (
    <group position={position} quaternion={quaternion}>
      {/* Shaft */}
      <mesh position={[0, shaftLength / 2, 0]}>
        <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Head */}
      <mesh position={[0, shaftLength + headLength / 2, 0]}>
        <coneGeometry args={[headRadius, headLength, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
