import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { coursesFromCitations, courseDestination, searchCourseWeb, COURSE_SEARCH_TIMEOUT_MS } from '../ai/course-search';
import { CourseSearchService } from '../services/course-search.service';

function citation(url: string, title = 'SQL for Beginners', content = 'Learn SQL with practical queries.') {
  return { type: 'url_citation', url_citation: { url, title, content } };
}
function payload(annotations: unknown[]) {
  return { choices: [{ message: { content: 'Invented https://www.udemy.com/course/unseen-sql/', annotations } }] };
}
const example = () => coursesFromCitations(payload([citation('https://www.coursera.org/learn/sql-course')]), 'SQL');

describe('Course search grounding and bounded requests', () => {
  let savedKey: string | undefined;
  beforeEach(() => { savedKey = process.env.OPENROUTER_API_KEY; process.env.OPENROUTER_API_KEY = 'fake-test-only'; });
  afterEach(() => {
    if (savedKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = savedKey;
    mock.restoreAll(); mock.timers.reset();
  });

  it('rejects untrusted hosts, redirects, credentials and non-course paths', () => {
    for (const url of ['javascript:alert(1)', 'http://www.coursera.org/learn/sql', 'https://coursera.org.attacker.com/learn/sql', 'https://udemy.com@attacker.com/course/sql', 'https://www.udemy.com/redirect?url=evil', 'https://www.udemy.com:8443/course/sql', 'https://www.coursera.org/search?query=SQL']) {
      assert.equal(courseDestination(url), null, url);
    }
  });

  it('uses citations only, strips tracking and deduplicates canonical URLs', () => {
    const items = coursesFromCitations(payload([
      citation('https://coursera.org/learn/sql-course/?utm_source=test'),
      citation('https://www.coursera.org/learn/sql-course#about'),
      citation('https://evil.example/course/sql'),
    ]), 'SQL');
    assert.equal(items.length, 1);
    assert.equal(items[0].url, 'https://www.coursera.org/learn/sql-course');
    assert.equal(items.some(c => c.url.includes('unseen')), false);
  });

  it('filters unrelated courses and places title matches before excerpt-only matches', () => {
    const items = coursesFromCitations(payload([
      citation('https://www.udemy.com/course/data', 'Data Foundations', 'Includes SQL queries'),
      citation('https://www.udemy.com/course/design', 'Graphic Design', 'Design a logo'),
      citation('https://www.coursera.org/learn/sql', 'SQL Basics'),
    ]), 'SQL');
    assert.deepEqual(items.map(c => c.title), ['SQL Basics', 'Data Foundations']);
    assert.equal(coursesFromCitations({ choices: [{ message: { content: 'SQL https://www.coursera.org/learn/sql' } }] }, 'SQL').length, 0);
  });

  it('accepts taxonomy aliases and caps the shortlist', () => {
    const items = coursesFromCitations(payload(Array.from({ length: 5 }, (_, i) => citation(`https://www.coursera.org/learn/sql-${i}`, 'Structured Query Language', 'Database basics'))), 'SQL', ['Structured Query Language']);
    assert.equal(items.length, 3);
    const r = coursesFromCitations(payload([
      citation('https://www.coursera.org/learn/design', 'Design for Beginners', 'Create a poster'),
      citation('https://www.coursera.org/learn/r', 'R Programming', 'Use R for statistics'),
    ]), 'R');
    assert.equal(r.length, 1);
    assert.equal(r[0].title, 'R Programming');
  });

  it('missing key returns honestly labeled fallback without network activity', async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchMock = mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected fetch'); });
    const result = await new CourseSearchService().find('Power BI');
    assert.equal(result.source, 'fallback');
    assert.equal(result.researchedAt, null);
    assert.equal(result.courses.length, 0);
    assert.match(result.searchLinks[0].url, /Power%20BI/);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('deduplicates concurrent research and caches success with original timestamp', async () => {
    let count = 0;
    let release!: () => void;
    let clock = 1000;
    const wait = new Promise<void>(resolve => { release = resolve; });
    const service = new CourseSearchService(async () => { count++; await wait; return example(); }, () => clock);
    const a = service.find('SQL'); const b = service.find('SQL');
    assert.equal(count, 1);
    release(); const [first, second] = await Promise.all([a, b]);
    assert.equal(first.source, 'web'); assert.deepEqual(first, second);
    clock += 500;
    const cached = await service.find('SQL');
    assert.equal(cached.cached, true); assert.equal(cached.researchedAt, first.researchedAt); assert.equal(count, 1);
    clock += 3_600_001; await service.find('SQL'); assert.equal(count, 2);
  });

  it('bounds concurrent searches across different skills', async () => {
    let release!: () => void;
    const wait = new Promise<void>(resolve => { release = resolve; });
    const service = new CourseSearchService(async () => { await wait; return []; });
    const a = service.find('SQL'); const b = service.find('Excel');
    const third = await service.find('Python');
    assert.equal(third.source, 'fallback'); assert.match(third.notice, /busy/);
    release(); await Promise.all([a, b]);
  });

  it('no citations, malformed JSON and provider errors never become live recommendations', async () => {
    for (const response of [Response.json({ choices: [] }), new Response('broken'), new Response('rate limit', { status: 429 })]) {
      mock.method(globalThis, 'fetch', async () => response);
      const result = await new CourseSearchService().find('SQL');
      assert.equal(result.source, 'fallback'); assert.equal(result.courses.length, 0);
      mock.restoreAll();
    }
  });

  it('sends bounded web-search parameters and never sends a student profile', async () => {
    mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      assert.equal(body.model, 'deepseek/deepseek-v4.1-flash');
      assert.equal(body.tools[0].type, 'openrouter:web_search');
      assert.equal(body.tools[0].parameters.max_uses, 1);
      assert.equal(body.tools[0].parameters.max_total_results, 5);
      assert.equal(body.max_tool_calls, 2);
      assert.equal(body.studentId, undefined);
      return Response.json(payload([citation('https://www.udemy.com/course/sql-intro')]));
    });
    assert.equal((await searchCourseWeb('SQL'))[0].provider, 'Udemy');
  });

  it('keeps the deadline active while the response body is stalled', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => new Response(new ReadableStream<Uint8Array>({
      start(controller) { init.signal?.addEventListener('abort', () => controller.error(new Error('Aborted')), { once: true }); },
    })));
    const result = new CourseSearchService().find('SQL');
    await Promise.resolve();
    mock.timers.tick(COURSE_SEARCH_TIMEOUT_MS);
    assert.equal((await result).source, 'fallback');
  });
});
