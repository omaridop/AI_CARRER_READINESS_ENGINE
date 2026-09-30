import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { TutorService } from '../services/tutor.service';
import { resetClient } from '../ai/anthropic-client';

describe('Tutor provider failures (controlled; no external calls)', () => {
  let originalRouter: string | undefined;
  let originalNative: string | undefined;
  beforeEach(() => {
    originalRouter = process.env.OPENROUTER_API_KEY;
    originalNative = process.env.ANTHROPIC_API_KEY;
    process.env.OPENROUTER_API_KEY = 'controlled-test-key';
    delete process.env.ANTHROPIC_API_KEY;
    resetClient();
  });
  afterEach(() => {
    if (originalRouter === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalRouter;
    if (originalNative === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalNative;
    resetClient();
    mock.restoreAll();
  });

  it('missing both keys uses fallback without a network call', async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchMock = mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network call'); });
    const result = await new TutorService().explain('SQL', 'simple');
    assert.equal(result.source, 'fallback');
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('provider 429 keeps skill/style and identifies fallback', async () => {
    mock.method(globalThis, 'fetch', async () => new Response('Controlled rate limit', { status: 429 }));
    const result = await new TutorService().explain('Excel', 'visual');
    assert.equal(result.source, 'fallback');
    assert.equal(result.skill, 'Excel');
    assert.equal(result.style, 'visual');
  });

  it('malformed model JSON never becomes a live response', async () => {
    mock.method(globalThis, 'fetch', async () => Response.json({ choices: [{ message: { content: '{invalid model JSON' } }] }));
    const result = await new TutorService().explain('SQL', 'step_by_step');
    assert.equal(result.source, 'fallback');
    assert.equal(result.style, 'step_by_step');
  });

  it('times out a stalled response body after headers have arrived', async () => {
    let streamController: ReadableStreamDefaultController<Uint8Array>;
    mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          streamController = controller;
          controller.enqueue(new TextEncoder().encode('{"choices":['));
          init.signal?.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')), { once: true });
        },
      });
      return new Response(stream, { status: 200 });
    });
    const start = Date.now();
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const result = await Promise.race([
      new TutorService().explain('SQL', 'simple'),
      new Promise<'hung'>(resolve => { watchdog = setTimeout(() => resolve('hung'), 11000); }),
    ]);
    if (watchdog) clearTimeout(watchdog);
    if (result === 'hung') streamController!.error(new Error('Test cleanup'));
    assert.notEqual(result, 'hung', 'Tutor timeout must cover the body, not only response headers');
    if (result !== 'hung') assert.equal(result.source, 'fallback');
    assert.ok(Date.now() - start < 11000);
  });
});
