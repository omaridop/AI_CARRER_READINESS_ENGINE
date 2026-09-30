import { test, expect } from '@playwright/test';

test('Judge Checklist E2E', async ({ page }) => {
  console.log('=== 1. Setup & Profile Entry ===');
  await page.goto('http://localhost:5173/');
  
  // Enter a nickname
  await page.screenshot({ path: 'screenshot1.png' }); await page.fill('input[placeholder="e.g. Alex"]', 'Judge');
  
  // Unrecognized skill
  await page.fill('input[placeholder="Type a skill (e.g., Python, Tableau) and press Enter"]', 'Astronaut');
  await page.click('button:has-text("Add")');
  await expect(page.locator('.text-red-600')).toContainText('not in our recognized skill database');
  console.log('✔ Handled unrecognized skill gracefully');

  // Valid alias
  await page.fill('input[placeholder="Type a skill (e.g., Python, Tableau) and press Enter"]', 'pandas library');
  await page.click('button:has-text("Add")');
  await expect(page.locator('text=Pandas')).toBeVisible();
  console.log('✔ Mapped alias to canonical skill (Pandas)');

  // Try to proceed with just one skill is allowed, let's add more
  await page.fill('input[placeholder="Type a skill (e.g., Python, Tableau) and press Enter"]', 'SQL');
  await page.click('button:has-text("Add")');
  await page.fill('input[placeholder="Type a skill (e.g., Python, Tableau) and press Enter"]', 'Communication');
  await page.click('button:has-text("Add")');
  
  // Continue
  await page.click('button:has-text("Continue")');
  
  console.log('=== 2. Market Requirements ===');
  await expect(page.locator('h2', { hasText: 'Target Role' })).toBeVisible();
  await expect(page.locator('text=Market Requirements (Top Skills)')).toBeVisible();
  await page.click('button:has-text("Continue to Evidence Mapping")');
  console.log('✔ Viewed market requirements and continued');

  console.log('=== 3. Evidence Mapping ===');
  // Select evidence levels
  await page.locator('text=Map Your Evidence').waitFor();
  
  // Click radios for the 3 skills we added
  // skill 1: Pandas
  await page.locator('input[name^="evidence-"][value="course"]').nth(0).click();
  // skill 2: SQL
  await page.locator('input[name^="evidence-"][value="project"]').nth(1).click();
  // skill 3: Communication
  await page.locator('input[name^="evidence-"][value="self_declared"]').nth(2).click();
  
  await page.click('button:has-text("Run Analysis")');
  console.log('✔ Mapped evidence and clicked Run Analysis');

  console.log('=== 4. Analysis & Results ===');
  await expect(page.locator('.text-6xl')).toBeVisible({ timeout: 15000 });
  const score = await page.locator('.text-6xl').innerText();
  console.log(`✔ Saw Readiness Score: ${score}`);
  
  // Verify gaps
  await expect(page.locator('text=Identified Skill Gaps')).toBeVisible();
  // Verify roadmap
  await expect(page.locator('text=Your Learning Roadmap')).toBeVisible();
  console.log('✔ Verified gaps and roadmap render properly');

  console.log('=== 5. Adaptive Tutor ===');
  await page.click('button:has-text("Learn this skill") >> nth=0');
  
  await expect(page.locator('text=Adaptive Tutor')).toBeVisible();
  
  // Wait for loading to finish
  await expect(page.locator('text=Generating your explanation...')).toBeHidden({ timeout: 15000 });
  
  const isAI = await page.locator('text=Live AI Generation').isVisible();
  const isFallback = await page.locator('text=Curated Example').isVisible();
  expect(isAI !== isFallback, 'Exactly one honest source badge must be visible').toBe(true);
  console.log(`✔ Source badge verified: AI=${isAI}, Fallback=${isFallback}`);
  
  // Switch style
  const visualResponse = page.waitForResponse(response => response.url().endsWith('/tutor/explain'));
  await page.click('button:has-text("Visual")');
  expect((await visualResponse).status()).toBe(200);
  await expect(page.locator('text=Generating your explanation...')).toBeHidden({ timeout: 15000 });
  await expect(page.locator('.prose')).toBeVisible();
  console.log('✔ Switched style successfully');

  console.log('=== 6. Reset & Repeat ===');
  await page.click('button:has-text("Reset Demo State / Start Over")');
  
  await expect(page.locator('input[placeholder="e.g. Alex"]')).toBeVisible();
  console.log('✔ Reset completely successfully to Step 1');
});
