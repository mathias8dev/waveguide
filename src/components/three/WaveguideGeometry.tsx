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
    <mesh position={[0, 0, length / 2]}>
      <boxGeometry args={[a, b, length]} />
      <meshStandardMaterial
        color="#3b82f6"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
      {/* Wireframe pour les arêtes */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(a, b, length)]} />
        <lineBasicMaterial color="#60a5fa" />
      </lineSegments>
    </mesh>
  );
}

function CircularGeometry({ radius }: { radius: number }) {
  const length = radius * 4;

  return (
    <mesh position={[0, 0, length / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[radius, radius, length, 32, 1, true]} />
      <meshStandardMaterial
        color="#3b82f6"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
      {/* Anneaux aux extrémités */}
      <group>
        <mesh position={[0, length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.95, radius, 32]} />
          <meshBasicMaterial color="#60a5fa" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.95, radius, 32]} />
          <meshBasicMaterial color="#60a5fa" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </mesh>
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
      {/* Conducteur externe */}
      <mesh>
        <cylinderGeometry args={[outerRadius, outerRadius, length, 32, 1, true]} />
        <meshStandardMaterial
          color="#3b82f6"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Conducteur interne */}
      <mesh>
        <cylinderGeometry args={[innerRadius, innerRadius, length, 16]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Anneaux aux extrémités */}
      <mesh position={[0, length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, 32]} />
        <meshBasicMaterial color="#60a5fa" side={THREE.DoubleSide} transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, -length / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, 32]} />
        <meshBasicMaterial color="#60a5fa" side={THREE.DoubleSide} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
