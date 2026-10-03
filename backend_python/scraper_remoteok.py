import urllib.parse
from datetime import datetime
from playwright.async_api import Page
from scraper_base import BaseScraper
from scraper_types import ScraperConfig, ScrapedJob

SELECTORS = {
    'jobCard': 'tr.job',
    'titleLink': 'h2[itemprop="title"]',
    'company': 'h3[itemprop="name"]',
    'location': 'div.location',
    'description': 'div.description',
    'expandBtn': 'tr.job',
}

class RemoteOKScraper(BaseScraper):
    sourceName = 'RemoteOK'

    async def scrape(self, config: ScraperConfig) -> list[ScrapedJob]:
        if not self.browser:
            await self.init(config.headless)
        page = await self.newPage()
        jobs: list[ScrapedJob] = []

        remoteOkConfig = ScraperConfig(
            searchQuery=config.searchQuery,
            location=config.location,
            maxPages=config.maxPages,
            delayMs=config.delayMs,
            headless=config.headless
        )

        try:
            searchUrl = self.buildSearchUrl(config)
            self.log(f"Loading: {searchUrl}")

            loaded = await self.safeGoto(page, searchUrl, remoteOkConfig)
            if not loaded:
                self.error('Failed to load RemoteOK search page.')
                return jobs

            try:
                await page.wait_for_selector(SELECTORS['jobCard'], timeout=15000)
            except:
                self.warn('No job cards found. RemoteOK layout may have changed.')
                return jobs

            js_code = """() => {
                const cards = Array.from(document.querySelectorAll('tr.job'));
                return cards.map(card => {
                    const id = card.getAttribute('data-id');
                    const url = id ? `https://remoteok.com/remote-jobs/${id}` : '';
                    
                    const titleEl = card.querySelector('h2[itemprop="title"]');
                    const companyEl = card.querySelector('h3[itemprop="name"]');
                    
                    const locationEls = Array.from(card.querySelectorAll('div.location'));
                    const location = locationEls.map(el => el.textContent?.trim() || '').filter(Boolean).join(', ');
                    
                    return {
                        url,
                        title: (titleEl?.textContent ?? '').trim(),
                        company: (companyEl?.textContent ?? '').trim(),
                        location,
                    };
                }).filter(j => j.url && j.title);
            }"""
            extractedJobs = await page.evaluate(js_code)
            self.log(f"Found {len(extractedJobs)} job links total.")

            for link in extractedJobs:
                try:
                    job = await self.scrapeJobDetail(page, link, remoteOkConfig)
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
        import re
        query = urllib.parse.quote(re.sub(r'\s+', '-', config.searchQuery).lower())
        return f"https://remoteok.com/remote-{query}-jobs"

    async def scrapeJobDetail(self, page: Page, link: dict, config: ScraperConfig) -> ScrapedJob | None:
        loaded = await self.safeGoto(page, link['url'], config)
        if not loaded:
            return None

        description = await self.safeText(page, 'div.description, div[itemprop="description"]')

        if not description or len(description) < 30:
            self.warn(f"Description too short at {link['url']}, using card data.")

        desc_to_use = description if description and len(description) > 30 else f"[Limited description] {link['title']}"

        return ScrapedJob(
            title=link['title'],
            company=link['company'] or 'Unknown',
            location=link['location'] or 'Remote',
            description=desc_to_use,
            url=link['url'],
            date_posted=None,
            source_name='RemoteOK',
            scraped_at=datetime.now().isoformat()
        )
