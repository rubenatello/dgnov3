import { Link } from 'react-router-dom';
import ThemeToggle from '../ThemeToggle';

interface TopBarProps {
  onSearch: () => void;
  onDonate: () => void;
}

export default function TopBar({ onSearch, onDonate }: TopBarProps) {
  const today = new Date();
  const dateTime = today.toISOString().slice(0, 10);

  return (
    <div className="bg-masthead text-on-masthead">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-11 items-center justify-between gap-4">
          <time dateTime={dateTime} className="text-sm font-medium text-sand-light">
            {today.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onSearch}
              className="group rounded-full p-2 transition-colors hover:bg-white/10"
              aria-label="Search articles"
              title="Search articles (Ctrl or Command + K)"
            >
              <svg className="h-5 w-5 text-sand-light group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
              </svg>
            </button>
            <ThemeToggle />
            <Link to="/trackers" className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white hover:text-masthead">
              Explore data
            </Link>
            <a href="/rss.xml" className="rounded-full px-3 py-1.5 text-sm font-semibold text-sand-light transition-colors hover:bg-white/10 hover:text-white">
              RSS
            </a>
            <button
              type="button"
              onClick={onDonate}
              className="rounded-full bg-tracker px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#8f4208]"
            >
              Donate
            </button>
            <a
              href="/login"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-masthead transition-colors hover:bg-paper"
            >
              Staff
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
