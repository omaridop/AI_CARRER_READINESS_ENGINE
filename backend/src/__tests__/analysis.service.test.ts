import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AnalysisService } from '../services/analysis.service';
import { RoadmapService } from '../services/roadmap.service';

describe('AnalysisService Formula', () => {
  it('computes readiness score exactly according to the core threshold formula', () => {
    // Mock repositories
    const mockRolesRepo: any = {
      getRoleRequirements: () => {
        return [
          { skill_id: 1, skillName: 'SQL', weight: 0.4 }, // Core
          { skill_id: 2, skillName: 'Python', weight: 0.4 }, // Core
          { skill_id: 3, skillName: 'Excel', weight: 0.2 }, // Core
          { skill_id: 4, skillName: 'NicheTool', weight: 0.1 }, // Supplementary
        ];
      },
      getSkill: (skillId: number) => {
        if (skillId === 1) return { name: 'SQL', category: 'programming' };
        if (skillId === 2) return { name: 'Python', category: 'programming' };
        if (skillId === 3) return { name: 'Excel', category: 'analytics' };
        if (skillId === 4) return { name: 'NicheTool', category: 'tools' };
        return { name: 'Unknown', category: 'tools' };
      }
    };

    const mockProfileRepo: any = {
      getStudentEvidence: () => {
        return [
          { skill_id: 1, evidence_type: 'course' },       // 1.0 credit (weight 0.4)
          { skill_id: 3, evidence_type: 'self_declared' }, // 0.5 credit (weight 0.2)
          { skill_id: 4, evidence_type: 'project' }       // 1.0 credit (weight 0.1, supplementary bonus)
          // Missing Python completely
        ];
      }
    };

    const mockAnalysisRepo: any = {
      saveAnalysis: () => 1
    };

    const roadmapService = new RoadmapService(mockRolesRepo);
    const analysisService = new AnalysisService(mockRolesRepo, mockProfileRepo, mockAnalysisRepo, roadmapService);

    const result = analysisService.runAnalysis(999, 'Test Role');

    // Expected Math:
    // Core Threshold = 0.15
    // Max Core Score = 0.4 + 0.4 + 0.2 = 1.0 (NicheTool is 0.1 so it's excluded from denominator)
    // Student Score:
    // SQL: 0.4 * 1.0 = 0.4
    // Python: 0.4 * 0.0 = 0.0
    // Excel: 0.2 * 0.5 = 0.1
    // NicheTool: 0.1 * 1.0 = 0.1 (bonus!)
    // Total Student = 0.6
    // Readiness = (0.6 / 1.0) * 100 = 60.0%
    assert.equal(result.readinessScore, 60.0);

    // Gaps Math: ALL skills are included in gaps calculation
    // Python gap = 0.4 * 1.0 = 0.4
    // Excel gap = 0.2 * 0.5 = 0.1
    // Top gaps descending: Python (0.4), Excel (0.1)
    assert.equal(result.gaps.length, 2);
    assert.equal(result.gaps[0].skillName, 'Python');
    assert.equal(result.gaps[0].gapWeight, 0.4);
    assert.equal(result.gaps[1].skillName, 'Excel');
    assert.equal(result.gaps[1].gapWeight, 0.1);
  });

  it('caps the readiness score at 100% for a full-evidence top-core-skills profile', () => {
    // Mock repositories
    const mockRolesRepo: any = {
      getRoleRequirements: () => {
        return [
          { skill_id: 1, skillName: 'Core1', weight: 0.5 }, // Core
          { skill_id: 2, skillName: 'Core2', weight: 0.5 }, // Core
          { skill_id: 3, skillName: 'Supp1', weight: 0.1 }, // Supplementary
        ];
      },
      getSkill: () => {
        return { name: 'Mock', category: 'tools' };
      }
    };

    const mockProfileRepo: any = {
      getStudentEvidence: () => {
        return [
          { skill_id: 1, evidence_type: 'course' },       // 1.0 credit (weight 0.5)
          { skill_id: 2, evidence_type: 'course' },       // 1.0 credit (weight 0.5)
          { skill_id: 3, evidence_type: 'course' },       // 1.0 credit (weight 0.1)
        ];
      }
    };

    const mockAnalysisRepo: any = {
      saveAnalysis: () => 1
    };

    const roadmapService = new RoadmapService(mockRolesRepo);
    const analysisService = new AnalysisService(mockRolesRepo, mockProfileRepo, mockAnalysisRepo, roadmapService);

    const result = analysisService.runAnalysis(999, 'Test Role');

    // Expected Math:
    // Max Core = 0.5 + 0.5 = 1.0
    // Student Score = 0.5 + 0.5 + 0.1 = 1.1
    // Readiness = min(100.0, 1.1 / 1.0 * 100) = 100.0%
    assert.equal(result.readinessScore, 100.0);
    assert.equal(result.gaps.length, 0);
  });
});
