import { test, expect, type Locator, type Page } from '@playwright/test';

const demo = (page: Page) => page.locator('.mq');
const tab = (page: Page, name: string) => demo(page).getByRole('tab', { name });
const verdict = (page: Page) => demo(page).locator('.mq-verdict-value');

async function openDemo(page: Page) {
  await page.goto('/');
  // The web font swapping in reflows the page on phones; scroll after it
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#metaboliq').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await expect(demo(page)).toBeVisible();
}

// Centre the target first, clear of the fixed header and the dock
async function tap(target: Locator) {
  await target.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await target.click();
}

const phase = (page: Page, value: string) =>
  expect(demo(page)).toHaveAttribute('data-phase', value, { timeout: 10_000 });

async function runTab(page: Page, name: string) {
  await tap(tab(page, name));
  await expect(tab(page, name)).toHaveAttribute('aria-selected', 'true');
  await phase(page, 'ready');
  await tap(demo(page).getByRole('button', { name: 'Predict', exact: true }));
  await phase(page, 'done');
}

test('on first sight the demo fills the gestational case and predicts it', async ({ page }) => {
  await openDemo(page);
  await phase(page, 'done');
  await expect(tab(page, 'Gestational')).toHaveAttribute('aria-selected', 'true');
  await expect(demo(page).getByText('28.3')).toBeVisible();
  await expect(verdict(page)).toHaveText('has gestational diabetes');
  await expect(demo(page).getByText('Decision Tree')).toBeVisible();
});

test('each predictor replays its own recorded run', async ({ page }) => {
  await openDemo(page);
  await phase(page, 'done');

  await runTab(page, 'Lifestyle risk');
  await expect(verdict(page)).toHaveText('Non-Diabetic');

  await runTab(page, 'Diabetes type');
  await expect(verdict(page)).toHaveText('Neonatal Diabetes Mellitus (NDM)');
  await expect(demo(page).getByText('Random Forest')).toBeVisible();

  await runTab(page, 'Case projection');
  await expect(verdict(page)).toHaveText('208,437');
  await expect(demo(page).getByText('Linear Regression')).toBeVisible();
});

test('the long type form keeps most inputs behind a toggle', async ({ page }) => {
  await openDemo(page);
  await phase(page, 'done');
  await tap(tab(page, 'Diabetes type'));
  await phase(page, 'ready');
  await expect(demo(page).locator('.mq-field')).toHaveCount(9);
  await tap(demo(page).getByRole('button', { name: 'Show all 33 inputs' }));
  await expect(demo(page).locator('.mq-field')).toHaveCount(33);
  await expect(demo(page).getByText('Liver function tests')).toBeVisible();
});

test('touching the demo before it predicts stops it driving itself', async ({ page }) => {
  await openDemo(page);
  await phase(page, 'ready');
  await tap(tab(page, 'Case projection'));
  await phase(page, 'ready');
  await page.waitForTimeout(2000);
  await expect(demo(page)).toHaveAttribute('data-phase', 'ready');
  await expect(demo(page).locator('.mq-verdict')).toHaveCount(0);
});

test('desktop puts the form beside the result', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop layout');
  await openDemo(page);
  await phase(page, 'done');
  const form = (await demo(page).locator('.mq-form').boundingBox())!;
  const result = (await demo(page).locator('.mq-result').boundingBox())!;
  expect(result.x).toBeGreaterThan(form.x + form.width - 2);
});

test('phones stack the result under the form, and the tab row scrolls on its own', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone layout');
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 740 });
    await openDemo(page);
    await phase(page, 'done');
    const form = (await demo(page).locator('.mq-form').boundingBox())!;
    const result = (await demo(page).locator('.mq-result').boundingBox())!;
    expect(form.y + form.height).toBeLessThanOrEqual(result.y + 1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    // The last tab starts off-screen; choosing it brings it into view
    const last = tab(page, 'Case projection');
    await tap(last);
    const row = (await demo(page).locator('.mq-tabs').boundingBox())!;
    await expect.poll(async () => {
      const box = (await last.boundingBox())!;
      return box.x + box.width <= row.x + row.width + 1 && box.x >= row.x - 1;
    }).toBe(true);
  }
});

test('with reduced motion the first result is simply there', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDemo(page);
  await expect(demo(page)).toHaveAttribute('data-phase', 'done', { timeout: 2000 });
  await expect(verdict(page)).toHaveText('has gestational diabetes');
});
