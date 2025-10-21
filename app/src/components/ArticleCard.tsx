import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import type { Article } from '../types/models';

function getRelativeTime(dateString: string | Date | Timestamp | undefined): string {
  if (dateString === undefined || dateString === null) return '';
  let date: Date;
  if (dateString instanceof Timestamp) {
    date = dateString.toDate();
  } else if (dateString instanceof Date) {
    date = dateString;
  } else {
    date = new Date(String(dateString));
  }
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

export default function ArticleCard({ article }: { article: Article }) {
  const publishedAt = article.publishedAt;
  return (
    <Link to={`/article/${article.slug}`} className="block group bg-paper rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden">
      {article.featuredImageUrl && (
        <img
          src={article.featuredImageUrl}
          alt={article.title}
          className="w-full h-48 object-cover mb-3 group-hover:scale-105 transition-transform"
        />
      )}
      <div className="p-4">
        <h2 className="font-heading font-bold text-xl text-ink mb-2 group-hover:text-accent">{article.title}</h2>
        <div className="text-xs text-sand mb-1">Published {getRelativeTime(publishedAt)}</div>
        {article.summary && (
          <div className="text-inkMuted text-sm mb-2">{article.summary}</div>
        )}
      </div>
    </Link>
  );
}
