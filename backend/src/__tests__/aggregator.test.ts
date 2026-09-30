/**
 * Tests for the skill frequency aggregation pipeline.
 *
 * Covers:
 *   - Frequency counting from extraction results
 *   - Weight normalization (frequency / totalPostings)
 *   - Sorting by weight descending
 *   - Edge cases: empty data, single posting, all same skill
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeSkillFrequencies,
  buildRoleRequirements,
} from '../pipeline/aggregator';
import { ExtractionResult } from '../pipeline/skill-extractor';

// ── Helper ─────────────────────────────────────────────────

function makeExtraction(skillIndex: number, skillName: string): ExtractionResult {
  return { skillIndex, skillName, matchedTerms: [skillName] };
}

// ── Frequency Computation ──────────────────────────────────

describe('computeSkillFrequencies', () => {
  it('counts skill appearances across postings correctly', () => {
    const extractions = new Map<number, ExtractionResult[]>();
    // Posting 0 has SQL and Python
    extractions.set(0, [
      makeExtraction(0, 'SQL'),
      makeExtraction(1, 'Python'),
    ]);
    // Posting 1 has SQL and Excel
    extractions.set(1, [
      makeExtraction(0, 'SQL'),
      makeExtraction(2, 'Excel'),
    ]);
    // Posting 2 has SQL, Python, Excel
    extractions.set(2, [
      makeExtraction(0, 'SQL'),
      makeExtraction(1, 'Python'),
      makeExtraction(2, 'Excel'),
    ]);

    const result = computeSkillFrequencies(extractions, 3);

    // SQL appears in all 3 postings
    const sql = result.find(r => r.skillName === 'SQL')!;
    assert.equal(sql.frequency, 3);
    assert.equal(sql.weight, 1.0);

    // Python appears in 2 of 3
    const python = result.find(r => r.skillName === 'Python')!;
    assert.equal(python.frequency, 2);
    assert.equal(python.weight, Math.round((2 / 3) * 10000) / 10000);

    // Excel appears in 2 of 3
    const excel = result.find(r => r.skillName === 'Excel')!;
    assert.equal(excel.frequency, 2);
    assert.equal(excel.weight, Math.round((2 / 3) * 10000) / 10000);
  });

  it('sorts results by weight descending', () => {
    const extractions = new Map<number, ExtractionResult[]>();
    extractions.set(0, [makeExtraction(0, 'SQL')]);
    extractions.set(1, [
      makeExtraction(0, 'SQL'), 
      makeExtraction(1, 'Python'),
      makeExtraction(2, 'Excel')
    ]);
    extractions.set(2, [
      makeExtraction(0, 'SQL'),
      makeExtraction(1, 'Python'),
      makeExtraction(2, 'Excel'),
    ]);
    extractions.set(3, [
      makeExtraction(0, 'SQL'),
      makeExtraction(1, 'Python'),
      makeExtraction(2, 'Excel'),
    ]);

    const result = computeSkillFrequencies(extractions, 4);

    assert.equal(result[0].skillName, 'SQL');     // 4/4 = 1.0
    assert.equal(result[0].frequency, 4);
    // Python and Excel both 3/4 — alphabetical tiebreak
    assert.equal(result[1].skillName, 'Excel');    // 2/4 or 3/4
    assert.equal(result[2].skillName, 'Python');   // alphabetical after Excel
  });

  it('handles empty extractions', () => {
    const extractions = new Map<number, ExtractionResult[]>();
    extractions.set(0, []);
    extractions.set(1, []);

    const result = computeSkillFrequencies(extractions, 2);
    assert.equal(result.length, 0);
  });

  it('throws on totalPostings <= 0', () => {
    const extractions = new Map<number, ExtractionResult[]>();
    assert.throws(() => computeSkillFrequencies(extractions, 0));
    assert.throws(() => computeSkillFrequencies(extractions, -1));
  });

  it('computes single-posting case correctly', () => {
    const extractions = new Map<number, ExtractionResult[]>();
    extractions.set(0, [
      makeExtraction(0, 'SQL'),
      makeExtraction(1, 'Python'),
    ]);

    const result = computeSkillFrequencies(extractions, 1);

    assert.equal(result.length, 2);
    assert.equal(result[0].weight, 1.0);
    assert.equal(result[1].weight, 1.0);
  });

  it('weight = frequency / totalPostings (verified with 10 postings)', () => {
    const extractions = new Map<number, ExtractionResult[]>();
    for (let i = 0; i < 10; i++) {
      const results: ExtractionResult[] = [makeExtraction(0, 'SQL')];
      if (i < 7) results.push(makeExtraction(1, 'Python'));
      if (i < 3) results.push(makeExtraction(2, 'Tableau'));
      extractions.set(i, results);
    }

    const freq = computeSkillFrequencies(extractions, 10);

    const sql = freq.find(f => f.skillName === 'SQL')!;
    assert.equal(sql.frequency, 10);
    assert.equal(sql.weight, 1.0);

    const python = freq.find(f => f.skillName === 'Python')!;
    assert.equal(python.frequency, 7);
    assert.equal(python.weight, 0.7);

    const tableau = freq.find(f => f.skillName === 'Tableau')!;
    assert.equal(tableau.frequency, 3);
    assert.equal(tableau.weight, 0.3);
  });
});

// ── Role Requirements Builder ──────────────────────────────

describe('buildRoleRequirements', () => {
  it('maps taxonomy indices to DB skill IDs', () => {
    const frequencies = [
      { skillId: 0, skillName: 'SQL', frequency: 10, weight: 1.0 },
      { skillId: 1, skillName: 'Python', frequency: 7, weight: 0.7 },
    ];
    const dbMap = new Map([[0, 100], [1, 101]]);

    const reqs = buildRoleRequirements(frequencies, 'Junior Data Analyst', 10, dbMap);

    assert.equal(reqs[0].skillId, 100);
    assert.equal(reqs[0].roleName, 'Junior Data Analyst');
    assert.equal(reqs[0].totalPostings, 10);
    assert.equal(reqs[1].skillId, 101);
  });
});
