import urllib.parse
from datetime import datetime
from playwright.async_api import Page
from scraper_base import BaseScraper
from scraper_types import ScraperConfig, ScrapedJob

SELECTORS = {
    'jobCard': 'div.job_seen_beacon, td.resultContent',
    'titleLink': 'h2.jobTitle a, a.jcs-JobTitle',
    'company': 'span.companyName, span[data-testid="company-name"]',
    'location': 'div.companyLocation, div[data-testid="text-location"]',
    'description': '#jobDescriptionText',
}

INDEED_DELAY_MS = 6000

class IndeedScraper(BaseScraper):
    sourceName = 'Indeed'

    async def scrape(self, config: ScraperConfig) -> list[ScrapedJob]:
        if not self.browser:
            await self.init(config.headless)
        page = await self.newPage()
        jobs: list[ScrapedJob] = []
        seenUrls = set()

        indeedConfig = ScraperConfig(
            searchQuery=config.searchQuery,
            location=config.location,
            maxPages=config.maxPages,
            delayMs=max(config.delayMs, INDEED_DELAY_MS),
            headless=config.headless
        )

        try:
            searchUrl = self.buildSearchUrl(config)
            self.log(f"Loading: {searchUrl}")

            loaded = await self.safeGoto(page, searchUrl, indeedConfig)
            if not loaded:
                self.error('Failed to load Indeed search page.')
                return jobs

            title = await page.title()
            if 'cloudflare' in title.lower() or 'hcaptcha' in title.lower():
                self.warn('Indeed blocked the request with a captcha/anti-bot page.')
                return jobs

            try:
                await page.wait_for_selector(SELECTORS['jobCard'], timeout=15000)
            except:
                self.warn('No job cards found. Indeed layout may have changed or access blocked.')
                return jobs

            links = await self.extractJobLinks(page)
            self.log(f"Found {len(links)} job links total.")

            for link in links:
                if link['url'] in seenUrls:
                    continue
                seenUrls.add(link['url'])

                try:
                    job = await self.scrapeJobDetail(page, link, indeedConfig)
                    if job:
                        jobs.append(job)
                        self.log(f"✓ Scraped: {job.title} @ {job.company}")
                except Exception as e:
                    self.warn(f"Failed to scrape {link['url']}: {str(e)}")
        finally:
            await page.close()

        self.log(f"Total jobs scraped: {len(jobs)}")
        return jobs

    def buildSearchUrl(self, config: ScraperConfig) -> str:
        query = urllib.parse.quote(config.searchQuery)
        location = urllib.parse.quote(config.location)
        return f"https://www.indeed.com/jobs?q={query}&l={location}"

    async def extractJobLinks(self, page: Page) -> list[dict]:
        js_code = """(selectors) => {
            const cards = Array.from(document.querySelectorAll(selectors.jobCard));
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
        }"""
        return await page.evaluate(js_code, SELECTORS)

    async def scrapeJobDetail(self, page: Page, link: dict, config: ScraperConfig) -> ScrapedJob | None:
        loaded = await self.safeGoto(page, link['url'], config)
        if not loaded:
            return None

        title = await page.title()
        if 'cloudflare' in title.lower() or 'hcaptcha' in title.lower():
            self.warn(f"Indeed blocked detail page {link['url']}. Using card data only.")
            if link['title']:
                return ScrapedJob(
                    title=link['title'],
                    company=link['company'] or 'Unknown',
                    location=link['location'] or 'Unknown',
                    description=f"[Description requires Indeed login or blocked by anti-bot] Title: {link['title']}",
                    url=link['url'],
                    date_posted=None,
                    source_name='Indeed',
                    scraped_at=datetime.now().isoformat()
                )
            return None

        description = await self.safeText(page, SELECTORS['description'])

        if not description or len(description) < 30:
            self.warn(f"Description too short at {link['url']}, using card data.")
            return ScrapedJob(
                title=link['title'],
                company=link['company'] or 'Unknown',
                location=link['location'] or 'Unknown',
                description=f"[Limited description] {link['title']}",
                url=link['url'],
                date_posted=None,
                source_name='Indeed',
                scraped_at=datetime.now().isoformat()
            )

        return ScrapedJob(
            title=link['title'],
            company=link['company'] or 'Unknown',
            location=link['location'] or 'Unknown',
            description=description,
            url=link['url'],
            date_posted=None,
            source_name='Indeed',
            scraped_at=datetime.now().isoformat()
        )
