/**
 * Data provenance tests.
 *
 * These ensure the job postings dataset meets the project's hard rules
 * around source labeling and honest data attribution:
 *
 *   - Every posting has a valid source_label ('real' or 'sample')
 *   - Every posting has a non-empty source_name
 *   - The dataset is not accidentally all-synthetic (warns if 0 real)
 *   - No source_label is blank or null
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { JOB_POSTINGS } from '../data/job-postings';

describe('data provenance', () => {
  it('dataset has at least 30 postings (MVP minimum)', () => {
    assert.ok(
      JOB_POSTINGS.length >= 30,
      `Expected ≥30 postings, got ${JOB_POSTINGS.length}`
    );
  });

  it('dataset has at most 50 postings (MVP scope)', () => {
    assert.ok(
      JOB_POSTINGS.length <= 50,
      `Expected ≤50 postings, got ${JOB_POSTINGS.length}`
    );
  });

  it('every posting has a valid source_label ("real" or "sample")', () => {
    for (let i = 0; i < JOB_POSTINGS.length; i++) {
      const p = JOB_POSTINGS[i];
      assert.ok(
        p.source_label === 'real' || p.source_label === 'sample',
        `Posting #${i} ("${p.title}") has invalid source_label: "${p.source_label}"`
      );
    }
  });

  it('no posting has a blank or empty source_label', () => {
    for (let i = 0; i < JOB_POSTINGS.length; i++) {
      const p = JOB_POSTINGS[i];
      assert.ok(
        p.source_label && p.source_label.trim().length > 0,
        `Posting #${i} ("${p.title}") has blank/empty source_label`
      );
    }
  });

  it('every posting has a non-empty source_name', () => {
    for (let i = 0; i < JOB_POSTINGS.length; i++) {
      const p = JOB_POSTINGS[i];
      assert.ok(
        p.source_name && p.source_name.trim().length > 0,
        `Posting #${i} ("${p.title}") has blank/empty source_name`
      );
    }
  });

  it('every posting has a non-empty description', () => {
    for (let i = 0; i < JOB_POSTINGS.length; i++) {
      const p = JOB_POSTINGS[i];
      assert.ok(
        p.description && p.description.trim().length > 0,
        `Posting #${i} ("${p.title}") has blank/empty description`
      );
    }
  });

  it('every posting has a non-empty title', () => {
    for (let i = 0; i < JOB_POSTINGS.length; i++) {
      const p = JOB_POSTINGS[i];
      assert.ok(
        p.title && p.title.trim().length > 0,
        `Posting #${i} has blank/empty title`
      );
    }
  });

  it('fails loudly if zero real postings exist (all-synthetic dataset)', () => {
    const realCount = JOB_POSTINGS.filter(p => p.source_label === 'real').length;
    const sampleCount = JOB_POSTINGS.filter(p => p.source_label === 'sample').length;

    // The user requested this to fail loudly so we don't accidentally ship
    // the MVP with 0 real data provenance.
    assert.ok(
      realCount > 0,
      `PROVENANCE FAILURE: Dataset contains 0 real postings (${sampleCount} sample). You must provide real job postings before shipping.`
    );
  });

  it('source_label values are exactly "real" or "sample" (no typos)', () => {
    const validLabels = new Set(['real', 'sample']);
    const uniqueLabels = new Set(JOB_POSTINGS.map(p => p.source_label));

    for (const label of uniqueLabels) {
      assert.ok(
        validLabels.has(label),
        `Found unexpected source_label value: "${label}"`
      );
    }
  });
});
