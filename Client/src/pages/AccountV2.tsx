import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import AuthModal from "../components/AuthModalV2";
import { useUserAuth } from "../contexts/UserAuthContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../contexts/CartContext";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { T, FONT_DISPLAY } from "../components/home-v2/tokens";
import { ACCOUNT_CSS, money, isLive, statusLabel, tidy, Tick, OrderRow, EmptyPane, Notice, AcOrder } from "../components/home-v2/accountShared";

/**
 * AccountV2, light redesign (Nov 2026), wired to the existing backend exactly as before.
 * A centred greeting over three figures, an "in progress" line when an order is live, then
 * six sections: a rail down the side on a laptop, a row of tabs that parks under the
 * navigation on a phone (the old phone layout needed a tap into each section and a tap back).
 *
 * REAL data (unchanged):
 *   • Orders + stats  → GET  /users/orders
 *   • Profile fields  → GET  /users/profile   (name, email, phone, newsletter, sms)
 *   • Save details    → PUT  /users/profile
 *   • Saved items     → FavoritesContext (GET /favorites)
 *   • Addresses       → /users/addresses (list, add, edit, remove, make default)
 *   • Appointments / pieces → /appointments/mine, /pieces/mine (empty states until there are any)
 */

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

type Order = AcOrder;

const TABS: { id: string; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "saved", label: "Saved items" },
  { id: "appointments", label: "Appointments" },
  { id: "pieces", label: "Your pieces" },
  { id: "details", label: "Your details" },
  { id: "addresses", label: "Addresses & payment" },
];

const PaneHead = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <div className="ac-panehead"><h2 className="ac-h2">{title}</h2>{right}</div>
);

const Field = ({ id, label, value, onChange, type = "text", wide = false, hint, autoComplete }: { id: string; label: string; value: string; onChange?: (v: string) => void; type?: string; wide?: boolean; hint?: string; autoComplete?: string }) => (
  <div className={wide ? "is-wide" : undefined}>
    <label className="ac-label" htmlFor={id}>{label}</label>
    <input id={id} className="ac-input" type={type} value={value} readOnly={!onChange} autoComplete={autoComplete} onChange={(e) => onChange?.(e.target.value)} />
    {hint && <span className="ac-hint">{hint}</span>}
  </div>
);

const AccountV2 = (): JSX.Element => {
  const { user, isAuthenticated, logout } = useUserAuth();
  const { favorites, localFavorites, favoritesCount, removeFavorite } = useFavorites();
  const { addToCart } = useCart();

  const [pane, setPane] = useState("orders");
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

  useEffect(() => { window.scrollTo(0, 0); }, []);

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
    return created ? String(new Date(created).getFullYear()) : "";
  }, [profile, user]);

  const liveOrder = useMemo(() => orders.find((o) => isLive(o.status)), [orders]);

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
      <div className="ac">
        <style>{ACCOUNT_CSS}</style>
        <NavigationV2 solid />
        <Notice eyebrow="Your account" title="Sign in to your account." body="Your orders, saved designs and details, all in one place.">
          <button type="button" className="ac-btn" onClick={() => setAuthOpen(true)}>Sign in</button>
        </Notice>
        <FooterV2 />
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
      </div>
    );
  }

  const renderPane = (p: string) => {
    switch (p) {
      case "orders":
        return (
          <div>
            <PaneHead title="Orders" right={<span>{loadingOrders ? "Loading…" : orderCount === 1 ? "1 order" : `${orderCount} orders`}</span>} />
            {loadingOrders ? (
              <div className="ac-muted" style={{ padding: "60px 0", fontSize: 15 }}>Fetching your orders…</div>
            ) : orders.length === 0 ? (
              <EmptyPane head="No orders yet." body="When you commission or buy a piece, it will appear here with its status and documents." cta={{ label: "Browse engagement rings", to: "/engagement-rings" }} />
            ) : (
              orders.map((o) => <OrderRow key={o.id} o={o} />)
            )}
          </div>
        );

      case "saved":
        return (
          <div>
            <PaneHead title="Saved items" right={<span>Kept for as long as you like</span>} />
            {savedItems.length === 0 ? (
              <EmptyPane head="Nothing saved yet." body="Tap the heart on any piece and it will wait here for you." cta={{ label: "Browse engagement rings", to: "/engagement-rings" }} />
            ) : (
              <div className="ac-saved">
                {savedItems.map((s) => (
                  <div key={s.id} data-saved>
                    <div style={{ position: "relative" }}>
                      <Link to={s.to} className="ac-piece-img" aria-label={s.name}>
                        {s.image && <img src={getMediaUrl(s.image)} alt={s.name} loading="lazy" />}
                      </Link>
                      <button type="button" className="ac-piece-x" data-unsave onClick={() => removeFavorite(s.id)} aria-label={`Remove ${s.name} from saved`}>
                        <svg width="20" height="18" viewBox="0 0 20 18" fill="currentColor" aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.7 2.8-2.7 4.6-2.7C17 1.4 19 3.3 19 5.9c0 3.7-3.6 6.8-9 10.700z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                    <div className="ac-piece-name">
                      <Link to={s.to}>{tidy(s.name)}</Link>
                      {s.price != null && <span>{money(s.price)}</span>}
                    </div>
                    <button type="button" className="ac-ghost" onClick={() => addSavedToBag(s)}>Add to bag</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "appointments":
        return (
          <div>
            <PaneHead title="Appointments" right={<Link to="/contact" className="ac-link">Book one</Link>} />
            {appointments.length === 0 ? (
              <EmptyPane head="No appointments booked." body="We book consultations, fittings and services. When you book one, it will show here with its notes." cta={{ label: "Book an appointment", to: "/contact" }} />
            ) : (
              appointments.map((a) => {
                const d = a.scheduledAt ? new Date(a.scheduledAt) : null;
                const dateStr = d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                const timeStr = d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
                return (
                  <div key={a.id} className="ac-rowitem">
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 1, color: a.upcoming ? T.text : T.textMuted }}>{dateStr}</div>
                      <div className="ac-muted" style={{ fontSize: 13, marginTop: 8 }}>{[timeStr, a.duration].filter(Boolean).join(", ")}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 16, marginBottom: 6 }}>{a.kind}</div>
                      {a.note && <div className="ac-muted" style={{ fontSize: 14, lineHeight: 1.65 }}>{a.note}</div>}
                    </div>
                    <div><span className={`ac-tag${a.upcoming ? " is-live" : ""}`}><i />{a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : ""}</span></div>
                  </div>
                );
              })
            )}
          </div>
        );

      case "pieces":
        return (
          <div>
            <PaneHead title="Your pieces" />
            <p className="ac-lede">Everything we make for you is recorded here, with its certification and servicing history. Anything on this list comes back to the bench that made it, for as long as it exists.</p>
            {pieces.length === 0 ? (
              <EmptyPane head="Nothing here yet." body="Once you have a piece made with us, its certificate, valuation and service record will live here." cta={{ label: "Explore bespoke", to: "/bespoke-design" }} />
            ) : (
              <div style={{ marginTop: 24 }}>
                {pieces.map((p) => (
                  <div key={p.id} className="ac-rowitem is-piece">
                    <div className="ac-piece-img">{p.image && <img src={getMediaUrl(p.image)} alt={p.name} loading="lazy" />}</div>
                    <div>
                      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 23, lineHeight: 1.2, marginBottom: 10 }}>{p.name}</div>
                      {p.spec && <div className="ac-muted" style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 12 }}>{p.spec}</div>}
                      {(p.madeOn || p.maker) && <div className="ac-muted" style={{ fontSize: 13 }}>{[p.madeOn && `Made ${p.madeOn}`, p.maker].filter(Boolean).join(" · ")}</div>}
                    </div>
                    <div>
                      {(p.documents || []).map((d: any, di: number) => (
                        d.url ? (
                          <a key={di} href={getMediaUrl(d.url)} target="_blank" rel="noreferrer" className="ac-doc"><span>{d.label}</span><span className="ac-muted" style={{ fontSize: 12.5 }}>{d.meta}</span></a>
                        ) : (
                          <div key={di} className="ac-doc"><span>{d.label}</span><span className="ac-muted" style={{ fontSize: 12.5 }}>{d.meta}</span></div>
                        )
                      ))}
                      <Link to="/contact" className="ac-link" style={{ marginTop: 16 }}>Book a service</Link>
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
            <PaneHead title="Your details" />
            <div className="ac-fields" style={{ marginTop: 28 }}>
              <Field id="ac-first" label="First name" autoComplete="given-name" value={details.firstName} onChange={(v) => setDetails((d) => ({ ...d, firstName: v }))} />
              <Field id="ac-last" label="Last name" autoComplete="family-name" value={details.lastName} onChange={(v) => setDetails((d) => ({ ...d, lastName: v }))} />
              <Field id="ac-email" label="Email address" value={details.email} type="email" wide hint="To change your email address, write to us and we will update it for you." />
              <Field id="ac-tel" label="Telephone" autoComplete="tel" value={details.phone} onChange={(v) => setDetails((d) => ({ ...d, phone: v }))} type="tel" />
              <Field id="ac-ring" label="Ring size" value={details.ringSize} onChange={(v) => setDetails((d) => ({ ...d, ringSize: v }))} hint="We hold this so you never have to measure again." />
            </div>

            <div style={{ maxWidth: 680, marginTop: 44 }}>
              <div className="ac-eyebrow" style={{ paddingBottom: 14, borderBottom: `1px solid ${T.line}` }}>What we send you</div>
              {[
                { key: "newsletter", label: "The journal", note: "Four or five times a year. Workshop notes, nothing promotional." },
                { key: "sms", label: "Reminders by text", note: "A message the day before an appointment or service." },
              ].map((row) => {
                const on = (prefs as any)[row.key];
                return (
                  <button key={row.key} type="button" role="switch" aria-checked={!!on} className="ac-switch" data-switch onClick={() => setPrefs((pr) => ({ ...pr, [row.key]: !on }))}>
                    <span><b>{row.label}</b><small>{row.note}</small></span>
                    <i />
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 32 }}>
              <button type="button" className="ac-btn" data-savebtn onClick={saveDetails} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
              {savedOk && <span role="status" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontSize: 14 }}><Tick />Saved</span>}
            </div>
          </div>
        );

      case "addresses":
        return (
          <div>
            <PaneHead title="Addresses" right={<button type="button" className="ac-link" data-addaddr onClick={() => setAddrForm({ country: "United Kingdom", fullName: `${details.firstName} ${details.lastName}`.trim() })}>Add an address</button>} />

            {addresses.length === 0 && !addrForm ? (
              <EmptyPane head="No saved addresses." body="Add an address and we will have it ready at checkout. You can mark one as your default." />
            ) : (
              <div className="ac-addrs">
                {addresses.map((a) => (
                  <div key={a.id} className={`ac-addr${a.isDefault ? " is-default" : ""}`}>
                    <div className="ac-addr-head">
                      <span className="ac-eyebrow">{a.addressType === "billing" ? "Billing" : "Delivery"}</span>
                      {a.isDefault && <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}><Tick />Default</span>}
                    </div>
                    <div className="ac-addr-lines">
                      {[a.fullName, a.line1, a.line2, a.city, a.postcode, a.country].filter(Boolean).map((l: string, i: number) => <div key={i}>{l}</div>)}
                    </div>
                    <div className="ac-addr-acts">
                      <button type="button" className="ac-link" onClick={() => setAddrForm({ ...a })}>Edit</button>
                      {!a.isDefault && <button type="button" className="ac-link" onClick={() => makeDefaultAddress(a.id)}>Make default</button>}
                      <button type="button" className="ac-link" onClick={() => removeAddress(a.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {addrForm && (
              <div className="ac-form">
                <div className="ac-eyebrow" style={{ marginBottom: 20 }}>{addrForm.id ? "Edit address" : "New address"}</div>
                <div className="ac-fields">
                  <Field id="ad-name" label="Full name" autoComplete="name" value={addrForm.fullName || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, fullName: v }))} wide />
                  <Field id="ad-l1" label="Address line 1" autoComplete="address-line1" value={addrForm.line1 || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, line1: v }))} wide />
                  <Field id="ad-l2" label="Address line 2 (optional)" autoComplete="address-line2" value={addrForm.line2 || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, line2: v }))} wide />
                  <Field id="ad-city" label="City" autoComplete="address-level2" value={addrForm.city || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, city: v }))} />
                  <Field id="ad-post" label="Postcode" autoComplete="postal-code" value={addrForm.postcode || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, postcode: v }))} />
                  <Field id="ad-country" label="Country" autoComplete="country-name" value={addrForm.country || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, country: v }))} />
                  <Field id="ad-tel" label="Telephone (optional)" autoComplete="tel" value={addrForm.phone || ""} onChange={(v) => setAddrForm((f: any) => ({ ...f, phone: v }))} type="tel" />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, cursor: "pointer", fontSize: 14.5 }}>
                  <input type="checkbox" checked={!!addrForm.isDefault} onChange={(e) => setAddrForm((f: any) => ({ ...f, isDefault: e.target.checked }))} style={{ width: 16, height: 16, accentColor: T.ink }} />
                  Make this my default address
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 24 }}>
                  <button type="button" className="ac-btn" onClick={saveAddress} disabled={addrSaving}>{addrSaving ? "Saving…" : "Save address"}</button>
                  <button type="button" className="ac-link" data-canceladdr onClick={() => setAddrForm(null)}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ marginTop: 48, paddingTop: 26, borderTop: `1px solid ${T.line}` }}>
              <div className="ac-eyebrow">Payment methods</div>
              <p className="ac-muted" style={{ margin: "14px 0 0", fontSize: 14.5, lineHeight: 1.75, maxWidth: "54ch" }}>Cards are never stored on our servers. Each payment is taken securely through Stripe at checkout, so there is nothing to manage here.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const figures = [
    { n: loadingOrders ? "" : String(orderCount), l: orderCount === 1 ? "Order" : "Orders" },
    { n: String(favoritesCount), l: "Saved" },
    { n: clientSince, l: "Client since" },
  ];
  const counts: Record<string, number | string> = { orders: loadingOrders ? "" : orderCount, saved: favoritesCount, appointments: appointments.length || "", pieces: pieces.length || "", details: "", addresses: addresses.length || "" };

  const jeweller = (
    <div className="ac-card">
      <div className="ac-eyebrow">Your jeweller</div>
      <div style={{ fontSize: 15, marginTop: 12 }}>The McCulloch workshop</div>
      <p>Beeston, Nottingham. Five generations at the bench. Write to us any time.</p>
      <Link to="/contact" className="ac-link">Write to us</Link>
    </div>
  );
  const signOut = <button type="button" className="ac-link" onClick={() => logout()} style={{ marginTop: 24 }}>Sign out</button>;

  return (
    <div className="ac">
      <style>{ACCOUNT_CSS}</style>
      <NavigationV2 solid />

      <section className="ac-wrap ac-open">
        <div className="ac-eyebrow">Your account</div>
        <h1 className="ac-h1">{greeting}</h1>
        <div className="ac-facts">
          {figures.map((f) => <div key={f.l} className="ac-fact"><b>{f.n}</b><span>{f.l}</span></div>)}
        </div>
        {liveOrder && (
          <div className="ac-live">
            <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px 18px" }}>
              <span className="ac-tag is-live"><i />{statusLabel(liveOrder.status)}</span>
              <b>{tidy(liveOrder.items[0]?.name) || `Order ${liveOrder.orderNumber}`}</b>
            </span>
            <Link to={`/orders/${liveOrder.id}`} className="ac-link">Track this order</Link>
          </div>
        )}
      </section>

      <main className="ac-wrap ac-main">
        <aside className="ac-rail">
          <div className="ac-tabs" role="tablist" aria-label="Account sections">
            {TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={pane === t.id} className="ac-tab" data-tab={t.id} onClick={() => setPane(t.id)}>
                <span>{t.label}</span><small>{counts[t.id]}</small>
              </button>
            ))}
          </div>
          <div className="ac-rail-extra">{jeweller}{signOut}</div>
        </aside>

        <div key={pane} className="ac-pane" role="tabpanel" data-pane={pane}>
          {renderPane(pane)}
        </div>
      </main>

      {/* Phone and tablet: the jeweller card and sign-out sit under the section instead of beside it */}
      <div className="ac-wrap ac-foot-extra">{jeweller}{signOut}</div>

      <FooterV2 />
    </div>
  );
};

export default AccountV2;
