import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { trackPurchase } from "../services/pixelService";
import { getMediaUrl } from "../config/api";
import { T, FONT_DISPLAY, FONT_LOGO, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND } from "../components/home-v2/listingShared";

/**
 * Thank You, light redesign (Nov 2026). A centred confirmation, "what happens next" drawn as a
 * line with a gold mark at the step already done, the order on the page's one sand panel, and
 * the three ways to reach the shop on a light row (the black band is gone).
 * Consumes the state passed by CheckoutV2's handleSuccess; tracking and the redirect when
 * there is no order are unchanged. Original preserved at pages/ThankYou.original.tsx.
 *
 * One change in what is said: the steps follow what was bought. An order of in-stock pieces
 * only (watches) no longer promises a jeweller at the bench and "week 5 / week 6"; it shows
 * the 48-hour dispatch the bag already quoted.
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
// Display only: "Clubmaster Classic - Chrono - Black" reads "Clubmaster Classic, Chrono, Black".
const tidy = (n: string): string => (n || "").replace(/\s+-\s+/g, ", ");

const MADE_TO_ORDER = [
  { title: "Confirmation by email", note: "Your receipt and order reference are on their way.", when: "Now", done: true },
  { title: "Onto the bench", note: "We write with the name of the jeweller making your piece.", when: "Within 3 days", done: false },
  { title: "Hallmarking and final check", note: "Assayed, hallmarked and inspected before it leaves us.", when: "Week 5", done: false },
  { title: "Insured delivery", note: "Fully insured and signed for, or ready to collect.", when: "Week 6", done: false },
];
const IN_STOCK = [
  { title: "Confirmation by email", note: "Your receipt and order reference are on their way.", when: "Now", done: true },
  { title: "Checked and packed", note: "Inspected at our Beeston showroom before it leaves us.", when: "Within 48 hours", done: false },
  { title: "Insured delivery", note: "Fully insured and signed for, or ready to collect.", when: "After dispatch", done: false },
];

const INCLUDED = ["Certification & documentation", "First-year insurance", "Lifetime servicing"];

const configSummary = (it: OrderItemData): string => {
  const a = it.attributes || {};
  if (it.product_type === "watch") return [a.brand, a.variant_name].filter(Boolean).join(" · ");
  return [a.metal, a.size && `Size ${a.size}`].filter(Boolean).join(" · ");
};
const isStock = (it: OrderItemData): boolean => it.product_type === "watch";
const leadTime = (it: OrderItemData): string => (isStock(it) ? "In stock, ships in 48 hours" : "Made to order, up to 6 weeks");

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

  const timeline = items.length > 0 && items.every(isStock) ? IN_STOCK : MADE_TO_ORDER;
  const eyebrow: React.CSSProperties = { fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text };
  const pageX = "clamp(20px, 4vw, 64px)";
  const tick = <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true" style={{ flex: "none" }}><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.3" /></svg>;

  return (
    <div className="ty" style={{ minHeight: "100vh", background: GROUND, fontFamily: FONT_BODY, color: T.text }}>
      <style>{`
        .ty a { color: inherit; text-decoration: none; }
        @keyframes tyRise { from { opacity: 0; transform: translateY(18px) } }
        @keyframes tyRule { from { transform: scaleX(0) } }
        @keyframes tyGrow { from { transform: scaleY(0) } }
        .ty-rise { animation: tyRise 1s cubic-bezier(0.22,1,0.36,1) backwards; }
        .ty-rise.d1 { animation-delay: 0.15s; } .ty-rise.d2 { animation-delay: 0.3s; }
        .ty-rule { width: 64px; height: 1px; background: ${T.gold}; margin: 28px auto; transform-origin: center; animation: tyRule 0.9s cubic-bezier(0.22,1,0.36,1) 0.35s backwards; }

        .ty-top { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 20px ${pageX}; background: ${T.cream}; border-bottom: 1px solid ${T.line}; }
        .ty-word { font-family: ${FONT_LOGO}; font-size: 25px; letter-spacing: 0.16em; line-height: 1; color: ${T.text}; }
        .ty-wrap { max-width: 1200px; margin: 0 auto; padding: 0 ${pageX}; }
        .ty-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(42px, 5.4vw, 80px); line-height: 1.04; margin: 16px auto 0; max-width: 15ch; color: ${T.text}; text-wrap: balance; }
        .ty-h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(24px, 2.3vw, 30px); line-height: 1.2; margin: 0; color: ${T.text}; }
        .ty-btn { display: inline-block; padding: 17px 32px; background: ${T.ink}; color: ${T.cream} !important; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
        .ty-btn:hover { background: ${T.text}; }
        .ty-link { display: inline-block; border-bottom: 1px solid ${T.ruleStrong}; padding: 0 0 4px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
        .ty-link:hover { border-bottom-color: ${T.gold}; }

        .ty-main { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.8fr); gap: clamp(36px, 6vw, 96px); align-items: start; padding-bottom: clamp(60px, 7vw, 104px); }

        /* what happens next: a line with a mark at each step */
        .ty-steps { list-style: none; margin: 26px 0 0; padding: 0; position: relative; }
        .ty-steps::before { content: ""; position: absolute; left: 6px; top: 8px; bottom: 30px; width: 1px; background: ${T.line}; transform-origin: top; animation: tyGrow 1.4s cubic-bezier(0.22,1,0.36,1) 0.5s backwards; }
        .ty-steps li { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 24px; align-items: baseline; padding: 0 0 26px 38px; }
        .ty-steps li:last-child { padding-bottom: 0; }
        .ty-steps li::before { content: ""; position: absolute; left: 0; top: 5px; width: 13px; height: 13px; border-radius: 50%; background: ${GROUND}; border: 1px solid ${T.ruleStrong}; }
        .ty-steps li.is-done::before { background: ${T.gold}; border-color: ${T.gold}; }
        .ty-steps b { font-weight: 400; font-size: 16px; color: ${T.text}; }
        .ty-steps p { grid-column: 1; margin: 0; font-size: 14px; line-height: 1.65; color: ${T.textMuted}; }
        .ty-when { grid-column: 2; grid-row: 1; font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.text}; white-space: nowrap; }

        .ty-2up { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 40px; padding-top: 30px; border-top: 1px solid ${T.line}; }
        .ty-2up > div > div:last-child { margin-top: 12px; font-size: 15px; line-height: 1.7; color: ${T.text}; }
        .ty-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 16px 30px; margin-top: 36px; }

        /* the order: the page's one sand panel. Only full-strength text sits on sand. */
        .ty-order { background: ${T.sand}; padding: clamp(24px, 2.4vw, 32px); }
        .ty-line { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid ${T.ruleStrong}; }
        .ty-thumb { position: relative; width: 72px; aspect-ratio: 1 / 1.1; background: ${GROUND}; overflow: hidden; }
        .ty-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 8%; mix-blend-mode: multiply; }
        .ty-pnote { margin-top: 3px; font-size: 13px; color: ${T.text}; opacity: 0.82; }
        .ty-row { display: flex; justify-content: space-between; gap: 16px; font-size: 14.5px; color: ${T.text}; margin-top: 12px; }
        .ty-total { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-top: 18px; margin-top: 18px; border-top: 1px solid ${T.ruleStrong}; }
        .ty-total span:first-child { font-size: 11.5px; letter-spacing: 0.18em; text-transform: uppercase; }
        .ty-total span:last-child { font-family: ${FONT_DISPLAY}; font-size: 32px; line-height: 1; }
        .ty-incl { list-style: none; margin: 14px 0 0; padding: 0; display: grid; gap: 11px; }
        .ty-incl li { display: flex; align-items: center; gap: 12px; font-size: 14px; color: ${T.text}; }

        /* here to help */
        .ty-help { border-top: 1px solid ${T.line}; padding: clamp(52px, 6vw, 88px) 0 clamp(60px, 7vw, 104px); text-align: center; }
        .ty-ways { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: clamp(30px, 3.4vw, 48px); border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .ty-way { display: block; padding: clamp(24px, 2.6vw, 36px) 16px; border-left: 1px solid ${T.line}; }
        .ty-way:first-child { border-left: 0; }
        .ty-way span { display: block; }
        .ty-way .v { margin-top: 12px; font-family: ${FONT_DISPLAY}; font-size: clamp(18px, 1.7vw, 22px); color: ${T.text}; overflow-wrap: anywhere; transition: color 0.2s ease; }
        .ty-way .n { margin-top: 8px; font-size: 13.5px; color: ${T.textMuted}; }

        @media (prefers-reduced-motion: reduce) { .ty-rise, .ty-rule, .ty-steps::before { animation: none !important; } }
        @media (max-width: 900px) {
          .ty-main { grid-template-columns: 1fr; }
          .ty-summary { order: -1; }
          .ty-ways { grid-template-columns: 1fr; }
          .ty-way { border-left: 0; border-top: 1px solid ${T.line}; }
          .ty-way:first-child { border-top: 0; }
        }
        @media (max-width: 560px) {
          .ty-top { grid-template-columns: 1fr; justify-items: center; gap: 8px; padding: 16px ${pageX}; }
          .ty-top > span:last-child { display: none; }
          .ty-top > span:first-child { justify-self: center !important; }
          .ty-word { font-size: 21px; order: -1; }
          .ty-2up { grid-template-columns: 1fr; }
          .ty-steps li { grid-template-columns: 1fr; }
          .ty-when { grid-column: 1; grid-row: auto; }
          .ty-actions .ty-btn { width: 100%; }
          .ty-order { margin: 0 calc(-1 * ${pageX}); padding: 24px ${pageX}; }
        }
      `}</style>

      {/* Stripped header, as on the checkout */}
      <header className="ty-top">
        <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, justifySelf: "start" }}>Order confirmed</span>
        <Link to="/" className="ty-word" aria-label="McCulloch, home">McCulloch</Link>
        <span />
      </header>

      {/* Confirmation */}
      <section style={{ padding: `clamp(48px, 7vw, 100px) ${pageX} clamp(44px, 5vw, 72px)`, textAlign: "center" }}>
        {order.orderNumber && <div className="ty-rise" style={eyebrow}>Order {order.orderNumber}</div>}
        <h1 className="ty-h1 ty-rise d1">Thank you{order.customerName ? `, ${order.customerName.split(" ")[0]}` : ""}.</h1>
        <div className="ty-rule" />
        <p className="ty-rise d2" style={{ fontSize: 16, lineHeight: 1.8, color: T.text, maxWidth: "50ch", margin: "0 auto" }}>
          Your order is confirmed. A receipt is on its way to <strong style={{ fontWeight: 500 }}>{order.customerEmail || "your email"}</strong>, and we’ll be in touch as your {items.length > 1 ? "order" : "piece"} moves through the workshop.
        </p>
      </section>

      {/* What happens next + the order */}
      <section className="ty-wrap">
        <div className="ty-main">
          <div>
            <h2 className="ty-h2">What happens next</h2>
            <ol className="ty-steps">
              {timeline.map((s) => (
                <li key={s.title} className={s.done ? "is-done" : ""}>
                  <b>{s.title}</b>
                  <span className="ty-when">{s.when}</span>
                  <p>{s.note}</p>
                </li>
              ))}
            </ol>

            <div className="ty-2up">
              <div>
                <div style={eyebrow}>Delivery to</div>
                <div>
                  {order.customerName && <div>{order.customerName}</div>}
                  {addr.line1 && <div>{addr.line1}</div>}
                  {addr.line2 && <div>{addr.line2}</div>}
                  {(addr.city || addr.postcode) && <div>{[addr.city, addr.postcode].filter(Boolean).join(", ")}</div>}
                  {addr.country && <div>{addr.country}</div>}
                  {addr.phone && <div style={{ color: T.textMuted, marginTop: 4 }}>{addr.phone}</div>}
                </div>
              </div>
              <div>
                <div style={eyebrow}>Payment</div>
                <div>
                  <div>{order.paymentMethod || "Card"}</div>
                  <div style={{ color: T.textMuted, marginTop: 4 }}>{money(total)} paid</div>
                </div>
              </div>
            </div>

            <div className="ty-actions">
              <Link to="/orders" className="ty-btn">Track this order</Link>
              <Link to="/engagement-rings" className="ty-link">Continue shopping</Link>
            </div>
          </div>

          <aside className="ty-summary">
            <div className="ty-order">
              <h2 className="ty-h2" style={{ fontSize: 24 }}>Your order</h2>
              {items.map((it, i) => (
                <div key={i} className="ty-line">
                  <div className="ty-thumb">
                    {it.image && <img src={getMediaUrl(it.image)} alt={it.product_name} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, lineHeight: 1.4, color: T.text }}>{tidy(it.product_name)}</div>
                    {configSummary(it) && <div className="ty-pnote">{configSummary(it)}</div>}
                    {it.quantity > 1 && <div className="ty-pnote">Quantity {it.quantity}</div>}
                    <div className="ty-pnote">{leadTime(it)}</div>
                  </div>
                  <div style={{ fontSize: 14.5, color: T.text, whiteSpace: "nowrap" }}>{money(it.total_price)}</div>
                </div>
              ))}

              <div style={{ marginTop: 18 }}>
                <div className="ty-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                <div className="ty-row"><span>{order.deliveryName || "Delivery"}</span><span>{deliveryCost === 0 ? "Free" : money(deliveryCost)}</span></div>
                <div className="ty-row"><span>VAT (included)</span><span>{money(vat)}</span></div>
              </div>
              <div className="ty-total"><span>Paid</span><span>{money(total)}</span></div>
            </div>

            <div style={{ padding: "26px clamp(24px, 2.4vw, 32px) 0" }}>
              <div style={eyebrow}>Included with every piece</div>
              <ul className="ty-incl">
                {INCLUDED.map((x) => <li key={x}>{tick}{x}</li>)}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* Here to help */}
      <section className="ty-wrap">
        <div className="ty-help">
          <div style={eyebrow}>Here to help</div>
          <h2 className="ty-h2" style={{ marginTop: 16, fontSize: "clamp(26px, 2.6vw, 38px)" }}>The bench is a telephone call away.</h2>
          <div className="ty-ways">
            {[
              { label: "Telephone", value: "0115 925 7552", note: "Mon to Sat, 9 to 5:30", href: "tel:01159257552" },
              { label: "Email about this order", value: "has@mccullochjewellers.co.uk", note: order.orderNumber ? `Quote ${order.orderNumber}` : "We reply within one working day", href: "mailto:has@mccullochjewellers.co.uk" },
              { label: "Visit the showroom", value: "7 The Square, Beeston", note: "Nottingham NG9 2JG", href: "/visit-us" },
            ].map((r) => (
              <a key={r.label} href={r.href} className="ty-way">
                <span style={eyebrow}>{r.label}</span>
                <span className="v">{r.value}</span>
                <span className="n">{r.note}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThankYouV2;
