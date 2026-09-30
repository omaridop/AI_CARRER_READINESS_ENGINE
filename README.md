# SkillBridge

### AI Career Readiness Engine

**Understand your skill gaps. Build a focused learning plan. Learn in your own style.**

SkillBridge helps university students compare their skills with curated **Junior Data Analyst** job requirements, understand their gaps, and learn through a personalized roadmap and adaptive tutor.

Built for the **Jordan 2076 Hackathon — Stage 3 technical MVP**.

> **Publication status:** This repository currently publishes the README. The application and supporting documents exist in the development checkout and have not yet been uploaded here. Cloning this documentation-only repository is not sufficient to run the application.

## The experience

```text
Profile → Target role → Skill evidence → Job match explorer → Analysis → Results and roadmap → Tutor
```

| Capability | What it provides |
| --- | --- |
| Magic Live Mode | Type any job, live scrape it, AI extracts dynamic skills and enhances your resume |
| Skill profile | Skills with course, project, certificate, or self-declared evidence types |
| Job matcher | View personal match percentages against actual individual job postings |
| Requirement match | An explainable, weighted score calculated without an LLM |
| Gap analysis | Missing or partially credited skills ranked by weighted gap |
| Learning roadmap | Up to three available priority gaps, sequenced by prerequisite categories |
| Adaptive tutor | Simple, visual, example-based, step-by-step, and Arabic explanations |
| Fallback content | Clearly labeled fallback explanations when live AI content is unavailable or invalid |

**The score is a requirement-match indicator, never a hiring probability or employment prediction.** Selected evidence types are user-provided and do not independently verify competence.

## How scoring works

Skill extraction, matching, scoring, gap ranking, and roadmap ordering are deterministic. AI generates tutor explanations.

1. Extract skills from curated postings using a taxonomy and matching rules.
2. Weight requirements by posting frequency. Skills appearing in at least **15%** of postings are core requirements.
3. Assign credit: **1.0** for course, project, or certificate; **0.5** for self-declared; **0** for absent skills.
4. Divide credited requirement weights by total core requirement weight, cap at **100%**, and round to one decimal place.
5. Rank gaps by `requirement weight × (1 − credit)` and sequence selected gaps by prerequisite category.

Supplementary skills contribute to the numerator, so a capped 100% score can coexist with skill gaps.

## Dataset and scope

The documented dataset contains **37 postings: 7 real and 30 explicitly labeled samples**. It demonstrates the matching pipeline; its frequencies are not a representative estimate of the wider labor market. Requirements come from this curated dataset, not a live market scan.

The MVP targets **Junior Data Analyst only**. Authentication, multiple roles, job-board features, live scraping, and a full learning management system are outside scope. Arabic is a tutor style, not full application localization.

## Technology

| Layer | Stack |
| --- | --- |
| Interface | React, TypeScript, Vite, Tailwind CSS |
| API | Node.js, Express, TypeScript |
| Storage | Local SQLite through better-sqlite3 |
| Tutor | OpenRouter routing to `deepseek/deepseek-v4.1-flash`, validated responses, and deterministic fallback content |
| Verification | Backend tests and Playwright browser checks in the development checkout |

The frontend API helper currently calls `http://localhost:3001/api` directly. Vite also has an `/api` proxy, but that proxy is not used by the current helper. The backend owns database access, scoring, and tutor provider calls.

## Run locally

These instructions require the **full application checkout**, including source files, workspace packages, and the lockfile.

### 1. Install dependencies

Use Node.js and npm. The root manifest declares Node.js 18 or newer; the latest recorded environment used **Node.js 24.15.0**. Compatibility across all declared versions has not been verified.

From the project root:

```bash
npm ci
```

### 2. Configure the tutor (optional)

Create `backend/.env` for live OpenRouter explanations:

```dotenv
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=3001
```

Keep credentials out of version control. With neither an OpenRouter nor an Anthropic key configured, the tutor uses fallback content. The client also contains a secondary native Anthropic path; OpenRouter is the intended demo configuration. Restart the backend after changing provider configuration.

The user selected DeepSeek V4.1 Flash on September 27 after the former Claude 3 Haiku route returned a deprecation error. Optional reasoning is disabled for short tutor answers. The model may still time out; the UI must show the actual live/fallback source.

### 3. Initialize a fresh database

```bash
npm run seed --workspace=backend
```

**Seeding deletes and rebuilds `backend/data/skillbridge.db`.** Use it for a fresh installation, or stop the backend and preserve existing data before intentionally reseeding. The server supports `SKILLBRIDGE_DB_PATH`, but the seed script writes to the default path.

### 4. Start the application

```bash
npm run dev
```

| Service | Address |
| --- | --- |
| Frontend | http://localhost:5173 |
| Backend health check | http://localhost:3001/api/health |

The current API helper and Vite proxy expect backend port 3001. A health response confirms the process responds; it does not verify the complete workflow.

On this Windows demo machine, Node 24.15.0 needs the system certificate trust store to reach OpenRouter. The verified PowerShell launch keeps certificate verification enabled:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npm run dev
```

This applies to the launched processes. Do not disable TLS verification. Other machines may not need the option.

## Development commands

Run from the full checkout's root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start both development servers |
| `npm run dev:frontend` | Start the frontend |
| `npm run dev:backend` | Start the backend |
| `npm run build` | Build both workspaces |
| `npm run lint` | Check both workspaces |
| `npm run test --workspace=backend` | Run backend tests |

Browser checks live in `frontend/tests/`. Inspect `frontend/playwright.config.ts` for server requirements before running them.

The focused regression command, run from `frontend` with both servers up, is:

```powershell
npx playwright test tests/reliability.spec.ts tests/measure.spec.ts tests/crash-regression.spec.ts --workers=1 --reporter=list
```

Tests create synthetic profiles and analyses. For backend verification, use a consistent SQLite backup through `SKILLBRIDGE_DB_PATH`; do not reseed the existing demo database. Tutor response fixtures do not establish live provider availability.

## Application structure

The development checkout contains:

```text
frontend/             React interface, screens, and browser checks
backend/
  src/ai/             Tutor provider integration
  src/data/           Skill taxonomy and job postings
  src/db/             SQLite connection and schema
  src/pipeline/       Extraction, aggregation, and seeding
  src/routes/         API routes
  src/services/       Scoring, analysis, and tutor logic
  src/__tests__/      Backend tests
docs/                 Design, scoring, limitations, and verification records
PROJECT_BRIEF.md      Product scope and constraints
CHANGELOG.md          Development milestones
AGENTS.md             Persistent instructions and detailed run history
README.md             Public overview and setup guide
```

## Current status

**Targeted reliability corrections are implemented and browser-verified; human demo readiness remains unverified.**

- The local checkout includes profile, role, analysis, and tutor APIs; deterministic scoring; roadmap logic; and the guided frontend.
- The September 26 diagnosis reproduced a StrictMode lifecycle stall. The correction preserves StrictMode and sends one profile/analysis pair. After the UI polish, the final six browser runs reached Results in 80–121 ms.
- A previously reported SQLite panic remains unexplained. Recorded integrity checks passed but do not establish the earlier incident's cause.
- Browser verification also corrected Results/Tutor response mappings and the Step-by-step identifier. All five styles render and label their source.
- The final DeepSeek spot-check displayed five live explanations and one correctly labeled timeout fallback. Live availability remains variable.
- A timed spoken presentation, independent judge walkthrough, and subjective confirmation of the original delay remain pending.
- See `docs/VERIFICATION_2026-09-27.md` for current builds, tests, lint debt, raw browser evidence and the distinction from historical phase reports.

The September 27 frontend polish adds a cohesive responsive workspace, direct roadmap lessons, visible score explanations and reduced-motion support. Both builds and 11 browser checks pass; frontend lint still has two existing errors and one warning. See `docs/UI_POLISH_2026-09-27.md`.

## Course discovery

Open any skill lesson and choose **Find courses** to research Coursera/Udemy course pages. Each shortlist shows official links, topic-match reasons and a research timestamp. Searches use the existing OpenRouter key/credits, run only on demand, and cache results for one hour. Unavailable research falls back to explicitly labeled provider search links. Recommendations are not an objective quality ranking; check the provider’s syllabus, language, prerequisites and price. See `docs/COURSE_SEARCH_2026-09-27.md`.

Latest verification: 63 backend tests, 15 browser tests and both builds pass. Real SQL research returned three cited courses in 8.45 seconds; Analysis remained 68–102 ms across the final six runs. Human rehearsal remains pending.

## Supporting documentation

Available in the full development checkout, pending publication:

| Document | Purpose |
| --- | --- |
| `PROJECT_BRIEF.md` | Current scope, constraints and selected model |
| `docs/ARCHITECTURE.md` | System design |
| `docs/SCORING.md` | Scoring formula and roadmap ordering |
| `docs/DATA_REFRESH_REPORT.md` | Dataset composition and provenance |
| `docs/LIMITATIONS.md` | Known limitations |
| `docs/DIAGNOSIS_2026-09-26.md` | Latest recorded workflow diagnosis |
| `docs/VERIFICATION_2026-09-27.md` | Corrections, measured results and remaining gates |
| `AGENTS.md` | Detailed work history and open work |

## Maintenance and updates

Review and update this README after **every project work session**. Keep setup, capabilities, publication status, and limitations aligned with actual evidence. Add a concise dated update below and preserve detailed work history in the development checkout's `AGENTS.md`. Distinguish completed verification from planned checks.

| Date | Update |
| --- | --- |
| 2026-09-27 | Replaced the scaffold-only README with the product overview, scoring explanation, setup guide, dataset disclosures, and current verification status. Established per-run README maintenance. |
| 2026-09-27 | Reliability implementation: confirmed/fixed the Analysis stall and Results/Tutor contracts; recorded browser/load/fallback checks; switched to user-selected DeepSeek through OpenRouter; retained human rehearsal and historical SQLite incident as open gates. This local update has not been republished by the implementation task. |
| 2026-09-27 | Applied visual-polish-and-trust: clearer profile, evidence, Results and tutor UX; added guarded states and responsive/reduced-motion verification. Local changes only; human rehearsal remains pending. |
| 2026-09-27 | Added on-demand course research with source-backed links, cache and fallback labels. Verified the live SQL path, 63 backend tests and 15 browser tests. Local changes have not been published. |
| 2026-09-27 | Created the local career-readiness-competitive-intelligence skill for current, cited competitor research and recommendations ranked by value, cost, and risk. Skill format validated; no competitive study or application tests were run in this session. Local documentation update only. |
| 2026-09-27 | Reviewed MENA job-data API options. Recommended a traceable Jordan-first real-posting snapshot before API automation; no integration implemented. Read-only database count remains 7 real / 30 sample. |
| 2026-09-27 | Clarified demo-data positioning: the project brief permits labeled samples, but regional validity remains limited; future LinkedIn data access is unconfirmed. No integration or application changes. |
| 2026-09-27 | Identified TheirStack free API evaluation and Jooble regional registration as candidates; Jordan coverage and suitability remain untested. No account or integration created. |

| 2026-09-28 | Prepared an ignored backend TheirStack credential setting. Data integration and authenticated coverage testing remain pending. |

| 2026-09-28 | TheirStack key verified through two successful Jordan searches: 5 recent matches and 18 annual matches with senior-title exclusions. Sampled descriptions still required 3–5+ years; junior suitability unproven. No data imported. |

| 2026-09-28 | Reviewed all 18 annual TheirStack candidates and targeted junior searches; no confirmed fresh-graduate Jordan analyst match. See docs/THEIRSTACK_COVERAGE_2026-09-28.md. No import. |

| 2026-09-28 | Manual Jordan sourcing identified three historical candidate references, including Zain and WUDUH employer pages; found an existing duplicate and mixed-role limitations. See docs/JORDAN_SOURCE_REVIEW_2026-09-28.md. No import. |

| 2026-09-28 | Collected a separate Jordan historical reference dataset in data/curated: 5 reviewed records (1 already present) and 2 conditional records, with JSON/CSV, provenance and an audit of existing real entries. No scoring-data import. |

**Last updated:** September 30, 2026 (Asia/Amman).
| 2026-09-29 | Comprehensive project review (read-only): graded B+/A- overall; documented strengths, concerns, critical gaps and prioritized recommendations for October 6 judging. No source, test, database or publication changes. |
| 2026-09-29 | Added Playwright-based web scraping system for Bayt.com, Akhtaboot, and LinkedIn public jobs. CLI tools for scraping and importing. TypeScript passes, 63/63 backend tests pass. Scraper not yet run against live sites. |
| 2026-09-30 | Exhaustive 59-requirement compliance audit against external "SkillGap Finder" specification. Confirmed ~32% fully match, ~41% partial, ~27% missing. Two parallel workflows identified: deterministic wizard (Steps 1-7) and Magic Mode live pipeline. No source changes. |
| 2026-09-30 | Implemented missing SkillGap Finder features 1-6: Live SSE progress updates, 3 additional scrapers (Indeed, Glassdoor, RemoteOK), 24h JSON scraping cache, Recharts-based bar chart & circular gauge, and semantic skill matching via DeepSeek AI. |

### Update 2026-09-30 (SkillGap Finder Integration - Item 9)
Bridged the "Magic Mode" live-scraping pipeline (which handles dynamic job titles and uses AI to extract missing skills) into the main Wizard flow. Steps 2 through 6 now dynamically recognize custom scraped roles instead of being locked strictly to "Junior Data Analyst". Item 10 (Python FastAPI rewrite) was explicitly skipped to comply with the project's strict architecture constraints (keep Node/Express/React).
