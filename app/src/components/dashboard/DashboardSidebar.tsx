import { useState } from 'react';
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
  faChevronRight,
  type IconDefinition
} from '@fortawesome/free-solid-svg-icons';

interface NavItem {
  name: string;
  icon: IconDefinition;
  path: string;
}

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items for staff users only
  const staffNavItems: NavItem[] = [
    { name: 'Dashboard', icon: faChartBar, path: '/dashboard' },
    { name: 'Create Article', icon: faPenNib, path: '/dashboard/articles/create' },
    { name: 'Manage Articles', icon: faFileAlt, path: '/dashboard/articles' },
    { name: 'Media Library', icon: faPhotoFilm, path: '/dashboard/media' },
    { name: 'Analytics', icon: faChartLine, path: '/dashboard/analytics' },
  ];

  // Navigation items for all users
  const userNavItems: NavItem[] = [
    { name: 'My Profile', icon: faUser, path: '/dashboard/settings' },
    { name: 'Bookmarks', icon: faBookmark, path: '/dashboard/bookmarks' },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <aside 
      className={`${
        isOpen ? 'w-64' : 'w-16'
      } bg-[#232425ff] border-r border-[#3a3a3a] min-h-screen transition-all duration-300 ease-in-out`}
    >
      {/* Sidebar Toggle Button */}
      <div className="h-12 flex items-center justify-end px-3 border-b border-[#3a3a3a]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-stone hover:text-white transition-colors duration-200 p-2 hover:bg-[#3a3a3a] rounded"
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <FontAwesomeIcon 
            icon={isOpen ? faChevronLeft : faChevronRight} 
            className="w-4 h-4 transition-transform duration-200" 
          />
        </button>
      </div>

      <nav className="py-4">
        {/* Staff Navigation */}
        <div className="mb-6">
          {isOpen && (
            <h3 className="text-xs font-bold text-stone uppercase tracking-wider mb-2 px-4 transition-opacity duration-200">
              Staff Tools
            </h3>
          )}
          {staffNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 
                transition-all duration-200 ease-in-out
                border-l-4
                ${
                  isActivePath(item.path)
                    ? 'bg-accent text-white border-white shadow-sm'
                    : 'text-stone hover:bg-[#3a3a3a] hover:text-white border-transparent'
                }
              `}
              title={!isOpen ? item.name : undefined}
            >
              <span className={`${isOpen ? '' : 'mx-auto'} transition-all duration-200`}>
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
              </span>
              {isOpen && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">
                  {item.name}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* User Navigation */}
        <div>
          {isOpen && (
            <h3 className="text-xs font-bold text-stone uppercase tracking-wider mb-2 px-4 transition-opacity duration-200">
              Your Account
            </h3>
          )}
          {userNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 
                transition-all duration-200 ease-in-out
                border-l-4
                ${
                  isActivePath(item.path)
                    ? 'bg-accent text-white border-white shadow-sm'
                    : 'text-stone hover:bg-[#3a3a3a] hover:text-white border-transparent'
                }
              `}
              title={!isOpen ? item.name : undefined}
            >
              <span className={`${isOpen ? '' : 'mx-auto'} transition-all duration-200`}>
                <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
              </span>
              {isOpen && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">
                  {item.name}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  );
}
