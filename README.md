# SkillBridge — AI Career Readiness Engine

> Jordan 2076 Hackathon — Stage 3 Technical MVP

SkillBridge measures a university student's readiness for a target role ("Junior Data Analyst") against real labor-market requirements, then helps close the gap with a prioritized roadmap and an adaptive AI tutor.

See [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) for full scope, rules, and architecture decisions.

## Quick Start

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install

```bash
npm install
```

### Run Development Servers

```bash
# Both frontend and backend concurrently:
npm run dev

# Or individually:
npm run dev:frontend   # Vite dev server (React) — http://localhost:5173
npm run dev:backend    # Express API server — http://localhost:3001
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```
skillbridge/
├── frontend/          # React + TypeScript + Vite + Tailwind
├── backend/           # Node.js + Express + TypeScript + SQLite
├── docs/              # Architecture docs, data dictionaries, etc.
├── PROJECT_BRIEF.md   # Single source of truth for scope & rules
├── CHANGELOG.md       # Phase-by-phase change log
└── package.json       # Workspace root
```

## Status

**Phase 0 — Scaffolding complete.** No feature logic implemented yet.
