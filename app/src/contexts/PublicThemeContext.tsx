import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { PublicThemeContext, type PublicTheme, type PublicThemeContextValue } from './publicTheme';

const STORAGE_KEY = 'dgno-public-theme';
function storedTheme(): PublicTheme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function preferredTheme(): PublicTheme {
  if (typeof window === 'undefined') return 'light';
  return storedTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function PublicThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<PublicTheme>(preferredTheme);

  useEffect(() => {
    if (storedTheme()) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setTheme(event.matches ? 'dark' : 'light');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousThemeColor = themeMeta?.content;
    root.dataset.publicTheme = theme;
    root.style.colorScheme = theme;
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#0b1018' : '#4d63d4';

    return () => {
      delete root.dataset.publicTheme;
      root.style.removeProperty('color-scheme');
      if (themeMeta && previousThemeColor) themeMeta.content = previousThemeColor;
    };
  }, [theme]);

  const value = useMemo<PublicThemeContextValue>(() => ({
    theme,
    toggleTheme: () => setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // The preference still works for this session when storage is blocked.
      }
      return next;
    }),
  }), [theme]);

  return (
    <PublicThemeContext.Provider value={value}>
      <div className="public-shell min-h-screen bg-bg text-ink" data-theme={theme}>
        {children}
      </div>
    </PublicThemeContext.Provider>
  );
}
