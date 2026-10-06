// Regression: ISSUE-001 — pre-reveal slide-in offsets widened the page, causing horizontal scroll on mobile
// Found by /qa on 2026-10-06
// Report: .gstack/qa-reports/qa-report-tabishaliansari.vercel.app-2026-10-06.md
import { test, expect } from '@playwright/test';

const docWidth = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));

test('page never scrolls horizontally, before or after sections reveal', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  let w = await docWidth(page);
  expect(w.scroll, 'on load').toBeLessThanOrEqual(w.client);

  // Walk the page in viewport-sized steps so every whileInView animation fires.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = page.viewportSize()!.height / 2;
  for (let y = 0; y < height; y += step) {
    await page.evaluate(top => window.scrollTo(0, top), y);
    await page.waitForTimeout(150);
    w = await docWidth(page);
    expect(w.scroll, `at scrollY ${y}`).toBeLessThanOrEqual(w.client);
  }
});
