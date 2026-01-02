import { WarehouseView } from './components/WarehouseView';
import { Controls } from './components/Controls';
import { useAnimation } from './hooks/useAnimation';

function App() {
  const { position, isRunning, start, stop } = useAnimation();

  return (
    <div className="app">
      <header className="header">
        <h1>Warehouse Flow Visualization - Prototype</h1>
        <p className="path-info">
          Path: B8 → B9 → I9 → I3 → U3 → U1
          <span className="timing-info">
            (1 second per cell, 2 second wait at destination)
          </span>
        </p>
      </header>

      <main className="main">
        <WarehouseView palletPosition={position} />
        <Controls isRunning={isRunning} onStart={start} onStop={stop} />
      </main>

      <footer className="footer">
        <p>
          Status: {isRunning ? 'Running' : 'Stopped'}
        </p>
      </footer>
    </div>
  );
}

export default App;
