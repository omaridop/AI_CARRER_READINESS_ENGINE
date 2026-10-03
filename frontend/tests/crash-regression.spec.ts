import { test, expect } from '@playwright/test';

test('Regression: Step 2 renders market requirements without crashing', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  
  // Step 1: Add a skill
  await page.fill('input[placeholder="Type a skill (e.g., Python, Tableau) and press Enter"]', 'SQL');
  await page.click('button:has-text("Add")');
  
  // Click Continue to navigate to Step 2
  await page.click('button:has-text("Continue")');
  
  // Step 2: Assert the page did not crash to a blank screen by looking for dynamic API data
  // The Market Requirements list should render properly.
  await expect(page.locator('text=Market Requirements (Top Skills)')).toBeVisible();
  
  // Also verify a specific skill from the API rendered to prove data extraction worked
  await expect(page.locator('span.font-medium.text-gray-700 >> text=SQL').first()).toBeVisible();
});
