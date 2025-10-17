
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userData, isStaff, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Bar */}
      <div className="bg-[#232425ff] text-white">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-4">
              <a href="/" className="text-lg font-heading font-bold hover:text-accent transition-colors">
                DGNO
              </a>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm">{userData?.displayName}</span>
              <button
                onClick={handleSignOut}
                className="text-sm px-4 py-1.5 border border-white text-white rounded-full hover:bg-white hover:text-[#232425ff] transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Only for Staff */}
        {isStaff() && <DashboardSidebar />}

        {/* Main Content */}
        <main className={`flex-1 p-6 ${isStaff() ? 'max-w-7xl' : 'max-w-4xl mx-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
