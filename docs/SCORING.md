# Scoring & Gap Ranking Formula (Phase B)

This document describes the exact, deterministic mathematical formula used by SkillBridge to compute a student's readiness percentage and rank their skill gaps.

As per Rule 2, this logic is **100% deterministic** and fully traceable to the database. No LLM is involved.

---

## 1. Credit Multipliers

When a student declares a skill, they select an `evidence_type`. This maps to a fixed credit multiplier. Evidence is self-reported; the MVP does not independently verify projects, certificates, courses, or competence.

*   `course`: 1.0 (Full credit)
*   `project`: 1.0 (Full credit)
*   `certificate`: 1.0 (Full credit)
*   `self_declared`: 0.5 (Partial credit)
*   *Absent (not declared)*: 0.0

---

## 2. Readiness Percentage

The readiness percentage compares the student's credited skills against the weighted requirements of the target role (from the market scan). To avoid penalizing candidates for not possessing niche tools from the "long tail" of job postings, the denominator is restricted to **Core Requirements**.

1.  **Core Requirement Threshold**: `0.15` (15%). Skills appearing in 15% or more of job postings are considered Core.
2.  **Max Core Score**: The sum of all `weight` values for the target role's **Core Requirements** only.
3.  **Student Score**: For each required skill (both core and supplementary), we multiply the role's requirement `weight` by the student's `credit multiplier`. Supplementary skills act as bonus credit toward the numerator.
4.  **Readiness %**: `(Student Score / Max Core Score) * 100`, capped at 100%, and rounded to 1 decimal place.

**Example:**
*   Role requires: Python (weight 0.4), SQL (weight 0.3), NicheTool (weight 0.1)
*   Core Threshold = 0.15. Max Core Score = `0.4 + 0.3` = `0.7`
*   Student has: Python (Project = 1.0 credit), SQL (Self-declared = 0.5 credit), NicheTool (Project = 1.0 credit)
*   Student Score = `(0.4 * 1.0) + (0.3 * 0.5) + (0.1 * 1.0)` = `0.4 + 0.15 + 0.1` = `0.65`
*   Readiness % = `(0.65 / 0.7) * 100` = **92.9%**

---

## 3. Gap Ranking

Gaps are identified for any required skill where the student's credit multiplier is less than 1.0. 

To prioritize what the student should learn first, we calculate a `GapWeight`:

*   `GapWeight = Requirement Weight * (1.0 - Credit Multiplier)`

Gaps are then sorted in **descending order**. The higher the `GapWeight`, the more critical the gap is to closing the market readiness deficit.

---

## 4. Roadmap Sequencing

Once the top gaps are identified (e.g., Top 3), they are sequenced into a learning roadmap. We use a static prerequisite-category mapping to ensure foundational skills are taught before advanced ones, regardless of pure gap weight:

1.  `programming` (Foundations)
2.  `data` (Pipelines & Modeling)
3.  `analytics` (Dashboards & BI)
4.  `statistics` (Math & ML)
5.  `tools` (Cloud services)
6.  `soft_skill` (Communication, teamwork)

If two gaps share the same category, they fall back to being sorted by `GapWeight` descending.

The roadmap contains up to three available gaps, including zero for a fully
covered requirement set. Supplementary credit means a capped 100% requirement
match can coexist with remaining gaps. Neither the cap nor the credit multipliers
predict hiring.
