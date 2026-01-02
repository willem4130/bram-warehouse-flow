# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Warehouse Flow Visualization App** - A lightweight visual tool to explain logistics flows in warehouses. The app visualizes stories, it doesn't simulate or optimize.

**Target User**: Logistics consultant explaining warehouse concepts to clients
**Core Problem**: Current tools (PowerPoint, whiteboard, Excel) take too long to prepare, produce static images that don't convey movement and timing
**Core Value**: Show "current state" vs "recommended state" with movement and timing to make the case for change visually undeniable

## Core Philosophy

- **Explain, don't simulate** - This is NOT a simulation tool
- **Visual storytelling over calculations** - The app doesn't calculate truth, it visualizes a story
- **The user tells the story, the app visualizes it**
- **Keep it simple** - No over-engineering, only what's needed

### The Formula
```
Flow = Object + Path + Tempo
```

## Technical Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Platform | Web app (browser-based) | |
| Framework | React + TypeScript | Excalidraw is built in React |
| Rendering | HTML5 Canvas | Via Excalidraw or custom layer |
| Grid source | Excalidraw files (.excalidraw JSON) | Import first, embed editor later |
| State management | Zustand or Jotai | TBD |
| Animation | requestAnimationFrame + lerp | Vanilla JS, no library needed |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Web App                             │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │  Excalidraw     │  │  Animation Layer            │   │
│  │  (Background)   │  │  (Moving Objects)           │   │
│  │                 │  │                             │   │
│  │  - Grid         │  │  - Object position          │   │
│  │  - Zones        │  │  - Path following           │   │
│  │  - Labels       │  │  - Timer display            │   │
│  └─────────────────┘  └─────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  State: flows[], currentFlow, isPlaying, elapsedTime    │
└─────────────────────────────────────────────────────────┘
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Grid** | Fixed 2D top-down view, square cells (0.5m or 1m), orthogonal movement only |
| **Object** | Moving block (pallet, order, item) with color/label |
| **Path** | User-defined route: start → waypoints → end. No pathfinding. |
| **Tempo** | Speed per grid cell, varies by MHE type |
| **Flow** | Object + Path + Tempo combined |

## Standard Elements (Future)

### Material Handling Equipment (MHE)
| Type | Dutch | Default Speed |
|------|-------|---------------|
| Electric Pallet Truck | EPT | ~2.5 m/s |
| Reach Truck | RT | ~1.8 m/s |
| Forklift | HT | ~2.0 m/s |

### Warehouse Zones
Loading door (Laaddeur), In/outbound lane, Pallet racking (Palletstelling), Shelving (Legbordstelling), Consolidation area (Consolidatiegebied), Packing table (Inpaktafel)

## Constraints & Policies

- **UI language**: English
- **Code/comments**: English
- **No over-engineering**: Only build what's needed
- **No simulation**: Explain and visualize, don't calculate "optimal" solutions
- **Manhattan distance only**: No diagonals, no automatic pathfinding
- **Product planning first**: Use custom agents to define features before coding
- **Programmatic grid**: Parse Excalidraw JSON, don't just display PNG (ADR-009)

## Custom Agents

The project uses specialized Claude Code agents as a collaborative team. Each agent brings expertise and can both support and challenge ideas:

| Agent | Expertise | When to Use |
|-------|-----------|-------------|
| `product-manager` | Product strategy, prioritization, market perspective | Feature decisions, prioritization, user value questions |
| `ux-designer` | User experience, interface design, usability | Design decisions, user workflows, UI patterns |
| `logistics-domain-expert` | Warehouse operations, MHE, logistics concepts | Validating realism, suggesting scenarios, terminology |
| `frontend-engineer` | Web development, React/Canvas, technical trade-offs | Technology choices, architecture, implementation |

**Usage**: Consult these agents as sparring partners. They ask questions, recommend approaches, and challenge assumptions when needed.

## Development Phases

### Prototype V2 (COMPLETED - 2025-01-02)
Working prototype with programmatic grid rendering:
- ✓ Parse Excalidraw JSON to render grid
- ✓ Animated pallet movement (15 pallets → 15 docks)
- ✓ Manhattan pathfinding (L-shaped paths)
- ✓ Timer display with elapsed time
- ✓ Start/Stop controls
- ✓ Progress indicator (docks filled)
- ✓ Auto-stop when complete

**Technical learnings documented in ADR-012, ADR-013, ADR-014**

### Phase 0: Proof of Concept (COMPLETED)
1. ~~Load Excalidraw file as background~~ ✓
2. ~~Display single object (colored block)~~ ✓
3. ~~Animate from point A to point B~~ ✓
4. **Learning**: PNG background approach too superficial - need programmatic grid

### Phase 1: Minimal Viable Tool (NEXT)
- Click to define path waypoints
- Reset button
- Speed control slider
- Path visualization

### Phase 2: Serious App
- Multiple scenarios per project
- Side-by-side comparison view
- Different object types with speeds
- Pause/wait at waypoints
- Save/load scenarios

## Commands

```bash
# Prototype V2
cd "prototype v2"
npm install
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
```

## File Structure

```
warehouse_flow_visualization_app/
├── CLAUDE.md                    # This file - guidance for Claude
├── CHANGELOG.md                 # Version history
├── SESSION_LOG.md               # Where we left off each session
├── DECISIONS.md                 # Key decisions and rationale (ADR-001 to ADR-014)
├── Conceptueel Flow-Model (Basis).md  # Original concept (Dutch)
├── .claude/
│   └── agents/                  # Custom Claude Code agents
│       ├── product-manager.md
│       ├── ux-designer.md
│       ├── logistics-domain-expert.md
│       └── frontend-engineer.md
├── prototype/                   # Phase 0 prototype (PNG background - deprecated)
│   ├── src/
│   └── package.json
├── prototype v2/                # CURRENT - Programmatic grid prototype
│   ├── src/
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   ├── utils/parseExcalidraw.ts # Excalidraw JSON parser
│   │   ├── utils/pathfinding.ts     # Manhattan paths, lerp
│   │   ├── hooks/useSimulation.ts   # Animation state management
│   │   ├── components/GridCanvas.tsx
│   │   ├── components/Controls.tsx
│   │   └── App.tsx
│   ├── public/
│   │   └── prototype v2.excalidraw  # Grid source file
│   └── package.json
└── src/                         # (Future) Main application source code
```

## Example Use Cases

### 2-Step vs 1-Step Put-Away
**Current**: Pallet truck → transfer location → Reach truck → rack
**Proposed**: Reach truck directly from dock → rack
**Goal**: Show why 1-step has shorter lead time

### Customer-Centric vs Flow-Centric Processing
**Current**: Organize by customer - get items, pack, ship, next customer
**Proposed**: Organize by flow - small orders together, full pallets together
**Goal**: Visualize efficiency difference

## What This App Does NOT Do

- No simulation logic or optimization algorithms
- No automatic pathfinding
- No collisions or object interactions
- No real-world accuracy claims
- No resource constraints or bottleneck modeling
