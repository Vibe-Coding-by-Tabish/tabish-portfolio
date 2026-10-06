// Regression: ISSUE-002 — mobile menu section links closed the menu but never scrolled
// Found by /qa on 2026-10-06
// Report: .gstack/qa-reports/qa-report-tabishaliansari.vercel.app-2026-10-06.md
import { test, expect } from '@playwright/test';

for (const section of ['Projects', 'Publications', 'Contact'] as const) {
  test(`mobile menu "${section}" scrolls to #${section.toLowerCase()} and closes the menu`, async ({ page, isMobile }) => {
    test.skip(!isMobile, 'hamburger menu only renders below 640px');
    await page.goto('/');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('#mobile-menu').getByRole('button', { name: section, exact: true }).click();

    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await expect
      .poll(() => page.locator(`#${section.toLowerCase()}`).evaluate(el => Math.round(el.getBoundingClientRect().top)), { timeout: 5000 })
      .toBeLessThan(120);
  });
}

test('logo with the mobile menu open scrolls back to top', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'hamburger menu only renders below 640px');
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 3000));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(2000);

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: 'Scroll to top' }).click();

  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
});
