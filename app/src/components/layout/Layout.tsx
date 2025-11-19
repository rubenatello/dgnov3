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
          description="Politics • Immigration • Legislation • Foreign Affairs • Economy • White House • Courts • Congress • Human Rights • Environment • Business • Tech • Finance • Opinion • Sports • Fact-Check • Health • Science • Trackers"
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
