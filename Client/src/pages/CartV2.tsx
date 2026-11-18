import React from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND, TILE } from "../components/home-v2/listingShared";
import { useCart, CartItem } from "../contexts/CartContext";
import { getMediaUrl } from "../config/api";
import PaymentBadges from "../components/PaymentBadges";

/**
 * Bag page, light redesign (Nov 2026) in the same family as the listing pages: a centred
 * title, each piece on the listing's pale tile with its options on one quiet line, and a
 * summary panel that stays in view on a laptop. On a phone the total and the checkout button
 * ride along the bottom of the screen.
 *
 * Behaviour is unchanged (same cart context, same totals). One fix: each line now links back
 * to the page it was added from (productUrl), where the old page sent every piece, watches
 * included, to /rings/:slug.
 * The bag drawer lives in components/CartSlide.tsx. Original at pages/Cart.original.tsx.
 */

const pageX = "clamp(20px, 4vw, 64px)";

const parsePrice = (price: string | number): number => {
  if (typeof price === "number") return price;
  return parseFloat(String(price).replace(/[£,\s]/g, "")) || 0;
};
const money = (n: number): string => `£${Math.round(n).toLocaleString("en-GB")}`;
// Display only: "Clubmaster Classic - Chrono - Black" reads "Clubmaster Classic, Chrono, Black".
const tidy = (n: string): string => (n || "").replace(/\s+-\s+/g, ", ");

const specPairs = (item: CartItem): [string, string][] => {
  const pairs: [string, string][] = [];
  const o = item.selectedOptions || {};
  if (item.type === "watch") {
    if (item.brand) pairs.push(["Brand", item.brand]);
    if (item.variant_name) pairs.push(["Collection", item.variant_name]);
  } else {
    if (item.metal) pairs.push(["Metal", item.metal]);
    if (item.size) pairs.push(["Ring size", String(item.size)]);
    if ((item as any).diamondSize || o.diamondSize) pairs.push(["Diamond", String((item as any).diamondSize || o.diamondSize)]);
    if (o.stoneType) pairs.push(["Stone", String(o.stoneType)]);
    if (o.carat) pairs.push(["Carat", String(o.carat)]);
    if (o.clarity) pairs.push(["Clarity", String(o.clarity)]);
    if (o.colour) pairs.push(["Colour", String(o.colour)]);
    if (o.cut) pairs.push(["Cut", String(o.cut)]);
  }
  return pairs;
};

const inStock = (item: CartItem): boolean => item.type === "watch" || !!item.liveStock;
const leadTime = (item: CartItem): string => (inStock(item) ? "In stock, ships in 48 hours" : "Made to order, up to 6 weeks");

// Same rule as the checkout summary: the exact page the piece was added from, else by type.
const productHref = (item: CartItem): string => {
  if (item.productUrl) return item.productUrl;
  if (item.type === "watch" && item.slug) return `/watches/${item.slug}`;
  if (item.slug) return `/product/${item.slug}`;
  return "#";
};

const ASSURANCES = [
  "Complimentary insured delivery",
  "30-day returns on ready-to-ship",
  "Lifetime aftercare & servicing",
  "Secure encrypted checkout",
];

const Tick = () => (
  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true" style={{ flex: "none" }}><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.3" /></svg>
);

const CartV2 = (): JSX.Element => {
  const { cartItems, updateQuantity, removeItem } = useCart();

  const subtotal = cartItems.reduce((t, i) => t + parsePrice(i.price) * i.quantity, 0);
  const delivery = 0; // free & insured
  const total = subtotal + delivery;
  const vat = Math.round(total - total / 1.2);
  const pieces = cartItems.reduce((t, i) => t + i.quantity, 0);

  return (
    <div className="bag" style={{ background: GROUND, minHeight: "100vh", fontFamily: FONT_BODY, color: T.text, paddingTop: "var(--v2nav-h, 113px)" }}>
      <style>{`
        .bag a { color: inherit; text-decoration: none; }
        .bag-wrap { max-width: 1240px; margin: 0 auto; padding: 0 ${pageX}; }
        .bag-head { text-align: center; padding: clamp(36px, 4.6vw, 68px) 0 clamp(30px, 3.6vw, 52px); }
        .bag-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(36px, 4.4vw, 60px); line-height: 1.05; margin: 0; color: ${T.text}; }
        .bag-count { margin-top: 14px; font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }

        .bag-grid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(330px, 0.72fr); gap: clamp(32px, 5vw, 84px); align-items: start; padding-bottom: clamp(64px, 7vw, 112px); }
        .bag-line { display: grid; grid-template-columns: 148px minmax(0, 1fr) auto; gap: clamp(16px, 2.2vw, 30px); padding: 26px 0; border-top: 1px solid ${T.line}; }
        .bag-line:last-of-type { border-bottom: 1px solid ${T.line}; }
        .bag-thumb { position: relative; display: block; aspect-ratio: 1 / 1.1; background: ${TILE}; overflow: hidden; }
        .bag-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 9%; mix-blend-mode: multiply; transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .bag-thumb:hover img { transform: scale(1.04); }
        .bag-name { display: block; font-family: ${FONT_DISPLAY}; font-size: clamp(19px, 1.7vw, 23px); line-height: 1.25; color: ${T.text}; }
        .bag-spec { margin-top: 9px; font-size: 13.5px; line-height: 1.65; color: ${T.textMuted}; }
        .bag-spec b { font-weight: 400; color: ${T.text}; text-transform: capitalize; }
        .bag-lead { display: flex; align-items: center; gap: 9px; margin-top: 10px; font-size: 13px; color: ${T.text}; }
        .bag-lead i { width: 6px; height: 6px; border-radius: 50%; background: ${T.gold}; flex: none; }
        .bag-lead i.is-made { background: transparent; border: 1px solid ${T.gold}; }
        .bag-ctrl { display: flex; align-items: center; flex-wrap: wrap; gap: 12px 22px; margin-top: 20px; }
        .bag-qty { display: inline-flex; align-items: center; border: 1px solid ${T.line}; }
        .bag-qty button { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: 0; cursor: pointer; color: ${T.text}; transition: background 0.2s ease; }
        .bag-qty button:hover { background: ${TILE}; }
        .bag-qty span { min-width: 30px; text-align: center; font-size: 14px; color: ${T.text}; }
        .bag-link { cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; padding: 0 0 3px; font-family: ${FONT_BODY}; font-size: 11.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
        .bag-link:hover { border-bottom-color: ${T.gold}; }
        .bag-price { font-size: 16px; color: ${T.text}; white-space: nowrap; text-align: right; }
        .bag-price small { display: block; margin-top: 5px; font-size: 12.5px; color: ${T.textMuted}; }

        .bag-sum { position: sticky; top: calc(var(--v2nav-h, 113px) + 24px); }
        .bag-panel { border: 1px solid ${T.line}; padding: clamp(24px, 2.4vw, 34px); }
        .bag-panel h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 24px; margin: 0 0 22px; color: ${T.text}; }
        .bag-row { display: flex; justify-content: space-between; gap: 16px; font-size: 14.5px; color: ${T.text}; margin-bottom: 12px; }
        .bag-total { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-top: 18px; margin-top: 18px; border-top: 1px solid ${T.line}; }
        .bag-total span:first-child { font-size: 11.5px; letter-spacing: 0.18em; text-transform: uppercase; }
        .bag-total span:last-child { font-family: ${FONT_DISPLAY}; font-size: 32px; line-height: 1; }
        .bag-note { margin-top: 8px; font-size: 12.5px; color: ${T.textMuted}; text-align: right; }
        .bag-btn { display: block; text-align: center; padding: 17px 24px; background: ${T.ink}; color: ${T.cream} !important; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; transition: background 0.3s ease; }
        .bag-btn:hover { background: ${T.text}; }
        .bag-assure { list-style: none; margin: 24px 0 0; padding: 20px 0 0; border-top: 1px solid ${T.line}; display: grid; gap: 11px; }
        .bag-assure li { display: flex; align-items: center; gap: 12px; font-size: 13.5px; color: ${T.text}; }
        .bag-help { margin-top: 26px; padding: 0 clamp(24px, 2.4vw, 34px); }
        .bag-help p { margin: 10px 0 12px; font-size: 14px; line-height: 1.7; color: ${T.text}; }
        .bag-tel { font-family: ${FONT_DISPLAY}; font-size: 22px; color: ${T.text}; }

        .bag-empty { text-align: center; padding: clamp(16px, 5vw, 60px) 0 clamp(80px, 12vw, 160px); }
        .bag-empty p { max-width: 44ch; margin: 0 auto 30px; font-size: 15.5px; line-height: 1.8; color: ${T.text}; }
        .bag-empty-actions { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 16px 30px; }

        .bag-bar { display: none; }
        @media (max-width: 960px) {
          .bag-grid { grid-template-columns: 1fr; }
          .bag-sum { position: static; }
        }
        @media (max-width: 640px) {
          .bag-line { grid-template-columns: 104px minmax(0, 1fr); gap: 16px; padding: 22px 0; }
          .bag-price { grid-column: 2; text-align: left; margin-top: -4px; }
          .bag-price small { display: inline; margin-left: 8px; }
          .bag-body { display: contents; }
          .bag-main { grid-column: 2; grid-row: 1; }
          .bag-price { grid-row: 2; }
          .bag-ctrl { grid-column: 1 / -1; grid-row: 3; margin-top: 4px; justify-content: space-between; }
          .bag-thumb { grid-row: 1 / 3; align-self: start; }
          .bag-page { padding-bottom: 84px; }
          .bag-bar { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 14px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 55; background: rgba(255,254,253,0.96); backdrop-filter: blur(14px); border-top: 1px solid ${T.line}; padding: 12px ${pageX} calc(12px + env(safe-area-inset-bottom)); }
          .bag-bar .bag-btn { padding: 15px 26px; }
        }
      `}</style>

      <NavigationV2 solid />

      <main className="bag-page">
        <div className="bag-wrap">
          <div className="bag-head">
            <h1 className="bag-h1">{cartItems.length === 0 ? "Your bag is empty" : "Your bag"}</h1>
            {cartItems.length > 0 && <div className="bag-count">{pieces} {pieces === 1 ? "piece" : "pieces"}</div>}
          </div>

          {cartItems.length === 0 ? (
            <div className="bag-empty">
              <p>Nothing here yet. Browse our engagement rings, or speak to us about a bespoke commission.</p>
              <div className="bag-empty-actions">
                <Link to="/engagement-rings" className="bag-btn" style={{ display: "inline-block", padding: "17px 32px" }}>Shop engagement rings</Link>
                <Link to="/bespoke-design" className="bag-link">Enquire about bespoke</Link>
              </div>
            </div>
          ) : (
            <div className="bag-grid">
              {/* Pieces */}
              <div>
                {cartItems.map((item, index) => {
                  const to = productHref(item);
                  const specs = specPairs(item);
                  const line = parsePrice(item.price) * item.quantity;
                  return (
                    <div key={`${item.id}-${item.metal}-${item.size}-${index}`} className="bag-line" data-line>
                      <Link to={to} className="bag-thumb" aria-label={item.name}>
                        <img src={getMediaUrl(item.image)} alt={item.name} />
                      </Link>

                      <div className="bag-body">
                        <div className="bag-main">
                          <Link to={to} className="bag-name">{tidy(item.name)}</Link>
                          {specs.length > 0 && (
                            <div className="bag-spec">
                              {specs.map(([k, v], i) => <React.Fragment key={k}>{i > 0 && " · "}{k}: <b>{v}</b></React.Fragment>)}
                            </div>
                          )}
                          <div className="bag-lead"><i className={inStock(item) ? "" : "is-made"} />{leadTime(item)}</div>
                        </div>

                        <div className="bag-ctrl">
                          <div className="bag-qty">
                            <button type="button" onClick={() => updateQuantity(index, item.quantity - 1)} aria-label={`Decrease quantity, ${item.name}`}>
                              <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true"><path d="M1 5.5h9" stroke="currentColor" /></svg>
                            </button>
                            <span data-qty aria-label="Quantity">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(index, item.quantity + 1)} aria-label={`Increase quantity, ${item.name}`}>
                              <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true"><path d="M1 5.5h9M5.5 1v9" stroke="currentColor" /></svg>
                            </button>
                          </div>
                          <span style={{ display: "inline-flex", gap: 22 }}>
                            <Link to={to} className="bag-link">Edit</Link>
                            <button type="button" className="bag-link" data-remove onClick={() => removeItem(index)}>Remove</button>
                          </span>
                        </div>
                      </div>

                      <div className="bag-price">
                        {money(line)}
                        {item.quantity > 1 && <small>{money(parsePrice(item.price))} each</small>}
                      </div>
                    </div>
                  );
                })}

                <div style={{ paddingTop: 26 }}>
                  <Link to="/engagement-rings" className="bag-link">Continue shopping</Link>
                </div>
              </div>

              {/* Summary */}
              <aside className="bag-sum">
                <div className="bag-panel">
                  <h2>Summary</h2>
                  <div className="bag-row"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  <div className="bag-row"><span>Delivery</span><span>Free, insured</span></div>
                  <div className="bag-row" style={{ marginBottom: 0 }}><span>VAT (included)</span><span>{money(vat)}</span></div>

                  <div className="bag-total"><span>Total</span><span>{money(total)}</span></div>
                  <div className="bag-note">Includes VAT and insured UK delivery</div>

                  <Link to="/checkout" className="bag-btn" style={{ marginTop: 24 }}>Proceed to checkout</Link>
                  <PaymentBadges align="center" style={{ marginTop: 16 }} />

                  <ul className="bag-assure">
                    {ASSURANCES.map((a) => <li key={a}><Tick />{a}</li>)}
                  </ul>
                </div>

                <div className="bag-help">
                  <div style={{ fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text }}>Need a hand?</div>
                  <p>Speak to our Beeston workshop about sizing, timelines or a bespoke alternative.</p>
                  <a href="tel:01159257552" className="bag-tel">0115 925 7552</a>
                  <div style={{ marginTop: 14 }}><Link to="/contact" className="bag-link">Book an appointment</Link></div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      {/* Phone: total and checkout ride along the bottom */}
      {cartItems.length > 0 && (
        <div className="bag-bar">
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: T.text, lineHeight: 1 }}>{money(total)}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{pieces} {pieces === 1 ? "piece" : "pieces"}, free delivery</div>
          </div>
          <Link to="/checkout" className="bag-btn">Checkout</Link>
        </div>
      )}

      <FooterV2 />
    </div>
  );
};

export default CartV2;
