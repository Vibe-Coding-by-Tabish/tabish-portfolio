import { test, expect, type Page, type Locator } from '@playwright/test';

// Gestures and scroll-linked motion (the "fluid interface" pass)

const center = async (locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element has no box');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

// Drag with the mouse in small steps so pointer velocity looks like a real hand
async function drag(page: Page, from: { x: number; y: number }, dx: number, dy: number, steps = 12) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + dx, from.y + dy, { steps });
  await page.mouse.up();
}

const activePhoto = (page: Page) =>
  page.getByRole('tablist', { name: 'Select photo' }).locator('[aria-selected="true"]').getAttribute('aria-label');

// The hero column slides in on load; measure positions only after it settles
const waitForHeroEntrance = (page: Page) => page.waitForTimeout(1200);

const frontCard = (page: Page) =>
  page.locator('.stack-card-inner').filter({ has: page.locator('img[fetchpriority="high"]') });

test.describe('photo stack', () => {
  test('dragging the front card far enough brings the next photo', async ({ page }) => {
    await page.goto('/');
    const card = frontCard(page);
    await expect(card).toBeVisible();
    expect(await activePhoto(page)).toBe('Photo 1');

    await drag(page, await center(card), -160, 0);
    await expect.poll(() => activePhoto(page)).toBe('Photo 2');
  });

  test('dragging right brings the previous photo', async ({ page }) => {
    await page.goto('/');
    await drag(page, await center(frontCard(page)), 160, 0);
    await expect.poll(() => activePhoto(page)).toBe(`Photo 5`);
  });

  test('a short, slow drag springs back without changing the photo', async ({ page }) => {
    await page.goto('/');
    await waitForHeroEntrance(page);
    const card = frontCard(page);
    const before = await card.boundingBox();

    await drag(page, await center(card), -30, 0, 30);
    await page.waitForTimeout(900);
    expect(await activePhoto(page)).toBe('Photo 1');
    const after = await card.boundingBox();
    expect(Math.abs(after!.x - before!.x)).toBeLessThan(2);
  });

  test('the card tilts while it is being dragged', async ({ page }) => {
    await page.goto('/');
    const card = frontCard(page);
    const from = await center(card);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x - 100, from.y, { steps: 10 });
    const transform = await card.evaluate(el => el.style.transform);
    await page.mouse.up();
    expect(transform).toMatch(/rotate\(-\d/);
  });
});

test('timeline line draws with scroll and undraws when scrolling back', async ({ page }) => {
  await page.goto('/');
  const body = page.locator('.tl-body');
  const fill = page.locator('.tl-spine-fill');
  const scaleY = () => fill.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).d);
  const scrollBodyTopTo = (fraction: number) =>
    body.evaluate((el, f) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - window.innerHeight * 0.6 + el.getBoundingClientRect().height * f);
    }, fraction);

  await scrollBodyTopTo(0);
  await expect.poll(scaleY).toBeLessThan(0.05);
  await scrollBodyTopTo(0.5);
  await expect.poll(scaleY).toBeGreaterThan(0.4);
  await expect.poll(scaleY).toBeLessThan(0.6);
  await scrollBodyTopTo(0.1);
  await expect.poll(scaleY).toBeLessThan(0.2);
});

test('header firms up with scroll instead of switching at a threshold', async ({ page }) => {
  await page.goto('/');
  const p = () => page.locator('header.header').evaluate(el => Number(el.style.getPropertyValue('--header-p')));
  await expect.poll(p).toBe(0);
  await page.evaluate(() => window.scrollTo(0, 40));
  await expect.poll(p).toBeGreaterThan(0.3);
  await expect.poll(p).toBeLessThan(0.7);
  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(p).toBe(1);
});

test('buttons respond on press, before release', async ({ page }) => {
  await page.goto('/skills');
  const button = page.getByRole('button', { name: 'View my resume' });
  await button.scrollIntoViewIfNeeded();
  const at = await center(button);
  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await expect.poll(() => button.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeLessThan(0.99);
  await page.mouse.up();
});

test.describe('mobile menu', () => {
  test('pushing the open menu up closes it without tapping a link', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'hamburger menu is mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeVisible();
    await page.waitForTimeout(400); // let the menu finish opening

    // Start the drag on a link: releasing must not navigate
    await drag(page, await center(menu.getByRole('button', { name: 'Resume' })), 0, -90, 8);
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
  });

  test('a small pull down does not close it, and links still work after a drag', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'hamburger menu is mobile only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    const menu = page.locator('#mobile-menu');
    await page.waitForTimeout(400); // let the menu finish opening

    await drag(page, await center(menu.getByRole('button', { name: 'Projects', exact: true })), 0, 40, 8);
    await page.waitForTimeout(600);
    await expect(menu).toBeVisible();

    await menu.getByRole('button', { name: 'Skills', exact: true }).click();
    await expect(page).toHaveURL(/\/skills$/);
  });
});

test('404 plate can be tugged and springs back to its place', async ({ page, isMobile }) => {
  await page.goto('/does-not-exist');
  const plate = page.locator('.nf-plate');
  await expect(plate).toBeVisible();
  await page.waitForTimeout(800); // entrance animation
  const before = await plate.boundingBox();

  // Touch screens only allow a sideways tug, so vertical swipes keep scrolling
  await drag(page, await center(plate), 120, isMobile ? 0 : 60);
  await expect.poll(async () => {
    const now = await plate.boundingBox();
    return Math.abs(now!.x - before!.x) + Math.abs(now!.y - before!.y);
  }, { timeout: 4000 }).toBeLessThan(2);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('sections fade in without sliding', async ({ page }) => {
    await page.goto('/');
    const left = page.locator('.tl-left').first();
    await left.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const x = await left.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).e);
    expect(x).toBe(0);
  });
});

test('without reduced motion, the same section still slides in', async ({ page }) => {
  await page.goto('/');
  const left = page.locator('.tl-left').first();
  await left.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const x = await left.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).e);
  expect(x).toBeLessThan(0);
});
