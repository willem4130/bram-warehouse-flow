import { Actor, ActorType, Point, ACTOR_TYPE_CONFIGS } from '../types';

/**
 * Generate a unique ID for actors
 */
function generateActorId(): string {
  return `actor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get the default config for an actor type
 */
export function getActorTypeConfig(type: ActorType) {
  return ACTOR_TYPE_CONFIGS.find((config) => config.type === type) ?? ACTOR_TYPE_CONFIGS[0];
}

/**
 * Create a new actor at the specified position
 */
export function createActor(
  type: ActorType,
  position: Point,
  label?: string,
  customColor?: string
): Actor {
  const config = getActorTypeConfig(type);
  return {
    id: generateActorId(),
    type,
    label,
    color: customColor ?? config.defaultColor,
    startPosition: { ...position },
  };
}

/**
 * Add an actor to the actors array
 * Returns a new array (immutable)
 */
export function addActor(actors: Actor[], actor: Actor): Actor[] {
  return [...actors, actor];
}

/**
 * Remove an actor by ID
 * Returns a new array (immutable)
 */
export function removeActor(actors: Actor[], actorId: string): Actor[] {
  return actors.filter((actor) => actor.id !== actorId);
}

/**
 * Update an actor's properties
 * Returns a new array (immutable)
 */
export function updateActor(
  actors: Actor[],
  actorId: string,
  updates: Partial<Omit<Actor, 'id'>>
): Actor[] {
  return actors.map((actor) =>
    actor.id === actorId ? { ...actor, ...updates } : actor
  );
}

/**
 * Move an actor to a new position
 * Returns a new array (immutable)
 */
export function moveActor(actors: Actor[], actorId: string, newPosition: Point): Actor[] {
  return updateActor(actors, actorId, { startPosition: newPosition });
}

/**
 * Find an actor at a specific cell position
 */
export function findActorAtPosition(actors: Actor[], position: Point): Actor | undefined {
  return actors.find(
    (actor) =>
      actor.startPosition.x === position.x && actor.startPosition.y === position.y
  );
}

/**
 * Find actors by type
 */
export function findActorsByType(actors: Actor[], type: ActorType): Actor[] {
  return actors.filter((actor) => actor.type === type);
}

/**
 * Check if a cell is occupied by an actor
 */
export function isCellOccupied(actors: Actor[], position: Point): boolean {
  return findActorAtPosition(actors, position) !== undefined;
}

/**
 * Toggle an actor at a position:
 * - If there's already an actor of the same type, remove it
 * - If there's an actor of different type, replace it
 * - If empty, add new actor
 */
export function toggleActorAtPosition(
  actors: Actor[],
  position: Point,
  actorType: ActorType
): Actor[] {
  const existingActor = findActorAtPosition(actors, position);

  if (existingActor) {
    if (existingActor.type === actorType) {
      // Same type: remove it
      return removeActor(actors, existingActor.id);
    } else {
      // Different type: replace it
      const withoutOld = removeActor(actors, existingActor.id);
      return addActor(withoutOld, createActor(actorType, position));
    }
  } else {
    // No actor: add new one
    return addActor(actors, createActor(actorType, position));
  }
}

/**
 * Get all actor positions as a Set for efficient lookup
 */
export function getActorPositionSet(actors: Actor[]): Set<string> {
  return new Set(
    actors.map((actor) => `${actor.startPosition.x},${actor.startPosition.y}`)
  );
}

/**
 * Count actors by type
 */
export function countActorsByType(actors: Actor[]): Record<ActorType, number> {
  const counts: Record<ActorType, number> = {
    pallet: 0,
    forklift: 0,
    picker: 0,
    cart: 0,
    custom: 0,
  };

  actors.forEach((actor) => {
    counts[actor.type]++;
  });

  return counts;
}
