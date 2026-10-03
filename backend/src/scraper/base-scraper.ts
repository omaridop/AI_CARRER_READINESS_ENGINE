/**
 * Base scraper class providing common Playwright browser automation.
 *
 * Handles browser lifecycle, rate limiting, retry logic, and User-Agent
 * spoofing. Concrete scrapers extend this and implement site-specific
 * extraction methods.
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ScraperConfig, ScrapedJob } from './types';

/** Maximum retry attempts per page load. */
const MAX_RETRIES = 3;

/** Realistic desktop User-Agent string. */
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export abstract class BaseScraper {
  /** Display name for logging (e.g. "Bayt.com"). */
  abstract readonly sourceName: string;

  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;

  // ── Lifecycle ──────────────────────────────────────────

  /** Launch browser with realistic settings. */
  async init(headless: boolean = true): Promise<void> {
    this.log('Launching browser…');
    this.browser = await chromium.launch({
      headless,
      args: ['--disable-blink-features=AutomationControlled'],
    });
    this.context = await this.browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1366, height: 768 },
      locale: 'en-US',
    });
  }

  /** Close browser and release resources. */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.log('Browser closed.');
  }

  // ── Abstract methods ───────────────────────────────────

  /**
   * Scrape job listings. Concrete scrapers implement the
   * search-page parsing and detail-page extraction here.
   */
  abstract scrape(config: ScraperConfig): Promise<ScrapedJob[]>;

  // ── Helpers ────────────────────────────────────────────

  /** Create a new page within the shared browser context. */
  protected async newPage(): Promise<Page> {
    if (!this.context) throw new Error('Browser not initialized. Call init() first.');
    return this.context.newPage();
  }

  /**
   * Navigate to a URL with retry logic and rate-limiting delay.
   * Returns true on success, false after exhausting retries.
   */
  protected async safeGoto(
    page: Page,
    url: string,
    config: ScraperConfig,
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.delay(config.delayMs);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.warn(`Attempt ${attempt}/${MAX_RETRIES} failed for ${url}: ${msg}`);
        if (attempt === MAX_RETRIES) return false;
        // Exponential backoff
        await this.delay(config.delayMs * attempt);
      }
    }
    return false;
  }

  /** Wait for a specified duration (rate limiting). */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Safely extract text content from a selector, returning empty string on failure. */
  protected async safeText(page: Page, selector: string): Promise<string> {
    try {
      const el = await page.$(selector);
      if (!el) return '';
      const text = await el.textContent();
      return (text ?? '').trim();
    } catch {
      return '';
    }
  }

  /** Safely extract an attribute from an element. */
  protected async safeAttr(page: Page, selector: string, attr: string): Promise<string> {
    try {
      const el = await page.$(selector);
      if (!el) return '';
      const value = await el.getAttribute(attr);
      return (value ?? '').trim();
    } catch {
      return '';
    }
  }

  // ── Logging ────────────────────────────────────────────

  protected log(message: string): void {
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`  🤖 [${ts}] [${this.sourceName}] ${message}`);
  }

  protected warn(message: string): void {
    const ts = new Date().toISOString().slice(11, 19);
    console.warn(`  ⚠️  [${ts}] [${this.sourceName}] ${message}`);
  }

  protected error(message: string): void {
    const ts = new Date().toISOString().slice(11, 19);
    console.error(`  ❌ [${ts}] [${this.sourceName}] ${message}`);
  }
}
