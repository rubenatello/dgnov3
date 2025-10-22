import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ArticlesProvider } from './contexts/ArticlesContext';
import { Footer } from './components';
import Header from './components/header/Header';
import CookieConsentBanner from './components/CookieConsentBanner';
import ProtectedRoute from './components/ProtectedRoute';
import { HomePage } from './pages';
import LoginPage from './pages/LoginPage';
import ArticleView from './pages/ArticleView';
import DashboardPage from './pages/dashboard/DashboardPage';
import MediaPage from './pages/dashboard/MediaPage';
import ArticlesPage from './pages/dashboard/ArticlesPage';
import CreateEditArticlePage from './pages/dashboard/CreateEditArticlePage';
import SettingsPage from './pages/dashboard/SettingsPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import NotFoundPage from './pages/NotFoundPage';
import ArticlesSection from './pages/ArticlesSection';

function App() {
  return (
    <AuthProvider>
      <ArticlesProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <HomePage />
                </main>
                <Footer />
                <CookieConsentBanner />
              </div>
            }
          />
          
          <Route path="/login" element={<LoginPage />} />

          {/* Public article view */}
          <Route
            path="/article/:slug"
            element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <ArticleView />
                </main>
                <Footer />
                <CookieConsentBanner />
              </div>
            }
          />

          {/* Articles Section */}
          <Route
            path="/articles/:section"
            element={
              <div className="min-h-screen flex flex-col">
                <main className="flex-1">
                  <ArticlesSection />
                </main>
                <CookieConsentBanner />

              </div>
            }
          />

          {/* Optionally support date-prefixed slugs: /article/yyyy/mm/dd/slug */}
          <Route
            path="/article/:yyyy/:mm/:dd/:slug"
            element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1">
                  <ArticleView />
                </main>
                <Footer />
                <CookieConsentBanner />
              </div>
            }
          />

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

          {/* About Page */}
          <Route path="/about" element={<AboutPage />} />

          {/* Privacy Policy Page */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          {/* 404 Page - Catch all unmatched routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      </ArticlesProvider>
    </AuthProvider>
  );
}

export default App;
