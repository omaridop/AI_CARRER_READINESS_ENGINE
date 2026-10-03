/**
 * CLI entry point for running the SkillBridge web scrapers.
 *
 * Usage:
 *   npx tsx src/scraper/run-scraper.ts --source all --pages 2
 *   npx tsx src/scraper/run-scraper.ts --source bayt --pages 3
 *   npx tsx src/scraper/run-scraper.ts --source linkedin --pages 1 --no-headless
 *
 * Options:
 *   --source    Which scraper(s) to run: bayt, akhtaboot, linkedin, all (default: all)
 *   --pages     Maximum pages to scrape per source (default: 2)
 *   --delay     Delay between requests in ms (default: 3000)
 *   --no-headless  Show the browser window (useful for debugging)
 *   --query     Custom search query (default: "data analyst")
 */

import { ScraperManager } from './scraper-manager';
import { BaytScraper } from './bayt-scraper';
import { AkhtabootScraper } from './akhtaboot-scraper';
import { LinkedInScraper } from './linkedin-scraper';
import { ScraperConfig, DEFAULT_CONFIG } from './types';

function parseArgs(): { source: string; config: Partial<ScraperConfig> } {
  const args = process.argv.slice(2);
  let source = 'all';
  const config: Partial<ScraperConfig> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--source':
        source = (args[++i] ?? 'all').toLowerCase();
        break;
      case '--pages':
        config.maxPages = parseInt(args[++i] ?? '2', 10);
        break;
      case '--delay':
        config.delayMs = parseInt(args[++i] ?? '3000', 10);
        break;
      case '--no-headless':
        config.headless = false;
        break;
      case '--query':
        config.searchQuery = args[++i] ?? DEFAULT_CONFIG.searchQuery;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return { source, config };
}

function printHelp(): void {
  console.log(`
SkillBridge Web Scraper
──────────────────────
Usage: npx tsx src/scraper/run-scraper.ts [options]

Options:
  --source <name>    Which scraper: bayt, akhtaboot, linkedin, all (default: all)
  --pages <n>        Max pages per source (default: 2)
  --delay <ms>       Delay between requests in ms (default: 3000)
  --no-headless      Show the browser window
  --query <text>     Search query (default: "data analyst")
  --help, -h         Show this help

Examples:
  npx tsx src/scraper/run-scraper.ts --source all
  npx tsx src/scraper/run-scraper.ts --source bayt --pages 3
  npx tsx src/scraper/run-scraper.ts --source linkedin --no-headless
`);
}

async function main(): Promise<void> {
  const { source, config } = parseArgs();
  const manager = new ScraperManager();

  // Register requested scrapers
  const sources = source === 'all' ? ['bayt', 'akhtaboot', 'linkedin'] : [source];

  for (const s of sources) {
    switch (s) {
      case 'bayt':
        manager.register(new BaytScraper());
        break;
      case 'akhtaboot':
        manager.register(new AkhtabootScraper());
        break;
      case 'linkedin':
        manager.register(new LinkedInScraper());
        break;
      default:
        console.error(`❌ Unknown source: ${s}`);
        console.log('Available: bayt, akhtaboot, linkedin, all');
        process.exit(1);
    }
  }

  try {
    await manager.runAll(config);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Fatal error: ${msg}`);
    process.exit(1);
  }
}

main();
