
import { TutorService } from './src/services/tutor.service';

const testCases = [
  { skill: 'Power BI', style: 'example' as const },
  { skill: 'SQL', style: 'step_by_step' as const },
  { skill: 'Excel', style: 'example' as const },
  { skill: 'Python', style: 'step_by_step' as const },
  { skill: 'Tableau', style: 'simple' as const },
  { skill: 'Reporting', style: 'visual' as const },
  { skill: 'Communication', style: 'example' as const },
  { skill: 'Statistics', style: 'step_by_step' as const },
  { skill: 'Data Cleaning', style: 'arabic' as const },
  { skill: 'Power BI', style: 'step_by_step' as const },
];

async function runTest() {
  const results: any[] = [];
  const originalWarn = console.warn;

  for (const t of testCases) {
    let parseError = '';
    
    // Intercept console.warn
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('Failed to parse AI response as JSON')) {
        parseError = msg;
      }
      // originalWarn(...args); // Keep silent to avoid clutter
    };

    try {
      const service = new TutorService();
      const result = await service.explain(t.skill, t.style);
      
      const validationResult = result.source === 'ai' ? 'pass' : 'fail';
      
      let hadUnescapedNewline = 'no';
      if (validationResult === 'fail' && (parseError.includes('Bad control character') || parseError.includes('JSON'))) {
        hadUnescapedNewline = 'yes';
      }

      // If it failed, did it gracefully fallback? 
      // Yes, because result.source === 'fallback' and it didn't throw an exception to the caller.
      const fallbackTriggeredCorrectly = validationResult === 'fail' 
        ? (result.source === 'fallback' ? 'yes' : 'no') 
        : 'n/a';

      results.push({
        skill: t.skill,
        style: t.style,
        hadUnescapedNewline,
        validationResult,
        fallbackTriggeredCorrectly
      });

    } catch (e: any) {
      originalWarn(`CRASH: ${e.message}`);
      results.push({
        skill: t.skill,
        style: t.style,
        hadUnescapedNewline: 'unknown',
        validationResult: 'crash',
        fallbackTriggeredCorrectly: 'no (crash)'
      });
    } finally {
      console.warn = originalWarn;
    }
    
    // Delay to respect API rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  console.table(results);
}

runTest().catch(console.error);
