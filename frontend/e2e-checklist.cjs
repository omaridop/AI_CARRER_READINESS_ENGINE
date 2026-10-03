const puppeteer = require('puppeteer');

async function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to http://localhost:5173...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    console.log("=== 1. Setup & Profile Entry ===");
    await page.waitForSelector('input[placeholder="e.g. Alex"]');
    await page.type('input[placeholder="e.g. Alex"]', 'Test Judge');
    console.log("- Entered nickname");

    await page.type('input[placeholder="e.g. Python, SQL..."]', 'Astronaut');
    const [addButton] = await page.$x("//button[contains(., 'Add')]");
    await addButton.click();
    console.log("- Typed 'Astronaut' and clicked Add");
    
    // Check validation message
    await page.waitForSelector('.text-red-500');
    const errorText = await page.$eval('.text-red-500', el => el.innerText);
    console.log(`- Saw error: "${errorText}"`);

    // Valid inputs
    await page.type('input[placeholder="e.g. Python, SQL..."]', 'pandas library');
    await addButton.click();
    console.log("- Typed 'pandas library' and clicked Add");
    await delay(200);

    await page.type('input[placeholder="e.g. Python, SQL..."]', 'SQL');
    await addButton.click();
    console.log("- Typed 'SQL' and clicked Add");
    await delay(200);

    await page.type('input[placeholder="e.g. Python, SQL..."]', 'Communication');
    await addButton.click();
    console.log("- Typed 'Communication' and clicked Add");
    await delay(200);

    const [continueBtn] = await page.$x("//button[contains(., 'Continue')]");
    await continueBtn.click();
    console.log("- Clicked Continue");

    console.log("\n=== 2. Market Requirements ===");
    await page.waitForSelector('h2');
    const title = await page.$eval('h2', el => el.innerText);
    console.log(`- Saw Title: "${title}"`);
    const [reqsBtn] = await page.$x("//button[contains(., 'Continue to Evidence Mapping')]");
    await reqsBtn.click();
    console.log("- Clicked Continue to Evidence Mapping");

    console.log("\n=== 3. Evidence Mapping ===");
    await page.waitForSelector('select');
    const selects = await page.$$('select');
    await selects[0].select('course');
    await selects[1].select('project');
    console.log("- Mapped evidence levels for skills");
    
    const [runAnalysisBtn] = await page.$x("//button[contains(., 'Run Analysis')]");
    await runAnalysisBtn.click();
    console.log("- Clicked Run Analysis");

    console.log("\n=== 4. Analysis & Results ===");
    // Wait for the loading screen to finish (it cycles text, then fetches)
    await page.waitForSelector('.text-6xl', { timeout: 15000 });
    const score = await page.$eval('.text-6xl', el => el.innerText);
    console.log(`- Saw Readiness Score: "${score}"`);
    
    const [gapBtn] = await page.$x("//button[contains(., 'Learn this skill')]");
    if (gapBtn) {
      await gapBtn.click();
      console.log("- Clicked 'Learn this skill'");
    } else {
      console.log("- No missing skills to learn!");
    }

    console.log("\n=== 5. Adaptive Tutor ===");
    await page.waitForSelector('h2', { timeout: 10000 });
    await delay(3000); // Wait for fetch
    
    // Look for badge
    const badgeText = await page.evaluate(() => {
      const badge = document.querySelector('.bg-purple-100') || document.querySelector('.bg-yellow-100');
      return badge ? badge.innerText : 'No badge found';
    });
    console.log(`- Saw Source Badge: "${badgeText}"`);

    // Click "Visual" style
    const [visualBtn] = await page.$x("//button[contains(., 'Visual')]");
    await visualBtn.click();
    console.log("- Clicked 'Visual' style");
    await delay(3000);

    const tutorText = await page.$eval('.prose', el => el.innerText);
    console.log(`- Saw Tutor text excerpt: "${tutorText.substring(0, 100)}..."`);

    console.log("\n=== 6. Reset & Repeat ===");
    const [resetBtn] = await page.$x("//button[contains(., 'Reset Demo State / Start Over')]");
    await resetBtn.click();
    console.log("- Clicked 'Reset Demo State / Start Over'");
    
    await page.waitForSelector('input[placeholder="e.g. Alex"]');
    console.log("- Returned successfully to Step 1.");

    console.log("\nJUDGE CHECKLIST COMPLETED AUTOMATICALLY SUCCESSFULLY!");
  } catch (err) {
    console.error("Error during execution:", err);
  } finally {
    await browser.close();
  }
})();
