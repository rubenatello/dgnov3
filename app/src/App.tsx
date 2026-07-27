import { BrowserRouter as Router, Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { trackPageView, isAnalyticsEnabled } from './lib/analytics';
import { AuthProvider } from './contexts/AuthContext';
import { ArticlesProvider } from './contexts/ArticlesContext';
import ToastProvider from './components/toast/ToastProvider';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/home/HomePage';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ArticleView = lazy(() => import('./components/articles/ArticleView'));
const ArticlesSection = lazy(() => import('./components/articles/ArticlesSection'));
const ArticlesByDate = lazy(() => import('./components/articles/ArticlesByDate'));
const PublicTrackersPage = lazy(() => import('./pages/PublicTrackersPage'));
const PublicTrackerDetailPage = lazy(() => import('./pages/PublicTrackerDetailPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const InvestigationsBoardPage = lazy(() => import('./pages/InvestigationsBoardPage'));
const InvestigationsIndexPage = lazy(() => import('./pages/InvestigationsIndexPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const TagArticlesPage = lazy(() => import('./pages/TagArticlesPage'));
const AuthorPage = lazy(() => import('./pages/AuthorPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ContactPage = lazy(() => import('./pages/NewsroomTrustPages').then((module) => ({ default: module.ContactPage })));
const EditorialStandardsPage = lazy(() => import('./pages/NewsroomTrustPages').then((module) => ({ default: module.EditorialStandardsPage })));
const CorrectionsPage = lazy(() => import('./pages/NewsroomTrustPages').then((module) => ({ default: module.CorrectionsPage })));
const FundingPage = lazy(() => import('./pages/NewsroomTrustPages').then((module) => ({ default: module.FundingPage })));

// Lazy-load dashboard/admin routes (not needed for initial public page load)
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const MediaPage = lazy(() => import('./pages/dashboard/MediaPage'));
const ArticlesPage = lazy(() => import('./pages/dashboard/ArticlesPage'));
const CreateEditArticlePage = lazy(() => import('./pages/dashboard/CreateEditArticlePage'));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/dashboard/AnalyticsPage'));
const TrackersPage = lazy(() => import('./pages/dashboard/TrackersPage'));
const CreateEditTrackerPage = lazy(() => import('./pages/dashboard/CreateEditTrackerPage'));
const InvestigationsBoardAdminPage = lazy(() => import('./pages/dashboard/InvestigationsBoardAdminPage'));
const EditorialInboxPage = lazy(() => import('./pages/dashboard/EditorialInboxPage'));


function RouteEffects() {
  const location = useLocation();
  const navigationType = useNavigationType();
    
  useEffect(() => {
    const path = location.pathname + location.search;
    if (isAnalyticsEnabled()) trackPageView(path);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    } else if (navigationType !== 'POP') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname, location.search, location.hash, navigationType]);

  return null;
}

function App() {
  return (
    <AuthProvider>
        <ToastProvider>
        <Router>
        <RouteEffects />
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading...</p></div>}>
        <Routes>
          {/* Public Routes using shared Layout (Header/Footer/CookieConsentBanner) */}
          <Route element={<Layout />}>
            <Route path="/" element={<ArticlesProvider><HomePage /></ArticlesProvider>} />
            <Route path="/article/:slug" element={<ArticleView />} />
            <Route path="/articles/:section" element={<ArticlesSection />} />
            <Route path="/tag/:tag" element={<TagArticlesPage />} />
            <Route path="/author/:authorId" element={<AuthorPage />} />
            <Route path="/search" element={<SearchPage />} />
            {/* Optionally support date-prefixed slugs: /article/yyyy/mm/dd/slug */}
            <Route path="/article/:yyyy/:mm/:dd/:slug" element={<ArticleView />} />
            <Route path="/article/:year/:month/:day" element={<ArticlesByDate />} />
            {/* Tracker public views */}
            <Route path="/trackers" element={<PublicTrackersPage />} />
            <Route path="/tracker/:slug" element={<PublicTrackerDetailPage />} />
            {/* Reports page */}
            <Route path="/reports" element={<ReportsPage />} />
            {/* Investigations index */}
            <Route path="/investigations" element={<InvestigationsIndexPage />} />
            {/* Investigations board */}
            <Route path="/investigations/epstein-files" element={<InvestigationsBoardPage />} />
            {/* Informational pages that should include site chrome */}
            <Route path="/about" element={<ArticlesProvider><AboutPage /></ArticlesProvider>} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/editorial-standards" element={<EditorialStandardsPage />} />
            <Route path="/corrections" element={<CorrectionsPage />} />
            <Route path="/funding" element={<FundingPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            {/* 404 Page - Catch all unmatched routes rendered with chrome */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Media Library (staff only) */}
          <Route
            path="/dashboard/media"
            element={
              <ProtectedRoute requireStaff>
                <MediaPage />
              </ProtectedRoute>
            }
          />

          {/* Articles Management (staff only) */}
          <Route
            path="/dashboard/articles"
            element={
              <ProtectedRoute requireStaff>
                <ArticlesPage />
              </ProtectedRoute>
            }
          />

          {/* Analytics Management (staff only) */}
          <Route
            path="/dashboard/analytics"
            element={
              <ProtectedRoute requireStaff>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/articles/create"
            element={
              <ProtectedRoute requireStaff>
                <CreateEditArticlePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/articles/edit/:id"
            element={
              <ProtectedRoute requireStaff>
                <CreateEditArticlePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/trackers"
            element={
              <ProtectedRoute requireStaff>
                <TrackersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/trackers/create"
            element={
              <ProtectedRoute requireStaff>
                <CreateEditTrackerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/trackers/:id/edit"
            element={
              <ProtectedRoute requireStaff>
                <CreateEditTrackerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/investigations/epstein-files"
            element={
              <ProtectedRoute requireRoles={['editor', 'superuser']}>
                <InvestigationsBoardAdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/editorial-inbox"
            element={
              <ProtectedRoute requireRoles={['editor', 'admin', 'superuser']}>
                <EditorialInboxPage />
              </ProtectedRoute>
            }
          />


          {/* Login and dashboard remain outside the Layout */}
        </Routes>
        </Suspense>
        </Router>
        </ToastProvider>
    </AuthProvider>
  );
}

export default App;
