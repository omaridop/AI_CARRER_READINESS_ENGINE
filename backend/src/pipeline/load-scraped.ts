/**
 * Loads scraped postings from the generated TypeScript file, if it exists.
 *
 * This module is used by the seed pipeline to combine hardcoded postings
 * with any scraped-and-imported postings. If no scraped postings file
 * exists, it returns an empty array silently.
 */

import path from 'path';
import fs from 'fs';
import { JobPostingData } from '../types';

const SCRAPED_FILE = path.resolve(__dirname, '../data/scraped-postings.ts');

/**
 * Load scraped postings if the file exists.
 * Returns an empty array if no scraped postings have been imported yet.
 */
export function loadScrapedPostings(): JobPostingData[] {
  if (!fs.existsSync(SCRAPED_FILE)) {
    return [];
  }

  try {
    // Dynamic import — the scraped-postings.ts file exports SCRAPED_POSTINGS
    // Since we use tsx, we can require .ts files directly at runtime
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(SCRAPED_FILE);
    if (Array.isArray(mod.SCRAPED_POSTINGS)) {
      return mod.SCRAPED_POSTINGS;
    }
    return [];
  } catch {
    console.warn('  ⚠️  Could not load scraped-postings.ts — skipping scraped data.');
    return [];
  }
}
