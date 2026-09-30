import fs from 'fs';
import path from 'path';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScraperResult, ScrapedJob, DEFAULT_CONFIG } from './types';
import { JobPostingData } from '../types';
import { JOB_POSTINGS } from '../data/job-postings';

const SCRAPED_DIR = path.resolve(__dirname, '../../data/scraped');

export class ScraperManager {
  private scrapers: BaseScraper[] = [];

  register(scraper: BaseScraper): void {
    this.scrapers.push(scraper);
  }

  async runFallbackChain(config: Partial<ScraperConfig> = {}, threshold = 15): Promise<ScrapedJob[]> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const allJobs: ScrapedJob[] = [];
    
    console.log(`[Scraper Chain] Target: ${threshold} postings for "${fullConfig.searchQuery}"`);

    for (const scraper of this.scrapers) {
      if (allJobs.length >= threshold) break;
      
      console.log(`[Scraper Chain] Attempting source: ${scraper.sourceName}...`);
      try {
        const jobs = await scraper.scrape(fullConfig);
        console.log(`[Scraper Chain] ${scraper.sourceName} yielded ${jobs.length} jobs.`);
        allJobs.push(...jobs);
      } catch (err: any) {
        console.warn(`[Scraper Chain] ${scraper.sourceName} failed: ${err.message}`);
      } finally {
        try { await scraper.close(); } catch {}
      }
    }

    if (allJobs.length === 0) {
      console.warn(`[Scraper Chain] All sources failed to retrieve any postings.`);
    } else {
      console.log(`[Scraper Chain] Finished. Total merged jobs: ${allJobs.length}`);
    }

    return allJobs;
  }

  /**
   * Same as runFallbackChain but with a progress callback for SSE streaming.
   * @param onProgress Called with (sourceName, status, jobCount) at each step.
   */
  async runFallbackChainWithProgress(
    config: Partial<ScraperConfig> = {},
    threshold = 15,
    onProgress?: (source: string, status: 'trying' | 'success' | 'failed', count: number) => void
  ): Promise<ScrapedJob[]> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const allJobs: ScrapedJob[] = [];

    console.log(`[Scraper Chain] Target: ${threshold} postings for "${fullConfig.searchQuery}"`);

    for (const scraper of this.scrapers) {
      if (allJobs.length >= threshold) break;

      console.log(`[Scraper Chain] Attempting source: ${scraper.sourceName}...`);
      onProgress?.(scraper.sourceName, 'trying', allJobs.length);

      try {
        const jobs = await scraper.scrape(fullConfig);
        console.log(`[Scraper Chain] ${scraper.sourceName} yielded ${jobs.length} jobs.`);
        allJobs.push(...jobs);
        onProgress?.(scraper.sourceName, 'success', jobs.length);
      } catch (err: any) {
        console.warn(`[Scraper Chain] ${scraper.sourceName} failed: ${err.message}`);
        onProgress?.(scraper.sourceName, 'failed', 0);
      } finally {
        try { await scraper.close(); } catch {}
      }
    }

    if (allJobs.length === 0) {
      console.warn(`[Scraper Chain] All sources failed to retrieve any postings.`);
    } else {
      console.log(`[Scraper Chain] Finished. Total merged jobs: ${allJobs.length}`);
    }

    return allJobs;
  }

  async runAll(config: Partial<ScraperConfig> = {}): Promise<ScraperResult[]> {
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const results: ScraperResult[] = [];

    for (const scraper of this.scrapers) {
      const start = Date.now();
      const result: ScraperResult = {
        source: scraper.sourceName,
        jobs: [],
        errors: [],
        scrapedAt: new Date().toISOString(),
        durationMs: 0,
      };

      try {
        result.jobs = await scraper.scrape(fullConfig);
      } catch (err: any) {
        result.errors.push(err.message);
      } finally {
        try { await scraper.close(); } catch {}
      }

      result.durationMs = Date.now() - start;
      results.push(result);
      this.saveResult(result);
    }

    this.saveCombined(results);
    return results;
  }

  async runSource(sourceName: string, config: Partial<ScraperConfig> = {}): Promise<ScraperResult | null> {
    const scraper = this.scrapers.find(s => s.sourceName.toLowerCase() === sourceName.toLowerCase());
    if (!scraper) return null;

    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const start = Date.now();
    const result: ScraperResult = {
      source: scraper.sourceName,
      jobs: [],
      errors: [],
      scrapedAt: new Date().toISOString(),
      durationMs: 0,
    };

    try {
      result.jobs = await scraper.scrape(fullConfig);
    } catch (err: any) {
      result.errors.push(err.message);
    } finally {
      try { await scraper.close(); } catch {}
    }

    result.durationMs = Date.now() - start;
    this.saveResult(result);
    return result;
  }

  deduplicateAgainstExisting(jobs: ScrapedJob[]): { newJobs: ScrapedJob[]; duplicates: ScrapedJob[] } {
    const existingKeys = new Set(
      JOB_POSTINGS.map(p => this.normalizeKey(p.title, p.company))
    );

    const newJobs: ScrapedJob[] = [];
    const duplicates: ScrapedJob[] = [];
    const seenKeys = new Set<string>();

    for (const job of jobs) {
      const key = this.normalizeKey(job.title, job.company);
      if (existingKeys.has(key) || seenKeys.has(key)) {
        duplicates.push(job);
      } else {
        seenKeys.add(key);
        newJobs.push(job);
      }
    }

    return { newJobs, duplicates };
  }

  static toJobPostingData(jobs: ScrapedJob[]): JobPostingData[] {
    return jobs.map(job => ({
      title: job.title,
      company: job.company,
      location: job.location,
      source_label: 'real' as const,
      source_name: job.source_name,
      description: job.description,
      date_posted: job.date_posted,
    }));
  }

  private saveResult(result: ScraperResult): void {
    this.ensureDir();
    const date = new Date().toISOString().split('T')[0];
    const source = result.source.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filePath = path.join(SCRAPED_DIR, `${date}-${source}.json`);
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');
  }

  private saveCombined(results: ScraperResult[]): void {
    this.ensureDir();
    const date = new Date().toISOString().split('T')[0];
    const filePath = path.join(SCRAPED_DIR, `${date}-combined.json`);
    const combined = {
      scrapedAt: new Date().toISOString(),
      totalJobs: results.reduce((sum, r) => sum + r.jobs.length, 0),
      results,
    };
    fs.writeFileSync(filePath, JSON.stringify(combined, null, 2), 'utf-8');
  }

  static loadLatest(sourceName?: string): ScrapedJob[] {
    if (!fs.existsSync(SCRAPED_DIR)) return [];

    const files = fs.readdirSync(SCRAPED_DIR)
      .filter(f => f.endsWith('.json') && !f.includes('combined'))
      .sort()
      .reverse();

    if (sourceName) {
      const normalized = sourceName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const match = files.find(f => f.includes(normalized));
      if (!match) return [];
      const content = JSON.parse(fs.readFileSync(path.join(SCRAPED_DIR, match), 'utf-8')) as ScraperResult;
      return content.jobs;
    }

    const allJobs: ScrapedJob[] = [];
    const seenSources = new Set<string>();
    for (const file of files) {
      const source = file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace('.json', '');
      if (seenSources.has(source)) continue;
      seenSources.add(source);
      try {
        const content = JSON.parse(fs.readFileSync(path.join(SCRAPED_DIR, file), 'utf-8')) as ScraperResult;
        allJobs.push(...content.jobs);
      } catch {}
    }
    return allJobs;
  }

  private normalizeKey(title: string, company: string): string {
    return `${title.toLowerCase().trim()}|${company.toLowerCase().trim()}`;
  }

  private ensureDir(): void {
    if (!fs.existsSync(SCRAPED_DIR)) {
      fs.mkdirSync(SCRAPED_DIR, { recursive: true });
    }
  }
}
