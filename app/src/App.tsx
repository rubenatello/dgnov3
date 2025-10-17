import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header, Footer } from './components';
import ProtectedRoute from './components/ProtectedRoute';
import { HomePage } from './pages';
import LoginPage from './pages/LoginPage';

import DashboardPage from './pages/dashboard/DashboardPage';
import MediaPage from './pages/dashboard/MediaPage';

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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
