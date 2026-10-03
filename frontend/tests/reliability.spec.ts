import { test, expect, type Page } from '@playwright/test';

const origin = 'http://localhost:5173';
const skillsInput = 'Type a skill (e.g., Python, Tableau) and press Enter';

async function toEvidence(page: Page, reload = true) {
  if (reload) await page.goto(origin);
  await page.getByPlaceholder(skillsInput).fill('SQL');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Market Requirements (Top Skills)')).toBeVisible();
  await page.getByRole('button', { name: 'Continue to Evidence Mapping' }).click();
  await page.locator('input[value="project"]').check();
}

test('fresh load and five resets reach real Results with one pair of POSTs each', async ({ page }, info) => {
  const errors: string[] = [];
  const posts: string[] = [];
  const runs: { elapsedMs: number; requests: string[] }[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (r.method() === 'POST') posts.push(r.url()); });
  for (let i = 0; i < 6; i++) {
    await toEvidence(page, i === 0);
    const before = posts.length;
    const start = Date.now();
    await page.getByRole('button', { name: 'Run Analysis' }).click();
    await expect(page.locator('.text-6xl')).toHaveText('15.8%', { timeout: 5000 });
    const elapsedMs = Date.now() - start;
    runs.push({ elapsedMs, requests: posts.slice(before) });
    expect(posts.slice(before)).toEqual(['http://localhost:3001/api/profile', 'http://localhost:3001/api/analysis']);
    await expect(page.getByRole('heading', { name: 'Target Role: Junior Data Analyst' })).toBeVisible();
    await expect(page.getByText('requirement match', { exact: true })).toBeVisible();
    await expect(page.getByText(/Weighted gap:/).first()).not.toContainText('NaN');
    await expect(page.getByText('Practice:', { exact: true })).toHaveCount(3);
    await page.getByRole('button', { name: 'Start Over / New Student' }).click();
    await expect(page.getByText('No skills added yet. Add some above!')).toBeVisible();
  }
  await info.attach('six-browser-run-timings', { body: JSON.stringify(runs, null, 2), contentType: 'application/json' });
  console.log('Six real browser runs:', JSON.stringify(runs));
  expect(errors).toEqual([]);
  expect(runs.every(r => r.elapsedMs < 1000), 'Local click-to-visible Results target: under 1 second').toBe(true);
});

test('leaving Analysis before its response cannot overwrite the reset profile', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/analysis', async route => {
    const response = await route.fetch();
    await pending;
    await route.fulfill({ response });
  });
  await toEvidence(page);
  const request = page.waitForRequest('**/api/analysis');
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await request;
  await page.getByRole('button', { name: 'Start Over', exact: true }).click();
  const completed = page.waitForResponse('**/api/analysis');
  release();
  await completed;
  await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
  await expect(page.locator('.text-6xl')).toBeHidden();
});

test('delayed requirements render safely and input validation survives reset', async ({ page }) => {
  await page.route('**/requirements', async route => {
    await new Promise(resolve => setTimeout(resolve, 350));
    await route.continue();
  });
  await page.goto(origin);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Please add at least one skill before continuing.')).toBeVisible();
  await page.getByPlaceholder(skillsInput).fill('Astronaut');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByText(/is not in our recognized skill database/)).toBeVisible();
  await page.getByPlaceholder(skillsInput).fill('T-SQL');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue to Evidence Mapping' })).toBeDisabled();
  await expect(page.getByText('Market Requirements (Top Skills)')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to Evidence Mapping' })).toBeEnabled();
});

test('failed profile submission reports an error and Go Back permits retry', async ({ page }) => {
  await page.route('**/api/profile', route => route.fulfill({ status: 500, json: { data: null, error: { message: 'Controlled profile failure' } } }), { times: 1 });
  await toEvidence(page);
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.getByText('Error: Controlled profile failure')).toBeVisible();
  await page.getByRole('button', { name: 'Go Back' }).click();
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await expect(page.locator('.text-6xl')).toHaveText('15.8%');
});

test('tutor maps five styles, labels sources, and ignores a stale style response', async ({ page }) => {
  const styles: string[] = [];
  let releaseVisual!: () => void;
  let delayVisual = false;
  const pendingVisual = new Promise<void>(resolve => { releaseVisual = resolve; });
  // Controlled response fixtures exercise the UI contract, not live model reliability.
  await page.route('**/api/tutor/explain', async route => {
    const { style, skillName } = route.request().postDataJSON();
    styles.push(style);
    if (delayVisual && style === 'visual') await pendingVisual;
    await route.fulfill({ json: { data: {
      skill: skillName, style, source: style === 'example' ? 'ai' : 'fallback',
      explanation_text: `Controlled ${style} explanation of ${skillName}, used only to verify the browser response contract.`,
      example: null, notes: null,
    }, error: null } });
  });
  await toEvidence(page);
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await page.getByRole('button', { name: 'Learn this skill' }).first().click();
  for (const [label, style] of [['Simple', 'simple'], ['Visual', 'visual'], ['Example-based', 'example'], ['Step-by-step', 'step_by_step'], ['Arabic', 'arabic']]) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('.prose')).toContainText(`Controlled ${style} explanation`);
    await expect(page.getByText(style === 'example' ? 'Live AI Generation' : 'Curated Example', { exact: false })).toBeVisible();
  }
  expect(styles).toContain('step_by_step');
  expect(styles).not.toContain('step-by-step');
  delayVisual = true;
  await page.getByRole('button', { name: 'Visual', exact: true }).click();
  await page.getByRole('button', { name: 'Arabic', exact: true }).click();
  await expect(page.locator('.prose')).toContainText('Controlled arabic explanation');
  const response = page.waitForResponse(r => r.url().endsWith('/tutor/explain') && r.request().postDataJSON().style === 'visual');
  releaseVisual();
  await response;
  await expect(page.locator('.prose')).toContainText('Controlled arabic explanation');
  await page.getByRole('button', { name: 'Reset Demo State / Start Over' }).click();
  await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
});
