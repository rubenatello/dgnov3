import { createContext, useContext } from 'react';

export type PublicTheme = 'light' | 'dark';

export interface PublicThemeContextValue {
  theme: PublicTheme;
  toggleTheme: () => void;
}

export const PublicThemeContext = createContext<PublicThemeContextValue | null>(null);

export function usePublicTheme() {
  const context = useContext(PublicThemeContext);
  if (!context) throw new Error('usePublicTheme must be used within PublicThemeProvider');
  return context;
}
