import { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function formatCurrency(amount: number, currency: string): string {
  const sym = currency === 'GBP' ? '\u00A3' : currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : '';
  return `${sym}${parseFloat(String(amount)).toFixed(2)}`;
}

export default function OrderList({ onSwitchToChats, onOpenOrder }: OrderListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  return (
    <div className="chat-app">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Orders</h1>
          <button
            onClick={onSwitchToChats}
            className="header-icon-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <span style={{ marginLeft: 6, fontSize: 13 }}>Chats</span>
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="filter-pills">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-pill ${statusFilter === f ? 'active' : ''}`}
            onClick={() => setStatusFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
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
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <p>No orders found</p>
        </div>
      ) : (
        <div className="chat-list-scroll">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="order-list-item"
              onClick={() => onOpenOrder(order.id)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--chat-text)' }}>
                    {order.order_number}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--chat-text-muted)', flexShrink: 0 }}>
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--chat-text-muted)', marginTop: 2 }}>
                  {order.customer_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span
                    className="order-status-pill"
                    style={{ background: STATUS_COLORS[order.status] || '#6b7280' }}
                  >
                    {order.status}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--chat-text)' }}>
                    {formatCurrency(order.total_amount, order.currency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
