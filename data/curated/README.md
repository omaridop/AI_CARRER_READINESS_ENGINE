# Jordan analyst reference dataset

Reviewed September 28, 2026. Files: `jordan-analyst-2026-09-28.json` and equivalent CSV.

## What was collected

Seven source-linked records: five reviewed historical junior/early-career references and two conditional records. Of the five reviewed references, Kalamntina already exists in the app dataset; four are new references. Neither this count nor an accessible page establishes that a vacancy is currently open. Five of seven have explicitly closed or passed-deadline status; two have unknown status.

This is a **historical requirements research artifact**, not a 30–50-posting representative market dataset and not imported into the application. Employer sites/ATS, recruiter pages and employer LinkedIn posts were read manually. No TheirStack credits used. No automatic scraping system was built.

## Selection and fidelity

- Keep Jordan analyst duties, explicit junior titles or experience bands starting at zero or one year. A junior role allowing 1–3 years is not automatically a graduate role. Mark BI adjacency.
- Retain source URLs, publication/closing dates where explicit, observed status, degree/experience context and optional-versus-alternative tool distinctions. Unknown dates stay null; relative dates are not converted into invented dates.
- Summaries are brief paraphrases, not original job descriptions. Skill lists are manual research annotations, not output from the deterministic extractor. **Do not calculate market weights from summaries**: wording and omissions would bias extraction. Production ingestion requires a reviewed, permitted source representation and deterministic pipeline validation.
- The anonymous graduate advert is conditional because employer identity/deduplication cannot be fully verified. Airport International Group is conditional because the complete career-portal description could not be retrieved and the role includes broad IT duties.
- Publication and redistribution rights have not been granted by the sources; this file does not claim a license to republish full adverts. Full descriptions, applicant details and credentials were not collected into these files.
- Older examples are useful evidence of past requirements, not current demand. There is no verified active-job count here.

## Duplicate and exclusion register

Kalamntina's junior advert is the same entry already in `backend/src/data/job-postings.ts` (real entry 3), and overlaps the previously found Naukrigulf copy. Retain one record, not three.

Other researched leads were not included:

| Lead | Reason |
| --- | --- |
| Zain 171406, Data Analytics Trainee | Employer page identifies Bahrain/Manama, not Jordan. |
| Zain 172227, Data Analytics & AI Intern | Older broad AI/data-science internship; hold outside analyst core. |
| Vitas developer/analyst | Primarily application-development hybrid; not a clean analyst requirement set. |
| Personal recruiter junior advert | Employer not identifiable; insufficient provenance to count as another vacancy. |
| ZENSSY search result | Page inaccessible; Jordan location not established. |
| Syarah API records | Repeated descriptions, unspecified experience; remain on hold. |
| Senior and data-engineering API results | Wrong seniority or target occupation. |

## Existing seven real records: audit decisions

| Existing entry | Decision |
| --- | --- |
| REACH Assessment Officer | Hold: research/humanitarian adjacent role, publication date absent; original-source verification needed. |
| Business Analyst | Hold: junior experience, but management/HR consulting duties differ from data analysis. |
| Kalamntina Junior Data Analyst | Retain once as a reviewed historical early-career reference. |
| Kalamntina Data Analytics | Hold: dated December 2024 and 2–3 years; outside chosen zero/one-year minimum rule. |
| Data Analyst and CRM Supervisor | Exclude from proposed junior core: supervisor hybrid, 2–3 years and 2023 date. |
| Data Associate | Exclude from proposed junior core: 3+ years and engineering/pipeline responsibilities. |
| BI Analyst | Hold: experience unspecified; old 2024 source requires review. |

These are proposed audit decisions; no existing rows were removed. The current 7-real/30-sample database remains unchanged. Samples remain absent from this research artifact.

## Verification and next use

JSON parsed successfully; seven unique record IDs and seven source URLs; CSV round-trip returned seven rows. Each record has real/sample classification, source, summary and decision. Review decisions are research judgments, not automated competence checks.

Use this shortlist to choose a small dated Jordan snapshot and resolve conditional records. Do not append duplicates, treat optional skills as mandatory, claim current hiring coverage, or change the established scoring formula. The 30–50 target remains unmet; no fabricated filler was added.
