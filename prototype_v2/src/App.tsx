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
        setActors(scenarioData.actors); // Load pallets/actors from Excalidraw

        // Initialize history with current state
        history.reset(createHistoryState(scenarioData.areas, scenarioData.actors, [], []));

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

  // Clear all actors
  const handleClearAllActors = useCallback(() => {
    console.log('handleClearAllActors called, actors:', actors.length);
    if (actors.length === 0) return;

    // Push to history before clearing
    history.pushState(
      createHistoryState(areas, [], [], []),
      `Clear all actors (${actors.length})`
    );
    setActors([]);
  }, [history, areas, actors.length]);

  // Clear all areas
  const handleClearAllAreas = useCallback(() => {
    console.log('handleClearAllAreas called, areas:', areas.length, 'cells:', areas.reduce((sum, area) => sum + area.cells.length, 0));
    // Count total cells across all areas
    const totalCells = areas.reduce((sum, area) => sum + area.cells.length, 0);
    if (totalCells === 0) return;

    // Push to history before clearing
    history.pushState(
      createHistoryState([], actors, [], []),
      `Clear all areas (${totalCells} cells)`
    );
    setAreas([]);
  }, [history, actors, areas]);

  // Clear actors by type
  const handleClearActorsByType = useCallback((type: ActorType) => {
    const actorsOfType = actors.filter((a) => a.type === type);
    if (actorsOfType.length === 0) return;

    const remainingActors = actors.filter((a) => a.type !== type);
    history.pushState(
      createHistoryState(areas, remainingActors, [], []),
      `Clear all ${type}s (${actorsOfType.length})`
    );
    setActors(remainingActors);
  }, [history, areas, actors]);

  // Clear areas by type
  const handleClearAreasByType = useCallback((type: AreaType) => {
    console.log('handleClearAreasByType called, type:', type);
    const areaOfType = areas.find((a) => a.type === type);
    if (!areaOfType || areaOfType.cells.length === 0) return;

    // Clear cells from this area type
    const updatedAreas = areas.map((a) =>
      a.type === type ? { ...a, cells: [] } : a
    );
    history.pushState(
      createHistoryState(updatedAreas, actors, [], []),
      `Clear all ${type} cells (${areaOfType.cells.length})`
    );
    setAreas(updatedAreas);
  }, [history, actors, areas]);

  // Clear everything (all areas and actors)
  const handleClearEverything = useCallback(() => {
    const totalCells = areas.reduce((sum, area) => sum + area.cells.length, 0);
    console.log('handleClearEverything called, actors:', actors.length, 'cells:', totalCells);
    if (actors.length === 0 && totalCells === 0) return;

    history.pushState(
      createHistoryState([], [], [], []),
      `Clear everything (${actors.length} actors, ${totalCells} cells)`
    );
    setAreas([]);
    setActors([]);
  }, [history, areas, actors]);

  // Create a new flow
  const handleCreateFlow = useCallback((flow: Flow) => {
    setFlows((prevFlows) => [...prevFlows, flow]);
  }, []);

  // Delete a flow
  const handleDeleteFlow = useCallback((flowId: string) => {
    setFlows((prevFlows) => prevFlows.filter((f) => f.id !== flowId));
  }, []);

  // Keyboard shortcuts for undo/redo/delete
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

      // Delete or Backspace = Clear all (based on current target)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't interfere with text input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        if (editMode.target === 'actors') {
          handleClearAllActors();
        } else {
          handleClearAllAreas();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMode.isEditMode, editMode.target, handleUndo, handleRedo, handleClearAllActors, handleClearAllAreas]);

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
          onClearAllActors={handleClearAllActors}
          onClearAllAreas={handleClearAllAreas}
          onClearActorsByType={handleClearActorsByType}
          onClearAreasByType={handleClearAreasByType}
          onClearEverything={handleClearEverything}
          actorCount={actors.length}
          areaCount={areas.reduce((sum, area) => sum + area.cells.length, 0)}
          actorCountByType={{
            pallet: actors.filter((a) => a.type === 'pallet').length,
            forklift: actors.filter((a) => a.type === 'forklift').length,
            picker: actors.filter((a) => a.type === 'picker').length,
            cart: actors.filter((a) => a.type === 'cart').length,
            custom: actors.filter((a) => a.type === 'custom').length,
          }}
          areaCountByType={{
            dock: areas.find((a) => a.type === 'dock')?.cells.length ?? 0,
            staging: areas.find((a) => a.type === 'staging')?.cells.length ?? 0,
            storage: areas.find((a) => a.type === 'storage')?.cells.length ?? 0,
            picking: areas.find((a) => a.type === 'picking')?.cells.length ?? 0,
            packing: areas.find((a) => a.type === 'packing')?.cells.length ?? 0,
            obstacle: areas.find((a) => a.type === 'obstacle')?.cells.length ?? 0,
            empty: areas.find((a) => a.type === 'empty')?.cells.length ?? 0,
            custom: areas.find((a) => a.type === 'custom')?.cells.length ?? 0,
          }}
        />
      </footer>
    </div>
  );
}

export default App;
