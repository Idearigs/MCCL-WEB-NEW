import { useState, useEffect, useCallback, useRef } from 'react';
import API_BASE_URL from '../config/api';
import { fetchWithAuth } from './authHelper';

interface OrderItem {
  id: string;
  product_name: string;
  product_type: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  createdAt: string;
  items?: OrderItem[];
}

interface OrderListProps {
  onSwitchToChats: () => void;
  onOpenOrder: (orderId: string) => void;
}

const STATUS_FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const STATUS_ICONS: Record<string, string> = {
  pending: 'M12 8v4l3 3',
  processing: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  shipped: 'M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11M16 18h2c.6 0 1-.4 1-1v-3.6c0-.3-.1-.5-.3-.7l-3.2-3.2c-.2-.2-.5-.3-.7-.3H14',
  delivered: 'M20 6L9 17l-5-5',
  cancelled: 'M18 6L6 18M6 6l12 12',
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function formatCurrency(amount: number, currency: string): string {
  const sym = currency === 'GBP' ? '\u00A3' : currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : '';
  return `${sym}${parseFloat(String(amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderList({ onSwitchToChats, onOpenOrder }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/payments/orders`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  // Summary stats
  const totalOrders = orders.length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + parseFloat(String(o.total_amount || 0)), 0);

  // Count per status for filter badges
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  return (
    <div className="chat-app">
      {/* Glass Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>Orders</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleRefresh} className="header-icon-btn" disabled={refreshing}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
            </button>
            <button onClick={onSwitchToChats} className="header-icon-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span style={{ marginLeft: 6, fontSize: 13 }}>Chats</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="order-stats-row">
          <div className="order-stat-card">
            <span className="order-stat-value">{totalOrders}</span>
            <span className="order-stat-label">Total</span>
          </div>
          <div className="order-stat-card">
            <span className="order-stat-value" style={{ color: '#eab308' }}>{pendingCount}</span>
            <span className="order-stat-label">Pending</span>
          </div>
          <div className="order-stat-card">
            <span className="order-stat-value" style={{ color: 'var(--chat-gold)' }}>
              {'\u00A3'}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="order-stat-label">Revenue</span>
          </div>
        </div>
      </div>

      {/* Status filter pills with count badges */}
      <div className="filter-pills" style={{ paddingTop: 12 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-pill ${statusFilter === f ? 'active' : ''}`}
            onClick={() => setStatusFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && statusCounts[f] ? (
              <span className="filter-pill-badge">{statusCounts[f]}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <p style={{ fontWeight: 500, fontSize: 15 }}>No orders found</p>
          <p style={{ fontSize: 13 }}>
            {statusFilter !== 'all' ? `No ${statusFilter} orders` : 'Orders will appear here'}
          </p>
        </div>
      ) : (
        <div className="chat-list-scroll" ref={scrollRef}>
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="order-card"
              onClick={() => onOpenOrder(order.id)}
            >
              <div className="order-card-top">
                <div className="order-card-left">
                  <span className="order-card-number">{order.order_number}</span>
                  <span className="order-card-customer">{order.customer_name}</span>
                </div>
                <div className="order-card-right">
                  <span className="order-card-amount">{formatCurrency(order.total_amount, order.currency)}</span>
                  <span className="order-card-date">{formatDate(order.createdAt)}</span>
                </div>
              </div>
              <div className="order-card-bottom">
                <span
                  className="order-status-pill"
                  style={{ background: STATUS_COLORS[order.status] || '#6b7280' }}
                >
                  {order.status}
                </span>
                {order.items && order.items.length > 0 && (
                  <span className="order-card-items-count">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
