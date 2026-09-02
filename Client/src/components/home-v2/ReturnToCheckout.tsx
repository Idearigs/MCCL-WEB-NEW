import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

/**
 * ReturnToCheckout — a small tab that slides in from the right edge offering a
 * one-click jump back to checkout.
 *
 * It appears only after the shopper has left checkout to view a product (the
 * checkout summary sets a session flag on the product link). It is cleared as
 * soon as they return to /checkout, or when they dismiss it, and never shows
 * with an empty bag. Rendered globally in App so it persists across pages.
 */

const FLAG = "mcc_return_checkout";
const getNum = (p: any): number =>
  typeof p === "number" ? p : parseFloat(String(p).replace("£", "").replace(/,/g, "")) || 0;
const money = (n: number): string => `£${Math.round(n || 0).toLocaleString("en-GB")}`;

const ReturnToCheckout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const [show, setShow] = useState(false);
  const [slid, setSlid] = useState(false);

  useEffect(() => {
    const path = location.pathname;

    // Back at checkout (or the bag) — the tab has served its purpose.
    if (path.startsWith("/checkout") || path.startsWith("/cart")) {
      try { sessionStorage.removeItem(FLAG); } catch { /* storage blocked */ }
      setShow(false);
      setSlid(false);
      return;
    }

    let flag = "0";
    try { flag = sessionStorage.getItem(FLAG) || "0"; } catch { /* storage blocked */ }
    const visible = flag === "1" && cartItems.length > 0;
    setShow(visible);
    if (visible) {
      const t = setTimeout(() => setSlid(true), 40);
      return () => clearTimeout(t);
    }
    setSlid(false);
  }, [location.pathname, cartItems.length]);

  if (!show) return null;

  const count = cartItems.reduce((c, i) => c + i.quantity, 0);
  const subtotal = cartItems.reduce((t, i) => t + getNum(i.price) * i.quantity, 0);
  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    try { sessionStorage.removeItem(FLAG); } catch { /* storage blocked */ }
    setSlid(false);
    setShow(false);
  };

  return (
    <div
      onClick={() => navigate("/checkout")}
      role="button"
      tabIndex={0}
      aria-label="Jump to checkout"
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate("/checkout"); }}
      style={{
        position: "fixed", right: 0, top: "42%", zIndex: 70, cursor: "pointer", fontFamily: FONT_BODY,
        transform: slid ? "translateX(0)" : "translateX(112%)",
        transition: "transform 0.42s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <div style={{
        display: "flex", alignItems: "stretch", background: T.paper, border: `1px solid ${T.rule}`, borderRight: 0,
        borderRadius: "10px 0 0 10px", boxShadow: "0 10px 34px rgba(20,18,15,0.18)", overflow: "hidden",
      }}>
        <div style={{ width: 4, background: T.gold, flex: "none" }} />
        <div style={{ padding: "11px 14px" }}>
          <div style={{ fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted }}>
            Your order · {count} {count === 1 ? "piece" : "pieces"}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 5 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: T.ink }}>Jump to checkout</span>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: T.ink, lineHeight: 1 }}>{money(subtotal)}</span>
            <span style={{ color: T.gold, fontSize: 15, lineHeight: 1 }}>→</span>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{ alignSelf: "flex-start", background: "transparent", border: 0, cursor: "pointer", color: T.muted, fontSize: 15, lineHeight: 1, padding: "6px 9px" }}
        >×</button>
      </div>
    </div>
  );
};

export default ReturnToCheckout;
