import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, Heart, ShoppingBag, Eye, Chrome } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import API_BASE_URL from '../../config/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  emailVerified: boolean;
  registrationMethod: 'email' | 'google';
  favoritesCount: number;
  newsletterSubscribed: boolean;
  createdAt: string;
  lastLoginAt: string;
}

interface UserDetails {
  user: User & {
    dateOfBirth: string;
    gender: string;
    smsNotifications: boolean;
  };
  favorites: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string;
    basePrice: number;
    salePrice: number;
    favoritedAt: string;
  }>;
  orders: Array<any>;
  stats: {
    favoritesCount: number;
    ordersCount: number;
    totalSpent: number;
  };
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | 'email' | 'google'>('all');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterMethod]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/users/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setFilteredUsers(data.data.users);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      setDetailsLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/users/admin/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSelectedUser(data.data);
      } else {
        setError(data.message || 'Failed to fetch user details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by registration method
    if (filterMethod !== 'all') {
      filtered = filtered.filter(user => user.registrationMethod === filterMethod);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(query) ||
        user.fullName.toLowerCase().includes(query) ||
        (user.phone && user.phone.includes(query))
      );
    }

    setFilteredUsers(filtered);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Registration Method Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterMethod('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterMethod === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMethod('email')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filterMethod === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                onClick={() => setFilterMethod('google')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filterMethod === 'google'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Chrome className="w-4 h-4" />
                Google
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Favorites
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                            {user.firstName?.[0] || user.email[0].toUpperCase()}
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.emailVerified ? (
                              <span className="text-green-600">✓ Verified</span>
                            ) : (
                              <span className="text-orange-600">⚠ Not verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">{user.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.registrationMethod === 'google' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Chrome className="w-3 h-3" />
                          Google
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Mail className="w-3 h-3" />
                          Email
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <Heart className="w-4 h-4 text-rose-500" />
                        {user.favoritesCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => fetchUserDetails(user.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          )}
        </div>

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {detailsLoading ? (
                <div className="p-12">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="flex items-start gap-6">
                      {selectedUser.user.avatarUrl ? (
                        <img
                          src={selectedUser.user.avatarUrl}
                          alt={selectedUser.user.fullName}
                          className="w-24 h-24 rounded-full"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-medium">
                          {selectedUser.user.firstName?.[0] || selectedUser.user.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900">
                          {selectedUser.user.fullName}
                        </h3>
                        <p className="text-gray-600">{selectedUser.user.email}</p>
                        {selectedUser.user.phone && (
                          <p className="text-gray-600">{selectedUser.user.phone}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          {selectedUser.user.registrationMethod === 'google' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                              <Chrome className="w-4 h-4" />
                              Google Sign-In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              <Mail className="w-4 h-4" />
                              Email Sign-Up
                            </span>
                          )}
                          {selectedUser.user.emailVerified && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-rose-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-rose-600 mb-1">
                          <Heart className="w-5 h-5" />
                          <span className="text-sm font-medium">Favorites</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedUser.stats.favoritesCount}
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                          <ShoppingBag className="w-5 h-5" />
                          <span className="text-sm font-medium">Orders</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {selectedUser.stats.ordersCount}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                          <span className="text-sm font-medium">Total Spent</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          £{selectedUser.stats.totalSpent.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Joined</label>
                        <p className="text-gray-900">{formatDate(selectedUser.user.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Login</label>
                        <p className="text-gray-900">{formatDate(selectedUser.user.lastLoginAt)}</p>
                      </div>
                      {selectedUser.user.dateOfBirth && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                          <p className="text-gray-900">{formatDate(selectedUser.user.dateOfBirth)}</p>
                        </div>
                      )}
                      {selectedUser.user.gender && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Gender</label>
                          <p className="text-gray-900 capitalize">{selectedUser.user.gender}</p>
                        </div>
                      )}
                    </div>

                    {/* Favorites List */}
                    {selectedUser.favorites.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-3">Favorite Products</h4>
                        <div className="space-y-3">
                          {selectedUser.favorites.map((fav) => (
                            <div key={fav.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                              {fav.productImage && (
                                <img
                                  src={fav.productImage}
                                  alt={fav.productName}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{fav.productName}</h5>
                                <p className="text-sm text-gray-500">
                                  Added: {formatDate(fav.favoritedAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                {fav.salePrice ? (
                                  <>
                                    <p className="font-bold text-gray-900">£{fav.salePrice.toFixed(2)}</p>
                                    <p className="text-sm text-gray-500 line-through">£{fav.basePrice.toFixed(2)}</p>
                                  </>
                                ) : (
                                  <p className="font-bold text-gray-900">£{fav.basePrice.toFixed(2)}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
