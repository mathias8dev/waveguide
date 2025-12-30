import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { WaveguideGeometry } from './WaveguideGeometry';
import { FieldVectors3D } from './FieldVectors3D';

interface WaveguideSceneProps {
  showVectors?: boolean;
  showElectric?: boolean;
  showMagnetic?: boolean;
}

export function WaveguideScene({
  showVectors = true,
  showElectric = true,
  showMagnetic = false,
}: WaveguideSceneProps) {
  return (
    <Canvas
      camera={{ position: [0.05, 0.05, 0.08], fov: 50 }}
      className="bg-slate-900 rounded-lg"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />

      <WaveguideGeometry />

      {showVectors && (
        <FieldVectors3D showElectric={showElectric} showMagnetic={showMagnetic} />
      )}

      <Grid
        args={[0.1, 0.1]}
        cellSize={0.005}
        cellThickness={0.5}
        cellColor="#334155"
        sectionSize={0.02}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={0.2}
        position={[0, -0.02, 0]}
      />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={0.02}
        maxDistance={0.3}
      />

      <axesHelper args={[0.02]} />
    </Canvas>
  );
}
