import { test, expect } from '@playwright/test';

// The hero introduces the Skills page, the one page the home page can't
// scroll to: one pill per skill area, each opening that area directly.

const PILLS = [
  { name: /^Bioinformatics Pipelines/, hash: 'bioinformatics-pipelines' },
  { name: /^Software Engineering/, hash: 'software-engineering' },
  { name: /^AI & Data Engineering/, hash: 'ai-data-engineering' },
  { name: /^Health Data Integration/, hash: 'health-data-integration' },
];

const doorway = (page: import('@playwright/test').Page) =>
  page.getByRole('navigation', { name: 'What are you looking for?' });

test('the hero offers every skill area, each linking to its own option', async ({ page }) => {
  await page.goto('/');
  for (const p of PILLS) {
    await expect(doorway(page).getByRole('link', { name: p.name })).toHaveAttribute('href', `/skills#${p.hash}`);
  }
  // The old highlight list is gone
  await expect(page.locator('.hero')).not.toContainText('open-source orchestration');
});

test('a pill opens that option on the Skills page, and Back returns home', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const pill = doorway(page).getByRole('link', { name: /^Software Engineering/ });
  await pill.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await pill.click();

  await expect(page).toHaveURL(/\/skills#software-engineering$/);
  const heading = page.getByRole('heading', { level: 2, name: 'Typed. Secured. Shipped.' });
  await expect(heading).toBeVisible();
  // It opens on the option itself, not at the top of the page
  await expect.poll(() => heading.evaluate(el => Math.round(el.getBoundingClientRect().top))).toBeLessThan(400);
  await expect(page).toHaveTitle('Nextflow, Software, AI & FHIR Engineer | Tabish Ali Ansari');

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(doorway(page)).toBeVisible();
});

test('desktop shows the pills two to a row beside the photo', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop layout');
  await page.goto('/');
  const boxes = await doorway(page).getByRole('link').evaluateAll(els => els.map(e => e.getBoundingClientRect().toJSON()));
  expect(boxes).toHaveLength(4);
  expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(2);
  expect(boxes[1].x).toBeGreaterThan(boxes[0].x + boxes[0].width - 1);
  // Nothing truncated
  const cut = await page.locator('.hero-skill-stat').evaluateAll(els => els.filter(e => e.scrollWidth > e.clientWidth).length);
  expect(cut).toBe(0);
});

test('phones keep every pill readable: two columns, one at the narrowest', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone layout');
  for (const [width, columns] of [[375, 2], [320, 1]] as const) {
    await page.setViewportSize({ width, height: 760 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const xs = await doorway(page).getByRole('link').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().x)));
    expect(new Set(xs).size).toBe(columns);
    const cut = await page.locator('.hero-skill-stat').evaluateAll(els => els.filter(e => e.scrollWidth > e.clientWidth).length);
    expect(cut).toBe(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});
