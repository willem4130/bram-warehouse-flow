# Warehouse Flow Visualization

A lightweight web tool for logistics consultants to visually explain warehouse flows by animating objects moving through a grid-based layout. Visualizes stories, doesn't simulate.

**Core Formula:** `Flow = Object + Path + Tempo`

**Live Demo:** https://prototypev2.vercel.app

## Project Structure

```
warehouse-flow-visualization/
├── prototype_v2/              # ACTIVE - Current development
│   ├── src/
│   │   ├── components/
│   │   │   ├── GridCanvas.tsx       # Canvas rendering (grid, areas, actors, paths)
│   │   │   ├── Controls.tsx         # Start/Stop/Reset/Speed + edit mode controls
│   │   │   ├── FlowEditor.tsx       # Flow definition sidebar
│   │   │   └── ComparisonView.tsx   # Side-by-side A/B comparison
│   │   ├── hooks/
│   │   │   ├── useSimulation.ts     # Legacy animation (backward compat)
│   │   │   ├── useFlowSimulation.ts # New parallel flow animation
│   │   │   └── useHistory.ts        # Undo/redo state management
│   │   ├── utils/
│   │   │   ├── parseExcalidraw.ts   # Parse .excalidraw JSON to areas/actors
│   │   │   ├── pathfinding.ts       # Manhattan paths, waypoints, assignments
│   │   │   ├── areaManager.ts       # Area CRUD operations
│   │   │   ├── actorManager.ts      # Actor CRUD operations
│   │   │   └── scenarioIO.ts        # Export/import scenarios as JSON
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   ├── App.tsx                  # Main state management
│   │   └── main.tsx                 # Entry point
│   └── public/
│       └── prototype v2.excalidraw  # Grid source file
├── prototype/                 # DEPRECATED - Phase 0 prototype
└── CLAUDE.md                  # This file
```

## Commands

```bash
cd prototype_v2
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # TypeScript check + production build
vercel           # Deploy to Vercel
```

## Code Quality - Zero Tolerance

After editing ANY file, run:

```bash
npm run build
```

Fix ALL TypeScript errors before continuing.

## Tech Stack

- **Framework:** React 18.3 + TypeScript 5.6
- **Build:** Vite 6
- **Rendering:** HTML5 Canvas (40px cells)
- **Animation:** requestAnimationFrame + lerp (30fps React updates)
- **Deployment:** Vercel (auto-deploy on push)

## Key Features

- **Edit Mode:** Paint areas, place actors, undo/redo
- **Flow Definition:** Object-to-destination flows with auto-assignment
- **Parallel Animation:** All actors move simultaneously
- **Multiple Flows:** Different flows run concurrently
- **Comparison Mode:** Side-by-side A/B visualization
- **Waypoint System:** Custom paths via pathOverrides
- **Export/Import:** Save and load scenarios as JSON

## Development Phases

| Phase | Status |
|-------|--------|
| Phase 0: Proof of Concept | ✅ Done |
| Prototype V2: Programmatic Grid | ✅ Done |
| Phase 1A: Grid & Area Foundation | ✅ Done |
| Phase 1B: Actors & Object-to-Destination Flow | ✅ Done |
| Phase 1C: Clear Functionality | ✅ Done |
| Phase 2A: Parallel Animation & Multiple Flows | ✅ Done |
| Phase 2B: Flow UI Improvements | ✅ Done |
| Phase 2C: Comparison Mode | ✅ Done |
| Phase 2D: Waypoint System | ✅ Done |
| Phase 2E: Export/Import | ✅ Done |

## Key Architecture

- **Two rendering systems:** Legacy (gridData) for backward compat, new (areas/actors) for editing
- **Edit mode hides legacy pallets** to avoid confusion
- **History system** tracks areas AND actors for undo/redo
- **Flows contain pathOverrides** for custom waypoints
- **Comparison mode** runs independent simulations per view

## Grid Color Conventions

| Color | Hex | Area Type |
|-------|-----|-----------|
| Grey | `#e9ecef` | Dock |
| Brown | `#d2bab0` | Staging |
| Light Blue | `#a5d8ff` | Storage |
| Light Green | `#b2f2bb` | Picking |
| Yellow | `#ffec99` | Packing |
| Dark Grey | `#495057` | Obstacle |
