import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext } from '@playwright/test';
import { getYear, toDate } from '../../src/utils/dateUtils';

const PROJECT_ID = 'demo-dgno';
const FIRESTORE_BASE = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const CONSENT_COOKIE = {
  name: 'dgnov3CookieConsent',
  value: 'false',
  url: 'http://127.0.0.1:5000',
};

async function seedDocument(
  request: APIRequestContext,
  collection: string,
  id: string,
  fields: Record<string, unknown>,
) {
  const response = await request.patch(`${FIRESTORE_BASE}/${collection}/${id}`, {
    headers: { Authorization: 'Bearer owner' },
    data: { fields },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
}

test.beforeAll(async ({ request }) => {
  await seedDocument(request, 'articles', 'release-test-article', {
    title: { stringValue: 'A verified DGNO test article' },
    slug: { stringValue: 'release-test-story' },
    summary: { stringValue: 'A source-backed summary for route tests.' },
    content: { stringValue: '<p>Verified article body.</p>' },
    featuredImageUrl: { stringValue: 'https://images.example.org/reporting/photo.jpg' },
    featuredImageDescription: { stringValue: 'A representative reporting image.' },
    authorId: { stringValue: 'release-test-author' },
    authorName: { stringValue: 'Test Reporter' },
    section: { stringValue: 'Politics' },
    tags: { arrayValue: { values: [{ stringValue: 'civil rights' }] } },
    status: { stringValue: 'published' },
    isActive: { booleanValue: true },
    publishedAt: { timestampValue: '2026-07-24T19:00:00.000Z' },
    lastUpdatedAt: { timestampValue: '2026-07-24T20:00:00.000Z' },
  });
  await seedDocument(request, 'users', 'release-test-author', {
    displayName: { stringValue: 'Test Reporter' },
    bio: { stringValue: 'A DGNO reporter profile used only in emulator tests.' },
    isActive: { booleanValue: true },
  });
  await seedDocument(request, 'trackers', 'release-test-tracker', {
    name: { stringValue: 'Release Test Tracker' },
    slug: { stringValue: 'release-test-tracker' },
    description: { stringValue: 'A public tracker used only in emulator tests.' },
    isActive: { booleanValue: true },
    createdAt: { timestampValue: '2026-07-24T18:00:00.000Z' },
    updatedAt: { timestampValue: '2026-07-24T20:00:00.000Z' },
  });
});

test('date conversion accepts legacy timestamp maps and rejects invalid dates', () => {
  expect(toDate({ seconds: 1770404844, nanoseconds: 821000000 })?.toISOString())
    .toBe('2026-02-06T19:07:24.821Z');
  expect(toDate({ seconds: '1762210223', nanoseconds: '90000000' })?.toISOString())
    .toBe('2025-11-03T22:50:23.090Z');
  expect(toDate('not-a-real-date')).toBeNull();
  expect(toDate({ unexpected: 'object' })).toBeNull();
  expect(toDate({ seconds: 1770404844, nanoseconds: 1_000_000_000 })).toBeNull();
  expect(getYear({ seconds: '1762210223', nanoseconds: '90000000' })).toBe(2025);
});

test('article aliases redirect and crawler HTML owns canonical metadata', async ({ request }) => {
  const alias = await request.get('/article/release-test-story', { maxRedirects: 0 });
  expect(alias.status()).toBe(301);
  expect(alias.headers().location).toBe('/article/2026/07/24/release-test-story');

  const wrongDate = await request.get('/article/2026/07/23/release-test-story', { maxRedirects: 0 });
  expect(wrongDate.status()).toBe(301);
  expect(wrongDate.headers().location).toBe('/article/2026/07/24/release-test-story');

  const canonical = await request.get('/article/2026/07/24/release-test-story');
  expect(canonical.status()).toBe(200);
  const html = await canonical.text();
  expect(html).toContain('<link rel="canonical" href="https://dgno.us/article/2026/07/24/release-test-story">');
  expect(html).toContain('data-seo-server="article-page"');
  expect(html).toContain('<meta property="og:image" content="https://images.example.org/reporting/photo.jpg">');
});

test('missing public routes return real noindex 404 responses', async ({ request }) => {
  for (const path of ['/article/does-not-exist', '/tracker/does-not-exist', '/not-a-real-public-page']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()['x-robots-tag'], path).toContain('noindex');
    expect(response.headers()['x-content-type-options'], path).toBe('nosniff');
    expect(response.headers()['x-frame-options'], path).toBe('DENY');
    expect(response.headers()['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(await response.text(), path).toContain('not found');
  }
});

test('active tracker and daily archive return crawler-ready HTML', async ({ request }) => {
  const tracker = await request.get('/tracker/release-test-tracker');
  expect(tracker.status()).toBe(200);
  expect(await tracker.text()).toContain('data-seo-server="tracker-page"');

  const archive = await request.get('/article/2026/07/24');
  expect(archive.status()).toBe(200);
  expect(archive.headers()['x-robots-tag']).toContain('noindex');
  const html = await archive.text();
  expect(html).toContain('data-seo-server="archive-page"');
  expect(html).toContain('/article/2026/07/24/release-test-story');

  const invalidArchive = await request.get('/article/2026/02/30');
  expect(invalidArchive.status()).toBe(404);
});

test('bounded article API validates and applies section/date filters', async ({ request }) => {
  const section = await request.get('/api/articles?section=Politics&limit=5');
  expect(section.status()).toBe(200);
  const sectionPayload = await section.json();
  expect(sectionPayload.section).toBe('Politics');
  expect(sectionPayload.articles).toHaveLength(1);
  expect(sectionPayload.articles[0]).not.toHaveProperty('content');

  const date = await request.get('/api/articles?publishedOn=2026-07-24&limit=5');
  expect(date.status()).toBe(200);
  const datePayload = await date.json();
  expect(datePayload.publishedOn).toBe('2026-07-24');
  expect(datePayload.articles).toHaveLength(1);

  expect((await request.get('/api/articles?publishedOn=2026-02-30')).status()).toBe(400);
  expect((await request.get('/api/articles?section=NotASection')).status()).toBe(400);
  expect((await request.get('/api/articles?section=Politics&publishedOn=2026-07-24')).status()).toBe(400);
});

test('public collection routes return self-canonical crawler HTML', async ({ request }) => {
  const cases = [
    ['/trackers', 'https://dgno.us/trackers', 'DGNO Trackers'],
    ['/articles/politics', 'https://dgno.us/articles/politics', 'Politics News'],
    ['/author/release-test-author', 'https://dgno.us/author/release-test-author', 'Test Reporter'],
    ['/about', 'https://dgno.us/about', 'About DGNO'],
  ];
  for (const [path, canonical, heading] of cases) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html, path).toContain(`<link rel="canonical" href="${canonical}">`);
    expect(html, path).toContain(`<meta property="og:url" content="${canonical}">`);
    expect(html, path).toContain(`>${heading}</h1>`);
    expect(html, path).toContain('data-seo-server="public-page"');
  }

  expect(await (await request.get('/trackers')).text()).toContain('/tracker/release-test-tracker');
  expect(await (await request.get('/articles/politics')).text()).toContain('/article/2026/07/24/release-test-story');
  const search = await request.get('/search?q=verified');
  expect(search.headers()['x-robots-tag']).toContain('noindex');
  expect((await request.get('/login')).status()).toBe(200);
  expect((await request.get('/dashboard')).status()).toBe(200);
});

test('public search covers articles, trackers, and static resources', async ({ request }) => {
  const article = await request.get('/api/search?q=verified&type=article&limit=10');
  expect(article.status()).toBe(200);
  const articlePayload = await article.json();
  expect(articlePayload.results).toEqual(expect.arrayContaining([
    expect.objectContaining({
      type: 'article',
      title: 'A verified DGNO test article',
      url: '/article/2026/07/24/release-test-story',
    }),
  ]));
  expect(articlePayload.results[0]).not.toHaveProperty('searchText');

  const tracker = await request.get('/api/search?q=release%20test%20tracker&type=tracker');
  expect(tracker.status()).toBe(200);
  expect((await tracker.json()).results).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'tracker', url: '/tracker/release-test-tracker' }),
  ]));

  const resource = await request.get('/api/search?q=unemployment&type=resource');
  expect(resource.status()).toBe(200);
  expect((await resource.json()).results).toEqual(expect.arrayContaining([
    expect.objectContaining({ type: 'resource', url: '/reports' }),
  ]));

  expect((await request.get('/api/search?q=a')).status()).toBe(400);
  expect((await request.get('/api/search?q=verified&type=private')).status()).toBe(400);
});

test('contact API rejects unsafe requests before delivery', async ({ request }) => {
  const unsupportedMethod = await request.get('/api/contact');
  expect(unsupportedMethod.status()).toBe(405);
  expect(unsupportedMethod.headers().allow).toBe('POST, OPTIONS');

  const invalid = await request.post('/api/contact', {
    data: {
      name: 'Reader',
      email: 'not-an-email',
      topic: 'reporting',
      message: 'A sufficiently detailed message for the newsroom.',
    },
  });
  expect(invalid.status()).toBe(400);
  expect(await invalid.json()).toEqual({ error: 'Email must be a valid address' });
});

test('contact form is responsive, accessible, and sends the expected private payload', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  let submitted: Record<string, string> | undefined;
  await page.route('**/api/contact', async (route) => {
    submitted = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({ status: 202, contentType: 'application/json', body: '{"ok":true}' });
  });

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contact');
    await expect(page.getByRole('heading', { level: 1, name: 'Contact DGNO' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `contact overflow at ${width}px`)
      .toBeLessThanOrEqual(width);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
  }

  await page.getByLabel('Name').fill('Test Reader');
  await page.getByLabel('Reply email').fill('reader@example.com');
  await page.getByLabel('Topic').selectOption('correction');
  await page.getByLabel('Article or tracker URL (optional)').fill('https://dgno.us/article/example');
  await page.getByLabel('Message').fill('This correction request includes enough detail to review.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByRole('status')).toHaveText('Your message was sent to the DGNO newsroom.');
  expect(submitted).toMatchObject({
    name: 'Test Reader',
    email: 'reader@example.com',
    topic: 'correction',
    sourceUrl: 'https://dgno.us/article/example',
    message: 'This correction request includes enough detail to review.',
  });
  await expect(page.getByText('rubencazpress@proton.me')).toHaveCount(0);
});

test('shared shell stays within target viewports with one heading and main landmark', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      headings: document.querySelectorAll('h1').length,
      mains: document.querySelectorAll('main').length,
      skipLink: Boolean(document.querySelector('a[href="#main-content"]')),
    }));
    expect(layout.viewport).toBe(width);
    expect(layout.documentWidth, `document overflow at ${width}px`).toBeLessThanOrEqual(width);
    expect(layout.bodyWidth, `body overflow at ${width}px`).toBeLessThanOrEqual(width);
    expect(layout.headings).toBe(1);
    expect(layout.mains).toBe(1);
    expect(layout.skipLink).toBe(true);
  }
});

test('article and tracker loading keep mobile layout shifts below the good threshold', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(() => {
    const metrics = window as typeof window & { __dgnoCls?: number };
    metrics.__dgnoCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!shift.hadRecentInput) metrics.__dgnoCls = (metrics.__dgnoCls || 0) + (shift.value || 0);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });

  await page.goto('/article/2026/07/24/release-test-story');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'A verified DGNO test article' })).toBeVisible();
  await page.waitForTimeout(750);
  expect(await page.evaluate(() => (window as typeof window & { __dgnoCls?: number }).__dgnoCls || 0))
    .toBeLessThan(0.1);

  await page.goto('/trackers');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Release Test Tracker' })).toBeVisible();
  await page.waitForTimeout(750);
  expect(await page.evaluate(() => (window as typeof window & { __dgnoCls?: number }).__dgnoCls || 0))
    .toBeLessThan(0.1);
});

test('homepage exposes reporting, public data, RSS, and no subscription pitch', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route(/\/api\/articles\?limit=48$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        articles: Array.from({ length: 20 }, (_, index) => ({
          id: `homepage-ui-article-${index}`,
          title: `A verified DGNO homepage article ${index}`,
          slug: `homepage-ui-article-${index}`,
          summary: 'A source-backed summary for the consumer homepage test.',
          authorName: 'Test Reporter',
          section: 'Politics',
          tags: [2, 6].includes(index) ? ['Trump Administration'] : ['accountability'],
          publishedAt: new Date(Date.UTC(2026, 6, 24 - index, 19)).toISOString(),
        })),
      }),
    });
  });
  await page.goto('/');
  await page.evaluate(() => window.localStorage.setItem('dgno-public-theme', 'light'));
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'News and public data for people who want receipts.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore public data' })).toBeVisible();
  await expect(page.locator('a[href="/rss.xml"]').first()).toBeVisible();
  await expect(page.getByText(/subscribe to newsletter/i)).toHaveCount(0);
  await expect(page.locator('main')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const articleLinks = await page.locator('main a[href*="/article/"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).filter(Boolean));
  expect(new Set(articleLinks).size).toBe(articleLinks.length);

  for (const theme of ['light', 'dark']) {
    await page.evaluate((selectedTheme) => window.localStorage.setItem('dgno-public-theme', selectedTheme), theme);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-public-theme', theme);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || '')), `${theme} homepage Axe`).toEqual([]);
  }
});

test('public light and dark themes persist without affecting staff login', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/privacy');
  await page.evaluate(() => window.localStorage.setItem('dgno-public-theme', 'light'));
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-public-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-public-theme', 'dark');
  expect(await page.evaluate(() => window.localStorage.getItem('dgno-public-theme'))).toBe('dark');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-public-theme', 'dark');
  await page.goto('/login');
  await expect(page.locator('html')).not.toHaveAttribute('data-public-theme');
});

test('donation flow is public and links to Stripe checkout', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/privacy');
  await page.getByRole('button', { name: 'Donate', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'Support DGNO' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('No DGNO account required.')).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Make a one-time donation' }))
    .toHaveAttribute('href', 'https://donate.stripe.com/6oU28rgKpd6leZxb53bQY00');
  await expect(dialog.getByRole('link', { name: 'Donate monthly' }))
    .toHaveAttribute('href', 'https://buy.stripe.com/28E3cvgKp4zPdVt0qpbQY01');
});

test('search page presents mixed public results and remains noindex', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  await page.route('**/api/search?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        query: 'verified',
        type: 'all',
        total: 2,
        results: [
          {
            id: 'article-result',
            type: 'article',
            title: 'Verified public reporting',
            description: 'A source-backed article result.',
            url: '/article/2026/07/24/release-test-story',
            kicker: 'Politics',
            publishedAt: '2026-07-24T19:00:00.000Z',
          },
          {
            id: 'tracker-result',
            type: 'tracker',
            title: 'Verified accountability tracker',
            description: 'A source-backed tracker result.',
            url: '/tracker/release-test-tracker',
            kicker: 'Accountability tracker',
            updatedAt: '2026-07-24T20:00:00.000Z',
          },
        ],
      }),
    });
  });

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/search?q=verified');
  await expect(page.getByRole('heading', { level: 1, name: 'Search DGNO' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Verified public reporting' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Verified accountability tracker' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('mobile navigation and desktop search trap focus, close on Escape, and restore focus', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/privacy');
  const menuTrigger = page.getByRole('button', { name: 'Open navigation menu' });
  await menuTrigger.focus();
  await page.keyboard.press('Enter');
  const navigation = page.getByRole('dialog', { name: 'Site navigation' });
  await expect(navigation).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(navigation).toBeHidden();
  await expect(menuTrigger).toBeFocused();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/privacy');
  const searchTrigger = page.getByRole('button', { name: 'Search articles' });
  await searchTrigger.click();
  const search = page.getByRole('dialog', { name: 'Search DGNO' });
  await expect(search).toBeVisible();
  await expect(search.getByRole('combobox')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(search).toBeHidden();
  await expect(searchTrigger).toBeFocused();
});

test('desktop More menu supports ArrowDown and Escape', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/privacy');
  const more = page.getByRole('button', { name: 'More' });
  await more.focus();
  await page.keyboard.press('ArrowDown');
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Courts' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toBeFocused();
});

test('privacy page and open mobile navigation have no serious axe violations', async ({ page, context }) => {
  await context.addCookies([CONSENT_COOKIE]);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/privacy');
  const pageResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(pageResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);

  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  const dialogResults = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(dialogResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
});
