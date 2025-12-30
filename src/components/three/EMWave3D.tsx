import { useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useSimulationStore } from '@/stores/simulationStore';
import { Mode } from '@/types';

interface EMWave3DProps {
  showElectric?: boolean;
  showMagnetic?: boolean;
}

/**
 * Visualisation 3D classique d'une onde électromagnétique
 * E (rouge) oscille verticalement, H (bleu) oscille horizontalement
 * Les deux sont perpendiculaires et en phase
 *
 * La forme d'onde dépend du mode de propagation:
 * - TE/TM avec n=0: une seule sinusoïde au centre
 * - TE/TM avec n>0: plusieurs sinusoïdes montrant la variation transversale
 * - TEM: distribution uniforme
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

/**
 * Calcule le facteur de modulation transversale selon le mode
 */
function getTransverseModulation(mode: Mode, yNormalized: number): number {
  const { type, n } = mode;

  if (type === 'TEM') {
    return 1;
  }

  if (n === 0) {
    return 1;
  }

  // Pour n > 0, le champ varie sinusoïdalement en y
  return Math.sin(n * Math.PI * yNormalized);
}

function EMWaveContent({
  showElectric,
  showMagnetic,
}: {
  showElectric: boolean;
  showMagnetic: boolean;
}) {
  const time = useSimulationStore((state) => state.time);
  const mode = useSimulationStore((state) => state.mode);

  const numPoints = 200;
  const waveLength = 8;
  const baseAmplitude = 1;
  const numWavelengths = 3;

  // Nombre de courbes selon le mode
  const numLayers = mode.n === 0 ? 1 : Math.min(mode.n + 1, 3);

  // Positions y normalisées pour les différentes couches
  const yPositions = useMemo(() => {
    const positions: number[] = [];
    if (numLayers === 1) {
      positions.push(0.5);
    } else {
      for (let i = 0; i < numLayers; i++) {
        positions.push((i + 1) / (numLayers + 1));
      }
    }
    return positions;
  }, [numLayers]);

  // Générer les points des courbes E et H pour chaque couche
  const layers = useMemo(() => {
    const beta = (2 * Math.PI * numWavelengths) / waveLength;
    const result: Array<{
      yOffset: number;
      modulation: number;
      electricPoints: THREE.Vector3[];
      magneticPoints: THREE.Vector3[];
      electricVectors: Array<{ start: THREE.Vector3; end: THREE.Vector3; value: number }>;
      magneticVectors: Array<{ start: THREE.Vector3; end: THREE.Vector3; value: number }>;
    }> = [];

    for (const yNorm of yPositions) {
      const modulation = getTransverseModulation(mode, yNorm);
      const amplitude = baseAmplitude * Math.abs(modulation);
      const sign = modulation >= 0 ? 1 : -1;
      // Décalage en y pour séparer visuellement les couches
      const yOffset = (yNorm - 0.5) * 2; // Entre -1 et 1

      const ePoints: THREE.Vector3[] = [];
      const hPoints: THREE.Vector3[] = [];
      const eVectors: Array<{ start: THREE.Vector3; end: THREE.Vector3; value: number }> = [];
      const hVectors: Array<{ start: THREE.Vector3; end: THREE.Vector3; value: number }> = [];

      for (let i = 0; i <= numPoints; i++) {
        const z = (i / numPoints) * waveLength;
        const phase = time - beta * z;

        // E oscille dans le plan vertical (y)
        const Ey = amplitude * Math.sin(phase) * sign;
        ePoints.push(new THREE.Vector3(0, Ey + yOffset, z));

        // H oscille dans le plan horizontal (x), en phase avec E
        const Hx = amplitude * Math.sin(phase) * sign;
        hPoints.push(new THREE.Vector3(Hx, yOffset, z));
      }

      // Vecteurs à intervalles réguliers
      const numVectors = 30;
      for (let i = 0; i <= numVectors; i++) {
        const z = (i / numVectors) * waveLength;
        const phase = time - beta * z;
        const value = Math.sin(phase) * sign;

        // Vecteur E (vertical)
        eVectors.push({
          start: new THREE.Vector3(0, yOffset, z),
          end: new THREE.Vector3(0, amplitude * value + yOffset, z),
          value: value * modulation,
        });

        // Vecteur H (horizontal)
        hVectors.push({
          start: new THREE.Vector3(0, yOffset, z),
          end: new THREE.Vector3(amplitude * value, yOffset, z),
          value: value * modulation,
        });
      }

      result.push({
        yOffset,
        modulation,
        electricPoints: ePoints,
        magneticPoints: hPoints,
        electricVectors: eVectors,
        magneticVectors: hVectors,
      });
    }

    return result;
  }, [time, mode, yPositions]);

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

      {/* Label du mode */}
      <Text
        position={[0, 1.8, waveLength / 2]}
        fontSize={0.3}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        Mode {mode.type}{mode.m}{mode.n}
      </Text>

      {/* Courbes et vecteurs pour chaque couche */}
      {layers.map((layer, layerIdx) => {
        const opacity = numLayers === 1 ? 1 : 0.4 + 0.6 * Math.abs(layer.modulation);

        return (
          <group key={`layer-${layerIdx}`}>
            {/* Courbe E (rouge) */}
            {showElectric && (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={layer.electricPoints.length}
                    array={new Float32Array(layer.electricPoints.flatMap((p) => [p.x, p.y, p.z]))}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#ff3333" transparent opacity={opacity} />
              </line>
            )}

            {/* Courbe H (bleu) */}
            {showMagnetic && (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={layer.magneticPoints.length}
                    array={new Float32Array(layer.magneticPoints.flatMap((p) => [p.x, p.y, p.z]))}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#3388ff" transparent opacity={opacity} />
              </line>
            )}

            {/* Vecteurs E (flèches verticales rouges) - seulement tous les 3 pour réduire le nombre */}
            {showElectric &&
              layer.electricVectors
                .filter((_, i) => i % 3 === 0)
                .map((v, i) => (
                  <group key={`e-${layerIdx}-${i}`}>
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
                        opacity={(0.3 + Math.abs(v.value) * 0.7) * opacity}
                      />
                    </line>
                    {/* Pointe de flèche */}
                    {Math.abs(v.value) > 0.2 && (
                      <mesh position={[v.end.x, v.end.y, v.end.z]}>
                        <coneGeometry args={[0.05, 0.15, 8]} />
                        <meshBasicMaterial
                          color="#ff3333"
                          transparent
                          opacity={(0.5 + Math.abs(v.value) * 0.5) * opacity}
                        />
                      </mesh>
                    )}
                  </group>
                ))}

            {/* Vecteurs H (flèches horizontales bleues) */}
            {showMagnetic &&
              layer.magneticVectors
                .filter((_, i) => i % 3 === 0)
                .map((v, i) => (
                  <group key={`h-${layerIdx}-${i}`}>
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
                        color="#3388ff"
                        transparent
                        opacity={(0.3 + Math.abs(v.value) * 0.7) * opacity}
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
                          color="#3388ff"
                          transparent
                          opacity={(0.5 + Math.abs(v.value) * 0.5) * opacity}
                        />
                      </mesh>
                    )}
                  </group>
                ))}
          </group>
        );
      })}

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

      {/* Légende */}
      {showElectric && (
        <Text
          position={[-1.5, -1.5, waveLength / 2]}
          fontSize={0.2}
          color="#ff3333"
          anchorX="left"
          anchorY="middle"
        >
          E (électrique)
        </Text>
      )}
      {showMagnetic && (
        <Text
          position={[-1.5, -1.8, waveLength / 2]}
          fontSize={0.2}
          color="#3388ff"
          anchorX="left"
          anchorY="middle"
        >
          H (magnétique)
        </Text>
      )}

      {/* Indicateur de direction de propagation */}
      <ArrowHelper
        position={[0, 0, waveLength + 0.8]}
        direction={[0, 0, 1]}
        color="#888888"
        length={0.4}
      />
      <Text
        position={[0, -0.3, waveLength + 1.2]}
        fontSize={0.2}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        z
      </Text>
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
