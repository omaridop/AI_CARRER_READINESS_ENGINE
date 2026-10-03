# On-demand course research — September 27, 2026

## User-facing behavior

From Results, open a skill lesson. In the tutor, choose **Find courses**. The new section researches relevant Coursera and Udemy course pages for the selected skill. It returns up to three links, provider names, the reason for their topic match, optional source excerpts and a research timestamp. Results may come from only one provider; the app does not invent a second provider's course to balance the list.

The list is described as a shortlist rather than “the best” courses. It does not independently assess teaching quality, verify enrollment availability, or invent ratings, prices, duration or language guarantees. Users should check the syllabus, prerequisites, language, current price and recent reviews on the official course page. Course completion does not automatically change the requirement-match score.

## Integration contract

- POST /api/courses/search accepts { skillName: string }. Only a canonical taxonomy skill or known alias is allowed, with a 100-character input limit; invalid requests return 400 before external research.
- Returns the existing { data, error } envelope. Data contains skill, source ('web' or 'fallback'), researchedAt (ISO string or null), cached, courses, searchLinks and notice.
- A course contains title, provider, URL, whyRelevant and optional sourceExcerpt. Results come exclusively from provider-returned url_citation annotations. Model prose and invented model URLs are never used as link sources.
- HTTPS course paths on www.coursera.org / coursera.org and www.udemy.com / udemy.com are allowlisted; credentials, unusual ports, redirect/search paths and unrelated hosts are rejected. Tracking/query parameters and fragments are removed; duplicates are merged.
- A deterministic topic/alias match filters citations and places title matches before excerpt-only matches. This is relevance filtering, not a quality ranking. It supports short names such as R without matching arbitrary words containing that letter.

## Provider, budgets and failure behavior

Uses the existing server-side OPENROUTER_API_KEY and user-selected deepseek/deepseek-v4.1-flash model. No additional key, dependency or database migration was introduced. Course discovery is an explicitly authorized extension to the brief's AI scope; the tutor's existing route and deterministic readiness logic are unchanged.

Research uses OpenRouter's current openrouter:web_search server tool with the Exa engine, allowed Coursera/Udemy domains, one search use, five total results, max_tool_calls=2, 700 output tokens and optional reasoning disabled. The 25-second abort deadline covers both headers and response body. The browser has a 30-second cancellation deadline. There are no automatic retries.

Search uses OpenRouter credits in addition to model usage. It starts only on an explicit click, never while rendering Results, hovering or switching tutor styles. Successful results are cached in server memory for one hour; failure results for one minute. Repeated concurrent requests for the same skill share one operation, and no more than two different skills are researched concurrently. Cache entries are bounded by the validated taxonomy and reset on backend restart. Browser cancellation prevents stale UI updates but does not guarantee upstream work or billing stops.

If search is unavailable, disabled by missing credentials, timed out, malformed or returns no suitable cited courses, the UI says **Provider search links · fallback** and offers official Coursera/Udemy search pages. Those are not researched course recommendations. Cached successful results retain their original timestamp and display **Saved web research**.

Only the selected canonical skill is sent to the research provider; student names, IDs, profiles and evidence are not included. The app does not fetch arbitrary course URLs server-side.

Official implementation references: [OpenRouter web search server tool](https://openrouter.ai/docs/guides/features/server-tools/web-search), [citation annotation format](https://openrouter.ai/docs/guides/features/plugins/web-search#parsing-web-search-results). The server tool is used rather than the older web plugin.

## Evidence and limitations

- Initial actual SQL API research returned three cited Coursera courses in 11.468 seconds.
- Final real browser SQL research returned 200, source=web and three courses in 8.450 seconds; no page errors. An immediate second request used the cache. See [live browser JSON](evidence/course-search/live-browser.json) and [cached browser JSON](evidence/course-search/cached-browser.json).
- All three SQL course pages were also opened using web research during implementation and resolved to official course pages. This spot-check does not establish ongoing link availability or quality. One listing was taught in Hindi, reinforcing the need to check language before choosing a course; no English-language guarantee is made.
- [Desktop course section](evidence/course-search/courses-desktop.png) and [mobile course section](evidence/course-search/courses-mobile.png) inspected. The 390 px mobile document has no horizontal overflow.
- Backend: 63 tests pass, zero failed/skipped, on a consistent database copy. Ten new cases cover citation grounding, host/path safety, relevance, single-letter terms, no-key fallback, deduplication, cache expiry, concurrency, provider failure and stalled-body timeout.
- Browser: 15 tests pass. New cases cover manual-only search, double-click suppression, cache/source badges, invalid links, fallback, reset during research and invalid skill rejection. Existing Analysis, async-state and tutor race regressions remain passing. Final six Analysis runs: 102, 80, 80, 68, 80, 80 ms with one profile/analysis POST pair each.
- Both builds pass. Lint passes for the new provider/service/route/test/component files; existing project-wide lint debt remains.
- Browser fixture tests do not prove live availability. Live SQL testing covers one topic, not all subjects or both providers independently. Udemy URL handling is covered by controlled tests. Human demo rehearsal and independent judge walkthrough remain pending.

Logs: [backend tests](evidence/course-search/backend-tests.txt), [browser tests](evidence/course-search/browser-tests.txt), [build](evidence/course-search/build.txt).

No commit, publication, destructive database reset or schema migration was performed. Tests wrote synthetic records only via the existing APIs; backend tests used a consistent temporary database copy. The local app remains at localhost:5173.
