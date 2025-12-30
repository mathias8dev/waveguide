import { useState } from 'react';
import { FieldCanvas2D, PropagationCanvas, ColorMapCanvas } from '@/components/canvas';
import { WaveguideScene, EMWave3D } from '@/components/three';
import { ControlPanel, VisualizationControls } from '@/components/controls';

type ViewMode = 'cross-section' | 'propagation' | 'colormap' | '3d';

function App() {
  const [showElectric, setShowElectric] = useState(true);
  const [showMagnetic, setShowMagnetic] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('propagation');

  // Options spécifiques à la vue 3D
  const [showWaveSurface, setShowWaveSurface] = useState(false);
  const [showFieldLines, setShowFieldLines] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [animateVectors, setAnimateVectors] = useState(true);
  const [animateWaves, setAnimateWaves] = useState(true);

  // Option pour la vue propagation: 2D canvas ou 3D classique
  const [propagationView3D, setPropagationView3D] = useState(false);

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
                  <div className="w-full h-full flex flex-col">
                    {/* Toggle 2D/3D pour la vue propagation */}
                    <div className="flex gap-2 mb-2 flex-shrink-0">
                      <button
                        onClick={() => setPropagationView3D(false)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          !propagationView3D ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Vue 2D
                      </button>
                      <button
                        onClick={() => setPropagationView3D(true)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          propagationView3D ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Vue 3D classique
                      </button>
                    </div>
                    <div className="flex-1 flex items-center justify-center min-h-0">
                      {!propagationView3D ? (
                        <PropagationCanvas
                          width={700}
                          height={350}
                          showElectric={showElectric}
                          showMagnetic={showMagnetic}
                        />
                      ) : (
                        <div className="w-full h-full min-h-[350px]">
                          <EMWave3D
                            showElectric={showElectric}
                            showMagnetic={showMagnetic}
                          />
                        </div>
                      )}
                    </div>
                  </div>
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
                  <div className="w-full h-full flex flex-col">
                    {/* Contrôles spécifiques 3D */}
                    <div className="flex flex-wrap gap-2 mb-2 flex-shrink-0">
                      {/* Affichage */}
                      <div className="flex gap-1 items-center">
                        <span className="text-xs text-slate-500 mr-1">Affichage:</span>
                        <button
                          onClick={() => setShowVectors(!showVectors)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            showVectors ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Vecteurs
                        </button>
                        <button
                          onClick={() => setShowWaveSurface(!showWaveSurface)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            showWaveSurface ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Surface
                        </button>
                        <button
                          onClick={() => setShowFieldLines(!showFieldLines)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            showFieldLines ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Lignes
                        </button>
                      </div>
                      {/* Séparateur */}
                      <div className="w-px bg-slate-300 mx-1"></div>
                      {/* Animation */}
                      <div className="flex gap-1 items-center">
                        <span className="text-xs text-slate-500 mr-1">Animer:</span>
                        <button
                          onClick={() => setAnimateVectors(!animateVectors)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            animateVectors ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Animer les vecteurs de champ"
                        >
                          Vecteurs
                        </button>
                        <button
                          onClick={() => setAnimateWaves(!animateWaves)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            animateWaves ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Animer les formes d'ondes (surface et lignes)"
                        >
                          Ondes
                        </button>
                      </div>
                      {/* Séparateur */}
                      <div className="w-px bg-slate-300 mx-1"></div>
                      {/* Caméra */}
                      <button
                        onClick={() => setAutoRotate(!autoRotate)}
                        className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                          autoRotate ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        Rotation auto
                      </button>
                    </div>
                    <div className="flex-1 min-h-0">
                      <WaveguideScene
                        showVectors={showVectors}
                        showElectric={showElectric}
                        showMagnetic={showMagnetic}
                        showWaveSurface={showWaveSurface}
                        showFieldLines={showFieldLines}
                        autoRotate={autoRotate}
                        animateVectors={animateVectors}
                        animateWaves={animateWaves}
                      />
                    </div>
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
