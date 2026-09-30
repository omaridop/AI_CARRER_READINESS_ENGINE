import httpx
from typing import TypedDict, List
from course_search import search_course_web

class CourseResult(TypedDict):
    title: str
    url: str
    provider: str
    whyRelevant: str

async def verify_http_200(url: str) -> bool:
    timeout = httpx.Timeout(5.0)
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    try:
        async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
            res = await client.head(url)
            if res.status_code in [405, 403, 401]:
                res = await client.get(url)
            return res.status_code == 200
    except Exception:
        return False

class CourseScraper:
    async def init(self):
        pass

    async def close(self):
        pass

    async def scrape_courses_for_skill(self, skill: str) -> List[CourseResult]:
        courses: List[CourseResult] = []
        try:
            results = await search_course_web(skill, [])
            coursera_count = 0
            udemy_count = 0

            for res in results:
                provider = res.get('provider')
                if provider == 'Coursera' and coursera_count >= 2:
                    continue
                if provider == 'Udemy' and udemy_count >= 2:
                    continue

                if await verify_http_200(res['url']):
                    courses.append({
                        'title': res['title'],
                        'url': res['url'],
                        'provider': provider,
                        'whyRelevant': res.get('whyRelevant', '')
                    })

                    if provider == 'Coursera':
                        coursera_count += 1
                    if provider == 'Udemy':
                        udemy_count += 1
        except Exception as e:
            print(f"[CourseScraper] Exa search failed for {skill}: {e}")

        return courses
