import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Bookmark,
  TrendingUp,
  Settings,
  ChevronDown,
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Mock data - in a real app, this would come from an API or context
const useNavigationData = () => {
  return {
    newMatches: 6,
    jobMatches: 6, // Changed from 12 to 6 to match your image
    savedJobs: 4,  // Changed from 0 to 4 to match your image
    applications: 0,
    profileMatch: 85
  };
};

const SidebarItem = ({ 
  to, 
  icon: Icon, 
  label, 
  badge,
  onClick,
  exact = false
}: { 
  to: string; 
  icon: any; 
  label: string; 
  badge?: string | number;
  onClick?: () => void;
  exact?: boolean;
}) => {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center justify-between px-4 py-3 mx-2 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center space-x-3">
            <Icon 
              size={20} 
              className={isActive ? 'text-white' : 'text-current'} 
            />
            <span className="font-medium text-sm">{label}</span>
          </div>
          {badge !== undefined && badge !== null && badge !== 0 && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              typeof badge === 'string' && badge.includes('+')
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

// Make sure this is exported as Layout (not export const Layout)
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get actual navigation data
  const navigationData = useNavigationData();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/jobs': return 'Find Jobs';
      case '/jobs/saved': return 'Saved Jobs';
      case '/applications': return 'My Applications';
      case '/profile': return 'My Profile';
      case '/settings': return 'Settings';
      default: return 'JobNexus';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/': return 'Your personalized job search dashboard';
      case '/jobs': return 'Discover opportunities that match your skills';
      case '/jobs/saved': return 'Jobs you have saved for later';
      case '/applications': return 'Track your job applications';
      case '/profile': return 'Manage your professional profile';
      case '/settings': return 'Account preferences and settings';
      default: return '';
    }
  };

  // Dynamic logo component
  const Logo = () => (
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <Building2 size={24} className="text-white" />
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          JobNexus
        </h1>
        <p className="text-xs text-gray-500 font-medium">Career Platform</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 h-full fixed left-0 top-0 z-30 shadow-xl">
        {/* Header */}
        <div className="flex items-center px-6 py-8 border-b border-gray-100">
          <Logo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 space-y-2">
          <SidebarItem 
            to="/" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            badge={navigationData.newMatches > 0 ? "New" : undefined}
            exact={true}
          />
          <SidebarItem 
            to="/jobs" 
            icon={Briefcase} 
            label="Find Jobs" 
            badge={navigationData.jobMatches > 0 ? `${navigationData.jobMatches}+` : undefined}
            exact={true}
          />
          <SidebarItem 
            to="/jobs/saved" 
            icon={Bookmark} 
            label="Saved Jobs" 
            badge={navigationData.savedJobs > 0 ? navigationData.savedJobs : undefined}
          />
          <SidebarItem 
            to="/applications" 
            icon={FileText} 
            label="Applications" 
            badge={navigationData.applications > 0 ? navigationData.applications : undefined}
          />
          <SidebarItem to="/profile" icon={User} label="Profile" />
        </nav>

        {/* User Section */}
        <div className="p-6 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100/50 mb-4">
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"} 
              alt="Profile" 
              className="w-12 h-12 rounded-xl border-2 border-white shadow-sm object-cover" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Sher'}</p>
              <p className="text-xs text-gray-600 truncate">{user?.title || 'Update your title'}</p>
              <div className="flex items-center space-x-1 mt-1">
                <TrendingUp size={12} className="text-green-500" />
                <span className="text-xs text-green-600 font-medium">~ {navigationData.profileMatch}% Match</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/settings')}
              className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar - Mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-6 py-8 border-b border-gray-100">
          <Logo />
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="py-8 space-y-2">
          <SidebarItem 
            to="/" 
            icon={LayoutDashboard} 
            label="Dashboard" 
            badge={navigationData.newMatches > 0 ? "New" : undefined}
            exact={true}
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <SidebarItem 
            to="/jobs" 
            icon={Briefcase} 
            label="Find Jobs" 
            badge={navigationData.jobMatches > 0 ? `${navigationData.jobMatches}+` : undefined}
            exact={true}
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <SidebarItem 
            to="/jobs/saved" 
            icon={Bookmark} 
            label="Saved Jobs" 
            badge={navigationData.savedJobs > 0 ? navigationData.savedJobs : undefined}
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <SidebarItem 
            to="/applications" 
            icon={FileText} 
            label="Applications" 
            badge={navigationData.applications > 0 ? navigationData.applications : undefined}
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          <SidebarItem 
            to="/profile" 
            icon={User} 
            label="Profile" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-80 flex flex-col min-h-screen transition-all duration-200">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)} 
                className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Menu size={24} />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {getPageDescription()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors group">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <img 
                    src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-lg border-2 border-white shadow-sm object-cover" 
                  />
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 py-2 z-30">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user?.name || 'Sher'}</p>
                      <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <button 
                        onClick={() => navigate('/profile')}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <User size={16} />
                        <span>View Profile</span>
                      </button>
                      <button 
                        onClick={() => navigate('/settings')}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Close user menu when clicking outside */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

// Make sure to export the Layout component
export { Layout };