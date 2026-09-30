from typing import List, Optional
from dataclasses import dataclass

@dataclass
class ScrapedJob:
    title: str
    company: str
    location: str
    description: str
    url: str
    date_posted: Optional[str]
    source_name: str
    scraped_at: str

@dataclass
class ScraperConfig:
    searchQuery: str = 'data analyst'
    location: str = 'Jordan'
    maxPages: int = 2
    delayMs: int = 3000
    headless: bool = True

@dataclass
class ScraperResult:
    source: str
    jobs: List[ScrapedJob]
    errors: List[str]
    scrapedAt: str
    durationMs: int
