import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { INFO_PAGES, FAQS } from "../content/infoPages";

/**
 * InfoPageV2 — one reusable template for every informational / legal / guide page.
 * Content is generated verbatim from the client's Website Essentials.ods
 * (src/content/infoPages.ts). Pass a `slug` that keys INFO_PAGES, or slug="faqs"
 * to render the grouped FAQ accordion.
 */

const NAV_H = 96;
const pageX = "clamp(24px, 4vw, 64px)";
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };

const Shell = ({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }): JSX.Element => (
  <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
    <NavigationV2 solid />
    <div style={{ paddingTop: NAV_H }}>
      <div style={{ display: "flex", gap: 10, padding: "18px clamp(24px, 3vw, 52px)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8377" }}>
        <Link to="/">Home</Link><span>/</span><span style={{ color: T.ink }}>{title}</span>
      </div>
      <section style={{ maxWidth: 820, margin: "0 auto", padding: `clamp(16px,2vw,32px) ${pageX} clamp(28px,3vw,44px)` }}>
        <div style={{ ...eyebrow, marginBottom: 16 }}>{kicker}</div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(38px, 4.6vw, 68px)", lineHeight: 1.02, letterSpacing: "0.005em", margin: 0 }}>{title}</h1>
      </section>
      <section style={{ maxWidth: 820, margin: "0 auto", padding: `0 ${pageX} clamp(56px,6vw,96px)` }}>
        {children}
      </section>
    </div>
    <FooterV2 />
  </div>
);

const KICKERS: Record<string, string> = {
  privacy: "Legal", terms: "Legal", cookies: "Legal",
  delivery: "Customer care", returns: "Customer care", warranty: "Customer care",
  repairs: "Customer care", "book-appointment": "Visit us",
  "ring-size-guide": "Guide", "diamond-guide": "Guide", "gemstone-guide": "Guide",
  "birthstone-guide": "Guide", "hallmark-guide": "Guide", "jewellery-care": "Guide",
  sustainability: "Our company", "certificate-of-authenticity": "Our company",
};

const heading: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(22px,2.4vw,32px)", lineHeight: 1.15, color: T.ink, margin: "0 0 14px" };
const para: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.8, color: T.body, margin: "0 0 14px", maxWidth: "68ch" };

const FaqAccordion = (): JSX.Element => {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      {FAQS.map((group) => (
        <div key={group.category} style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.gold, marginBottom: 12 }}>{group.category}</div>
          {group.items.map((it) => {
            const id = group.category + "::" + it.q;
            const isOpen = open === id;
            return (
              <div key={id} style={{ borderTop: `1px solid ${T.rule}` }}>
                <button onClick={() => setOpen(isOpen ? null : id)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%", padding: "18px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_DISPLAY, fontSize: "clamp(17px,1.8vw,21px)", color: T.ink }}>
                  <span>{it.q}</span>
                  <span style={{ fontSize: 20, color: "#8A8377", flex: "none" }}>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && <p style={{ ...para, padding: "0 0 20px" }}>{it.a}</p>}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 28, marginTop: 8 }}>
        <p style={para}>Didn’t find what you were looking for? <Link to="/contact" style={{ color: T.ink, borderBottom: `1px solid ${T.ruleStrong}` }}>Contact our team</Link> and we’ll be happy to help.</p>
      </div>
    </>
  );
};

const InfoPageV2 = ({ slug }: { slug: string }): JSX.Element => {
  useEffect(() => { window.scrollTo(0, 0); document.body.style.background = T.paper; }, [slug]);

  if (slug === "faqs") {
    return <Shell title="Frequently asked questions" kicker="Help & support"><FaqAccordion /></Shell>;
  }

  const page = INFO_PAGES[slug];
  if (!page) {
    return (
      <Shell title="Page not found" kicker="McCulloch">
        <p style={para}>We couldn’t find that page. <Link to="/" style={{ color: T.ink, borderBottom: `1px solid ${T.ruleStrong}` }}>Return home</Link>.</p>
      </Shell>
    );
  }

  return (
    <Shell title={page.title} kicker={KICKERS[slug] || "McCulloch"}>
      {page.sections.map((s, i) => (
        <div key={i} style={{ marginBottom: 30 }}>
          {s.heading && <h2 style={heading}>{s.heading}</h2>}
          {s.paras.map((p, j) => <p key={j} style={para}>{p}</p>)}
          {s.bullets.length > 0 && (
            <ul style={{ margin: "4px 0 8px", paddingLeft: 0, listStyle: "none" }}>
              {s.bullets.map((b, j) => (
                <li key={j} style={{ display: "flex", gap: 12, fontSize: 15.5, lineHeight: 1.7, color: T.body, marginBottom: 9 }}>
                  <span style={{ color: T.gold, flex: "none", marginTop: 1 }}>—</span><span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {page.table && page.table.length > 0 && (
        <div style={{ overflowX: "auto", margin: "8px 0 24px", border: `1px solid ${T.rule}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 420 }}>
            <thead>
              <tr>
                {page.table[0].map((h, i) => (
                  <th key={i} style={{ textAlign: "left", padding: "12px 16px", background: T.tint, borderBottom: `1px solid ${T.rule}`, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.muted, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.table.slice(1).map((row, ri) => (
                <tr key={ri}>
                  {row.map((c, ci) => (
                    <td key={ci} style={{ padding: "11px 16px", borderBottom: ri === page.table!.length - 2 ? "none" : `1px solid ${T.rule}`, color: ci === 0 ? T.ink : T.body }}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 28, marginTop: 12, display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Link to="/contact" style={{ padding: "13px 26px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Contact us</Link>
        <Link to="/customer-service" style={{ padding: "13px 26px", border: `1px solid ${T.ruleStrong}`, color: T.ink, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Customer service</Link>
      </div>
    </Shell>
  );
};

export default InfoPageV2;
