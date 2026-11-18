import React, { useState } from "react";
import { Link } from "react-router-dom";
import { T, FONT_LOGO, FONT_BODY } from "./tokens";
import PaymentBadges from "../PaymentBadges";
import API_BASE_URL from "../../config/api";

/**
 * FooterV2 — the homepage v2 dark footer. Visual design from the handoff;
 * link destinations and contact details are the site's real ones.
 */

const columns: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "Engagement rings", to: "/engagement-rings" },
      { label: "Wedding bands", to: "/wedding" },
      { label: "Fine jewellery", to: "/jewellery" },
      { label: "Watches", to: "/watches" },
      { label: "All rings", to: "/rings" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Bespoke design", to: "/bespoke-design" },
      { label: "Portfolio", to: "/bespoke-design" },
      { label: "Visit us", to: "/visit-us" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Delivery", to: "/delivery" },
      { label: "Returns & refunds", to: "/returns" },
      { label: "Warranty", to: "/warranty" },
      { label: "Repairs & aftercare", to: "/repairs" },
      { label: "FAQs", to: "/faqs" },
    ],
  },
  {
    title: "Guides",
    links: [
      { label: "Ring size guide", to: "/ring-size-guide" },
      { label: "Diamond guide", to: "/diamond-guide" },
      { label: "Gemstone guide", to: "/gemstone-guide" },
      { label: "Birthstone guide", to: "/birthstone-guide" },
      { label: "Jewellery care", to: "/jewellery-care" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our story", to: "/our-story" },
      { label: "Journal", to: "/blog/" },
      { label: "Sustainability", to: "/sustainability" },
      { label: "Hallmarking", to: "/hallmark-guide" },
      { label: "Certificates", to: "/certificate-of-authenticity" },
      { label: "Instagram", to: "https://www.instagram.com/andrewmccullochjewellers/", external: true },
      { label: "Facebook", to: "https://www.facebook.com/andrewmccullochjewellers/", external: true },
    ],
  },
];

const FooterV2 = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [foot, setFoot] = useState<string | null>(null);
  const [signup, setSignup] = useState<"idle" | "sending" | "done" | "error">("idle");
  // The sign-up used to clear the box and send nothing. It now emails the shop the address.
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signup === "sending") return;
    setSignup("sending");
    try {
      const r = await fetch(`${API_BASE_URL}/newsletter`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error();
      setSignup("done"); setEmail("");
    } catch { setSignup("error"); }
  };

  return (
    // Bottom padding leaves room for the floating chat button, which otherwise covered the
    // legal line on phones and the Cookies / Terms / Guarantees links on desktop.
    <footer className="v2-on-dark" style={{ background: T.ink, color: T.onDarkSoft, padding: `clamp(56px, 5vw, 88px) clamp(24px, 3vw, 52px) 104px`, fontFamily: FONT_BODY }}>
      <style>{`
        .v2ft a { color: inherit; text-decoration: none; transition: color 0.2s ease; }
        .v2ft a:hover { text-decoration: underline; text-decoration-color: ${T.gold}; text-decoration-thickness: 1px; text-underline-offset: 5px; }
        .v2-foottoggle { display: none; }
        @media (max-width: 767px) {
          .v2-footgrid { grid-template-columns: 1fr !important; gap: 0 !important; padding-bottom: 20px !important; }
          .v2-footcol { border-top: 1px solid ${T.ruleDark}; }
          .v2-foottitle { padding: 15px 0 !important; margin-bottom: 0 !important; }
          .v2-foottoggle { display: block; }
          .v2-footlinks { display: none !important; padding-bottom: 12px; }
          .v2-footlinks[data-open="1"] { display: flex !important; }
          .v2-footbottom { flex-direction: column; align-items: flex-start !important; gap: 14px !important; }
          .v2-footbottom a { display: inline-block; padding: 10px 0; }
        }
      `}</style>
      <div className="v2ft">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) repeat(5, minmax(0, 1fr))", gap: "clamp(20px, 2.4vw, 44px)", paddingBottom: 52, borderBottom: `1px solid ${T.ruleDark}` }} className="v2-footgrid">
          <div>
            <div style={{ fontFamily: FONT_LOGO, fontSize: 23, letterSpacing: "0.16em", color: "#FFFFFF" }}>McCulloch</div>
            <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: T.onDarkMuted, margin: "5px 0 26px 3px" }}>Fine jewellery</div>
            <p id="v2ft-news-label" style={{ margin: "0 0 20px", maxWidth: "32ch", fontSize: 15, lineHeight: 1.7 }}>New pieces and private viewings, before they reach the site.</p>
            {signup === "done" ? (
              <p role="status" style={{ margin: 0, fontSize: 14.5, color: "#EDE7DC" }}>Thank you. You’re on the list.</p>
            ) : (
              <form onSubmit={onSubmit} style={{ display: "flex", maxWidth: 320, borderBottom: `1px solid ${T.ruleDarkStrong}` }}>
                <label htmlFor="v2ft-news" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>Email address for new pieces and private viewings</label>
                <input id="v2ft-news" type="email" required autoComplete="email" aria-describedby="v2ft-news-label" value={email} onChange={e => { setEmail(e.target.value); if (signup === "error") setSignup("idle"); }} placeholder="Email address"
                  style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: "none", color: "#EDE7DC", fontFamily: FONT_BODY, fontSize: 16, padding: "12px 0" }} />
                <button type="submit" disabled={signup === "sending"} style={{ background: "transparent", border: 0, color: "#EDE7DC", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", padding: "12px 0 12px 16px", minHeight: 44 }}>{signup === "sending" ? "Sending…" : "Sign up"}</button>
              </form>
            )}
            {signup === "error" && <p role="alert" style={{ margin: "10px 0 0", fontSize: 13.5, color: "#E8B7AB" }}>That didn’t go through. Please try again, or call 0115 925 7552.</p>}
          </div>

          {columns.map(col => {
            const open = foot === col.title;
            return (
              <div key={col.title} className="v2-footcol">
                <button className="v2-foottitle" onClick={() => setFoot(open ? null : col.title)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: 0, padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.onDarkMuted, marginBottom: 7 }}>
                  <span>{col.title}</span>
                  <span className="v2-foottoggle" style={{ color: T.gold, fontSize: 16, lineHeight: 1, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.28s ease" }}>+</span>
                </button>
                <div className="v2-footlinks" data-open={open ? "1" : "0"} style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 14 }}>
                  {col.links.map(l => (
                    l.external
                      ? <a key={l.label} href={l.to} target="_blank" rel="noreferrer">{l.label}</a>
                      : <Link key={l.label} to={l.to} reloadDocument={l.to.startsWith("/blog")}>{l.label}</Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 24, flexWrap: "wrap" }}>
          <PaymentBadges textColor={T.onDarkSoft} align="flex-start" />
        </div>

        <div className="v2-footbottom" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, paddingTop: 18, fontSize: 12, letterSpacing: "0.06em", color: T.onDarkMuted, flexWrap: "wrap" }}>
          <span>© {new Date().getFullYear()} Andrew McCulloch Jewellers — 7 The Square, Beeston, Nottingham ·{" "}
            <a href="tel:+441159257552" style={{ color: T.onDarkStep, borderBottom: `1px solid ${T.ruleDarkStrong}` }}>0115 925 7552</a> ·{" "}
            <a href="mailto:has@mccullochjewellers.co.uk" style={{ color: T.onDarkStep, borderBottom: `1px solid ${T.ruleDarkStrong}` }}>has@mccullochjewellers.co.uk</a>
          </span>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <Link to="/privacy">Privacy</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/trust-guarantees">Guarantees</Link>
          </div>
        </div>
        <div style={{ paddingTop: 14, fontSize: 12, letterSpacing: "0.04em", color: T.onDarkMuted, lineHeight: 1.6 }}>
          Beeston Jewellers Ltd, registered in England &amp; Wales No. 10915704. VAT No. 275322603. Registered office: 7 The Square, Beeston, Nottinghamshire, NG9 2JG.
        </div>
      </div>
    </footer>
  );
};

export default FooterV2;
