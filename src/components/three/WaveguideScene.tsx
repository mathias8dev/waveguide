import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows } from '@react-three/drei';
import { WaveguideGeometry } from './WaveguideGeometry';
import { FieldVectors3D } from './FieldVectors3D';
import { WaveSurface, FieldLines } from './WaveSurface';

interface WaveguideSceneProps {
  showVectors?: boolean;
  showElectric?: boolean;
  showMagnetic?: boolean;
  showWaveSurface?: boolean;
  showFieldLines?: boolean;
  autoRotate?: boolean;
  animateVectors?: boolean;
  animateWaves?: boolean;
}

/**
 * Scène 3D principale pour la visualisation du guide d'onde
 */
export function WaveguideScene({
  showVectors = true,
  showElectric = true,
  showMagnetic = false,
  showWaveSurface = false,
  showFieldLines = true,
  autoRotate = false,
  animateVectors = true,
  animateWaves = true,
}: WaveguideSceneProps) {
  return (
    <Canvas
      camera={{
        position: [0.06, 0.04, 0.08],
        fov: 45,
        near: 0.0001,  // Plan proche à 0.1mm pour éviter le clipping en zoom
        far: 10        // Plan éloigné à 10m
      }}
      className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg"
      shadows
    >
      <Suspense fallback={null}>
        <SceneContent
          showVectors={showVectors}
          showElectric={showElectric}
          showMagnetic={showMagnetic}
          showWaveSurface={showWaveSurface}
          showFieldLines={showFieldLines}
          autoRotate={autoRotate}
          animateVectors={animateVectors}
          animateWaves={animateWaves}
        />
      </Suspense>
    </Canvas>
  );
}

function SceneContent({
  showVectors,
  showElectric,
  showMagnetic,
  showWaveSurface,
  showFieldLines,
  autoRotate,
  animateVectors,
  animateWaves,
}: {
  showVectors: boolean;
  showElectric: boolean;
  showMagnetic: boolean;
  showWaveSurface: boolean;
  showFieldLines: boolean;
  autoRotate: boolean;
  animateVectors: boolean;
  animateWaves: boolean;
}) {
  return (
    <>
      {/* Éclairage amélioré */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#88aaff" />
      <pointLight position={[0, 0.05, 0.05]} intensity={0.3} color="#ffaa44" />

      {/* Guide d'onde */}
      <WaveguideGeometry />

      {/* Vecteurs de champ */}
      {showVectors && (
        <FieldVectors3D
          showElectric={showElectric}
          showMagnetic={showMagnetic}
          animated={animateVectors}
        />
      )}

      {/* Surface d'onde */}
      {showWaveSurface && <WaveSurface resolution={30} opacity={0.5} animated={animateWaves} />}

      {/* Lignes de champ */}
      {showFieldLines && <FieldLines animated={animateWaves} />}

      {/* Grille de référence */}
      <Grid
        args={[0.15, 0.15]}
        cellSize={0.005}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={0.02}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={0.25}
        position={[0, -0.025, 0.03]}
        infiniteGrid
      />

      {/* Ombres de contact */}
      <ContactShadows
        position={[0, -0.025, 0.03]}
        opacity={0.4}
        scale={0.15}
        blur={2}
        far={0.1}
      />

      {/* Contrôles de caméra */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={0.005}  // Permet de zoomer très près (5mm)
        maxDistance={0.5}
        autoRotate={autoRotate}
        autoRotateSpeed={1}
        maxPolarAngle={Math.PI * 0.85}
      />

      {/* Axes de référence */}
      <axesHelper args={[0.015]} />

      {/* Labels des axes */}
      <AxisLabels />
    </>
  );
}

/**
 * Labels pour les axes X, Y, Z
 */
function AxisLabels() {
  return (
    <group>
      {/* Flèche Z (direction de propagation) */}
      <mesh position={[0, -0.02, 0.08]}>
        <coneGeometry args={[0.002, 0.005, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/**
 * Composant de contrôle pour la vue 3D
 */
export function View3DControls({
  onToggleVectors,
  onToggleElectric,
  onToggleMagnetic,
  onToggleWaveSurface,
  onToggleFieldLines,
  onToggleAutoRotate,
  showVectors,
  showElectric,
  showMagnetic,
  showWaveSurface,
  showFieldLines,
  autoRotate,
}: {
  onToggleVectors: () => void;
  onToggleElectric: () => void;
  onToggleMagnetic: () => void;
  onToggleWaveSurface: () => void;
  onToggleFieldLines: () => void;
  onToggleAutoRotate: () => void;
  showVectors: boolean;
  showElectric: boolean;
  showMagnetic: boolean;
  showWaveSurface: boolean;
  showFieldLines: boolean;
  autoRotate: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-800/50 rounded-lg">
      <ToggleButton active={showVectors} onClick={onToggleVectors}>
        Vecteurs
      </ToggleButton>
      <ToggleButton active={showElectric} onClick={onToggleElectric} disabled={!showVectors}>
        Champ E
      </ToggleButton>
      <ToggleButton active={showMagnetic} onClick={onToggleMagnetic} disabled={!showVectors}>
        Champ H
      </ToggleButton>
      <ToggleButton active={showWaveSurface} onClick={onToggleWaveSurface}>
        Surface
      </ToggleButton>
      <ToggleButton active={showFieldLines} onClick={onToggleFieldLines}>
        Lignes
      </ToggleButton>
      <ToggleButton active={autoRotate} onClick={onToggleAutoRotate}>
        Rotation
      </ToggleButton>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1 text-xs font-medium rounded transition-colors
        ${active
          ? 'bg-blue-600 text-white'
          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}
