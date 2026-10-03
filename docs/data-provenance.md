# SkillBridge: Job Postings Data Provenance

As per the project's strict data rules (Rule 4), all job posting data must be clearly labeled as `real` or `sample`. The dataset is never presented as more than what it is.

## Dataset Composition (Phase A)

Currently, the dataset is in its **initial seeded state**, awaiting real postings from the user. 

*   **Total Postings**: 40
*   **Real Postings**: 0
*   **Sample (Synthetic) Postings**: 40

### Source Breakdown

*   `synthetic`: 40

## Adding Real Postings

To add real postings to the dataset:
1. Provide the text of a real "Junior Data Analyst" posting.
2. The ingestion script/pipeline will add it with `source_label: 'real'` and the appropriate `source_name` (e.g., `LinkedIn`, `Bayt.com`).
3. Re-run `npm run seed --workspace=backend` to rebuild the pipeline and update the role requirements.

## Pipeline Integrity

The dataset is ingested by a fully deterministic pipeline (`src/pipeline/skill-extractor.ts` and `src/pipeline/aggregator.ts`) that extracts skills using regex word-boundary matching against a canonical taxonomy, then calculates the frequency and weight of each skill without the use of an LLM.

The test suite (`src/__tests__/provenance.test.ts`) verifies the dataset composition and warns when the dataset contains zero `real` postings.
