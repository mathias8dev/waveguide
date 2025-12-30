import { useMemo } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '@/stores/simulationStore';

export function WaveguideGeometry() {
  const waveguide = useSimulationStore((state) => state.waveguide);

  const geometry = useMemo(() => {
    switch (waveguide.type) {
      case 'rectangular':
        return <RectangularGeometry a={waveguide.a} b={waveguide.b} />;
      case 'circular':
        return <CircularGeometry radius={waveguide.radius} />;
      case 'coaxial':
        return (
          <CoaxialGeometry
            innerRadius={waveguide.innerRadius}
            outerRadius={waveguide.outerRadius}
          />
        );
      default:
        return null;
    }
  }, [waveguide]);

  return <>{geometry}</>;
}

function RectangularGeometry({ a, b }: { a: number; b: number }) {
  const length = Math.max(a, b) * 2;

  return (
    <group position={[0, 0, length / 2]}>
      {/* Parois du guide - effet verre */}
      <mesh>
        <boxGeometry args={[a, b, length]} />
        <meshPhysicalMaterial
          color="#4a90d9"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.1}
          transmission={0.6}
          thickness={0.5}
        />
      </mesh>
      {/* Wireframe pour les arêtes - brillant */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(a, b, length)]} />
        <lineBasicMaterial color="#7cb3f0" linewidth={2} />
      </lineSegments>
      {/* Cadres métalliques aux extrémités */}
      <mesh position={[0, 0, -length / 2]}>
        <boxGeometry args={[a * 1.02, b * 1.02, 0.001]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, length / 2]}>
        <boxGeometry args={[a * 1.02, b * 1.02, 0.001]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function CircularGeometry({ radius }: { radius: number }) {
  const length = radius * 4;

  return (
    <group position={[0, 0, length / 2]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Paroi cylindrique - effet verre */}
      <mesh>
        <cylinderGeometry args={[radius, radius, length, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#4a90d9"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.1}
          transmission={0.6}
          thickness={0.5}
        />
      </mesh>
      {/* Anneaux métalliques aux extrémités */}
      <mesh position={[0, length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.0005, 8, 48]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, -length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.0005, 8, 48]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

function CoaxialGeometry({
  innerRadius,
  outerRadius,
}: {
  innerRadius: number;
  outerRadius: number;
}) {
  const length = outerRadius * 4;

  return (
    <group position={[0, 0, length / 2]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Conducteur externe - effet verre métallique */}
      <mesh>
        <cylinderGeometry args={[outerRadius, outerRadius, length, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#4a90d9"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          metalness={0.1}
          roughness={0.1}
          transmission={0.6}
          thickness={0.5}
        />
      </mesh>

      {/* Conducteur interne - cuivre brillant */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, length, 32]} />
        <meshStandardMaterial
          color="#d97706"
          metalness={0.95}
          roughness={0.15}
          emissive="#d97706"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Anneaux métalliques aux extrémités */}
      <mesh position={[0, length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[outerRadius, 0.0005, 8, 48]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, -length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[outerRadius, 0.0005, 8, 48]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Isolants aux extrémités */}
      <mesh position={[0, length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius * 1.1, outerRadius * 0.9, 48]} />
        <meshStandardMaterial
          color="#1e3a5f"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, -length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius * 1.1, outerRadius * 0.9, 48]} />
        <meshStandardMaterial
          color="#1e3a5f"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
