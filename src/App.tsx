import { useState } from 'react';
import { FieldCanvas2D, PropagationCanvas, ColorMapCanvas } from '@/components/canvas';
import { WaveguideScene } from '@/components/three';
import { ControlPanel, VisualizationControls } from '@/components/controls';

type ViewMode = 'cross-section' | 'propagation' | 'colormap' | '3d';

function App() {
  const [showElectric, setShowElectric] = useState(true);
  const [showMagnetic, setShowMagnetic] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('propagation');

  const viewModes: { value: ViewMode; label: string; description: string }[] = [
    { value: 'propagation', label: 'Propagation', description: 'Vue de la sinusoïde se propageant' },
    { value: 'cross-section', label: 'Coupe 2D', description: 'Distribution des champs transverses' },
    { value: 'colormap', label: 'Intensité', description: 'Carte de chaleur de l\'intensité' },
    { value: '3d', label: 'Vue 3D', description: 'Visualisation 3D du guide' },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="bg-slate-800 text-white p-4 shadow-lg flex-shrink-0">
        <h1 className="text-2xl font-bold">Simulateur de Guides d'Ondes</h1>
        <p className="text-slate-300 text-sm">
          Visualisation de la propagation des ondes électromagnétiques
        </p>
      </header>

      <main className="flex-1 p-4 min-h-0">
        <div className="h-full flex gap-4">
          {/* Zone de visualisation */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Onglets de vue */}
            <div className="bg-white rounded-lg shadow-md p-2 flex gap-2 flex-shrink-0">
              {viewModes.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={mode.description}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Zone de visualisation principale */}
            <div className="flex-1 bg-white rounded-lg shadow-md p-4 min-h-0 flex flex-col">
              <h2 className="text-lg font-semibold mb-2 flex-shrink-0">
                {viewModes.find((m) => m.value === viewMode)?.description}
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                {viewMode === 'propagation' && (
                  <PropagationCanvas
                    width={700}
                    height={350}
                    showElectric={showElectric}
                    showMagnetic={showMagnetic}
                  />
                )}

                {viewMode === 'cross-section' && (
                  <FieldCanvas2D
                    width={450}
                    height={400}
                    showElectric={showElectric}
                    showMagnetic={showMagnetic}
                    showVectors={showVectors}
                  />
                )}

                {viewMode === 'colormap' && (
                  <div className="flex gap-4">
                    {showElectric && (
                      <ColorMapCanvas
                        width={320}
                        height={350}
                        fieldType="electric"
                        resolution={40}
                      />
                    )}
                    {showMagnetic && (
                      <ColorMapCanvas
                        width={320}
                        height={350}
                        fieldType="magnetic"
                        resolution={40}
                      />
                    )}
                    {!showElectric && !showMagnetic && (
                      <p className="text-slate-500">
                        Activez au moins un champ (E ou H) pour voir la visualisation.
                      </p>
                    )}
                  </div>
                )}

                {viewMode === '3d' && (
                  <div className="w-full h-full">
                    <WaveguideScene
                      showVectors={showVectors}
                      showElectric={showElectric}
                      showMagnetic={showMagnetic}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Légende */}
            <div className="bg-white rounded-lg shadow-md p-4 flex-shrink-0">
              <h3 className="font-semibold text-sm text-slate-700 mb-2">Légende</h3>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-red-500 rounded"></div>
                  <span className="text-slate-600">Champ électrique (E)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500 rounded"></div>
                  <span className="text-slate-600">Champ magnétique (H)</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {viewMode === 'propagation' && (
                  <>
                    La vue <strong>Propagation</strong> montre les sinusoïdes du champ se propageant le long du guide (axe z).
                    Cliquez sur "Démarrer" pour voir l'onde avancer.
                  </>
                )}
                {viewMode === 'cross-section' && (
                  <>
                    La vue <strong>Coupe 2D</strong> montre les vecteurs de champ dans la section transversale du guide.
                  </>
                )}
                {viewMode === 'colormap' && (
                  <>
                    La vue <strong>Intensité</strong> montre l'amplitude des champs par une carte de couleurs.
                    L'animation montre l'évolution temporelle.
                  </>
                )}
                {viewMode === '3d' && (
                  <>
                    La vue <strong>3D</strong> permet de visualiser le guide et les champs en trois dimensions.
                    Utilisez la souris pour tourner la vue.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Panneau de contrôle */}
          <aside className="w-80 flex-shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <VisualizationControls
                showElectric={showElectric}
                showMagnetic={showMagnetic}
                showVectors={showVectors}
                show3D={viewMode === '3d'}
                onShowElectricChange={setShowElectric}
                onShowMagneticChange={setShowMagnetic}
                onShowVectorsChange={setShowVectors}
                onShow3DChange={(val) => setViewMode(val ? '3d' : 'propagation')}
              />
              <ControlPanel />
            </div>
          </aside>
        </div>
      </main>

      <footer className="bg-slate-800 text-slate-400 text-xs text-center py-2 flex-shrink-0">
        Simulateur de guides d'ondes - Modes TE, TM, TEM et hybrides
      </footer>
    </div>
  );
}

export default App;
