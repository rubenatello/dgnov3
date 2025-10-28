import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { trackPageView, isAnalyticsEnabled } from './lib/analytics';
import { AuthProvider } from './contexts/AuthContext';
import { ArticlesProvider } from './contexts/ArticlesContext';
import ToastProvider from './components/toast/ToastProvider';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { HomePage } from './pages';
import LoginPage from './pages/LoginPage';
import ArticleView from './components/articles/ArticleView';
import DashboardPage from './pages/dashboard/DashboardPage';
import MediaPage from './pages/dashboard/MediaPage';
import ArticlesPage from './pages/dashboard/ArticlesPage';
import CreateEditArticlePage from './pages/dashboard/CreateEditArticlePage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import NotFoundPage from './pages/NotFoundPage';
import ArticlesSection from './components/articles/ArticlesSection';
import ArticlesByDate from './utils/ArticlesByDate';

function App() {
  function RouteChangeTracker() {
    const location = useLocation();
    useEffect(() => {
      try {
        if (isAnalyticsEnabled()) trackPageView(location.pathname + location.search);
      } catch (err) {
        // non-fatal
        console.warn('RouteChangeTracker error', err);
      }
    }, [location]);
    return null;
  }
  return (
    <AuthProvider>
      <ArticlesProvider>
        <ToastProvider>
        <Router>
        <RouteChangeTracker />
        <Routes>
          {/* Public Routes using shared Layout (Header/Footer/CookieConsentBanner) */}
          <Route element={<Layout />}> 
            <Route path="/" element={<HomePage />} />
            <Route path="/article/:slug" element={<ArticleView />} />
            <Route path="/articles/:section" element={<ArticlesSection />} />
            {/* Optionally support date-prefixed slugs: /article/yyyy/mm/dd/slug */}
            <Route path="/article/:yyyy/:mm/:dd/:slug" element={<ArticleView />} />
            <Route path="article/:year/:month/:day" element={<ArticlesByDate />} />
            {/* Informational pages that should include site chrome */}
            <Route path="/about" element={<AboutPage />} />
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

          {/* Login and dashboard remain outside the Layout */}
        </Routes>
        </Router>
        </ToastProvider>
      </ArticlesProvider>
    </AuthProvider>
  );
}

export default App;
