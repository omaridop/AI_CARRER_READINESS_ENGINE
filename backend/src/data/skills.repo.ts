import Database from 'better-sqlite3';
import { getDatabase } from '../db/connection';

export class SkillsRepository {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  getAllSkills() {
    const stmt = this.db.prepare(`
      SELECT id, name, category, aliases
      FROM skills
      ORDER BY id ASC
    `);
    
    return stmt.all().map((row: any) => ({
      ...row,
      aliases: JSON.parse(row.aliases)
    }));
  }
}
