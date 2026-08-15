import React, { useState } from "react";
import { Link } from "react-router-dom";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

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
      { label: "Portfolio", to: "/portfolio" },
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
      { label: "Sustainability", to: "/sustainability" },
      { label: "Hallmarking", to: "/hallmark-guide" },
      { label: "Certificates", to: "/certificate-of-authenticity" },
      { label: "Instagram", to: "https://instagram.com", external: true },
    ],
  },
];

const FooterV2 = (): JSX.Element => {
  const [email, setEmail] = useState("");
  const [foot, setFoot] = useState<string | null>(null);
  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); setEmail(""); };

  return (
    <footer style={{ background: T.ink, color: T.onDarkSoft, padding: `clamp(56px, 5vw, 88px) clamp(24px, 3vw, 52px) 28px`, fontFamily: FONT_BODY }}>
      <style>{`
        .v2ft a { color: inherit; text-decoration: none; transition: color 0.2s ease; }
        .v2ft a:hover { color: ${T.gold}; }
        .v2-foottoggle { display: none; }
        @media (max-width: 767px) {
          .v2-footgrid { grid-template-columns: 1fr !important; gap: 0 !important; padding-bottom: 20px !important; }
          .v2-footcol { border-top: 1px solid ${T.ruleDark}; }
          .v2-foottitle { padding: 15px 0 !important; margin-bottom: 0 !important; }
          .v2-foottoggle { display: block; }
          .v2-footlinks { display: none !important; padding-bottom: 12px; }
          .v2-footlinks[data-open="1"] { display: flex !important; }
          .v2-footbottom { flex-direction: column; gap: 14px !important; }
        }
      `}</style>
      <div className="v2ft">
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) repeat(5, minmax(0, 1fr))", gap: "clamp(20px, 2.4vw, 44px)", paddingBottom: 52, borderBottom: `1px solid ${T.ruleDark}` }} className="v2-footgrid">
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 23, letterSpacing: "0.26em", textTransform: "uppercase", color: "#FFFFFF" }}>McCulloch</div>
            <div style={{ fontSize: 8.5, letterSpacing: "0.44em", textTransform: "uppercase", color: T.onDarkMuted, margin: "5px 0 26px 3px" }}>Fine jewellery</div>
            <p style={{ margin: "0 0 20px", maxWidth: "32ch", fontSize: 13.5, lineHeight: 1.7 }}>£25 off your first order, plus new pieces before they reach the site.</p>
            <form onSubmit={onSubmit} style={{ display: "flex", maxWidth: 320, borderBottom: `1px solid ${T.ruleDarkStrong}` }}>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: "#EDE7DC", fontFamily: FONT_BODY, fontSize: 13.5, padding: "11px 0" }} />
              <button type="submit" style={{ background: "transparent", border: 0, color: "#EDE7DC", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", padding: "11px 0 11px 16px" }}>Sign up</button>
            </form>
          </div>

          {columns.map(col => {
            const open = foot === col.title;
            return (
              <div key={col.title} className="v2-footcol">
                <button className="v2-foottitle" onClick={() => setFoot(open ? null : col.title)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: 0, padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.onDarkMuted, marginBottom: 7 }}>
                  <span>{col.title}</span>
                  <span className="v2-foottoggle" style={{ color: T.gold, fontSize: 16, lineHeight: 1, transform: open ? "rotate(45deg)" : "none", transition: "transform 0.28s ease" }}>+</span>
                </button>
                <div className="v2-footlinks" data-open={open ? "1" : "0"} style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 13 }}>
                  {col.links.map(l => (
                    l.external
                      ? <a key={l.label} href={l.to} target="_blank" rel="noreferrer">{l.label}</a>
                      : <Link key={l.label} to={l.to}>{l.label}</Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="v2-footbottom" style={{ display: "flex", justifyContent: "space-between", gap: 20, paddingTop: 22, fontSize: 10.5, letterSpacing: "0.08em", color: T.onDarkMuted, flexWrap: "wrap" }}>
          <span>© {new Date().getFullYear()} Andrew McCulloch Jewellers — 7 The Square, Beeston, Nottingham · 0115 925 7552</span>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <Link to="/privacy">Privacy</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/trust-guarantees">Guarantees</Link>
          </div>
        </div>
        <div style={{ paddingTop: 14, fontSize: 10, letterSpacing: "0.06em", color: T.onDarkMuted, lineHeight: 1.6 }}>
          Beeston Jewellers Ltd, registered in England &amp; Wales No. 10915704. VAT No. 275322603. Registered office: 7 The Square, Beeston, Nottinghamshire, NG9 2JG.
        </div>
      </div>
    </footer>
  );
};

export default FooterV2;
