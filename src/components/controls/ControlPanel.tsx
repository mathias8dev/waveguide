import { useSimulationStore } from '@/stores/simulationStore';
import { useAnimation } from '@/hooks/useAnimation';
import { Select, Slider, Button, Toggle, Card } from '@/components/ui';
import { WaveguideType, ModeType } from '@/types';

export function ControlPanel() {
  const waveguide = useSimulationStore((state) => state.waveguide);
  const mode = useSimulationStore((state) => state.mode);
  const frequency = useSimulationStore((state) => state.frequency);
  const calculatedParams = useSimulationStore((state) => state.calculatedParams);
  const waveguideInstance = useSimulationStore((state) => state.waveguideInstance);

  const setWaveguideType = useSimulationStore((state) => state.setWaveguideType);
  const setWaveguideParams = useSimulationStore((state) => state.setWaveguideParams);
  const setMode = useSimulationStore((state) => state.setMode);
  const setFrequency = useSimulationStore((state) => state.setFrequency);

  const { isAnimating, toggle: toggleAnimation, reset: resetAnimation } = useAnimation();

  const waveguideTypes: { value: WaveguideType; label: string }[] = [
    { value: 'rectangular', label: 'Rectangulaire' },
    { value: 'circular', label: 'Circulaire' },
    { value: 'coaxial', label: 'Coaxial' },
  ];

  const availableModes = waveguideInstance?.getAvailableModes() || [];
  const modeOptions = availableModes.map((m) => ({
    value: `${m.type}-${m.m}-${m.n}`,
    label: `${m.type}${m.m}${m.n}`,
  }));

  const formatFrequency = (f: number) => {
    if (f >= 1e9) return `${(f / 1e9).toFixed(2)} GHz`;
    if (f >= 1e6) return `${(f / 1e6).toFixed(2)} MHz`;
    return `${f.toFixed(0)} Hz`;
  };

  const formatLength = (l: number) => {
    if (l >= 0.01) return `${(l * 100).toFixed(2)} cm`;
    return `${(l * 1000).toFixed(2)} mm`;
  };

  return (
    <div className="space-y-4">
      <Card title="Type de Guide">
        <Select
          label="Géométrie"
          value={waveguide.type}
          options={waveguideTypes}
          onChange={(value) => setWaveguideType(value as WaveguideType)}
        />
      </Card>

      <Card title="Dimensions">
        {waveguide.type === 'rectangular' && (
          <div className="space-y-4">
            <Slider
              label="Largeur (a)"
              value={waveguide.a}
              min={0.005}
              max={0.05}
              step={0.0001}
              unit=""
              formatValue={formatLength}
              onChange={(a) => setWaveguideParams({ a })}
            />
            <Slider
              label="Hauteur (b)"
              value={waveguide.b}
              min={0.002}
              max={0.03}
              step={0.0001}
              unit=""
              formatValue={formatLength}
              onChange={(b) => setWaveguideParams({ b })}
            />
          </div>
        )}

        {waveguide.type === 'circular' && (
          <Slider
            label="Rayon"
            value={waveguide.radius}
            min={0.002}
            max={0.03}
            step={0.0001}
            unit=""
            formatValue={formatLength}
            onChange={(radius) => setWaveguideParams({ radius })}
          />
        )}

        {waveguide.type === 'coaxial' && (
          <div className="space-y-4">
            <Slider
              label="Rayon interne"
              value={waveguide.innerRadius}
              min={0.0005}
              max={0.005}
              step={0.0001}
              unit=""
              formatValue={formatLength}
              onChange={(innerRadius) => setWaveguideParams({ innerRadius })}
            />
            <Slider
              label="Rayon externe"
              value={waveguide.outerRadius}
              min={0.002}
              max={0.015}
              step={0.0001}
              unit=""
              formatValue={formatLength}
              onChange={(outerRadius) => setWaveguideParams({ outerRadius })}
            />
          </div>
        )}
      </Card>

      <Card title="Mode de Propagation">
        <Select
          label="Mode"
          value={`${mode.type}-${mode.m}-${mode.n}`}
          options={modeOptions}
          onChange={(value) => {
            const [type, m, n] = value.split('-');
            setMode({ type: type as ModeType, m: parseInt(m), n: parseInt(n) });
          }}
        />
      </Card>

      <Card title="Fréquence">
        <Slider
          label="Fréquence"
          value={frequency}
          min={1e9}
          max={30e9}
          step={0.1e9}
          formatValue={formatFrequency}
          onChange={setFrequency}
        />
      </Card>

      <Card title="Animation">
        <div className="flex gap-2">
          <Button onClick={toggleAnimation} variant={isAnimating ? 'secondary' : 'primary'}>
            {isAnimating ? 'Pause' : 'Démarrer'}
          </Button>
          <Button onClick={resetAnimation} variant="ghost">
            Réinitialiser
          </Button>
        </div>
      </Card>

      {calculatedParams && (
        <Card title="Paramètres Calculés">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Fréquence de coupure (fc)</span>
              <span className={`font-mono ${calculatedParams.isPropagatif ? 'text-green-600' : 'text-red-600'}`}>
                {formatFrequency(calculatedParams.cutoffFrequency)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-600">Longueur d'onde de coupure (λc)</span>
              <span className="font-mono text-slate-800">
                {formatLength(calculatedParams.cutoffWavelength)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-600">Propagation</span>
              <span className={`font-semibold ${calculatedParams.isPropagatif ? 'text-green-600' : 'text-red-600'}`}>
                {calculatedParams.isPropagatif ? 'Propagatif' : 'Évanescent'}
              </span>
            </div>

            {calculatedParams.isPropagatif && (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">Constante β</span>
                  <span className="font-mono text-slate-800">
                    {calculatedParams.propagationConstant.toFixed(2)} rad/m
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Vitesse de phase (vp)</span>
                  <span className="font-mono text-slate-800">
                    {(calculatedParams.phaseVelocity / 1e8).toFixed(3)} × 10⁸ m/s
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Vitesse de groupe (vg)</span>
                  <span className="font-mono text-slate-800">
                    {(calculatedParams.groupVelocity / 1e8).toFixed(3)} × 10⁸ m/s
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">λ guidée (λg)</span>
                  <span className="font-mono text-slate-800">
                    {formatLength(calculatedParams.wavelengthGuide)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Impédance (Z)</span>
                  <span className="font-mono text-slate-800">
                    {calculatedParams.impedance.toFixed(1)} Ω
                  </span>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
