import Database from 'better-sqlite3';
import { getDatabase } from '../db/connection';
import { RoleRequirementRow } from '../types';

export class RolesRepository {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  getRoleRequirements(roleName: string) {
    const stmt = this.db.prepare(`
      SELECT r.*, s.name as skillName, s.category as skillCategory
      FROM role_requirements r
      JOIN skills s ON r.skill_id = s.id
      WHERE r.role_name = ?
      ORDER BY r.weight DESC
    `);
    return stmt.all(roleName) as (RoleRequirementRow & { skillName: string; skillCategory: string })[];
  }
  
  getSkill(skillId: number) {
    return this.db.prepare(`SELECT * FROM skills WHERE id = ?`).get(skillId);
  }
}
