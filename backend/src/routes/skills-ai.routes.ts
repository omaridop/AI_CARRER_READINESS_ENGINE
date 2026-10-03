import { Router } from 'express';
import { callClaude } from '../ai/anthropic-client';
import { sendSuccess, sendError } from '../utils/response';

const skillsAiRouter = Router();

/**
 * POST /api/skills-ai/normalize
 * Receives raw free-text skills, uses AI to fix typos, normalize names, and assign confidence.
 */
skillsAiRouter.post('/normalize', async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      return sendError(res, 'rawText must be a non-empty string', 400);
    }

    const prompt = `
You are an expert AI skill normalizer. 
A user has typed the following free-text string representing their skills:
"${rawText}"

Your task is to:
1. Fix typos (e.g. "pytho" -> "Python", "javascrip" -> "JavaScript").
2. Merge aliases into canonical names (e.g. "js" -> "JavaScript", "ml" -> "Machine Learning", "oop" -> "Object-Oriented Programming").
3. Split concatenated input correctly (e.g. "python oop c++" -> Python, Object-Oriented Programming, C++).
4. Assign a confidence score from 0.0 to 1.0 for each correction. (Use <0.8 if you are guessing a heavily misspelled word).

Return ONLY a valid JSON array of objects with this exact shape:
[
  { "original": "raw matched token", "corrected": "Canonical Name", "confidence": 0.95 }
]
Do not include any markdown fences or explanation. Only the JSON array.
`;

    const rawJson = await callClaude('You are a JSON-only API. Output strictly valid JSON.', prompt);
    
    if (!rawJson) {
      throw new Error("AI returned no response");
    }

    // Clean markdown if present
    const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const normalized = JSON.parse(cleanJson);

    return sendSuccess(res, { normalized });
  } catch (err: any) {
    console.error('[skills-ai] Normalization error:', err);
    return sendError(res, err.message || 'Failed to normalize skills', 500);
  }
});

/**
 * POST /api/skills-ai/normalize-job
 * M2: Receives a raw job title, uses AI to fix typos and normalize to standard industry title.
 */
skillsAiRouter.post('/normalize-job', async (req, res) => {
  try {
    const { jobTitle } = req.body;
    if (!jobTitle || typeof jobTitle !== 'string') {
      return sendError(res, 'jobTitle must be a non-empty string', 400);
    }

    const prompt = `
You are an expert AI career taxonomy normalizer. 
A user has typed the following dream job title:
"${jobTitle}"

Your task is to:
1. Fix typos (e.g. "ai enginer" -> "AI Engineer", "front end dev" -> "Frontend Developer").
2. Standardize to a canonical industry title.
3. Assign a confidence score from 0.0 to 1.0.

Return ONLY a valid JSON object with this exact shape:
{ "original": "raw matched token", "corrected": "Canonical Job Title", "confidence": 0.95 }
Do not include any markdown fences or explanation. Only the JSON object.
`;

    const rawJson = await callClaude('You are a JSON-only API. Output strictly valid JSON.', prompt);
    
    if (!rawJson) {
      throw new Error("AI returned no response");
    }

    const cleanJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
    const normalized = JSON.parse(cleanJson);

    return sendSuccess(res, { normalized });
  } catch (err: any) {
    console.error('[skills-ai] Job normalization error:', err);
    return sendError(res, err.message || 'Failed to normalize job title', 500);
  }
});

export { skillsAiRouter };
