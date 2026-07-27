import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import CookieConsentBanner from '../CookieConsentBanner';
import BackToTopButton from '../BackToTopButton';
import { PublicThemeProvider } from '../../contexts/PublicThemeContext';
import LoadingScreen from '../LoadingScreen';
import PublicErrorBoundary from '../PublicErrorBoundary';

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <PublicThemeProvider>
      <div className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1">
          <PublicErrorBoundary key={`${location.pathname}${location.search}`}>
            <Suspense fallback={<LoadingScreen message="Loading page…" />}>
              <Outlet />
            </Suspense>
          </PublicErrorBoundary>
        </main>
        <Footer />
        <CookieConsentBanner />
        <BackToTopButton />
      </div>
    </PublicThemeProvider>
  );
};

export default Layout;
