import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { 
  Home, Users, Briefcase, Calendar, MessageCircle, 
  CreditCard, Settings, Bell, Menu, X, LogOut, FileText 
} from 'lucide-react';
import Logo from '../Logo';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, markAllNotificationsRead, clearAllNotifications } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Briefs', href: '/briefs', icon: FileText },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Clients', href: '/clients', icon: Users, adminOnly: true },
    { name: 'Staff', href: '/staff', icon: Users, adminOnly: true },
    { name: 'Billing', href: '/billing', icon: CreditCard, adminOnly: true },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={filteredNavigation} user={user} logout={logout} currentPath={location.pathname} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-100">
          <SidebarContent navigation={filteredNavigation} user={user} logout={logout} currentPath={location.pathname} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-gray-100">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Top bar */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 lg:hidden">
                  <Logo size="md" />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative" ref={notifRef}>
                  <button
                    className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setNotifOpen((open) => !open)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-semibold text-gray-900">Notifications</span>
                        {unreadNotifications > 0 && (
                          <button
                            className="text-xs text-indigo-600 hover:underline whitespace-nowrap"
                            onClick={() => { markAllNotificationsRead && markAllNotificationsRead(); setNotifOpen(false); }}
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 && (
                          <li className="p-4 text-sm text-gray-500 text-center">No notifications</li>
                        )}
                        {notifications.slice(0, 8).map((n) => (
                          <li
                            key={n.id}
                            className={`px-4 py-3 text-sm cursor-pointer ${n.read ? 'bg-white text-gray-700' : 'bg-indigo-50 text-gray-900 font-semibold'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{n.title}</span>
                              {n.type === 'error' && <span className="ml-2 text-xs text-red-500">Error</span>}
                              {n.type === 'warning' && <span className="ml-2 text-xs text-yellow-500">Warning</span>}
                              {n.type === 'success' && <span className="ml-2 text-xs text-green-500">Success</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{n.message}</div>
                          </li>
                        ))}
                      </ul>
                      <div className="p-2 border-t border-gray-100 text-center">
                        <button
                          className="text-xs text-red-600 hover:text-red-800 font-semibold whitespace-nowrap"
                          onClick={() => { clearAllNotifications && clearAllNotifications(); setNotifOpen(false); }}
                        >
                          Clear all
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {(() => {
                    // Debug logging
                    console.log('Layout - User avatar debug:', {
                      userId: user?.id,
                      userName: user?.name,
                      userAvatar: user?.avatar,
                      hasAvatar: !!user?.avatar
                    });
                    
                    const avatarSrc = user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&size=32`;
                    
                    return (
                      <img
                        src={avatarSrc}
                        alt={user?.name}
                        className="h-8 w-8 rounded-full"
                      />
                    );
                  })()}
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

interface SidebarContentProps {
  navigation: any[];
  user: any;
  logout: () => void;
  currentPath: string;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ navigation, user, logout, currentPath }) => {
  return (
    <>
      <div className="flex items-center h-16 flex-shrink-0 px-6 bg-white border-b border-gray-100">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Logo size="md" />
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=6366f1&color=fff&size=32`}
              alt={user?.name}
              className="h-8 w-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;