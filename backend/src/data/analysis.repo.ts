import Database from 'better-sqlite3';
import { getDatabase } from '../db/connection';

export interface SaveAnalysisParams {
  studentId: number;
  roleName: string;
  readinessScore: number;
  gaps: { skillId: number; gapWeight: number; priorityRank: number }[];
  roadmap: { skillId: number; sequenceOrder: number; title: string; description: string; estimatedHours: number }[];
}

export class AnalysisRepository {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db || getDatabase();
  }

  saveAnalysis(params: SaveAnalysisParams): number {
    let analysisId: number;

    const tx = this.db.transaction(() => {
      // 1. Insert Analysis record
      const insertAnalysis = this.db.prepare(
        `INSERT INTO analyses (student_id, role_name, readiness_score) VALUES (?, ?, ?)`
      );
      const res = insertAnalysis.run(params.studentId, params.roleName, params.readinessScore);
      analysisId = Number(res.lastInsertRowid);

      // 2. Insert Gaps
      const insertGap = this.db.prepare(
        `INSERT INTO analysis_gaps (analysis_id, skill_id, gap_weight, priority_rank)
         VALUES (?, ?, ?, ?)`
      );
      for (const gap of params.gaps) {
        insertGap.run(analysisId, gap.skillId, gap.gapWeight, gap.priorityRank);
      }

      // 3. Insert Roadmap Items
      const insertRoadmap = this.db.prepare(
        `INSERT INTO roadmap_items (analysis_id, skill_id, sequence_order, title, description, estimated_hours)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      for (const item of params.roadmap) {
        insertRoadmap.run(analysisId, item.skillId, item.sequenceOrder, item.title, item.description, item.estimatedHours);
      }
    });

    tx();
    return analysisId!;
  }
  
  getAnalysisDetails(analysisId: number) {
    const analysis = this.db.prepare(`SELECT * FROM analyses WHERE id = ?`).get(analysisId) as any;
    if (!analysis) return null;
    
    const gaps = this.db.prepare(`
      SELECT g.*, s.name as skillName 
      FROM analysis_gaps g
      JOIN skills s ON g.skill_id = s.id
      WHERE g.analysis_id = ? ORDER BY g.priority_rank ASC
    `).all(analysisId);
    
    const roadmap = this.db.prepare(`
      SELECT r.*, s.name as skillName 
      FROM roadmap_items r
      JOIN skills s ON r.skill_id = s.id
      WHERE r.analysis_id = ? ORDER BY r.sequence_order ASC
    `).all(analysisId);
    
    return { ...analysis, gaps, roadmap };
  }
}
