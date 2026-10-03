import { searchCourseWeb } from '../ai/course-search';

export interface CourseResult {
  title: string;
  url: string;
  provider: 'Coursera' | 'Udemy';
  whyRelevant: string;
}

export class CourseScraper {
  async init() {}
  async close() {}

  async scrapeCoursesForSkill(skill: string): Promise<CourseResult[]> {
    const courses: CourseResult[] = [];
    
    try {
      const results = await searchCourseWeb(skill, []);
      let courseraCount = 0;
      let udemyCount = 0;
      
      for (const res of results) {
        if (res.provider === 'Coursera' && courseraCount >= 2) continue;
        if (res.provider === 'Udemy' && udemyCount >= 2) continue;
        
        if (await verifyHttp200(res.url)) {
          courses.push({
            title: res.title,
            url: res.url,
            provider: res.provider,
            whyRelevant: res.whyRelevant
          });
          
          if (res.provider === 'Coursera') courseraCount++;
          if (res.provider === 'Udemy') udemyCount++;
        }
      }
    } catch (e) {
      console.warn(`[CourseScraper] Exa search failed for ${skill}`);
    }
    
    return courses;
  }
}

/** Verifies that a URL returns HTTP 200 OK */
async function verifyHttp200(url: string): Promise<boolean> {
  const timeoutMs = 5000;
  const fetchWithTimeout = async (method: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.status;
    } catch {
      clearTimeout(timeoutId);
      return 500;
    }
  };

  try {
    let status = await fetchWithTimeout('HEAD');
    if (status === 405 || status === 403 || status === 401) {
      status = await fetchWithTimeout('GET');
    }
    return status === 200;
  } catch (e) {
    return false;
  }
}
