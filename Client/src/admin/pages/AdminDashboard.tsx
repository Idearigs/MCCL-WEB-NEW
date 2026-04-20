import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { LoadingState } from '../components/LoadingSpinner';
import API_BASE_URL from '../../config/api';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Star,
  ArrowUpRight,
  Eye,
  ExternalLink,
  Gem,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Percent,
  Loader2,
} from 'lucide-react';

interface DashboardStats {
  total_products: number;
  active_products: number;
  total_categories: number;
  total_collections: number;
  featured_products: number;
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  delivered_orders: number;
  total_revenue: number;
  today_revenue: number;
  today_orders: number;
  month_revenue: number;
  month_orders: number;
}

interface RecentProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  created_at: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  customer_email: string;
  customer_name: string;
  items_count: number;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  recent_products: RecentProduct[];
  recent_orders: RecentOrder[];
}

const orderStatusConfig: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  processing: { label: 'Processing', className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  shipped:    { label: 'Shipped',    className: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' },
  delivered:  { label: 'Delivered',  className: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
};

const paymentStatusConfig: Record<string, { className: string }> = {
  paid:    { className: 'bg-green-50 text-green-700 ring-1 ring-green-200' },
  pending: { className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' },
  failed:  { className: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
};

const AdminDashboard: React.FC = () => {
  const { admin } = useAdminAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk price adjustment state
  const [adjustPct, setAdjustPct] = useState('');
  const [adjustScope, setAdjustScope] = useState<'all' | 'engagement'>('engagement');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustResult, setAdjustResult] = useState<{ message: string; ok: boolean } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch dashboard data');
        setDashboardData(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const applyPriceAdjust = async () => {
    const pct = parseFloat(adjustPct);
    if (isNaN(pct) || pct === 0) return;
    setAdjusting(true);
    setAdjustResult(null);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE_URL}/admin/products/bulk/price-adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ percentage: pct, scope: adjustScope }),
      });
      const data = await res.json();
      setAdjustResult({ message: data.message || 'Done', ok: data.success });
      if (data.success) setAdjustPct('');
    } catch {
      setAdjustResult({ message: 'Request failed', ok: false });
    } finally {
      setAdjusting(false);
    }
  };

  const fmt = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading) return <AdminLayout><LoadingState message="Loading dashboard..." size="lg" /></AdminLayout>;
  if (error) return (
    <AdminLayout>
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 font-satoshi">
        Error loading dashboard: {error}
      </div>
    </AdminLayout>
  );

  const stats = dashboardData?.stats;
  const recentProducts = dashboardData?.recent_products || [];
  const recentOrders = dashboardData?.recent_orders || [];

  const statCards = [
    {
      label: 'Total Products',
      value: (stats?.total_products || 0).toLocaleString(),
      sub: `${stats?.active_products || 0} active`,
      icon: Package,
      accent: 'bg-gray-900',
      href: '/admin/products',
    },
    {
      label: 'Total Orders',
      value: (stats?.total_orders || 0).toLocaleString(),
      sub: `${stats?.pending_orders || 0} pending`,
      icon: ShoppingCart,
      accent: 'bg-amber-500',
      href: '/admin/orders',
    },
    {
      label: 'Total Revenue',
      value: fmt(stats?.total_revenue || 0),
      sub: `${fmt(stats?.month_revenue || 0)} this month`,
      icon: TrendingUp,
      accent: 'bg-emerald-600',
      href: '/admin/orders',
    },
    {
      label: 'Featured Items',
      value: (stats?.featured_products || 0).toLocaleString(),
      sub: 'highlighted products',
      icon: Star,
      accent: 'bg-violet-600',
      href: '/admin/products',
    },
  ];

  const quickLinks = [
    { label: 'Add New Product', icon: Plus, href: '/admin/products', desc: 'Create a product listing' },
    { label: 'Wedding Rings', icon: Gem, href: '/admin/wedding-rings', desc: 'Manage ring variants & pricing' },
    { label: 'View Orders', icon: ShoppingCart, href: '/admin/orders', desc: 'Process customer orders' },
    { label: 'Storefront', icon: ExternalLink, href: '/', desc: 'Preview the live website', external: true },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Hero Header ──────────────────────────────────────────────────── */}
        <div className="bg-gray-900 rounded-2xl px-8 py-7 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-widest font-satoshi">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className="text-2xl font-semibold text-white font-satoshi mt-1.5">
              {getGreeting()}, {admin?.first_name}
            </h1>
            <p className="text-gray-400 text-sm font-satoshi mt-1">
              Here's an overview of your store today
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/admin/products"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium font-satoshi transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-medium font-satoshi hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              View Orders
            </Link>
          </div>
        </div>

        {/* ── Stat Cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.label}
                to={card.href}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${card.accent} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <p className="text-2xl font-semibold text-gray-900 font-satoshi">{card.value}</p>
                <p className="text-xs font-medium text-gray-500 font-satoshi mt-0.5">{card.label}</p>
                <p className="text-xs text-gray-400 font-satoshi mt-1">{card.sub}</p>
              </Link>
            );
          })}
        </div>

        {/* ── Revenue Strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Today's Revenue", value: fmt(stats?.today_revenue || 0), sub: `${stats?.today_orders || 0} orders today`, icon: Clock, color: 'text-amber-500' },
            { label: "This Month", value: fmt(stats?.month_revenue || 0), sub: `${stats?.month_orders || 0} orders`, icon: TrendingUp, color: 'text-emerald-500' },
            { label: "Avg. Order Value", value: fmt(stats?.month_orders ? (stats.month_revenue / stats.month_orders) : 0), sub: 'based on this month', icon: CheckCircle, color: 'text-violet-500' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4">
                <div className="shrink-0">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-satoshi">{item.label}</p>
                  <p className="text-lg font-semibold text-gray-900 font-satoshi truncate">{item.value}</p>
                  <p className="text-xs text-gray-400 font-satoshi">{item.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Bulk Price Adjustment ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Percent className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 font-satoshi">Bulk Price Adjustment</h2>
              <p className="text-xs text-gray-400 font-satoshi">Increase or decrease product prices by a percentage</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-satoshi">Percentage (%)</label>
              <div className="relative">
                <input
                  type="number" step="0.1" placeholder="e.g. 5 or -3"
                  value={adjustPct}
                  onChange={e => { setAdjustPct(e.target.value); setAdjustResult(null); }}
                  className="w-36 pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 font-satoshi">Apply to</label>
              <select value={adjustScope} onChange={e => setAdjustScope(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                <option value="engagement">Engagement Rings only</option>
                <option value="all">All Products</option>
              </select>
            </div>
            <button
              onClick={applyPriceAdjust}
              disabled={adjusting || !adjustPct || parseFloat(adjustPct) === 0}
              className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 font-satoshi flex items-center gap-2"
            >
              {adjusting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {adjusting ? 'Applying…' : parseFloat(adjustPct || '0') >= 0 ? '↑ Increase Prices' : '↓ Decrease Prices'}
            </button>
            {adjustResult && (
              <p className={`text-sm font-satoshi ${adjustResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                {adjustResult.ok ? '✓ ' : '✗ '}{adjustResult.message}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 font-satoshi">
            Positive % = increase · Negative % = decrease · Example: <span className="font-medium">5</span> raises all selected prices by 5%
          </p>
        </div>

        {/* ── Main Grid: Orders + Quick Links ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide font-satoshi">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs text-gray-500 hover:text-gray-900 font-satoshi flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentOrders.map((order) => {
                  const statusCfg = orderStatusConfig[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-600' };
                  const payCfg = paymentStatusConfig[order.payment_status] || { className: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={order.id} className="px-6 py-3.5 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 font-satoshi">{order.order_number}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium font-satoshi ${statusCfg.className}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-satoshi mt-0.5 truncate">
                            {order.customer_name} · {order.customer_email}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-gray-900 font-satoshi">£{order.total_amount.toFixed(2)}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium font-satoshi ${payCfg.className}`}>
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 font-satoshi mt-1">{formatDate(order.created_at)}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400 font-satoshi">No recent orders</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide font-satoshi">Quick Links</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                const el = (
                  <div className="px-5 py-4 hover:bg-gray-50 transition-colors flex items-center gap-3 group cursor-pointer">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors shrink-0">
                      <Icon className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 font-satoshi">{link.label}</p>
                      <p className="text-xs text-gray-400 font-satoshi">{link.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition-colors" />
                  </div>
                );
                return link.external ? (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">{el}</a>
                ) : (
                  <Link key={link.label} to={link.href}>{el}</Link>
                );
              })}
            </div>

            {/* Order status summary */}
            <div className="px-5 py-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-satoshi mb-3">Order Status</p>
              <div className="space-y-2">
                {[
                  { label: 'Pending', value: stats?.pending_orders || 0, color: 'bg-amber-400' },
                  { label: 'Processing', value: stats?.processing_orders || 0, color: 'bg-blue-400' },
                  { label: 'Delivered', value: stats?.delivered_orders || 0, color: 'bg-emerald-400' },
                ].map((item) => {
                  const total = stats?.total_orders || 1;
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 font-satoshi">{item.label}</span>
                        <span className="text-xs font-medium text-gray-900 font-satoshi">{item.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Products ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide font-satoshi">Recently Added Products</h2>
            <Link to="/admin/products" className="text-xs text-gray-500 hover:text-gray-900 font-satoshi flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {recentProducts.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recentProducts.map((product) => (
                <div key={product.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 font-satoshi truncate">{product.name}</p>
                    <p className="text-xs text-gray-400 font-satoshi">Added {formatDate(product.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900 font-satoshi">{product.price}</p>
                  </div>
                  <Link
                    to={`/admin/products`}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400 font-satoshi">No products yet</p>
              <Link to="/admin/products" className="mt-3 inline-flex items-center gap-1 text-xs text-gray-900 font-medium font-satoshi hover:underline">
                <Plus className="w-3 h-3" /> Add your first product
              </Link>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
