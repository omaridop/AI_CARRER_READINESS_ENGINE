/**
 * SkillBridge Web Scraper — public API.
 *
 * Re-exports all scraper classes and types for programmatic use.
 * For CLI usage, run the scripts directly:
 *
 *   npm run scrape --workspace=backend              # Run all scrapers
 *   npm run scrape --workspace=backend -- --source bayt  # Specific source
 *   npm run scrape:import --workspace=backend       # Import results
 */

export { BaseScraper } from './base-scraper';
export { BaytScraper } from './bayt-scraper';
export { AkhtabootScraper } from './akhtaboot-scraper';
export { LinkedInScraper } from './linkedin-scraper';
export { IndeedScraper } from './indeed-scraper';
export { GlassdoorScraper } from './glassdoor-scraper';
export { RemoteOKScraper } from './remoteok-scraper';
export { ScraperManager } from './scraper-manager';
export type { ScrapedJob, ScraperConfig, ScraperResult } from './types';
export { DEFAULT_CONFIG } from './types';
