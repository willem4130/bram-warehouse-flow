# Architecture Decision Records

This file documents key decisions made during the project and their rationale.

---

## ADR-001: Visualization Tool, Not Simulation

**Date**: 2024-12-23
**Status**: Accepted

### Context
The project could be built as either a simulation tool (calculating optimal routes, throughput, etc.) or a visualization tool (showing movement to explain concepts).

### Decision
Build a **visualization tool** that explains logistics flows, not a simulation that optimizes them.

### Rationale
- Target user is a consultant who needs to explain concepts to clients
- Simulations are complex, require accurate data, and are hard to validate
- Visual explanations are more accessible and support conversations
- "The app doesn't calculate towards truth, but visualizes a story"

### Consequences
- No pathfinding algorithms needed
- No optimization logic
- No need for real-world accuracy
- Simpler to build and maintain

---

## ADR-002: Web App Platform

**Date**: 2024-12-23
**Status**: Accepted

### Context
The app could be built as a web app, desktop app, or both.

### Decision
Build as a **web app** (browser-based).

### Rationale
- Easy to share with clients (just send a URL)
- Excalidraw is a web app - native integration
- Simpler deployment and updates
- Can be wrapped as desktop app later if needed (Electron, PWA)

### Consequences
- Works on any device with a browser
- Requires hosting for production use
- No offline capability initially (can add PWA later)

---

## ADR-003: Excalidraw as Grid Source

**Date**: 2024-12-23
**Status**: Accepted

### Context
Need a way to define warehouse layouts. Options: custom editor, import from CAD, use existing drawing tool.

### Decision
Use **Excalidraw files** (.excalidraw JSON) as the source for warehouse layouts.

### Rationale
- User already has warehouse layouts in Excalidraw
- Excalidraw is free, open-source, and familiar
- .excalidraw files are JSON - easy to parse
- Excalidraw can be embedded in React later
- Maintains the "hand-drawn" visual style

### Consequences
- Need to parse Excalidraw JSON format
- Zones are visual only (no semantic meaning)
- Grid coordinates must be mapped from Excalidraw coordinates

---

## ADR-004: React + TypeScript Stack

**Date**: 2024-12-23
**Status**: Accepted

### Context
Need to choose a frontend framework and language.

### Decision
Use **React + TypeScript** with Vite as build tool.

### Rationale
- Excalidraw is built in React - seamless integration
- TypeScript provides type safety for complex state (flows, paths)
- Vite offers fast development experience
- Large ecosystem and community support

### Consequences
- Modern tooling required (Node.js)
- Learning curve for non-React developers
- Good long-term maintainability

---

## ADR-005: Vanilla Animation (No Library)

**Date**: 2024-12-23
**Status**: Accepted

### Context
Need smooth animation for moving objects. Options: animation library (Framer Motion, GSAP), or vanilla JS.

### Decision
Use **vanilla JavaScript** with `requestAnimationFrame` and `lerp()` for animations.

### Rationale
- Animation requirements are simple (move A to B)
- No need for complex physics or easing
- Reduces dependencies
- Full control over animation behavior

### Consequences
- Must implement animation loop manually
- Can add library later if needs become complex

---

## ADR-006: English UI and Code

**Date**: 2024-12-23
**Status**: Accepted

### Context
User is Dutch, but app could be in Dutch or English.

### Decision
- **UI**: English
- **Code/comments**: English

### Rationale
- Standard practice for code
- Easier to share or open-source later
- Concept documents can remain in Dutch

### Consequences
- UI text in English
- All code, variables, comments in English

---

## ADR-007: Phased Development Approach

**Date**: 2024-12-23
**Status**: Accepted

### Context
Project has many potential features. Need to prioritize.

### Decision
Develop in three phases:
- **Phase 0**: Proof of concept (load, display, animate)
- **Phase 1**: Minimal viable tool (waypoints, controls, timer)
- **Phase 2**: Serious app (scenarios, comparisons, save/load)

### Rationale
- Validates core concept before building features
- Each phase delivers usable value
- Allows for learning and adjustment

### Consequences
- Phase 0 has minimal features (intentionally)
- Must resist adding features too early

---

## ADR-008: Documentation Strategy

**Date**: 2024-12-23
**Status**: Accepted

### Context
Need consistent documentation for a solo project with AI assistance.

### Decision
Maintain four documents:
- `CLAUDE.md` - Primary guide for Claude (project context, constraints)
- `CHANGELOG.md` - Version history
- `SESSION_LOG.md` - Session continuity (auto-updated by Claude)
- `DECISIONS.md` - This file (key decisions)

### Rationale
- Claude doesn't have memory between sessions
- CLAUDE.md provides context at session start
- SESSION_LOG.md maintains continuity
- Avoids documentation overload

### Consequences
- Must keep documents updated
- SESSION_LOG.md updated at end of each session

---

## ADR-009: Programmatic Grid Rendering from Excalidraw Data

**Date**: 2024-12-24
**Status**: Accepted

### Context
The Phase 0 prototype used a PNG export as background with the pallet drawn on top. This approach has limitations:
- App doesn't "understand" the warehouse layout
- Can't interact with individual cells (click to define path)
- Zones have no meaning to the app
- Just a picture with an object floating above it

### Decision
**Parse the Excalidraw JSON file and render the grid programmatically**, instead of using a static PNG image.

The app will:
1. Read the .excalidraw file
2. Extract shapes (rectangles) and their properties (color, position, size)
3. Map shapes to grid cells
4. Determine zone types based on color conventions
5. Render the grid using canvas/code (not a picture)

### Rationale
- App gains "understanding" of the layout (which cells are racking, floor, etc.)
- Enables click-to-define-path in future phases
- Keeps the visual Excalidraw workflow the user likes
- Foundation for future features (zone highlighting, occupancy, etc.)

### Future Vision
Eventually integrate Excalidraw editor directly into the app, but that's a later phase.

### Consequences
- Need to define color conventions (orange = racking, gray = floor, etc.)
- Shapes in Excalidraw must align to grid
- More complex than PNG approach, but more capable
- Phase 0 prototype approach is superseded

### Color Conventions (to be refined)
| Color | Zone Type |
|-------|-----------|
| Orange | Pallet racking |
| Gray | Floor/staging area |
| Brown | MHE / equipment |
| Blue | Loading door indicator |

---

## ADR-010: Custom Agents for Product Planning

**Date**: 2024-12-24
**Status**: Accepted

### Context
The Phase 0 prototype was built without proper product definition. We jumped to coding too quickly, resulting in a technically working but not well-specified product.

### Decision
Set up **custom Claude Code agents** to properly plan the product before coding:

1. **product-manager** - Guards philosophy, prioritizes features, writes user stories
2. **ux-designer** - Designs user journeys, UI layout, interaction patterns
3. **logistics-domain-expert** - Validates warehouse concepts, provides domain knowledge

### Rationale
- "Measure twice, cut once" - proper planning prevents rework
- Specialized agents bring focused expertise to each aspect
- Agents can be reused throughout the project lifecycle
- User (logistics consultant) can focus on domain knowledge while agents handle planning structure

### Implementation
Agents are stored in `.claude/agents/`:
- `product-manager.md`
- `ux-designer.md`
- `logistics-domain-expert.md`

### Workflow
1. Use agents to define user journey (Phase B1)
2. Use agents to write feature specs (Phase B2)
3. Use agents to design UI (Phase B3)
4. Use agents to define success criteria (Phase B4)
5. Only then: implement (Phase C)

### Consequences
- More upfront planning time
- Better defined product before coding
- Agents available for ongoing product decisions
- Clear separation of concerns (product vs UX vs domain)

---

## ADR-011: Frontend Engineer Agent for Technical Decisions

**Date**: 2024-12-24
**Status**: Accepted

### Context
The initial agent roster (product-manager, ux-designer, logistics-domain-expert) focused on product planning but lacked technical expertise. The project owner is a warehouse/logistics expert, not a technical expert, creating a potential blind spot for:
- Architecture decisions
- Technology choices
- Performance considerations
- Whether something needs a backend

Additionally, the early conclusion that "this is a client-side only app with no backend" should be validated and guarded by someone with technical knowledge.

### Decision
Add a **frontend-engineer agent** to provide technical oversight:
- Guards the "no backend needed" principle
- Advises on React, TypeScript, and Canvas patterns
- Guides Excalidraw JSON parsing approach
- Recommends state management solutions
- Reviews code for simplicity and performance
- Pushes back on unnecessary complexity

### Rationale
- Fills the technical expertise gap in the agent roster
- User can focus on domain knowledge while agents handle technical planning
- Ensures technical decisions align with "keep it simple" philosophy
- Can challenge assumptions (like "no backend") when warranted

### Implementation
Agent stored in `.claude/agents/frontend-engineer.md`

### Key Principles in the Agent
1. **Client-side only by default** - Question any server/database suggestions
2. **Keep it simple** - Prefer vanilla JS over libraries when simpler
3. **Build for now** - No premature optimization or hypothetical requirements
4. **Zustand over Redux** - Lighter state management for this scale

### Consequences
- Technical decisions now have dedicated oversight
- Four agents cover the full spectrum: product, UX, domain, and tech
- All major decision areas are represented

---

## ADR-012: React Animation Pattern with requestAnimationFrame

**Date**: 2025-01-02
**Status**: Accepted

### Context
When building Prototype V2, the initial animation implementation called `setState` inside `requestAnimationFrame` at 60fps. This caused the browser to freeze completely because React couldn't keep up with 60 state updates per second.

### Decision
Use a **hybrid approach** for animations in React:
1. Store animation state in **refs** (position, timing, etc.) - updated at 60fps
2. **Throttle** React state updates to ~30fps (every 33ms)
3. Use refs to control animation flow (isRunning, currentIndex, etc.)

### Implementation Pattern
```typescript
// Refs for animation state (no re-renders)
const palletsRef = useRef<Pallet[]>([]);
const lastRenderTimeRef = useRef(0);
const RENDER_INTERVAL = 33; // ~30fps

const animate = (timestamp: number) => {
  // Update position in ref (fast, no re-render)
  palletsRef.current[i].x = newPosition.x;

  // Throttle React state updates
  if (timestamp - lastRenderTimeRef.current >= RENDER_INTERVAL) {
    lastRenderTimeRef.current = timestamp;
    setState({ pallets: [...palletsRef.current] }); // Trigger re-render
  }

  requestAnimationFrame(animate);
};
```

### Rationale
- React state updates are expensive (reconciliation, re-render, etc.)
- 60fps state updates overwhelm React's batching mechanism
- 30fps is visually smooth enough for most animations
- Refs provide instant updates without triggering re-renders
- This pattern is standard in React game/animation development

### Consequences
- Animation logic is slightly more complex (refs + state)
- Must remember to sync refs to state periodically
- Smooth animations without browser freeze
- Works well for Canvas-based rendering

---

## ADR-013: Grid Position Snapping for Excalidraw Data

**Date**: 2025-01-02
**Status**: Accepted

### Context
When parsing the Excalidraw file for Prototype V2, we discovered that element positions don't always align to a clean grid. For example:
- Pallets were at x=405, 445, 485... instead of x=400, 440, 480...
- This 5-pixel offset caused pathfinding issues (infinite loops when stepping by CELL_SIZE)

### Decision
**Snap element positions to the nearest grid cell** when parsing Excalidraw data.

### Implementation
```typescript
const CELL_SIZE = 40;
const GRID_ORIGIN_X = 400;

function snapToGrid(x: number, y: number) {
  const snappedX = Math.round((x - GRID_ORIGIN_X) / CELL_SIZE) * CELL_SIZE + GRID_ORIGIN_X;
  const snappedY = Math.round((y - GRID_ORIGIN_Y) / CELL_SIZE) * CELL_SIZE + GRID_ORIGIN_Y;
  return { x: snappedX, y: snappedY };
}
```

### Rationale
- Excalidraw doesn't enforce grid snapping by default
- Manual placement in Excalidraw can be slightly off
- Snapping ensures consistent grid-based logic
- Prevents pathfinding issues caused by misalignment

### Consequences
- Elements appear in consistent grid positions
- Pathfinding works reliably
- Small visual adjustments from original Excalidraw positions (usually imperceptible)

---

## ADR-014: Manhattan Pathfinding with Waypoints

**Date**: 2025-01-02
**Status**: Accepted

### Context
Initial pathfinding implementation stepped through cells one at a time:
```typescript
while (currentX !== end.x) {
  currentX += CELL_SIZE;
}
```
This caused infinite loops when start and end positions weren't aligned to the same grid (405 → 440 never equals with 40px steps).

### Decision
Use **waypoint-based Manhattan paths** instead of cell-stepping:
1. Generate 2-3 waypoints (start → corner → end) for L-shaped path
2. Use **lerp interpolation** to smoothly animate between waypoints
3. Calculate path duration based on total pixel distance, not cell count

### Implementation
```typescript
function generatePath(start: Point, end: Point): Point[] {
  // L-shaped path: horizontal first, then vertical
  const waypoint = { x: end.x, y: start.y };
  return [start, waypoint, end];
}

function getPathDuration(path: Point[]): number {
  const length = getPathLength(path); // Total pixels
  return (length / SPEED) * 1000; // milliseconds
}
```

### Rationale
- Works regardless of grid alignment
- Simpler logic (no cell-by-cell stepping)
- Lerp provides smooth animation
- Duration based on distance, not cell count
- Still maintains Manhattan movement (no diagonals)

### Consequences
- Paths are always valid (no infinite loops)
- Animation speed is consistent (pixels/second, not cells/second)
- Works with any start/end positions
