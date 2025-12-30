function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50">
      <header className="bg-slate-800 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">Simulateur de Guides d'Ondes</h1>
        <p className="text-slate-300 text-sm">
          Visualisation de la propagation des ondes électromagnétiques
        </p>
      </header>
      <main className="flex-1 p-4">
        <div className="h-full flex gap-4">
          <div className="flex-1 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Visualisation</h2>
            <p className="text-slate-500">Les visualisations 2D et 3D seront affichées ici.</p>
          </div>
          <aside className="w-80 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Paramètres</h2>
            <p className="text-slate-500">Le panneau de contrôle sera ici.</p>
          </aside>
        </div>
      </main>
    </div>
  )
}

export default App
