import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Article } from '../../types/models';
import ArticleCard from './ArticleCard';
import LoadingScreen from '../LoadingScreen';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../SEOHead';
import { SEO_CONFIG, buildBreadcrumbSchema } from '../../utils/seoConstants';
import { format } from 'date-fns';
import { getPublishedArticleSummariesByDate } from '../../services/publicArticleService';

const ARCHIVE_RESULT_LIMIT = 100;

function validArchiveDate(year?: string, month?: string, day?: string): boolean {
  if (!year || !month || !day || !/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) return false;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day);
}

export default function ArticlesByDate() {
  const { year, month, day } = useParams<{ year: string; month: string; day: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setArticles([]);
    setError(null);
    if (!validArchiveDate(year, month, day)) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    const publishedOn = `${year}-${month}-${day}`;
    getPublishedArticleSummariesByDate(publishedOn, ARCHIVE_RESULT_LIMIT)
      .then((items) => active && setArticles(items))
      .catch((caught) => {
        console.error('Archive articles failed to load', caught);
        if (active) setError('This archive date could not be loaded right now.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [year, month, day]);

 function getAdjacentDate(offset: number) {
  const current = new Date(Number(year), Number(month) - 1, Number(day)); // Use numbers for Date constructor
  current.setDate(current.getDate() + offset);
  const yyyy = current.getFullYear();
  const mm = String(current.getMonth() + 1).padStart(2, '0');
  const dd = String(current.getDate()).padStart(2, '0');
  return `/article/${yyyy}/${mm}/${dd}`;
}

  // Prepare SEO metadata
  const isValidDate = validArchiveDate(year, month, day);
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  const formattedDate = isValidDate ? format(dateObj, 'MMMM d, yyyy') : 'Invalid archive date';
  const dateTitle = `News from ${formattedDate} | DGNO`;
  const dateDescription = `Browse all articles published on ${formattedDate}. Data-driven, independent news coverage from DGNO.`;
  const dateUrl = `${SEO_CONFIG.siteUrl}/article/${year}/${month}/${day}`;

  // Add breadcrumb schema to page
  useEffect(() => {
    const breadcrumbs = buildBreadcrumbSchema([
      { name: 'Home', url: SEO_CONFIG.siteUrl },
      { name: 'Archives', url: `${SEO_CONFIG.siteUrl}/article/${year}/${month}/${day}` },
      { name: formattedDate, url: dateUrl }
    ]);

    const existingBreadcrumb = document.querySelector('script[type="application/ld+json"][data-schema="breadcrumb"]');
    if (existingBreadcrumb) {
      existingBreadcrumb.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema', 'breadcrumb');
    script.textContent = JSON.stringify(breadcrumbs);
    document.head.appendChild(script);

    return () => {
      const cleanup = document.querySelector('script[type="application/ld+json"][data-schema="breadcrumb"]');
      if (cleanup) cleanup.remove();
    };
  }, [year, month, day, formattedDate, dateUrl]);

  return (
    <>
      <SEOHead
        title={dateTitle}
        description={dateDescription}
        url={dateUrl}
        type="website"
        tags={[...SEO_CONFIG.coreKeywords]}
        robots="noindex, follow"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
       <h1 className="text-center font-heading font-bold text-2xl md:text-4xl mb-8 py-4 bg-gradient-to-r from-accent/10 via-white to-accent/10 rounded shadow italic">
        Articles published on <span className="text-accent">{year}-{month}-{day}</span>
      </h1>
      {/* Navigation Buttons */}
      <div className="flex justify-between mb-6">
        <button
          className="px-4 py-1 bg-accent text-white rounded shadow hover:bg-accent-dark transition"
          onClick={() => navigate(getAdjacentDate(-1))}
        >
          ← Previous Day
        </button>
        <button
          className="px-4 py-1 bg-accent text-white rounded shadow hover:bg-accent-dark transition"
          onClick={() => navigate(getAdjacentDate(1))}
        >
          Next Day →
        </button>
      </div>
     
      {loading && articles.length === 0 ? (
        <LoadingScreen message="Loading articles…" />
      ) : error ? (
        <div role="alert" className="rounded-lg border-l-4 border-red-700 bg-red-50 p-4 text-red-900">{error}</div>
      ) : articles.length === 0 ? (
        <div className="text-center text-gray-500">No articles found for this date.</div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-inkMuted">Showing up to {ARCHIVE_RESULT_LIMIT} published stories for this date.</p>
          {articles.map(article => (
            <div key={article.id} className="bg-surface rounded shadow p-4 hover:shadow-lg transition">
              <ArticleCard article={article} variant="secondary" />
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
