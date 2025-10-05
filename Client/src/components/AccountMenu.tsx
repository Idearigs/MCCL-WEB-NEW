import React, { useState, useRef, useEffect } from 'react';
import { User, Heart, Package, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useFavorites } from '../contexts/FavoritesContext';

interface AccountMenuProps {
  onLoginClick: () => void;
}

const AccountMenu: React.FC<AccountMenuProps> = ({ onLoginClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useUserAuth();
  const { favoritesCount } = useFavorites();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200 font-light"
      >
        <User className="w-5 h-5" />
        <span className="hidden lg:inline">Account</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors duration-200 rounded-md hover:bg-gray-50"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-xs font-medium">
          {user?.firstName?.[0] || user?.email[0].toUpperCase()}
        </div>
        <div className="hidden lg:block text-left">
          <div className="text-xs font-light text-gray-500">Welcome back</div>
          <div className="text-sm font-medium">{user?.firstName || 'Account'}</div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-medium text-gray-900">{user?.fullName || user?.firstName || 'User'}</div>
            <div className="text-sm text-gray-500 font-light">{user?.email}</div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            <Link
              to="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-light">My Account</span>
            </Link>

            <Link
              to="/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <Heart className="w-4 h-4 text-gray-400" />
              <div className="flex items-center justify-between flex-1">
                <span className="font-light">My Favorites</span>
                {favoritesCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
                    {favoritesCount}
                  </span>
                )}
              </div>
            </Link>

            <Link
              to="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <Package className="w-4 h-4 text-gray-400" />
              <span className="font-light">My Orders</span>
            </Link>

            <Link
              to="/account/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="font-light">Settings</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-light">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
