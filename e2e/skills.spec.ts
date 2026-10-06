import { test, expect, type Page } from '@playwright/test';

const ROLES = ['Software Engineering', 'Data Engineering', 'Data Science', 'AI / ML Engineering'];

const sectionTop = (page: Page, selector: string) =>
  page.locator(selector).evaluate(el => Math.round(el.getBoundingClientRect().top));

async function openSkillsFromHeader(page: Page, isMobile: boolean) {
  if (isMobile) {
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('#mobile-menu').getByRole('button', { name: 'Skills', exact: true }).click();
  } else {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Skills' }).click();
  }
}

test('header Skills link opens the skills page at the top', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await openSkillsFromHeader(page, isMobile);

  await expect(page).toHaveURL(/\/skills$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Software, data and AI/ML engineering' })).toBeVisible();
  for (const role of ROLES) {
    await expect(page.getByRole('heading', { level: 2, name: role })).toBeAttached();
  }
  await expect(page).toHaveTitle('Software, Data & AI/ML Engineer | Tabish Ali Ansari');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('skills page loads directly with header and footer', async ({ page }) => {
  await page.goto('/skills');
  await expect(page.locator('header.header')).toBeVisible();
  await expect(page.locator('footer.footer')).toBeAttached();
  await expect(page.locator('.nf')).toHaveCount(0);
});

test('jump link scrolls to that role section', async ({ page }) => {
  await page.goto('/skills');
  await page.getByRole('navigation', { name: 'Skill areas' }).getByRole('link', { name: /Data Science/ }).click();
  await expect.poll(() => sectionTop(page, '#data-science'), { timeout: 5000 }).toBeLessThan(120);
});

test('"Get in touch" from the skills page lands on the home contact section', async ({ page }) => {
  await page.goto('/skills');
  await page.getByRole('button', { name: 'Get in touch →' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => sectionTop(page, '#contact'), { timeout: 5000 }).toBeLessThan(120);
});

test('footer Projects link from the skills page lands on the home projects section', async ({ page }) => {
  await page.goto('/skills');
  await page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('button', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => sectionTop(page, '#projects'), { timeout: 5000 }).toBeLessThan(120);
});

test('toggling the theme on the skills page keeps the scroll position', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop theme toggle');
  await page.goto('/skills');
  await page.locator('#ai-ml-engineering').scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  expect(before).toBeGreaterThan(200);

  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.scrollY)).toBe(before);
});

test('skills page has no horizontal scroll', async ({ page }) => {
  await page.goto('/skills');
  await page.locator('footer.footer').scrollIntoViewIfNeeded();
  const [scrollW, clientW] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scrollW).toBeLessThanOrEqual(clientW);
});
