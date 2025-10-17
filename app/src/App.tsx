import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header, Footer } from './components';
import ProtectedRoute from './components/ProtectedRoute';
import { HomePage } from './pages';
import LoginPage from './pages/LoginPage';
import ArticleView from './pages/ArticleView';

import DashboardPage from './pages/dashboard/DashboardPage';
import MediaPage from './pages/dashboard/MediaPage';
import ArticlesPage from './pages/dashboard/ArticlesPage';
import CreateEditArticlePage from './pages/dashboard/CreateEditArticlePage';

function App() {
  return (
    <AuthProvider>
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
