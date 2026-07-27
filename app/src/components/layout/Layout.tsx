import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import CookieConsentBanner from '../CookieConsentBanner';
import BackToTopButton from '../BackToTopButton';
import { PublicThemeProvider } from '../../contexts/PublicThemeContext';

const Layout: React.FC = () => {
  return (
    <PublicThemeProvider>
      <div className="min-h-screen flex flex-col">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <CookieConsentBanner />
        <BackToTopButton />
      </div>
    </PublicThemeProvider>
  );
};

export default Layout;
