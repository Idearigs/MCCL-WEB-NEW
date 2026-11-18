import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useUserAuth } from "../contexts/UserAuthContext";
import { api } from "../config/api";
import { ACCOUNT_CSS, money, OrderRow, EmptyPane, Notice, AcOrder } from "../components/home-v2/accountShared";

/**
 * Orders, light redesign (Nov 2026): the new navigation and footer, a centred title over three
 * figures, and the same order rows the account page uses. Data is unchanged: GET /users/orders.
 */

type Order = AcOrder;
interface OrdersData { orders: Order[]; stats: { totalOrders: number; totalSpent: number; pendingOrders: number } }

const Orders: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useUserAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0, pendingOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("user_access_token");
      if (!token) { setError("Authentication token not found"); return; }

      const response = await fetch(api("/users/orders"), { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Failed to fetch orders: ${response.statusText}`);

      const data = (await response.json()) as { success: boolean; data: OrdersData };
      if (data.success && data.data) {
        setOrders(data.data.orders);
        setStats(data.data.stats);
      } else {
        setError("Failed to load orders");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
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
    return shell(<Notice title="Loading your orders"><span className="ac-spinner" style={{ margin: 0 }} /></Notice>);
  }
  if (!isAuthenticated || !user) {
    return shell(
      <Notice eyebrow="Your orders" title="Please sign in to view your orders." body="Sign in to see your order history and follow anything on its way to you.">
        <Link to="/account" className="ac-btn">Sign in</Link>
      </Notice>
    );
  }

  const figures = [
    { n: String(stats.totalOrders), l: stats.totalOrders === 1 ? "Order" : "Orders" },
    { n: money(stats.totalSpent) || "£0", l: "Total spent" },
    { n: String(stats.pendingOrders), l: "In progress" },
  ];

  return shell(
    <>
      <section className="ac-wrap is-narrow ac-open">
        <div className="ac-crumb"><Link to="/">Home</Link><span>/</span><Link to="/account">Account</Link><span>/</span><span style={{ color: "inherit" }}>Orders</span></div>
        <div className="ac-eyebrow">Your account</div>
        <h1 className="ac-h1">Your orders</h1>
        <div className="ac-facts">
          {figures.map((f) => <div key={f.l} className="ac-fact"><b>{f.n}</b><span>{f.l}</span></div>)}
        </div>
      </section>

      <main className="ac-wrap is-narrow" style={{ paddingTop: "clamp(20px, 3vw, 40px)", paddingBottom: "clamp(64px, 7vw, 112px)" }}>
        {error && <div className="ac-error" role="alert">{error}</div>}
        {orders.length === 0 ? (
          !error && <EmptyPane head="No orders yet." body="When you place an order, it will appear here with its status." cta={{ label: "Start shopping", to: "/" }} />
        ) : (
          orders.map((o) => <OrderRow key={o.id} o={o} />)
        )}
        <div style={{ marginTop: 34 }}><Link to="/account" className="ac-link">Back to your account</Link></div>
      </main>
    </>
  );
};

export default Orders;
