import { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useSimulationStore } from '@/stores/simulationStore';

interface EMWave3DProps {
  showElectric?: boolean;
  showMagnetic?: boolean;
}

/**
 * Visualisation 3D classique d'une onde électromagnétique
 * E (rouge) oscille verticalement, H (vert) oscille horizontalement
 * Les deux sont perpendiculaires et en phase
 */
export function EMWave3D({ showElectric = true, showMagnetic = true }: EMWave3DProps) {
  return (
    <Canvas
      camera={{
        position: [3, 2, 4],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      className="bg-black rounded-lg"
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <EMWaveContent showElectric={showElectric} showMagnetic={showMagnetic} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={2}
        maxDistance={15}
      />
    </Canvas>
  );
}

function EMWaveContent({
  showElectric,
  showMagnetic,
}: {
  showElectric: boolean;
  showMagnetic: boolean;
}) {
  const time = useSimulationStore((state) => state.time);

  const numPoints = 200;
  const waveLength = 8; // Longueur totale en unités
  const amplitude = 1;
  const numWavelengths = 3;

  // Générer les points des courbes E et H
  const { electricPoints, magneticPoints, electricVectors, magneticVectors } = useMemo(() => {
    const ePoints: THREE.Vector3[] = [];
    const hPoints: THREE.Vector3[] = [];
    const eVectors: { start: THREE.Vector3; end: THREE.Vector3; value: number }[] = [];
    const hVectors: { start: THREE.Vector3; end: THREE.Vector3; value: number }[] = [];

    const beta = (2 * Math.PI * numWavelengths) / waveLength;

    for (let i = 0; i <= numPoints; i++) {
      const z = (i / numPoints) * waveLength;
      const phase = time - beta * z;

      // E oscille dans le plan vertical (y)
      const Ey = amplitude * Math.sin(phase);
      ePoints.push(new THREE.Vector3(0, Ey, z));

      // H oscille dans le plan horizontal (x), en phase avec E
      const Hx = amplitude * Math.sin(phase);
      hPoints.push(new THREE.Vector3(Hx, 0, z));
    }

    // Vecteurs à intervalles réguliers
    const numVectors = 30;
    for (let i = 0; i <= numVectors; i++) {
      const z = (i / numVectors) * waveLength;
      const phase = time - beta * z;
      const value = Math.sin(phase);

      // Vecteur E (vertical)
      eVectors.push({
        start: new THREE.Vector3(0, 0, z),
        end: new THREE.Vector3(0, amplitude * value, z),
        value,
      });

      // Vecteur H (horizontal)
      hVectors.push({
        start: new THREE.Vector3(0, 0, z),
        end: new THREE.Vector3(amplitude * value, 0, z),
        value,
      });
    }

    return {
      electricPoints: ePoints,
      magneticPoints: hPoints,
      electricVectors: eVectors,
      magneticVectors: hVectors,
    };
  }, [time]);

  return (
    <group position={[-waveLength / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      {/* Axe de propagation (z) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, -0.5, 0, 0, waveLength + 0.5])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#666666" />
      </line>

      {/* Courbe E (rouge) */}
      {showElectric && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={electricPoints.length}
              array={new Float32Array(electricPoints.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#ff3333" linewidth={2} />
        </line>
      )}

      {/* Courbe H (vert) */}
      {showMagnetic && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={magneticPoints.length}
              array={new Float32Array(magneticPoints.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#33ff33" linewidth={2} />
        </line>
      )}

      {/* Vecteurs E (flèches verticales rouges) */}
      {showElectric &&
        electricVectors.map((v, i) => (
          <group key={`e-${i}`}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={
                    new Float32Array([
                      v.start.x,
                      v.start.y,
                      v.start.z,
                      v.end.x,
                      v.end.y,
                      v.end.z,
                    ])
                  }
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color="#ff3333"
                transparent
                opacity={0.3 + Math.abs(v.value) * 0.7}
              />
            </line>
            {/* Pointe de flèche */}
            {Math.abs(v.value) > 0.2 && (
              <mesh position={[v.end.x, v.end.y, v.end.z]}>
                <coneGeometry args={[0.05, 0.15, 8]} />
                <meshBasicMaterial
                  color="#ff3333"
                  transparent
                  opacity={0.5 + Math.abs(v.value) * 0.5}
                />
              </mesh>
            )}
          </group>
        ))}

      {/* Vecteurs H (flèches horizontales vertes) */}
      {showMagnetic &&
        magneticVectors.map((v, i) => (
          <group key={`h-${i}`}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={
                    new Float32Array([
                      v.start.x,
                      v.start.y,
                      v.start.z,
                      v.end.x,
                      v.end.y,
                      v.end.z,
                    ])
                  }
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color="#33ff33"
                transparent
                opacity={0.3 + Math.abs(v.value) * 0.7}
              />
            </line>
            {/* Pointe de flèche */}
            {Math.abs(v.value) > 0.2 && (
              <mesh
                position={[v.end.x, v.end.y, v.end.z]}
                rotation={[0, 0, v.value > 0 ? -Math.PI / 2 : Math.PI / 2]}
              >
                <coneGeometry args={[0.05, 0.15, 8]} />
                <meshBasicMaterial
                  color="#33ff33"
                  transparent
                  opacity={0.5 + Math.abs(v.value) * 0.5}
                />
              </mesh>
            )}
          </group>
        ))}

      {/* Plans de référence aux extrémités */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshBasicMaterial color="#333333" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.5, 2.5)]} />
        <lineBasicMaterial color="#555555" />
      </lineSegments>

      <mesh position={[0, 0, waveLength]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshBasicMaterial color="#333333" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments position={[0, 0, waveLength]} rotation={[0, Math.PI / 2, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.5, 2.5)]} />
        <lineBasicMaterial color="#555555" />
      </lineSegments>

      {/* Labels */}
      <ArrowHelper
        position={[0, 0, waveLength + 0.8]}
        direction={[0, 0, 1]}
        color="#888888"
        length={0.4}
      />
    </group>
  );
}

function ArrowHelper({
  position,
  direction,
  color,
  length,
}: {
  position: [number, number, number];
  direction: [number, number, number];
  color: string;
  length: number;
}) {
  return (
    <group position={position}>
      <arrowHelper
        args={[
          new THREE.Vector3(...direction).normalize(),
          new THREE.Vector3(0, 0, 0),
          length,
          color,
          length * 0.3,
          length * 0.15,
        ]}
      />
    </group>
  );
}
