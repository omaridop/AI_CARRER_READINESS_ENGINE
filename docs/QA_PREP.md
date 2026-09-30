# Technical Q&A preparation

Updated September 27, 2026. Describe observed behavior, not promises.

**What does the percentage mean?**
It is a requirement-match indicator against our curated dataset, never a hiring or employment prediction. The formula is deterministic; no LLM calculates scores, gaps, or roadmap order.

**How does scoring work?**
Course/project/certificate selections receive 1.0 credit; self-declared receives 0.5. Only skills present in at least 15% of postings enter the denominator. All credited required skills enter the numerator, including supplementary skills; the result is capped at 100% and rounded to one decimal. A 100% score may still have supplementary or partially credited gaps. Evidence selection is not independent verification.

**Where did the requirements come from?**
The stored dataset has 37 postings: 7 real and 30 clearly labeled samples. Real postings were manually sourced; there is no live scraping or market scan during Analysis. Samples dominate the dataset, so we do not claim statistically representative market weights or validated predictive accuracy.

**Which AI provider and model are used?**
OpenRouter routes to `deepseek/deepseek-v4.1-flash`. On September 27 the user explicitly selected this model after the former Claude 3 Haiku route returned a deprecation error. We do not claim direct Anthropic usage. Optional DeepSeek reasoning is disabled for short tutor answers; the existing 1024-token cap and JSON validation remain.

**What if the tutor is unavailable?**
The service validates model JSON and falls back to curated content on failure. The UI labels each response Live AI Generation or Curated Example from its actual source. The request timeout is 10 seconds including body consumption; fallback after a timeout is not instant. Nine skills have tailored coverage; other skills use generic content.

**Why SQLite and a layered backend?**
SQLite keeps deterministic scoring and stored requirements local for the demo. Routes, services and repositories separate HTTP handling, domain calculations and persistence. Hosted infrastructure, auth and multiple roles are outside this MVP. Local SQLite does not remove every failure mode.

**What was wrong with Analysis?**
A development StrictMode effect cleanup abandoned the profile response while a started guard prevented resubscription. The browser showed a successful profile POST and no analysis POST. The fix shares one in-flight operation and reattaches the result subscription. Further Results/Tutor response mismatches were also reproduced and corrected. The formula and database schema were unchanged.

**Was there a SQLite panic?**
The handoff mentions one, but no original message or reproducible cause has been found. Current integrity checks and 50 browser-driven Analysis requests passed. We call the historical incident unresolved; we do not present those checks as a historical fix.

**What has actually been verified?**
See `VERIFICATION_2026-09-27.md` for exact tests, browser timings and live/fallback results. Automated browser verification is distinct from a human speaking the four-minute demo aloud and another person completing the judge walkthrough. Do not claim those human checks until names, dates and measured timings are recorded.

**What is the correct demo score?**
The explicit seven-skill profile in `DEMO_SCRIPT.md` gives 58.1%. Its top gaps are Power BI, Reporting and Problem Solving, while prerequisite sequencing places Reporting first in the roadmap.
