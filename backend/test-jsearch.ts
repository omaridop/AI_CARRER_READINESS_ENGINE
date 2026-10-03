import dotenv from 'dotenv';
dotenv.config();

import { LinkedInScraper } from './src/scraper/linkedin-scraper';

async function runTest() {
  console.log('Testing JSearch API connection...');
  console.log('API Key loaded:', process.env.OPENWEB_API_KEY ? 'Yes' : 'No');

  const scraper = new LinkedInScraper();
  const jobs = await scraper.scrape({
    searchQuery: 'Data Analyst',
    location: 'Jordan',
    maxPages: 1,
    headless: true,
    delayMs: 1000,
  });

  console.log('\n--- Test Results ---');
  console.log(`Total jobs fetched: ${jobs.length}`);

  if (jobs.length > 0) {
    console.log('\nFirst job sample:');
    console.log('Title:', jobs[0].title);
    console.log('Company:', jobs[0].company);
    console.log('Location:', jobs[0].location);
    console.log('URL:', jobs[0].url);
  }
}

runTest();