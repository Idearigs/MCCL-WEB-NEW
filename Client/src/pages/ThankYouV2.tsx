import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Check } from "lucide-react";
import { trackPurchase } from "../services/pixelService";
import { getMediaUrl } from "../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * Thank You — v2 redesign (design_handoff_mcculloch_bespoke_story_thankyou).
 * Typographic confirmation (no tick badge), a made-to-order timeline, an EFEADF
 * order summary and an ink contact band. Consumes the state passed by
 * CheckoutV2's handleSuccess. Original preserved at pages/ThankYou.original.tsx.
 */

interface OrderItemData {
  product_name: string;
  product_type?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image?: string | null;
  attributes?: { metal?: string; size?: string; brand?: string; variant_name?: string; [k: string]: any };
}
interface OrderState {
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  customerEmail?: string;
  customerName?: string;
  status?: string;
  items?: OrderItemData[];
  shippingAddress?: { line1?: string; line2?: string; city?: string; postcode?: string; country?: string; phone?: string };
  deliveryName?: string;
  deliveryCost?: number;
  paymentMethod?: string;
}

const money = (n: number): string => `£${Math.round(n).toLocaleString("en-GB")}`;

const TIMELINE = [
  { title: "Confirmation by email", note: "Your receipt and order reference are on their way.", when: "Now", done: true },
  { title: "Onto the bench", note: "We write with the name of the jeweller making your piece.", when: "Within 3 days", done: false },
  { title: "Hallmarking and final check", note: "Assayed, hallmarked and inspected before it leaves us.", when: "Week 5", done: false },
  { title: "Insured delivery", note: "Fully insured and signed for, or ready to collect.", when: "Week 6", done: false },
];

const INCLUDED = ["Certification & documentation", "First-year insurance", "Free resizing", "Lifetime servicing"];

const configSummary = (it: OrderItemData): string => {
  const a = it.attributes || {};
  if (it.product_type === "watch") return [a.brand, a.variant_name].filter(Boolean).join(" · ");
  return [a.metal, a.size && `Size ${a.size}`].filter(Boolean).join(" · ");
};
const leadTime = (it: OrderItemData): string => (it.product_type === "watch" ? "In stock, ships in 48 hours" : "Made to order, 4–6 weeks");

const ThankYouV2 = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = (location.state as OrderState) || {};
  const purchaseFired = useRef(false);

  // Pixel: backup Purchase tracking (unchanged behaviour from original)
  useEffect(() => {
    if (order.orderId && order.items && !purchaseFired.current) {
      trackPurchase({
        content_ids: order.items.map((_, i) => `item_${i}`),
        content_type: "product",
        value: order.totalAmount || 0,
        currency: "GBP",
        num_items: order.items.reduce((c, it) => c + it.quantity, 0),
        contents: order.items.map((it, i) => ({ id: `item_${i}`, quantity: it.quantity, item_price: it.unit_price })),
      });
      purchaseFired.current = true;
    }
  }, [order]);

  // No order → send home after a grace period (as in the original)
  useEffect(() => {
    const timer = setTimeout(() => { if (!order.orderId) navigate("/"); }, 10000);
    return () => clearTimeout(timer);
  }, [order, navigate]);

  const items = order.items || [];
  const subtotal = items.reduce((t, it) => t + it.total_price, 0);
  const total = order.totalAmount ?? subtotal;
  const deliveryCost = order.deliveryCost ?? Math.max(0, total - subtotal);
  const vat = Math.round(total - total / 1.2);
  const addr = order.shippingAddress || {};

  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };
  const pageX = "clamp(24px, 4vw, 64px)";

  return (
    <div style={{ minHeight: "100vh", background: T.paper, fontFamily: FONT_BODY, color: T.body }}>
      <style>{`
        @keyframes tyRise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
        @keyframes tyRule { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .ty-rise { animation: tyRise 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .ty-rule { transform-origin: center; animation: tyRule 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s both; }
        .ty-cta:hover { background: ${T.inkDeep} !important; }
        .ty-outline:hover { background: ${T.tint} !important; }
        .ty-mobile { display: none; }
        @media (prefers-reduced-motion: reduce) { .ty-rise, .ty-rule { animation: none !important; } }
        @media (max-width: 900px) {
          .ty-main { grid-template-columns: 1fr !important; }
          .ty-summary { order: -1; }
          .ty-2up { grid-template-columns: 1fr !important; }
          .ty-contact { grid-template-columns: 1fr !important; }
          .ty-tl-when { display: none !important; }
          .ty-mobile { display: block; }
        }
      `}</style>

      {/* Stripped header — matches checkout */}
      <header style={{ borderBottom: `1px solid ${T.rule}`, background: T.paper }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "18px clamp(20px, 4vw, 48px)" }}>
          <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, justifySelf: "start" }}>Order confirmed</span>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: "0.04em", color: T.ink }}>McCulloch</div>
          <span />
        </div>
      </header>

      {/* 1 — Confirmation block */}
      <section style={{ padding: `clamp(48px, 7vw, 96px) ${pageX} clamp(36px, 4vw, 56px)`, textAlign: "center" }}>
        <div className="ty-rise" style={{ maxWidth: 760, margin: "0 auto" }}>
          {order.orderNumber && <div style={{ ...eyebrow, marginBottom: 20 }}>Order {order.orderNumber}</div>}
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(44px, 5.4vw, 86px)", lineHeight: 1.02, color: T.ink, fontWeight: 400, maxWidth: "15ch", margin: "0 auto" }}>
            Thank you{order.customerName ? `, ${order.customerName.split(" ")[0]}` : ""}.
          </h1>
          <div className="ty-rule" style={{ width: 64, height: 1, background: T.ruleStrong, margin: "28px auto" }} />
          <p style={{ fontSize: 15.5, color: T.body, lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            Your order is confirmed. A receipt is on its way to <strong style={{ color: T.ink, fontWeight: 500 }}>{order.customerEmail || "your email"}</strong>, and we’ll be in touch as your piece moves through the workshop.
          </p>
        </div>
      </section>

      {/* Main: timeline + summary */}
      <section style={{ padding: `0 ${pageX} clamp(56px, 7vw, 104px)`, maxWidth: 1240, margin: "0 auto" }}>
        <div className="ty-main" style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: "clamp(36px, 5vw, 80px)", alignItems: "start" }}>
          {/* Left — What happens next */}
          <div>
            <div style={{ ...eyebrow, marginBottom: 22 }}>What happens next</div>
            <div>
              {TIMELINE.map((s, i) => {
                const roman = ["I", "II", "III", "IV"][i];
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 14, alignItems: "baseline", padding: "18px 0", borderTop: i === 0 ? "none" : `1px solid ${T.rule}` }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: s.done ? T.gold : "#C4BCB0" }}>{roman}</span>
                    <div>
                      <div style={{ fontSize: 15, color: s.done ? T.ink : T.body }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: T.muted, marginTop: 4, lineHeight: 1.55 }}>{s.note}</div>
                      {/* Mobile: timing on the note line */}
                      <div className="ty-mobile" style={{ fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", color: s.done ? T.gold : "#8A8377", marginTop: 6 }}>{s.when}</div>
                    </div>
                    <span className="ty-tl-when" style={{ fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase", color: s.done ? T.gold : "#8A8377", whiteSpace: "nowrap" }}>{s.when}</span>
                  </div>
                );
              })}
            </div>

            {/* Delivery address + payment 2-up */}
            <div className="ty-2up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 36, paddingTop: 28, borderTop: `1px solid ${T.rule}` }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Delivery to</div>
                <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.65 }}>
                  {order.customerName && <div>{order.customerName}</div>}
                  {addr.line1 && <div>{addr.line1}</div>}
                  {addr.line2 && <div>{addr.line2}</div>}
                  {(addr.city || addr.postcode) && <div>{[addr.city, addr.postcode].filter(Boolean).join(", ")}</div>}
                  {addr.country && <div>{addr.country}</div>}
                  {addr.phone && <div style={{ color: T.muted, marginTop: 4 }}>{addr.phone}</div>}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: 10 }}>Payment</div>
                <div style={{ fontSize: 14, color: T.ink, lineHeight: 1.65 }}>
                  <div>{order.paymentMethod || "Card"}</div>
                  <div style={{ color: T.muted, marginTop: 4 }}>{money(total)} paid</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
              <Link to="/orders" className="ty-cta" style={{ padding: "15px 30px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s" }}>
                Track this order
              </Link>
              <Link to="/engagement-rings" className="ty-outline" style={{ padding: "15px 30px", background: "transparent", color: T.ink, border: `1px solid ${T.ruleStrong}`, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s" }}>
                Continue shopping
              </Link>
            </div>
          </div>

          {/* Right — Order summary */}
          <aside className="ty-summary">
            <div style={{ background: T.tint, padding: "26px 24px" }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.ink, marginBottom: 18 }}>Your order</div>
              {items.map((it, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 14, alignItems: "start", padding: "14px 0", borderTop: i === 0 ? "none" : `1px solid ${T.ruleSoft}` }}>
                  <div style={{ position: "relative", width: 72, aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden" }}>
                    {it.image
                      ? <img src={getMediaUrl(it.image)} alt={it.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontSize: 12, color: T.muted, textAlign: "center", padding: 4 }}>{it.product_name}</div>}
                    {it.quantity > 1 && <span style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%", background: T.ink, color: T.paper, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{it.quantity}</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: T.ink, lineHeight: 1.2 }}>{it.product_name}</div>
                    {configSummary(it) && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 3 }}>{configSummary(it)}</div>}
                    <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>{leadTime(it)}</div>
                  </div>
                  <div style={{ fontSize: 13.5, color: T.ink, whiteSpace: "nowrap" }}>{money(it.total_price)}</div>
                </div>
              ))}

              <div style={{ borderTop: `1px solid ${T.ruleSoft}`, marginTop: 8, paddingTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.body, marginBottom: 10 }}><span>Subtotal</span><span style={{ color: T.ink }}>{money(subtotal)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.body, marginBottom: 10 }}><span>{order.deliveryName || "Delivery"}</span><span style={{ color: deliveryCost === 0 ? T.gold : T.ink }}>{deliveryCost === 0 ? "Free" : money(deliveryCost)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.body }}><span>VAT (incl.)</span><span style={{ color: T.ink }}>{money(vat)}</span></div>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 16, marginTop: 12, borderTop: `1px solid ${T.ruleStrong}` }}>
                <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink }}>Paid</span>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: T.ink, lineHeight: 1 }}>{money(total)}</span>
              </div>
            </div>

            {/* Included with every piece */}
            <div style={{ border: `1px solid ${T.rule}`, padding: "22px 24px", marginTop: 18 }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink, marginBottom: 14 }}>Included with every piece</div>
              {INCLUDED.map((x, i) => (
                <div key={x} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderTop: i === 0 ? "none" : `1px dashed ${T.ruleSoft}`, fontSize: 13, color: T.body }}>
                  <Check size={13} strokeWidth={2} style={{ color: T.gold, flexShrink: 0 }} /> {x}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Contact band */}
      <section style={{ background: T.ink, color: T.onDarkSoft }}>
        <div className="ty-contact" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "clamp(28px, 4vw, 72px)", alignItems: "center", maxWidth: 1240, margin: "0 auto", padding: `clamp(44px, 5vw, 72px) ${pageX}` }}>
          <div>
            <div style={{ ...eyebrow }}>Here to help</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 3vw, 42px)", color: "#F4EFE6", fontWeight: 400, marginTop: 14, lineHeight: 1.1 }}>
              The bench is a telephone call away.
            </h2>
          </div>
          <div>
            {[
              { label: "Telephone", value: "0115 925 7552", note: "Mon – Sat, 9 – 5:30", href: "tel:01159257552" },
              { label: "Email about this order", value: "has@mccullochjewellers.co.uk", note: order.orderNumber ? `Quote ${order.orderNumber}` : "We reply within one working day", href: "mailto:has@mccullochjewellers.co.uk" },
              { label: "Visit the showroom", value: "7 The Square, Beeston", note: "Nottingham NG9 2JG", href: "/visit-us" },
            ].map((r, i) => (
              <a key={r.label} href={r.href} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "baseline", padding: "16px 0", borderTop: `1px solid ${T.ruleDark}`, textDecoration: "none" }}>
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.gold, marginBottom: 5 }}>{r.label}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: "#F4EFE6" }}>{r.value}</div>
                </div>
                <div style={{ fontSize: 12, color: T.onDarkMuted, whiteSpace: "nowrap" }}>{r.note}</div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThankYouV2;
