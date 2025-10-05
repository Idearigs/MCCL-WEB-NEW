import React, { useState } from 'react';
import { User, Mail, Calendar, Heart, Package, Settings, Shield } from 'lucide-react';
import LuxuryNavigation from '../components/LuxuryNavigation';
import { FooterSection } from '../components/FooterSection';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { Link } from 'react-router-dom';

const Account: React.FC = () => {
  const { user, isAuthenticated } = useUserAuth();
  const { favoritesCount } = useFavorites();
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'security'>('overview');

  if (!isAuthenticated || !user) {
    return (
      <>
        <LuxuryNavigation />
        <div className="min-h-screen bg-gray-50 pt-32">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <h1 className="text-3xl font-light text-gray-900 mb-4">Please sign in to view your account</h1>
          </div>
        </div>
        <FooterSection />
      </>
    );
  }

  return (
    <>
      <LuxuryNavigation />
      <div className="min-h-screen bg-gray-50 pt-32">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-light text-gray-900 mb-2">My Account</h1>
            <p className="text-gray-600 font-light">Manage your profile and preferences</p>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-2xl font-medium">
                    {user.firstName?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-medium text-gray-900">{user.fullName || user.firstName || 'User'}</h2>
                    <p className="text-sm text-gray-500 font-light">{user.email}</p>
                  </div>
                </div>

                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                      activeTab === 'overview'
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-light">Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-light">Profile Settings</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-colors ${
                      activeTab === 'security'
                        ? 'bg-amber-50 text-amber-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="font-light">Security</span>
                  </button>
                </nav>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                <h3 className="font-medium text-gray-900 mb-4">Quick Stats</h3>
                <Link
                  to="/favorites"
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-rose-500" />
                    <span className="text-sm font-light text-gray-700">Favorites</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{favoritesCount}</span>
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-light text-gray-700">Orders</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">0</span>
                </Link>
              </div>
            </div>

            {/* Main Content */}
            <div className="md:col-span-2">
              {activeTab === 'overview' && (
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-light text-gray-900 mb-6">Account Overview</h2>

                  <div className="grid gap-6">
                    <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                      <Mail className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Email Address</h3>
                        <p className="text-gray-600 font-light">{user.email}</p>
                        {user.emailVerified && (
                          <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                      <User className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Full Name</h3>
                        <p className="text-gray-600 font-light">
                          {user.fullName || user.firstName || 'Not set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">Member Since</h3>
                        <p className="text-gray-600 font-light">
                          {new Date(user.createdAt || Date.now()).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-light text-gray-900 mb-6">Profile Settings</h2>
                  <p className="text-gray-600 font-light">Profile editing functionality coming soon...</p>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h2 className="text-2xl font-light text-gray-900 mb-6">Security Settings</h2>
                  <p className="text-gray-600 font-light">Password change functionality coming soon...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </>
  );
};

export default Account;
