import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { LoadingState } from '../components/LoadingSpinner';
import API_BASE_URL from '../../config/api';
import {
  Package,
  FolderOpen,
  TrendingUp,
  Star,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react';

interface DashboardStats {
  total_products: number;
  active_products: number;
  total_categories: number;
  total_collections: number;
  featured_products: number;
}

interface RecentProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  recent_products: RecentProduct[];
}

const AdminDashboard: React.FC = () => {
  const { admin } = useAdminAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch dashboard data');
        }

        setDashboardData(data.data);
      } catch (error: any) {
        setError(error.message);
        console.error('Dashboard data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingState message="Loading dashboard..." size="lg" />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Error loading dashboard: {error}
        </div>
      </AdminLayout>
    );
  }

  const stats = dashboardData?.stats;
  const recentProducts = dashboardData?.recent_products || [];

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.total_products || 0,
      subtitle: `${stats?.active_products || 0} active`,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Categories',
      value: stats?.total_categories || 0,
      subtitle: 'Product categories',
      icon: FolderOpen,
      color: 'bg-green-500',
      change: '+2%',
      changeType: 'increase'
    },
    {
      title: 'Collections',
      value: stats?.total_collections || 0,
      subtitle: 'Active collections',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+5%',
      changeType: 'increase'
    },
    {
      title: 'Featured Items',
      value: stats?.featured_products || 0,
      subtitle: 'Featured products',
      icon: Star,
      color: 'bg-orange-500',
      change: '+8%',
      changeType: 'increase'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-gray-900 font-cormorant">
                {getGreeting()}, {admin?.first_name}
              </h1>
              <p className="text-gray-600 mt-1 font-satoshi">
                Welcome back to your admin dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 font-satoshi">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-satoshi">{stat.title}</p>
                    <p className="text-3xl font-light text-gray-900 font-cormorant">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1 font-satoshi">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  {stat.changeType === 'increase' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  } font-satoshi`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 font-satoshi">vs last month</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 font-cormorant">Recent Products</h2>
              <button className="text-sm text-gray-600 hover:text-gray-900 font-satoshi">
                View all
              </button>
            </div>
          </div>

          <div className="overflow-hidden">
            {recentProducts.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {recentProducts.map((product) => (
                  <div key={product.id} className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 font-satoshi">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 font-satoshi">
                            {product.price} • Added {formatDate(product.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="font-satoshi">No recent products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 font-cormorant">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 font-satoshi">Add New Product</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 font-satoshi">Manage Categories</span>
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900 font-satoshi">Update Featured</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 font-cormorant">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-satoshi">Database</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-satoshi">Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-satoshi">API</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-satoshi">Healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 font-satoshi">Cache</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 font-satoshi">Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 font-cormorant">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-900 font-satoshi">Product updated</p>
                  <p className="text-gray-500 text-xs font-satoshi">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-900 font-satoshi">New category created</p>
                  <p className="text-gray-500 text-xs font-satoshi">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-gray-900 font-satoshi">Collection updated</p>
                  <p className="text-gray-500 text-xs font-satoshi">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;