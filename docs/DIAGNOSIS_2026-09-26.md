# Browser diagnosis — September 26, 2026

## Evidence before changes

Agent-operated Edge 151.0.4129.72 (Playwright, headless, 1365 × 900), normal
`npm run dev`, React StrictMode enabled, no artificial network/CPU throttling.
This is browser verification, not a human presentation rehearsal.

The SQL/project profile run saved successfully: POST /api/profile returned 201
in 179.357 ms (browser request start through response end; response start at
175.247 ms). After 7.561 seconds the UI still displayed Initializing scan.
POST /api/analysis was never sent. No API request remained pending. Both taxonomy
and requirements GETs returned 200 (each ran twice in development StrictMode).
Console recorded the profile response and an unrelated resource 404; no page
exception explained the stall. See evidence/2026-09-26/baseline.json and baseline-window.har.

## Cause and smallest correction

AnalysisLoading starts its request in an effect guarded by hasStartedRef.
StrictMode's effect cleanup marks the first invocation unsubscribed; the second
invocation exits because the ref is already set. The profile response is then
discarded before analysis is requested. This is a stopped workflow, not slow SQL.

Keep one in-flight profile/analysis promise for this mounted analysis screen,
and attach a fresh result subscription on each effect setup. Cleanup prevents a
departed screen from publishing results, while StrictMode's second setup can
subscribe to the same operation. Keep StrictMode enabled and avoid duplicate writes.
Replace simulated scan messages with an honest description of the local work.

Regression: exactly one profile POST and one analysis POST, actual Results visible,
reset/repeat and departure during a delayed response cannot resurrect old results.
Further Results/Tutor contract failures are separate from this first stall.

## SQLite incident — unresolved and undocumented

The repository has one commit, 5bb8fa7 (scaffolding), no configured remote, and no
Phase F commits to blame. Searches for panic, SQLITE_BUSY, SQLITE_LOCKED,
SQLITE_CORRUPT and database-is-locked text found no incident in source/docs/logs.
The user confirms no original incident text is available. There is no basis for
claiming a historical cause or fix.

The existing database, before load testing, reports SQLite 3.49.2, WAL mode,
integrity_check=ok, no foreign_key_check violations, 7 real and 30 sample postings.
Runtime is Node 24.15.0. No backend exception appeared during the browser stall.
These observations do not establish that the historical panic cannot recur.

Original source/docs and database files were preserved outside the repository in
C:/Users/epico/AppData/Local/Temp/skillbridge-preserved-20260926-114311.
Restore individual changed source files from that baseline only if rollback is
needed; preserve unrelated user changes. No reseeding or schema migration is planned.

## Completion gates

Post-fix browser timings, rapid submission results, backend output and current
limitations will be recorded separately. Human rehearsal, subjective confirmation
of the original complaint and the historical SQLite incident remain distinct gates.

## September 27 follow-up

The authorized corrections and measured post-fix results are recorded in
VERIFICATION_2026-09-27.md. The initial raw HAR continued across hot reload;
baseline-window.har contains only requests through the unchanged baseline snapshot.
The user authorized agent-operated Playwright network/console capture instead of
a manual baseline. This does not waive the independent human rehearsal requirement.
