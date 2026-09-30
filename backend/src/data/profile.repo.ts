import Database from 'better-sqlite3';
import { getDatabase } from '../db/connection';

export interface SaveProfileParams {
  name: string;
  email?: string;
  skills: {
    skillId: number;
    proficiency: string;
    evidenceType: string;
    evidenceDetail?: string;
  }[];
}

export class ProfileRepository {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  saveProfile(params: SaveProfileParams): number {
    let studentId: number;
    
    const tx = this.db.transaction(() => {
      // 1. Insert Student
      const insertStudent = this.db.prepare(
        `INSERT INTO students (name, email) VALUES (?, ?)`
      );
      const res = insertStudent.run(params.name, params.email || null);
      studentId = Number(res.lastInsertRowid);

      // 2. Insert Evidence
      const insertEvidence = this.db.prepare(
        `INSERT INTO student_evidence (student_id, skill_id, proficiency, evidence_type, evidence_detail)
         VALUES (?, ?, ?, ?, ?)`
      );

      for (const skill of params.skills) {
        insertEvidence.run(
          studentId,
          skill.skillId,
          skill.proficiency,
          skill.evidenceType,
          skill.evidenceDetail || null
        );
      }
    });
    
    tx();
    return studentId!;
  }
  
  getStudentEvidence(studentId: number) {
    const stmt = this.db.prepare(`
      SELECT se.*, s.name as skillName 
      FROM student_evidence se
      JOIN skills s ON se.skill_id = s.id
      WHERE se.student_id = ?
    `);
    return stmt.all(studentId) as any[];
  }
}
