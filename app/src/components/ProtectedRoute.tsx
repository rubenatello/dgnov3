import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/models';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRoles?: UserRole[]; // Optional: require specific roles
  requireStaff?: boolean; // Optional: require staff status
}

export default function ProtectedRoute({ 
  children, 
  requireRoles,
  requireStaff 
}: ProtectedRouteProps) {
  const { currentUser, loading, hasAnyRole, isStaff } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-inkMuted">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requireRoles && !hasAnyRole(requireRoles)) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold text-ink mb-4">Access Denied</h1>
          <p className="text-inkMuted mb-6">You don't have permission to access this page.</p>
          <a href="/dashboard" className="text-accent hover:text-opacity-80">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Check staff requirement
  if (requireStaff && !isStaff()) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold text-ink mb-4">Staff Only</h1>
          <p className="text-inkMuted mb-6">This area is restricted to staff members.</p>
          <a href="/dashboard" className="text-accent hover:text-opacity-80">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // User is authorized
  return <>{children}</>;
}
