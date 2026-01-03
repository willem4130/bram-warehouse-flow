import { useMemo } from 'react';
import { GridCanvas } from './GridCanvas';
import { useFlowSimulation } from '../hooks/useFlowSimulation';
import {
  GridData,
  Area,
  Actor,
  Flow,
  EditModeState,
} from '../types';

interface ComparisonViewProps {
  gridData: GridData | null;
  areas: Area[];
  actors: Actor[];
  // View A (left)
  viewAName: string;
  viewAFlows: Flow[];
  // View B (right)
  viewBName: string;
  viewBFlows: Flow[];
  // Simulation controls
  speed: number;
  onSpeedChange: (speed: number) => void;
}

// Format time for display
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
}

export function ComparisonView({
  gridData,
  areas,
  actors,
  viewAName,
  viewAFlows,
  viewBName,
  viewBFlows,
  speed,
  onSpeedChange,
}: ComparisonViewProps) {
  // Independent simulations for each view
  const simulationA = useFlowSimulation(actors, areas, viewAFlows);
  const simulationB = useFlowSimulation(actors, areas, viewBFlows);

  // Sync speed to both simulations
  useMemo(() => {
    simulationA.setSpeed(speed);
    simulationB.setSpeed(speed);
  }, [speed, simulationA, simulationB]);

  // Control functions that affect both
  const handleStart = () => {
    simulationA.start();
    simulationB.start();
  };

  const handleStop = () => {
    simulationA.stop();
    simulationB.stop();
  };

  const handleReset = () => {
    simulationA.reset();
    simulationB.reset();
  };

  // Calculate progress for each view
  const progressA = {
    arrived: simulationA.state.animatedActors.filter((a) => a.hasArrived).length,
    total: simulationA.state.animatedActors.length,
  };
  const progressB = {
    arrived: simulationB.state.animatedActors.filter((a) => a.hasArrived).length,
    total: simulationB.state.animatedActors.length,
  };

  // Determine if both are complete
  const bothComplete = simulationA.state.isComplete && simulationB.state.isComplete;
  const eitherRunning = simulationA.state.isRunning || simulationB.state.isRunning;

  // Empty edit mode (comparison mode doesn't allow editing)
  const noEditMode: EditModeState = {
    isEditMode: false,
    target: 'none',
    selectedAreaType: 'dock',
    selectedActorType: 'pallet',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Comparison header with controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleStart}
            disabled={eitherRunning || bothComplete}
            style={{
              padding: '8px 16px',
              backgroundColor: eitherRunning || bothComplete ? '#ccc' : '#40c057',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: eitherRunning || bothComplete ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
          >
            ▶ Start Both
          </button>
          <button
            onClick={handleStop}
            disabled={!eitherRunning}
            style={{
              padding: '8px 16px',
              backgroundColor: !eitherRunning ? '#ccc' : '#fa5252',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !eitherRunning ? 'not-allowed' : 'pointer',
              fontWeight: 500,
            }}
          >
            ⏸ Pause
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#228be6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            ↺ Reset Both
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '14px', color: '#495057' }}>Speed:</label>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
            }}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
          {bothComplete && (
            <span style={{ color: '#40c057', fontWeight: 500 }}>✓ Both Complete</span>
          )}
        </div>
      </div>

      {/* Side-by-side canvases */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
        {/* View A */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#e7f5ff',
              borderRadius: '4px',
              border: '2px solid #228be6',
            }}
          >
            <span style={{ fontWeight: 600, color: '#228be6' }}>{viewAName}</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
              <span>Time: {formatTime(simulationA.state.elapsedMs)}</span>
              <span>
                Progress: {progressA.arrived}/{progressA.total}
              </span>
              {simulationA.state.isComplete && (
                <span style={{ color: '#40c057' }}>✓</span>
              )}
            </div>
          </div>
          <GridCanvas
            gridData={gridData}
            pallets={[]}
            docks={[]}
            currentPath={simulationA.state.currentPath}
            activePaths={simulationA.state.activePaths}
            areas={areas}
            actors={actors}
            animatedActors={simulationA.state.animatedActors}
            editMode={noEditMode}
          />
        </div>

        {/* View B */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              padding: '8px 12px',
              backgroundColor: '#fff3bf',
              borderRadius: '4px',
              border: '2px solid #fab005',
            }}
          >
            <span style={{ fontWeight: 600, color: '#e67700' }}>{viewBName}</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
              <span>Time: {formatTime(simulationB.state.elapsedMs)}</span>
              <span>
                Progress: {progressB.arrived}/{progressB.total}
              </span>
              {simulationB.state.isComplete && (
                <span style={{ color: '#40c057' }}>✓</span>
              )}
            </div>
          </div>
          <GridCanvas
            gridData={gridData}
            pallets={[]}
            docks={[]}
            currentPath={simulationB.state.currentPath}
            activePaths={simulationB.state.activePaths}
            areas={areas}
            actors={actors}
            animatedActors={simulationB.state.animatedActors}
            editMode={noEditMode}
          />
        </div>
      </div>
    </div>
  );
}
