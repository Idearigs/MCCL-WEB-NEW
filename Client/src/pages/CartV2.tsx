import React from "react";
import { Link } from "react-router-dom";
import { Plus, Minus } from "lucide-react";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { useCart, CartItem } from "../contexts/CartContext";
import { getMediaUrl } from "../config/api";

/**
 * Bag page — v2 redesign (design_handoff_mcculloch_bag_checkout_contact).
 * Line items with full spec table + per-line lead time, sticky summary aside
 * with assurances and a "Need a hand?" panel, plus a mobile sticky bottom bar.
 * The bag drawer lives in components/CartSlide.tsx.
 * Original preserved at pages/Cart.original.tsx.
 */

const NAV_H = 96;
const pageX = "clamp(24px, 3vw, 52px)";

const parsePrice = (price: string | number): number => {
  if (typeof price === "number") return price;
  return parseFloat(String(price).replace(/[£,\s]/g, "")) || 0;
};
const money = (n: number): string => `£${Math.round(n).toLocaleString("en-GB")}`;

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

const leadTime = (item: CartItem): string =>
  item.type === "watch" ? "In stock, ships in 48 hours" : "Made to order, 4–6 weeks";

const ASSURANCES = [
  "Complimentary insured delivery",
  "30-day returns",
  "Lifetime aftercare & servicing",
  "Secure encrypted checkout",
];

const CartV2 = (): JSX.Element => {
  const { cartItems, updateQuantity, removeItem } = useCart();

  const subtotal = cartItems.reduce((t, i) => t + parsePrice(i.price) * i.quantity, 0);
  const delivery = 0; // free & insured
  const total = subtotal + delivery;
  const vat = Math.round(total - total / 1.2);
  const pieces = cartItems.reduce((t, i) => t + i.quantity, 0);

  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };
  const stepBtn: React.CSSProperties = {
    width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
    border: `1px solid ${T.ruleSoft}`, background: "transparent", color: T.body, cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s",
  };
  const summaryRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.body, marginBottom: 11 };

  return (
    <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.body }}>
      <style>{`
        .cv2-step:hover { border-color: ${T.ink}; color: ${T.ink}; }
        .cv2-linkbtn:hover { color: ${T.ink}; }
        .cv2-cta:hover { background: ${T.inkDeep}; }
        .cv2-thumb img { transition: opacity 0.25s; }
        .cv2-thumb:hover img { opacity: 0.9; }
        .cv2-bottombar { display: none; }
        @media (max-width: 900px) {
          .cv2-grid { grid-template-columns: 1fr !important; }
          .cv2-aside { position: static !important; }
          .cv2-line { grid-template-columns: 108px 1fr !important; gap: 6px 16px !important; align-items: start !important; }
          .cv2-thumb { grid-column: 1 !important; grid-row: 1 !important; }
          .cv2-linemeta { grid-column: 2 !important; grid-row: 1 / 3 !important; }
          .cv2-lineprice { grid-column: 1 !important; grid-row: 2 !important; text-align: left !important; margin-top: 12px !important; white-space: normal !important; }
          .cv2-bottombar { display: grid !important; }
          .cv2-page { padding-bottom: 96px !important; }
        }
        @media (max-width: 560px) {
          .cv2-line { grid-template-columns: 92px 1fr !important; }
        }
      `}</style>

      <NavigationV2 solid />

      <main className="cv2-page" style={{ paddingTop: NAV_H + 36, paddingBottom: 96 }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: `0 ${pageX}` }}>
          {/* Title block */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, paddingBottom: 22, borderBottom: `1px solid ${T.rule}`, marginBottom: "clamp(28px, 4vw, 48px)" }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 4.4vw, 60px)", color: T.ink, lineHeight: 1, fontWeight: 400 }}>Your bag</h1>
            <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted }}>
              {pieces} {pieces === 1 ? "piece" : "pieces"}
            </span>
          </div>

          {cartItems.length === 0 ? (
            /* Empty state */
            <div style={{ textAlign: "center", padding: "clamp(48px, 12vw, 120px) 0" }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 3vw, 40px)", color: T.ink, marginBottom: 14, fontWeight: 400 }}>
                Your bag is empty
              </h2>
              <p style={{ fontSize: 14.5, color: T.muted, lineHeight: 1.65, maxWidth: 420, margin: "0 auto 30px" }}>
                Nothing here yet. Browse our engagement rings, or speak to us about a bespoke commission.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <Link to="/engagement-rings" className="cv2-cta" style={{ padding: "14px 32px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s" }}>
                  Shop engagement rings
                </Link>
                <Link to="/bespoke-design" style={{ padding: "14px 32px", background: "transparent", color: T.ink, border: `1px solid ${T.ruleStrong}`, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none" }}>
                  Enquire about bespoke
                </Link>
              </div>
            </div>
          ) : (
            <div className="cv2-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.42fr) minmax(340px, 0.58fr)", gap: "clamp(32px, 4vw, 72px)", alignItems: "start" }}>
              {/* Line items */}
              <div>
                {cartItems.map((item, index) => {
                  const to = item.slug ? `/rings/${item.slug}` : "#";
                  return (
                    <div
                      key={`${item.id}-${item.metal}-${item.size}-${index}`}
                      className="cv2-line"
                      style={{ display: "grid", gridTemplateColumns: "132px 1fr auto", gap: 24, padding: "28px 0", borderBottom: `1px solid ${T.rule}` }}
                    >
                      {/* Image */}
                      <Link to={to} className="cv2-thumb" style={{ display: "block", width: "100%", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden" }}>
                        <img src={getMediaUrl(item.image)} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </Link>

                      {/* Centre column: name, ref, spec, controls */}
                      <div className="cv2-linemeta" style={{ minWidth: 0 }}>
                        <Link to={to} style={{ fontFamily: FONT_DISPLAY, fontSize: 27, color: T.ink, lineHeight: 1.1, textDecoration: "none", display: "block" }}>
                          {item.name}
                        </Link>
                        <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, marginTop: 6 }}>
                          Ref. {item.slug || item.id}
                        </div>

                        {/* Spec table */}
                        {specPairs(item).length > 0 && (
                          <div style={{ marginTop: 16, display: "grid", rowGap: 7 }}>
                            {specPairs(item).map(([k, v]) => (
                              <div key={k} style={{ display: "grid", gridTemplateColumns: "108px 1fr", fontSize: 12.5, lineHeight: 1.4 }}>
                                <span style={{ color: T.muted }}>{k}</span>
                                <span style={{ color: T.body, textTransform: "capitalize" }}>{v}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Controls */}
                        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 20, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <button className="cv2-step" style={stepBtn} onClick={() => updateQuantity(index, item.quantity - 1)} aria-label={`Decrease quantity, ${item.name}`}>
                              <Minus size={13} />
                            </button>
                            <span style={{ width: 42, textAlign: "center", fontSize: 13.5, color: T.ink }}>{item.quantity}</span>
                            <button className="cv2-step" style={stepBtn} onClick={() => updateQuantity(index, item.quantity + 1)} aria-label={`Increase quantity, ${item.name}`}>
                              <Plus size={13} />
                            </button>
                          </div>
                          <Link to={to} className="cv2-linkbtn" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, textDecoration: "none", transition: "color 0.2s" }}>
                            Edit
                          </Link>
                          <button className="cv2-linkbtn" onClick={() => removeItem(index)} style={{ background: "transparent", border: 0, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: T.muted, cursor: "pointer", transition: "color 0.2s" }}>
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Right column: line total + lead time */}
                      <div className="cv2-lineprice" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: T.ink }}>
                          {money(parsePrice(item.price) * item.quantity)}
                        </div>
                        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 8, lineHeight: 1.4, whiteSpace: "normal", maxWidth: 150 }}>
                          {leadTime(item)}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div style={{ paddingTop: 24 }}>
                  <Link to="/engagement-rings" className="cv2-linkbtn" style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, textDecoration: "none", transition: "color 0.2s" }}>
                    ← Continue shopping
                  </Link>
                </div>
              </div>

              {/* Summary aside */}
              <aside className="cv2-aside" style={{ position: "sticky", top: 92 }}>
                <div style={{ background: T.tint, padding: "28px 26px", borderTop: `3px solid ${T.gold}` }}>
                  <h2 style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: T.ink, marginBottom: 22 }}>Summary</h2>

                  <div style={summaryRow}><span>Subtotal</span><span style={{ color: T.ink }}>{money(subtotal)}</span></div>
                  <div style={summaryRow}><span>Delivery</span><span style={{ color: T.gold }}>Free, insured</span></div>
                  <div style={summaryRow}><span>VAT (incl.)</span><span style={{ color: T.ink }}>{money(vat)}</span></div>

                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 18, marginTop: 8, borderTop: `1px solid ${T.ruleSoft}` }}>
                    <span style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink }}>Total</span>
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: T.gold, lineHeight: 1 }}>{money(total)}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 6, textAlign: "right" }}>
                    Includes VAT · Free insured UK delivery
                  </div>

                  <Link to="/checkout" className="cv2-cta" style={{ display: "block", textAlign: "center", marginTop: 22, padding: "16px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s" }}>
                    Proceed to checkout
                  </Link>

                  {/* Assurances */}
                  <div style={{ marginTop: 22 }}>
                    {ASSURANCES.map((a, i) => (
                      <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i === 0 ? "none" : `1px dashed ${T.ruleSoft}`, fontSize: 12.5, color: T.body }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.gold, flexShrink: 0 }} />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Need a hand? */}
                <div style={{ border: `1px solid ${T.rule}`, padding: "22px 26px", marginTop: 18 }}>
                  <div style={eyebrow}>Need a hand?</div>
                  <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.6, margin: "10px 0 14px" }}>
                    Speak to our Beeston workshop about sizing, timelines or a bespoke alternative.
                  </p>
                  <a href="tel:01159257552" style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: T.ink, textDecoration: "none", display: "block" }}>0115 925 7552</a>
                  <Link to="/contact" className="cv2-linkbtn" style={{ display: "inline-block", marginTop: 10, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, textDecoration: "none", transition: "color 0.2s" }}>
                    Book an appointment →
                  </Link>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      {/* Mobile sticky bottom bar */}
      {cartItems.length > 0 && (
        <div
          className="cv2-bottombar"
          style={{
            position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 55,
            gridTemplateColumns: "1fr auto", alignItems: "center", gap: 14,
            background: "rgba(248,246,240,0.96)", backdropFilter: "blur(14px)",
            borderTop: `1px solid ${T.rule}`, padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: T.ink, lineHeight: 1 }}>{money(total)}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{pieces} {pieces === 1 ? "piece" : "pieces"} · free delivery</div>
          </div>
          <Link to="/checkout" className="cv2-cta" style={{ padding: "14px 26px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s", whiteSpace: "nowrap" }}>
            Checkout
          </Link>
        </div>
      )}

      <FooterV2 />
    </div>
  );
};

export default CartV2;
