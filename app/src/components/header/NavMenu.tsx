import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SECTIONS } from '../../types/models';

const sections = SECTIONS.filter((section) => section !== 'Trackers');
const primarySections = sections.slice(0, 6);
const secondarySections = sections.slice(6);

const sectionPath = (section: string) => `/articles/${section.toLowerCase().replace(/\s+/g, '-')}`;

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:text-accent-strong hover:underline hover:underline-offset-8 ${
    isActive ? 'text-accent-strong underline underline-offset-8' : 'text-ink-muted'
  }`;

export default function NavMenu() {
  const [moreOpen, setMoreOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!moreOpen) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [moreOpen]);

  const handleMoreKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setMoreOpen(true);
      window.requestAnimationFrame(() => firstLinkRef.current?.focus());
    }
  };

  return (
    <nav aria-label="Primary navigation" className="min-w-0">
      <div className="flex items-center gap-0.5">
        {primarySections.map((section) => (
          <NavLink key={section} to={sectionPath(section)} className={linkClass}>
            {section}
          </NavLink>
        ))}

        <NavLink to="/trackers" className={linkClass}>Trackers</NavLink>
        <NavLink to="/reports" className={linkClass}>Reports</NavLink>
        <NavLink to="/investigations" className={linkClass}>Investigations</NavLink>

        <div
          ref={containerRef}
          className="relative"
          onMouseEnter={() => setMoreOpen(true)}
          onMouseLeave={() => setMoreOpen(false)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setMoreOpen(false);
          }}
        >
          <button
            ref={buttonRef}
            type="button"
            className="flex items-center rounded-md px-2 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-accent-strong"
            aria-expanded={moreOpen}
            aria-controls="desktop-more-sections"
            aria-haspopup="true"
            onClick={() => setMoreOpen((open) => !open)}
            onKeyDown={handleMoreKeyDown}
          >
            More
            <svg className={`ml-1 h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19 9-7 7-7-7" />
            </svg>
          </button>

          <div
            id="desktop-more-sections"
            hidden={!moreOpen}
            className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-stone bg-surface-raised p-1 shadow-raised"
          >
            {secondarySections.map((section, index) => (
              <NavLink
                ref={index === 0 ? firstLinkRef : undefined}
                key={section}
                to={sectionPath(section)}
                className={({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent-soft hover:text-accent-dark ${
                  isActive ? 'bg-accent-soft text-accent-dark' : 'text-ink-muted'
                }`}
                onClick={() => setMoreOpen(false)}
              >
                {section}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
