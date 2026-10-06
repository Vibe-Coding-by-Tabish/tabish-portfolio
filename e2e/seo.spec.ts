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
  expect(body).toContain('<loc>https://tabishaliansari.vercel.app/skills</loc>');
});

test('llms.txt is served as plain text, not the SPA shell', async ({ request }) => {
  const res = await request.get('/llms.txt');
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body).toMatch(/^# Tabish Ali Ansari/);
  expect(body).not.toContain('<div id="root">');
});

// Read the served HTML directly: this is what crawlers and link previews see
// before any JavaScript runs.
const headOf = async (request: import('@playwright/test').APIRequestContext, path: string) => {
  const res = await request.get(path);
  expect(res.status()).toBe(200);
  return res.text();
};

test('home HTML carries its own title, description, canonical and Person schema', async ({ request }) => {
  const html = await headOf(request, '/');
  expect(html).toContain('<title>Tabish Ali Ansari | Clinical Genomics Software Engineer</title>');
  expect(html).toMatch(/<meta name="description" content="Tabish Ali Ansari: software engineer in Pune[^"]+"/);
  expect(html).toContain('<link rel="canonical" href="https://tabishaliansari.vercel.app/"');
  expect(html).toContain('<meta property="og:url" content="https://tabishaliansari.vercel.app/"');

  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  expect(ld).not.toBeNull();
  const person = JSON.parse(ld![1])['@graph'].find((n: { '@type': string }) => n['@type'] === 'Person');
  expect(person.name).toBe('Tabish Ali Ansari');
  expect(person.sameAs).toContain('https://github.com/tabishaliansari');
});

test('resume HTML is served with resume-specific metadata, not the home page tags', async ({ request }) => {
  const html = await headOf(request, '/resume');
  expect(html).toContain('<title>Resume | Tabish Ali Ansari, Software Engineer</title>');
  expect(html).toContain('<link rel="canonical" href="https://tabishaliansari.vercel.app/resume"');
  expect(html).toContain('<meta property="og:url" content="https://tabishaliansari.vercel.app/resume"');
  expect(html).not.toContain('Clinical Genomics Software Engineer</title>');
});

test('skills HTML is served with skills-specific metadata', async ({ request }) => {
  const html = await headOf(request, '/skills');
  expect(html).toContain('<title>Software, Data &amp; AI/ML Engineer | Tabish Ali Ansari</title>');
  expect(html).toContain('<link rel="canonical" href="https://tabishaliansari.vercel.app/skills"');
});

test('client-side navigation swaps title and canonical between pages', async ({ page }) => {
  const canonical = page.locator('link[rel="canonical"]');
  await page.goto('/');
  await expect(page).toHaveTitle('Tabish Ali Ansari | Clinical Genomics Software Engineer');

  await page.goto('/resume');
  await expect(page).toHaveTitle('Resume | Tabish Ali Ansari, Software Engineer');
  await expect(page.getByRole('heading', { level: 1, name: 'Resume' })).toBeAttached();
  await page.getByRole('button', { name: '← Portfolio' }).click();
  await expect(page).toHaveTitle('Tabish Ali Ansari | Clinical Genomics Software Engineer');
  await expect(canonical).toHaveAttribute('href', 'https://tabishaliansari.vercel.app/');
});

test('leaving the 404 page for the resume keeps the resume title', async ({ page }) => {
  await page.goto('/does-not-exist');
  await expect(page).toHaveTitle(/^404/);
  await page.getByRole('button', { name: 'View my resume' }).click();
  await expect(page).toHaveTitle('Resume | Tabish Ali Ansari, Software Engineer');
});
