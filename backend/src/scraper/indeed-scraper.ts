/**
 * Indeed scraper.
 *
 * Scrapes job search results from Indeed. Indeed has strict anti-bot measures,
 * so this scraper implements graceful fallback.
 */

import { Page } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScrapedJob } from './types';

const SELECTORS = {
  jobCard: 'div.job_seen_beacon, td.resultContent',
  titleLink: 'h2.jobTitle a, a.jcs-JobTitle',
  company: 'span.companyName, span[data-testid="company-name"]',
  location: 'div.companyLocation, div[data-testid="text-location"]',
  description: '#jobDescriptionText',
};

const INDEED_DELAY_MS = 6000;

export class IndeedScraper extends BaseScraper {
  readonly sourceName = 'Indeed';

  async scrape(config: ScraperConfig): Promise<ScrapedJob[]> {
    if (!this.browser) await this.init(config.headless);
    const page = await this.newPage();
    const jobs: ScrapedJob[] = [];
    const seenUrls = new Set<string>();

    const indeedConfig = { ...config, delayMs: Math.max(config.delayMs, INDEED_DELAY_MS) };

    try {
      const searchUrl = this.buildSearchUrl(config);
      this.log(`Loading: ${searchUrl}`);

      const loaded = await this.safeGoto(page, searchUrl, indeedConfig);
      if (!loaded) {
        this.error('Failed to load Indeed search page.');
        return jobs;
      }

      // Check for Cloudflare/captcha
      const title = await page.title();
      if (title.toLowerCase().includes('cloudflare') || title.toLowerCase().includes('hcaptcha')) {
        this.warn('Indeed blocked the request with a captcha/anti-bot page.');
        return jobs;
      }

      try {
        await page.waitForSelector(SELECTORS.jobCard, { timeout: 15_000 });
      } catch {
        this.warn('No job cards found. Indeed layout may have changed or access blocked.');
        return jobs;
      }

      const links = await this.extractJobLinks(page);
      this.log(`Found ${links.length} job links total.`);

      for (const link of links) {
        if (seenUrls.has(link.url)) continue;
        seenUrls.add(link.url);

        try {
          const job = await this.scrapeJobDetail(page, link, indeedConfig);
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
    const location = encodeURIComponent(config.location);
    return `https://www.indeed.com/jobs?q=${query}&l=${location}`;
  }

  private async extractJobLinks(page: Page) {
    return page.$$eval(SELECTORS.jobCard, (cards, selectors) => {
      return cards.map(card => {
        const titleEl = card.querySelector(selectors.titleLink);
        const companyEl = card.querySelector(selectors.company);
        const locationEl = card.querySelector(selectors.location);

        let href = titleEl?.getAttribute('href') ?? '';
        if (href.startsWith('/')) {
          href = `https://www.indeed.com${href}`;
        }
        if (href.includes('&vjs=3')) href = href.split('&vjs=3')[0];

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

    const title = await page.title();
    if (title.toLowerCase().includes('cloudflare') || title.toLowerCase().includes('hcaptcha')) {
      this.warn(`Indeed blocked detail page ${link.url}. Using card data only.`);
      return link.title ? {
        title: link.title,
        company: link.company || 'Unknown',
        location: link.location || 'Unknown',
        description: `[Description requires Indeed login or blocked by anti-bot] Title: ${link.title}`,
        url: link.url,
        date_posted: null,
        source_name: 'Indeed',
        scraped_at: new Date().toISOString(),
      } : null;
    }

    const description = await this.safeText(page, SELECTORS.description);

    if (!description || description.length < 30) {
      this.warn(`Description too short at ${link.url}, using card data.`);
      return {
        title: link.title,
        company: link.company || 'Unknown',
        location: link.location || 'Unknown',
        description: `[Limited description] ${link.title}`,
        url: link.url,
        date_posted: null,
        source_name: 'Indeed',
        scraped_at: new Date().toISOString(),
      };
    }

    return {
      title: link.title,
      company: link.company || 'Unknown',
      location: link.location || 'Unknown',
      description,
      url: link.url,
      date_posted: null,
      source_name: 'Indeed',
      scraped_at: new Date().toISOString(),
    };
  }
}
