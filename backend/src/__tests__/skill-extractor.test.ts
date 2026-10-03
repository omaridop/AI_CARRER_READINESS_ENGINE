/**
 * Tests for the skill extraction pipeline.
 *
 * Covers:
 *   - Alias normalization (various spellings → canonical name)
 *   - Skill extraction from posting text (precision + recall)
 *   - Edge cases: substring traps, multi-word aliases, case insensitivity
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { SKILLS_TAXONOMY } from '../data/skills-taxonomy';
import {
  buildSkillPatterns,
  extractSkills,
  normalizeAlias,
} from '../pipeline/skill-extractor';

// ── Alias Normalization ────────────────────────────────────

describe('normalizeAlias', () => {
  it('maps canonical name to itself', () => {
    assert.equal(normalizeAlias('SQL', SKILLS_TAXONOMY), 'SQL');
    assert.equal(normalizeAlias('Python', SKILLS_TAXONOMY), 'Python');
    assert.equal(normalizeAlias('Excel', SKILLS_TAXONOMY), 'Excel');
  });

  it('maps known aliases to their canonical skill (case-insensitive)', () => {
    assert.equal(normalizeAlias('powerbi', SKILLS_TAXONOMY), 'Power BI');
    assert.equal(normalizeAlias('PowerBI', SKILLS_TAXONOMY), 'Power BI');
    assert.equal(normalizeAlias('ms power bi', SKILLS_TAXONOMY), 'Power BI');
    assert.equal(normalizeAlias('Microsoft Power BI', SKILLS_TAXONOMY), 'Power BI');
  });

  it('maps Excel aliases correctly', () => {
    assert.equal(normalizeAlias('microsoft excel', SKILLS_TAXONOMY), 'Excel');
    assert.equal(normalizeAlias('MS Excel', SKILLS_TAXONOMY), 'Excel');
    assert.equal(normalizeAlias('advanced excel', SKILLS_TAXONOMY), 'Excel');
  });

  it('maps data cleaning aliases correctly', () => {
    assert.equal(normalizeAlias('data wrangling', SKILLS_TAXONOMY), 'Data Cleaning');
    assert.equal(normalizeAlias('data cleansing', SKILLS_TAXONOMY), 'Data Cleaning');
    assert.equal(normalizeAlias('data preprocessing', SKILLS_TAXONOMY), 'Data Cleaning');
  });

  it('maps soft skill aliases correctly', () => {
    assert.equal(normalizeAlias('problem-solving', SKILLS_TAXONOMY), 'Problem Solving');
    assert.equal(normalizeAlias('critical thinking', SKILLS_TAXONOMY), 'Problem Solving');
    assert.equal(normalizeAlias('detail-oriented', SKILLS_TAXONOMY), 'Attention to Detail');
    assert.equal(normalizeAlias('team player', SKILLS_TAXONOMY), 'Teamwork');
  });

  it('returns null for unknown aliases', () => {
    assert.equal(normalizeAlias('underwater basket weaving', SKILLS_TAXONOMY), null);
    assert.equal(normalizeAlias('', SKILLS_TAXONOMY), null);
    assert.equal(normalizeAlias('quantum computing', SKILLS_TAXONOMY), null);
  });
});

// ── Skill Extraction ───────────────────────────────────────

describe('extractSkills', () => {
  const patterns = buildSkillPatterns(SKILLS_TAXONOMY);

  it('extracts SQL, Python, and Excel from a typical posting', () => {
    const text = `
      We are looking for a Junior Data Analyst with experience in SQL,
      Python, and Microsoft Excel. The candidate should be comfortable
      writing SQL queries and using Python for data analysis.
    `;
    const results = extractSkills(text, patterns);
    const names = results.map(r => r.skillName);

    assert.ok(names.includes('SQL'), 'Should extract SQL');
    assert.ok(names.includes('Python'), 'Should extract Python');
    assert.ok(names.includes('Excel'), 'Should extract Excel');
    assert.ok(names.includes('Data Analysis'), 'Should extract Data Analysis');
  });

  it('extracts Power BI from various spellings', () => {
    const text1 = 'Experience with Power BI dashboards required.';
    const text2 = 'Must know PowerBI and Tableau.';
    const text3 = 'Proficiency in Microsoft Power BI.';

    const r1 = extractSkills(text1, patterns).map(r => r.skillName);
    const r2 = extractSkills(text2, patterns).map(r => r.skillName);
    const r3 = extractSkills(text3, patterns).map(r => r.skillName);

    assert.ok(r1.includes('Power BI'), 'Should match "Power BI"');
    assert.ok(r2.includes('Power BI'), 'Should match "PowerBI"');
    assert.ok(r3.includes('Power BI'), 'Should match "Microsoft Power BI"');
  });

  it('does NOT false-positive on SQL inside MySQL', () => {
    // "MySQL" should map to "Database Management" (via alias),
    // NOT to "SQL" (which requires word boundary)
    const text = 'Experience with MySQL databases.';
    const results = extractSkills(text, patterns);
    const names = results.map(r => r.skillName);

    assert.ok(names.includes('Database Management'), 'MySQL should match Database Management');
    // SQL should NOT match because \bSQL\b doesn't match inside MySQL
    assert.ok(!names.includes('SQL'), 'SQL should NOT match inside MySQL');
  });

  it('does NOT false-positive on "R" in normal English words', () => {
    // The taxonomy uses "R Programming" as the canonical name with
    // aliases like "r programming", "r language" — standalone "R" is
    // not an alias, so it should not match.
    const text = 'We are looking for a great candidate with communication skills.';
    const results = extractSkills(text, patterns);
    const names = results.map(r => r.skillName);

    assert.ok(!names.includes('R Programming'), 'Should NOT match R in normal words');
  });

  it('extracts R Programming from explicit mentions', () => {
    const text = 'Must have experience with R programming and RStudio.';
    const results = extractSkills(text, patterns);
    const names = results.map(r => r.skillName);

    assert.ok(names.includes('R Programming'), 'Should match "R programming"');
  });

  it('deduplicates skills when multiple aliases match', () => {
    const text = 'Use Power BI (also known as PowerBI or MS Power BI) for reporting.';
    const results = extractSkills(text, patterns);
    const pbiResults = results.filter(r => r.skillName === 'Power BI');

    assert.equal(pbiResults.length, 1, 'Power BI should appear exactly once');
    assert.ok(
      pbiResults[0].matchedTerms.length >= 2,
      'Should record multiple matched terms'
    );
  });

  it('handles case-insensitive matching', () => {
    const text = 'PYTHON, sql, TABLEAU, and excel are required.';
    const results = extractSkills(text, patterns);
    const names = results.map(r => r.skillName);

    assert.ok(names.includes('Python'), 'Case-insensitive Python');
    assert.ok(names.includes('SQL'), 'Case-insensitive SQL');
    assert.ok(names.includes('Tableau'), 'Case-insensitive Tableau');
    assert.ok(names.includes('Excel'), 'Case-insensitive Excel');
  });

  it('extracts soft skills from natural language', () => {
    const text = `
      Strong communication skills required. Must be detail-oriented
      and a team player. Analytical thinking is a plus.
    `;
    const results = extractSkills(text, patterns);
    const names = results.map(r => r.skillName);

    assert.ok(names.includes('Communication'), 'Should extract Communication');
    assert.ok(names.includes('Attention to Detail'), 'Should extract Attention to Detail');
    assert.ok(names.includes('Teamwork'), 'Should extract Teamwork');
    assert.ok(names.includes('Problem Solving'), 'Should extract Problem Solving (via analytical thinking)');
  });

  it('returns empty array for irrelevant text', () => {
    const text = 'Looking for a chef with 5 years of culinary experience.';
    const results = extractSkills(text, patterns);
    assert.equal(results.length, 0, 'No skills should match');
  });
});
