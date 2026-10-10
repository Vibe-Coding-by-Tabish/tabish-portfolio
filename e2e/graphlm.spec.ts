import { test, expect, type Locator, type Page } from '@playwright/test';

const demo = (page: Page) => page.locator('.glm');
const node = (page: Page, id: string) => page.locator(`[data-node="${id}"]`);
// The visible chat, not its screen-reader announcement
const chat = (page: Page) => page.locator('.glm-messages > :not(.glm-sr)');
const chip = (page: Page, question: string) => demo(page).getByRole('button', { name: question });

const Q_GRAPHS = 'What has he built with knowledge graphs?';
const Q_PROD = 'What production work has he shipped?';
const Q_ML = 'What machine learning work has he done?';

async function openDemo(page: Page) {
  await page.goto('/');
  // The web font swapping in reflows the page on phones; scroll after it
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#graphlm').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await expect(demo(page)).toBeVisible();
}

// Centre the target first, clear of the fixed header and the dock
async function tap(target: Locator) {
  await target.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  await target.click();
}

const settled = (page: Page) => expect(demo(page)).toHaveAttribute('data-state', 'done', { timeout: 12_000 });

test('on first sight the demo indexes the resume and answers a question by itself', async ({ page }) => {
  await openDemo(page);
  await settled(page);
  await expect(demo(page).locator('.glm-q')).toHaveText(Q_GRAPHS);
  await expect(chat(page).getByText(/He built GraphLM/)).toBeVisible();
  const cite = demo(page).getByRole('link', { name: 'resume.pdf · Projects' });
  await expect(cite).toHaveAttribute('href', '/resume.pdf');
  // The answer's path lights up in the graph
  for (const id of ['tabish', 'graphlm', 'neo4j', 'qdrant', 'survey']) {
    await expect(node(page, id)).toHaveAttribute('data-lit', 'true');
  }
  await expect(node(page, 'adapt')).not.toHaveAttribute('data-lit', 'true');
});

test('a suggested question answers and lights its own path', async ({ page }) => {
  await openDemo(page);
  await settled(page);
  await tap(chip(page, Q_PROD));
  await settled(page);
  await expect(demo(page).locator('.glm-q')).toHaveText(Q_PROD);
  await expect(chat(page).getByText(/genie\.sh, a 14-phase/)).toBeVisible();
  for (const id of ['nonstop', 'variant', 'envs', 'genie', 'incidents']) {
    await expect(node(page, id)).toHaveAttribute('data-lit', 'true');
  }
  await expect(node(page, 'graphlm')).not.toHaveAttribute('data-lit', 'true');
});

test('typed questions route to the matching answer, or say what the demo knows', async ({ page }) => {
  await openDemo(page);
  await settled(page);
  const input = demo(page).getByRole('textbox', { name: 'Ask GraphLM a question' });

  await input.fill('Where does he work right now?');
  await input.press('Enter');
  await settled(page);
  await expect(chat(page).getByText(/Software Development Engineer at NonStop io/)).toBeVisible();

  await input.fill("What's his favourite colour?");
  await input.press('Enter');
  await expect(chat(page).getByText(/This demo has three answers/)).toBeVisible();
  await expect(demo(page).locator('[data-lit]')).toHaveCount(0);
});

test('unticking the source dims the graph and stops grounded answers', async ({ page }) => {
  await openDemo(page);
  await settled(page);
  const source = demo(page).getByRole('switch', { name: /resume\.pdf/ });
  await tap(source);
  await expect(source).toHaveAttribute('aria-checked', 'false');
  await expect(demo(page).getByText('Select a source to enable the graph')).toBeVisible();

  await tap(chip(page, Q_ML));
  await expect(chat(page).getByText(/No sources selected/)).toBeVisible();

  await tap(source);
  await expect(source).toHaveAttribute('aria-checked', 'true');
  await tap(chip(page, Q_ML));
  await settled(page);
  await expect(chat(page).getByText(/ADAPT classifies/)).toBeVisible();
});

test('tapping a node shows the entity and can ask about it', async ({ page }) => {
  await openDemo(page);
  await settled(page);
  await tap(node(page, 'adapt'));
  await expect(demo(page).getByText("Alzheimer's stage classification from MRI scans")).toBeVisible();
  await tap(demo(page).getByRole('button', { name: 'Ask about ADAPT →' }));
  await settled(page);
  await expect(demo(page).locator('.glm-q')).toHaveText(Q_ML);
  await expect(node(page, 'adapt')).toHaveAttribute('data-lit', 'true');
});

test('touching the demo while it types to itself hands control over', async ({ page }) => {
  await openDemo(page);
  const input = demo(page).getByRole('textbox', { name: 'Ask GraphLM a question' });
  // Wait until the self-typing has begun
  await expect(input).not.toHaveValue('', { timeout: 6000 });
  await tap(chip(page, Q_ML));
  await settled(page);
  await expect(demo(page).locator('.glm-q')).toHaveText(Q_ML);
  await expect(input).toHaveValue('');
  // Nothing resumes behind the visitor's back
  await page.waitForTimeout(2500);
  await expect(demo(page).locator('.glm-q')).toHaveText(Q_ML);
});

test('desktop shows the three-pane workspace with a labelled graph', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop layout');
  await openDemo(page);
  await settled(page);
  const chat = await demo(page).getByRole('region', { name: 'Chat' }).boundingBox();
  const canvas = await demo(page).getByRole('region', { name: 'Graph view' }).boundingBox();
  expect(canvas!.x).toBeGreaterThan(chat!.x + chat!.width - 2);
  expect(Math.abs(canvas!.y - chat!.y)).toBeLessThan(2);
  await expect(demo(page).locator('.glm-graph')).toHaveAttribute('data-mode', 'wide');
  // Every entity is a labelled pill, and lit edges name their relationship
  await expect(demo(page).locator('.glm-node.is-dot')).toHaveCount(0);
  await expect(demo(page).locator('.glm-rel').first()).toBeVisible();
});

test('phones stack the graph above the chat and fit every width', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Phone layout');
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 740 });
    await openDemo(page);
    await settled(page);
    const chat = await demo(page).getByRole('region', { name: 'Chat' }).boundingBox();
    const canvas = await demo(page).getByRole('region', { name: 'Graph view' }).boundingBox();
    expect(canvas!.y + canvas!.height).toBeLessThanOrEqual(chat!.y + 1);
    await expect(demo(page).locator('.glm-graph')).toHaveAttribute('data-mode', 'compact');
    // Off-path entities shrink to dots; the lit path keeps its labels
    await expect(node(page, 'graphlm')).not.toHaveClass(/is-dot/);
    await expect(node(page, 'adapt')).toHaveClass(/is-dot/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // Pills stay inside the graph
    const graph = (await demo(page).locator('.glm-graph').boundingBox())!;
    for (const pill of await demo(page).locator('.glm-pill').all()) {
      const box = (await pill.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(graph.x - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(graph.x + graph.width + 1);
    }
  }
});

test('with reduced motion the first answer is simply there', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openDemo(page);
  await expect(demo(page)).toHaveAttribute('data-state', 'done', { timeout: 2000 });
  await expect(chat(page).getByText(/understanding \(2025\)/)).toBeVisible();
});

test('projects lead with GraphLM and keep the long story behind a toggle', async ({ page }) => {
  await page.goto('/');
  const titles = page.locator('#projects .project-title');
  await expect(titles).toHaveText([/^GraphLM/, /^ADAPT/, /^MetaboliQ AI/]);
  await expect(page.locator('#projects')).not.toContainText('StrixFlow');
  await expect(page.locator('#projects')).not.toContainText('InterGenix');

  const build = page.locator('#adapt .project-build');
  await expect(build.locator('p')).toBeHidden();
  await tap(build.getByText('How it’s built'));
  await expect(build.locator('p')).toBeVisible();
});
