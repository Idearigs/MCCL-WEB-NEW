import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import AuthModal from "../components/AuthModalV2";
import { useUserAuth } from "../contexts/UserAuthContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../contexts/CartContext";
import { useIsMobile } from "../hooks/use-mobile";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * AccountV2 — the client ledger, wired to the existing backend.
 * VISUAL design: design_handoff_mcculloch_account_search_saved (Account.dc.html).
 *
 * REAL data:
 *   • Orders + stats  → GET  /users/orders
 *   • Profile fields  → GET  /users/profile   (name, email, phone, newsletter, sms)
 *   • Save details    → PUT  /users/profile
 *   • Saved items     → FavoritesContext (GET /favorites)  — products expose
 *                       basePrice/salePrice and link via the universal /product/:slug route
 *   • Addresses       → derived from the latest order's shipping_address
 *
 * The backend holds no Appointments or "Your pieces" records yet, so those panes show
 * honest empty states rather than invented content. Ring size has no column yet, so it
 * is an editable field that is not persisted (marked below).
 */

const M2 = "#8A8377";
const PAST = "#C4BCB0";
const CHAMP_LIVE = "#E4DBC6";
const A9 = "#A9A196";

const DELIVERED = ["delivered", "completed", "fulfilled", "cancelled", "refunded"];

const money = (n?: number | null) => (n == null || isNaN(Number(n)) ? "" : "£" + Math.round(Number(n)).toLocaleString("en-GB"));
const favPrice = (p: any): number | undefined => {
  const v = p?.salePrice ?? p?.basePrice ?? p?.price;
  return v == null ? undefined : Number(v);
};
const favLink = (p: any) => (p?.slug ? `/product/${p.slug}` : "#");

const authFetch = (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("user_access_token");
  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  }).then((r) => r.json());
};

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

interface OrderItem { id: string; name: string; quantity: number; unitPrice: number; totalPrice: number }
interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string; total: number;
  createdAt: string; shippingAddress: any; trackingNumber?: string; itemsCount: number; items: OrderItem[];
}

const TABS: { id: string; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "saved", label: "Saved items" },
  { id: "appointments", label: "Appointments" },
  { id: "pieces", label: "Your pieces" },
  { id: "details", label: "Your details" },
  { id: "addresses", label: "Addresses & payment" },
];

const SectionHead = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
    <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(26px, 2.6vw, 38px)", lineHeight: 1, margin: 0 }}>{title}</h2>
    {right}
  </div>
);

const Field = ({ label, value, onChange, type = "text", span2 = false, hint }: { label: string; value: string; onChange?: (v: string) => void; type?: string; span2?: boolean; hint?: string }) => (
  <label style={{ display: "block", gridColumn: span2 ? "span 2" : undefined }}>
    <span style={{ display: "block", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 8 }}>{label}</span>
    <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} style={{ width: "100%", padding: 14, fontFamily: FONT_BODY, fontSize: 14, color: T.ink, background: "#FFFFFF", border: `1px solid ${T.ruleStrong}`, borderRadius: 0, outline: "none" }} />
    {hint && <span style={{ display: "block", fontSize: 11, color: M2, marginTop: 6 }}>{hint}</span>}
  </label>
);

const EmptyPane = ({ head, body, cta }: { head: string; body: string; cta?: { label: string; to: string } }) => (
  <div style={{ padding: "60px 0 20px", textAlign: "center" }}>
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, marginBottom: 14 }}>{head}</div>
    <p style={{ margin: "0 auto 26px", maxWidth: "44ch", fontSize: 14.5, lineHeight: 1.7, color: T.muted }}>{body}</p>
    {cta && <Link to={cta.to} style={{ display: "inline-block", padding: "14px 28px", background: T.ink, color: T.paper, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>{cta.label}</Link>}
  </div>
);

const AccountV2 = (): JSX.Element => {
  const { user, isAuthenticated, logout } = useUserAuth();
  const { favorites, localFavorites, favoritesCount, removeFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();

  const [pane, setPane] = useState<string | null>("orders");
  const [authOpen, setAuthOpen] = useState(false);

  // Real backend state
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersStats, setOrdersStats] = useState<{ totalOrders: number; totalSpent: number } | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [details, setDetails] = useState({ firstName: "", lastName: "", email: "", phone: "", ringSize: "" });
  const [prefs, setPrefs] = useState({ newsletter: true, sms: false });
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [pieces, setPieces] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addrForm, setAddrForm] = useState<any | null>(null); // null = closed; {} = new; {id,…} = edit
  const [addrSaving, setAddrSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    const r = await authFetch("/users/addresses").catch(() => null);
    if (r?.success) setAddresses(r.data || []);
  }, []);

  const loadAccount = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const [p, o, a, pc] = await Promise.all([
        authFetch("/users/profile").catch(() => null),
        authFetch("/users/orders").catch(() => null),
        authFetch("/appointments/mine").catch(() => null),
        authFetch("/pieces/mine").catch(() => null),
      ]);
      if (p?.success) {
        setProfile(p.data);
        setPrefs({ newsletter: p.data.newsletterSubscribed !== false, sms: !!p.data.smsNotifications });
      }
      if (o?.success) {
        setOrders(o.data.orders || []);
        setOrdersStats(o.data.stats || null);
      }
      if (a?.success) setAppointments(a.data || []);
      if (pc?.success) setPieces(pc.data || []);
      loadAddresses();
    } finally {
      setLoadingOrders(false);
    }
  }, [isAuthenticated, loadAddresses]);

  useEffect(() => { loadAccount(); }, [loadAccount]);

  // Prefill the details form from user (fast) then profile (complete)
  useEffect(() => {
    const src = profile || user;
    if (!src) return;
    const parts = (src.fullName || "").split(" ");
    setDetails((d) => ({
      ...d,
      firstName: src.firstName || parts[0] || "",
      lastName: src.lastName || parts.slice(1).join(" ") || "",
      email: src.email || d.email,
      phone: (src as any).phone || d.phone,
      ringSize: (src as any).ringSize || d.ringSize,
    }));
  }, [profile, user]);

  useEffect(() => { setPane(isMobile ? null : "orders"); }, [isMobile]);
  useEffect(() => { document.body.style.background = T.paper; window.scrollTo(0, 0); }, []);

  const savedItems = useMemo(() => {
    if (isAuthenticated) {
      return favorites.map((f) => {
        const p: any = f.product;
        return { id: p.id, name: p.name, price: favPrice(p), image: p.image || p.images?.[0]?.url, to: favLink(p), note: f.favoritedAt };
      });
    }
    return localFavorites.map((f) => ({ id: f.productId, name: f.name || "Saved item", price: undefined as number | undefined, image: f.image, to: f.url || "#", note: f.addedAt }));
  }, [isAuthenticated, favorites, localFavorites]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
    const name = details.firstName || user?.firstName || "there";
    return `Good ${part}, ${name}.`;
  }, [details.firstName, user]);

  const clientSince = useMemo(() => {
    const created = profile?.createdAt || (user as any)?.createdAt;
    return created ? String(new Date(created).getFullYear()) : "—";
  }, [profile, user]);

  const liveOrder = useMemo(() => orders.find((o) => !DELIVERED.includes(String(o.status).toLowerCase())), [orders]);

  const orderCount = ordersStats?.totalOrders ?? orders.length;

  const addSavedToBag = (s: (typeof savedItems)[number]) => {
    addToCart({ id: s.id, name: s.name, price: money(s.price) || "£0", image: s.image ? getMediaUrl(s.image) : "", type: "jewelry" });
  };

  const saveDetails = async () => {
    setSaving(true); setSavedOk(false);
    try {
      const res = await authFetch("/users/profile", {
        method: "PUT",
        body: JSON.stringify({ firstName: details.firstName, lastName: details.lastName, phone: details.phone, ringSize: details.ringSize, newsletterSubscribed: prefs.newsletter, smsNotifications: prefs.sms }),
      });
      if (res?.success) { setSavedOk(true); setTimeout(() => setSavedOk(false), 3000); }
    } finally { setSaving(false); }
  };

  // ————— Address CRUD —————
  const saveAddress = async () => {
    if (!addrForm) return;
    if (!addrForm.line1?.trim() || !addrForm.city?.trim() || !addrForm.postcode?.trim()) return;
    setAddrSaving(true);
    try {
      const body = JSON.stringify(addrForm);
      const res = addrForm.id
        ? await authFetch(`/users/addresses/${addrForm.id}`, { method: "PUT", body })
        : await authFetch("/users/addresses", { method: "POST", body });
      if (res?.success) { setAddrForm(null); await loadAddresses(); }
    } finally { setAddrSaving(false); }
  };
  const removeAddress = async (id: string) => { const res = await authFetch(`/users/addresses/${id}`, { method: "DELETE" }); if (res?.success) loadAddresses(); };
  const makeDefaultAddress = async (id: string) => { const res = await authFetch(`/users/addresses/${id}/default`, { method: "PUT" }); if (res?.success) loadAddresses(); };

  // ————— Not signed in —————
  if (!isAuthenticated || !user) {
    return (
      <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY }}>
        <NavigationV2 solid />
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "clamp(140px, 22vh, 240px) 24px clamp(80px, 12vw, 160px)", textAlign: "center" }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>Your account</div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1.04, margin: "0 0 18px" }}>Sign in to your account.</h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: T.body, maxWidth: "44ch", margin: "0 auto 30px" }}>Your orders, saved designs and details — all in one place.</p>
          <button onClick={() => setAuthOpen(true)} style={{ padding: "15px 34px", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>Sign in</button>
        </div>
        <FooterV2 />
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
      </div>
    );
  }

  const activePane = pane || "orders";
  const showIndex = isMobile && pane === null;

  const renderPane = (p: string) => {
    switch (p) {
      case "orders":
        return (
          <div>
            <SectionHead title="Orders" right={<span style={{ fontSize: 12, color: T.muted }}>{loadingOrders ? "Loading…" : orderCount === 1 ? "1 order" : `${orderCount} orders`}</span>} />
            {loadingOrders ? (
              <div style={{ padding: "60px 0", color: T.muted, fontSize: 14 }}>Fetching your orders…</div>
            ) : orders.length === 0 ? (
              <EmptyPane head="No orders yet." body="When you commission or buy a piece, it will appear here with its status and documents." cta={{ label: "Browse engagement rings", to: "/engagement-rings" }} />
            ) : (
              orders.map((o) => {
                const live = !DELIVERED.includes(String(o.status).toLowerCase());
                const label = o.status ? o.status.charAt(0).toUpperCase() + o.status.slice(1) : "Order";
                return (
                  <div key={o.id} style={{ padding: "26px 0", borderBottom: `1px solid ${T.rule}` }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "clamp(12px, 2vw, 28px)" }}>
                        <span style={{ fontSize: 14 }}>{o.orderNumber || `#${String(o.id).slice(0, 8)}`}</span>
                        <span style={{ fontSize: 12.5, color: T.muted }}>{fmtDate(o.createdAt)}</span>
                        <span style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 11px", color: live ? T.ink : T.muted, background: live ? CHAMP_LIVE : T.tint }}>{label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "clamp(12px, 2vw, 24px)" }}>
                        <span style={{ fontSize: 14 }}>{money(o.total)}</span>
                        <Link to={`/orders/${o.id}`} className="acc-link">{live ? "Track order" : "View order"}</Link>
                      </div>
                    </div>
                    {o.items.map((it) => (
                      <div key={it.id} style={{ display: "grid", gridTemplateColumns: "76px minmax(0, 1fr) auto", gap: 18, alignItems: "start", marginBottom: 14 }}>
                        <div style={{ aspectRatio: "4 / 5", background: T.tint }} />
                        <div>
                          <div style={{ fontSize: 14.5, marginBottom: 5 }}>{it.name}</div>
                          {it.quantity > 1 && <div style={{ fontSize: 12.5, color: T.muted }}>Quantity {it.quantity}</div>}
                          {o.trackingNumber && live && <div style={{ fontSize: 12, color: M2, marginTop: 5 }}>Tracking {o.trackingNumber}</div>}
                        </div>
                        <div style={{ fontSize: 13.5, textAlign: "right", whiteSpace: "nowrap" }}>{money(it.totalPrice)}</div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        );

      case "saved":
        return (
          <div>
            <SectionHead title="Saved items" right={<span style={{ fontSize: 12, color: T.muted }}>Kept for as long as you like</span>} />
            {savedItems.length === 0 ? (
              <EmptyPane head="Nothing saved yet." body="Tap the save mark on any piece and it will wait here — specification and all." cta={{ label: "Browse engagement rings", to: "/engagement-rings" }} />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: "clamp(16px, 2vw, 28px)", marginTop: 28 }}>
                {savedItems.map((s) => (
                  <div key={s.id}>
                    <div style={{ position: "relative", aspectRatio: "4 / 5", background: T.tint, overflow: "hidden" }}>
                      {s.image && <img src={getMediaUrl(s.image)} alt={s.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
                      <button type="button" onClick={() => removeFavorite(s.id)} aria-label="Remove" style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, cursor: "pointer", background: "rgba(248,246,240,0.9)", border: 0, fontFamily: FONT_BODY, fontSize: 15, color: T.body }}>×</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "16px 0 6px" }}>
                      <Link to={s.to} style={{ fontSize: 14 }}>{s.name}</Link>
                      {s.price != null && <span style={{ fontSize: 13.5, whiteSpace: "nowrap" }}>{money(s.price)}</span>}
                    </div>
                    <button type="button" onClick={() => addSavedToBag(s)} className="acc-outline" style={{ width: "100%", padding: 12, marginTop: 8, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink, background: "transparent", border: `1px solid ${T.ruleStrong}` }}>Add to bag</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "appointments":
        return (
          <div>
            <SectionHead title="Appointments" right={<Link to="/contact" className="acc-link">Book one</Link>} />
            {appointments.length === 0 ? (
              <EmptyPane head="No appointments booked." body="This house books consultations, fittings and services. When you book one, it will show here with its notes." cta={{ label: "Book an appointment", to: "/contact" }} />
            ) : (
              appointments.map((a) => {
                const d = a.scheduledAt ? new Date(a.scheduledAt) : null;
                const dateStr = d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                const timeStr = d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
                const statusLabel = a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : "";
                return (
                  <div key={a.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "104px 1fr" : "132px minmax(0, 1fr) auto", gap: "clamp(16px, 2.5vw, 40px)", alignItems: "baseline", padding: "24px 0", borderBottom: `1px solid ${T.rule}` }}>
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 1, color: a.upcoming ? T.gold : PAST }}>{dateStr}</div>
                      <div style={{ fontSize: 11.5, color: M2, marginTop: 8 }}>{[timeStr, a.duration].filter(Boolean).join(", ")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, marginBottom: 7 }}>{a.kind}</div>
                      {a.note && <div style={{ fontSize: 13, lineHeight: 1.65, color: T.muted }}>{a.note}</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "flex-start" : "flex-end", gap: 10, gridColumn: isMobile ? "span 2" : undefined, marginTop: isMobile ? 6 : 0 }}>
                      <span style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 11px", color: a.upcoming ? T.ink : T.muted, background: a.upcoming ? CHAMP_LIVE : T.tint }}>{statusLabel}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );

      case "pieces":
        return (
          <div>
            <SectionHead title="Your pieces" />
            <p style={{ margin: "22px 0 8px", maxWidth: "56ch", fontSize: 14.5, lineHeight: 1.75, color: T.body }}>
              Everything we make for you is recorded here — with its certification and servicing history. Anything on this list comes back to the bench that made it, for as long as it exists.
            </p>
            {pieces.length === 0 ? (
              <EmptyPane head="Nothing here yet." body="Once you have a piece made with us, its certificate, valuation and service record will live here." cta={{ label: "Explore bespoke", to: "/bespoke-design" }} />
            ) : (
              <div style={{ marginTop: 24 }}>
                {pieces.map((p) => (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "88px 1fr" : "108px minmax(0, 1fr) minmax(0, 0.9fr)", gap: "clamp(18px, 3vw, 40px)", alignItems: "start", padding: "26px 0", borderBottom: `1px solid ${T.rule}` }}>
                    <div style={{ position: "relative", aspectRatio: "4 / 5", background: T.tint, overflow: "hidden" }}>
                      {p.image && <img src={getMediaUrl(p.image)} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
                    </div>
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 1.1, marginBottom: 10 }}>{p.name}</div>
                      {p.spec && <div style={{ fontSize: 13, lineHeight: 1.65, color: T.muted, marginBottom: 14 }}>{p.spec}</div>}
                      {(p.madeOn || p.maker) && <div style={{ fontSize: 12, color: M2 }}>{[p.madeOn && `Made ${p.madeOn}`, p.maker].filter(Boolean).join(" · ")}</div>}
                    </div>
                    <div style={{ gridColumn: isMobile ? "span 2" : undefined, marginTop: isMobile ? 8 : 0 }}>
                      {(p.documents || []).map((d: any, di: number) => (
                        d.url ? (
                          <a key={di} href={getMediaUrl(d.url)} target="_blank" rel="noreferrer" className="acc-doc" style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: `1px solid ${T.rule}`, fontSize: 13 }}>
                            <span>{d.label}</span><span style={{ fontSize: 11, color: M2 }}>{d.meta}</span>
                          </a>
                        ) : (
                          <div key={di} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "11px 0", borderBottom: `1px solid ${T.rule}`, fontSize: 13 }}>
                            <span>{d.label}</span><span style={{ fontSize: 11, color: M2 }}>{d.meta}</span>
                          </div>
                        )
                      ))}
                      <Link to="/contact" className="acc-link" style={{ display: "inline-block", marginTop: 16 }}>Book a service</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "details":
        return (
          <div>
            <div style={{ paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(26px, 2.6vw, 38px)", lineHeight: 1, margin: 0 }}>Your details</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, maxWidth: 680, marginTop: 28 }}>
              <Field label="First name" value={details.firstName} onChange={(v) => setDetails((d) => ({ ...d, firstName: v }))} />
              <Field label="Last name" value={details.lastName} onChange={(v) => setDetails((d) => ({ ...d, lastName: v }))} />
              <Field label="Email address" value={details.email} type="email" span2 hint="Email changes are handled by the workshop — write to us to update it." />
              <Field label="Telephone" value={details.phone} onChange={(v) => setDetails((d) => ({ ...d, phone: v }))} type="tel" />
              <Field label="Ring size" value={details.ringSize} onChange={(v) => setDetails((d) => ({ ...d, ringSize: v }))} hint="We hold this so you never have to measure again." />
            </div>

            <div style={{ maxWidth: 680, marginTop: 40, paddingTop: 26, borderTop: `1px solid ${T.rule}` }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 16 }}>What we send you</div>
              {[
                { key: "newsletter", label: "The journal", note: "Four or five times a year. Workshop notes, nothing promotional." },
                { key: "sms", label: "Reminders by text", note: "A message the day before an appointment or service." },
              ].map((row) => {
                const on = (prefs as any)[row.key];
                return (
                  <button key={row.key} type="button" onClick={() => setPrefs((pr) => ({ ...pr, [row.key]: !on }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, width: "100%", padding: "15px 0", cursor: "pointer", background: "transparent", border: 0, borderBottom: `1px solid ${T.rule}`, textAlign: "left", fontFamily: FONT_BODY }}>
                    <span>
                      <span style={{ display: "block", fontSize: 14, color: T.ink, marginBottom: 5 }}>{row.label}</span>
                      <span style={{ display: "block", fontSize: 12.5, color: T.muted }}>{row.note}</span>
                    </span>
                    <span style={{ flex: "none", width: isMobile ? 44 : 42, height: isMobile ? 24 : 22, padding: 3, background: on ? T.ink : T.ruleSoft, transition: "background 0.25s ease" }}>
                      <span style={{ display: "block", width: isMobile ? 18 : 16, height: isMobile ? 18 : 16, background: T.paper, transform: on ? "translateX(20px)" : "none", transition: "transform 0.25s ease" }} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 32 }}>
              <button type="button" onClick={saveDetails} disabled={saving} className="acc-save" style={{ padding: "16px 32px", cursor: saving ? "default" : "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0, opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : "Save changes"}</button>
              {savedOk && <span style={{ fontSize: 12.5, color: T.gold }}>Saved.</span>}
            </div>
          </div>
        );

      case "addresses":
        return (
          <div>
            <SectionHead title="Addresses" right={<button type="button" onClick={() => setAddrForm({ country: "United Kingdom", fullName: `${details.firstName} ${details.lastName}`.trim() })} className="acc-link" style={{ background: "transparent", border: 0, borderBottom: `1px solid ${T.ruleStrong}` }}>Add an address</button>} />

            {addresses.length === 0 && !addrForm ? (
              <EmptyPane head="No saved addresses." body="Add an address and we will have it ready at checkout — and mark one as your default." />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "clamp(16px, 2vw, 24px)", marginTop: 28 }}>
                {addresses.map((a) => (
                  <div key={a.id} style={{ padding: 24, border: `1px solid ${a.isDefault ? T.ruleStrong : T.rule}`, background: a.isDefault ? T.tint : "transparent" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
                      <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2 }}>{a.addressType === "billing" ? "Billing" : "Delivery"}</span>
                      {a.isDefault && <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold }}>Default</span>}
                    </div>
                    <div style={{ fontSize: 14.5, lineHeight: 1.8, color: T.ink }}>
                      {[a.fullName, a.line1, a.line2, a.city, a.postcode, a.country].filter(Boolean).map((l: string, i: number) => <div key={i}>{l}</div>)}
                    </div>
                    <div style={{ display: "flex", gap: 18, marginTop: 20, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: M2 }}>
                      <button type="button" onClick={() => setAddrForm({ ...a })} className="acc-mini" style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: M2, padding: 0 }}>Edit</button>
                      {!a.isDefault && <button type="button" onClick={() => makeDefaultAddress(a.id)} className="acc-mini" style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: M2, padding: 0 }}>Make default</button>}
                      <button type="button" onClick={() => removeAddress(a.id)} className="acc-mini" style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: M2, padding: 0 }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {addrForm && (
              <div style={{ marginTop: 28, padding: 24, border: `1px solid ${T.ruleStrong}`, maxWidth: 620 }}>
                <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 18 }}>{addrForm.id ? "Edit address" : "New address"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <Field label="Full name" value={addrForm.fullName || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, fullName: v }))} span2 />
                  <Field label="Address line 1" value={addrForm.line1 || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, line1: v }))} span2 />
                  <Field label="Address line 2 (optional)" value={addrForm.line2 || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, line2: v }))} span2 />
                  <Field label="City" value={addrForm.city || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, city: v }))} />
                  <Field label="Postcode" value={addrForm.postcode || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, postcode: v }))} />
                  <Field label="Country" value={addrForm.country || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, country: v }))} />
                  <Field label="Telephone (optional)" value={addrForm.phone || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, phone: v }))} type="tel" />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, cursor: "pointer", fontSize: 13, color: T.body }}>
                  <input type="checkbox" checked={!!addrForm.isDefault} onChange={(e) => setAddrForm((f: any) => ({ ...f, isDefault: e.target.checked }))} style={{ accentColor: T.ink }} />
                  Make this my default address
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20 }}>
                  <button type="button" onClick={saveAddress} disabled={addrSaving} className="acc-save" style={{ padding: "14px 28px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0, opacity: addrSaving ? 0.7 : 1 }}>{addrSaving ? "Saving…" : "Save address"}</button>
                  <button type="button" onClick={() => setAddrForm(null)} style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, color: M2 }}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 40, paddingTop: 26, borderTop: `1px solid ${T.rule}` }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 16 }}>Payment methods</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: T.muted, maxWidth: "52ch" }}>Cards are never stored on our servers — each payment is taken securely through Stripe at checkout. There is nothing to manage here.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const figures = (
    <div style={{ display: "flex", gap: isMobile ? 28 : "clamp(24px, 3vw, 48px)", alignItems: "baseline" }}>
      {[{ n: loadingOrders ? "—" : String(orderCount), l: "Orders" }, { n: String(favoritesCount), l: "Saved" }, { n: clientSince, l: "Client since" }].map((f, i) => (
        <div key={i}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, lineHeight: 1 }}>{f.n}</div>
          <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginTop: 8 }}>{f.l}</div>
        </div>
      ))}
    </div>
  );

  const jewellerCard = (
    <div style={{ padding: 22, background: T.tint }}>
      <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 12 }}>Your jeweller</div>
      <div style={{ fontSize: 14.5, marginBottom: 6 }}>The McCulloch workshop</div>
      <div style={{ fontSize: 12.5, lineHeight: 1.65, color: T.muted, marginBottom: 16 }}>Beeston, Nottingham. Five generations at the bench — write to us any time.</div>
      <Link to="/contact" className="acc-link">Write to us</Link>
    </div>
  );

  const counts: Record<string, number | string> = { orders: loadingOrders ? "" : orderCount, saved: favoritesCount, appointments: appointments.length || "", pieces: pieces.length || "", details: "", addresses: addresses.length || "" };

  return (
    <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.ink }}>
      <style>{`
        .accv2 a { color: inherit; text-decoration: none; }
        .acc-link { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; padding-bottom: 4px; border-bottom: 1px solid ${T.ruleStrong}; color: ${T.ink}; cursor: pointer; transition: color 0.25s ease, border-color 0.25s ease; }
        .acc-link:hover { color: ${T.gold}; border-color: ${T.gold}; }
        .acc-outline:hover { border-color: ${T.ink} !important; }
        .acc-save:hover { background: ${T.gold} !important; }
        .acc-mini:hover { color: ${T.gold} !important; }
        .acc-doc { cursor: pointer; transition: color 0.2s ease; }
        .acc-doc:hover span:first-child { color: ${T.gold}; }
        .acc-tab { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; width: 100%; padding: 15px 0; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.rule}; text-align: left; font-family: ${FONT_BODY}; font-size: 14px; transition: color 0.25s ease; }
        .acc-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 20px 0; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.rule}; text-align: left; font-family: ${FONT_BODY}; }
        @keyframes accPaneIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes accPaneInX { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .acc-pane { animation: none !important; } }
      `}</style>

      <div className="accv2">
        <NavigationV2 solid />
        <div style={{ height: isMobile ? 96 : 118 }} />

        {isMobile ? (
          showIndex ? (
            <div style={{ padding: "clamp(28px, 6vw, 44px) 20px 60px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: T.gold, marginBottom: 14 }}>Your account</div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(34px, 11vw, 46px)", lineHeight: 1.03, margin: "0 0 24px" }}>{greeting}</h1>
              <div style={{ paddingBottom: 26, borderBottom: `1px solid ${T.rule}` }}>{figures}</div>

              {liveOrder && (
                <div style={{ margin: "26px 0", padding: 20, background: T.tint }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 14 }}>On the bench now</div>
                  <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 16, alignItems: "center" }}>
                    <div style={{ aspectRatio: "4 / 5", background: "#E4DECF" }} />
                    <div>
                      <div style={{ fontSize: 15, marginBottom: 4 }}>{liveOrder.items[0]?.name || liveOrder.orderNumber}</div>
                      <div style={{ fontSize: 12.5, color: T.muted, textTransform: "capitalize" }}>{liveOrder.status}</div>
                    </div>
                  </div>
                  <Link to={`/orders/${liveOrder.id}`} className="acc-link" style={{ display: "inline-block", marginTop: 16 }}>Track this order</Link>
                </div>
              )}

              {TABS.map((t) => (
                <button key={t.id} className="acc-row" onClick={() => { setPane(t.id); window.scrollTo(0, 0); }}>
                  <span style={{ fontSize: 18 }}>{t.label}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {counts[t.id] !== "" && <span style={{ fontSize: 13, color: T.muted }}>{counts[t.id]}</span>}
                    <span style={{ color: T.gold, fontSize: 17 }}>→</span>
                  </span>
                </button>
              ))}

              <div style={{ marginTop: 28 }}>{jewellerCard}</div>
              <button onClick={() => logout()} style={{ display: "block", marginTop: 22, background: "none", border: 0, padding: 0, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M2, cursor: "pointer" }}>Sign out</button>
            </div>
          ) : (
            <>
              <div style={{ position: "sticky", top: 69, zIndex: 40, display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: "rgba(248,246,240,0.96)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: `1px solid ${T.rule}` }}>
                <button onClick={() => setPane(null)} style={{ background: "none", border: 0, padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted }}>← Account</button>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20 }}>{TABS.find((t) => t.id === activePane)?.label}</span>
              </div>
              <div key={activePane} className="acc-pane" style={{ padding: "24px 20px 64px", minHeight: 480, animation: "accPaneInX 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
                {renderPane(activePane)}
              </div>
            </>
          )
        ) : (
          <>
            <section style={{ padding: "clamp(36px, 4vw, 64px) clamp(24px, 3vw, 52px) clamp(28px, 3vw, 40px)", borderBottom: `1px solid ${T.rule}` }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 28 }}>
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>Your account</div>
                  <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(38px, 4.4vw, 68px)", lineHeight: 1.02, letterSpacing: "0.005em", margin: 0 }}>{greeting}</h1>
                </div>
                {figures}
              </div>
            </section>

            <main style={{ display: "grid", gridTemplateColumns: "248px minmax(0, 1fr)", gap: "clamp(32px, 4vw, 72px)", padding: "clamp(32px, 4vw, 56px) clamp(24px, 3vw, 52px) clamp(56px, 6vw, 96px)", alignItems: "start" }}>
              <aside style={{ position: "sticky", top: 118 }}>
                <div style={{ borderTop: `1px solid ${T.rule}` }}>
                  {TABS.map((t) => {
                    const on = activePane === t.id;
                    return (
                      <button key={t.id} className="acc-tab" onClick={() => setPane(t.id)} style={{ color: on ? T.ink : T.muted }}>
                        <span>{t.label}</span>
                        <span style={{ fontSize: 11, color: on ? T.gold : A9 }}>{counts[t.id]}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 28 }}>{jewellerCard}</div>
                <button onClick={() => logout()} style={{ display: "block", marginTop: 22, background: "none", border: 0, padding: 0, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M2, cursor: "pointer" }}>Sign out</button>
              </aside>

              <div key={activePane} className="acc-pane" style={{ minHeight: 620, animation: "accPaneIn 0.35s cubic-bezier(0.22,1,0.36,1) both" }}>
                {renderPane(activePane)}
              </div>
            </main>
          </>
        )}

        <FooterV2 />
      </div>
    </div>
  );
};

export default AccountV2;
