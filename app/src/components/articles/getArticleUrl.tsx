import { Timestamp } from "firebase/firestore";
import type { Article } from "../../types/models";

export function getArticleUrl(article: Article): string {
  let date: Date;

  if (article.publishedAt instanceof Timestamp) {
    date = article.publishedAt.toDate();
  } else if (
    typeof article.publishedAt === "object" &&
    article.publishedAt !== null &&
    (article.publishedAt as Date).getTime !== undefined
  ) {
    // Checks for Date object
    date = article.publishedAt as Date;
  } else if (typeof article.publishedAt === "string" || typeof article.publishedAt === "number") {
    date = new Date(article.publishedAt);
  } else {
    // fallback to today if publishedAt is missing/invalid
    date = new Date();
  }

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `/article/${yyyy}/${mm}/${dd}/${article.slug}`;
}