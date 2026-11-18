import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useUserAuth } from "../contexts/UserAuthContext";
import { api } from "../config/api";
import { ACCOUNT_CSS, money, fmtDate, tidy, statusLabel, StatusTag, ORDER_TRACK, trackIndex, Notice, AcOrder, AcOrderItem } from "../components/home-v2/accountShared";

/**
 * Order detail, light redesign (Nov 2026). The order number over a four-point progress line
 * (Confirmed, In the workshop, Dispatched, Delivered), the pieces with their options, and the
 * totals on the page's one sand panel. Data is unchanged: the order is found in GET /users/orders.
 */

type Order = AcOrder;

const STATUS_MESSAGES: Record<string, string> = {
  pending: "Your order is being prepared for shipment.",
  processing: "Your order is being processed.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered.",
  cancelled: "This order has been cancelled.",
};

// What was chosen for each piece, as one quiet line.
const attributeLine = (item: AcOrderItem): string => {
  const a = item.attributes || {};
  const out: string[] = [];
  if (item.product_type === "watch") {
    if (a.brand) out.push(`Brand: ${a.brand}`);
    if (a.variant_name) out.push(`Variant: ${a.variant_name}`);
  }
  if (item.product_type === "jewelry" || !item.product_type) {
    if (a.metal) out.push(`Metal: ${a.metal}`);
    if (a.size) out.push(`Size: ${a.size}`);
  }
  if (a.stoneType) {
    out.push(`Stone: ${a.stoneType}`);
    if (a.carat) out.push(`Carat: ${a.carat}`);
    if (a.clarity) out.push(`Clarity: ${a.clarity}`);
    if (a.colour) out.push(`Colour: ${a.colour}`);
    if (a.cut) out.push(`Cut: ${a.cut}`);
  }
  return out.join(" · ");
};

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useUserAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user && orderId) fetchOrderDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("user_access_token");
      if (!token) { setError("Authentication token not found"); return; }

      const response = await fetch(api(`/users/orders`), { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Failed to fetch order details");

      const data = await response.json();
      if (data.success && data.data && data.data.orders) {
        const foundOrder = data.data.orders.find((o: Order) => o.id === orderId);
        if (foundOrder) setOrder(foundOrder);
        else setError("Order not found");
      } else {
        setError("Failed to load order details");
      }
    } catch (err) {
      console.error("Error fetching order detail:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch order details");
    } finally {
      setLoading(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="ac">
      <style>{ACCOUNT_CSS}</style>
      <NavigationV2 solid />
      {children}
      <FooterV2 />
    </div>
  );

  if (authLoading || (isAuthenticated && user && loading)) {
    return shell(<Notice title="Loading your order"><span className="ac-spinner" style={{ margin: 0 }} /></Notice>);
  }
  if (!isAuthenticated || !user) {
    return shell(
      <Notice eyebrow="Your orders" title="Please sign in to view this order.">
        <Link to="/account" className="ac-btn">Sign in</Link>
      </Notice>
    );
  }
  if (error || !order) {
    return shell(
      <Notice eyebrow="Your orders" title="We couldn’t find that order." body={error || "Order not found"}>
        <Link to="/orders" className="ac-btn">Back to your orders</Link>
      </Notice>
    );
  }

  const status = String(order.status || "").toLowerCase();
  const cancelled = status === "cancelled" || status === "refunded";
  const at = trackIndex(status);
  const addr = order.shippingAddress;
  const paid = order.paymentStatus === "paid";

  return shell(
    <>
      <section className="ac-wrap ac-open">
        <div className="ac-crumb"><Link to="/account">Account</Link><span>/</span><Link to="/orders">Orders</Link><span>/</span><span>{order.orderNumber}</span></div>
        <div className="ac-eyebrow">Placed on {fmtDate(order.createdAt)}</div>
        <h1 className="ac-h1">Order {order.orderNumber}</h1>
        <p style={{ margin: "20px auto 0", maxWidth: "48ch", fontSize: 15.5, lineHeight: 1.8 }}>{STATUS_MESSAGES[status] || `Status: ${statusLabel(status)}.`}</p>

        {cancelled ? (
          <div style={{ marginTop: 26 }}><StatusTag status={status} /></div>
        ) : (
          <ol className="ac-track" aria-label={`Order progress: ${ORDER_TRACK[at]}`}>
            {ORDER_TRACK.map((label, i) => <li key={label} className={i <= at ? "is-done" : ""} aria-current={i === at ? "step" : undefined}>{label}</li>)}
          </ol>
        )}
      </section>

      <main className="ac-wrap ac-detail">
        <div>
          <h2 className="ac-h2" style={{ paddingBottom: 18, borderBottom: "1px solid #E3DDD0" }}>{order.items.length === 1 ? "Your piece" : "Your pieces"}</h2>
          {order.items.map((item) => {
            const attrs = attributeLine(item);
            return (
              <div key={item.id} className="ac-item">
                <b>{tidy(item.name)}</b>
                <span style={{ fontSize: 16, whiteSpace: "nowrap" }}>{money(item.totalPrice)}</span>
                {attrs && <p>{attrs}</p>}
                {item.quantity > 1 && <p>Quantity {item.quantity}, {money(item.unitPrice)} each</p>}
              </div>
            );
          })}

          <div style={{ marginTop: 40 }}>
            <div className="ac-eyebrow">Need a hand?</div>
            <p style={{ margin: "12px 0 16px", maxWidth: "50ch", fontSize: 15, lineHeight: 1.75 }}>If you have any questions about your order, please contact our customer service team.</p>
            <span style={{ display: "flex", flexWrap: "wrap", gap: "12px 28px" }}>
              <Link to="/customer-service" className="ac-link">Contact us</Link>
              <Link to="/orders" className="ac-link">Back to your orders</Link>
            </span>
          </div>
        </div>

        <aside>
          <div className="ac-side">
            <h2 className="ac-h2" style={{ fontSize: 24 }}>Summary</h2>
            <div className="ac-row" style={{ marginTop: 18 }}><span>Subtotal</span><span>{money(order.total)}</span></div>
            <div className="ac-row"><span>Payment</span><span style={{ textTransform: "capitalize" }}>{paid ? "Paid" : order.paymentStatus}</span></div>
            <div className="ac-total"><span>Total</span><span>{money(order.total)}</span></div>
          </div>

          {order.trackingNumber && (
            <div className="ac-block">
              <div className="ac-eyebrow">Tracking number</div>
              <div style={{ userSelect: "all" }}>{order.trackingNumber}</div>
            </div>
          )}

          {addr && (
            <div className="ac-block">
              <div className="ac-eyebrow">Delivery to</div>
              <div>
                {addr.name && <div>{addr.name}</div>}
                {addr.address && <div>{addr.address}</div>}
                {addr.city && addr.postalCode && <div>{addr.city}, {addr.postalCode}</div>}
                {addr.country && <div>{addr.country}</div>}
                {addr.phone && <div className="ac-muted" style={{ marginTop: 4 }}>{addr.phone}</div>}
              </div>
            </div>
          )}
        </aside>
      </main>
    </>
  );
};

export default OrderDetail;
