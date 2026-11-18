import React from "react";
import { Link } from "react-router-dom";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";
import { GROUND, TILE } from "./listingShared";

/**
 * Shared by the account area (Account, Orders, Order detail, Saved, Verify email): one
 * stylesheet, the order status language, and the order row used on both the account page and
 * the orders page. Same family as the listing and checkout pages: near-white ground, hairline
 * borders, Marcellus headings, one ink button per screen, gold only as a mark (never as text).
 */

export const AC_X = "clamp(20px, 4vw, 64px)";

export const money = (n?: number | null): string =>
  n == null || isNaN(Number(n)) ? "" : "£" + Math.round(Number(n)).toLocaleString("en-GB");

export const fmtDate = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

// Display only: "Clubmaster Classic - Chrono - Black" reads "Clubmaster Classic, Chrono, Black".
export const tidy = (n?: string): string => (n || "").replace(/\s+-\s+/g, ", ");

// ── Order status ────────────────────────────────────────────────────────────
const CLOSED = ["delivered", "completed", "fulfilled", "cancelled", "refunded"];
export const isLive = (status?: string): boolean => !CLOSED.includes(String(status || "").toLowerCase());
export const statusLabel = (status?: string): string => {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "Confirmed";
  if (s === "processing") return "In the workshop";
  if (s === "shipped") return "Dispatched";
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Order";
};
// The four points an order passes through, and how far a given status has got.
export const ORDER_TRACK = ["Confirmed", "In the workshop", "Dispatched", "Delivered"];
export const trackIndex = (status?: string): number => {
  const s = String(status || "").toLowerCase();
  if (s === "processing") return 1;
  if (s === "shipped") return 2;
  if (["delivered", "completed", "fulfilled"].includes(s)) return 3;
  return 0;
};

export const StatusTag = ({ status }: { status?: string }): JSX.Element => (
  <span className={`ac-tag${isLive(status) ? " is-live" : ""}`}><i />{statusLabel(status)}</span>
);

export const Tick = (): JSX.Element => (
  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true" style={{ flex: "none" }}><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.3" /></svg>
);

export interface AcOrderItem { id: string; name: string; quantity: number; unitPrice: number; totalPrice: number; product_type?: string; attributes?: Record<string, any> }
export interface AcOrder {
  id: string; orderNumber: string; status: string; paymentStatus: string; total: number;
  createdAt: string; shippingAddress?: any; trackingNumber?: string; itemsCount: number; items: AcOrderItem[];
}

export const OrderRow = ({ o }: { o: AcOrder }): JSX.Element => {
  const live = isLive(o.status);
  return (
    <article className="ac-order">
      <div className="ac-order-top">
        <div>
          <div className="ac-order-no">Order {o.orderNumber || `#${String(o.id).slice(0, 8)}`}</div>
          <div className="ac-order-date">{fmtDate(o.createdAt)}</div>
        </div>
        <StatusTag status={o.status} />
      </div>
      <ul className="ac-order-items">
        {o.items.map((it) => (
          <li key={it.id}>
            <span>{tidy(it.name)}{it.quantity > 1 ? ` × ${it.quantity}` : ""}</span>
            <span>{money(it.totalPrice)}</span>
          </li>
        ))}
      </ul>
      {o.trackingNumber && live && <div className="ac-order-track">Tracking number {o.trackingNumber}</div>}
      <div className="ac-order-foot">
        <span><span className="ac-eyebrow" style={{ marginRight: 12 }}>Total</span>{money(o.total)}</span>
        <Link to={`/orders/${o.id}`} className="ac-link">{live ? "Track order" : "View order"}</Link>
      </div>
    </article>
  );
};

export const EmptyPane = ({ head, body, cta }: { head: string; body: string; cta?: { label: string; to: string } }): JSX.Element => (
  <div className="ac-empty">
    <h3>{head}</h3>
    <p>{body}</p>
    {cta && <Link to={cta.to} className="ac-btn">{cta.label}</Link>}
  </div>
);

// A centred message page: sign-in prompts, loading, errors, email verification.
export const Notice = ({ eyebrow, title, body, children }: { eyebrow?: string; title: string; body?: string; children?: React.ReactNode }): JSX.Element => (
  <div className="ac-notice">
    {eyebrow && <div className="ac-eyebrow">{eyebrow}</div>}
    <h1>{title}</h1>
    {body && <p>{body}</p>}
    {children && <div className="ac-notice-actions">{children}</div>}
  </div>
);

export const ACCOUNT_CSS = `
  .ac { background: ${GROUND}; min-height: 100vh; font-family: ${FONT_BODY}; color: ${T.text}; padding-top: var(--v2nav-h, 113px); overflow-x: clip; }
  .ac a { color: inherit; text-decoration: none; }
  .ac-wrap { max-width: 1240px; margin: 0 auto; padding-left: ${AC_X}; padding-right: ${AC_X}; }
  .ac-wrap.is-narrow { max-width: 920px; }
  .ac-eyebrow { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .ac-crumb { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: clamp(26px, 3vw, 44px); }
  .ac-crumb a:hover { color: ${T.text}; }
  .ac-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(36px, 4.6vw, 64px); line-height: 1.05; margin: 14px 0 0; color: ${T.text}; text-wrap: balance; }
  .ac-h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(26px, 2.4vw, 34px); line-height: 1.15; margin: 0; color: ${T.text}; }
  .ac-muted { color: ${T.textMuted}; }

  .ac-btn { display: inline-block; padding: 16px 30px; background: ${T.ink}; color: ${T.cream} !important; border: 0; cursor: pointer; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
  .ac-btn:hover { background: ${T.text}; }
  .ac-btn[disabled] { opacity: 0.7; cursor: default; }
  .ac-ghost { display: block; width: 100%; padding: 13px 12px; cursor: pointer; background: transparent; border: 1px solid ${T.ruleStrong}; font-family: ${FONT_BODY}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
  .ac-ghost:hover { border-color: ${T.text}; }
  .ac-link { display: inline-block; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; padding: 0 0 4px; font-family: ${FONT_BODY}; font-size: 11.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
  .ac-link:hover { border-bottom-color: ${T.gold}; }

  /* opening */
  .ac-open { text-align: center; padding-top: clamp(30px, 3.6vw, 56px); }
  .ac-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: clamp(30px, 3.6vw, 52px); border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
  .ac-fact { padding: clamp(20px, 2.2vw, 30px) 12px; text-align: center; border-left: 1px solid ${T.line}; }
  .ac-fact:first-child { border-left: 0; }
  .ac-fact b { display: block; min-height: 1.1em; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(24px, 2.3vw, 32px); line-height: 1.1; color: ${T.text}; }
  .ac-fact span { display: block; margin-top: 9px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }
  .ac-live { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px 24px; margin-top: 22px; padding: 18px 22px; border: 1px solid ${T.line}; text-align: left; }
  .ac-live b { font-weight: 400; font-size: 15px; }

  /* layout: rail + pane */
  .ac-main { display: grid; grid-template-columns: 236px minmax(0, 1fr); gap: clamp(32px, 5vw, 84px); align-items: start; padding-top: clamp(36px, 4.4vw, 64px); padding-bottom: clamp(64px, 7vw, 112px); }
  .ac-rail { position: sticky; top: calc(var(--v2nav-h, 113px) + 24px); }
  .ac-tabs { display: flex; flex-direction: column; border-top: 1px solid ${T.line}; }
  .ac-tab { position: relative; display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 15px 0 15px 16px; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.line}; text-align: left; font-family: ${FONT_BODY}; font-size: 14.5px; color: ${T.textMuted}; transition: color 0.2s ease; white-space: nowrap; }
  .ac-tab:hover { color: ${T.text}; }
  .ac-tab[aria-selected="true"] { color: ${T.text}; }
  .ac-tab[aria-selected="true"]::before { content: ""; position: absolute; left: 0; top: 14px; bottom: 14px; width: 1px; background: ${T.gold}; }
  .ac-tab small { font-size: 12.5px; color: ${T.textMuted}; }
  .ac-card { margin-top: 28px; padding: 22px; border: 1px solid ${T.line}; }
  .ac-card p { margin: 8px 0 14px; font-size: 13.5px; line-height: 1.65; color: ${T.textMuted}; }
  @keyframes acIn { from { opacity: 0; transform: translateY(10px); } }
  .ac-pane { min-height: 520px; animation: acIn 0.5s cubic-bezier(0.22,1,0.36,1) backwards; }
  .ac-panehead { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 12px 24px; padding-bottom: 20px; border-bottom: 1px solid ${T.line}; }
  .ac-panehead > span { font-size: 13.5px; color: ${T.textMuted}; }
  .ac-lede { margin: 22px 0 0; max-width: 58ch; font-size: 15.5px; line-height: 1.8; color: ${T.text}; }

  /* tags */
  .ac-tag { display: inline-flex; align-items: center; gap: 9px; padding: 7px 13px; border: 1px solid ${T.line}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.textMuted}; white-space: nowrap; }
  .ac-tag i { width: 6px; height: 6px; border-radius: 50%; background: ${T.ruleStrong}; }
  .ac-tag.is-live { color: ${T.text}; border-color: ${T.ruleStrong}; }
  .ac-tag.is-live i { background: ${T.gold}; }

  /* orders */
  .ac-order { padding: 26px 0; border-bottom: 1px solid ${T.line}; }
  .ac-order-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .ac-order-no { font-family: ${FONT_DISPLAY}; font-size: 21px; line-height: 1.2; color: ${T.text}; }
  .ac-order-date { margin-top: 5px; font-size: 13.5px; color: ${T.textMuted}; }
  .ac-order-items { list-style: none; margin: 18px 0 0; padding: 0; display: grid; gap: 8px; }
  .ac-order-items li { display: flex; justify-content: space-between; gap: 20px; font-size: 14.5px; line-height: 1.5; color: ${T.text}; }
  .ac-order-items li span:last-child { white-space: nowrap; }
  .ac-order-track { margin-top: 12px; font-size: 13.5px; color: ${T.textMuted}; }
  .ac-order-foot { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-top: 18px; font-size: 15px; }

  /* saved pieces */
  .ac-saved { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(30px, 3vw, 44px) clamp(12px, 1.6vw, 24px); margin-top: 30px; }
  .ac-saved.is-four { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .ac-piece-img { position: relative; display: block; aspect-ratio: 1 / 1.1; background: ${TILE}; overflow: hidden; }
  .ac-piece-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 9%; mix-blend-mode: multiply; transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
  .ac-piece-img:hover img { transform: scale(1.035); }
  .ac-piece-x { position: absolute; top: 4px; right: 4px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; border: 0; color: ${T.text}; transition: opacity 0.2s ease; }
  .ac-piece-x:hover { opacity: 0.55; }
  .ac-piece-name { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 14px 0 14px; font-size: 14.5px; line-height: 1.45; color: ${T.text}; }
  .ac-piece-name span:last-child { flex: none; }

  /* rows: appointments, pieces */
  .ac-rowitem { display: grid; grid-template-columns: 132px minmax(0, 1fr) auto; gap: clamp(16px, 2.5vw, 40px); align-items: baseline; padding: 24px 0; border-bottom: 1px solid ${T.line}; }
  .ac-rowitem.is-piece { grid-template-columns: 108px minmax(0, 1fr) minmax(0, 0.9fr); align-items: start; }
  .ac-doc { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding: 11px 0; border-bottom: 1px solid ${T.line}; font-size: 14px; }
  a.ac-doc:hover span:first-child { text-decoration: underline; text-decoration-color: ${T.gold}; text-underline-offset: 4px; }

  /* fields */
  .ac-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; max-width: 680px; }
  .ac-fields > .is-wide { grid-column: 1 / -1; }
  .ac-label { display: block; font-size: 13px; color: ${T.text}; margin-bottom: 7px; }
  .ac-input { display: block; width: 100%; height: 52px; padding: 0 15px; background: #FFFFFF; border: 1px solid ${T.ruleStrong}; border-radius: 0; outline: none; color: ${T.text}; font-family: ${FONT_BODY}; font-size: 16px; transition: border-color 0.2s ease; }
  .ac-input:hover { border-color: #B5A990; }
  .ac-input:focus { border-color: ${T.text}; }
  .ac-input[readonly] { background: ${TILE}; color: ${T.textMuted}; }
  .ac-hint { display: block; margin-top: 7px; font-size: 13px; line-height: 1.5; color: ${T.textMuted}; }
  .ac-switch { display: flex; align-items: center; justify-content: space-between; gap: 20px; width: 100%; padding: 17px 0; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.line}; text-align: left; font-family: ${FONT_BODY}; }
  .ac-switch b { display: block; font-weight: 400; font-size: 15px; color: ${T.text}; }
  .ac-switch small { display: block; margin-top: 4px; font-size: 13.5px; color: ${T.textMuted}; }
  .ac-switch i { flex: none; position: relative; width: 44px; height: 24px; border-radius: 12px; background: ${T.ruleStrong}; transition: background 0.25s ease; }
  .ac-switch i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #FFFFFF; transition: transform 0.25s ease; }
  .ac-switch[aria-checked="true"] i { background: ${T.ink}; }
  .ac-switch[aria-checked="true"] i::after { transform: translateX(20px); }

  /* addresses */
  .ac-addrs { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(14px, 2vw, 24px); margin-top: 28px; }
  .ac-addr { padding: 24px; border: 1px solid ${T.line}; }
  .ac-addr.is-default { border-color: ${T.ruleStrong}; }
  .ac-addr-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
  .ac-addr-lines { font-size: 15px; line-height: 1.75; color: ${T.text}; }
  .ac-addr-acts { display: flex; flex-wrap: wrap; gap: 10px 20px; margin-top: 18px; }
  .ac-form { margin-top: 28px; padding: clamp(20px, 2.4vw, 28px); border: 1px solid ${T.ruleStrong}; max-width: 680px; }

  /* empty + notices */
  .ac-empty { padding: clamp(48px, 6vw, 80px) 0 20px; text-align: center; }
  .ac-empty h3 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 28px; margin: 0 0 14px; color: ${T.text}; }
  .ac-empty p { margin: 0 auto 28px; max-width: 46ch; font-size: 15.5px; line-height: 1.8; color: ${T.text}; }
  .ac-notice { max-width: 620px; margin: 0 auto; padding: clamp(72px, 12vh, 150px) ${AC_X} clamp(88px, 13vw, 170px); text-align: center; }
  .ac-notice h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(34px, 4.4vw, 54px); line-height: 1.08; margin: 16px 0 0; color: ${T.text}; text-wrap: balance; }
  .ac-notice p { margin: 20px auto 0; max-width: 46ch; font-size: 15.5px; line-height: 1.8; color: ${T.text}; }
  .ac-notice-actions { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 16px 30px; margin-top: 32px; }
  @keyframes acSpin { to { transform: rotate(360deg); } }
  .ac-spinner { display: block; width: 26px; height: 26px; margin: 0 auto 26px; border-radius: 50%; border: 1px solid ${T.line}; border-top-color: ${T.gold}; animation: acSpin 0.9s linear infinite; }
  .ac-error { margin-top: 24px; padding: 14px 16px; background: #FBEDEA; border: 1px solid #E4C4BD; font-size: 14px; line-height: 1.6; color: #8F3222; }

  /* order detail */
  .ac-track { list-style: none; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: clamp(30px, 3.6vw, 48px) 0 0; padding: 0; }
  .ac-track li { position: relative; padding-top: 26px; text-align: center; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.textMuted}; }
  .ac-track li::before { content: ""; position: absolute; top: 6px; left: -50%; right: 50%; height: 1px; background: ${T.line}; }
  .ac-track li:first-child::before { display: none; }
  .ac-track li::after { content: ""; position: absolute; top: 0; left: 50%; margin-left: -7px; width: 13px; height: 13px; border-radius: 50%; background: ${GROUND}; border: 1px solid ${T.ruleStrong}; }
  .ac-track li.is-done { color: ${T.text}; }
  .ac-track li.is-done::before { background: ${T.gold}; }
  .ac-track li.is-done::after { background: ${T.gold}; border-color: ${T.gold}; }
  .ac-detail { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr); gap: clamp(32px, 5vw, 84px); align-items: start; padding-top: clamp(40px, 5vw, 72px); padding-bottom: clamp(64px, 7vw, 112px); }
  .ac-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 24px; padding: 22px 0; border-bottom: 1px solid ${T.line}; }
  .ac-item b { font-weight: 400; font-size: 16px; line-height: 1.45; color: ${T.text}; }
  .ac-item p { grid-column: 1; margin: 0; font-size: 14px; line-height: 1.65; color: ${T.textMuted}; }
  .ac-side { background: ${T.sand}; padding: clamp(24px, 2.4vw, 32px); }
  .ac-row { display: flex; justify-content: space-between; gap: 16px; font-size: 14.5px; color: ${T.text}; margin-top: 12px; }
  .ac-total { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-top: 18px; margin-top: 18px; border-top: 1px solid ${T.ruleStrong}; }
  .ac-total span:first-child { font-size: 11.5px; letter-spacing: 0.18em; text-transform: uppercase; }
  .ac-total span:last-child { font-family: ${FONT_DISPLAY}; font-size: 32px; line-height: 1; }
  .ac-block { padding: 26px clamp(24px, 2.4vw, 32px) 0; }
  .ac-block > div:last-child { margin-top: 12px; font-size: 15px; line-height: 1.7; color: ${T.text}; }

  @media (max-width: 960px) {
    .ac-main { grid-template-columns: minmax(0, 1fr); gap: 28px; padding-top: 0; }
    .ac-rail { position: sticky; top: calc(var(--v2nav-h, 101px) - 1px); z-index: 30; margin: 0 calc(-1 * ${AC_X}); background: rgba(255,254,253,0.96); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid ${T.line}; }
    .ac-tabs { flex-direction: row; overflow-x: auto; border-top: 0; padding: 0 ${AC_X}; gap: 26px; scrollbar-width: none; }
    .ac-tabs::-webkit-scrollbar { display: none; }
    .ac-tab { flex: none; padding: 16px 0 15px; border-bottom: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; }
    .ac-tab small { display: none; }
    .ac-tab[aria-selected="true"]::before { left: 0; right: 0; top: auto; bottom: 0; width: auto; height: 1px; }
    .ac-rail-extra { display: none; }
    .ac-pane { min-height: 0; }
    .ac-detail { grid-template-columns: 1fr; }
    .ac-saved.is-four { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  .ac-foot-extra { display: none; }
  @media (max-width: 960px) { .ac-foot-extra { display: block; padding-bottom: 64px; margin-top: -40px; } }
  @media (max-width: 640px) {
    .ac-saved, .ac-saved.is-four { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
    .ac-piece-name { display: block; font-size: 14px; }
    .ac-piece-name span:last-child { display: block; margin-top: 4px; }
    .ac-fields, .ac-addrs { grid-template-columns: 1fr; }
    .ac-rowitem, .ac-rowitem.is-piece { grid-template-columns: 96px minmax(0, 1fr); }
    .ac-rowitem > :nth-child(3) { grid-column: 1 / -1; }
    .ac-fact { padding: 18px 6px; }
    .ac-fact span { font-size: 10px; letter-spacing: 0.1em; }
    .ac-order-top { flex-direction: column; gap: 12px; }
    .ac-track li { font-size: 9.5px; letter-spacing: 0.06em; }
    .ac-side { margin: 0 calc(-1 * ${AC_X}); padding: 24px ${AC_X}; }
    .ac-notice-actions .ac-btn { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) { .ac-pane, .ac-spinner { animation: none !important; } }
`;
