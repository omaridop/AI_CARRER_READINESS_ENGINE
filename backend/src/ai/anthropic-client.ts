/**
 * AI API client wrapper for the Adaptive Tutor.
 *
 * NOTE: Currently configured to use OpenRouter as the primary provider
 * (routing to DeepSeek V4.1 Flash, selected by the user on 2026-09-27).
 * The legacy filename/native branch is retained; the demo uses OPENROUTER_API_KEY.
 * 
 * Handles:
 *   - Graceful no-key behavior (returns null, does not crash)
 *   - Request timeout (10 seconds)
 *   - HTTP/network error catching
 *   - Logging all failures for debugging
 *
 * The caller (TutorService) treats a null return as "use fallback."
 */

import Anthropic from '@anthropic-ai/sdk';

const TIMEOUT_MS = 10_000;
const NATIVE_MODEL = 'claude-3-5-sonnet-20240620';
const OPENROUTER_MODEL = 'deepseek/deepseek-v4.1-flash';
const MAX_TOKENS = 1024;

let _nativeClient: Anthropic | null = null;
let _keyChecked = false;
let _useOpenRouter = false;
let _openRouterKey: string | null = null;

export function initClient(): void {
  if (_keyChecked) return;
  _keyChecked = true;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openRouterKey && openRouterKey.trim().length > 0) {
    // Primary path: OpenRouter
    _useOpenRouter = true;
    _openRouterKey = openRouterKey.trim();
  } else if (anthropicKey && anthropicKey.trim().length > 0) {
    // Secondary path: Native Anthropic SDK
    try {
      _nativeClient = new Anthropic({ apiKey: anthropicKey.trim(), timeout: TIMEOUT_MS });
      _useOpenRouter = false;
    } catch (err) {
      console.error('[ai-client] Failed to initialize native Anthropic client:', err);
      _nativeClient = null;
    }
  } else {
    console.warn('[ai-client] No API keys set (OPENROUTER_API_KEY missing) — AI tutor will use fallback content only.');
  }
}

export async function callClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  initClient();
  
  if (!_useOpenRouter && !_nativeClient) {
    console.info('[ai-client] No API key available — skipping AI call.');
    return null;
  }

  try {
    if (_useOpenRouter && _openRouterKey) {
      // Execute via OpenRouter (Primary Path)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${_openRouterKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
          'X-Title': 'SkillBridge Tutor'
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          max_tokens: MAX_TOKENS,
          // Short tutor explanations do not need DeepSeek's default high reasoning.
          reasoning: { enabled: false },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        }),
        signal: controller.signal
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
      }
      
      const data = await response.json() as { choices?: { message?: { content?: string } }[] };
      return data.choices?.[0]?.message?.content || null;
      } finally {
        // Headers arriving does not mean the body has completed. Bound both phases.
        clearTimeout(timeoutId);
      }
      
    } else if (_nativeClient) {
      // Execute via Native SDK
      const response = await _nativeClient.messages.create({
        model: NATIVE_MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      if (!textBlock || textBlock.type !== 'text') {
        console.warn('[ai-client] No text block in native response');
        return null;
      }
      return textBlock.text;
    }
    
    return null;
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('timeout') || err?.message?.includes('ETIMEDOUT')) {
      console.warn(`[ai-client] Request timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.warn('[ai-client] API call failed:', err?.message ?? err);
    }
    return null;
  }
}

export function resetClient(): void {
  _nativeClient = null;
  _keyChecked = false;
  _useOpenRouter = false;
  _openRouterKey = null;
}
