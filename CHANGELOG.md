# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Reset button for prototype v2
- Speed control slider
- Path visualization (show route before/during movement)
- Click-to-define waypoints

---

## [0.3.0] - 2025-01-02

### Added
- **Prototype V2** in `/prototype v2` folder - complete rewrite
- Programmatic grid rendering from Excalidraw JSON (implements ADR-009)
- Excalidraw file parser (`parseExcalidraw.ts`)
- Grid position snapping to handle Excalidraw alignment issues
- Manhattan pathfinding with L-shaped waypoints
- Pallet animation: 15 pallets move one-by-one to 15 docks
- Timer display showing elapsed time
- Progress indicator (docks filled: X/15)
- Automatic completion detection (stops when all docks filled)
- Dock filling order: back to front (farthest from pallets first)

### Technical Improvements
- Animation state stored in refs, throttled React updates at ~30fps (ADR-012)
- Point-to-point pathfinding instead of cell-stepping (ADR-014)
- Grid snapping for consistent element positioning (ADR-013)

### Documented
- ADR-012: React Animation Pattern with requestAnimationFrame
- ADR-013: Grid Position Snapping for Excalidraw Data
- ADR-014: Manhattan Pathfinding with Waypoints

### Key Learnings
- `setState` inside `requestAnimationFrame` at 60fps freezes React apps
- Excalidraw positions may not align to grid - must snap when parsing
- Cell-stepping pathfinding causes infinite loops with misaligned positions

---

## [0.2.1] - 2024-12-24

### Added
- **`frontend-engineer` agent** - Technical architect for client-side decisions
  - Guards "no backend needed" principle
  - Covers React, TypeScript, Canvas, Excalidraw JSON parsing
  - Animation patterns (requestAnimationFrame, lerp)
  - State management guidance (Zustand/Jotai)
  - Code review checklist for simplicity

### Changed
- Updated `CLAUDE.md` with fourth agent in agents table

### Documented
- ADR-011: Frontend Engineer Agent for Technical Decisions

---

## [0.2.0] - 2024-12-24

### Added
- **Custom Claude Code Agents** for product planning:
  - `product-manager.md` - Guards philosophy, prioritizes features
  - `ux-designer.md` - User journeys, UI design
  - `logistics-domain-expert.md` - Warehouse domain knowledge
- `.claude/agents/` folder structure

### Changed
- **Development approach**: Product planning before coding (ADR-010)
- **Grid rendering**: Will use programmatic rendering from Excalidraw JSON instead of PNG background (ADR-009)
- Updated `CLAUDE.md` with agents section and revised phases
- Phase 0 marked as completed, Phase A (Product Planning) now current

### Documented
- ADR-009: Programmatic Grid Rendering from Excalidraw Data
- ADR-010: Custom Agents for Product Planning

---

## [0.1.0] - 2024-12-24

### Added
- **Phase 0 Prototype** in `/prototype` folder
- React + TypeScript + Vite application
- Pallet animation system (requestAnimationFrame + lerp)
- Path: B8 → B9 → I9 → I3 → U3 → U1
- Animation timing: 1 sec/cell, 2 sec wait at destination, loop
- Start/Stop controls

### Changed
- Switched from Excalidraw React component to PNG + Canvas (performance)

### Known Issues
- Pallet position not calibrated - appears outside grid
- Grid coordinates need measuring from actual PNG

---

## [0.0.1] - 2024-12-23

### Added
- Project initialization
- `Conceptueel Flow-Model (Basis).md` - Core concept document defining Flow = Object + Path + Tempo
- `Warehouse_lay-out_example_excalidraw.excalidraw` - Example warehouse layout with grid, zones, and coordinate system
- `CLAUDE.md` - Comprehensive project guidance for Claude Code
- `CHANGELOG.md` - This file
- `SESSION_LOG.md` - Session tracking
- `DECISIONS.md` - Architecture decision records

### Defined
- Project vision: Visual explanation tool for warehouse logistics (not simulation)
- Technical stack: React + TypeScript + Canvas
- Development phases (0, 1, 2)
- Standard elements library (MHE types, zones)
- Documentation strategy
