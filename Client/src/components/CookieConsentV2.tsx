import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * CookieConsentV2 — GDPR/PECR-compliant consent gate.
 *
 * Non-essential trackers (Google Tag Manager, Meta Pixel, Microsoft Clarity)
 * are NO LONGER loaded from index.html. They load here only after the visitor
 * accepts, matching the site's cookie policy ("Non-essential cookies are only
 * set once you have agreed to them"). Strictly-necessary cookies are unaffected.
 */

const STORAGE_KEY = "cookie_consent_v1"; // "accepted" | "declined"
const META_PIXEL_ID = "1045549528353285";
const CLARITY_ID = "w7bjnhz4zz";
const GTM_ID = "GTM-PP0B5P4";

let trackersLoaded = false;

const loadTrackers = () => {
  if (trackersLoaded || typeof window === "undefined") return;
  trackersLoaded = true;

  // Google Tag Manager
  (function (w: any, d: Document, s: string, l: string, i: string) {
    w[l] = w[l] || [];
    w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    const f = d.getElementsByTagName(s)[0];
    const j = d.createElement(s) as HTMLScriptElement;
    const dl = l !== "dataLayer" ? "&l=" + l : "";
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
    f.parentNode?.insertBefore(j, f);
  })(window, document, "script", "dataLayer", GTM_ID);

  // Meta Pixel
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  (window as any).fbq?.("init", META_PIXEL_ID);
  (window as any).fbq?.("track", "PageView");

  // Microsoft Clarity
  (function (c: any, l: Document, a: string, r: string, i: string) {
    c[a] = c[a] || function () {
      (c[a].q = c[a].q || []).push(arguments);
    };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = "https://www.clarity.ms/tag/" + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode?.insertBefore(t, y);
  })(window, document, "clarity", "script", CLARITY_ID);
};

const CookieConsentV2 = (): JSX.Element | null => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let choice: string | null = null;
    try { choice = localStorage.getItem(STORAGE_KEY); } catch { /* ignore */ }
    if (choice === "accepted") { loadTrackers(); return; }
    if (choice === "declined") return;
    setShow(true);
  }, []);

  const decide = (accepted: boolean) => {
    try { localStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "declined"); } catch { /* ignore */ }
    if (accepted) loadTrackers();
    setShow(false);
  };

  if (!show) return null;

  const ink = "#141414", cream = "#F6F2EA", gold = "#A8813C";
  return (
    <div role="dialog" aria-label="Cookie consent" style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: ink, color: cream, padding: "clamp(16px,2.5vw,22px) clamp(16px,4vw,40px)",
      boxShadow: "0 -8px 28px rgba(0,0,0,0.28)",
    }}>
      <style>{`@media (max-width:720px){.cc-row{flex-direction:column;align-items:stretch!important;gap:14px!important;}.cc-btns{justify-content:stretch!important;}.cc-btns button{flex:1;}}`}</style>
      <div className="cc-row" style={{ maxWidth: 1240, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, maxWidth: "70ch", color: "rgba(246,242,234,0.9)" }}>
          We use strictly necessary cookies to make the site work. With your consent we also use analytics and marketing
          cookies (Google, Meta, Microsoft Clarity) to understand how the site is used and improve it. See our{" "}
          <Link to="/cookies" style={{ color: gold, textDecoration: "underline" }}>Cookie Policy</Link>.
        </p>
        <div className="cc-btns" style={{ display: "flex", gap: 10, flex: "none" }}>
          <button onClick={() => decide(false)} style={{
            padding: "11px 20px", cursor: "pointer", background: "transparent",
            border: "1px solid rgba(246,242,234,0.4)", color: cream, fontSize: 11.5,
            letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>Essential only</button>
          <button onClick={() => decide(true)} style={{
            padding: "11px 22px", cursor: "pointer", background: cream, border: "1px solid " + cream,
            color: ink, fontSize: 11.5, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap",
          }}>Accept all</button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentV2;
