/**
 * Seed script — the single entry point for building the SkillBridge
 * market-requirements database.
 *
 * Run with:  npm run seed   (or:  npx tsx src/pipeline/seed.ts)
 *
 * What it does (in order):
 *   1. Creates / resets the SQLite database
 *   2. Applies the full schema (Phase A + Phase B tables)
 *   3. Inserts the canonical skills taxonomy
 *   4. Inserts all job postings (real + sample)
 *   5. Runs the deterministic skill-extraction pipeline
 *   6. Aggregates frequencies into role_requirements
 *   7. Prints a summary report
 *
 * This script is idempotent: re-running it rebuilds from scratch.
 */

import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { createSchema } from '../db/schema';
import { SKILLS_TAXONOMY } from '../data/skills-taxonomy';
import { JOB_POSTINGS } from '../data/job-postings';
import { loadScrapedPostings } from './load-scraped';
import {
  buildSkillPatterns,
  extractSkills,
} from './skill-extractor';
import {
  computeSkillFrequencies,
  buildRoleRequirements,
} from './aggregator';
import { ExtractionResult } from './skill-extractor';

const ROLE_NAME = 'Junior Data Analyst';

function main(): void {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   SkillBridge — Market Requirements Seed Script  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── 0. Combine hardcoded and scraped postings ──────────
  const scrapedPostings = loadScrapedPostings();
  const ALL_POSTINGS = [...JOB_POSTINGS, ...scrapedPostings];
  if (scrapedPostings.length > 0) {
    console.log(`  ✓  Loaded ${scrapedPostings.length} scraped posting(s) (total: ${ALL_POSTINGS.length})`);
  }

  // ── 1. Database setup ──────────────────────────────────
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.resolve(dataDir, 'skillbridge.db');

  // Remove existing DB for clean rebuild
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('  ↻  Removed existing database');
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log(`  ✓  Database created at ${dbPath}`);

  // ── 2. Schema ──────────────────────────────────────────
  createSchema(db);
  console.log('  ✓  Schema applied (Phase A + Phase B tables)');

  // ── 3. Insert skills ───────────────────────────────────
  const insertSkill = db.prepare(
    `INSERT INTO skills (name, category, aliases) VALUES (?, ?, ?)`
  );

  const skillIdMap = new Map<number, number>(); // taxonomy index → DB id

  const insertSkillsTx = db.transaction(() => {
    for (let i = 0; i < SKILLS_TAXONOMY.length; i++) {
      const skill = SKILLS_TAXONOMY[i];
      const result = insertSkill.run(
        skill.name,
        skill.category,
        JSON.stringify(skill.aliases)
      );
      skillIdMap.set(i, Number(result.lastInsertRowid));
    }
  });
  insertSkillsTx();
  console.log(`  ✓  Inserted ${SKILLS_TAXONOMY.length} canonical skills`);

  // ── 4. Insert job postings ─────────────────────────────
  const insertPosting = db.prepare(
    `INSERT INTO job_postings (title, company, location, source_label, source_name, description, date_posted)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const postingIdMap = new Map<number, number>(); // array index → DB id

  const insertPostingsTx = db.transaction(() => {
    for (let i = 0; i < ALL_POSTINGS.length; i++) {
      const p = ALL_POSTINGS[i];
      const result = insertPosting.run(
        p.title,
        p.company,
        p.location,
        p.source_label,
        p.source_name,
        p.description,
        p.date_posted
      );
      postingIdMap.set(i, Number(result.lastInsertRowid));
    }
  });
  insertPostingsTx();

  const realCount = ALL_POSTINGS.filter(p => p.source_label === 'real').length;
  const sampleCount = ALL_POSTINGS.filter(p => p.source_label === 'sample').length;
  console.log(`  ✓  Inserted ${ALL_POSTINGS.length} job postings (${realCount} real, ${sampleCount} sample)`);

  // ── 5. Skill extraction ────────────────────────────────
  const patterns = buildSkillPatterns(SKILLS_TAXONOMY);
  const allExtractions = new Map<number, ExtractionResult[]>();
  let totalLinks = 0;

  const insertPostingSkill = db.prepare(
    `INSERT OR IGNORE INTO posting_skills (posting_id, skill_id) VALUES (?, ?)`
  );

  const extractionTx = db.transaction(() => {
    for (let i = 0; i < ALL_POSTINGS.length; i++) {
      const results = extractSkills(ALL_POSTINGS[i].description, patterns);
      allExtractions.set(i, results);

      const dbPostingId = postingIdMap.get(i)!;
      for (const result of results) {
        const dbSkillId = skillIdMap.get(result.skillIndex)!;
        insertPostingSkill.run(dbPostingId, dbSkillId);
        totalLinks++;
      }
    }
  });
  extractionTx();
  console.log(`  ✓  Extracted skills: ${totalLinks} posting↔skill links`);

  // ── 6. Aggregate into role_requirements ────────────────
  const frequencies = computeSkillFrequencies(allExtractions, ALL_POSTINGS.length);
  const requirements = buildRoleRequirements(frequencies, ROLE_NAME, ALL_POSTINGS.length, skillIdMap);

  const insertRequirement = db.prepare(
    `INSERT INTO role_requirements (role_name, skill_id, frequency, weight, total_postings)
     VALUES (?, ?, ?, ?, ?)`
  );

  const aggregationTx = db.transaction(() => {
    for (const req of requirements) {
      insertRequirement.run(
        req.roleName,
        req.skillId,
        req.frequency,
        req.weight,
        req.totalPostings
      );
    }
  });
  aggregationTx();
  console.log(`  ✓  Aggregated ${requirements.length} role requirements for "${ROLE_NAME}"`);

  // ── 7. Data provenance check ───────────────────────────
  const invalidLabels = db.prepare(
    `SELECT COUNT(*) as cnt FROM job_postings WHERE source_label NOT IN ('real', 'sample') OR source_label IS NULL`
  ).get() as { cnt: number };

  if (invalidLabels.cnt > 0) {
    console.error(`  ✗  PROVENANCE FAILURE: ${invalidLabels.cnt} postings have invalid/missing source_label`);
    process.exit(1);
  }
  console.log('  ✓  Provenance check passed: all postings have valid source_label');

  // ── 8. Summary report ──────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  ROLE REQUIREMENTS — Top 15 Skills for "Junior Data Analyst"');
  console.log('═'.repeat(60));
  console.log(
    '  ' +
    'Rank'.padEnd(6) +
    'Skill'.padEnd(25) +
    'Frequency'.padEnd(12) +
    'Weight'
  );
  console.log('  ' + '─'.repeat(50));

  const top15 = requirements.slice(0, 15);
  for (let i = 0; i < top15.length; i++) {
    const r = top15[i];
    console.log(
      '  ' +
      `#${i + 1}`.padEnd(6) +
      r.skillName.padEnd(25) +
      `${r.frequency}/${r.totalPostings}`.padEnd(12) +
      `${(r.weight * 100).toFixed(1)}%`
    );
  }

  console.log('\n  Dataset provenance:');
  console.log(`    Real postings:   ${realCount}`);
  console.log(`    Sample postings: ${sampleCount}`);
  console.log(`    Total:           ${ALL_POSTINGS.length}`);

  // Source breakdown
  const sourceBreakdown = new Map<string, number>();
  for (const p of ALL_POSTINGS) {
    sourceBreakdown.set(p.source_name, (sourceBreakdown.get(p.source_name) ?? 0) + 1);
  }
  console.log('\n  Source breakdown:');
  for (const [source, count] of sourceBreakdown) {
    console.log(`    ${source}: ${count}`);
  }

  console.log('\n═'.repeat(60));
  console.log('  Seed complete. Database ready at:');
  console.log(`  ${dbPath}`);
  console.log('═'.repeat(60) + '\n');

  db.close();
}

main();
