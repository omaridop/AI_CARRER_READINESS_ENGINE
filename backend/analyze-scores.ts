import { RolesRepository } from './src/data/roles.repo';
import { AnalysisService } from './src/services/analysis.service';
import { ProfileRepository } from './src/data/profile.repo';
import { AnalysisRepository } from './src/data/analysis.repo';
import { RoadmapService } from './src/services/roadmap.service';

const rolesRepo = new RolesRepository();
const profileRepo = new ProfileRepository();
const analysisRepo = new AnalysisRepository();
const roadmapService = new RoadmapService(rolesRepo);
const analysisService = new AnalysisService(rolesRepo, profileRepo, analysisRepo, roadmapService);

function analyze() {
  const roleName = 'Junior Data Analyst';
  const reqs = rolesRepo.getRoleRequirements(roleName);
  
  console.log(`\n=== 1. FULL ROLE REQUIREMENTS FOR: ${roleName} ===`);
  const sortedReqs = [...reqs].sort((a, b) => b.weight - a.weight);
  sortedReqs.forEach((r, i) => {
    console.log(`${i+1}. ${r.skillName} (ID: ${r.skill_id}): Weight ${(r.weight * 100).toFixed(1)}%`);
  });

  const totalWeight = sortedReqs.reduce((sum, r) => sum + r.weight, 0);
  console.log(`\nTotal Maximum Weight: ${(totalWeight * 100).toFixed(1)}% (If a user had all skills with max credit)`);

  console.log(`\n=== 2. STRONG PROFILE BREAKDOWN ===`);
  const strongProfile = [
    { skillId: 1, proficiency: 'advanced', evidenceType: 'project' }, // SQL
    { skillId: 2, proficiency: 'advanced', evidenceType: 'certificate' }, // Python
    { skillId: 7, proficiency: 'advanced', evidenceType: 'project' }, // Excel
    { skillId: 8, proficiency: 'intermediate', evidenceType: 'course' }, // Tableau
    { skillId: 14, proficiency: 'intermediate', evidenceType: 'project' }, // Data Cleaning
    { skillId: 20, proficiency: 'advanced', evidenceType: 'course' }, // Reporting
    { skillId: 28, proficiency: 'advanced', evidenceType: 'self_declared' }, // Communication
  ];
  
  // Note: Need to mock the DB insertion for ProfileRepo
  const studentId = 999;
  
  // Create evidence map directly
  const evidenceMap = new Map<number, string>();
  strongProfile.forEach(s => evidenceMap.set(s.skillId, s.evidenceType));

  const CREDIT_MULTIPLIER: Record<string, number> = {
    'course': 1.0,
    'project': 1.0,
    'certificate': 1.0,
    'self_declared': 0.5
  };

  let studentScore = 0;
  let maxScore = 0;
  
  sortedReqs.forEach(req => {
    maxScore += req.weight;
    const ev = evidenceMap.get(req.skill_id);
    const credit = ev ? CREDIT_MULTIPLIER[ev] : 0;
    const gained = req.weight * credit;
    const missed = req.weight - gained;
    studentScore += gained;
    
    let status = 'MISSED';
    if (credit === 1.0) status = 'MET';
    else if (credit > 0) status = 'PARTIAL';
    
    console.log(`- ${req.skillName.padEnd(25)} | Weight: ${(req.weight*100).toFixed(1)}% | Status: ${status.padEnd(7)} | Gained: ${(gained*100).toFixed(1)}% | Missed: ${(missed*100).toFixed(1)}%`);
  });
  
  console.log(`\nStrong Profile Final Score: ${((studentScore / maxScore) * 100).toFixed(1)}%`);

  console.log(`\n=== 4. GENUINELY READY PROFILE BREAKDOWN ===`);
  // Top 10 skills based on weights
  const top10 = sortedReqs.slice(0, 10);
  let readyScore = 0;
  top10.forEach(req => {
    readyScore += req.weight * 1.0; // max credit
  });
  
  console.log(`Top 10 skills (100% credit): ${top10.map(r => r.skillName).join(', ')}`);
  console.log(`Genuinely Ready Final Score: ${((readyScore / maxScore) * 100).toFixed(1)}%`);
}

analyze();
