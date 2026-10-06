import { test, expect } from '@playwright/test';

test('robots.txt points crawlers at the sitemap', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('Sitemap: https://tabishaliansari.vercel.app/sitemap.xml');
});

test('sitemap.xml lists the home and resume pages', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toContain('<loc>https://tabishaliansari.vercel.app/</loc>');
  expect(body).toContain('<loc>https://tabishaliansari.vercel.app/resume</loc>');
});

test('llms.txt is served as plain text, not the SPA shell', async ({ request }) => {
  const res = await request.get('/llms.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/^# Tabish Ali Ansari/);
  expect(body).not.toContain('<div id="root">');
});
