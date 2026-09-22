# SkillBridge — Project Brief

> **Single source of truth.** Every work session starts by reading this file.
>
> Competition: **Jordan 2076 Hackathon — Stage 3** (Technical MVP judging, 15-minute
> in-person session, 100-point rubric)

---

## 1. Project Summary

SkillBridge is an **AI Career Readiness Engine** that measures a university student's
readiness for **one target role — "Junior Data Analyst"** — against real labor-market
requirements, then closes the gap.

**Core loop:**

```
Target Job → Market Scan → Skill Match → Readiness Score → Skill Gap Analysis
  → Personalized Roadmap → Adaptive Tutor
```

---

## 2. MVP Objectives (all four required)

| # | Objective | Acceptance Criteria |
|---|-----------|-------------------|
| 1 | **Working readiness score** | Computes a requirement-match percentage for "Junior Data Analyst" from declared + evidenced student skills vs. a defined requirement set. |
| 2 | **Requirement set from job data** | Derived from a curated dataset of 30–50 real or clearly-labeled sample job postings; skills ranked by demand frequency. |
| 3 | **Prioritized roadmap** | At least 3 skill gaps, ordered highest-impact first, with a sequenced learning plan. |
| 4 | **Adaptive tutor** | Student picks one identified gap; at least 3 explanation styles (e.g., Simple, Visual, Example-based, Step-by-step, Arabic); each style produces a genuinely different explanation. |

---

## 3. Hard Rules

These are non-negotiable constraints that apply to all code, comments, and documentation.

1. **Readiness label:** The readiness percentage must be labeled and treated as a
   "requirement match" — **never** as a hiring probability or employment prediction.

2. **Deterministic core logic:** The readiness score, skill matching, gap ranking, and
   roadmap ordering must be **deterministic and fully explainable/traceable** to data in
   the database. They must **never** be produced or approximated by an LLM.

3. **AI/LLM scope:** The AI (Anthropic Claude) is used **only** for:
   - Generating tutor explanations.
   - Optionally, as an *assist* pass on top of a deterministic skill-extraction pass from
     job postings — **never as the sole source** of the requirement set.

4. **Data labeling:** Job posting data must be labeled `real` vs. `sample` in the schema.
   It must never be presented as more than it is.

5. **No fabrication:** No fabricated statistics, accuracy claims, or test results anywhere
   in code, comments, or docs. If something is not built yet, it must say
   `"not implemented"` rather than imply it works.

---

## 4. Explicitly Out of Scope

Do **not** build any of the following, even if they seem easy:

- User authentication / login systems (a "profile" is a simple session/local record)
- Multiple roles or multi-role switching
- Job-board, social-network, or employer-facing features
- Automated hiring decisions or an "employment probability" model
- Full learning management system (courses, progress tracking, certificate issuance)
- Live web scraping of job sites
- Multi-language production support (Arabic is only one tutor explanation style, not
  full i18n)
- Cloud infrastructure, CI/CD pipelines, containerization, microservices — this runs
  locally for a live demo

---

## 5. Judging Criteria (100 pts)

Every design decision should be weighed against this rubric:

| Category | Points | Notes |
|----------|--------|-------|
| Core Functionality | 20 | Does the MVP loop work end-to-end? |
| Problem–Solution Alignment | 10 | Does the product address the stated problem? |
| Scope & MVP Focus | 10 | Tight scope, no feature creep? |
| Technical Implementation | 15 | Code quality, architecture, correct use of tech |
| Integration | 10 | Do components connect cleanly? |
| Architecture & Extensibility | 5 | Could this grow beyond the hackathon? |
| Core Workflow Clarity | 8 | Is the user flow obvious and logical? |
| Inputs/Outputs/Error Feedback | 7 | Clear inputs, clear outputs, helpful errors |
| Stability of Core Functionality | 7 | Does it crash? Handle edge cases? |
| Relevant Scenario Testing | 5 | Demonstrated with realistic data? |
| Edge Cases & Error Handling | 3 | Graceful degradation |

> **Key takeaway:** Reliability and demonstrable, explainable functionality matter far
> more than visual polish or feature count.

---

## 6. Technology Stack (fixed)

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript, Vite, Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite (file-based, via `better-sqlite3`) |
| AI | Anthropic API (Claude) — called only from the tutor service, behind a validated JSON-schema interface with a deterministic fallback if the call fails |

---

## 7. Repository Structure

```
skillbridge/
├── frontend/           # React + TypeScript + Vite + Tailwind
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .eslintrc.cjs
├── backend/            # Node.js + Express + TypeScript + SQLite
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.cjs
├── docs/               # Architecture docs, data dictionaries
├── PROJECT_BRIEF.md    # ← This file (single source of truth)
├── CHANGELOG.md        # Phase-by-phase change log
├── README.md           # Quick-start instructions
├── package.json        # Workspace root (npm workspaces)
└── .gitignore
```

---

## 8. Development Commands

```bash
# Install all dependencies
npm install

# Run both servers concurrently
npm run dev

# Run individually
npm run dev:frontend    # Vite → http://localhost:5173
npm run dev:backend     # Express → http://localhost:3001

# Build
npm run build

# Lint
npm run lint
```

---

## 9. Current Status

**Phase 0 — Scaffolding complete.**
No feature logic, database schema, UI screens, or API routes have been implemented.
