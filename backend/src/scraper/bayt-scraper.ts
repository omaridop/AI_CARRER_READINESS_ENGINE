/**
 * Bayt.com scraper for Junior Data Analyst jobs in Jordan.
 *
 * Bayt.com is the largest MENA job board. Public job search results
 * and individual job pages are accessible without authentication.
 *
 * URL pattern: https://www.bayt.com/en/jordan/jobs/?keyword=data+analyst
 *
 * Selectors are documented inline for easy maintenance when the site
 * updates its HTML structure.
 */

import { Page } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScrapedJob } from './types';

/**
 * CSS selectors for Bayt.com — update these when the site changes.
 * Last verified: September 2026.
 */
const SELECTORS = {
  /** Each job card on the search results page */
  jobCard: '[data-js-aid="jobListing"], .has-pointer-d, li[data-job-id]',
  /** Job title link within a card */
  titleLink: 'h2 a, .jb-title a, a[data-js-aid="jobTitle"]',
  /** Company name within a card */
  company: '.t-mute, .jb-company, [data-js-aid="company"]',
  /** Location within a card */
  location: '.t-mute .loc, [data-js-aid="location"], .jb-loc',
  /** Next page button */
  nextPage: 'a[aria-label="Next"], .pagination a.next, a.paginate-next',

  // Detail page selectors
  /** Full job description on the detail page */
  description: '[data-automation-id="jobDescription"], .db-description, #job_description, .t-break',
  /** Posted date on the detail page */
  datePosted: '.t-mute time, [data-automation-id="postedDate"], .db-posted',
};

export class BaytScraper extends BaseScraper {
  readonly sourceName = 'Bayt.com';

  /**
   * Scrape Bayt.com search results for data analyst jobs in Jordan.
   * Iterates through search result pages, then visits each job detail page.
   */
  async scrape(config: ScraperConfig): Promise<ScrapedJob[]> {
    if (!this.browser) await this.init(config.headless);
    const page = await this.newPage();
    const jobs: ScrapedJob[] = [];
    const seenUrls = new Set<string>();

    try {
      for (let pageNum = 1; pageNum <= config.maxPages; pageNum++) {
        const searchUrl = this.buildSearchUrl(config, pageNum);
        this.log(`Page ${pageNum}/${config.maxPages}: ${searchUrl}`);

        const loaded = await this.safeGoto(page, searchUrl, config);
        if (!loaded) {
          this.warn(`Failed to load page ${pageNum}, skipping.`);
          continue;
        }

        // Wait for job cards to appear
        try {
          await page.waitForSelector(SELECTORS.jobCard, { timeout: 10_000 });
        } catch {
          this.warn(`No job cards found on page ${pageNum}. Site may have changed layout.`);
          break;
        }

        // Extract job listing links from this page
        const links = await this.extractJobLinks(page);
        this.log(`Found ${links.length} job links on page ${pageNum}.`);

        if (links.length === 0) break;

        // Visit each job detail page
        for (const link of links) {
          if (seenUrls.has(link.url)) continue;
          seenUrls.add(link.url);

          try {
            const job = await this.scrapeJobDetail(page, link, config);
            if (job) {
              jobs.push(job);
              this.log(`✓ Scraped: ${job.title} @ ${job.company}`);
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            this.warn(`Failed to scrape ${link.url}: ${msg}`);
          }
        }

        // Check for next page
        const hasNext = await page.$(SELECTORS.nextPage);
        if (!hasNext && pageNum < config.maxPages) {
          this.log('No more pages available.');
          break;
        }
      }
    } finally {
      await page.close();
    }

    this.log(`Total jobs scraped: ${jobs.length}`);
    return jobs;
  }

  // ── Private helpers ────────────────────────────────────

  private buildSearchUrl(config: ScraperConfig, pageNum: number): string {
    const query = encodeURIComponent(config.searchQuery);
    const base = `https://www.bayt.com/en/jordan/jobs/?keyword=${query}`;
    return pageNum > 1 ? `${base}&page=${pageNum}` : base;
  }

  private async extractJobLinks(page: Page): Promise<{ url: string; title: string; company: string; location: string }[]> {
    return page.$$eval(SELECTORS.jobCard, (cards, selectors) => {
      return cards.map(card => {
        const titleEl = card.querySelector(selectors.titleLink);
        const companyEl = card.querySelector(selectors.company);
        const locationEl = card.querySelector(selectors.location);

        const href = titleEl?.getAttribute('href') ?? '';
        const url = href.startsWith('http') ? href : `https://www.bayt.com${href}`;

        return {
          url,
          title: (titleEl?.textContent ?? '').trim(),
          company: (companyEl?.textContent ?? '').trim(),
          location: (locationEl?.textContent ?? '').trim(),
        };
      }).filter(j => j.url && j.title);
    }, { titleLink: SELECTORS.titleLink, company: SELECTORS.company, location: SELECTORS.location });
  }

  private async scrapeJobDetail(
    page: Page,
    link: { url: string; title: string; company: string; location: string },
    config: ScraperConfig,
  ): Promise<ScrapedJob | null> {
    const loaded = await this.safeGoto(page, link.url, config);
    if (!loaded) return null;

    // Try multiple selectors for the description
    let description = '';
    for (const selector of SELECTORS.description.split(', ')) {
      description = await this.safeText(page, selector.trim());
      if (description.length > 50) break;
    }

    // Fallback: try to get the body text from the main content area
    if (!description || description.length < 30) {
      description = await this.safeText(page, 'main') || await this.safeText(page, 'body');
      // Clean up the text by removing excessive whitespace
      description = description.replace(/\s+/g, ' ').trim();
    }

    if (!description || description.length < 30) {
      this.warn(`Description too short at ${link.url}, skipping.`);
      return null;
    }

    // Try to get the date
    let datePosted: string | null = null;
    const dateText = await this.safeText(page, SELECTORS.datePosted);
    if (dateText) {
      const parsed = this.parseDate(dateText);
      if (parsed) datePosted = parsed;
    }

    return {
      title: link.title,
      company: link.company,
      location: link.location || 'Jordan',
      description,
      url: link.url,
      date_posted: datePosted,
      source_name: 'Bayt.com',
      scraped_at: new Date().toISOString(),
    };
  }

  /** Best-effort date parsing from various text formats. */
  private parseDate(text: string): string | null {
    // Try ISO format first
    const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];

    // Try "DD Mon YYYY" or "Mon DD, YYYY"
    const d = new Date(text);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

    return null;
  }
}
