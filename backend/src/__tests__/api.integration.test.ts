import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../app';
import { Server } from 'http';
import type { AnalysisService } from '../services/analysis.service';

type ErrorBody = { data: null; error: { message: string } };
type DataBody<T> = { data: T; error: null };

// We run the Express app on a dynamic port for integration tests
let server: Server;
let baseUrl: string;

describe('API Integration', () => {
  before(async () => {
    // We are trusting that the Seed script created the DB for standard operations,
    // but we can just use the running DB or start the app.
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}/api`;
        resolve(undefined);
      });
    });
    
  });

  after(() => {
    server.close();
  });

  it('POST /analysis returns 404 for unknown role', async () => {
    const res = await fetch(`${baseUrl}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 1, roleName: 'Astronaut' })
    });
    assert.strictEqual(res.status, 404);
    const json = await res.json() as ErrorBody;
    assert.match(json.error.message, /Role not found/);
  });

  it('GET /roles/:id/requirements returns 404 for unknown role', async () => {
    const res = await fetch(`${baseUrl}/roles/UnknownRole/requirements`);
    assert.equal(res.status, 404);
    
    const body = await res.json() as ErrorBody;
    assert.equal(body.data, null);
    assert.ok(body.error.message.includes('No requirements found'));
  });

  it('POST /profile validates input shape', async () => {
    const res = await fetch(`${baseUrl}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' }) // missing skills array
    });
    
    assert.equal(res.status, 400);
    const body = await res.json() as ErrorBody;
    assert.equal(body.data, null);
    assert.ok(body.error.message.includes('skills (must be an array)'));
  });

  it('End-to-End: POST /profile -> POST /analysis', async () => {
    // 1. We must rely on the seeded DB having "Junior Data Analyst" role and skills.
    // If the seed hasn't run, this will fail. Assuming seed is run.
    
    // First let's get the skills from the real role to submit valid IDs
    const reqsRes = await fetch(`${baseUrl}/roles/Junior%20Data%20Analyst/requirements`);
    
    assert.equal(reqsRes.status, 200, 'Integration test requires the seeded verification database');
    
    const reqsBody = await reqsRes.json() as DataBody<{ skill_id: number }[]>;
    const skills = reqsBody.data;
    
    // Pick the top skill and give it full credit
    const topSkillId = skills[0].skill_id;

    // 2. Create Profile
    const profileRes = await fetch(`${baseUrl}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Integration Test Student',
        email: 'test@example.com',
        skills: [
          { skillId: topSkillId, proficiency: 'advanced', evidenceType: 'certificate' }
        ]
      })
    });

    assert.equal(profileRes.status, 201);
    const profileBody = await profileRes.json() as DataBody<{ studentId: number }>;
    assert.ok(profileBody.data.studentId > 0);
    const studentId = profileBody.data.studentId;

    // 3. Run Analysis
    const analysisRes = await fetch(`${baseUrl}/analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        roleName: 'Junior Data Analyst'
      })
    });

    assert.equal(analysisRes.status, 201);
    const analysisBody = await analysisRes.json() as DataBody<ReturnType<AnalysisService['runAnalysis']>>;
    
    assert.equal(analysisBody.error, null);
    assert.ok(analysisBody.data.analysisId > 0);
    
    // They should have some readiness score > 0 because they have the top skill
    assert.ok(analysisBody.data.readinessScore > 0);
    
    // They should have gaps because they only have 1 skill
    assert.ok(analysisBody.data.gaps.length > 0);
    
    // They should have a roadmap
    assert.ok(analysisBody.data.roadmap.length > 0);
  });
});
