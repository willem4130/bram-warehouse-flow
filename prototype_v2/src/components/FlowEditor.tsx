import { useState, useMemo } from 'react';
import {
  Actor,
  Area,
  Flow,
  ObjectToDestinationFlow,
  ActorType,
  ACTOR_TYPE_CONFIGS,
} from '../types';

interface FlowEditorProps {
  actors: Actor[];
  areas: Area[];
  flows: Flow[];
  onCreateFlow: (flow: Flow) => void;
  onDeleteFlow: (flowId: string) => void;
}

// Flow colors for visual distinction
const FLOW_COLORS = [
  '#228be6', // blue
  '#40c057', // green
  '#fab005', // yellow
  '#fa5252', // red
  '#7950f2', // purple
  '#20c997', // teal
  '#fd7e14', // orange
  '#e64980', // pink
];

// Get flow color based on index
function getFlowColor(index: number): string {
  return FLOW_COLORS[index % FLOW_COLORS.length];
}

// Generate unique flow ID
function generateFlowId(): string {
  return `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Button style helper
const buttonStyle = (enabled: boolean, color: string) => ({
  padding: '6px 12px',
  fontSize: '14px',
  backgroundColor: enabled ? color : '#ccc',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: enabled ? 'pointer' : 'not-allowed',
});

export function FlowEditor({
  actors,
  areas,
  flows,
  onCreateFlow,
  onDeleteFlow,
}: FlowEditorProps) {
  // Form state for new flow
  const [flowName, setFlowName] = useState('');
  const [selectedActorType, setSelectedActorType] = useState<ActorType | 'all'>('all');
  const [selectedDestinationAreaId, setSelectedDestinationAreaId] = useState<string>('');
  const [assignmentType, setAssignmentType] = useState<'auto-nearest' | 'manual'>('auto-nearest');

  // Get actors filtered by type
  const filteredActors = useMemo(() => {
    if (selectedActorType === 'all') return actors;
    return actors.filter((actor) => actor.type === selectedActorType);
  }, [actors, selectedActorType]);

  // Get destination areas (exclude obstacles, empty)
  const destinationAreas = useMemo(() => {
    return areas.filter(
      (area) => area.type !== 'obstacle' && area.type !== 'empty' && area.cells.length > 0
    );
  }, [areas]);

  // Actor types that have actors placed
  const actorTypesWithActors = useMemo(() => {
    const types = new Set(actors.map((a) => a.type));
    return ACTOR_TYPE_CONFIGS.filter((config) => types.has(config.type));
  }, [actors]);

  // Validate form
  const canCreateFlow =
    flowName.trim() !== '' &&
    filteredActors.length > 0 &&
    selectedDestinationAreaId !== '';

  // Handle create flow
  const handleCreateFlow = () => {
    if (!canCreateFlow) return;

    const newFlow: ObjectToDestinationFlow = {
      id: generateFlowId(),
      name: flowName.trim(),
      flowType: 'object-to-destination',
      actorIds: filteredActors.map((a) => a.id),
      destinationAreaId: selectedDestinationAreaId,
      assignment: assignmentType,
    };

    onCreateFlow(newFlow);

    // Reset form
    setFlowName('');
    setSelectedActorType('all');
    setSelectedDestinationAreaId('');
  };

  // Get destination area name
  const getAreaLabel = (areaId: string) => {
    const area = areas.find((a) => a.id === areaId);
    return area?.label ?? 'Unknown';
  };

  return (
    <div
      style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '16px',
        border: '1px solid #dee2e6',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#495057' }}>
        Flow Editor
      </h3>

      {/* Existing Flows */}
      {flows.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#868e96' }}>
            Active Flows ({flows.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {flows.map((flow, index) => {
              const flowColor = getFlowColor(index);
              return (
                <div
                  key={flow.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    border: `2px solid ${flowColor}`,
                    borderLeft: `4px solid ${flowColor}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Color indicator */}
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: flowColor,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <span style={{ fontWeight: 500, color: '#343a40' }}>{flow.name}</span>
                      <div style={{ color: '#868e96', fontSize: '12px', marginTop: '2px' }}>
                        {flow.flowType === 'object-to-destination'
                          ? `${flow.actorIds.length} actors → ${getAreaLabel(flow.destinationAreaId)}`
                          : `Route with ${flow.waypoints.length} stops`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => onDeleteFlow(flow.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#fa5252',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      title="Delete flow"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Flow Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h4 style={{ margin: '0', fontSize: '14px', color: '#868e96' }}>
          Create Object-to-Destination Flow
        </h4>

        {/* Flow Name */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#495057', minWidth: '100px' }}>
            Flow Name:
          </label>
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            placeholder="e.g., Dock Loading"
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              flex: 1,
            }}
          />
        </div>

        {/* Actor Type Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#495057', minWidth: '100px' }}>
            Actors:
          </label>
          <select
            value={selectedActorType}
            onChange={(e) => setSelectedActorType(e.target.value as ActorType | 'all')}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
            }}
          >
            <option value="all">All actors ({actors.length})</option>
            {actorTypesWithActors.map((config) => {
              const count = actors.filter((a) => a.type === config.type).length;
              return (
                <option key={config.type} value={config.type}>
                  {config.label}s ({count})
                </option>
              );
            })}
          </select>
          <span style={{ fontSize: '12px', color: '#868e96' }}>
            {filteredActors.length} selected
          </span>
        </div>

        {/* Destination Area */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#495057', minWidth: '100px' }}>
            Destination:
          </label>
          <select
            value={selectedDestinationAreaId}
            onChange={(e) => setSelectedDestinationAreaId(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
            }}
          >
            <option value="">Select destination area...</option>
            {destinationAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.label} ({area.cells.length} cells)
              </option>
            ))}
          </select>
        </div>

        {/* Assignment Type */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '14px', color: '#495057', minWidth: '100px' }}>
            Assignment:
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="assignment"
                value="auto-nearest"
                checked={assignmentType === 'auto-nearest'}
                onChange={() => setAssignmentType('auto-nearest')}
              />
              <span style={{ fontSize: '14px' }}>Auto (nearest)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="assignment"
                value="manual"
                checked={assignmentType === 'manual'}
                onChange={() => setAssignmentType('manual')}
              />
              <span style={{ fontSize: '14px' }}>Manual</span>
            </label>
          </div>
        </div>

        {/* Create Button */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={handleCreateFlow}
            disabled={!canCreateFlow}
            style={buttonStyle(canCreateFlow, '#228be6')}
          >
            Create Flow
          </button>
          {!canCreateFlow && (
            <span style={{ fontSize: '12px', color: '#868e96', alignSelf: 'center' }}>
              {actors.length === 0
                ? 'Place actors first'
                : destinationAreas.length === 0
                  ? 'Paint destination areas first'
                  : 'Fill in all fields'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
