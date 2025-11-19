import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import CookieConsentBanner from '../CookieConsentBanner';
import SEOHead from '../SEOHead';

const Layout: React.FC = () => {
  const location = useLocation();
  
  // Don't add default SEO for article pages (they handle their own)
  const isArticlePage = location.pathname.startsWith('/article/');
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isArticlePage && (
        <SEOHead
          title="DGNO - Independent, Pro-Democracy and Anti-Corruption News"
          description="Independent journalism focused on democracy, anti-corruption investigations, and accountability. Breaking news, in-depth analysis, and tracker data on government transparency."
          url={`https://dgno.us${location.pathname}`}
        />
      )}
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
};

export default Layout;
