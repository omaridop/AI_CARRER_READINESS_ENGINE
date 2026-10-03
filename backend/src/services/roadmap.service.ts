import { RolesRepository } from '../data/roles.repo';

export interface RoadmapItemDto {
  skillId: number;
  skillName: string;
  sequenceOrder: number;
  title: string;
  description: string;
  assessmentIdea: string;
  estimatedHours: number;
}

const CATEGORY_ORDER: Record<string, number> = {
  programming: 1,
  data: 2,
  analytics: 3,
  statistics: 4,
  tools: 5,
  soft_skill: 6
};

export class RoadmapService {
  constructor(private rolesRepo: RolesRepository) {}

  public generateRoadmap(gaps: { skillId: number, gapWeight: number }[], topN: number = 3): RoadmapItemDto[] {
    // Take the most critical gaps
    const topGaps = [...gaps].sort((a, b) => b.gapWeight - a.gapWeight).slice(0, topN);

    // Get skill details to know categories
    const enrichedGaps = topGaps.map(gap => {
      const skill = this.rolesRepo.getSkill(gap.skillId) as any;
      return {
        ...gap,
        skillName: skill.name,
        category: skill.category
      };
    });

    // Sequence them by prerequisite category order
    enrichedGaps.sort((a, b) => {
      const orderA = CATEGORY_ORDER[a.category] || 99;
      const orderB = CATEGORY_ORDER[b.category] || 99;
      if (orderA !== orderB) return orderA - orderB;
      // Tie-break by gap weight descending
      return b.gapWeight - a.gapWeight;
    });

    // Generate static content
    return enrichedGaps.map((gap, index) => {
      const isTechnical = gap.category === 'programming' || gap.category === 'data' || gap.category === 'analytics';
      
      return {
        skillId: gap.skillId,
        skillName: gap.skillName,
        sequenceOrder: index + 1,
        title: `Master ${gap.skillName}`,
        description: `This skill has a gap weight of ${Math.round(gap.gapWeight * 100)}% based on market demand. Focusing on ${gap.skillName} will significantly improve your readiness for the Junior Data Analyst role.`,
        assessmentIdea: isTechnical 
          ? `Complete a hands-on project utilizing ${gap.skillName} and upload it to your portfolio.`
          : `Prepare a mock presentation or write a case study demonstrating your ${gap.skillName} skills.`,
        estimatedHours: isTechnical ? 20 : 10
      };
    });
  }
}
