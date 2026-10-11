import { test, expect } from '@playwright/test';

// Vercel Analytics and Microsoft Clarity run only on the live site. Anywhere
// else (local runs, these tests, preview deployments) they must not load:
// Vercel's script 404s off-platform, and test visits would pollute the data.
test('analytics and session recording stay off outside the live site', async ({ page }) => {
  const trackers: string[] = [];
  page.on('request', r => {
    const url = r.url();
    if (/clarity\.ms|\/_vercel\/insights|va\.vercel-scripts\.com/.test(url)) trackers.push(url);
  });

  await page.goto('/');
  await page.goto('/skills#software-engineering');
  await page.waitForLoadState('networkidle');

  expect(trackers).toEqual([]);
  expect(await page.evaluate(() => 'clarity' in window)).toBe(false);
});
