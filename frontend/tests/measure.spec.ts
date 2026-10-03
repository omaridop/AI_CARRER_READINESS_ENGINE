import { test, expect } from '@playwright/test';

test('Measure analysis time', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('request', request => console.log('>>', request.method(), request.url()));
  page.on('response', response => console.log('<<', response.status(), response.url()));

  await page.goto('http://localhost:5173/');
  
  await page.fill('input[placeholder="Type a skill (e.g., Python, Tableau) and press Enter"]', 'SQL');
  await page.click('button:has-text("Add")');
  await page.click('button:has-text("Continue")');
  
  await page.locator('text=Market Requirements (Top Skills)').waitFor();
  await page.click('button:has-text("Continue to Evidence Mapping")');
  
  await page.locator('text=Map Your Evidence').waitFor();
  await page.locator('input[name^="evidence-"][value="project"]').nth(0).click();
  
  const start = Date.now();
  await page.click('button:has-text("Run Analysis")');
  
  await expect(page.locator('.text-6xl')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Something went wrong', { exact: true })).toBeHidden();
  
  const end = Date.now();
  console.log(`Analysis Step took ${end - start} ms`);
});
