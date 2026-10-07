import { test, expect, type Page } from '@playwright/test';

const dock = (page: Page) => page.getByRole('navigation', { name: 'Sections' });
const labelled = (page: Page, name: string) => dock(page).getByRole('button', { name, exact: true });

async function scrollToSection(page: Page, id: string) {
  // The web font swapping in reflows the page by ~140px on phones; scroll after it
  await page.evaluate(() => document.fonts.ready);
  await page.locator(id).evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100));
}

test('at the top of the page the dock is open with every section', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Projects', 'Papers', 'Skills', 'Contact']) {
    await expect(labelled(page, name)).toBeVisible();
  }
});

test('while reading, it shows only the current section, in the accent colour', async ({ page }) => {
  await page.goto('/');
  await scrollToSection(page, '#publications');

  const current = labelled(page, 'Papers');
  await expect(current).toBeVisible();
  await expect(current).toHaveAttribute('aria-current', 'location');
  await expect(current).toHaveCSS('color', /rgb\((67, 83, 201|143, 155, 227)\)/);
  // The others collapse to dots
  await expect(labelled(page, 'Projects')).toHaveCount(0);
  await expect(dock(page).locator('.dock-dot')).toHaveCount(3);
});

test('the current section follows the scroll', async ({ page }) => {
  await page.goto('/');
  await scrollToSection(page, '#projects');
  await expect(labelled(page, 'Projects')).toHaveAttribute('aria-current', 'location');
  await scrollToSection(page, '#publications');
  await expect(labelled(page, 'Papers')).toHaveAttribute('aria-current', 'location');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(labelled(page, 'Contact')).toHaveAttribute('aria-current', 'location');
});

test('tapping the compact dock opens it; picking a section goes there', async ({ page }) => {
  await page.goto('/');
  await scrollToSection(page, '#projects');
  await expect(labelled(page, 'Contact')).toHaveCount(0);

  // A tap on a dot opens the dock rather than navigating
  await dock(page).locator('.dock-item.is-dot').first().click();
  await expect(labelled(page, 'Contact')).toBeVisible();

  await labelled(page, 'Contact').click();
  await expect
    .poll(() => page.locator('#contact').evaluate(el => Math.round(el.getBoundingClientRect().top)), { timeout: 5000 })
    .toBeLessThan(120);
});

test('an opened dock closes on a tap outside or on scroll', async ({ page }) => {
  await page.goto('/');
  await scrollToSection(page, '#projects');
  const open = () => dock(page).locator('.dock-item.is-dot').first().click();

  await open();
  await expect(labelled(page, 'Contact')).toBeVisible();
  await page.mouse.click(20, 300);
  await expect(labelled(page, 'Contact')).toHaveCount(0);

  await open();
  await expect(labelled(page, 'Contact')).toBeVisible();
  await page.mouse.wheel(0, 300);
  await expect(labelled(page, 'Contact')).toHaveCount(0);
});

test('Escape closes an opened dock', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard');
  await page.goto('/');
  await scrollToSection(page, '#projects');
  await dock(page).locator('.dock-item.is-dot').first().click();
  await expect(labelled(page, 'Contact')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(labelled(page, 'Contact')).toHaveCount(0);
});

test('on the skills page, Skills is the current item', async ({ page }) => {
  await page.goto('/skills');
  await expect(labelled(page, 'Skills')).toHaveAttribute('aria-current', 'location');
});

test('the dock never covers the footer at the bottom of the page', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  const copy = await page.locator('.footer-copy').boundingBox();
  const bar = await dock(page).boundingBox();
  expect(copy!.y + copy!.height).toBeLessThanOrEqual(bar!.y);
});

test('the resume viewer has no dock', async ({ page }) => {
  await page.goto('/resume');
  await expect(dock(page)).toHaveCount(0);
});

test('the dock fits a small phone without horizontal scroll', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone width');
  await page.goto('/');
  const bar = await dock(page).boundingBox();
  expect(bar!.x).toBeGreaterThanOrEqual(0);
  expect(bar!.x + bar!.width).toBeLessThanOrEqual(375);
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw).toBeLessThanOrEqual(cw);
});

test.describe('short laptop screen', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('the dock steps aside rather than cover the hero buttons, and returns on scroll', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop size');
    await page.goto('/');
    const wrap = page.locator('.dock-wrap');
    await expect(wrap).toHaveAttribute('inert', '');
    // The hero's main button is reachable, not under the dock
    await page.getByRole('link', { name: 'View Projects' }).click({ trial: true });

    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(wrap).not.toHaveAttribute('inert');
    await expect(labelled(page, 'Contact').or(dock(page).locator('.dock-dot').first())).toBeVisible();
  });
});
