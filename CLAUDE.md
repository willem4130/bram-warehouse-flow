# Warehouse Flow Visualization

A lightweight web tool for logistics consultants to visually explain warehouse flows by animating objects moving through a grid-based layout. Visualizes stories, doesn't simulate.

**Core Formula:** `Flow = Object + Path + Tempo`

## Project Structure

```
warehouse-flow-visualization/
├── prototype_v2/              # ACTIVE - Current development
│   ├── src/
│   │   ├── components/
│   │   │   ├── GridCanvas.tsx     # Canvas rendering (grid, pallets, paths)
│   │   │   └── Controls.tsx       # Start/Stop/Reset/Speed controls
│   │   ├── hooks/
│   │   │   └── useSimulation.ts   # Animation state & pallet movement
│   │   ├── utils/
│   │   │   ├── parseExcalidraw.ts # Parse .excalidraw JSON to grid data
│   │   │   └── pathfinding.ts     # Manhattan paths, lerp interpolation
│   │   ├── types/index.ts         # TypeScript interfaces
│   │   ├── App.tsx                # Main app with timer/progress
│   │   └── main.tsx               # Entry point
│   └── public/
│       └── prototype v2.excalidraw  # Grid source file
├── prototype/                 # DEPRECATED - Phase 0 prototype
├── .claude/agents/            # Custom Claude agents for planning
├── DECISIONS.md               # Architecture Decision Records (ADR-001 to ADR-014)
├── SESSION_LOG.md             # Development session history
└── CHANGELOG.md               # Version history
```

## Commands

```bash
cd prototype_v2
npm install
npm run dev      # Dev server at http://localhost:5173
npm run build    # TypeScript check + production build
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

## Organization Rules

- **Components** → `src/components/` (one per file)
- **Hooks** → `src/hooks/` (custom React hooks)
- **Utilities** → `src/utils/` (pure functions)
- **Types** → `src/types/index.ts` (shared interfaces)

## Key Constraints

- **No backend** - Client-side only
- **No simulation** - Visualization tool, not optimizer
- **Manhattan paths only** - No diagonals
- **Excalidraw JSON** - Grid source (colors define zones)

## Development Phases

| Phase | Status |
|-------|--------|
| Phase 0: Proof of Concept | Done |
| Prototype V2: Programmatic Grid | Done |
| Phase 1: MVP (waypoint clicking) | Next |
| Phase 2: Comparison View | Future |

## Grid Color Conventions

- `#e9ecef` (grey) → Loading docks
- `#d2bab0` (brown) → Pallet staging area
