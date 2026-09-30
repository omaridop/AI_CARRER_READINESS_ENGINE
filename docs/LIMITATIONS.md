# Limitations and open verification gates

Updated September 27, 2026. Separate deliberate scope choices from unresolved defects.

## Deliberate MVP boundaries

- Junior Data Analyst only; no authentication, account recovery, multi-role support, job board, live scraping, or full LMS.
- Profiles and analyses persist locally in SQLite. Wizard state resets on reload; resetting the UI does not erase database history.
- The dataset contains 7 real and 30 labeled sample postings. These weights demonstrate the pipeline; they are not a representative independent market estimate.
- Evidence types are selected by students, not independently verified. Scores measure requirement match, never hiring probability.
- Exact taxonomy/alias matching rejects unknown skills with a message. No fuzzy matching.
- The roadmap selects up to three available gaps, then orders by prerequisite category. Zero gaps produces zero items. Supplementary credit can produce 100% while gaps remain.
- Five tutor styles exist. Arabic is an explanation style, not full localization.
- Curated fallback coverage is strongest for nine skills. Other skills use a less tailored generic template.
- Tutor output is capped at 1024 tokens. The 10-second provider timeout covers headers and body; fallback is not guaranteed to appear instantly.

## Current open risks

- **Historical SQLite panic:** undocumented and unexplained. No incident text, matching Git history, or saved log was found. Integrity and foreign-key checks passed before/after a 50-request load check; all requests returned 201. This does not identify the original cause or rule out recurrence.
- **Live AI variability:** the user selected DeepSeek V4.1 Flash through OpenRouter after Claude 3 Haiku returned a deprecation error. Five of six displayed explanations in the final spot-check were live; Excel/Visual timed out to correctly labeled fallback. This is not an availability guarantee.
- **Local TLS setup:** this Windows machine required Node's system trust store. Certificate verification remains enabled. Repeat the check on the actual judging machine/network.
- **Development StrictMode:** taxonomy/requirements GETs and initial tutor requests may run twice. Analysis now makes one profile/analysis pair. Duplicate tutor requests can consume extra provider calls in development; measured call records disclose them.
- **Verification debt:** root lint still has existing explicit-any/type-quality findings and a Fast Refresh warning. See the current verification report rather than treating the build or tests as a clean lint result.
- **Human gates:** a timed spoken presentation, independent judge walkthrough, and the user's subjective confirmation of the original delay remain pending. Agent-operated browser checks do not satisfy those gates.
- **Optional second architecture review:** deferred until mandatory verification gates are satisfied.

See [current evidence](VERIFICATION_2026-09-27.md).

## Course research

On-demand Coursera/Udemy recommendations use search citations and topic matching, not an independent course quality ranking. Price, language, prerequisites, enrollment availability and ongoing URL availability require checking at the provider. Web research requires OpenRouter credits and may take up to 25 seconds or fall back to provider search links. Successful results can be an hour old and retain their timestamp. Live verification covers SQL only; no claim that every topic or both providers were independently tested live. See COURSE_SEARCH_2026-09-27.md.
