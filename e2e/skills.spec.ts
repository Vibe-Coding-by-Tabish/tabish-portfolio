import { test, expect, type Locator, type Page } from '@playwright/test';

const OPTIONS = [
  { id: 'bioinformatics-pipelines', name: 'Bioinformatics Pipelines (Nextflow)', statement: 'Pipelines that pick up where they failed.' },
  { id: 'software-engineering', name: 'Software Engineering', statement: 'Typed. Secured. Shipped.' },
  { id: 'ai-data-engineering', name: 'AI & Data Engineering', statement: 'Don’t take my word for it. Try them.' },
  { id: 'health-data-integration', name: 'Health Data Integration (HL7 v2 / FHIR)', statement: 'HL7 v2 in. FHIR out.' },
];

const sectionTop = (page: Page, selector: string) =>
  page.locator(selector).evaluate(el => Math.round(el.getBoundingClientRect().top));

const areas = (page: Page) => page.getByRole('navigation', { name: 'Skill areas' });
const statement = (page: Page, text: string) => page.getByRole('heading', { level: 2, name: text });

// Centre the target first, clear of the fixed header, the switcher and the dock
async function tap(target: Locator) {
  await target.evaluate(el => el.scrollIntoView({ block: 'center' }));
  await target.click();
}

async function openSkillsFromDock(page: Page) {
  const dock = page.getByRole('navigation', { name: 'Sections' });
  // Compact while reading: the first tap opens it, the second picks Skills
  await expect(dock.locator('.dock-dot')).toHaveCount(4);
  await dock.locator('.dock-item.is-dot').first().click();
  await dock.getByRole('button', { name: 'Skills', exact: true }).click();
}

test('dock Skills link opens the skills page at the top, on the overview', async ({ page }) => {
  await page.goto('/');
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await openSkillsFromDock(page);

  await expect(page).toHaveURL(/\/skills$/);
  await expect(page.getByRole('heading', { level: 1, name: 'What are you looking for?' })).toBeVisible();
  for (const o of OPTIONS) {
    await expect(areas(page).getByRole('button', { name: new RegExp(`^${o.name.replace(/[()/]/g, '\\$&')}`) })).toBeVisible();
  }
  await expect(page).toHaveTitle('Nextflow, Software, AI & FHIR Engineer | Tabish Ali Ansari');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('every option’s words are in the page, even off stage', async ({ page }) => {
  await page.goto('/skills');
  for (const o of OPTIONS) {
    await expect(page.getByText(o.statement, { exact: true })).toBeAttached();
  }
});

test('skills page loads directly with header and footer', async ({ page }) => {
  await page.goto('/skills');
  await expect(page.locator('header.header')).toBeVisible();
  await expect(page.locator('footer.footer')).toBeAttached();
  await expect(page.locator('.nf')).toHaveCount(0);
});

test('picking an option shows only that option, with its own link, and Back returns', async ({ page }) => {
  await page.goto('/skills');
  await tap(areas(page).getByRole('button', { name: /^Software Engineering/ }));
  await expect(page).toHaveURL(/\/skills#software-engineering$/);
  await expect(statement(page, OPTIONS[1].statement)).toBeVisible();
  await expect(statement(page, OPTIONS[0].statement)).toHaveCount(0);
  // The icons have become a switcher
  await expect(areas(page).getByRole('button', { name: 'Software Engineering' })).toHaveAttribute('aria-current', 'true');

  await page.goBack();
  await expect(page).toHaveURL(/\/skills$/);
  await expect(statement(page, OPTIONS[1].statement)).toHaveCount(0);
  await expect(areas(page).getByRole('button', { name: /^Health Data Integration/ })).toBeVisible();
});

test('direct and older links land on the right option', async ({ page }) => {
  await page.goto('/skills#health-data-integration');
  await expect(statement(page, OPTIONS[3].statement)).toBeVisible();

  await page.goto('/skills#nextflow');
  await expect(statement(page, OPTIONS[0].statement)).toBeVisible();

  // Links shared before the redesign
  await page.goto('/skills#data-science');
  await expect(statement(page, OPTIONS[2].statement)).toBeVisible();
});

test('the switcher and the Next link move between options', async ({ page }) => {
  await page.goto('/skills#bioinformatics-pipelines');
  await expect(statement(page, OPTIONS[0].statement)).toBeVisible();
  await tap(page.getByRole('button', { name: /^Next: Software Engineering/ }));
  await expect(statement(page, OPTIONS[1].statement)).toBeVisible();
  await expect(page).toHaveURL(/#software-engineering$/);

  await tap(areas(page).getByRole('button', { name: 'Health Data Integration (HL7 v2 / FHIR)' }));
  await expect(statement(page, OPTIONS[3].statement)).toBeVisible();
  // From the last option, Next wraps round to the first
  await expect(page.getByRole('button', { name: /^Next: Bioinformatics Pipelines/ })).toBeVisible();

  await tap(areas(page).getByRole('button', { name: 'All skill areas' }));
  await expect(page).toHaveURL(/\/skills$/);
});

test('phones swipe sideways between options', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch gesture');
  await page.goto('/skills#software-engineering');
  await expect(statement(page, OPTIONS[1].statement)).toBeVisible();
  const head = page.locator('.sk-stage-head');
  await head.evaluate(el => el.scrollIntoView({ block: 'center' }));
  const box = (await head.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.8, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width * (0.8 - i * 0.06), y);
  await page.mouse.up();
  await expect(statement(page, OPTIONS[2].statement)).toBeVisible();
});

test('pipelines: a failed step resumes from the cache', async ({ page }) => {
  await page.goto('/skills#bioinformatics-pipelines');
  // On first sight the demo breaks CALL_VARIANTS by itself and stops there
  const resume = page.getByRole('button', { name: /-resume/ });
  await expect(resume).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.pl-step.is-failed')).toHaveCount(1);
  await tap(resume);
  await expect(page.getByText(/3 of 5 processes came from the cache/)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.pl-step.is-cached')).toHaveCount(3);

  // Executors are interchangeable; a clean run uses the one chosen
  await tap(page.getByRole('radio', { name: 'HealthOmics' }));
  await tap(page.getByRole('button', { name: 'Run again' }));
  await expect(page.getByText('Completed. 5 processes on HealthOmics.')).toBeVisible({ timeout: 10_000 });
});

test('software: the ETL endpoint validates its contract before any work', async ({ page }) => {
  await page.goto('/skills#software-engineering');
  // On first sight a valid request goes through every stage
  await expect(page.getByText('200 OK', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.etl-step.is-done')).toHaveCount(5);

  await tap(page.getByRole('radio', { name: 'Missing field' }));
  await tap(page.getByRole('button', { name: 'Send request' }));
  await expect(page.getByText('422 Unprocessable Entity')).toBeVisible();
  await expect(page.locator('.etl-json').last()).toContainText('"loc": ["body", "dataset_id"]');
  // Rejected at validation: nothing is extracted or loaded
  await expect(page.locator('.etl-step.is-failed')).toHaveText('✕Validate');
  await expect(page.locator('.etl-step.is-done')).toHaveCount(1);

  await tap(page.getByRole('radio', { name: 'No token' }));
  await tap(page.getByRole('button', { name: 'Send request' }));
  await expect(page.getByText('401 Unauthorized')).toBeVisible();

  await tap(page.getByRole('button', { name: /Show the route/ }));
  await expect(page.locator('.etl-code')).toContainText('Depends(verify_token)');
});

test('software: Okta machine-to-machine tokens are checked for scope and expiry', async ({ page }) => {
  await page.goto('/skills#software-engineering');
  await tap(page.getByRole('tab', { name: /Okta M2M/ }));
  const verdict = page.locator('.okta-verdict');
  await expect(verdict).toContainText('200 OK', { timeout: 10_000 });
  await expect(page.locator('.okta-claims')).toContainText('"scp"');

  await tap(page.getByRole('radio', { name: 'Wrong scope' }));
  await expect(verdict).toContainText('403 Forbidden', { timeout: 10_000 });
  await tap(page.getByRole('radio', { name: 'Expired' }));
  await expect(page.locator('.okta-claims .is-bad')).toContainText('1 hour ago');
  await tap(page.getByRole('radio', { name: 'No token' }));
  await expect(verdict).toContainText('401 Unauthorized', { timeout: 10_000 });
  await expect(page.getByText('(skipped: no token requested)')).toHaveCount(2);
});

test('software: genie.sh deploys in one command and resumes after Ctrl+C', async ({ page }) => {
  await page.goto('/skills#software-engineering');
  await tap(page.getByRole('tab', { name: /genie\.sh/ }));
  await tap(page.getByRole('button', { name: 'Deploy uat' }));
  // Let a few phases run before interrupting
  await expect(page.getByText(/\[ 3\/14\]/)).toBeVisible();
  await page.getByRole('button', { name: 'Ctrl + C' }).click();
  await expect(page.getByText(/Interrupted at phase \d+\/14/)).toBeVisible();
  await tap(page.getByRole('button', { name: 'Resume uat deploy' }));
  await expect(page.getByText(/Resuming at phase/)).toBeVisible();
  await expect(page.getByText('✓ uat is live. One command, no manual steps.')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByLabel('uat is live')).toBeAttached();
});

test('health data: tap a field to see where it lands, and broken messages are rejected', async ({ page }) => {
  await page.goto('/skills#health-data-integration');
  await tap(page.getByRole('button', { name: /^PID-7, Date of birth/ }));
  const inspector = page.locator('.io-inspect');
  await expect(inspector).toContainText('Date of birth');
  await expect(inspector).toContainText('Patient.birthDate');
  await expect(page.locator('.io-json-line.is-active')).toContainText('"birthDate": "1986-02-14"');

  await tap(page.getByRole('button', { name: 'Break the message' }));
  await expect(page.getByText(/HAPI validation failed: PID-7/)).toBeVisible();
  await expect(page.getByText(/Not converted/)).toBeVisible();
  await tap(page.getByRole('button', { name: 'Fix the message' }));
  await expect(page.getByText('✓ Valid ORU^R01. Converted to 2 FHIR resources.')).toBeVisible();
});

test('AI & data: each card opens its live demo on the home page', async ({ page }) => {
  await page.goto('/skills#ai-data-engineering');
  await tap(page.getByRole('button', { name: /^ADAPT: .* Open the live demo$/ }));
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => sectionTop(page, '#adapt'), { timeout: 5000 }).toBeLessThan(160);
});

test('every option fits a phone without sideways scroll', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone widths');
  await page.setViewportSize({ width: 320, height: 700 });
  for (const o of OPTIONS) {
    await page.goto(`/skills#${o.id}`);
    await expect(statement(page, o.statement)).toBeVisible();
    await page.waitForTimeout(400);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, o.id).toBeLessThanOrEqual(0);
  }
});

test('"Get in touch" from the skills page lands on the home contact section', async ({ page }) => {
  await page.goto('/skills');
  await page.evaluate(() => document.fonts.ready);
  await tap(page.getByRole('button', { name: 'Get in touch →' }));
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => sectionTop(page, '#contact'), { timeout: 5000 }).toBeLessThan(120);
});

test('each option ends with a "let’s talk" email about that option', async ({ page }) => {
  await page.goto('/skills#ai-data-engineering');
  const cta = page.getByRole('link', { name: 'Let’s talk about your AI and data work →' });
  await expect(cta).toHaveAttribute('href', /^mailto:.*subject=AI%20%26%20Data%20Engineering/);
});

test('footer Projects link from the skills page lands on the home projects section', async ({ page }) => {
  await page.goto('/skills');
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('button', { name: 'Projects' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => sectionTop(page, '#projects'), { timeout: 5000 }).toBeLessThan(120);
});

test('toggling the theme on the skills page keeps the scroll position', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop theme toggle');
  await page.goto('/skills#software-engineering');
  // Web fonts swapping in reflow the text, and scroll anchoring then nudges
  // scrollY by itself; measure only once that has happened
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.sk-stage .sk-proof').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
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
