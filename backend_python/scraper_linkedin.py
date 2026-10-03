import urllib.parse
from datetime import datetime
from playwright.async_api import Page
from scraper_base import BaseScraper
from scraper_types import ScraperConfig, ScrapedJob

SELECTORS = {
    'jobCard': '.base-card, .job-search-card, [data-entity-urn*="jobPosting"], .result-card',
    'titleLink': '.base-card__full-link, .base-search-card__title, h3.base-search-card__title',
    'company': '.base-search-card__subtitle, h4.base-search-card__subtitle, .job-search-card__company-name',
    'location': '.job-search-card__location, .base-search-card__metadata span',
    'datePosted': '.job-search-card__listdate, time[datetime]',
    'showMore': 'button.infinite-scroller__show-more-button, button[aria-label="See more jobs"]',
    'description': '.description__text, .show-more-less-html__markup, .core-section-container__content',
}

LINKEDIN_DELAY_MS = 5000

class LinkedInScraper(BaseScraper):
    sourceName = 'LinkedIn'

    async def scrape(self, config: ScraperConfig) -> list[ScrapedJob]:
        if not self.browser:
            await self.init(config.headless)
        page = await self.newPage()
        jobs: list[ScrapedJob] = []
        seenUrls = set()

        linkedInConfig = ScraperConfig(
            searchQuery=config.searchQuery,
            location=config.location,
            maxPages=config.maxPages,
            delayMs=max(config.delayMs, LINKEDIN_DELAY_MS),
            headless=config.headless
        )

        try:
            searchUrl = self.buildSearchUrl(config)
            self.log(f"Loading: {searchUrl}")

            loaded = await self.safeGoto(page, searchUrl, linkedInConfig)
            if not loaded:
                self.error('Failed to load LinkedIn search page.')
                return jobs

            currentUrl = page.url
            if '/login' in currentUrl or '/authwall' in currentUrl:
                self.warn('LinkedIn redirected to login page. Public access may be limited.')
                return jobs

            try:
                await page.wait_for_selector(SELECTORS['jobCard'], timeout=15000)
            except:
                self.warn('No job cards found. LinkedIn may have changed layout or blocked access.')
                return jobs

            for loadAttempt in range(config.maxPages):
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await self.delay(2000)

                try:
                    showMore = await page.query_selector(SELECTORS['showMore'])
                    if showMore and await showMore.is_visible():
                        await showMore.click()
                        await self.delay(linkedInConfig.delayMs)
                except:
                    break

            links = await self.extractJobLinks(page)
            self.log(f"Found {len(links)} job links total.")

            for link in links:
                if link['url'] in seenUrls:
                    continue
                seenUrls.add(link['url'])

                try:
                    job = await self.scrapeJobDetail(page, link, linkedInConfig)
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
        keywords = urllib.parse.quote(config.searchQuery)
        location = urllib.parse.quote(config.location)
        return f"https://www.linkedin.com/jobs/search/?keywords={keywords}&location={location}&trk=public_jobs_jobs-search-bar_search-submit"

    async def extractJobLinks(self, page: Page) -> list[dict]:
        js_code = """(selectors) => {
            const cards = Array.from(document.querySelectorAll(selectors.jobCard));
            return cards.map(card => {
                const titleEl = card.querySelector(selectors.titleLink);
                const companyEl = card.querySelector(selectors.company);
                const locationEl = card.querySelector(selectors.location);
                const timeEl = card.querySelector(selectors.datePosted);

                let href = titleEl?.getAttribute('href') ?? '';
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
        }"""
        return await page.evaluate(js_code, SELECTORS)

    async def scrapeJobDetail(self, page: Page, link: dict, config: ScraperConfig) -> ScrapedJob | None:
        loaded = await self.safeGoto(page, link['url'], config)
        if not loaded:
            return None

        currentUrl = page.url
        if '/login' in currentUrl or '/authwall' in currentUrl:
            self.warn(f"LinkedIn requires login for {link['url']}. Using card data only.")
            if link['title']:
                return ScrapedJob(
                    title=link['title'],
                    company=link['company'] or 'Unknown',
                    location=link['location'] or 'Jordan',
                    description=f"[Description requires LinkedIn login] Title: {link['title']}",
                    url=link['url'],
                    date_posted=link['date'],
                    source_name='LinkedIn',
                    scraped_at=datetime.now().isoformat()
                )
            return None

        description = ''
        for selector in SELECTORS['description'].split(', '):
            description = await self.safeText(page, selector.strip())
            if len(description) > 50:
                break

        if not description or len(description) < 30:
            try:
                showMoreBtn = await page.query_selector('button[aria-label="Show more"], .show-more-less-html__button')
                if showMoreBtn:
                    await showMoreBtn.click()
                    await self.delay(500)
                    for selector in SELECTORS['description'].split(', '):
                        description = await self.safeText(page, selector.strip())
                        if len(description) > 50:
                            break
            except:
                pass

        if not description or len(description) < 30:
            self.warn(f"Description too short at {link['url']}, using card data.")
            description = f"[Limited description] {link['title']}"

        return ScrapedJob(
            title=link['title'],
            company=link['company'] or 'Unknown',
            location=link['location'] or 'Jordan',
            description=description,
            url=link['url'],
            date_posted=link['date'],
            source_name='LinkedIn',
            scraped_at=datetime.now().isoformat()
        )
