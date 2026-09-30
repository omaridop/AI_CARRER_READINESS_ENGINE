/**
 * LinkedIn public jobs scraper for Junior Data Analyst jobs in Jordan.
 *
 * Scrapes ONLY public LinkedIn job search results — no login required.
 * LinkedIn public search at /jobs/search/ shows basic listings without
 * authentication, but is aggressive with rate limiting.
 *
 * IMPORTANT: Uses longer delays (4-6 seconds) and limits to 1-2 pages
 * to avoid being blocked. LinkedIn may still block requests from
 * automated browsers; fallback logic handles this gracefully.
 *
 * URL pattern: https://www.linkedin.com/jobs/search/?keywords=data+analyst&location=Jordan
 */

import { Page } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScrapedJob } from './types';

/**
 * CSS selectors for LinkedIn public job search.
 * LinkedIn frequently changes their class names.
 * Last verified: September 2026.
 */
const SELECTORS = {
  /** Job cards in public search results */
  jobCard: '.base-card, .job-search-card, [data-entity-urn*="jobPosting"], .result-card',
  /** Title link within a card */
  titleLink: '.base-card__full-link, .base-search-card__title, h3.base-search-card__title',
  /** Company name */
  company: '.base-search-card__subtitle, h4.base-search-card__subtitle, .job-search-card__company-name',
  /** Location */
  location: '.job-search-card__location, .base-search-card__metadata span',
  /** Date */
  datePosted: '.job-search-card__listdate, time[datetime]',
  /** "Show more" / "See more jobs" button */
  showMore: 'button.infinite-scroller__show-more-button, button[aria-label="See more jobs"]',

  // Detail page selectors (public job view)
  /** Job description on detail page */
  description: '.description__text, .show-more-less-html__markup, .core-section-container__content',
};

/** LinkedIn needs longer delays to avoid rate limiting. */
const LINKEDIN_DELAY_MS = 5000;

export class LinkedInScraper extends BaseScraper {
  readonly sourceName = 'LinkedIn';

  /**
   * Scrape LinkedIn public job search results.
   * LinkedIn's public search uses infinite scroll rather than pagination.
   * We scroll down and click "Show more" to load additional results.
   */
  async scrape(config: ScraperConfig): Promise<ScrapedJob[]> {
    if (!this.browser) await this.init(config.headless);
    const page = await this.newPage();
    const jobs: ScrapedJob[] = [];
    const seenUrls = new Set<string>();

    // Use longer delays for LinkedIn
    const linkedInConfig = { ...config, delayMs: Math.max(config.delayMs, LINKEDIN_DELAY_MS) };

    try {
      const searchUrl = this.buildSearchUrl(config);
      this.log(`Loading: ${searchUrl}`);

      const loaded = await this.safeGoto(page, searchUrl, linkedInConfig);
      if (!loaded) {
        this.error('Failed to load LinkedIn search page.');
        return jobs;
      }

      // Check if we got blocked or redirected to login
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/authwall')) {
        this.warn('LinkedIn redirected to login page. Public access may be limited.');
        return jobs;
      }

      // Wait for job cards
      try {
        await page.waitForSelector(SELECTORS.jobCard, { timeout: 15_000 });
      } catch {
        this.warn('No job cards found. LinkedIn may have changed layout or blocked access.');
        return jobs;
      }

      // Scroll and load more results (simulate pagination via infinite scroll)
      for (let loadAttempt = 0; loadAttempt < config.maxPages; loadAttempt++) {
        // Scroll to bottom to trigger lazy loading
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await this.delay(2000);

        // Click "Show more" button if present
        try {
          const showMore = await page.$(SELECTORS.showMore);
          if (showMore && await showMore.isVisible()) {
            await showMore.click();
            await this.delay(linkedInConfig.delayMs);
          }
        } catch {
          // No more results to load
          break;
        }
      }

      // Extract all job cards from the fully loaded page
      const links = await this.extractJobLinks(page);
      this.log(`Found ${links.length} job links total.`);

      // Visit each job detail page
      for (const link of links) {
        if (seenUrls.has(link.url)) continue;
        seenUrls.add(link.url);

        try {
          const job = await this.scrapeJobDetail(page, link, linkedInConfig);
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

  // ── Private helpers ────────────────────────────────────

  private buildSearchUrl(config: ScraperConfig): string {
    const keywords = encodeURIComponent(config.searchQuery);
    const location = encodeURIComponent(config.location);
    return `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${location}&trk=public_jobs_jobs-search-bar_search-submit`;
  }

  private async extractJobLinks(page: Page): Promise<{ url: string; title: string; company: string; location: string; date: string | null }[]> {
    return page.$$eval(SELECTORS.jobCard, (cards, selectors) => {
      return cards.map(card => {
        const titleEl = card.querySelector(selectors.titleLink);
        const companyEl = card.querySelector(selectors.company);
        const locationEl = card.querySelector(selectors.location);
        const timeEl = card.querySelector(selectors.datePosted);

        let href = titleEl?.getAttribute('href') ?? '';
        // Clean up LinkedIn tracking params
        if (href.includes('?')) href = href.split('?')[0];
        const url = href.startsWith('http') ? href : `https://www.linkedin.com${href}`;

        return {
          url,
          title: (titleEl?.textContent ?? '').trim(),
          company: (companyEl?.textContent ?? '').trim(),
          location: (locationEl?.textContent ?? '').trim(),
          date: timeEl?.getAttribute('datetime') ?? null,
        };
      }).filter(j => j.url && j.title && j.url.includes('/jobs/'));
    }, {
      titleLink: SELECTORS.titleLink,
      company: SELECTORS.company,
      location: SELECTORS.location,
      datePosted: SELECTORS.datePosted,
    });
  }

  private async scrapeJobDetail(
    page: Page,
    link: { url: string; title: string; company: string; location: string; date: string | null },
    config: ScraperConfig,
  ): Promise<ScrapedJob | null> {
    const loaded = await this.safeGoto(page, link.url, config);
    if (!loaded) return null;

    // Check for login wall on detail page
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/authwall')) {
      this.warn(`LinkedIn requires login for ${link.url}. Using card data only.`);
      // Return with limited info from the search card
      return link.title ? {
        title: link.title,
        company: link.company || 'Unknown',
        location: link.location || 'Jordan',
        description: `[Description requires LinkedIn login] Title: ${link.title}`,
        url: link.url,
        date_posted: link.date,
        source_name: 'LinkedIn',
        scraped_at: new Date().toISOString(),
      } : null;
    }

    // Try multiple selectors for the description
    let description = '';
    for (const selector of SELECTORS.description.split(', ')) {
      description = await this.safeText(page, selector.trim());
      if (description.length > 50) break;
    }

    if (!description || description.length < 30) {
      // Try clicking "Show more" on the description
      try {
        const showMoreBtn = await page.$('button[aria-label="Show more"], .show-more-less-html__button');
        if (showMoreBtn) {
          await showMoreBtn.click();
          await this.delay(500);
          for (const selector of SELECTORS.description.split(', ')) {
            description = await this.safeText(page, selector.trim());
            if (description.length > 50) break;
          }
        }
      } catch {
        // Ignore click failures
      }
    }

    if (!description || description.length < 30) {
      this.warn(`Description too short at ${link.url}, using card data.`);
      description = `[Limited description] ${link.title}`;
    }

    return {
      title: link.title,
      company: link.company || 'Unknown',
      location: link.location || 'Jordan',
      description,
      url: link.url,
      date_posted: link.date,
      source_name: 'LinkedIn',
      scraped_at: new Date().toISOString(),
    };
  }
}
