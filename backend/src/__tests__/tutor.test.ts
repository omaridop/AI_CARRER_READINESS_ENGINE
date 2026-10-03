import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { validateTutorResponse, TutorResponse, VALID_STYLES } from '../ai/schema-validator';
import { getFallback } from '../ai/fallback-explanations';
import { TutorService } from '../services/tutor.service';
import * as anthropicClient from '../ai/anthropic-client';
import { app } from '../app';
import { Server } from 'http';

// We run the Express app on a dynamic port for integration tests
let server: Server;
let baseUrl: string;

describe('Phase C: Adaptive Tutor Tests', () => {
  
  before(async () => {
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
    // Restore the env var in case a test modified it
    anthropicClient.resetClient();
  });

  describe('1. Schema Validation', () => {
    it('accepts valid JSON matching the schema', () => {
      const raw = JSON.stringify({
        skill: "SQL",
        style: "simple",
        explanation_text: "This is a valid explanation text that is definitely longer than 50 characters, as required by the schema validator logic.",
        example: "SELECT * FROM table;",
        notes: null
      });
      const result = validateTutorResponse(raw);
      assert.ok(result);
      assert.equal(result.skill, "SQL");
      assert.equal(result.style, "simple");
      assert.equal(result.example, "SELECT * FROM table;");
    });

    it('rejects JSON with missing required fields', () => {
      const raw = JSON.stringify({
        skill: "SQL",
        // missing style
        explanation_text: "This is a valid explanation text that is definitely longer than 50 characters, as required by the schema validator logic."
      });
      const result = validateTutorResponse(raw);
      assert.equal(result, null);
    });

    it('rejects JSON with explanation_text < 50 chars', () => {
      const raw = JSON.stringify({
        skill: "SQL",
        style: "simple",
        explanation_text: "Too short."
      });
      const result = validateTutorResponse(raw);
      assert.equal(result, null);
    });

    it('handles malformed JSON (not parsable)', () => {
      const raw = "This is just plain text, not JSON.";
      const result = validateTutorResponse(raw);
      assert.equal(result, null);
    });

    it('successfully parses JSON enclosed in markdown fences (simulating LLM output)', () => {
      const raw = "```json\n" + JSON.stringify({
        skill: "SQL",
        style: "simple",
        explanation_text: "This is a valid explanation text that is definitely longer than 50 characters, as required by the schema validator logic.",
        example: "SELECT * FROM table;",
        notes: null
      }, null, 2) + "\n```";
      const result = validateTutorResponse(raw);
      assert.ok(result);
      assert.equal(result.skill, "SQL");
      assert.equal(result.style, "simple");
    });
  });

  describe('2. Fallback Mechanism', () => {
    it('provides fallback content for top 9 curated skills across all 5 styles', () => {
      const topSkills = ['SQL', 'Excel', 'Power BI', 'Tableau', 'Python', 'Reporting', 'Communication', 'Statistics', 'Data Cleaning'];
      for (const skill of topSkills) {
        for (const style of VALID_STYLES) {
          const fallback = getFallback(skill, style);
          assert.equal(fallback.skill, skill);
          assert.equal(fallback.style, style);
          assert.ok(fallback.explanation_text.length >= 50);
        }
      }
    });

    it('provides a generic fallback for unknown skills', () => {
      const fallback = getFallback('UnknownSkill', 'simple');
      assert.equal(fallback.skill, 'UnknownSkill');
      assert.equal(fallback.style, 'simple');
      assert.ok(fallback.explanation_text.includes('UnknownSkill'));
    });
  });

  describe('3. TutorService Orchestration', () => {
    it('falls back seamlessly when ANTHROPIC_API_KEY is not set', async () => {
      // Temporarily remove API key
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      anthropicClient.resetClient();

      const service = new TutorService();
      const result = await service.explain('SQL', 'simple');
      
      // Should return the fallback without crashing
      assert.equal(result.source, 'fallback');
      assert.equal(result.skill, 'SQL');
      
      // Restore key
      if (originalKey) process.env.ANTHROPIC_API_KEY = originalKey;
      anthropicClient.resetClient();
    });

  });

  describe('4. API Endpoint Integration', () => {
    it('POST /tutor/explain rejects missing skillName', async () => {
      const res = await fetch(`${baseUrl}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style: 'simple' })
      });
      assert.equal(res.status, 400);
    });

    it('POST /tutor/explain rejects invalid style', async () => {
      const res = await fetch(`${baseUrl}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: 'SQL', style: 'not_a_real_style' })
      });
      assert.equal(res.status, 400);
    });

    it('POST /tutor/explain returns explanation for valid request (fallback path expected locally without key)', async () => {
      const res = await fetch(`${baseUrl}/tutor/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: 'SQL', style: 'visual', evidenceLevel: 'course' })
      });
      
      assert.equal(res.status, 200);
      const body = await res.json() as { data: TutorResponse & { source: 'ai' | 'fallback' }; error: null };
      assert.equal(body.error, null);
      
      const data = body.data;
      assert.equal(data.skill, 'SQL');
      assert.equal(data.style, 'visual');
      assert.ok(data.explanation_text.length >= 50);
      
      // Will be 'fallback' unless a valid ANTHROPIC_API_KEY is active during test
      assert.ok(['ai', 'fallback'].includes(data.source));
    });
  });
});
