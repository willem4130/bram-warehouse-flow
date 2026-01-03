import { AreaType, ActorType, EditTarget, EditModeState, AREA_TYPE_CONFIGS, ACTOR_TYPE_CONFIGS } from '../types';

interface ControlsProps {
  // Playback controls
  isRunning: boolean;
  isComplete: boolean;
  isPaused: boolean;
  speed: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  // Edit mode controls (optional)
  editMode?: EditModeState;
  onEditModeToggle?: () => void;
  onEditTargetChange?: (target: EditTarget) => void;
  onAreaTypeChange?: (type: AreaType) => void;
  onActorTypeChange?: (type: ActorType) => void;
  // Undo/Redo controls (optional)
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  // Clear controls (optional)
  onClearAllActors?: () => void;
  onClearAllAreas?: () => void;
  onClearActorsByType?: (type: ActorType) => void;
  onClearAreasByType?: (type: AreaType) => void;
  onClearEverything?: () => void;
  actorCount?: number;
  areaCount?: number;
  actorCountByType?: Record<ActorType, number>;
  areaCountByType?: Record<AreaType, number>;
}

// Button styles
const buttonStyle = (enabled: boolean, color: string) => ({
  padding: '10px 24px',
  fontSize: '16px',
  backgroundColor: enabled ? color : '#ccc',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: enabled ? 'pointer' : 'not-allowed',
});

const smallButtonStyle = (enabled: boolean, color: string) => ({
  padding: '6px 12px',
  fontSize: '14px',
  backgroundColor: enabled ? color : '#ccc',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: enabled ? 'pointer' : 'not-allowed',
});

export function Controls({
  isRunning,
  isComplete,
  isPaused,
  speed,
  onStart,
  onStop,
  onReset,
  onSpeedChange,
  editMode,
  onEditModeToggle,
  onEditTargetChange,
  onAreaTypeChange,
  onActorTypeChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onClearAllActors,
  onClearAllAreas,
  onClearActorsByType,
  onClearAreasByType,
  onClearEverything,
  actorCount = 0,
  areaCount = 0,
  actorCountByType = { pallet: 0, forklift: 0, picker: 0, cart: 0, custom: 0 },
  areaCountByType = { dock: 0, staging: 0, storage: 0, picking: 0, packing: 0, obstacle: 0, empty: 0, custom: 0 },
}: ControlsProps) {
  const canReset = !isRunning && (isPaused || isComplete);
  const isEditMode = editMode?.isEditMode ?? false;
  const editTarget = editMode?.target ?? 'areas';

  // Filter out 'empty' and 'custom' for now (can be added later)
  const areaTypes = AREA_TYPE_CONFIGS.filter(
    (config) => config.type !== 'empty' && config.type !== 'custom'
  );

  // Filter out 'custom' for now
  const actorTypes = ACTOR_TYPE_CONFIGS.filter(
    (config) => config.type !== 'custom'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      {/* Edit Mode Section */}
      {onEditModeToggle && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
          {/* Row 1: Edit Mode toggle + Target selector */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={onEditModeToggle}
              disabled={isRunning}
              style={{
                ...smallButtonStyle(!isRunning, isEditMode ? '#e64980' : '#495057'),
                fontWeight: isEditMode ? 'bold' : 'normal',
              }}
            >
              {isEditMode ? '✏️ Edit Mode ON' : 'Edit Mode'}
            </button>

            {isEditMode && onEditTargetChange && (
              <>
                <label style={{ fontSize: '14px', color: '#666' }}>Target:</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => onEditTargetChange('areas')}
                    style={{
                      ...smallButtonStyle(true, editTarget === 'areas' ? '#228be6' : '#868e96'),
                      fontWeight: editTarget === 'areas' ? 'bold' : 'normal',
                    }}
                  >
                    Areas
                  </button>
                  <button
                    onClick={() => onEditTargetChange('actors')}
                    style={{
                      ...smallButtonStyle(true, editTarget === 'actors' ? '#228be6' : '#868e96'),
                      fontWeight: editTarget === 'actors' ? 'bold' : 'normal',
                    }}
                  >
                    Actors
                  </button>
                </div>
              </>
            )}

            {/* Undo/Redo/Clear Everything buttons */}
            {isEditMode && onUndo && onRedo && (
              <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                  style={smallButtonStyle(canUndo, '#495057')}
                >
                  ↩ Undo
                </button>
                <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Shift+Z)"
                  style={smallButtonStyle(canRedo, '#495057')}
                >
                  ↪ Redo
                </button>
                {onClearEverything && (
                  <button
                    onClick={() => {
                      console.log('Clear Everything button clicked!');
                      onClearEverything();
                    }}
                    disabled={actorCount === 0 && areaCount === 0}
                    title="Clear everything (all areas and actors)"
                    style={{
                      ...smallButtonStyle(actorCount > 0 || areaCount > 0, '#dc3545'),
                      marginLeft: '8px',
                    }}
                  >
                    Clear Everything
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Row 2: Type selector based on target */}
          {isEditMode && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingLeft: '4px' }}>
              {editTarget === 'areas' && onAreaTypeChange && (
                <>
                  <label style={{ fontSize: '14px', color: '#666' }}>Area Type:</label>
                  <select
                    value={editMode?.selectedAreaType ?? 'dock'}
                    onChange={(e) => onAreaTypeChange(e.target.value as AreaType)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                    }}
                  >
                    {areaTypes.map((config) => (
                      <option key={config.type} value={config.type}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  {/* Area color preview */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      backgroundColor:
                        areaTypes.find((c) => c.type === editMode?.selectedAreaType)?.defaultColor ??
                        '#ffffff',
                    }}
                  />
                  {/* Clear buttons for areas */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                    {/* Clear selected type */}
                    {onClearAreasByType && editMode?.selectedAreaType && (
                      <button
                        onClick={() => onClearAreasByType(editMode.selectedAreaType)}
                        disabled={(areaCountByType[editMode.selectedAreaType] ?? 0) === 0}
                        title={`Clear all ${editMode.selectedAreaType} cells`}
                        style={smallButtonStyle((areaCountByType[editMode.selectedAreaType] ?? 0) > 0, '#e67700')}
                      >
                        Clear {editMode.selectedAreaType} ({areaCountByType[editMode.selectedAreaType] ?? 0})
                      </button>
                    )}
                    {/* Clear all areas */}
                    {onClearAllAreas && (
                      <button
                        onClick={() => {
                          console.log('Clear All Areas button clicked!');
                          onClearAllAreas();
                        }}
                        disabled={areaCount === 0}
                        title="Clear all areas"
                        style={smallButtonStyle(areaCount > 0, '#dc3545')}
                      >
                        Clear All Areas ({areaCount})
                      </button>
                    )}
                  </div>
                </>
              )}

              {editTarget === 'actors' && onActorTypeChange && (
                <>
                  <label style={{ fontSize: '14px', color: '#666' }}>Actor Type:</label>
                  <select
                    value={editMode?.selectedActorType ?? 'pallet'}
                    onChange={(e) => onActorTypeChange(e.target.value as ActorType)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                    }}
                  >
                    {actorTypes.map((config) => (
                      <option key={config.type} value={config.type}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  {/* Actor color preview */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      backgroundColor:
                        actorTypes.find((c) => c.type === editMode?.selectedActorType)?.defaultColor ??
                        '#d2bab0',
                    }}
                  />
                  {/* Clear buttons for actors */}
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                    {/* Clear selected type */}
                    {onClearActorsByType && editMode?.selectedActorType && (
                      <button
                        onClick={() => onClearActorsByType(editMode.selectedActorType)}
                        disabled={(actorCountByType[editMode.selectedActorType] ?? 0) === 0}
                        title={`Clear all ${editMode.selectedActorType}s`}
                        style={smallButtonStyle((actorCountByType[editMode.selectedActorType] ?? 0) > 0, '#e67700')}
                      >
                        Clear {editMode.selectedActorType}s ({actorCountByType[editMode.selectedActorType] ?? 0})
                      </button>
                    )}
                    {/* Clear all actors */}
                    {onClearAllActors && (
                      <button
                        onClick={onClearAllActors}
                        disabled={actorCount === 0}
                        title="Clear all actors"
                        style={smallButtonStyle(actorCount > 0, '#dc3545')}
                      >
                        Clear All Actors ({actorCount})
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#868e96' }}>
                    Click to place, click again to remove
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Playback Controls */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          onClick={onStart}
          disabled={isRunning || isComplete || isEditMode}
          style={buttonStyle(!isRunning && !isComplete && !isEditMode, '#4CAF50')}
        >
          Start
        </button>
        <button
          onClick={onStop}
          disabled={!isRunning}
          style={buttonStyle(isRunning, '#f44336')}
        >
          Stop
        </button>
        <button
          onClick={onReset}
          disabled={!canReset}
          style={buttonStyle(canReset, '#2196F3')}
        >
          Reset
        </button>
      </div>

      {/* Speed Control */}
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
