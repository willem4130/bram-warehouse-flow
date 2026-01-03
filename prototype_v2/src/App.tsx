import { useState, useEffect, useCallback } from 'react';
import { GridCanvas } from './components/GridCanvas';
import { Controls } from './components/Controls';
import { FlowEditor } from './components/FlowEditor';
import { useSimulation } from './hooks/useSimulation';
import { useFlowSimulation } from './hooks/useFlowSimulation';
import { useHistory, createHistoryState } from './hooks/useHistory';
import { loadExcalidrawFile, loadExcalidrawToScenario } from './utils/parseExcalidraw';
import { assignCellToAreaType } from './utils/areaManager';
import { toggleActorAtPosition } from './utils/actorManager';
import { GridData, Area, Actor, Flow, EditModeState, EditTarget, AreaType, ActorType, Point } from './types';
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
  const [actors, setActors] = useState<Actor[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [editMode, setEditMode] = useState<EditModeState>(defaultEditMode);

  // History management
  const history = useHistory();

  // Legacy simulation hook (uses legacy gridData for backward compatibility)
  const legacySimulation = useSimulation(gridData);

  // New flow-based simulation hook
  const flowSimulation = useFlowSimulation(actors, areas, flows);

  // Use flow simulation when flows are defined, otherwise fall back to legacy
  const useFlowBased = flowSimulation.hasActiveFlow;
  const activeSimulation = useFlowBased ? flowSimulation : legacySimulation;
  const { speed, start, stop, reset, setSpeed } = activeSimulation;

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

  // Change edit target (areas/actors)
  const handleEditTargetChange = useCallback((target: EditTarget) => {
    setEditMode((prev) => ({
      ...prev,
      target,
    }));
  }, []);

  // Change selected area type
  const handleAreaTypeChange = useCallback((type: AreaType) => {
    setEditMode((prev) => ({
      ...prev,
      selectedAreaType: type,
    }));
  }, []);

  // Change selected actor type
  const handleActorTypeChange = useCallback((type: ActorType) => {
    setEditMode((prev) => ({
      ...prev,
      selectedActorType: type,
    }));
  }, []);

  // Handle cell click (for painting areas)
  const handleCellClick = useCallback(
    (point: Point, areaType: AreaType) => {
      setAreas((prevAreas) => {
        const newAreas = assignCellToAreaType(prevAreas, point, areaType);

        // Push to history (include current actors)
        history.pushState(
          createHistoryState(newAreas, actors, [], []),
          `Paint ${areaType} at (${point.x}, ${point.y})`
        );

        return newAreas;
      });
    },
    [history, actors]
  );

  // Handle actor click (for placing/removing actors)
  const handleActorClick = useCallback(
    (point: Point, actorType: ActorType) => {
      setActors((prevActors) => {
        const newActors = toggleActorAtPosition(prevActors, point, actorType);

        // Push to history (include current areas)
        history.pushState(
          createHistoryState(areas, newActors, [], []),
          `Toggle ${actorType} at (${point.x}, ${point.y})`
        );

        return newActors;
      });
    },
    [history, areas]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    const prevState = history.undo();
    if (prevState) {
      setAreas(prevState.areas);
      setActors(prevState.actors);
    }
  }, [history]);

  // Redo action
  const handleRedo = useCallback(() => {
    const nextState = history.redo();
    if (nextState) {
      setAreas(nextState.areas);
      setActors(nextState.actors);
    }
  }, [history]);

  // Create a new flow
  const handleCreateFlow = useCallback((flow: Flow) => {
    setFlows((prevFlows) => [...prevFlows, flow]);
  }, []);

  // Delete a flow
  const handleDeleteFlow = useCallback((flowId: string) => {
    setFlows((prevFlows) => prevFlows.filter((f) => f.id !== flowId));
  }, []);

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

  // Derive simulation state based on which mode is active
  const simulationState = useFlowBased
    ? {
        isRunning: flowSimulation.state.isRunning,
        isPaused: flowSimulation.state.isPaused,
        isComplete: flowSimulation.state.isComplete,
        elapsedMs: flowSimulation.state.elapsedMs,
      }
    : {
        isRunning: legacySimulation.state.isRunning,
        isPaused: legacySimulation.state.isPaused,
        isComplete: legacySimulation.state.isComplete,
        elapsedMs: legacySimulation.state.elapsedMs,
      };

  // Progress tracking
  const progressInfo = useFlowBased
    ? {
        arrived: flowSimulation.state.animatedActors.filter((a) => a.hasArrived).length,
        total: flowSimulation.state.animatedActors.length,
        label: 'Actors arrived',
      }
    : {
        arrived: legacySimulation.state.docks.filter((d) => d.isFilled).length,
        total: legacySimulation.state.docks.length,
        label: 'Docks filled',
      };

  return (
    <div className="app">
      <header className="header">
        <h1>Warehouse Flow Prototype V2</h1>
        <div className="status">
          <span className="timer">Time: {formatTime(simulationState.elapsedMs)}</span>
          <span className="progress">
            {progressInfo.label}: {progressInfo.arrived} / {progressInfo.total}
          </span>
          {simulationState.isComplete && <span className="complete">Complete!</span>}
          {useFlowBased && (
            <span style={{ color: '#228be6', marginLeft: '8px' }}>
              Flow Mode
            </span>
          )}
          {editMode.isEditMode && (
            <span className="edit-indicator" style={{ color: '#e64980' }}>
              Edit Mode
            </span>
          )}
        </div>
      </header>

      <main className="main" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        <GridCanvas
          gridData={gridData}
          pallets={legacySimulation.state.pallets}
          docks={legacySimulation.state.docks}
          currentPath={useFlowBased ? flowSimulation.state.currentPath : legacySimulation.state.currentPath}
          areas={areas}
          actors={actors}
          animatedActors={flowSimulation.state.animatedActors}
          editMode={editMode}
          onCellClick={handleCellClick}
          onActorClick={handleActorClick}
        />

        {/* Flow Editor sidebar - visible in edit mode */}
        {editMode.isEditMode && (
          <div style={{ width: '320px', flexShrink: 0 }}>
            <FlowEditor
              actors={actors}
              areas={areas}
              flows={flows}
              onCreateFlow={handleCreateFlow}
              onDeleteFlow={handleDeleteFlow}
            />
          </div>
        )}
      </main>

      <footer className="footer">
        <Controls
          isRunning={simulationState.isRunning}
          isComplete={simulationState.isComplete}
          isPaused={simulationState.isPaused}
          speed={speed}
          onStart={start}
          onStop={stop}
          onReset={reset}
          onSpeedChange={setSpeed}
          editMode={editMode}
          onEditModeToggle={handleEditModeToggle}
          onEditTargetChange={handleEditTargetChange}
          onAreaTypeChange={handleAreaTypeChange}
          onActorTypeChange={handleActorTypeChange}
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
