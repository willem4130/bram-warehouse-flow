import { useState, useEffect, useCallback } from 'react';
import { GridCanvas } from './components/GridCanvas';
import { Controls } from './components/Controls';
import { useSimulation } from './hooks/useSimulation';
import { useHistory, createHistoryState } from './hooks/useHistory';
import { loadExcalidrawFile, loadExcalidrawToScenario } from './utils/parseExcalidraw';
import { assignCellToAreaType } from './utils/areaManager';
import { GridData, Area, EditModeState, AreaType, Point } from './types';
import './App.css';

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
}

// Default edit mode state
const defaultEditMode: EditModeState = {
  isEditMode: false,
  target: 'areas',
  selectedAreaType: 'dock',
  selectedActorType: 'pallet',
};

function App() {
  // Legacy grid data (for backward compatibility)
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New architecture state
  const [areas, setAreas] = useState<Area[]>([]);
  const [editMode, setEditMode] = useState<EditModeState>(defaultEditMode);

  // History management
  const history = useHistory();

  // Simulation hook (uses legacy gridData)
  const { state, speed, start, stop, reset, setSpeed } = useSimulation(gridData);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load legacy grid data for backward compatibility
        const legacyData = await loadExcalidrawFile('/prototype v2.excalidraw');
        console.log('Grid data loaded:', legacyData);
        console.log('Pallets:', legacyData.pallets.length);
        console.log('Docks:', legacyData.docks.length);
        setGridData(legacyData);

        // Also load with new architecture
        const scenarioData = await loadExcalidrawToScenario('/prototype v2.excalidraw');
        console.log('Scenario data loaded:', scenarioData);
        console.log('Areas:', scenarioData.areas.length);
        console.log('Actors:', scenarioData.actors.length);
        setAreas(scenarioData.areas);

        // Initialize history with current state
        history.reset(createHistoryState(scenarioData.areas, [], [], []));

        setLoading(false);
      } catch (err) {
        console.error('Failed to load:', err);
        setError(`Failed to load grid: ${(err as Error).message}`);
        setLoading(false);
      }
    };

    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle edit mode
  const handleEditModeToggle = useCallback(() => {
    setEditMode((prev) => ({
      ...prev,
      isEditMode: !prev.isEditMode,
    }));
  }, []);

  // Change selected area type
  const handleAreaTypeChange = useCallback((type: AreaType) => {
    setEditMode((prev) => ({
      ...prev,
      selectedAreaType: type,
    }));
  }, []);

  // Handle cell click (for painting areas)
  const handleCellClick = useCallback(
    (point: Point, areaType: AreaType) => {
      setAreas((prevAreas) => {
        const newAreas = assignCellToAreaType(prevAreas, point, areaType);

        // Push to history
        history.pushState(
          createHistoryState(newAreas, [], [], []),
          `Paint ${areaType} at (${point.x}, ${point.y})`
        );

        return newAreas;
      });
    },
    [history]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    const prevState = history.undo();
    if (prevState) {
      setAreas(prevState.areas);
    }
  }, [history]);

  // Redo action
  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    if (nextState) {
      setAreas(nextState.areas);
    }
  }, [history]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editMode.isEditMode) return;

      // Cmd/Ctrl + Z = Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Cmd/Ctrl + Shift + Z = Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      }

      // Cmd/Ctrl + Y = Redo (alternative)
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode.isEditMode, handleUndo, handleRedo]);

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
          {editMode.isEditMode && (
            <span className="edit-indicator" style={{ color: '#e64980' }}>
              Edit Mode
            </span>
          )}
        </div>
      </header>

      <main className="main">
        <GridCanvas
          gridData={gridData}
          pallets={state.pallets}
          docks={state.docks}
          currentPath={state.currentPath}
          areas={areas}
          editMode={editMode}
          onCellClick={handleCellClick}
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
          editMode={editMode}
          onEditModeToggle={handleEditModeToggle}
          onAreaTypeChange={handleAreaTypeChange}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
        />
      </footer>
    </div>
  );
}

export default App;
