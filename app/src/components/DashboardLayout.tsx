
import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar,
  faPenNib,
  faFileAlt,
  faPhotoFilm,
  faChartLine,
  faUser,
  faBookmark,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userData, isStaff, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Navigation items for staff users only (Font Awesome icons)
  const staffNavItems = [
    { name: 'Dashboard', icon: faChartBar, path: '/dashboard' },
    { name: 'Create Article', icon: faPenNib, path: '/dashboard/articles/create' },
    { name: 'Manage Articles', icon: faFileAlt, path: '/dashboard/articles' },
    { name: 'Media Library', icon: faPhotoFilm, path: '/dashboard/media' },
    { name: 'Analytics', icon: faChartLine, path: '/dashboard/analytics' },
  ];

  // Navigation items for all users (Font Awesome icons)
  const userNavItems = [
    { name: 'My Profile', icon: faUser, path: '/dashboard/settings' },
    { name: 'Bookmarks', icon: faBookmark, path: '/dashboard/bookmarks' },
  ];

  const isActivePath = (path: string) => location.pathname === path;

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
        {isStaff() && (
          <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#232425ff] border-r border-[#3a3a3a] min-h-screen transition-all duration-300`}>
            {/* Sidebar Toggle Button */}
            <div className="h-12 flex items-center justify-end px-3 border-b border-[#3a3a3a]">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-stone hover:text-white transition-colors p-2"
                title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <FontAwesomeIcon icon={sidebarOpen ? faChevronLeft : faChevronRight} className="w-4 h-4" />
              </button>
            </div>

            <nav className="py-4">
              {/* Staff Navigation */}
              <div className="mb-6">
                {sidebarOpen && (
                  <h3 className="text-xs font-bold text-stone uppercase tracking-wider mb-2 px-4">
                    Staff Tools
                  </h3>
                )}
                {staffNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-accent text-white border-l-4 border-white'
                        : 'text-stone hover:bg-[#3a3a3a] hover:text-white border-l-4 border-transparent'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <span className={sidebarOpen ? '' : 'mx-auto'}>
                      <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                    </span>
                    {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </button>
                ))}
              </div>

              {/* User Navigation */}
              <div>
                {sidebarOpen && (
                  <h3 className="text-xs font-bold text-stone uppercase tracking-wider mb-2 px-4">
                    Your Account
                  </h3>
                )}
                {userNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-accent text-white border-l-4 border-white'
                        : 'text-stone hover:bg-[#3a3a3a] hover:text-white border-l-4 border-transparent'
                    }`}
                    title={!sidebarOpen ? item.name : undefined}
                  >
                    <span className={sidebarOpen ? '' : 'mx-auto'}>
                      <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                    </span>
                    {sidebarOpen && <span className="text-sm font-medium">{item.name}</span>}
                  </button>
                ))}
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 p-6 ${isStaff() ? 'max-w-7xl' : 'max-w-4xl mx-auto'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
