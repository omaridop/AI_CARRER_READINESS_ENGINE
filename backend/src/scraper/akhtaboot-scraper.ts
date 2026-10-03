/**
 * Akhtaboot scraper for Junior Data Analyst jobs in Jordan.
 *
 * Akhtaboot is a Jordan-focused career platform. Public job search
 * results are accessible without authentication.
 *
 * URL pattern: https://www.akhtaboot.com/en/jordan/jobs?keyword=data+analyst
 *
 * Selectors are documented inline for easy maintenance when the site
 * updates its HTML structure.
 */

import { Page } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScrapedJob } from './types';

/**
 * CSS selectors for Akhtaboot — update these when the site changes.
 * Last verified: September 2026.
 */
const SELECTORS = {
  /** Each job card on the search results page */
  jobCard: '.job-listing, .job-item, .search-result, article.job, [class*="job-card"]',
  /** Job title link within a card */
  titleLink: 'h2 a, h3 a, .job-title a, a[class*="title"]',
  /** Company name within a card */
  company: '.company-name, .employer, [class*="company"]',
  /** Location within a card */
  location: '.location, .job-location, [class*="location"]',
  /** Next page button */
  nextPage: 'a.next, .pagination a[rel="next"], a[aria-label="Next"]',

  // Detail page selectors
  /** Full job description on the detail page */
  description: '.job-description, .description, #job-description, [class*="description"]',
  /** Posted date on the detail page */
  datePosted: '.date, .posted-date, time, [class*="date"]',
};

export class AkhtabootScraper extends BaseScraper {
  readonly sourceName = 'Akhtaboot';

  /**
   * Scrape Akhtaboot search results for data analyst jobs in Jordan.
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

        // Wait for page content to load
        try {
          await page.waitForSelector(SELECTORS.jobCard, { timeout: 10_000 });
        } catch {
          // Try to find any job-related content
          this.warn(`No job cards found on page ${pageNum} with primary selectors.`);

          // Fallback: look for any links that look like job postings
          const fallbackLinks = await this.extractFallbackLinks(page);
          if (fallbackLinks.length === 0) {
            this.warn('No job links found with fallback either. Site may have changed.');
            break;
          }
          this.log(`Found ${fallbackLinks.length} job links via fallback.`);

          for (const link of fallbackLinks) {
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
          continue;
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
    const base = `https://www.akhtaboot.com/en/jordan/jobs?keyword=${query}`;
    return pageNum > 1 ? `${base}&page=${pageNum}` : base;
  }

  private async extractJobLinks(page: Page): Promise<{ url: string; title: string; company: string; location: string }[]> {
    return page.$$eval(SELECTORS.jobCard, (cards, selectors) => {
      return cards.map(card => {
        const titleEl = card.querySelector(selectors.titleLink);
        const companyEl = card.querySelector(selectors.company);
        const locationEl = card.querySelector(selectors.location);

        const href = titleEl?.getAttribute('href') ?? '';
        const url = href.startsWith('http')
          ? href
          : `https://www.akhtaboot.com${href}`;

        return {
          url,
          title: (titleEl?.textContent ?? '').trim(),
          company: (companyEl?.textContent ?? '').trim(),
          location: (locationEl?.textContent ?? '').trim(),
        };
      }).filter(j => j.url && j.title);
    }, { titleLink: SELECTORS.titleLink, company: SELECTORS.company, location: SELECTORS.location });
  }

  /** Fallback: extract any links that look like job posting URLs. */
  private async extractFallbackLinks(page: Page): Promise<{ url: string; title: string; company: string; location: string }[]> {
    return page.$$eval('a[href*="/job"], a[href*="/jobs/"], a[href*="job-"]', (links) => {
      const seen = new Set<string>();
      return links
        .map(a => {
          const href = a.getAttribute('href') ?? '';
          const url = href.startsWith('http') ? href : `https://www.akhtaboot.com${href}`;
          const title = (a.textContent ?? '').trim();
          return { url, title, company: '', location: 'Jordan' };
        })
        .filter(j => {
          if (!j.title || j.title.length < 3 || seen.has(j.url)) return false;
          seen.add(j.url);
          return true;
        });
    });
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
      description = await this.safeText(page, 'main') || await this.safeText(page, '#content');
    }

    if (!description || description.length < 30) {
      this.warn(`Description too short at ${link.url}, skipping.`);
      return null;
    }

    // Try to get the date
    let datePosted: string | null = null;
    for (const selector of SELECTORS.datePosted.split(', ')) {
      const dateText = await this.safeText(page, selector.trim());
      if (dateText) {
        const parsed = this.parseDate(dateText);
        if (parsed) { datePosted = parsed; break; }
      }
    }

    // Try to get company name from the detail page if missing
    let company = link.company;
    if (!company) {
      company = await this.safeText(page, '.company-name, .employer, [class*="company"]');
    }

    return {
      title: link.title,
      company: company || 'Unknown',
      location: link.location || 'Jordan',
      description,
      url: link.url,
      date_posted: datePosted,
      source_name: 'Akhtaboot',
      scraped_at: new Date().toISOString(),
    };
  }

  /** Best-effort date parsing from various text formats. */
  private parseDate(text: string): string | null {
    const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return isoMatch[0];
    const d = new Date(text);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return null;
  }
}
