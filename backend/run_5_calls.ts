import { TutorService } from './src/services/tutor.service';

const testCases = [
  { skill: 'Tableau', style: 'visual' as const },
  { skill: 'Excel', style: 'step_by_step' as const },
  { skill: 'SQL', style: 'example' as const },
  { skill: 'Communication', style: 'arabic' as const },
  { skill: 'Reporting', style: 'example' as const },
];

async function runTest() {
  const results: any[] = [];
  const originalWarn = console.warn;

  for (const t of testCases) {
    let parseError = '';
    
    console.warn = (...args) => {
      const msg = args.join(' ');
      if (msg.includes('Failed to parse AI response as JSON')) {
        parseError = msg;
      }
    };

    try {
      const service = new TutorService();
      const result = await service.explain(t.skill, t.style);
      
      const validationResult = result.source === 'ai' ? 'pass' : 'fail';
      
      let hadUnescapedNewline = 'no';
      if (validationResult === 'fail' && (parseError.includes('Bad control character') || parseError.includes('JSON'))) {
        hadUnescapedNewline = 'yes';
      }

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
    
    await new Promise(r => setTimeout(r, 2000));
  }

  console.table(results);
}

runTest().catch(console.error);
