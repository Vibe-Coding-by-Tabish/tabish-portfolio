// Regression: ISSUE-001 — choosing a skill area dropped keyboard focus to <body>
// Found by /qa on 2026-10-10
// Report: .gstack/qa-reports/run-20261010T201843Z/qa-report-tabishaliansari.vercel.app-2026-10-10.md
// The control a keyboard user activates (an overview tile, "All skill areas",
// or "Next") is replaced when the option changes. Focus must land on the
// matching control in the new view, not fall back to the top of the page.
import { test, expect, type Page } from '@playwright/test';

const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? `${el.tagName} ${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 40)}` : 'none';
  });

test('Enter on a tile moves focus to that option in the switcher', async ({ page }) => {
  await page.goto('/skills');
  await page.getByRole('button', { name: /^AI & Data Engineering/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#ai-data-engineering$/);
  await expect.poll(() => focused(page)).toBe('BUTTON AI & Data Engineering');
});

test('"All skill areas" returns focus to the tile you came from', async ({ page }) => {
  await page.goto('/skills#software-engineering');
  await page.getByRole('button', { name: 'All skill areas' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/skills$/);
  await expect.poll(() => focused(page)).toMatch(/^BUTTON Software Engineering/);
});

test('"Next" keeps focus on the switcher, on the new option', async ({ page }) => {
  await page.goto('/skills#bioinformatics-pipelines');
  await page.getByRole('button', { name: /^Next: Software Engineering/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#software-engineering$/);
  await expect.poll(() => focused(page)).toBe('BUTTON Software Engineering');
});
