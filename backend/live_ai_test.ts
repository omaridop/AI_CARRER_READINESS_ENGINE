
import { callClaude } from './src/ai/anthropic-client';
import { buildUserPrompt, SYSTEM_PROMPT } from './src/ai/prompt-templates';
import { validateTutorResponse } from './src/ai/schema-validator';

async function testLiveAI() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.OPEN_ROUTER_API_KEY && !process.env.OPERN_ROUTER_API_KEY) {
    console.error("ERROR: API KEY not set!");
    process.exit(1);
  }

  const tests = [
    { skill: 'SQL', style: 'simple' },
    { skill: 'Power BI', style: 'example' }
  ] as const;

  for (const t of tests) {
    console.log(`\n======================================================`);
    console.log(`TESTING: ${t.skill} + ${t.style}`);
    console.log(`======================================================\n`);
    
    const userPrompt = buildUserPrompt(t.style, t.skill, 'none');
    console.log(`Calling Claude (this may take a few seconds)...\n`);
    
    const rawResponse = await callClaude(SYSTEM_PROMPT, userPrompt);
    
    console.log(`\n--- RAW MODEL OUTPUT (PRE-VALIDATION) ---\n`);
    console.log(rawResponse);
    console.log(`\n-----------------------------------------\n`);
    
    if (!rawResponse) {
      console.error(`FAILED: Model returned null (maybe timeout or invalid key).`);
      continue;
    }
    
    const validated = validateTutorResponse(rawResponse);
    
    if (validated) {
      console.log(`[SUCCESS] Validation Passed AS-IS!`);
      console.log(`Parsed Object:`, validated);
    } else {
      console.log(`[FAILURE] Validation Failed!`);
    }
  }
}

testLiveAI().catch(console.error);
