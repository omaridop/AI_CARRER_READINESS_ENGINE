import { RolesRepository } from '../data/roles.repo';
import { ProfileRepository } from '../data/profile.repo';
import { AnalysisRepository } from '../data/analysis.repo';
import { RoadmapService } from './roadmap.service';

const CREDIT_MULTIPLIER: Record<string, number> = {
  'course': 1.0,
  'project': 1.0,
  'certificate': 1.0,
  'self_declared': 0.5
};

export class AnalysisService {
  constructor(
    private rolesRepo: RolesRepository,
    private profileRepo: ProfileRepository,
    private analysisRepo: AnalysisRepository,
    private roadmapService: RoadmapService
  ) {}

  public runAnalysis(studentId: number, roleName: string) {
    const requirements = this.rolesRepo.getRoleRequirements(roleName);
    if (!requirements || requirements.length === 0) {
      throw new Error(`Role not found or has no requirements: ${roleName}`);
    }

    const evidenceList = this.profileRepo.getStudentEvidence(studentId);
    const evidenceMap = new Map<number, string>();
    for (const ev of evidenceList) {
      evidenceMap.set(ev.skill_id, ev.evidence_type);
    }

    let studentScore = 0;
    let maxCoreScore = 0;
    const CORE_THRESHOLD = 0.15;
    const gaps: { skillId: number, skillName: string, gapWeight: number }[] = [];

    // Calculate Readiness and Gaps
    for (const req of requirements) {
      const weight = req.weight;
      if (weight >= CORE_THRESHOLD) {
        maxCoreScore += weight;
      }

      const evidenceType = evidenceMap.get(req.skill_id);
      const credit = evidenceType ? (CREDIT_MULTIPLIER[evidenceType] || 0) : 0;
      
      studentScore += (weight * credit);

      const gapWeight = weight * (1.0 - credit);
      if (gapWeight > 0) {
        gaps.push({ skillId: req.skill_id, skillName: req.skillName, gapWeight });
      }
    }

    // Formula: (studentScore / maxCoreScore) * 100
    // Rounded to 1 decimal place, capped at 100%
    let rawReadiness = maxCoreScore > 0 ? (studentScore / maxCoreScore) * 100 : 0;
    rawReadiness = Math.min(100.0, rawReadiness);
    const readinessScore = Math.round(rawReadiness * 10) / 10;

    // Rank Gaps
    gaps.sort((a, b) => b.gapWeight - a.gapWeight);
    const rankedGaps = gaps.map((g, idx) => ({ ...g, priorityRank: idx + 1 }));

    // Generate Roadmap
    const roadmapItems = this.roadmapService.generateRoadmap(gaps, 3);

    // Persist
    const analysisId = this.analysisRepo.saveAnalysis({
      studentId,
      roleName,
      readinessScore,
      gaps: rankedGaps,
      roadmap: roadmapItems
    });

    return {
      analysisId,
      readinessScore,
      gaps: rankedGaps,
      roadmap: roadmapItems
    };
  }
}
