import { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SECTIONS } from '../../types/models';
import Dialog from '../ui/Dialog';
import ThemeToggle from '../ThemeToggle';

interface MobileHeaderProps {
  onSearch: () => void;
  onDonate: () => void;
}

const sections = SECTIONS.filter((section) => section !== 'Trackers');
const primarySections = sections.slice(0, 6);
const secondarySections = sections.slice(6);
const sectionPath = (section: string) => `/articles/${section.toLowerCase().replace(/\s+/g, '-')}`;

const drawerLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center rounded-lg px-3 py-2.5 text-base font-semibold transition-colors ${
    isActive ? 'bg-accent-soft text-accent-dark' : 'text-ink hover:bg-stone-light hover:text-accent-dark'
  }`;

export default function MobileHeader({ onSearch, onDonate }: MobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const today = new Date();
  const dateTime = today.toISOString().slice(0, 10);

  const closeMenu = () => setMenuOpen(false);
  const runAndClose = (action: () => void) => {
    closeMenu();
    window.requestAnimationFrame(action);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone/70 bg-surface/95 shadow-sm backdrop-blur-xl">
        <div className="safe-inline flex min-h-[4.5rem] items-center justify-between gap-2 py-2">
          <a href="/" className="flex min-w-0 items-center rounded-md" aria-label="DGNO home">
            <img src="/logo.png" alt="" className="theme-logo h-11 w-11 flex-none object-contain" />
            <span className="ml-2 line-clamp-2 max-w-[10rem] text-xs font-semibold leading-tight text-ink sm:max-w-xs sm:text-sm">
              Independent, Pro-Democracy News
            </span>
          </a>

          <div className="flex flex-none items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={onSearch}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-stone-light hover:text-accent-dark"
              aria-label="Search articles"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-stone-light hover:text-accent-dark"
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation-dialog"
              aria-label="Open navigation menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="safe-inline flex min-h-12 items-center justify-between gap-3 border-t border-stone/50 bg-stone-light/70 py-2">
          <time dateTime={dateTime} className="hidden text-xs font-semibold text-ink-muted sm:block">
            {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </time>
          <div className="flex items-center gap-2 text-xs font-bold">
            <NavLink to="/trackers" className="min-h-9 rounded-full border border-accent-strong px-3 py-2 text-accent-dark hover:bg-accent-soft">
              Trackers
            </NavLink>
            <button type="button" onClick={onDonate} className="min-h-9 rounded-full bg-tracker px-3 py-2 text-white hover:bg-[#8f4208]">
              Donate
            </button>
            <a href="/rss.xml" className="min-h-9 rounded-full bg-accent-strong px-3 py-2 text-white hover:bg-accent-dark">
              RSS
            </a>
          </div>
        </div>
      </header>

      <Dialog
        id="mobile-navigation-dialog"
        open={menuOpen}
        onClose={closeMenu}
        title="Site navigation"
        placement="right"
        initialFocusRef={closeButtonRef}
        className="flex h-[100dvh] w-full max-w-sm flex-col rounded-none"
      >
        <div className="safe-inline flex items-center justify-between border-b border-stone px-2 py-3">
          <a href="/" className="flex min-w-0 items-center rounded-md" aria-label="DGNO home" onClick={closeMenu}>
            <img src="/logo.png" alt="" className="theme-logo h-11 w-11 flex-none object-contain" />
            <span className="ml-2 line-clamp-2 text-xs font-semibold text-ink">Independent, Pro-Democracy News</span>
          </a>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMenu}
            className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-lg text-ink-muted hover:bg-stone-light hover:text-ink"
            aria-label="Close navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wider text-accent-dark">Top stories</h2>
          <nav aria-label="Primary mobile navigation" className="space-y-1">
            {primarySections.map((section) => (
              <NavLink key={section} to={sectionPath(section)} className={drawerLinkClass} onClick={closeMenu}>
                {section}
              </NavLink>
            ))}
            <NavLink to="/trackers" className={drawerLinkClass} onClick={closeMenu}>Trackers</NavLink>
            <NavLink to="/reports" className={drawerLinkClass} onClick={closeMenu}>Reports</NavLink>
            <NavLink to="/investigations" className={drawerLinkClass} onClick={closeMenu}>Investigations</NavLink>
          </nav>

          <h2 className="mb-2 mt-6 border-t border-stone pt-5 text-sm font-extrabold uppercase tracking-wider text-accent-dark">More coverage</h2>
          <nav aria-label="More mobile navigation" className="space-y-1">
            {secondarySections.map((section) => (
              <NavLink key={section} to={sectionPath(section)} className={drawerLinkClass} onClick={closeMenu}>
                {section}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="safe-inline safe-bottom border-t border-stone bg-surface px-5 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <NavLink to="/trackers" onClick={closeMenu} className="min-h-11 rounded-lg bg-accent-strong px-3 py-3 text-center text-sm font-bold text-white hover:bg-accent-dark">
              Explore data
            </NavLink>
            <a href="/rss.xml" className="min-h-11 rounded-lg border border-accent-strong px-3 py-3 text-center text-sm font-bold text-accent-dark hover:bg-accent-soft">
              Follow by RSS
            </a>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => runAndClose(onDonate)} className="min-h-11 rounded-lg bg-tracker px-3 py-2.5 text-sm font-bold text-white hover:bg-[#8f4208]">
              Support DGNO
            </button>
            <a href="/login" className="min-h-11 rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-inkMuted hover:bg-stone-light hover:text-ink">Staff login</a>
          </div>
        </div>
      </Dialog>
    </>
  );
}
