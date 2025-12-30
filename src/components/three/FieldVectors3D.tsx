import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '@/stores/simulationStore';

interface FieldVectors3DProps {
  showElectric?: boolean;
  showMagnetic?: boolean;
  animated?: boolean;
}

// Géométries partagées pour les instances
const SHAFT_GEOMETRY = new THREE.CylinderGeometry(0.0003, 0.0003, 0.002, 6);
const HEAD_GEOMETRY = new THREE.ConeGeometry(0.0006, 0.001, 6);

// Décaler la géométrie pour que l'origine soit à la base
SHAFT_GEOMETRY.translate(0, 0.001, 0);
HEAD_GEOMETRY.translate(0, 0.0025, 0);

// Combiner en une seule géométrie de flèche
const ARROW_GEOMETRY = new THREE.BufferGeometry();
const shaftPositions = SHAFT_GEOMETRY.getAttribute('position').array;
const headPositions = HEAD_GEOMETRY.getAttribute('position').array;
const combinedPositions = new Float32Array(shaftPositions.length + headPositions.length);
combinedPositions.set(shaftPositions, 0);
combinedPositions.set(headPositions, shaftPositions.length);
ARROW_GEOMETRY.setAttribute('position', new THREE.BufferAttribute(combinedPositions, 3));

// Matériaux
const ELECTRIC_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#ef4444',
  emissive: '#ff0000',
  emissiveIntensity: 0.3,
  metalness: 0.5,
  roughness: 0.5,
});

const MAGNETIC_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#3b82f6',
  emissive: '#0066ff',
  emissiveIntensity: 0.3,
  metalness: 0.5,
  roughness: 0.5,
});

interface VectorData {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  magnitude: number;
}

/**
 * Composant optimisé pour afficher les vecteurs de champ en 3D
 * Utilise InstancedMesh pour de meilleures performances
 */
export function FieldVectors3D({
  showElectric = true,
  showMagnetic = false,
  animated = true,
}: FieldVectors3DProps) {
  const electricRef = useRef<THREE.InstancedMesh>(null);
  const magneticRef = useRef<THREE.InstancedMesh>(null);

  const waveguide = useSimulationStore((state) => state.waveguide);
  const waveguideInstance = useSimulationStore((state) => state.waveguideInstance);
  const mode = useSimulationStore((state) => state.mode);
  const frequency = useSimulationStore((state) => state.frequency);
  const storeTime = useSimulationStore((state) => state.time);

  // Utiliser le temps animé ou un temps fixe selon la prop
  const time = animated ? storeTime : 0;

  // Calculer les positions de base (indépendantes du temps)
  const gridPositions = useMemo(() => {
    const positions: { x: number; y: number; z: number }[] = [];

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
        return [];
    }

    const resolution = 6;
    const zResolution = 12;

    const dx = (xMax - xMin) / resolution;
    const dy = (yMax - yMin) / resolution;
    const dz = zLength / zResolution;

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        for (let k = 0; k <= zResolution; k++) {
          positions.push({
            x: xMin + i * dx,
            y: yMin + j * dy,
            z: k * dz,
          });
        }
      }
    }

    return positions;
  }, [waveguide]);

  // Calculer les vecteurs de champ
  const vectors = useMemo(() => {
    if (!waveguideInstance || gridPositions.length === 0) {
      return { electric: [] as VectorData[], magnetic: [] as VectorData[] };
    }

    const electric: VectorData[] = [];
    const magnetic: VectorData[] = [];

    let maxE = 0;
    let maxH = 0;

    // Premier passage pour trouver les max
    const fields = gridPositions.map(({ x, y, z }) => {
      const field = waveguideInstance.getFieldDistribution(x, y, z, mode, frequency, time);
      const eMag = Math.sqrt(field.E.x ** 2 + field.E.y ** 2 + field.E.z ** 2);
      const hMag = Math.sqrt(field.H.x ** 2 + field.H.y ** 2 + field.H.z ** 2);

      if (eMag > maxE) maxE = eMag;
      if (hMag > maxH) maxH = hMag;

      return { x, y, z, field, eMag, hMag };
    });

    // Deuxième passage pour créer les vecteurs
    for (const { x, y, z, field, eMag, hMag } of fields) {
      if (showElectric && maxE > 0 && eMag > maxE * 0.08) {
        electric.push({
          position: new THREE.Vector3(x, y, z),
          direction: new THREE.Vector3(field.E.x, field.E.y, field.E.z).normalize(),
          magnitude: eMag / maxE,
        });
      }

      if (showMagnetic && maxH > 0 && hMag > maxH * 0.08) {
        magnetic.push({
          position: new THREE.Vector3(x, y, z),
          direction: new THREE.Vector3(field.H.x, field.H.y, field.H.z).normalize(),
          magnitude: hMag / maxH,
        });
      }
    }

    return { electric, magnetic };
  }, [waveguideInstance, gridPositions, mode, frequency, time, showElectric, showMagnetic]);

  // Mettre à jour les matrices des instances
  useEffect(() => {
    const tempMatrix = new THREE.Matrix4();
    const tempQuaternion = new THREE.Quaternion();
    const upVector = new THREE.Vector3(0, 1, 0);
    const scale = 0.8;

    if (electricRef.current && showElectric) {
      vectors.electric.forEach((vec, i) => {
        tempQuaternion.setFromUnitVectors(upVector, vec.direction);
        const vectorScale = vec.magnitude * scale;

        tempMatrix.compose(
          vec.position,
          tempQuaternion,
          new THREE.Vector3(vectorScale, vectorScale, vectorScale)
        );

        electricRef.current!.setMatrixAt(i, tempMatrix);
      });
      electricRef.current.count = vectors.electric.length;
      electricRef.current.instanceMatrix.needsUpdate = true;
    }

    if (magneticRef.current && showMagnetic) {
      vectors.magnetic.forEach((vec, i) => {
        tempQuaternion.setFromUnitVectors(upVector, vec.direction);
        const vectorScale = vec.magnitude * scale;

        tempMatrix.compose(
          vec.position,
          tempQuaternion,
          new THREE.Vector3(vectorScale, vectorScale, vectorScale)
        );

        magneticRef.current!.setMatrixAt(i, tempMatrix);
      });
      magneticRef.current.count = vectors.magnetic.length;
      magneticRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [vectors, showElectric, showMagnetic]);

  const maxInstances = gridPositions.length;

  return (
    <group>
      {showElectric && (
        <instancedMesh
          ref={electricRef}
          args={[SHAFT_GEOMETRY, ELECTRIC_MATERIAL, maxInstances]}
          frustumCulled={false}
        >
          <primitive object={SHAFT_GEOMETRY} attach="geometry" />
          <primitive object={ELECTRIC_MATERIAL} attach="material" />
        </instancedMesh>
      )}

      {showMagnetic && (
        <instancedMesh
          ref={magneticRef}
          args={[SHAFT_GEOMETRY, MAGNETIC_MATERIAL, maxInstances]}
          frustumCulled={false}
        >
          <primitive object={SHAFT_GEOMETRY} attach="geometry" />
          <primitive object={MAGNETIC_MATERIAL} attach="material" />
        </instancedMesh>
      )}
    </group>
  );
}
