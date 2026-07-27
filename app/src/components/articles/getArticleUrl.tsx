import type { Article } from '../../types/models';
import { buildArticlePath } from '../../utils/seoConstants';

/** Return the one public article URL without manufacturing a missing date. */
export function getArticleUrl(article: Article): string {
  return buildArticlePath(article.slug, article.publishedAt);
}
