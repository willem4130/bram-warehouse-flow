interface ControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function Controls({ isRunning, onStart, onStop }: ControlsProps) {
  return (
    <div className="controls">
      <button
        onClick={onStart}
        disabled={isRunning}
        className={`control-button start-button ${isRunning ? 'disabled' : ''}`}
      >
        Start
      </button>

      <button
        onClick={onStop}
        disabled={!isRunning}
        className={`control-button stop-button ${!isRunning ? 'disabled' : ''}`}
      >
        Stop
      </button>
    </div>
  );
}
