/**
 * Scraper-specific type definitions for the SkillBridge web scraping system.
 *
 * These types support the pipeline: Scrape → Review → Import → Seed.
 * ScrapedJob is the raw output; it converts to JobPostingData for the scoring pipeline.
 */

/** Raw job posting as scraped from a job board. */
export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  date_posted: string | null;
  source_name: 'Bayt.com' | 'Akhtaboot' | 'LinkedIn' | 'Indeed' | 'Glassdoor' | 'RemoteOK';
  scraped_at: string; // ISO 8601 timestamp
}

/** Configuration for a scraping run. */
export interface ScraperConfig {
  searchQuery: string;
  location: string;
  maxPages: number;
  delayMs: number;        // Minimum delay between page loads (ms)
  headless: boolean;
}

/** Result from a single scraper run. */
export interface ScraperResult {
  source: string;
  jobs: ScrapedJob[];
  errors: string[];
  scrapedAt: string;
  durationMs: number;
}

/** Default configuration for polite scraping. */
export const DEFAULT_CONFIG: ScraperConfig = {
  searchQuery: 'data analyst',
  location: 'Jordan',
  maxPages: 2,
  delayMs: 3000,
  headless: true,
};
