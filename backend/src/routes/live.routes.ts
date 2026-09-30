import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { ScraperManager } from '../scraper/scraper-manager';
import { LinkedInScraper } from '../scraper/linkedin-scraper';
import { BaytScraper } from '../scraper/bayt-scraper';
import { AkhtabootScraper } from '../scraper/akhtaboot-scraper';
import { IndeedScraper } from '../scraper/indeed-scraper';
import { GlassdoorScraper } from '../scraper/glassdoor-scraper';
import { RemoteOKScraper } from '../scraper/remoteok-scraper';
import { callClaude } from '../ai/anthropic-client';
import { sendError } from '../utils/response';
import { getDatabase } from '../db/connection';
import { progressManager } from '../services/progress.service';

const liveRouter = Router();

liveRouter.post('/magic', async (req: Request, res: Response) => {
  try {
    const { jobTitle, currentProfileText, userSkills } = req.body;

    if (!jobTitle) {
      return sendError(res, 'Job title is required', 400);
    }

    const jobId = progressManager.createJob();
    res.json({ data: { jobId }, error: null });

    runMagicPipeline(jobId, jobTitle as string, currentProfileText as string, userSkills as string[]).catch(err => {
      console.error('[live-magic] Unhandled pipeline error:', err);
      progressManager.fail(jobId, err.message || 'Pipeline failed unexpectedly');
    });

  } catch (err: any) {
    console.error('[live-magic] Error starting job:', err);
    return sendError(res, err.message || 'Failed to start magic workflow', 500);
  }
});

liveRouter.get('/progress/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  if (Array.isArray(jobId)) return res.status(400).json({ error: 'Invalid jobId' });
  
  const job = progressManager.getJob(jobId as string);

  if (!job) {
    return res.status(404).json({ data: null, error: { message: 'Job not found' } });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  // Send all buffered events first (so late-connecting clients catch up)
  for (const event of job.events) {
    res.write(`event: progress\ndata: ${JSON.stringify(event)}\n\n`);
  }

  // If the job already finished, send the final event immediately
  if (job.status === 'complete') {
    res.write(`event: complete\ndata: ${JSON.stringify(job.result)}\n\n`);
    res.end();
    return;
  }
  if (job.status === 'error') {
    res.write(`event: error\ndata: ${JSON.stringify({ error: job.error })}\n\n`);
    res.end();
    return;
  }

  // Subscribe to live events
  const onProgress = (event: any) => {
    res.write(`event: progress\ndata: ${JSON.stringify(event)}\n\n`);
  };
  const onComplete = (result: any) => {
    res.write(`event: complete\ndata: ${JSON.stringify(result)}\n\n`);
    cleanup();
    res.end();
  };
  const onError = (error: string) => {
    res.write(`event: error\ndata: ${JSON.stringify({ error })}\n\n`);
    cleanup();
    res.end();
  };

  progressManager.on(`progress:${jobId}`, onProgress);
  progressManager.on(`complete:${jobId}`, onComplete);
  progressManager.on(`error:${jobId}`, onError);

  const cleanup = () => {
    progressManager.off(`progress:${jobId}`, onProgress);
    progressManager.off(`complete:${jobId}`, onComplete);
    progressManager.off(`error:${jobId}`, onError);
  };

  // Clean up if client disconnects
  req.on('close', cleanup);
});

// ── Background pipeline ──────────────────────────────────────────────

async function runMagicPipeline(
  jobId: string,
  jobTitle: string,
  currentProfileText?: string,
  userSkills?: string[]
): Promise<void> {
  const p = (step: string, msg: string, detail?: string, pct?: number) =>
    progressManager.emit_progress(jobId, step, msg, detail, pct);

  // ── 1. Live Web Scraping (Fallback Chain with 24h Cache) ───────────
  const cacheDir = path.resolve(__dirname, '../../data/cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  const safeJobTitle = jobTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const cachePath = path.join(cacheDir, `${safeJobTitle}.json`);
  let scrapedJobs: any[] = [];
  let isCached = false;

  if (fs.existsSync(cachePath)) {
    try {
      const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      const ageMs = Date.now() - new Date(cacheData.timestamp).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        scrapedJobs = cacheData.jobs;
        isCached = true;
        p('scrape_init', 'Using cached job postings (24h cache)…', `${scrapedJobs.length} postings found`, 35);
      }
    } catch (e) {
      console.warn('[live-magic] Failed to read cache', e);
    }
  }

  if (!isCached) {
    p('scrape_init', 'Initializing scraper chain…', 'LinkedIn → Indeed → Glassdoor → RemoteOK → Bayt → Akhtaboot', 5);

    const scraperManager = new ScraperManager();
    scraperManager.register(new LinkedInScraper());
    scraperManager.register(new IndeedScraper());
    scraperManager.register(new GlassdoorScraper());
    scraperManager.register(new RemoteOKScraper());
    scraperManager.register(new BaytScraper());
    scraperManager.register(new AkhtabootScraper());

    // Use the progress-aware fallback chain
    scrapedJobs = await scraperManager.runFallbackChainWithProgress(
      {
        searchQuery: jobTitle,
        location: 'Jordan',
        maxPages: 1,
        delayMs: 1000,
        headless: true
      },
      15,
      (source, status, count) => {
        if (status === 'trying') {
          p('scrape_source', `Scraping ${source}…`, source, 15);
        } else if (status === 'success') {
          p('scrape_result', `${source}: found ${count} postings`, `${count} jobs`, 25);
        } else if (status === 'failed') {
          p('scrape_fallback', `${source} failed, trying next source…`, source, 20);
        }
      }
    );

    if (scrapedJobs.length > 0) {
      fs.writeFileSync(cachePath, JSON.stringify({
        timestamp: new Date().toISOString(),
        jobs: scrapedJobs
      }));
    }
  }

  if (scrapedJobs.length === 0) {
    progressManager.fail(jobId, 'No jobs found for this title during live scraping.');
    return;
  }

  if (!isCached) {
    p('scrape_done', `Scraping complete: ${scrapedJobs.length} total postings collected`,
      `${scrapedJobs.length} postings`, 35);
  }

  // Limit to top 10 jobs for AI prompt size
  const topJobs = scrapedJobs.slice(0, 10);
  const combinedDescriptions = topJobs
    .map((j, idx) => `[Posting ${idx + 1}] Title: ${j.title}\nDescription: ${j.description}`)
    .join('\n\n---\n\n');

  // ── 2. AI Dynamic Skill Extraction ─────────────────────────────
  p('extract_start', 'AI is analyzing job descriptions…', `Extracting skills from ${topJobs.length} postings`, 45);

  const extractPrompt = `
You are an expert career data analyst.
Read the following ${topJobs.length} job descriptions scraped from the web for the role of "${jobTitle}".
Extract the top 10 most common or critical skills (technical, soft skills, concepts) required across these postings.

For each skill, calculate the exact percentage of postings that mention it.
Percentage = (Count of postings mentioning skill / ${topJobs.length}) * 100.

Return ONLY a valid JSON array of objects with this EXACT shape:
[
  { 
    "skill": "Skill Name", 
    "percentage": 90, 
    "postings_count": 9, 
    "category": "technical"
  }
]
Do not include any markdown formatting, backticks, or explanation. Only the JSON array.

Job Postings:
${combinedDescriptions}
`;

  const rawSkillsJson = await callClaude(
    'You are a JSON-only API. Return only the raw JSON array.',
    extractPrompt
  );

  let dynamicSkillsData: { skill: string; percentage: number; postings_count: number; category: string }[] = [];
  if (rawSkillsJson) {
    try {
      const cleanJson = rawSkillsJson.replace(/```json/g, '').replace(/```/g, '').trim();
      dynamicSkillsData = JSON.parse(cleanJson);
    } catch (e) {
      console.error('[live-magic] Failed to parse dynamic skills JSON', e);
      dynamicSkillsData = [
        { skill: 'Communication', percentage: 100, postings_count: topJobs.length, category: 'soft skill' },
        { skill: jobTitle, percentage: 100, postings_count: topJobs.length, category: 'concept' },
      ];
    }
  } else {
    dynamicSkillsData = [
      { skill: 'Communication', percentage: 100, postings_count: topJobs.length, category: 'soft skill' },
    ];
  }

  const dynamicSkills = dynamicSkillsData.map(d => d.skill);

  p('extract_done', `Extracted ${dynamicSkillsData.length} market-required skills`,
    dynamicSkillsData.map(s => s.skill).join(', '), 60);

  // ── 2.5 DB Integration ─────────────────────────────────────────
  p('db_save', 'Saving discovered skills to database…', undefined, 65);

  const db = getDatabase();
  for (const skillName of dynamicSkills) {
    if (!skillName || skillName.trim().length === 0) continue;
    const cleanName = skillName.trim();
    const existing = db.prepare('SELECT id FROM skills WHERE LOWER(name) = LOWER(?)').get(cleanName);
    if (!existing) {
      db.prepare('INSERT INTO skills (name, category, aliases) VALUES (?, ?, ?)').run(cleanName, 'dynamic_discovery', '[]');
    }
  }

  // ── 3. AI Profile Enhancement ──────────────────────────────────
  let enhancedProfile = '';
  if (currentProfileText && currentProfileText.trim().length > 0) {
    p('enhance_start', 'AI is enhancing your profile…', 'Rewriting to match market requirements', 70);

    const enhancePrompt = `
You are an expert resume writer and career coach.
A user wants to apply for "${jobTitle}" roles. 
Here are the top skills employers are currently asking for based on our live web scraping: ${dynamicSkills.join(', ')}.

Here is the user's current profile or resume summary:
"""
${currentProfileText}
"""

Please enhance, rewrite, and elevate their profile text to powerfully match the scraped job requirements. 
Integrate the relevant skills naturally, use strong action verbs, and make them sound like a perfect fit for this specific market.
Keep it to 2-3 impactful paragraphs.
`;

    const enhancedText = await callClaude(
      'You are an expert resume writer. Return only the enhanced profile text.',
      enhancePrompt
    );
    enhancedProfile = enhancedText || 'Failed to enhance profile. Please try again.';

    p('enhance_done', 'Profile enhancement complete', undefined, 85);
  }

  // ── 4. Matching & Semantic Similarity Score ─────────────────────────────
  p('match_start', 'Calculating semantic similarity score…', 'Matching your skills with market needs', 90);

  const userSkillNames = Array.isArray(userSkills)
    ? (userSkills as string[])
    : [];

  let totalWeight = 0;
  let studentScore = 0;
  const missingSkillsData: any[] = [];
  const matchedSkillsData: any[] = [];

  // If user has no skills, everything is missing
  if (userSkillNames.length === 0) {
    for (const reqSkill of dynamicSkillsData) {
      totalWeight += reqSkill.percentage;
      missingSkillsData.push({ ...reqSkill, courses: [] });
    }
  } else {
    const similarityPrompt = `
You are an expert technical recruiter. You need to determine if a candidate meets the required skills based on their current skill set.
A candidate has these skills: ${JSON.stringify(userSkillNames)}
The job requires these skills: ${JSON.stringify(dynamicSkillsData.map(s => s.skill))}

Evaluate each required skill against the candidate's skills.
Provide a semantic match. If the candidate has the exact skill, or a highly related equivalent technology (e.g., PyTorch is equivalent enough to TensorFlow for a Junior role, React ≈ Vue, etc.), count it as a match.
Return a JSON array of objects with EXACTLY this structure, one for each required skill:
[
  {
    "requiredSkill": "Skill Name",
    "isMatch": true or false,
    "matchedWith": "The user skill that satisfied this requirement (or null if none)"
  }
]
Do not include markdown or explanations. Return ONLY the JSON array.
`;

    let matchResults: any[] = [];
    try {
      const matchJson = await callClaude('You are a JSON-only API. Return only the raw JSON array.', similarityPrompt);
      if (matchJson) {
        const cleanMatch = matchJson.replace(/```json/g, '').replace(/```/g, '').trim();
        matchResults = JSON.parse(cleanMatch);
      }
    } catch (e) {
      console.error('[live-magic] Failed to parse semantic match JSON, falling back to string match', e);
    }

    for (const reqSkill of dynamicSkillsData) {
      totalWeight += reqSkill.percentage;
      
      const semanticMatch = matchResults.find(m => m.requiredSkill?.toLowerCase() === reqSkill.skill.toLowerCase());
      
      let isMatch = false;
      if (semanticMatch) {
        isMatch = semanticMatch.isMatch;
      } else {
        // Fallback string match
        const reqNameLow = reqSkill.skill.toLowerCase().trim();
        isMatch = userSkillNames.some(u => {
          const ul = u.toLowerCase().trim();
          return reqNameLow.includes(ul) || ul.includes(reqNameLow);
        });
      }

      if (isMatch) {
        studentScore += reqSkill.percentage;
        matchedSkillsData.push(reqSkill);
      } else {
        missingSkillsData.push({ ...reqSkill, courses: [] });
      }
    }
  }

  const similarityScore = totalWeight > 0 ? Math.round((studentScore / totalWeight) * 100) : 0;
  p('match_done', `Similarity score: ${similarityScore}/100`, `${matchedSkillsData.length} matched, ${missingSkillsData.length} missing`, 93);

  // ── 4.5 Fetch Courses for Missing Skills ─────────────────────────────────
  if (missingSkillsData.length > 0) {
    p('courses_start', 'Researching live courses for missing skills…', 'Udemy & Coursera HTTP 200 checks', 95);
    const { CourseScraper } = require('../scraper/course-scraper');
    const courseScraper = new CourseScraper();
    await courseScraper.init();
    
    try {
      const fetchPromises = missingSkillsData.map(async (skillObj, i) => {
        const skill = skillObj.skill;
        p('courses_fetch', `Finding courses for ${skill}…`, `Checking HTTP 200 status`, 95 + Math.round((i / missingSkillsData.length) * 4));
        const courses = await courseScraper.scrapeCoursesForSkill(skill);
        skillObj.courses = courses;
      });
      await Promise.all(fetchPromises);
    } finally {
      await courseScraper.close();
    }
  }

  // ── 5. Complete ────────────────────────────────────────────────
  const result = {
    scrapedJobsCount: scrapedJobs.length,
    analyzedJobsCount: topJobs.length,
    topJobs: topJobs,
    dynamicSkills: dynamicSkillsData,
    similarityScore,
    matchedSkills: matchedSkillsData,
    missingSkills: missingSkillsData,
    enhancedProfile,
  };

  p('complete', 'All done! Your results are ready.', undefined, 100);
  progressManager.complete(jobId, result);
}

export { liveRouter };
