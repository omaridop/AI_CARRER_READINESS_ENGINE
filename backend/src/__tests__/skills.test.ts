import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { app } from '../app';
import { SKILLS_TAXONOMY } from '../data/skills-taxonomy';
import { Server } from 'http';

let server: Server;
let baseUrl: string;

describe('GET /api/skills', () => {
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
  });

  it('returns the full taxonomy from the database with aliases', async () => {
    const res = await fetch(`${baseUrl}/skills`);
    assert.strictEqual(res.status, 200);
    
    const body = await res.json() as { data: { skills: { name: string; category: string; aliases: string[] }[] } };
    assert.ok(body.data);
    
    const skills = body.data.skills;
    assert.ok(Array.isArray(skills));
    assert.strictEqual(skills.length, SKILLS_TAXONOMY.length);
    
    // Check SQL mapping
    const sql = skills.find(s => s.name === 'SQL');
    assert.ok(sql);
    assert.strictEqual(sql.category, 'programming');
    assert.ok(Array.isArray(sql.aliases));
    assert.ok(sql.aliases.includes('t-sql'));
  });
});
