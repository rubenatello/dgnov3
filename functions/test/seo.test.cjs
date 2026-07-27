const assert = require('node:assert/strict');
const fs = require('node:fs');
const sharp = require('sharp');
const test = require('node:test');

const seo = require('../lib/seo.js');
const socialImage = require('../lib/social-image.js');

const article = {
  title: 'A verified DGNO test article',
  slug: 'release-test-story',
  summary: 'A source-backed summary.',
  content: '<p>Verified copy.</p><script>alert(1)</script>',
  featuredImageUrl: 'https://images.example.org/reporting/photo.jpg',
  socialImageUrl: 'https://firebasestorage.googleapis.com/v0/b/dgno/o/social.jpg?alt=media',
  authorName: 'Test Reporter',
  section: 'Politics',
  tags: ['civil rights'],
  publishedAt: '2026-07-24T19:00:00.000Z',
  lastUpdatedAt: '2026-07-24T20:00:00.000Z',
};

test('publication day ranges use America/Los_Angeles across DST', () => {
  const summer = seo.publicationDayRange('2026-07-24');
  assert.equal(summer.start.toISOString(), '2026-07-24T07:00:00.000Z');
  assert.equal(summer.end.toISOString(), '2026-07-25T07:00:00.000Z');

  const springForward = seo.publicationDayRange('2026-03-08');
  assert.equal(springForward.start.toISOString(), '2026-03-08T08:00:00.000Z');
  assert.equal(springForward.end.toISOString(), '2026-03-09T07:00:00.000Z');

  const fallBack = seo.publicationDayRange('2026-11-01');
  assert.equal(fallBack.start.toISOString(), '2026-11-01T07:00:00.000Z');
  assert.equal(fallBack.end.toISOString(), '2026-11-02T08:00:00.000Z');
  assert.equal(seo.publicationDayRange('2026-02-30'), null);
});

test('article HTML separates the social derivative from reporting schema', () => {
  const html = seo.renderArticleDocument(article);
  assert.match(html, /<link rel="canonical" href="https:\/\/dgno\.us\/article\/2026\/07\/24\/release-test-story">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/dgno\/o\/social\.jpg\?alt=media">/);
  assert.match(html, /"image":\["https:\/\/images\.example\.org\/reporting\/photo\.jpg"\]/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});

test('social card generation is bounded to controlled storage and 1200x630', async () => {
  assert.ok(socialImage.controlledFeaturedImageUrl(
    'https://firebasestorage.googleapis.com/v0/b/dgno/o/photo.jpg?alt=media'));
  assert.equal(socialImage.controlledFeaturedImageUrl('https://127.0.0.1/photo.jpg'), null);
  assert.equal(socialImage.controlledFeaturedImageUrl('https://example.org/photo.jpg'), null);

  const featured = await sharp({
    create: {width: 1600, height: 900, channels: 3, background: '#4263eb'},
  }).png().toBuffer();
  const logo = await sharp({
    create: {width: 500, height: 500, channels: 4, background: '#222222'},
  }).png().toBuffer();
  const card = await socialImage.composeSocialCard(featured, logo);
  const metadata = await sharp(card).metadata();
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.equal(metadata.format, 'jpeg');
});

test('daily archive HTML is canonical, noindex, and lists canonical stories', () => {
  const html = seo.renderArchiveDocument('2026-07-24', [article]);
  assert.match(html, /<meta name="robots" content="noindex, follow">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/dgno\.us\/article\/2026\/07\/24">/);
  assert.match(html, /href="https:\/\/dgno\.us\/article\/2026\/07\/24\/release-test-story"/);
  assert.match(html, /data-seo-server="archive-page"/);
});

test('public collection HTML owns its canonical and crawlable links', () => {
  const definition = seo.publicPageDefinition('/trackers');
  assert.ok(definition);
  const html = seo.renderPublicPageDocument(definition, [{
    href: '/tracker/release-test-tracker',
    label: 'Release Test Tracker',
    description: 'A source-backed public tracker.',
  }]);
  assert.match(html, /<title>Public-interest data trackers \| DGNO<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/dgno\.us\/trackers">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/dgno\.us\/trackers">/);
  assert.match(html, /href="\/tracker\/release-test-tracker"/);
  assert.match(html, /data-seo-server="public-page"/);

  const search = seo.publicPageDefinition('/search');
  assert.ok(search);
  assert.match(
    seo.renderPublicPageDocument(search),
    /<meta name="robots" content="noindex, follow">/,
  );
  assert.equal(seo.publicPageDefinition('/articles/not-a-section'), null);
});

test('Firebase rewrites preserve dynamic article and tracker delivery', () => {
  const firebase = JSON.parse(fs.readFileSync('../firebase.json', 'utf8'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/article/**' && entry.function === 'articlePage'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/tracker/**' && entry.function === 'trackerPage'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/api/contact' && entry.function === 'contact'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/api/search' && entry.function === 'publicSearch'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/trackers' && entry.function === 'publicPage'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/articles/**' && entry.function === 'publicPage'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/author/**' && entry.function === 'publicPage'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '**' && entry.function === 'publicPage'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/login' && entry.destination === '/index.html'));
  assert.ok(firebase.hosting.rewrites.some((entry) =>
    entry.source === '/dashboard/**' && entry.destination === '/index.html'));
  assert.ok(firebase.hosting.headers.some((entry) =>
    entry.source === '/dashboard' && entry.headers.some((header) =>
      header.key === 'X-Robots-Tag' && header.value.includes('noindex'))));
});
