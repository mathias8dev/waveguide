import { Toggle, Card } from '@/components/ui';

interface VisualizationControlsProps {
  showElectric: boolean;
  showMagnetic: boolean;
  showVectors: boolean;
  show3D: boolean;
  onShowElectricChange: (value: boolean) => void;
  onShowMagneticChange: (value: boolean) => void;
  onShowVectorsChange: (value: boolean) => void;
  onShow3DChange: (value: boolean) => void;
}

export function VisualizationControls({
  showElectric,
  showMagnetic,
  showVectors,
  show3D,
  onShowElectricChange,
  onShowMagneticChange,
  onShowVectorsChange,
  onShow3DChange,
}: VisualizationControlsProps) {
  return (
    <Card title="Options de Visualisation">
      <div className="space-y-3">
        <Toggle
          label="Champ électrique (E)"
          checked={showElectric}
          onChange={onShowElectricChange}
        />
        <Toggle
          label="Champ magnétique (H)"
          checked={showMagnetic}
          onChange={onShowMagneticChange}
        />
        <Toggle
          label="Afficher les vecteurs"
          checked={showVectors}
          onChange={onShowVectorsChange}
        />
        <Toggle
          label="Vue 3D"
          checked={show3D}
          onChange={onShow3DChange}
        />
      </div>
    </Card>
  );
}
