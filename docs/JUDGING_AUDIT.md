# Judging audit — evidence and remaining gaps

Updated September 27, 2026. No predicted score or “zero gaps” claim.
Historical automated runs are not physical human verification. Cross-check LIMITATIONS.md.

| Criterion | Current evidence | Remaining qualification |
|---|---|---|
| Core Functionality (20) | Browser flow reaches Results; corrected tutor contract renders explanations and reset works | Full timed human demonstration remains pending |
| Problem–Solution (10) | Explainable requirement match, gaps and roadmap | 30 of 37 postings are samples; no independent representativeness or outcome validation |
| Scope & MVP Focus (10) | One role, local profile, bounded tutor | Auth/multiple roles/live scraping are deliberate exclusions, not features to add before judging |
| Technical Implementation (15) | Layered backend; deterministic formula; browser-confirmed contract corrections | Existing lint debt; self-reported evidence is not verified competence |
| Integration (10) | OpenRouter → user-selected DeepSeek V4.1 Flash; JSON validation and honest fallback | Five of six displayed explanations in final spot-check were live; Visual timed out |
| Architecture (5) | Routes/services/repositories and local SQLite; AI does not score | Historical SQLite panic remains unexplained; optional second review deferred |
| Core Workflow Clarity (8) | All six screens exercised by agent-operated browser | Independent five-minute judge walkthrough pending |
| Inputs/Outputs/Errors (7) | Input validation, error boundary, profile retry and defined Results fields checked | Unknown skills require canonical names/aliases; no fuzzy matching |
| Stability (7) | Six Analysis runs 79–114 ms; delayed-response reset safe; 50 Analysis requests returned 201 | Narrow local evidence, not proof of every environment or historical incident resolution |
| Scenario Testing (5) | Real browser core-only 100% with supplementary gaps; all requirements 100% with zero gaps; demo profile 58.1% | Human validation and broader evidence-quality evaluation pending |
| Edge Cases (3) | Missing-key styles, provider 429, malformed JSON and stalled-body timeout checked | Generic fallback outside nine skills; provider latency remains variable |

See VERIFICATION_2026-09-27.md for exact commands, evidence files and final check results.
