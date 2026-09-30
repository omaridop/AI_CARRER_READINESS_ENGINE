/**
 * SQLite connection factory.
 * Returns a better-sqlite3 Database instance pointed at the project's
 * local data file.  The DB path defaults to `backend/data/skillbridge.db`
 * but can be overridden via the SKILLBRIDGE_DB_PATH env var (useful for
 * tests that want an in-memory or temp database).
 */

import Database from 'better-sqlite3';
import path from 'path';

const DEFAULT_DB_PATH = path.resolve(__dirname, '../../data/skillbridge.db');

export function getDatabase(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? process.env.SKILLBRIDGE_DB_PATH ?? DEFAULT_DB_PATH;
  const db = new Database(resolvedPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  // Enable foreign key enforcement
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Get an in-memory database (for testing).
 */
export function getMemoryDatabase(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  return db;
}
