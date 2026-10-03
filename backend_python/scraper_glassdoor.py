import urllib.parse
from datetime import datetime
from playwright.async_api import Page
from scraper_base import BaseScraper
from scraper_types import ScraperConfig, ScrapedJob

SELECTORS = {
    'jobCard': 'li[data-test="jobListing"]',
    'titleLink': 'a[data-test="job-link"]',
    'company': 'span.EmployerProfile_employerName__Cq9Sy, .job-search-key-l2wjgv',
    'location': 'div[data-test="emp-location"]',
    'description': '.JobDetails_jobDescription__uW_fK, #JobDescriptionContainer',
}

GLASSDOOR_DELAY_MS = 5000

class GlassdoorScraper(BaseScraper):
    sourceName = 'Glassdoor'

    async def scrape(self, config: ScraperConfig) -> list[ScrapedJob]:
        if not self.browser:
            await self.init(config.headless)
        page = await self.newPage()
        jobs: list[ScrapedJob] = []
        seenUrls = set()

        glassdoorConfig = ScraperConfig(
            searchQuery=config.searchQuery,
            location=config.location,
            maxPages=config.maxPages,
            delayMs=max(config.delayMs, GLASSDOOR_DELAY_MS),
            headless=config.headless
        )

        try:
            searchUrl = self.buildSearchUrl(config)
            self.log(f"Loading: {searchUrl}")

            loaded = await self.safeGoto(page, searchUrl, glassdoorConfig)
            if not loaded:
                self.error('Failed to load Glassdoor search page.')
                return jobs

            try:
                await page.wait_for_selector(SELECTORS['jobCard'], timeout=15000)
            except:
                self.warn('No job cards found. Glassdoor layout may have changed or access blocked.')
                return jobs

            links = await self.extractJobLinks(page)
            self.log(f"Found {len(links)} job links total.")

            for link in links:
                if link['url'] in seenUrls:
                    continue
                seenUrls.add(link['url'])

                try:
                    job = await self.scrapeJobDetail(page, link, glassdoorConfig)
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
        return f"https://www.glassdoor.com/Job/jobs.htm?sc.keyword={query}"

    async def extractJobLinks(self, page: Page) -> list[dict]:
        js_code = """(selectors) => {
            const cards = Array.from(document.querySelectorAll(selectors.jobCard));
            return cards.map(card => {
                const titleEl = card.querySelector(selectors.titleLink);
                const companyEl = card.querySelector(selectors.company);
                const locationEl = card.querySelector(selectors.location);

                let href = titleEl?.getAttribute('href') ?? '';
                if (href.startsWith('/')) {
                    href = `https://www.glassdoor.com${href}`;
                }
                
                if (href.includes('?')) href = href.split('?')[0];

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

        description = ''
        for selector in SELECTORS['description'].split(', '):
            description = await self.safeText(page, selector.strip())
            if len(description) > 50:
                break

        if not description or len(description) < 30:
            self.warn(f"Description too short at {link['url']}, using card data.")
            description = f"[Limited description] {link['title']}"

        return ScrapedJob(
            title=link['title'],
            company=link['company'] or 'Unknown',
            location=link['location'] or 'Unknown',
            description=description,
            url=link['url'],
            date_posted=None,
            source_name='Glassdoor',
            scraped_at=datetime.now().isoformat()
        )
