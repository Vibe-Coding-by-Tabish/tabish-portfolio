// Regression: ISSUE-002 — mobile menu section links closed the menu but never scrolled
// Found by /qa on 2026-10-06
// Report: .gstack/qa-reports/qa-report-tabishaliansari.vercel.app-2026-10-06.md
// The hamburger menu has since been replaced by the floating dock; the same
// promise (a section link closes the navigation AND scrolls) now applies there.
import { test, expect } from '@playwright/test';

const SECTIONS = [
  { label: 'Projects', id: '#projects' },
  { label: 'Papers',   id: '#publications' },
  { label: 'Contact',  id: '#contact' },
] as const;

for (const { label, id } of SECTIONS) {
  test(`dock "${label}" scrolls to ${id}`, async ({ page }) => {
    await page.goto('/');
    // The web font swapping in reflows the page; aim the scroll after that
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: label, exact: true }).click();
    await expect
      .poll(() => page.locator(id).evaluate(el => Math.round(el.getBoundingClientRect().top)), { timeout: 5000 })
      .toBeLessThan(120);
  });
}

test('logo scrolls back to top', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 3000));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(2000);

  await page.getByRole('button', { name: 'Scroll to top' }).click();

  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
});
