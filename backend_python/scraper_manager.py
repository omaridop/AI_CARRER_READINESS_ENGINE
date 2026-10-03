import os
import json
from datetime import datetime
from typing import List, Dict, Any, Callable, Optional, Tuple

from scraper_base import BaseScraper
from scraper_types import ScraperConfig, ScraperResult, ScrapedJob

SCRAPED_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'scraped'))

class ScraperManager:
    def __init__(self):
        self.scrapers: List[BaseScraper] = []

    def register(self, scraper: BaseScraper) -> None:
        self.scrapers.append(scraper)

    async def run_fallback_chain(self, config: Optional[ScraperConfig] = None, threshold: int = 15) -> List[ScrapedJob]:
        fullConfig = config if config else ScraperConfig()
        allJobs: List[ScrapedJob] = []

        print(f"[Scraper Chain] Target: {threshold} postings for \"{fullConfig.searchQuery}\"")

        for scraper in self.scrapers:
            if len(allJobs) >= threshold:
                break

            print(f"[Scraper Chain] Attempting source: {scraper.sourceName}...")
            try:
                jobs = await scraper.scrape(fullConfig)
                print(f"[Scraper Chain] {scraper.sourceName} yielded {len(jobs)} jobs.")
                allJobs.extend(jobs)
            except Exception as e:
                print(f"[Scraper Chain] {scraper.sourceName} failed: {str(e)}")
            finally:
                try:
                    await scraper.close()
                except:
                    pass

        if not allJobs:
            print("[Scraper Chain] All sources failed to retrieve any postings.")
        else:
            print(f"[Scraper Chain] Finished. Total merged jobs: {len(allJobs)}")

        return allJobs

    async def run_fallback_chain_with_progress(
        self,
        config: Optional[ScraperConfig] = None,
        threshold: int = 15,
        on_progress: Optional[Callable[[str, str, int], None]] = None
    ) -> List[ScrapedJob]:
        fullConfig = config if config else ScraperConfig()
        allJobs: List[ScrapedJob] = []

        print(f"[Scraper Chain] Target: {threshold} postings for \"{fullConfig.searchQuery}\"")

        for scraper in self.scrapers:
            if len(allJobs) >= threshold:
                break

            print(f"[Scraper Chain] Attempting source: {scraper.sourceName}...")
            if on_progress:
                on_progress(scraper.sourceName, 'trying', len(allJobs))

            try:
                jobs = await scraper.scrape(fullConfig)
                print(f"[Scraper Chain] {scraper.sourceName} yielded {len(jobs)} jobs.")
                allJobs.extend(jobs)
                if on_progress:
                    on_progress(scraper.sourceName, 'success', len(jobs))
            except Exception as e:
                print(f"[Scraper Chain] {scraper.sourceName} failed: {str(e)}")
                if on_progress:
                    on_progress(scraper.sourceName, 'failed', 0)
            finally:
                try:
                    await scraper.close()
                except:
                    pass

        if not allJobs:
            print("[Scraper Chain] All sources failed to retrieve any postings.")
        else:
            print(f"[Scraper Chain] Finished. Total merged jobs: {len(allJobs)}")

        return allJobs

    async def run_all(self, config: Optional[ScraperConfig] = None) -> List[ScraperResult]:
        fullConfig = config if config else ScraperConfig()
        results: List[ScraperResult] = []

        for scraper in self.scrapers:
            start = datetime.now()
            result = ScraperResult(
                source=scraper.sourceName,
                jobs=[],
                errors=[],
                scrapedAt=datetime.now().isoformat(),
                durationMs=0
            )

            try:
                result.jobs = await scraper.scrape(fullConfig)
            except Exception as e:
                result.errors.append(str(e))
            finally:
                try:
                    await scraper.close()
                except:
                    pass

            result.durationMs = int((datetime.now() - start).total_seconds() * 1000)
            results.append(result)
            self.save_result(result)

        self.save_combined(results)
        return results

    async def run_source(self, sourceName: str, config: Optional[ScraperConfig] = None) -> Optional[ScraperResult]:
        scraper = next((s for s in self.scrapers if s.sourceName.lower() == sourceName.lower()), None)
        if not scraper:
            return None

        fullConfig = config if config else ScraperConfig()
        start = datetime.now()
        result = ScraperResult(
            source=scraper.sourceName,
            jobs=[],
            errors=[],
            scrapedAt=datetime.now().isoformat(),
            durationMs=0
        )

        try:
            result.jobs = await scraper.scrape(fullConfig)
        except Exception as e:
            result.errors.append(str(e))
        finally:
            try:
                await scraper.close()
            except:
                pass

        result.durationMs = int((datetime.now() - start).total_seconds() * 1000)
        self.save_result(result)
        return result

    def deduplicate_against_existing(self, jobs: List[ScrapedJob]) -> Tuple[List[ScrapedJob], List[ScrapedJob]]:
        # Mock JOB_POSTINGS for deduplication as it requires full system integration
        existing_keys = set()
        
        new_jobs: List[ScrapedJob] = []
        duplicates: List[ScrapedJob] = []
        seen_keys = set()

        for job in jobs:
            key = self.normalize_key(job.title, job.company)
            if key in existing_keys or key in seen_keys:
                duplicates.append(job)
            else:
                seen_keys.add(key)
                new_jobs.append(job)

        return new_jobs, duplicates

    @staticmethod
    def to_job_posting_data(jobs: List[ScrapedJob]) -> List[Dict[str, Any]]:
        return [{
            'title': job.title,
            'company': job.company,
            'location': job.location,
            'source_label': 'real',
            'source_name': job.source_name,
            'description': job.description,
            'date_posted': job.date_posted,
        } for job in jobs]

    def save_result(self, result: ScraperResult) -> None:
        self.ensure_dir()
        date_str = datetime.now().strftime('%Y-%m-%d')
        source = "".join([c if c.isalnum() else '-' for c in result.source.lower()])
        file_path = os.path.join(SCRAPED_DIR, f"{date_str}-{source}.json")
        
        # Convert dataclasses to dicts before serialization
        from dataclasses import asdict
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(asdict(result), f, indent=2)

    def save_combined(self, results: List[ScraperResult]) -> None:
        self.ensure_dir()
        date_str = datetime.now().strftime('%Y-%m-%d')
        file_path = os.path.join(SCRAPED_DIR, f"{date_str}-combined.json")
        
        from dataclasses import asdict
        combined = {
            'scrapedAt': datetime.now().isoformat(),
            'totalJobs': sum(len(r.jobs) for r in results),
            'results': [asdict(r) for r in results],
        }
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(combined, f, indent=2)

    @staticmethod
    def load_latest(sourceName: Optional[str] = None) -> List[ScrapedJob]:
        if not os.path.exists(SCRAPED_DIR):
            return []

        files = sorted(
            [f for f in os.listdir(SCRAPED_DIR) if f.endswith('.json') and 'combined' not in f],
            reverse=True
        )

        if sourceName:
            normalized = "".join([c if c.isalnum() else '-' for c in sourceName.lower()])
            match = next((f for f in files if normalized in f), None)
            if not match:
                return []
            with open(os.path.join(SCRAPED_DIR, match), 'r', encoding='utf-8') as f:
                content = json.load(f)
                from scraper_types import ScrapedJob
                return [ScrapedJob(**job) for job in content.get('jobs', [])]

        all_jobs: List[ScrapedJob] = []
        seen_sources = set()
        for file in files:
            import re
            source = re.sub(r'^\d{4}-\d{2}-\d{2}-', '', file).replace('.json', '')
            if source in seen_sources:
                continue
            seen_sources.add(source)
            try:
                with open(os.path.join(SCRAPED_DIR, file), 'r', encoding='utf-8') as f:
                    content = json.load(f)
                    from scraper_types import ScrapedJob
                    all_jobs.extend([ScrapedJob(**job) for job in content.get('jobs', [])])
            except:
                pass
        return all_jobs

    def normalize_key(self, title: str, company: str) -> str:
        return f"{title.lower().strip()}|{company.lower().strip()}"

    def ensure_dir(self) -> None:
        if not os.path.exists(SCRAPED_DIR):
            os.makedirs(SCRAPED_DIR, exist_ok=True)
