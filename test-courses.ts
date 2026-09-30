import { CourseScraper } from './backend/src/scraper/course-scraper';

async function main() {
  const scraper = new CourseScraper();
  console.log('Initializing course scraper...');
  await scraper.init();
  console.log('Scraping courses for "Python"...');
  const courses = await scraper.scrapeCoursesForSkill('Python');
  console.log('Results:');
  console.log(courses);
  await scraper.close();
}

main().catch(console.error);
