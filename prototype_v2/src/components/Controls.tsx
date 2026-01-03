interface ControlsProps {
  isRunning: boolean;
  isComplete: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function Controls({ isRunning, isComplete, onStart, onStop }: ControlsProps) {
  return (
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
    </div>
  );
}
