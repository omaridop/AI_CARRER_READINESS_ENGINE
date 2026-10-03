/**
 * Database schema DDL for SkillBridge.
 *
 * Creates all tables needed for the full MVP. Tables used only in later
 * phases are created here to avoid schema migrations, but contain no
 * data until those phases are implemented.
 *
 * Phase A tables (populated by seed script):
 *   - skills, job_postings, posting_skills, role_requirements
 *
 * Phase B+ tables (created now, unused until later):
 *   - students, student_evidence, analyses, analysis_gaps, roadmap_items
 */

import Database from 'better-sqlite3';

export function createSchema(db: Database.Database): void {
  db.exec(`
    -- =============================================
    -- Phase A: Market Requirements Pipeline
    -- =============================================

    -- Canonical skills taxonomy with aliases
    CREATE TABLE IF NOT EXISTS skills (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT    NOT NULL UNIQUE,
      category  TEXT    NOT NULL,
      aliases   TEXT    NOT NULL DEFAULT '[]'
    );

    -- Job postings dataset
    CREATE TABLE IF NOT EXISTS job_postings (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT NOT NULL,
      company       TEXT,
      location      TEXT,
      source_label  TEXT NOT NULL CHECK(source_label IN ('real', 'sample')),
      source_name   TEXT NOT NULL,
      description   TEXT NOT NULL,
      date_posted   TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Join table: skills extracted from each posting
    CREATE TABLE IF NOT EXISTS posting_skills (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      posting_id  INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
      skill_id    INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(posting_id, skill_id)
    );

    -- Aggregated requirements for "Junior Data Analyst"
    CREATE TABLE IF NOT EXISTS role_requirements (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name       TEXT    NOT NULL DEFAULT 'Junior Data Analyst',
      skill_id        INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      frequency       INTEGER NOT NULL,
      weight          REAL    NOT NULL,
      total_postings  INTEGER NOT NULL,
      UNIQUE(role_name, skill_id)
    );

    -- =============================================
    -- Phase B+: Student / Analysis / Roadmap
    -- (tables created now, NO data or logic yet)
    -- =============================================

    CREATE TABLE IF NOT EXISTS students (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      email       TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_evidence (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      skill_id        INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      proficiency     TEXT NOT NULL CHECK(proficiency IN ('beginner', 'intermediate', 'advanced')),
      evidence_type   TEXT,
      evidence_detail TEXT,
      UNIQUE(student_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS analyses (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id      INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      role_name       TEXT NOT NULL DEFAULT 'Junior Data Analyst',
      readiness_score REAL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analysis_gaps (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id   INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
      skill_id      INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      gap_weight    REAL    NOT NULL,
      priority_rank INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roadmap_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      analysis_id     INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
      skill_id        INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      sequence_order  INTEGER NOT NULL,
      title           TEXT NOT NULL,
      description     TEXT,
      estimated_hours INTEGER
    );

    -- =============================================
    -- Indexes for common query patterns
    -- =============================================

    CREATE INDEX IF NOT EXISTS idx_posting_skills_posting
      ON posting_skills(posting_id);
    CREATE INDEX IF NOT EXISTS idx_posting_skills_skill
      ON posting_skills(skill_id);
    CREATE INDEX IF NOT EXISTS idx_role_requirements_role
      ON role_requirements(role_name);
    CREATE INDEX IF NOT EXISTS idx_student_evidence_student
      ON student_evidence(student_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_gaps_analysis
      ON analysis_gaps(analysis_id);
    CREATE INDEX IF NOT EXISTS idx_roadmap_items_analysis
      ON roadmap_items(analysis_id);
  `);
}
