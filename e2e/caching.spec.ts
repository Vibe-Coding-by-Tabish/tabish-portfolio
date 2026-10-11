import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

// vercel.json tells browsers to keep everything under /assets for a year
// without asking again. That is only safe while every file there has a
// content hash in its name, so a changed file always gets a new URL.
test('long-lived caching applies only to content-hashed build assets', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  const rule = config.headers?.find((h: { source: string }) => h.source === '/assets/(.*)');
  expect(rule?.headers).toContainEqual({ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' });

  // The test server builds dist/ before any spec runs
  const files = readdirSync('dist/assets');
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    expect(file, `${file} has no content hash`).toMatch(/-[A-Za-z0-9_-]{8}\.(js|css)$/);
  }

  // Nothing hand-placed in public/assets could slip in unhashed
  expect(readdirSync('public')).not.toContain('assets');
});
