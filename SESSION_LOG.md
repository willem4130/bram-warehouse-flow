# Session Log

This file tracks where we left off each session to maintain continuity.

---

## Session 1 - 2024-12-23

### What We Did
1. **Project Understanding**
   - Reviewed the conceptual flow model document
   - Analyzed the Excalidraw warehouse layout example
   - Confirmed the project is a visualization tool, NOT a simulation

2. **Defined the Vision**
   - Target user: Logistics consultant explaining warehouse concepts
   - Core value: Visual comparison of current vs recommended flows
   - Philosophy: "The app visualizes a story, it doesn't calculate truth"

3. **Documented Example Use Cases**
   - 2-step vs 1-step put-away (EPT + RT vs RT only)
   - Customer-centric vs flow-centric order processing

4. **Technical Decisions**
   - Platform: Web app (browser-based)
   - Stack: React + TypeScript + Canvas
   - Grid source: Excalidraw files (.excalidraw JSON)
   - Animation: requestAnimationFrame + lerp (vanilla JS)

5. **Defined Development Phases**
   - Phase 0: Load Excalidraw, show object, animate A→B
   - Phase 1: Waypoints, play/pause, timer, speed setting
   - Phase 2: Multiple scenarios, comparisons, save/load

6. **Research**
   - Searched GitHub for similar projects (none found - market gap!)
   - Found Excalidraw integration examples
   - Assessed MCP servers (limited value for this project)

7. **Documentation Strategy**
   - CLAUDE.md: Primary guide for Claude
   - CHANGELOG.md: Version history
   - SESSION_LOG.md: This file
   - DECISIONS.md: Key decisions with rationale

8. **Created All Documentation Files**

### What's Next (Phase 0)
1. Initialize React + TypeScript project (Vite)
2. Create basic app structure
3. Load Excalidraw file and display as background
4. Add a simple colored block (the "object")
5. Hardcode a path (two points: A and B)
6. Animate the block moving from A to B
7. That's it - Phase 0 complete!

### Open Questions for Next Session
- Exact grid cell size (0.5m or 1m)?
- How to map Excalidraw coordinates to meaningful positions?
- Simple timer display or just animation for now?

### Files Modified This Session
- `CLAUDE.md` - Created comprehensive project guide
- `CHANGELOG.md` - Created
- `SESSION_LOG.md` - Created (this file)
- `DECISIONS.md` - Created

---

## Session 2 - 2024-12-24 (Part 1)

### What We Did
1. **Built Phase 0 Prototype**
   - Created React + TypeScript project with Vite in `/prototype` folder
   - Implemented pallet animation along path: B8 → B9 → I9 → I3 → U3 → U1
   - Animation timing: 1 second per cell, 2 second wait at destination, then loop

2. **Technical Implementation**
   - Initially tried `@excalidraw/excalidraw` React component - **too heavy, caused page freeze**
   - Switched to PNG + Canvas approach - **works well, lightweight**
   - Created animation system with `requestAnimationFrame` + lerp interpolation

3. **Key Files Created**
   - `prototype/src/components/WarehouseView.tsx` - Canvas rendering with pallet
   - `prototype/src/hooks/useAnimation.ts` - Animation state machine
   - `prototype/src/utils/gridCoordinates.ts` - Grid-to-pixel conversion
   - `prototype/src/utils/pathInterpolation.ts` - Lerp calculations
   - `prototype/src/constants/config.ts` - Grid config, waypoints, timing

4. **Documented Learnings**
   - Created `~/.claude/plans/warehouse-flow-prototype-learnings.md`
   - Key insight: Excalidraw JSON coordinates ≠ PNG pixel coordinates
   - Grid calibration needed before next phase

---

## Session 3 - 2024-12-24 (Part 2)

### What We Did

1. **Recognized Need for Better Planning**
   - User identified that PNG background approach is too superficial
   - App should "understand" the grid, not just display a picture
   - Decided: Parse Excalidraw JSON to render grid programmatically (ADR-009)

2. **Decided Against Premature Coding**
   - User correctly identified we were jumping to code too quickly
   - Agreed to set up proper product planning before implementation

3. **Researched Custom Agents**
   - Used grep-mcp to search GitHub for agent examples
   - Found excellent references:
     - `avivl/claude-007-agents` - 100+ agents including product-manager, ux-designer
     - `dgunning/edgartools` - Production product-manager agent
     - `marcioaltoe/claude-code-framework` - business-analyst agent

4. **Created Custom Agents**
   Created `.claude/agents/` with three specialized agents:
   - `product-manager.md` - Guards philosophy, prioritizes features, writes user stories
   - `ux-designer.md` - Designs user journeys, UI layout, interaction patterns
   - `logistics-domain-expert.md` - Validates warehouse concepts, provides domain knowledge

5. **Documented Decisions**
   - ADR-009: Programmatic grid rendering from Excalidraw data
   - ADR-010: Custom agents for product planning

### Current State
- Three custom agents are set up and ready to use
- Plan approved: Agents → Product Definition → Then Code
- No more code written until product is properly defined

### What's Next (Phase B: Product Definition)
1. **B1**: Map user journey using ux-designer + product-manager agents
2. **B2**: Write feature specs using product-manager + logistics-expert agents
3. **B3**: Design UI using ux-designer agent
4. **B4**: Define success criteria using product-manager agent
5. **Then**: Implement MVP (Phase C)

### Files Created This Session
- `.claude/agents/product-manager.md`
- `.claude/agents/ux-designer.md`
- `.claude/agents/logistics-domain-expert.md`
- Updated `DECISIONS.md` with ADR-009 and ADR-010

### Key Insight
> "Measure twice, cut once"
>
> Setting up agents and doing proper product planning BEFORE coding will result in a better product than jumping straight to implementation.

---

## Session 4 - 2024-12-24

### What We Did

1. **Evaluated Agent Coverage**
   - User asked: are any agents missing?
   - Identified gap: no technical/programming expertise in agent roster
   - User is warehouse domain expert, not a tech expert
   - Risk: blind spots for technical decisions without a technical agent

2. **Created Frontend Engineer Agent**
   - Created `.claude/agents/frontend-engineer.md`
   - Key responsibilities:
     - Guards "no backend needed" principle
     - React + TypeScript architecture guidance
     - Canvas rendering and animation patterns
     - Excalidraw JSON parsing strategy
     - State management (Zustand/Jotai)
     - Code simplicity and performance review

3. **Documented Decision**
   - Added ADR-011: Frontend Engineer Agent for Technical Decisions

### Current Agent Roster

| Agent | Focus |
|-------|-------|
| product-manager | What to build, guards philosophy |
| ux-designer | How it looks/feels, user journeys |
| logistics-domain-expert | Warehouse domain correctness |
| frontend-engineer | Technical architecture, guards "no backend" |

### What's Next
Continue with Phase A (Product Definition):
1. Map user journey (ux-designer + product-manager)
2. Write feature specs (product-manager + logistics-expert)
3. Design UI (ux-designer)
4. Define success criteria (product-manager)

### Files Modified This Session
- `.claude/agents/frontend-engineer.md` (created)
- `CLAUDE.md` (updated agents table)
- `CHANGELOG.md` (added v0.2.1)
- `DECISIONS.md` (added ADR-011)
- `SESSION_LOG.md` (this update)

---

## Session 5 - 2025-01-02

### What We Did

1. **Built Prototype V2** in `/prototype v2` folder
   - Complete rewrite with programmatic grid rendering from Excalidraw JSON
   - Parses `.excalidraw` file to extract grid cells, pallets, and docks
   - Renders grid on Canvas (no PNG background)
   - Animated pallet movement with Manhattan paths (L-shaped: horizontal then vertical)

2. **Key Features Implemented**
   - Start/Stop buttons
   - Timer display (elapsed time)
   - Progress indicator (docks filled: X/15)
   - 15 pallets move one-by-one to 15 loading docks
   - Random dock selection, but fill from back to front (farthest from pallets first)
   - Automatic stop when all docks are filled

3. **Critical Technical Learnings**

   **Animation Performance Issue:**
   - Calling `setState` inside `requestAnimationFrame` at 60fps freezes the browser
   - Solution: Use refs for animation state, throttle React state updates to ~30fps

   **Grid Alignment Issue:**
   - Excalidraw positions don't always align to grid (e.g., pallets at x=405 instead of x=400)
   - Solution: Snap positions to nearest grid cell when parsing

   **Pathfinding Infinite Loop:**
   - Using fixed CELL_SIZE steps (while currentX !== end.x) causes infinite loop when positions don't align
   - Solution: Use point-to-point paths with waypoints (L-shaped) and lerp interpolation

4. **File Structure Created**
   ```
   prototype v2/
   ├── src/
   │   ├── types/index.ts           # TypeScript interfaces
   │   ├── utils/parseExcalidraw.ts # Parse .excalidraw JSON, snap to grid
   │   ├── utils/pathfinding.ts     # Manhattan paths, lerp, path duration
   │   ├── hooks/useSimulation.ts   # Animation state, pallet movement logic
   │   ├── components/GridCanvas.tsx # Canvas rendering
   │   ├── components/Controls.tsx   # Start/Stop buttons
   │   ├── App.tsx                  # Main layout with timer
   │   └── App.css                  # Styling
   ├── public/
   │   └── prototype v2.excalidraw  # Grid source file
   └── package.json, tsconfig.json, etc.
   ```

5. **Design Decisions**
   - Speed: 200 pixels/second for pallet movement
   - Render throttling: 30fps for React state updates (smooth enough, no browser freeze)
   - Dock filling: Back to front (highest Y first), random within same row
   - Grid colors: #e9ecef (grey) = docks, #d2bab0 (brown) = pallets

### Technical Patterns Documented

**Animation with React:**
```typescript
// BAD: setState at 60fps freezes browser
const animate = (timestamp) => {
  setState({...}); // Called 60 times per second!
  requestAnimationFrame(animate);
};

// GOOD: Use refs, throttle state updates
const animate = (timestamp) => {
  palletsRef.current[i].x = newX; // Update ref (fast)
  if (timestamp - lastRender > 33) { // ~30fps
    setState({...}); // Update React state (slower, triggers render)
    lastRender = timestamp;
  }
  requestAnimationFrame(animate);
};
```

**Manhattan Pathfinding:**
```typescript
// BAD: Fixed cell steps (infinite loop risk)
while (currentX !== end.x) {
  currentX += CELL_SIZE; // Never equals end.x if misaligned!
}

// GOOD: Point-to-point with waypoint
function generatePath(start, end) {
  const waypoint = { x: end.x, y: start.y }; // L-shaped path
  return [start, waypoint, end];
}
```

### What's Next
- Prototype V2 is complete and working
- Ready for user testing and feedback
- Potential enhancements: reset button, speed control, path visualization

### Files Modified This Session
- Created entire `prototype v2/` folder structure
- Updated documentation (this session)

---

## How to Use This File

**At the start of a new session:**
1. Read CLAUDE.md for project context
2. Read the latest session entry in this file
3. Continue from "What's Next"

**At the end of each session:**
Claude will update this file with:
- What was accomplished
- What's next
- Any open questions or blockers
