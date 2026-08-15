import React, { useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getMediaUrl } from '../config/api';
import { CartItem } from '../contexts/CartContext';
import { T, FONT_DISPLAY, FONT_BODY } from './home-v2/tokens';

interface CartSlideProps {
  isOpen: boolean;
  isVisible: boolean;
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (itemIndex: number, newQuantity: number) => void;
  onRemoveItem: (itemIndex: number) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') return price;
  return parseFloat(String(price).replace(/[£,\s]/g, '')) || 0;
};
const money = (n: number): string => `£${Math.round(n).toLocaleString('en-GB')}`;

const configSummary = (item: CartItem): string => {
  if (item.type === 'watch') {
    return [item.brand, item.variant_name].filter(Boolean).join(' · ');
  }
  return [item.metal, item.size && `Size ${item.size}`].filter(Boolean).join(' · ');
};

const CartSlide: React.FC<CartSlideProps> = ({
  isOpen,
  isVisible,
  cartItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const subtotal = cartItems.reduce((t, i) => t + parsePrice(i.price) * i.quantity, 0);
  const total = subtotal; // delivery free & insured
  const count = cartItems.reduce((t, i) => t + i.quantity, 0);

  const stepBtn: React.CSSProperties = {
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `1px solid ${T.ruleSoft}`, background: 'transparent', color: T.body, cursor: 'pointer',
    transition: 'border-color 0.2s, color 0.2s',
  };

  return (
    <div className="cs2-shell" style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', justifyContent: 'flex-end' }}>
      <style>{`
        @keyframes cs2ScrimIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cs2DrawerIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes cs2RowIn { from { opacity: 0; transform: translateX(16px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes cs2SheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        .cs2-scrim { animation: cs2ScrimIn 0.3s ease both; }
        .cs2-panel { animation: cs2DrawerIn 0.36s cubic-bezier(0.22,1,0.36,1) both; }
        .cs2-row { animation: cs2RowIn 0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .cs2-step:hover { border-color: ${T.ink} !important; color: ${T.ink} !important; }
        .cs2-checkout:hover { background: ${T.inkDeep} !important; }
        .cs2-viewbag:hover { background: ${T.tint} !important; }
        .cs2-remove:hover { color: ${T.ink} !important; }
        .cs2-close:hover { color: ${T.ink} !important; }
        .cs2-thumblink img { transition: opacity 0.25s; }
        .cs2-thumblink:hover img { opacity: 0.85; }
        @media (max-width: 560px) {
          .cs2-shell { align-items: flex-end; }
          .cs2-panel {
            max-width: 100% !important; width: 100% !important; height: auto !important;
            max-height: 88vh !important; border-left: 0 !important;
            border-top-left-radius: 4px; border-top-right-radius: 4px;
            animation: cs2SheetUp 0.36s cubic-bezier(0.22,1,0.36,1) both !important;
          }
          .cs2-footer { padding-bottom: calc(18px + env(safe-area-inset-bottom)) !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs2-scrim, .cs2-panel, .cs2-row { animation: none !important; }
        }
      `}</style>

      {/* Scrim */}
      <div
        className="cs2-scrim"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(20,18,15,0.42)', cursor: 'pointer' }}
      />

      {/* Panel */}
      <div
        className="cs2-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        style={{
          position: 'relative', maxWidth: 448, width: '100%', height: '100%',
          background: T.paper, borderLeft: `1px solid ${T.rule}`,
          display: 'flex', flexDirection: 'column', fontFamily: FONT_BODY,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', borderBottom: `1px solid ${T.rule}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.ink }}>Your bag</span>
            <span style={{ fontSize: 12, color: T.muted }}>{count} {count === 1 ? 'piece' : 'pieces'}</span>
          </div>
          <button
            className="cs2-close"
            onClick={onClose}
            aria-label="Close bag"
            style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 0, color: T.muted, cursor: 'pointer', transition: 'color 0.2s' }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          /* Empty state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px' }}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: T.ink, marginBottom: 10 }}>Your bag is empty</h2>
            <p style={{ fontSize: 13.5, color: T.muted, lineHeight: 1.6, marginBottom: 26, maxWidth: 280 }}>
              Nothing here yet. Explore our engagement rings and bespoke commissions.
            </p>
            <Link
              to="/engagement-rings"
              onClick={onClose}
              className="cs2-checkout"
              style={{ display: 'inline-block', padding: '14px 34px', background: T.ink, color: T.paper, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.25s' }}
            >
              Start exploring
            </Link>
          </div>
        ) : (
          <>
            {/* Line rows */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
              {cartItems.map((item, index) => (
                <div
                  key={`${item.id}-${item.metal}-${item.size}-${index}`}
                  className="cs2-row"
                  style={{
                    display: 'grid', gridTemplateColumns: '88px 1fr', gap: 18,
                    padding: '22px 0', borderBottom: `1px solid ${T.rule}`,
                    animationDelay: `${(0.06 + index * 0.06).toFixed(2)}s`,
                  }}
                >
                  {/* Thumbnail */}
                  <Link
                    to={item.slug ? `/rings/${item.slug}` : '#'}
                    onClick={onClose}
                    className="cs2-thumblink"
                    style={{ display: 'block', width: 88, aspectRatio: '4 / 5', background: '#FFFFFF', overflow: 'hidden' }}
                  >
                    <img src={getMediaUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Link>

                  {/* Details */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                      <Link
                        to={item.slug ? `/rings/${item.slug}` : '#'}
                        onClick={onClose}
                        style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: T.ink, lineHeight: 1.15, textDecoration: 'none', minWidth: 0 }}
                      >
                        {item.name}
                      </Link>
                      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: T.ink, whiteSpace: 'nowrap' }}>
                        {money(parsePrice(item.price) * item.quantity)}
                      </span>
                    </div>
                    {configSummary(item) && (
                      <p style={{ fontSize: 12, color: T.muted, marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {configSummary(item)}
                      </p>
                    )}

                    {/* Stepper + remove */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button className="cs2-step" style={stepBtn} onClick={() => onUpdateQuantity(index, item.quantity - 1)} aria-label={`Decrease quantity, ${item.name}`}>
                          <Minus size={12} />
                        </button>
                        <span style={{ width: 38, textAlign: 'center', fontSize: 13, color: T.ink }}>{item.quantity}</span>
                        <button className="cs2-step" style={stepBtn} onClick={() => onUpdateQuantity(index, item.quantity + 1)} aria-label={`Increase quantity, ${item.name}`}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        className="cs2-remove"
                        onClick={() => onRemoveItem(index)}
                        style={{ background: 'transparent', border: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.muted, cursor: 'pointer', transition: 'color 0.2s' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="cs2-footer" style={{ flexShrink: 0, background: T.tint, borderTop: `1px solid ${T.rule}`, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.body, marginBottom: 8 }}>
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.body, marginBottom: 14 }}>
                <span>Delivery</span>
                <span style={{ color: T.gold }}>Free, insured</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${T.ruleSoft}` }}>
                <span style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.ink }}>Total</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: T.ink, lineHeight: 1 }}>{money(total)}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Delivery free &amp; insured</div>
                </div>
              </div>

              <Link
                to="/checkout"
                onClick={onClose}
                className="cs2-checkout"
                style={{ display: 'block', textAlign: 'center', marginTop: 18, padding: '15px', background: T.ink, color: T.paper, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.25s' }}
              >
                Checkout
              </Link>
              <Link
                to="/cart"
                onClick={onClose}
                className="cs2-viewbag"
                style={{ display: 'block', textAlign: 'center', marginTop: 10, padding: '13px', background: 'transparent', color: T.ink, border: `1px solid ${T.ruleStrong}`, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.25s' }}
              >
                View full bag
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSlide;
