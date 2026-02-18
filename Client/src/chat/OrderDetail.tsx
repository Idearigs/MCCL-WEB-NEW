import { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  currency: string;
  shipping_address: string;
  tracking_number: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#ff9f0a',
  processing: '#007aff',
  shipped: '#af52de',
  delivered: '#34c759',
  cancelled: '#ff3b30',
};

function formatCurrency(amount: number, currency: string): string {
  const sym = currency === 'GBP' ? '\u00A3' : currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : '';
  return `${sym}${parseFloat(String(amount)).toFixed(2)}`;
}

function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString([], {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return '';
  }
}

export default function OrderDetail({ orderId, onBack }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedField, setSavedField] = useState<string | null>(null);

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/order/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        const o = data.data;
        setOrder(o);
        setStatus(o.status || '');
        setTrackingNumber(o.tracking_number || '');
        setNotes(o.notes || '');
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (field: 'status' | 'tracking_number' | 'notes') => {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (field === 'status') body.status = status;
      if (field === 'tracking_number') body.tracking_number = trackingNumber;
      if (field === 'notes') body.notes = notes;

      const res = await fetch(`${API_BASE_URL}/payments/order/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
        setSavedField(field);
        setTimeout(() => setSavedField(null), 2000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const parseAddress = (addr: string): Record<string, string> => {
    try {
      return JSON.parse(addr);
    } catch {
      return { raw: addr };
    }
  };

  if (loading) {
    return (
      <div className="chat-app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="chat-app">
        <div className="conv-header">
          <button className="back-btn" onClick={onBack}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span style={{ fontWeight: 600, fontSize: 16 }}>Order Not Found</span>
        </div>
      </div>
    );
  }

  const address = parseAddress(order.shipping_address);

  return (
    <div className="chat-app slide-in">
      {/* Header */}
      <div className="conv-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>{order.order_number}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
            <span
              className="order-status-pill"
              style={{ background: STATUS_COLORS[order.status] || '#8e8e93' }}
            >
              {order.status}
            </span>
            <span style={{ fontSize: 12, color: 'var(--chat-text-muted)' }}>
              {formatDateTime(order.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="order-detail-scroll">
        {/* Customer Card */}
        <div className="order-section">
          <h3 className="order-section-title">Customer</h3>
          <div className="order-field">
            <span className="order-field-label">Name</span>
            <span style={{ fontWeight: 500 }}>{order.customer_name}</span>
          </div>
          <div className="order-field">
            <span className="order-field-label">Email</span>
            <span style={{ fontSize: 13 }}>{order.customer_email}</span>
          </div>
        </div>

        {/* Items Card */}
        <div className="order-section">
          <h3 className="order-section-title">Items ({(order.items || []).length})</h3>
          {(order.items || []).map(item => (
            <div key={item.id} className="order-item-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.product_name}</div>
                <div style={{ fontSize: 12, color: 'var(--chat-text-muted)', marginTop: 2 }}>
                  {item.quantity} x {formatCurrency(item.unit_price, order.currency)}
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--chat-gold)' }}>
                {formatCurrency(item.total_price, order.currency)}
              </span>
            </div>
          ))}
          <div className="order-total-row">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--chat-gold)' }}>
              {formatCurrency(order.total_amount, order.currency)}
            </span>
          </div>
        </div>

        {/* Shipping Card */}
        <div className="order-section">
          <h3 className="order-section-title">Shipping Address</h3>
          <div className="order-address">
            {address.raw ? (
              <span>{address.raw}</span>
            ) : (
              <>
                {address.name && <div style={{ fontWeight: 500 }}>{address.name}</div>}
                {address.line1 && <div>{address.line1}</div>}
                {address.line2 && <div>{address.line2}</div>}
                {(address.city || address.state || address.postal_code) && (
                  <div>{[address.city, address.state, address.postal_code].filter(Boolean).join(', ')}</div>
                )}
                {address.country && <div style={{ color: 'var(--chat-text-muted)' }}>{address.country}</div>}
              </>
            )}
          </div>
        </div>

        {/* Payment Card */}
        <div className="order-section">
          <h3 className="order-section-title">Payment</h3>
          <div className="order-field">
            <span className="order-field-label">Status</span>
            <span style={{
              textTransform: 'capitalize',
              fontWeight: 600,
              color: order.payment_status === 'paid' ? '#34c759' : '#ff9f0a'
            }}>
              {order.payment_status}
            </span>
          </div>
          <div className="order-field">
            <span className="order-field-label">Method</span>
            <span style={{ textTransform: 'capitalize' }}>{order.payment_method}</span>
          </div>
        </div>

        {/* Actions Card - Status */}
        <div className="order-section">
          <h3 className="order-section-title">Update Status</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="order-select"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              className="modal-btn primary"
              onClick={() => handleSave('status')}
              disabled={saving || status === order.status}
              style={{ minWidth: 60 }}
            >
              {savedField === 'status' ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Actions Card - Tracking */}
        <div className="order-section">
          <h3 className="order-section-title">Tracking</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="order-input"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
            />
            <button
              className="modal-btn primary"
              onClick={() => handleSave('tracking_number')}
              disabled={saving}
              style={{ minWidth: 60 }}
            >
              {savedField === 'tracking_number' ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Actions Card - Notes */}
        <div className="order-section">
          <h3 className="order-section-title">Notes</h3>
          <textarea
            className="order-textarea"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes..."
            rows={3}
          />
          <button
            className="modal-btn primary"
            style={{ marginTop: 8, width: '100%' }}
            onClick={() => handleSave('notes')}
            disabled={saving}
          >
            {savedField === 'notes' ? 'Saved!' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
