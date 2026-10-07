import { test, expect } from '@playwright/test';

const BAD_PATH = '/does-not-exist';

const sectionTop = (page: import('@playwright/test').Page, id: string) =>
  page.locator(id).evaluate(el => Math.round(el.getBoundingClientRect().top));

test('unknown path renders the 404 page with header, footer and the bad URL', async ({ page }) => {
  await page.goto(BAD_PATH);

  await expect(page.getByRole('heading', { level: 1, name: 'Variant of unknown significance' })).toBeVisible();
  await expect(page.locator('.nf-path')).toHaveText(BAD_PATH);
  await expect(page.locator('header.header')).toBeVisible();
  await expect(page.locator('footer.footer')).toBeAttached();
  await expect(page).toHaveTitle(/^404/);
  expect(page.url()).toContain(BAD_PATH);
});

test('the visible home URL and the primary button both lead home', async ({ page }) => {
  for (const name of [/vercel\.app\/|localhost:\d+\//, 'Return to reference →']) {
    await page.goto(BAD_PATH);
    await page.getByRole('link', { name }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tabish Ali Ansari.');
  }
});

test('dock section link from the 404 page goes home and lands on that section', async ({ page }) => {
  await page.goto(BAD_PATH);
  // The web font swapping in reflows the page; aim the scroll after that
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name: 'Contact', exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => sectionTop(page, '#contact'), { timeout: 5000 }).toBeLessThan(120);
});

test('footer link from the 404 page goes home and lands on that section', async ({ page }) => {
  await page.goto(BAD_PATH);
  // The web font swapping in reflows the page; aim the scroll after that
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('button', { name: 'Projects' }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => sectionTop(page, '#projects'), { timeout: 5000 }).toBeLessThan(120);
});

test('plate image follows the theme', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop theme toggle');
  await page.goto(BAD_PATH);
  const plate = page.locator('.nf-plate img');
  const light = await page.locator('html').getAttribute('data-theme') === 'light';

  await expect(plate).toHaveAttribute('src', light ? /404_light_theme/ : /404_dark_theme/);
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(plate).toHaveAttribute('src', light ? /404_dark_theme/ : /404_light_theme/);
  await expect.poll(() => plate.evaluate(img => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
});

test('malformed percent-encoding still renders the 404 page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  // vite preview rejects this URL with a 400, so reach it through client-side history
  await page.goto('/');
  await page.evaluate(() => {
    history.pushState(null, '', '/%E0%A4%A');
    dispatchEvent(new PopStateEvent('popstate'));
  });

  await expect(page.getByRole('heading', { level: 1, name: 'Variant of unknown significance' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('build ships 404.html for Vercel to serve on unknown paths', async ({ request }) => {
  const res = await request.get('/404.html');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('<div id="root">');
});

test('known routes are not treated as 404', async ({ page }) => {
  for (const path of ['/', '/resume', '/resume/']) {
    await page.goto(path);
    await expect(page.locator('.nf')).toHaveCount(0);
  }
});

test('404.html is noindex and does not claim the home page as canonical', async ({ request }) => {
  const html = await (await request.get('/404.html')).text();
  expect(html).toContain('<meta name="robots" content="noindex" />');
  expect(html).not.toContain('rel="canonical"');
});
