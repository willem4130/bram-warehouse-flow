interface ControlsProps {
  isRunning: boolean;
  isComplete: boolean;
  isPaused: boolean;
  speed: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function Controls({
  isRunning,
  isComplete,
  isPaused,
  speed,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
}: ControlsProps) {
  const canReset = !isRunning && (isPaused || isComplete);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={onStart}
          disabled={isRunning || isComplete}
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            backgroundColor: isRunning || isComplete ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning || isComplete ? 'not-allowed' : 'pointer',
          }}
        >
          Start
        </button>
        <button
          onClick={onStop}
          disabled={!isRunning}
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            backgroundColor: !isRunning ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          Stop
        </button>
        <button
          onClick={onReset}
          disabled={!canReset}
          style={{
            padding: '10px 24px',
            fontSize: '16px',
            backgroundColor: !canReset ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !canReset ? 'not-allowed' : 'pointer',
          }}
        >
          Reset
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ fontSize: '14px', color: '#666' }}>Speed:</label>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          style={{ width: '150px' }}
        />
        <span style={{ fontSize: '14px', minWidth: '40px' }}>{speed}x</span>
      </div>
    </div>
  );
}
