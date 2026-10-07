import { test, expect } from '@playwright/test';

test('the dock refracts what is behind it in Chromium', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/glass-refract/);
  await expect(page.locator('#liquid-glass')).toBeAttached();
  await expect(page.locator('.dock')).toHaveCSS('backdrop-filter', /url\("#liquid-glass"\)/);
});

test('the refraction map tracks the dock size as it opens and closes', async ({ page }) => {
  await page.goto('/');
  const mapWidth = () => page.locator('#liquid-glass feImage').evaluate(el => Number(el.getAttribute('width')));
  const dockWidth = () => page.locator('.dock').evaluate(el => Math.round(el.getBoundingClientRect().width));
  await expect.poll(async () => Math.abs((await mapWidth()) - (await dockWidth()))).toBeLessThanOrEqual(1);

  // Scroll into a section so the dock collapses to its compact form
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#publications').evaluate(el => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100));
  await expect(page.locator('.dock-dot')).toHaveCount(4);
  await expect.poll(async () => Math.abs((await mapWidth()) - (await dockWidth()))).toBeLessThanOrEqual(1);
});

test('the specular highlight follows the pointer', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover');
  await page.goto('/');
  const button = page.getByRole('link', { name: 'View Projects' });
  // The hero slides in after load; measure only once the button holds still
  let box = (await button.boundingBox())!;
  await expect.poll(async () => {
    const prev = box;
    await page.waitForTimeout(300);
    box = (await button.boundingBox())!;
    return Math.abs(box.x - prev.x) + Math.abs(box.y - prev.y);
  }).toBeLessThan(0.1);
  await page.mouse.move(box.x + 20, box.y + 10);
  await expect(button).toHaveCSS('--mx', '20px');
  await page.mouse.move(box.x + 60, box.y + 10);
  await expect(button).toHaveCSS('--mx', '60px');
});

test('glass buttons squish on press', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mouse press');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle theme' });
  const box = (await toggle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect.poll(() => toggle.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeLessThan(0.97);
  await page.mouse.up();
});

test.describe('reduced transparency', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } });
  test('glass turns solid when the visitor asks for less transparency', async ({ page }) => {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] });
    await page.goto('/');
    await expect(page.locator('.dock')).toHaveCSS('backdrop-filter', 'none');
    await expect(page.getByRole('button', { name: 'Toggle theme' })).toHaveCSS('backdrop-filter', 'none');
  });
});

// Regression: Vite's CSS minifier dropped the standard backdrop-filter when a
// hand-written -webkit- copy sat next to it, so Chrome got no blur at all.
// Write only the standard property; the build adds the prefix.
test('glass surfaces actually blur in Chromium', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['.header', '.theme-toggle', '.nav-resume']) {
    await expect(page.locator(sel).first()).toHaveCSS('backdrop-filter', /blur\(/);
  }
});
