import { useState } from 'react';
import { FieldCanvas2D } from '@/components/canvas';
import { WaveguideScene } from '@/components/three';
import { ControlPanel, VisualizationControls } from '@/components/controls';

function App() {
  const [showElectric, setShowElectric] = useState(true);
  const [showMagnetic, setShowMagnetic] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  const [show3D, setShow3D] = useState(false);

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
            <div className="flex-1 bg-white rounded-lg shadow-md p-4 min-h-0 flex flex-col">
              <h2 className="text-lg font-semibold mb-2 flex-shrink-0">
                {show3D ? 'Vue 3D' : 'Vue 2D - Coupe Transversale'}
              </h2>
              <div className="flex-1 flex items-center justify-center min-h-0">
                {show3D ? (
                  <div className="w-full h-full">
                    <WaveguideScene
                      showVectors={showVectors}
                      showElectric={showElectric}
                      showMagnetic={showMagnetic}
                    />
                  </div>
                ) : (
                  <FieldCanvas2D
                    width={500}
                    height={400}
                    showElectric={showElectric}
                    showMagnetic={showMagnetic}
                    showVectors={showVectors}
                  />
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
                Les vecteurs indiquent la direction et l'intensité des champs à un instant t.
                L'animation montre la propagation de l'onde dans le guide.
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
                show3D={show3D}
                onShowElectricChange={setShowElectric}
                onShowMagneticChange={setShowMagnetic}
                onShowVectorsChange={setShowVectors}
                onShow3DChange={setShow3D}
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
