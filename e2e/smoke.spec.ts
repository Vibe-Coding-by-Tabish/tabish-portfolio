import { test, expect } from '@playwright/test';

test('homepage renders hero and sections without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tabish Ali Ansari.');
  for (const id of ['#projects', '#publications', '#contact']) {
    await expect(page.locator(id)).toBeAttached();
  }
  expect(errors).toEqual([]);
});

test('resume route embeds the PDF and links back to the portfolio', async ({ page }) => {
  await page.goto('/resume');

  await expect(page.locator('iframe')).toHaveAttribute('src', /\/resume\.pdf$/);
  const pdf = await page.request.get('/resume.pdf');
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');

  await page.getByRole('button', { name: '← Portfolio' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('dock scrolls to its section', async ({ page }) => {
  await page.goto('/');
  // The web font swapping in reflows the page; aim the scroll after that
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Contact', exact: true }).click();
  await expect
    .poll(() => page.locator('#contact').evaluate(el => Math.round(el.getBoundingClientRect().top)), { timeout: 5000 })
    .toBeLessThan(120);
});

test('theme toggle persists across reload', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop header control');
  await page.goto('/');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');

  await page.getByRole('button', { name: 'Toggle theme' }).click();
  const after = before === 'dark' ? 'light' : 'dark';
  await expect(html).toHaveAttribute('data-theme', after);

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after);
});
