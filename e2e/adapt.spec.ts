import { test, expect, type Locator, type Page } from '@playwright/test';

const demo = (page: Page) => page.locator('.adapt');
const slider = (page: Page) => demo(page).getByRole('slider', { name: 'Heatmap coverage' });

async function openDemo(page: Page) {
  await page.goto('/');
  // The web font swapping in reflows the page on phones; scroll after it
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#adapt').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await expect(demo(page)).toBeVisible();
}

// Centre the target first, clear of the fixed header and the dock
async function tap(target: Locator) {
  await target.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await target.click();
}

const done = (page: Page) => expect(demo(page)).toHaveAttribute('data-phase', 'done', { timeout: 12_000 });

test('on first sight the demo loads the scan, analyzes it and shows the result', async ({ page }) => {
  await openDemo(page);
  await done(page);
  await expect(demo(page).getByText('Late Mild Cognitive Impairment (LMCI)')).toBeVisible();
  await expect(demo(page).locator('.adapt-confidence-value')).toHaveText('94.68%');
  await expect(slider(page)).toBeVisible();
  await expect(demo(page).getByRole('button', { name: /Late Mild Cognitive Impairment \(predicted\)/ })).toBeVisible();
});

test('a visitor can remove the scan, load it again and run the analysis', async ({ page }) => {
  await openDemo(page);
  await done(page);
  await tap(demo(page).getByRole('button', { name: 'Remove scan' }));
  await expect(demo(page)).toHaveAttribute('data-phase', 'empty');

  await tap(demo(page).getByRole('button', { name: /Upload Brain Scan/ }));
  await expect(demo(page)).toHaveAttribute('data-phase', 'loaded');
  await tap(demo(page).getByRole('button', { name: 'Analyze Brain Scan' }));
  await expect(demo(page)).toHaveAttribute('data-phase', 'analyzing');
  await done(page);
  await expect(demo(page).locator('.adapt-steps li.is-done')).toHaveCount(4);
});

test('touching the demo before it finishes stops it driving itself', async ({ page }) => {
  await openDemo(page);
  await expect(demo(page)).toHaveAttribute('data-phase', 'loaded', { timeout: 5000 });
  await tap(demo(page).getByRole('button', { name: 'Remove scan' }));
  await page.waitForTimeout(2500);
  await expect(demo(page)).toHaveAttribute('data-phase', 'empty');
});

test('the sample scan can be dragged onto the drop zone', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Dragging is for mouse users; touch users tap');
  await openDemo(page);
  await done(page);
  await tap(demo(page).getByRole('button', { name: 'Remove scan' }));
  const sample = demo(page).getByRole('button', { name: /Load sample scan/ });
  const drop = demo(page).getByRole('button', { name: /Upload Brain Scan/ });
  await sample.evaluate(el => el.scrollIntoView({ block: 'center' }));
  const from = (await sample.boundingBox())!;
  const to = (await drop.boundingBox())!;
  await page.mouse.move(from.x + 30, from.y + from.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(
      from.x + 30 + ((to.x + to.width / 2 - from.x - 30) * i) / 12,
      from.y + from.height / 2 + ((to.y + to.height / 2 - from.y - from.height / 2) * i) / 12,
    );
  }
  await page.mouse.up();
  await expect(demo(page)).toHaveAttribute('data-phase', 'loaded');
});

test('the comparison slider follows the pointer and the keyboard', async ({ page }) => {
  await openDemo(page);
  await done(page);
  const frame = demo(page).locator('.adapt-compare');
  await frame.evaluate(el => el.scrollIntoView({ block: 'center' }));
  const box = (await frame.boundingBox())!;
  await frame.click({ position: { x: box.width * 0.25, y: box.height * 0.8 } });
  await expect.poll(async () => Number(await slider(page).getAttribute('aria-valuenow'))).toBeGreaterThan(20);
  await expect.poll(async () => Number(await slider(page).getAttribute('aria-valuenow'))).toBeLessThan(30);

  await slider(page).focus();
  await page.keyboard.press('End');
  await expect(slider(page)).toHaveAttribute('aria-valuenow', '100');
  await page.keyboard.press('Home');
  await expect(slider(page)).toHaveAttribute('aria-valuenow', '0');
});

test('each stage on the scale explains itself, the prediction stays marked', async ({ page }) => {
  await openDemo(page);
  await done(page);
  await tap(demo(page).getByRole('button', { name: "Alzheimer's Disease" }));
  await expect(demo(page).getByText('Dementia that interferes with daily life.')).toBeVisible();
  await expect(demo(page).getByText('Late Mild Cognitive Impairment (LMCI)')).toBeVisible();
});

test('desktop puts the scan beside the result', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop layout');
  await openDemo(page);
  await done(page);
  const scan = (await demo(page).getByRole('region', { name: 'Brain scan' }).boundingBox())!;
  const result = (await demo(page).getByRole('region', { name: 'Classification result' }).boundingBox())!;
  expect(result.x).toBeGreaterThan(scan.x + scan.width - 2);
  await expect(demo(page).locator('.adapt-step-text').first()).toBeVisible();
});

test('phones stack the scan above the result and fit every width', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone layout');
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 740 });
    await openDemo(page);
    await done(page);
    const scan = (await demo(page).getByRole('region', { name: 'Brain scan' }).boundingBox())!;
    const result = (await demo(page).getByRole('region', { name: 'Classification result' }).boundingBox())!;
    expect(scan.y + scan.height).toBeLessThanOrEqual(result.y + 1);
    // The pipeline collapses to its marks and names the current step
    await expect(demo(page).getByText('Pipeline complete')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  }
});

test('with reduced motion the result is simply there', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDemo(page);
  await expect(demo(page)).toHaveAttribute('data-phase', 'done', { timeout: 2000 });
  await expect(demo(page).locator('.adapt-confidence-value')).toHaveText('94.68%');
});
