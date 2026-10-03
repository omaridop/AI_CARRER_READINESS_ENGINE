import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test('learning flow, focus, reduced motion and layout at ' + width + 'px', async ({ page }, info) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    const requests: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => requests.push(r.url()));
    // Fixture verifies presentation and navigation, not live provider availability.
    await page.route('**/api/tutor/explain', route => {
      const body = route.request().postDataJSON();
      return route.fulfill({ json: { data: { skill: body.skillName, style: body.style, source: 'fallback', explanation_text: 'Practice with a small dataset. Ask one clear question, compare the values, and explain the result in plain language.', example: 'Question → Data → Finding → Next step', notes: 'A useful finding explains what changed and why it matters.' }, error: null } });
    });
    await page.goto('http://localhost:5173');
    await expect(page.getByRole('button', { name: 'SQL +', exact: true })).toBeVisible();
    await page.getByLabel('Name / Nickname (Optional)').focus();
    await expect(page.getByLabel('Name / Nickname (Optional)')).toBeFocused();
    expect(await page.getByLabel('Name / Nickname (Optional)').evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
    await page.getByRole('button', { name: 'SQL +', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Remove SQL' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByRole('button', { name: 'Continue to Evidence Mapping' }).click();
    await page.locator('input[value="project"]').check();
    await page.getByRole('button', { name: 'Run Analysis' }).click();
    await expect(page.getByRole('progressbar', { name: 'Requirement match' })).toHaveAttribute('aria-valuenow', '15.8');
    await expect(page.getByText('Not a hiring probability', { exact: false }).first()).toBeVisible();
    await expect(page.locator('.score-basis')).toContainText('1 selected skill: 1 with');
    expect(await page.locator('.score-track > span').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    await page.getByText('How this score works', { exact: true }).click();
    await expect(page.getByText('7 real and 30 labeled sample postings', { exact: false })).toBeVisible();
    await page.getByText('How this score works', { exact: true }).click();
    const count = requests.length;
    await page.getByRole('button', { name: /Start learning/ }).hover();
    expect(requests.length).toBe(count);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await info.attach('results-' + width, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    const nextSkill = await page.locator('.next-step-panel h3').innerText();
    await page.getByRole('button', { name: /Start learning/ }).click();
    await expect(page.getByText('Learning:', { exact: false })).toContainText(nextSkill);
    await expect(page.getByText('Curated Example', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Arabic', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Arabic', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.prose')).toHaveAttribute('dir', 'rtl');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await info.attach('tutor-' + width, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await page.getByRole('button', { name: 'Back to Roadmap' }).click();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '15.8');
    expect(errors).toEqual([]);
  });
}

test('empty and malformed requirements gate Continue', async ({ page }) => {
  let malformed = false;
  await page.route('**/requirements', route => route.fulfill({ json: { data: malformed ? [{ skillName: null }] : [], error: null } }));
  for (const invalid of [false, true]) {
    malformed = invalid;
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: 'SQL +', exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText(invalid ? 'The requirements response is unavailable or invalid. Please try again.' : 'No requirements available for this role yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to Evidence Mapping' })).toBeDisabled();
  }
});

 test('null requirements show an error instead of permanent loading', async ({ page }) => {
  await page.route('**/requirements', route => route.fulfill({ json: { data: null, error: null } }));
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'SQL +', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('unavailable or invalid');
  await expect(page.getByRole('button', { name: 'Continue to Evidence Mapping' })).toBeDisabled();
});
