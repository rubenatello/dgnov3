import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import CookieConsentBanner from '../CookieConsentBanner';
import SEOHead from '../SEOHead';
import BackToTopButton from '../BackToTopButton';
import { SEO_CONFIG } from '../../utils/seoConstants';

const Layout: React.FC = () => {
  const location = useLocation();
  
  // Don't add default SEO for article pages (they handle their own)
  const isArticlePage = location.pathname.startsWith('/article/');
  
  return (
    <div className="min-h-screen flex flex-col">
      {!isArticlePage && (
        <SEOHead
          title={SEO_CONFIG.defaultTitle}
          description={SEO_CONFIG.defaultDescription}
          url={`https://dgno.us${location.pathname}`}
          tags={SEO_CONFIG.coreKeywords}
          includeOrganization={true}
        />
      )}
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CookieConsentBanner />
      <BackToTopButton />
    </div>
  );
};

export default Layout;
