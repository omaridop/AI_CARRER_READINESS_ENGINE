/**
 * RemoteOK scraper.
 *
 * Scrapes job search results from remoteok.com.
 */

import { Page } from 'playwright';
import { BaseScraper } from './base-scraper';
import { ScraperConfig, ScrapedJob } from './types';

const SELECTORS = {
  jobCard: 'tr.job',
  titleLink: 'h2[itemprop="title"]',
  company: 'h3[itemprop="name"]',
  location: 'div.location', // RemoteOK has locations like "Worldwide", "US Only"
  description: 'div.description', // Description might be on the main page via expansion
  expandBtn: 'tr.job', // Clicking the row expands the description
};

export class RemoteOKScraper extends BaseScraper {
  readonly sourceName = 'RemoteOK';

  async scrape(config: ScraperConfig): Promise<ScrapedJob[]> {
    if (!this.browser) await this.init(config.headless);
    const page = await this.newPage();
    const jobs: ScrapedJob[] = [];
    
    // RemoteOK is quite fast and simple, standard delay is fine
    const remoteOkConfig = { ...config };

    try {
      const searchUrl = this.buildSearchUrl(config);
      this.log(`Loading: ${searchUrl}`);

      const loaded = await this.safeGoto(page, searchUrl, remoteOkConfig);
      if (!loaded) {
        this.error('Failed to load RemoteOK search page.');
        return jobs;
      }

      try {
        await page.waitForSelector(SELECTORS.jobCard, { timeout: 15_000 });
      } catch {
        this.warn('No job cards found. RemoteOK layout may have changed.');
        return jobs;
      }

      // Extract jobs directly from the search page since RemoteOK expands descriptions inline
      const extractedJobs = await page.$$eval(SELECTORS.jobCard, (cards) => {
        return cards.map(card => {
          const id = card.getAttribute('data-id');
          const url = id ? `https://remoteok.com/remote-jobs/${id}` : '';
          
          const titleEl = card.querySelector('h2[itemprop="title"]');
          const companyEl = card.querySelector('h3[itemprop="name"]');
          
          // Locations are in multiple div.location tags
          const locationEls = Array.from(card.querySelectorAll('div.location')) as any[];
          const location = locationEls.map(el => el.textContent?.trim() || '').filter(Boolean).join(', ');
          
          // The description is usually loaded inline or linked.
          // Since it's often missing on the first load without JS interaction, we'll fetch it on detail page.
          
          return {
            url,
            title: (titleEl?.textContent ?? '').trim(),
            company: (companyEl?.textContent ?? '').trim(),
            location,
          };
        }).filter(j => j.url && j.title);
      });

      this.log(`Found ${extractedJobs.length} job links total.`);

      for (const link of extractedJobs) {
        try {
          const job = await this.scrapeJobDetail(page, link, remoteOkConfig);
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
    const query = encodeURIComponent(config.searchQuery.replace(/\s+/g, '-').toLowerCase());
    return `https://remoteok.com/remote-${query}-jobs`;
  }

  private async scrapeJobDetail(
    page: Page,
    link: { url: string; title: string; company: string; location: string },
    config: ScraperConfig
  ): Promise<ScrapedJob | null> {
    const loaded = await this.safeGoto(page, link.url, config);
    if (!loaded) return null;

    const description = await this.safeText(page, 'div.description, div[itemprop="description"]');

    if (!description || description.length < 30) {
      this.warn(`Description too short at ${link.url}, using card data.`);
    }

    return {
      title: link.title,
      company: link.company || 'Unknown',
      location: link.location || 'Remote',
      description: description && description.length > 30 ? description : `[Limited description] ${link.title}`,
      url: link.url,
      date_posted: null,
      source_name: 'RemoteOK',
      scraped_at: new Date().toISOString(),
    };
  }
}
