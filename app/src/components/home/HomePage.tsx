import { Link } from 'react-router-dom';
import LoadingScreen from '../LoadingScreen';
import ArticleCard from '../articles/ArticleCard';
import ArticleAccordion from '../articles/ArticleAccordion';
import {
  getTodaysArticles,
  getTrumpPresidencyArticles,
  getLatestArticles,
} from '../../utils/helpers';
import SEOHead from '../SEOHead';
import { SEO_CONFIG } from '../../utils/seoConstants';
import useArticles from '../../hooks/useArticles';

const reportingStandards = [
  {
    label: 'What happened',
    copy: 'The event, the people affected, and the stakes—without throat-clearing.',
  },
  {
    label: 'What is confirmed',
    copy: 'Attributed facts, public records, and evidence readers can inspect.',
  },
  {
    label: 'What is speculated',
    copy: 'Disputed, unverified, and still-developing claims stay clearly labeled.',
  },
];

export default function HomePage() {
  const { articles, loading, error } = useArticles();

  // The summary endpoint is newest-first. Avoid editorial or popularity labels
  // that the stored data cannot currently substantiate.
  const featured = articles[0];
  const topStories = articles.slice(1, 5);
  const todaysArticles = getTodaysArticles(articles);
  const trumpArticles = getTrumpPresidencyArticles(articles);

  const excludeIds = [featured?.id, ...topStories.map((article) => article.id)].filter(Boolean) as string[];
  const latestArticles = getLatestArticles(articles, excludeIds, 8);
  const sidebarArticles = getLatestArticles(
    articles,
    [...excludeIds, ...latestArticles.map((article) => article.id || '')],
    6,
  );

  return (
    <>
      <SEOHead
        title={SEO_CONFIG.defaultTitle}
        description={SEO_CONFIG.defaultDescription}
        url={SEO_CONFIG.siteUrl}
        type="website"
        tags={[...SEO_CONFIG.coreKeywords]}
        includeOrganization
      />

      <div className="min-h-screen bg-bg">
        {loading && <LoadingScreen message="Loading articles…" />}
        {error && (
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="border-l-4 border-red-500 bg-red-50 p-4 text-red-900" role="alert">
              <h1 className="text-sm font-bold">DGNO could not load the latest reporting</h1>
              <p className="mt-2 text-sm">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <header className="newsroom-hero relative overflow-hidden text-on-masthead">
              <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
                <p className="editorial-kicker">Independent news + public-interest data</p>
                <h1 className="mt-5 max-w-5xl font-heading text-4xl font-bold leading-[1.03] sm:text-6xl lg:text-7xl">
                  News and public data for people who want receipts.
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-on-masthead-muted sm:text-xl">
                  DGNO follows the evidence, tracks the institutions, and separates what happened, what is confirmed, and what remains speculation.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#latest-reporting" className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-accent-strong">
                    Read latest reporting
                  </a>
                  <Link to="/trackers" className="inline-flex min-h-11 items-center rounded-full border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white hover:bg-white/20">
                    Explore public data
                  </Link>
                  <a href="/rss.xml" className="inline-flex min-h-11 items-center rounded-full px-5 py-2.5 text-sm font-bold text-sand-light transition hover:bg-white/10 hover:text-white">
                    Follow by RSS
                  </a>
                </div>

                <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 md:grid-cols-3">
                  {reportingStandards.map((standard) => (
                    <div key={standard.label} className="bg-masthead/70 p-5 backdrop-blur-sm sm:p-6">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-accent-light">{standard.label}</p>
                      <p className="mt-2 text-sm leading-relaxed text-on-masthead-muted">{standard.copy}</p>
                    </div>
                  ))}
                </div>
              </div>
            </header>

            <nav aria-label="DGNO reader shortcuts" className="border-b border-stone/50 bg-surface-raised">
              <div className="mx-auto grid max-w-7xl divide-y divide-stone/50 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
                <Link to="/trackers" className="group px-1 py-5 sm:px-5">
                  <span className="block text-xs font-black uppercase tracking-widest text-accent">Public record</span>
                  <span className="mt-1 block font-bold text-ink group-hover:text-accent">Accountability trackers →</span>
                </Link>
                <Link to="/editorial-standards" className="group px-1 py-5 sm:px-5">
                  <span className="block text-xs font-black uppercase tracking-widest text-accent">Our standard</span>
                  <span className="mt-1 block font-bold text-ink group-hover:text-accent">Evidence before allegiance →</span>
                </Link>
                <a href="/rss.xml" className="group px-1 py-5 sm:px-5">
                  <span className="block text-xs font-black uppercase tracking-widest text-accent">Come back</span>
                  <span className="mt-1 block font-bold text-ink group-hover:text-accent">RSS, no inbox required →</span>
                </a>
              </div>
            </nav>

            <section id="latest-reporting" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
              {featured && (
                <section className="mb-10 sm:mb-14" aria-labelledby="latest-heading">
                  <div className="mb-5 flex items-end justify-between gap-4 border-b-2 border-accent pb-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">The latest</p>
                      <h2 id="latest-heading" className="mt-1 text-2xl font-bold text-ink sm:text-3xl">Reporting now</h2>
                    </div>
                  </div>
                  <ArticleCard article={featured} variant="featured" />
                </section>
              )}

              <div className="grid grid-cols-1 gap-10 lg:grid-cols-4 lg:gap-12">
                <div className="lg:col-span-3">
                  {topStories.length > 0 && (
                    <section className="mb-10 sm:mb-14">
                      <div className="mb-6 flex items-center gap-4 border-b-2 border-accent pb-3">
                        <h2 className="text-xl font-bold uppercase tracking-wide text-ink sm:text-2xl">Recent headlines</h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-accent/20 to-transparent" />
                      </div>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {topStories.map((article) => <ArticleCard key={article.id} article={article} variant="secondary" />)}
                      </div>
                    </section>
                  )}

                  {todaysArticles.length > 0 && <ArticleAccordion articles={todaysArticles} title="Today's News" maxVisible={4} variant="list" />}
                  {trumpArticles.length > 0 && <ArticleAccordion articles={trumpArticles} title="Trump Presidency" maxVisible={4} variant="list" />}
                  {latestArticles.length > 0 && <ArticleAccordion articles={latestArticles} title="Latest News" maxVisible={6} variant="list" />}
                </div>

                <aside className="lg:col-span-1">
                  <div className="space-y-8 lg:sticky lg:top-24">
                    {sidebarArticles.length > 0 && (
                      <section>
                        <div className="mb-4 flex items-center gap-3 border-b-2 border-accent pb-2">
                          <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded bg-accent text-[10px] font-black text-white">DG</span>
                          <h2 className="text-base font-bold uppercase tracking-wide text-ink">More reporting</h2>
                        </div>
                        <div>{sidebarArticles.map((article) => <ArticleCard key={article.id} article={article} variant="compact" />)}</div>
                      </section>
                    )}
                  </div>
                </aside>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
