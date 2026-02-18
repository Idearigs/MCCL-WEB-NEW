import { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import { fetchWithAuth } from './authHelper';

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
const PROGRESS_STATUSES = ['pending', 'processing', 'shipped', 'delivered'];

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

function formatCurrency(amount: number, currency: string): string {
  const sym = currency === 'GBP' ? '\u00A3' : currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : '';
  return `${sym}${parseFloat(String(amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function OrderDetail({ orderId, onBack }: OrderDetailProps) {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedField, setSavedField] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/payments/order/${orderId}`);
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

      const res = await fetchWithAuth(`${API_BASE_URL}/payments/order/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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

  const handleCopy = (text: string, field: string) => {
    copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
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
  const progressIndex = PROGRESS_STATUSES.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="chat-app slide-in">
      {/* Sticky Header */}
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
        {/* Progress Bar */}
        {!isCancelled && (
          <div className="order-section">
            <div className="order-progress-bar">
              {PROGRESS_STATUSES.map((s, i) => (
                <div key={s} className="order-progress-step">
                  <div
                    className={`order-progress-dot ${i <= progressIndex ? 'completed' : ''} ${i === progressIndex ? 'current' : ''}`}
                  >
                    {i < progressIndex ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : null}
                  </div>
                  {i < PROGRESS_STATUSES.length - 1 && (
                    <div className={`order-progress-line ${i < progressIndex ? 'completed' : ''}`} />
                  )}
                  <span className={`order-progress-label ${i <= progressIndex ? 'active' : ''}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Card */}
        <div className="order-section">
          <h3 className="order-section-title">Customer</h3>
          <div className="order-field">
            <span className="order-field-label">Name</span>
            <span style={{ fontWeight: 500 }}>{order.customer_name}</span>
          </div>
          <div className="order-field">
            <span className="order-field-label">Email</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>{order.customer_email}</span>
              <button
                className="copy-btn"
                onClick={() => handleCopy(order.customer_email, 'email')}
                title="Copy email"
              >
                {copiedField === 'email' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
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
              color: order.payment_status === 'paid' ? '#22c55e' : '#eab308'
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
              className="order-save-btn"
              onClick={() => handleSave('status')}
              disabled={saving || status === order.status}
            >
              {savedField === 'status' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : 'Save'}
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
            {trackingNumber && (
              <button
                className="copy-btn"
                style={{ alignSelf: 'center' }}
                onClick={() => handleCopy(trackingNumber, 'tracking')}
              >
                {copiedField === 'tracking' ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            )}
            <button
              className="order-save-btn"
              onClick={() => handleSave('tracking_number')}
              disabled={saving}
            >
              {savedField === 'tracking_number' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : 'Save'}
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
            className="order-save-btn"
            style={{ marginTop: 8, width: '100%' }}
            onClick={() => handleSave('notes')}
            disabled={saving}
          >
            {savedField === 'notes' ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved
              </span>
            ) : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
}
