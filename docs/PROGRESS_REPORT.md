# SkillBridge: Project Status & Progress Report

This document serves as a comprehensive summary of all work completed on the SkillBridge project so far. The project is being developed in strict accordance with the rules defined in `PROJECT_BRIEF.md`.

## Phase 0: Project Scaffolding
**Goal:** Establish the foundation, fix the tech stack, and define the hard rules.

*   **Monorepo Setup:** Created a standard npm workspace monorepo containing `/frontend`, `/backend`, and `/docs`.
*   **Tech Stack Locked:** 
    *   Frontend: React 18, TypeScript, Vite, Tailwind CSS.
    *   Backend: Node.js, Express, TypeScript, `better-sqlite3` (SQLite).
*   **Source of Truth:** Created `PROJECT_BRIEF.md` containing the project summary, MVP objectives, strict judging rubric (100-point scale), and non-negotiable rules (e.g., deterministic scoring, no LLM hallucinations).

## Phase A: Market Requirements Pipeline
**Goal:** Build the data layer that answers "What does the market require for a Junior Data Analyst?"

*   **Database Schema (`src/db/schema.ts`):** Created the full SQLite schema for both Phase A and Phase B tables.
*   **Skills Taxonomy (`src/data/skills-taxonomy.ts`):** Defined a canonical list of 32 Junior Data Analyst skills categorized by type, each equipped with aliases (e.g., "PowerBI", "MS Power BI").
*   **Job Postings Dataset (`src/data/job-postings.ts`):** Generated 40 highly realistic, synthetic job postings (`source_label: 'sample'`) since real postings have not yet been provided. 
*   **Deterministic Skill Extraction (`src/pipeline/skill-extractor.ts`):** Built a pipeline that scans posting text using regex word-boundary matching to extract and normalize skills perfectly without using an LLM.
*   **Aggregator (`src/pipeline/aggregator.ts`):** Wrote the math logic to convert skill extraction frequency into a pure percentage weight `(postings containing skill / total postings)`.
*   **Seed Script (`src/pipeline/seed.ts`):** Created the script that resets the database, applies the schema, inserts data, runs the pipeline, and saves the `role_requirements`.
*   **Data Provenance Tests:** Added a strict test suite that will intentionally fail the build if the MVP is shipped with 0 real job postings, protecting the integrity of the project.

## Phase B: Backend APIs & Scoring
**Goal:** Build the API and the business logic to match a student's profile against the market data to generate a readiness score, a gap analysis, and a roadmap.

*   **Standardized API Responses (`src/utils/response.ts`):** Enforced a consistent `{ data, error }` JSON shape for all endpoints (`/api/profile`, `/api/roles/:roleName/requirements`, `/api/analysis`). No unhandled exceptions reach the client.
*   **Deterministic Scoring Engine (`src/services/analysis.service.ts`):** 
    *   Implemented strict evidence multipliers (`course/project/certificate` = 1.0 credit, `self_declared` = 0.5 credit).
    *   Calculated `Readiness %` as the sum of the student's credited weights divided by the max possible role weights.
    *   Calculated `GapWeight` for missing/partially-missing skills.
*   **Roadmap Sequencing (`src/services/roadmap.service.ts`):** Implemented a deterministic sorter that takes the top 3 gaps and sequences them based on category prerequisites (e.g., `programming` is sequenced before `analytics`).
*   **Testing & Documentation:**
    *   Created `docs/SCORING.md` to document the exact readiness formula.
    *   Wrote automated API integration tests and unit tests for the core formula (confirming it is mathematically sound and perfectly reproducible).

## Recent Verification & Audits
We just completed a strict read-only audit of the codebase to verify:
1.  **Formula Determinism:** Confirmed that the `Readiness %` math operates statically and is 100% reproducible.
2.  **Roadmap Logic:** Confirmed that sequencing is currently governed purely by category (e.g., `programming` vs `analytics`), without skill-to-skill dependencies.
3.  **Dataset Integrity:** Identified that the 40 synthetic job postings heavily reuse text templates, resulting in an artificially uniform skill distribution. 

## Next Steps (Pending)
*   **Real Data Ingestion:** Provide real job posting text to replace the 40 synthetic samples and pass the failing provenance test.
*   **Refinement (Optional):** Upgrade the Roadmap sequencing logic to handle specific skill dependencies if desired.
*   **Phase C:** Frontend integration (building the React UI to consume these APIs).
