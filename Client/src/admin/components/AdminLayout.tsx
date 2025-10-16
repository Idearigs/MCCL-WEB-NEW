import React, { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Diamond,
  Watch,
  Layers
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/admin/products', icon: Package },
  // { name: 'Categories', href: '/admin/categories', icon: FolderOpen }, // Hidden - use Jewelry Categories instead
  { name: 'Jewelry Categories', href: '/admin/jewelry-categories', icon: Layers },
  { name: 'Collections', href: '/admin/collections', icon: Diamond },
  { name: 'Watches', href: '/admin/watches', icon: Watch },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const currentNavigation = navigation.map((item) => ({
    ...item,
    current: location.pathname === item.href,
  }));

  return (
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[256px_1fr]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:z-auto lg:shadow-none lg:border-r lg:border-gray-200 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 bg-gray-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Diamond className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-white font-semibold text-lg font-satoshi">
              McCulloch Admin
            </span>
          </div>
          <button
            type="button"
            className="lg:hidden text-white hover:text-gray-300"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {currentNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 font-satoshi ${
                  item.current
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                    item.current ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium font-satoshi">
              {admin?.first_name?.[0]}{admin?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-medium truncate font-satoshi">
                {admin?.full_name}
              </p>
              <p className="text-gray-500 truncate text-xs capitalize font-satoshi">
                {admin?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col min-h-screen lg:min-h-0">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Search bar */}
              <div className="hidden sm:block">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="search"
                    placeholder="Search products, orders..."
                    className="block w-80 pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 text-sm font-satoshi"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center space-x-2 text-sm rounded-lg hover:bg-gray-100 p-2 transition-colors duration-200"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white font-medium">
                    {admin?.first_name?.[0]}{admin?.last_name?.[0]}
                  </div>
                  <span className="hidden md:block text-gray-700 font-medium font-satoshi">
                    {admin?.first_name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {/* Profile dropdown menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900 font-satoshi">
                          {admin?.full_name}
                        </p>
                        <p className="text-sm text-gray-500 font-satoshi">
                          {admin?.email}
                        </p>
                      </div>
                      <Link
                        to="/admin/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-satoshi"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-satoshi"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;