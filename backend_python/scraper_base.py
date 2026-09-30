import asyncio
from datetime import datetime
from typing import Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from scraper_types import ScraperConfig, ScrapedJob

MAX_RETRIES = 3
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

class BaseScraper:
    sourceName: str = "Base"

    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None

    async def init(self, headless: bool = True):
        self.log('Launching browser...')
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=headless,
            args=['--disable-blink-features=AutomationControlled']
        )
        self.context = await self.browser.new_context(
            user_agent=USER_AGENT,
            viewport={'width': 1366, 'height': 768},
            locale='en-US'
        )

    async def close(self):
        if self.context:
            await self.context.close()
            self.context = None
        if self.browser:
            await self.browser.close()
            self.browser = None
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
        self.log('Browser closed.')

    async def scrape(self, config: ScraperConfig) -> list[ScrapedJob]:
        raise NotImplementedError()

    async def newPage(self) -> Page:
        if not self.context:
            raise Exception('Browser not initialized. Call init() first.')
        return await self.context.new_page()

    async def safeGoto(self, page: Page, url: str, config: ScraperConfig) -> bool:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                await self.delay(config.delayMs)
                await page.goto(url, wait_until='domcontentloaded', timeout=30_000)
                return True
            except Exception as e:
                msg = str(e)
                self.warn(f"Attempt {attempt}/{MAX_RETRIES} failed for {url}: {msg}")
                if attempt == MAX_RETRIES:
                    return False
                await self.delay(config.delayMs * attempt)
        return False

    async def delay(self, ms: int):
        await asyncio.sleep(ms / 1000.0)

    async def safeText(self, page: Page, selector: str) -> str:
        try:
            el = await page.query_selector(selector)
            if not el:
                return ''
            text = await el.text_content()
            return text.strip() if text else ''
        except:
            return ''

    async def safeAttr(self, page: Page, selector: str, attr: str) -> str:
        try:
            el = await page.query_selector(selector)
            if not el:
                return ''
            value = await el.get_attribute(attr)
            return value.strip() if value else ''
        except:
            return ''

    def log(self, message: str):
        ts = datetime.now().isoformat()[11:19]
        print(f"  🤖 [{ts}] [{self.sourceName}] {message}")

    def warn(self, message: str):
        ts = datetime.now().isoformat()[11:19]
        print(f"  ⚠️  [{ts}] [{self.sourceName}] {message}")

    def error(self, message: str):
        ts = datetime.now().isoformat()[11:19]
        print(f"  ❌ [{ts}] [{self.sourceName}] {message}")
