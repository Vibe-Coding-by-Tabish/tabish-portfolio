import { test, expect } from '@playwright/test';

// The single accent colour: deep cobalt in light mode, lighter cobalt in dark
const ACCENT = { light: 'rgb(67, 83, 201)', dark: 'rgb(107, 120, 214)' } as const;

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(t => localStorage.setItem('theme', t), theme);
    });

    test('keyboard focus shows an accent ring', async ({ page }) => {
      await page.goto('/');
      const link = page.locator('.project-link').first();
      await link.scrollIntoViewIfNeeded();
      await link.focus();
      // Programmatic focus doesn't count as keyboard focus; tab back into it
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
      await expect(link).toBeFocused();
      const outline = await link.evaluate(el => {
        const s = getComputedStyle(el);
        return { style: s.outlineStyle, color: s.outlineColor };
      });
      expect(outline).toEqual({ style: 'solid', color: ACCENT[theme] });
    });

    test('active photo dot and timeline progress use the accent', async ({ page }) => {
      await page.goto('/');
      const dot = page.locator('.stack-dot.active');
      await expect(dot).toHaveCSS('background-color', ACCENT[theme]);
      await expect(page.locator('.tl-spine-fill')).toHaveCSS('background-color', ACCENT[theme]);
    });
  });
}
