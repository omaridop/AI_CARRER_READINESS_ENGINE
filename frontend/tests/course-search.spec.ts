import { test, expect, type Page } from '@playwright/test';

async function openTutor(page: Page) {
  await page.route('**/api/tutor/explain', route => {
    const { skillName, style } = route.request().postDataJSON();
    return route.fulfill({ json: { data: { skill: skillName, style, source: 'fallback', explanation_text: 'Controlled tutor content for course UI checks.', example: null, notes: null }, error: null } });
  });
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Excel +', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to Evidence Mapping' }).click();
  await page.locator('input[value="project"]').check();
  await page.getByRole('button', { name: 'Run Analysis' }).click();
  await page.getByRole('button', { name: 'Learn this skill' }).first().click();
  await expect(page.locator('.prose')).toBeVisible();
}

function result(skill: string, source: 'web' | 'fallback' = 'web') {
  return { skill, source, researchedAt: source === 'web' ? '2026-09-27T12:00:00Z' : null, cached: false,
    courses: source === 'web' ? [{ title: `${skill} foundations`, provider: 'Coursera', url: 'https://www.coursera.org/learn/course-fixture', whyRelevant: `The title mentions ${skill}.`, sourceExcerpt: 'A controlled search excerpt for UI verification.' }] : [],
    searchLinks: [{ provider: 'Udemy', url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skill)}` }],
    notice: source === 'web' ? 'A controlled shortlist, not a quality ranking.' : 'Live research is unavailable. Provider search links only.',
  };
}

test('search is on demand, rapid clicks deduplicate, citations and cache labels display on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 950 });
  let count = 0;
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/courses/search', async route => {
    count++;
    if (count === 1) await pending;
    await route.fulfill({ json: { data: { ...result(route.request().postDataJSON().skillName), cached: count > 1 }, error: null } });
  });
  await openTutor(page);
  await page.getByRole('button', { name: 'Visual', exact: true }).click();
  await page.getByRole('button', { name: 'Find courses', exact: true }).hover();
  expect(count).toBe(0);
  await page.getByRole('button', { name: 'Find courses', exact: true }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByRole('button', { name: 'Researching courses…' })).toBeDisabled();
  await expect.poll(() => count).toBe(1);
  release();
  await expect(page.getByText('Found through web research', { exact: true })).toBeVisible();
  const link = page.getByRole('link', { name: 'View course on Coursera' });
  await expect(link).toHaveAttribute('href', 'https://www.coursera.org/learn/course-fixture');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await page.getByText('What the search source says').click();
  await expect(page.getByText('A controlled search excerpt for UI verification.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Check course results' }).click();
  await expect(page.getByText('Saved web research', { exact: true })).toBeVisible();
});

test('invalid URLs fail closed; retry displays explicit fallback search links', async ({ page }) => {
  let attempt = 0;
  await page.route('**/api/courses/search', route => {
    const data = result(route.request().postDataJSON().skillName, attempt++ ? 'fallback' : 'web');
    if (data.courses.length) data.courses[0].url = 'javascript:alert(1)';
    return route.fulfill({ json: { data, error: null } });
  });
  await openTutor(page);
  await page.getByRole('button', { name: 'Find courses', exact: true }).click();
  await expect(page.locator('.course-section [role="alert"]')).toContainText('couldn’t read');
  await expect(page.locator('.course-card a')).toHaveCount(0);
  await page.getByRole('button', { name: 'Check course results' }).click();
  await expect(page.getByText('Provider search links · fallback', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Search Udemy' })).toBeVisible();
  await expect(page.getByText('Found through web research', { exact: true })).toHaveCount(0);
});

test('reset during course research cannot restore stale results', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/courses/search', async route => {
    await pending;
    await route.fulfill({ json: { data: result(route.request().postDataJSON().skillName), error: null } }).catch(() => {});
  });
  await openTutor(page);
  const requested = page.waitForRequest('**/api/courses/search');
  await page.getByRole('button', { name: 'Find courses', exact: true }).click();
  await requested;
  await page.getByRole('button', { name: 'Start Over', exact: true }).click();
  release();
  await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
  await expect(page.locator('.course-section')).toHaveCount(0);
});

test('unknown and malformed skills are rejected before research', async ({ request }) => {
  for (const skillName of [null, '', 'Invented skill', 'x'.repeat(101), ['SQL']]) {
    const response = await request.post('http://localhost:3001/api/courses/search', { data: { skillName } });
    expect(response.status()).toBe(400);
    expect((await response.json()).data).toBeNull();
  }
});
