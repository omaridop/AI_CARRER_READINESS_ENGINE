# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### September 26–27, 2026 — Browser diagnosis and targeted corrections
- Reproduced the Analysis stall in Edge: profile POST completed, analysis POST was never sent.
- Replaced the StrictMode started/cleanup conflict with one operation and lifecycle-safe subscriptions; retained StrictMode and avoided duplicate profile writes.
- Aligned typed Results and Tutor consumers with existing API responses; corrected `step_by_step` and retained honest source badges.
- Removed simulated live-market scanning text and clarified self-reported evidence.
- Preserved scoring, roadmap ordering, SQLite, scope and the error boundary.
- Corrected the tutor timeout to cover response bodies; a controlled stalled-body test failed before the fix and passed afterward.
- Changed OpenRouter to DeepSeek V4.1 Flash at the user's request after Claude 3 Haiku returned a deprecation error. Disabled optional reasoning for short tutor explanations.
- Documented this Windows machine's Node system-CA launch requirement; TLS verification remains enabled.
- Added browser/provider-failure regressions, repaired swallowed timing assertions and removed silent integration-test success with an unseeded database.
- Added minimal type declarations and unused-parameter corrections required by the existing build.
- Corrected unsupported rehearsal claims; recorded current verification and unresolved risks in `docs/VERIFICATION_2026-09-27.md`.

### Phase B — Backend APIs & Scoring
- Implemented `/api/profile`, `/api/roles`, and `/api/analysis` endpoints.
- Built strictly deterministic `Readiness %` formula based on evidence types.
- Implemented gap ranking and prerequisite-based roadmap generation.
- Validated inputs to ensure `{ data, error }` response consistency.
- Added API unit and integration tests.

### Phase A — Market Data Pipeline
- Created deterministic skill extractor (no LLMs, keyword/regex alias matching).
- Built job postings dataset (40 sample postings).
- Added SQLite schema and DB connection factory.
- Added aggregator script to compute market skill weights.
- Added `seed` script and pipeline tests.

### Phase 0 — Project Scaffolding

- Initialized monorepo with npm workspaces (`/frontend`, `/backend`, `/docs`)
- Created `PROJECT_BRIEF.md` (single source of truth for scope & rules)
- Set up React + TypeScript + Vite + Tailwind frontend shell
- Set up Node.js + Express + TypeScript backend shell
- Configured ESLint for both workspaces
- No feature logic implemented — setup only

## 2026-09-27 — Visual polish and trust

- Refined the complete frontend with a shared teal/neutral design, accessible steps, profile shortcuts, grouped evidence, trustworthy score summary and actionable roadmap.
- Added lightweight reduced-motion-aware feedback, direct tutor navigation and explicit idle/error/empty guards for changed data consumers. No backend scoring or provider changes.
- Both builds and 11 browser checks pass; final Analysis 80–121 ms. Existing lint debt and human verification gates remain. See docs/UI_POLISH_2026-09-27.md.

## 2026-09-27 — On-demand course research

- Added taxonomy-scoped Coursera/Udemy course discovery from OpenRouter web-search citations, requested by the user. Official URL validation, relevance filtering, cache/deduplication, deadlines and honest fallback labels protect the flow.
- Added the tutor course panel with explicit idle/loading/error/results states and cancellation on departure. No scoring changes, new dependencies or migrations.
- Live SQL browser search returned three cited courses in 8.45 seconds. Both builds, 63 backend tests and 15 browser tests pass. See docs/COURSE_SEARCH_2026-09-27.md.
