import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faPhotoFilm,
  faChartLine,
  faUser,
  faBookmark,
  faChevronLeft,
  faChevronRight,
  faBolt,
  faClipboardList,
  faUserSecret,
  faHome,
  faSignOutAlt,
  faPlus,
  faInbox,
  type IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  name: string;
  icon: IconDefinition;
  path: string;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  icon?: IconDefinition;
  items: NavItem[];
}

export default function DashboardSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, isEditor, isAdmin, isSuperUser, signOut } = useAuth();

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Navigation groups for staff users
  const navGroups = useMemo<NavGroup[]>(() => {
    const groups: NavGroup[] = [
      {
        title: 'Overview',
        items: [
          { name: 'Dashboard', icon: faHome, path: '/dashboard' },
          { name: 'Analytics', icon: faChartLine, path: '/dashboard/analytics' },
        ]
      },
      {
        title: 'Content',
        items: [
          { name: 'Create Article', icon: faPlus, path: '/dashboard/articles/create', badge: 'New', badgeColor: 'bg-green-500' },
          { name: 'All Articles', icon: faFileAlt, path: '/dashboard/articles' },
          { name: 'Live Articles', icon: faBolt, path: '/dashboard/live-articles', badge: 'Live', badgeColor: 'bg-red-500' },
          { name: 'Trackers', icon: faClipboardList, path: '/dashboard/trackers' },
          { name: 'Media Library', icon: faPhotoFilm, path: '/dashboard/media' },
        ]
      },
    ];

    // Add Investigations group for editors/superusers
    if (isEditor() || isAdmin() || isSuperUser()) {
      groups.push({
        title: 'Special Projects',
        items: [
          {
            name: 'AI Editorial Inbox',
            icon: faInbox,
            path: '/dashboard/editorial-inbox',
            badge: 'Review',
            badgeColor: 'bg-purple-600'
          },
          { 
            name: 'Investigations', 
            icon: faUserSecret, 
            path: '/dashboard/investigations/epstein-files',
            badge: 'Beta',
            badgeColor: 'bg-accent'
          },
        ]
      });
    }

    return groups;
  }, [isAdmin, isEditor, isSuperUser]);

  // User account items
  const accountItems: NavItem[] = [
    { name: 'My Profile', icon: faUser, path: '/dashboard/settings' },
    { name: 'Bookmarks', icon: faBookmark, path: '/dashboard/bookmarks' },
  ];

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside 
      className={`${
        isOpen ? 'w-64' : 'w-[68px]'
      } bg-gradient-to-b from-[#1a1b1c] to-[#232425] border-r border-[#333] min-h-screen transition-all duration-300 ease-in-out flex flex-col`}
    >
      {/* User Profile Section */}
      <div className={`p-4 border-b border-[#333] ${isOpen ? '' : 'flex justify-center'}`}>
        <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {userData?.displayName ? getInitials(userData.displayName) : 'U'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1b1c]" />
          </div>
          
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {userData?.displayName || 'User'}
              </p>
              <p className="text-[#888] text-xs truncate capitalize">
                {userData?.roles?.[0] || 'Member'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="px-3 py-2 border-b border-[#333]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center gap-2 text-[#888] hover:text-white hover:bg-[#2a2b2c] transition-all duration-200 p-2 rounded-lg group"
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <FontAwesomeIcon 
            icon={isOpen ? faChevronLeft : faChevronRight} 
            className="w-3 h-3 transition-transform duration-200 group-hover:scale-110" 
          />
          {isOpen && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title} className={groupIndex > 0 ? 'mt-4' : ''}>
            {/* Group Header */}
            {isOpen ? (
              <div className="flex items-center gap-2 px-4 mb-2">
                <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest">
                  {group.title}
                </h3>
                <div className="flex-1 h-px bg-[#333]" />
              </div>
            ) : (
              <div className="mx-3 mb-2 h-px bg-[#333]" />
            )}

            {/* Group Items */}
            <div className="space-y-1 px-2">
              {group.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 ease-out group relative
                    ${
                      isActivePath(item.path)
                        ? 'bg-accent/20 text-white shadow-sm'
                        : 'text-[#999] hover:bg-[#2a2b2c] hover:text-white'
                    }
                  `}
                  title={!isOpen ? item.name : undefined}
                >
                  {/* Active Indicator */}
                  {isActivePath(item.path) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
                  )}
                  
                  {/* Icon */}
                  <span className={`
                    flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                    ${isActivePath(item.path) 
                      ? 'bg-accent text-white shadow-md' 
                      : 'bg-[#2a2b2c] text-[#888] group-hover:bg-[#333] group-hover:text-white'
                    }
                  `}>
                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  </span>
                  
                  {/* Label & Badge */}
                  {isOpen && (
                    <span className="flex-1 text-sm font-medium text-left truncate">
                      {item.name}
                    </span>
                  )}
                  
                  {isOpen && item.badge && (
                    <span className={`
                      px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white
                      ${item.badgeColor || 'bg-accent'}
                    `}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="
                      absolute left-full ml-2 px-2 py-1 bg-[#1a1b1c] text-white text-xs font-medium
                      rounded shadow-lg whitespace-nowrap opacity-0 invisible
                      group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50
                      border border-[#333]
                    ">
                      {item.name}
                      {item.badge && (
                        <span className={`ml-1.5 px-1 py-0.5 text-[9px] rounded ${item.badgeColor || 'bg-accent'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Account Section */}
        <div className="mt-6">
          {isOpen ? (
            <div className="flex items-center gap-2 px-4 mb-2">
              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest">
                Account
              </h3>
              <div className="flex-1 h-px bg-[#333]" />
            </div>
          ) : (
            <div className="mx-3 mb-2 h-px bg-[#333]" />
          )}

          <div className="space-y-1 px-2">
            {accountItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 ease-out group relative
                  ${
                    isActivePath(item.path)
                      ? 'bg-accent/20 text-white shadow-sm'
                      : 'text-[#999] hover:bg-[#2a2b2c] hover:text-white'
                  }
                `}
                title={!isOpen ? item.name : undefined}
              >
                {isActivePath(item.path) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full" />
                )}
                
                <span className={`
                  flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200
                  ${isActivePath(item.path) 
                    ? 'bg-accent text-white shadow-md' 
                    : 'bg-[#2a2b2c] text-[#888] group-hover:bg-[#333] group-hover:text-white'
                  }
                `}>
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                </span>
                
                {isOpen && (
                  <span className="flex-1 text-sm font-medium text-left truncate">
                    {item.name}
                  </span>
                )}
                
                {!isOpen && (
                  <div className="
                    absolute left-full ml-2 px-2 py-1 bg-[#1a1b1c] text-white text-xs font-medium
                    rounded shadow-lg whitespace-nowrap opacity-0 invisible
                    group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50
                    border border-[#333]
                  ">
                    {item.name}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-[#333]">
        <button
          onClick={handleLogout}
          className="
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-[#888] hover:bg-red-500/10 hover:text-red-400
            transition-all duration-200 group
          "
          title={!isOpen ? "Sign Out" : undefined}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#2a2b2c] group-hover:bg-red-500/20 transition-all duration-200">
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
          </span>
          {isOpen && (
            <span className="text-sm font-medium">Sign Out</span>
          )}
          
          {!isOpen && (
            <div className="
              absolute left-full ml-2 px-2 py-1 bg-[#1a1b1c] text-white text-xs font-medium
              rounded shadow-lg whitespace-nowrap opacity-0 invisible
              group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50
              border border-[#333]
            ">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
