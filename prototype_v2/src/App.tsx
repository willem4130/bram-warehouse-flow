import { useState, useEffect } from 'react';
import { GridCanvas } from './components/GridCanvas';
import { Controls } from './components/Controls';
import { useSimulation } from './hooks/useSimulation';
import { loadExcalidrawFile } from './utils/parseExcalidraw';
import { GridData } from './types';
import './App.css';

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
}

function App() {
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { state, speed, start, stop, reset, setSpeed } = useSimulation(gridData);

  useEffect(() => {
    loadExcalidrawFile('/prototype v2.excalidraw')
      .then((data) => {
        console.log('Grid data loaded:', data);
        console.log('Pallets:', data.pallets.length);
        console.log('Docks:', data.docks.length);
        setGridData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load:', err);
        setError(`Failed to load grid: ${err.message}`);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="app loading">Loading grid...</div>;
  }

  if (error) {
    return <div className="app error">{error}</div>;
  }

  const filledDocks = state.docks.filter((d) => d.isFilled).length;
  const totalDocks = state.docks.length;

  return (
    <div className="app">
      <header className="header">
        <h1>Warehouse Flow Prototype V2</h1>
        <div className="status">
          <span className="timer">Time: {formatTime(state.elapsedMs)}</span>
          <span className="progress">
            Docks filled: {filledDocks} / {totalDocks}
          </span>
          {state.isComplete && <span className="complete">Complete!</span>}
        </div>
      </header>

      <main className="main">
        <GridCanvas
          gridData={gridData}
          pallets={state.pallets}
          docks={state.docks}
          currentPath={state.currentPath}
        />
      </main>

      <footer className="footer">
        <Controls
          isRunning={state.isRunning}
          isComplete={state.isComplete}
          isPaused={state.isPaused}
          speed={speed}
          onStart={start}
          onStop={stop}
          onReset={reset}
          onSpeedChange={setSpeed}
        />
      </footer>
    </div>
  );
}

export default App;
