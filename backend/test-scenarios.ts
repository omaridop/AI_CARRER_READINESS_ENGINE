

async function runScenario(name: string, skills: any[]) {
  console.log(`\n--- Scenario: ${name} ---`);
  
  const profileRes = await fetch('http://localhost:3001/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, skills })
  });
  const profileData = await profileRes.json();
  const studentId = profileData.data.studentId;

  const analysisRes = await fetch('http://localhost:3001/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, roleName: 'Junior Data Analyst' })
  });
  const analysisData = await analysisRes.json();
  
  if (analysisData.error) {
    console.error("Error:", analysisData.error);
    return;
  }
  
  const result = analysisData.data;
  console.log(`Readiness Score: ${result.readinessScore.toFixed(1)}%`);
  console.log(`Gaps (${result.gaps.length}):`, result.gaps.map((g:any) => g.skillName).join(', '));
  console.log(`Roadmap (${result.roadmap.length} steps):`, result.roadmap.map((r:any) => r.skillName).join(' -> '));
}

async function main() {
  // Scenario A: Strong Profile
  await runScenario('Strong Profile', [
    { skillId: 1, proficiency: 'advanced', evidenceType: 'project' }, // SQL
    { skillId: 2, proficiency: 'advanced', evidenceType: 'certificate' }, // Python
    { skillId: 7, proficiency: 'advanced', evidenceType: 'project' }, // Excel
    { skillId: 8, proficiency: 'intermediate', evidenceType: 'course' }, // Tableau
    { skillId: 14, proficiency: 'intermediate', evidenceType: 'project' }, // Data Cleaning
    { skillId: 20, proficiency: 'advanced', evidenceType: 'course' }, // Statistics
    { skillId: 26, proficiency: 'advanced', evidenceType: 'self_declared' }, // Communication
  ]);

  // Scenario B: Average Profile
  await runScenario('Average Profile', [
    { skillId: 1, proficiency: 'beginner', evidenceType: 'course' }, // SQL
    { skillId: 7, proficiency: 'intermediate', evidenceType: 'self_declared' }, // Excel
    { skillId: 26, proficiency: 'beginner', evidenceType: 'self_declared' }, // Communication
  ]);

  // Scenario C: Missing Major Skills
  await runScenario('Missing Major Skills', [
    { skillId: 20, proficiency: 'intermediate', evidenceType: 'course' }, // Statistics
    { skillId: 26, proficiency: 'advanced', evidenceType: 'project' }, // Communication
    { skillId: 27, proficiency: 'advanced', evidenceType: 'project' }, // Problem Solving
  ]);

  // Scenario D: Unusual Combination (All Self-Declared, Non-Core)
  await runScenario('Unusual Combination', [
    { skillId: 4, proficiency: 'beginner', evidenceType: 'self_declared' }, // VBA
    { skillId: 13, proficiency: 'beginner', evidenceType: 'self_declared' }, // SPSS
    { skillId: 24, proficiency: 'beginner', evidenceType: 'self_declared' }, // Google Analytics
  ]);

  // Scenario E: Top 10 Core Skills (Full Evidence)
  await runScenario('Top 10 Core', [
    { skillId: 1, proficiency: 'advanced', evidenceType: 'project' }, // SQL
    { skillId: 7, proficiency: 'advanced', evidenceType: 'project' }, // Excel
    { skillId: 9, proficiency: 'advanced', evidenceType: 'project' }, // Power BI
    { skillId: 20, proficiency: 'advanced', evidenceType: 'project' }, // Reporting
    { skillId: 8, proficiency: 'advanced', evidenceType: 'project' }, // Tableau
    { skillId: 28, proficiency: 'advanced', evidenceType: 'project' }, // Communication
    { skillId: 2, proficiency: 'advanced', evidenceType: 'project' }, // Python
    { skillId: 29, proficiency: 'advanced', evidenceType: 'project' }, // Problem Solving
    { skillId: 21, proficiency: 'advanced', evidenceType: 'project' }, // Statistics
    { skillId: 31, proficiency: 'advanced', evidenceType: 'project' }, // Attention to Detail
  ]);

  // Scenario F: All 13 Core Skills (Full Evidence)
  await runScenario('All 13 Core', [
    { skillId: 1, proficiency: 'advanced', evidenceType: 'project' }, // SQL
    { skillId: 7, proficiency: 'advanced', evidenceType: 'project' }, // Excel
    { skillId: 9, proficiency: 'advanced', evidenceType: 'project' }, // Power BI
    { skillId: 20, proficiency: 'advanced', evidenceType: 'project' }, // Reporting
    { skillId: 8, proficiency: 'advanced', evidenceType: 'project' }, // Tableau
    { skillId: 28, proficiency: 'advanced', evidenceType: 'project' }, // Communication
    { skillId: 2, proficiency: 'advanced', evidenceType: 'project' }, // Python
    { skillId: 29, proficiency: 'advanced', evidenceType: 'project' }, // Problem Solving
    { skillId: 21, proficiency: 'advanced', evidenceType: 'project' }, // Statistics
    { skillId: 31, proficiency: 'advanced', evidenceType: 'project' }, // Attention to Detail
    { skillId: 14, proficiency: 'advanced', evidenceType: 'project' }, // Data Cleaning
    { skillId: 19, proficiency: 'advanced', evidenceType: 'project' }, // Data Analysis
    { skillId: 15, proficiency: 'advanced', evidenceType: 'project' }, // Data Visualization
  ]);
}

main().catch(console.error);
