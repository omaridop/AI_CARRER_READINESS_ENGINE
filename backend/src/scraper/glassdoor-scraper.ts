/**
 * Glassdoor scraper.
 *
 * Scrapes job search results from Glassdoor.
 */

import { Page } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScrapedJob } from './types';

const SELECTORS = {
  jobCard: 'li[data-test="jobListing"]',
  titleLink: 'a[data-test="job-link"]',
  company: 'span.EmployerProfile_employerName__Cq9Sy, .job-search-key-l2wjgv',
  location: 'div[data-test="emp-location"]',
  description: '.JobDetails_jobDescription__uW_fK, #JobDescriptionContainer',
};

const GLASSDOOR_DELAY_MS = 5000;

export class GlassdoorScraper extends BaseScraper {
  readonly sourceName = 'Glassdoor';

  async scrape(config: ScraperConfig): Promise<ScrapedJob[]> {
    if (!this.browser) await this.init(config.headless);
    const page = await this.newPage();
    const jobs: ScrapedJob[] = [];
    const seenUrls = new Set<string>();

    const glassdoorConfig = { ...config, delayMs: Math.max(config.delayMs, GLASSDOOR_DELAY_MS) };

    try {
      const searchUrl = this.buildSearchUrl(config);
      this.log(`Loading: ${searchUrl}`);

      const loaded = await this.safeGoto(page, searchUrl, glassdoorConfig);
      if (!loaded) {
        this.error('Failed to load Glassdoor search page.');
        return jobs;
      }

      try {
        await page.waitForSelector(SELECTORS.jobCard, { timeout: 15_000 });
      } catch {
        this.warn('No job cards found. Glassdoor layout may have changed or access blocked.');
        return jobs;
      }

      const links = await this.extractJobLinks(page);
      this.log(`Found ${links.length} job links total.`);

      for (const link of links) {
        if (seenUrls.has(link.url)) continue;
        seenUrls.add(link.url);

        try {
          const job = await this.scrapeJobDetail(page, link, glassdoorConfig);
          if (job) {
            jobs.push(job);
            this.log(`✓ Scraped: ${job.title} @ ${job.company}`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.warn(`Failed to scrape ${link.url}: ${msg}`);
        }
      }
    } finally {
      await page.close();
    }

    this.log(`Total jobs scraped: ${jobs.length}`);
    return jobs;
  }

  private buildSearchUrl(config: ScraperConfig): string {
    const query = encodeURIComponent(config.searchQuery);
    // Simple global search format
    return `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${query}`;
  }

  private async extractJobLinks(page: Page) {
    return page.$$eval(SELECTORS.jobCard, (cards, selectors) => {
      return cards.map(card => {
        const titleEl = card.querySelector(selectors.titleLink);
        const companyEl = card.querySelector(selectors.company);
        const locationEl = card.querySelector(selectors.location);

        let href = titleEl?.getAttribute('href') ?? '';
        if (href.startsWith('/')) {
          href = `https://www.glassdoor.com${href}`;
        }
        
        // Remove tracking params
        if (href.includes('?')) href = href.split('?')[0];

        return {
          url: href,
          title: (titleEl?.textContent ?? '').trim(),
          company: (companyEl?.textContent ?? '').trim(),
          location: (locationEl?.textContent ?? '').trim(),
        };
      }).filter(j => j.url && j.title);
    }, SELECTORS);
  }

  private async scrapeJobDetail(
    page: Page,
    link: { url: string; title: string; company: string; location: string },
    config: ScraperConfig
  ): Promise<ScrapedJob | null> {
    const loaded = await this.safeGoto(page, link.url, config);
    if (!loaded) return null;

    let description = '';
    for (const selector of SELECTORS.description.split(', ')) {
      description = await this.safeText(page, selector.trim());
      if (description.length > 50) break;
    }

    if (!description || description.length < 30) {
      this.warn(`Description too short at ${link.url}, using card data.`);
      description = `[Limited description] ${link.title}`;
    }

    return {
      title: link.title,
      company: link.company || 'Unknown',
      location: link.location || 'Unknown',
      description,
      url: link.url,
      date_posted: null,
      source_name: 'Glassdoor',
      scraped_at: new Date().toISOString(),
    };
  }
}
