/**
 * LinkedIn jobs provider using JSearch (OpenWeb Ninja API).
 * Replaces headless browser scraping with reliable REST API calls.
 */

import axios from 'axios';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScrapedJob } from './types';

export class LinkedInScraper extends BaseScraper {
  readonly sourceName = 'LinkedIn';

  async scrape(config: ScraperConfig): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    const apiKey = process.env.OPENWEB_API_KEY;

    if (!apiKey) {
      this.error('Missing OPENWEB_API_KEY in .env file.');
      return jobs;
    }

    const locationPart = config.location ? ` in ${config.location}` : '';
    const query = `${config.searchQuery}${locationPart}`;
    this.log(`Searching JSearch API for: "${query}"...`);

    try {
      const response = await axios.get('https://api.openwebninja.com/jsearch/search', {
        params: {
          query: query,
          page: '1',
          num_pages: Math.min(config.maxPages || 1, 3),
        },
        headers: {
          'x-api-key': apiKey,
        },
      });

      const results = response.data?.data || [];
      this.log(`Found ${results.length} jobs via JSearch API.`);

      for (const item of results) {
        jobs.push({
          title: item.job_title || 'Unknown Title',
          company: item.employer_name || 'Unknown Company',
          location: `${item.job_city || ''}, ${item.job_country || config.location}`.trim(),
          description: item.job_description || `[No description] ${item.job_title}`,
          url: item.job_apply_link || item.job_google_link || '',
          date_posted: item.job_posted_at_datetime_utc || null,
          source_name: 'LinkedIn',
          scraped_at: new Date().toISOString(),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.error(`Failed to fetch jobs from JSearch: ${msg}`);
    }

    this.log(`Total jobs retrieved: ${jobs.length}`);
    return jobs;
  }
}