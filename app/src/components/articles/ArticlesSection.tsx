import { SECTION_MAP } from '../SectionMapping';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ArticleCard from './ArticleCard';
import type { Article as ArticleModel } from '../../types/models';
import SEOHead from '../SEOHead';
import { SEO_CONFIG, buildBreadcrumbSchema } from '../../utils/seoConstants';
import { getPublishedArticleSummariesBySection } from '../../services/publicArticleService';

const SECTION_RESULT_LIMIT = 48;

export default function ArticlesSection() {
	const { section } = useParams<{ section: string }>();
	const [articles, setArticles] = useState<ArticleModel[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
   
	useEffect(() => {
		const firestoreSection = section ? SECTION_MAP[section] : undefined;
		if (!firestoreSection) {
			setArticles([]);
			setError(null);
			setLoading(false);
			return;
		}

		let active = true;
		setLoading(true);
		setError(null);
		getPublishedArticleSummariesBySection(firestoreSection, SECTION_RESULT_LIMIT)
			.then((items) => active && setArticles(items))
			.catch((caught) => {
				console.error('Section articles failed to load', caught);
				if (active) setError('This section could not be loaded right now.');
			})
			.finally(() => active && setLoading(false));
		return () => { active = false; };
	}, [section]);

	// Prepare SEO metadata
	const sectionName = SECTION_MAP[section || ''] || section || 'News';
	const isKnownSection = Boolean(section && SECTION_MAP[section]);
	const sectionTitle = `${sectionName} News - Data-Driven Coverage | DGNO`;
	const sectionDescription = `Latest ${sectionName.toLowerCase()} news and analysis. Data-driven, independent, pro-democracy coverage of ${sectionName.toLowerCase()} issues from DGNO.`;
	const sectionUrl = `${SEO_CONFIG.siteUrl}/articles/${section}`;
	const sectionKeywords = [sectionName.toLowerCase(), ...SEO_CONFIG.coreKeywords];

	// Add breadcrumb schema to page
	useEffect(() => {
		if (!section) return;

		const breadcrumbs = buildBreadcrumbSchema([
			{ name: 'Home', url: SEO_CONFIG.siteUrl },
			{ name: sectionName, url: sectionUrl }
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
	}, [section, sectionName, sectionUrl]);

	return (
		<>
			<SEOHead
				title={sectionTitle}
				description={sectionDescription}
				url={sectionUrl}
				type="website"
				tags={sectionKeywords}
				robots={isKnownSection ? 'index, follow' : 'noindex, follow'}
			/>

			<div className="max-w-5xl mx-auto px-4 py-8 min-h-[60vh]">
			<h1 className="font-heading font-bold text-3xl text-ink mb-6 uppercase ">{SECTION_MAP[section || ''] || section}</h1>
			{loading ? (
				<div className="text-inkMuted">Loading articles...</div>
			) : error ? (
				<div role="alert" className="rounded-lg border-l-4 border-red-700 bg-red-50 p-4 text-red-900">{error}</div>
			) : articles.length === 0 ? (
				<div className="text-inkMuted">No articles found for this section.</div>
			) : (
				<>
					<p className="mb-5 text-sm text-inkMuted">Showing up to {SECTION_RESULT_LIMIT} recent published stories in this section.</p>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{articles.map(article => (
							<ArticleCard key={article.id} article={article} />
						))}
					</div>
				</>
			)}
			</div>
		</>
	);
}

