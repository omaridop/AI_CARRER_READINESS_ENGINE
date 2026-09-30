# Verification — September 26–27, 2026

## Outcome and boundaries

The Analysis stall and Results/Tutor integration defects were reproduced in a real
Edge browser and corrected. The user explicitly authorized Playwright network/
console capture in place of a manually operated DevTools baseline. These are
agent-operated browser results, **not a human presentation or independent rehearsal**.

The implementation is in `AI_CAREER_READINESS_PROJECT`; the companion
`Jordan_2076_Hackathon` workspace contains project memory only. Existing uncommitted
work was preserved. No scoring change, database migration, reseed, authentication,
new role, hosted database, or public API change was introduced.

## Root cause and browser evidence

Environment: Windows, Node 24.15.0, Edge 151.0.4129.72, Vite development server,
React StrictMode enabled, viewport 1365 × 900, no artificial CPU/network throttling.
Normal startup was `npm run dev`. The later live-provider check needed the system
CA option described below.

| Observation | Measured evidence |
|---|---|
| Before correction | Profile POST 201; browser request start → end 179.357 ms; response start 175.247 ms |
| Missing operation | No Analysis POST at the 7.561-second snapshot; no pending API request |
| Visible failure | Loading stayed at “Initializing scan...” |
| Console | Successful profile log, resource 404, no exception explaining the initial stall |
| After lifecycle correction | Profile and Analysis POSTs both 201 in approximately 15 ms each; Results then threw on missing roadmap status |
| After contract correction | Results renders typed API fields, defined gap weights, roadmap practice content and the one-decimal score |
| Final six browser runs | 104, 67, 70, 78, 78, 70 ms from click action through visible score assertion; exactly one profile POST and one Analysis POST per run |

The old effect's cleanup invalidated its subscription, while its started guard
blocked StrictMode's next setup. The profile response was ignored before Analysis.
The correction retains one operation and allows a new lifecycle subscription to
observe it; leaving the screen prevents late navigation. This is a workflow defect,
not evidence of slow SQL.

Read the [diagnosis](DIAGNOSIS_2026-09-26.md), [baseline snapshot](evidence/2026-09-26/baseline.json),
[bounded baseline HAR](evidence/2026-09-26/baseline-window.har), and
[Results failure](evidence/2026-09-26/results-contract-failure.json).
The original raw baseline.har also includes later hot-reload activity; use
baseline-window.har (cutoff 2026-09-26T08:45:41.366Z) for unchanged-code conclusions.
HAR files can be imported into browser DevTools. The capture does not separately
expose every browser-internal preflight/queue event, so no unmeasured preflight
duration is asserted.

## Targeted changes

- Kept StrictMode and the error boundary. Analysis makes one profile/analysis pair,
  reports errors and allows retry, without fake real-time scanning messages.
- Results consumes the existing analysisId/readinessScore/gaps/roadmap response.
  It uses gapWeight, description, assessmentIdea and estimatedHours; it no longer
  reads nonexistent roleName, rationale, weight or status fields.
- Tutor unwraps the API envelope once and sends `step_by_step`, with a separate
  display label. Source labeling and request-order protection remain intact.
- Added frontend response types, corrected self-reported evidence wording and
  clarified that requirements come from stored real/sample postings.
- A controlled test showed that the provider timeout was cleared when headers
  arrived, leaving a stalled body unbounded. The timer now covers body consumption
  and is cleared in finally. The test changed from “hung” after 11 seconds to
  correctly labeled fallback at approximately 10 seconds.
- Minimal TypeScript declarations/unused-parameter fixes make both builds pass.
  The scoring formula and persisted schema were not changed.
- Fixed the timing test's swallowed assertion, the judge test's unasserted source
  badge and fixed sleep, and the integration test's silent pass when requirements
  were unavailable.

## SQLite: current checks pass, historical incident unresolved

Searches covered source/docs, local logs, all available Git commit messages and
history for panic, SQLITE_BUSY, SQLITE_LOCKED, SQLITE_CORRUPT and database-is-locked.
Only scaffolding commit 5bb8fa7 exists locally; there are no Phase F commits or
configured local remotes to inspect. The user has no original incident text.
A separate documentation task published a README-only remote; this is not a
source of Phase F incident history.

SQLite reports 3.49.2 and WAL mode. Integrity checks returned `ok`; foreign-key
checks returned no violations before and after load. Fifty browser-issued
Analysis requests, in five batches of ten concurrent requests, all returned 201,
with browser fetch durations 9–47 ms. A rapid double click produced one profile/
analysis pair. No SQLite error was observed in actual backend output.

This does **not** identify the historical panic, prove it fixed, or rule out
multi-process locking, filesystem or different-machine failures. OneDrive is not
an established cause. See [load results](evidence/2026-09-27/analysis-load.json).

The original sources/docs/database files were copied to the local baseline
directory recorded in the diagnosis. Backend tests used a consistent SQLite
backup at `%TEMP%/skillbridge-verification-20260927.db`. Browser checks against
the normal app created synthetic profiles/analyses in the existing database; no
history was deleted or reseeded.

## OpenRouter and the user-selected model

The initial live path failed TLS verification with
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`. On this Windows machine, setting
`NODE_USE_SYSTEM_CA=1` for the launched Node processes restored connectivity,
with certificate verification still enabled. No global certificate/security
setting was weakened.

OpenRouter then returned 404 for `anthropic/claude-3-haiku`, reporting that it was
deprecated September 10. The user explicitly chose **DeepSeek V4.1 Flash**.
Its exact ID, `deepseek/deepseek-v4.1-flash`, was confirmed through OpenRouter's
models API and [model page](https://openrouter.ai/deepseek/deepseek-v4.1-flash).
The models API reports optional reasoning enabled at high effort by default.
For this short tutor workload, the request disables reasoning while retaining
the 1024-token cap and 10-second timeout. OpenRouter routing is unchanged; no
native Anthropic usage is claimed.

Final displayed-response spot-check after disabling optional reasoning:

| Skill / style | API duration | Actual source | Visible label |
|---|---:|---|---|
| Excel / Simple | 4.678 s | ai | Live AI Generation |
| Excel / Visual | 10.023 s | fallback after timeout | Curated Example |
| Excel / Example-based | 4.653 s | ai | Live AI Generation |
| Excel / Step-by-step | 3.401 s | ai | Live AI Generation |
| Excel / Arabic | 5.502 s | ai | Live AI Generation |
| Communication / Simple | 2.024 s | ai | Live AI Generation |

These are six displayed explanations, not an inference of 100% provider
availability or an exact count of upstream calls. Development StrictMode duplicates
initial tutor requests; the raw capture records them. An earlier DeepSeek Visual
pilot also timed out. The final judge regression again used a live Simple response
and a correctly labeled Visual timeout fallback.

A separate real backend on port 3002, with both keys absent, returned correctly
labeled curated Power BI explanations in all five styles (roughly 7–148 ms,
including forwarding overhead). That server was stopped and the temporary browser
forwarding was removed afterward. Controlled tests additionally cover rate limit
429, malformed model JSON and a stalled response body. No fake live result was
used as evidence of provider success.

See [live spot-check](evidence/2026-09-27/deepseek-spot-check.json),
[no-key browser check](evidence/2026-09-27/no-key-browser-check.json), and
[current limitations](LIMITATIONS.md).

## Scenario and layout checks

- SQL with project evidence: 15.8% visible requirement match.
- All 13 core skills with project evidence: 100.0%, 12 supplementary gaps, three roadmap items.
- All 25 required skills with project evidence: 100.0%, zero gaps, zero roadmap items.
- Explicit seven-skill demo profile: 58.1%; Power BI, Reporting and Problem Solving
  are the top gaps. Roadmap order is Reporting → Power BI → Problem Solving.
- Reset/repeat, delayed requirements, failed-profile retry, departure before an
  Analysis response and stale tutor-style responses passed.
- Desktop Arabic tutor and 390-pixel mobile Results/Tutor screenshots were inspected.
  The mobile Results document width was 390 px, matching its viewport.
- [Scenario responses](evidence/2026-09-27/full-evidence-scenarios.json),
  [demo inputs/result](evidence/2026-09-27/demo-profile.json),
  [desktop tutor](evidence/2026-09-27/tutor-arabic-desktop.png),
  [mobile tutor](evidence/2026-09-27/tutor-fallback-mobile.png).

## Final commands and results

| Check | Result |
|---|---|
| `npm run build` | PASS: backend TypeScript and frontend production build |
| `npm run test --workspace=backend` with verification DB copy | 53 passed, 0 failed, 0 skipped |
| `npx playwright test tests/reliability.spec.ts tests/measure.spec.ts tests/crash-regression.spec.ts tests/judge.spec.ts --workers=1 --reporter=list` from frontend | 8 passed; 31.5 seconds total |
| `npm run lint` | FAIL: frontend 4 errors/1 warning; backend 26 errors, chiefly existing explicit-any usage |
| `git diff --check` | Existing trailing whitespace in App.tsx (not changed by this work) |

Logs: [build](evidence/2026-09-27/build.txt),
[backend tests](evidence/2026-09-27/backend-tests.txt),
[browser tests](evidence/2026-09-27/browser-tests.txt),
[lint](evidence/2026-09-27/lint.txt).
Tutor fixture tests verify UI contracts, not live AI. None of these checks is
substituted for a human rehearsal.

## Remaining gates and rollback

1. Human presenter: speak the four-minute script aloud, record actual duration and
   problems. Independent tester: complete the five-minute checklist without coaching.
2. Obtain subjective confirmation that the original Analysis complaint is gone on
   the actual judging setup. Repeat the short preflight near October 6.
3. Keep the historical SQLite incident unresolved unless new evidence appears.
4. Expect variable live tutor latency and demonstrate honest fallback when needed.
5. Track lint debt separately; no broad backend rewrite was attempted.
6. Optional second architecture review is deferred until mandatory human gates pass.
   Freeze the verified demo by October 4–5; avoid discretionary judging-day changes.

The documented raw evidence and the baseline copy allow targeted source rollback.
Do not roll back unrelated user work or replace the database with an older copy.
Rolling back to the old AI model restores a route observed to be deprecated, not a
working live configuration. Local README/memory were updated while preserving
the other documentation task's history; nothing was committed or published by
this implementation task.
