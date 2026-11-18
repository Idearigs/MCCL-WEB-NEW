import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND } from "../components/home-v2/listingShared";

/**
 * Customer Service, light redesign (Nov 2026). The old page still used the previous site's
 * navigation, footer, grey panels and a third font. This one is in the same family as the
 * information pages: a centred opening, the seven services listed beside the text on a laptop,
 * and each service as one numbered section between hairlines.
 *
 * The wording is the old page's own, kept as it was apart from British spelling (jewellery,
 * personalised, modelling). The section ids are unchanged, so existing links such as
 * /customer-service#ring-resizing still land in the right place.
 */

interface Item { h: string; p?: string }
interface Service {
  id: string; title: string; intro?: string; points?: string[];
  columns?: Item[];                      // three short descriptions side by side
  stats?: { n: string; l: string }[];
  aside?: { title: string; items: Item[]; numbered?: boolean };
}

const SERVICES: Service[] = [
  {
    id: "bespoke-design", title: "Bespoke Design",
    intro: "Transform your vision into reality with our bespoke design service. Our master craftsmen work closely with you to create unique, one-of-a-kind pieces that reflect your personal style and celebrate your special moments.",
    points: ["Personal consultation and design development", "3D modelling and detailed sketches", "Expert craftsmanship and quality assurance", "Lifetime aftercare and maintenance"],
    aside: { title: "The Design Process", numbered: true, items: [
      { h: "Consultation", p: "Discuss your vision and preferences" },
      { h: "Design", p: "Create detailed sketches and 3D models" },
      { h: "Approval", p: "Review and refine the final design" },
      { h: "Creation", p: "Expert craftsmanship brings your piece to life" },
    ] },
  },
  {
    id: "jewellery-repair", title: "Jewellery Repair",
    columns: [
      { h: "Expert Restoration", p: "Our skilled craftsmen can restore vintage and damaged pieces to their former glory using traditional techniques." },
      { h: "Stone Replacement", p: "Professional replacement of lost or damaged gemstones with perfectly matched stones." },
      { h: "Metal Work", p: "Prong repair, chain fixing, clasp replacement, and comprehensive metalwork services." },
    ],
  },
  {
    id: "ring-resizing", title: "Ring Resizing",
    intro: "Professional ring resizing services to ensure the perfect fit. Our experienced jewellers can resize most rings while maintaining their structural integrity and design.",
    stats: [{ n: "24hrs", l: "Express Service" }, { n: "Free", l: "Size Assessment" }],
    aside: { title: "Resizing Services", items: [
      { h: "Standard Resizing", p: "Up to 2 sizes larger or smaller" },
      { h: "Complex Resizing", p: "Eternity bands and intricate designs" },
      { h: "Watch Resizing", p: "Bracelet and strap adjustments" },
      { h: "Chain Adjustment", p: "Necklace and bracelet length modifications" },
    ] },
  },
  {
    id: "valuations", title: "Valuations",
    intro: "Our certified gemologists provide accurate valuations for insurance, probate, or resale purposes using the latest industry standards and market values.",
    points: ["Insurance valuations", "Probate valuations", "Market value assessments", "Detailed written reports"],
    aside: { title: "Valuation Process", numbered: true, items: [
      { h: "Appointment Booking", p: "Schedule a convenient time for assessment" },
      { h: "Expert Examination", p: "Thorough analysis by certified gemologists" },
      { h: "Market Research", p: "Current market value assessment" },
      { h: "Written Report", p: "Detailed certificate with photographs" },
    ] },
  },
  {
    id: "cleaning-care", title: "Cleaning & Care",
    intro: "Professional cleaning and maintenance services to keep your jewellery looking its absolute best. Our specialised techniques restore brilliance and extend the life of your precious pieces.",
    points: ["Ultrasonic Cleaning", "Steam Cleaning", "Polish & Rhodium Plating", "Protective Coating Application"],
    aside: { title: "Care Tips", items: [
      { h: "Daily Care", p: "Store separately to prevent scratching" },
      { h: "Regular Cleaning", p: "Gentle soap and warm water cleaning" },
      { h: "Professional Service", p: "Annual professional cleaning recommended" },
    ] },
  },
  {
    id: "engraving-services", title: "Engraving Services",
    columns: [
      { h: "Hand Engraving", p: "Traditional hand engraving techniques for personalised messages, dates, and monograms with artistic flair." },
      { h: "Machine Engraving", p: "Precise machine engraving for consistent lettering and complex designs on various jewellery pieces." },
      { h: "Laser Engraving", p: "Advanced laser technology for intricate patterns, photographs, and detailed artwork engraving." },
    ],
  },
  {
    id: "gift-wrapping", title: "Gift Wrapping",
    intro: "Elegant presentation for your special gifts. Our luxury gift wrapping service ensures your jewellery is beautifully presented for any occasion.",
    points: ["Luxury gift boxes", "Premium wrapping paper", "Personalised gift cards", "Ribbon and bow finishing"],
    aside: { title: "Special Occasions", items: [{ h: "Engagements" }, { h: "Weddings" }, { h: "Anniversaries" }, { h: "Birthdays" }, { h: "Graduations" }, { h: "Corporate Gifts" }] },
  },
];

const pageX = "clamp(20px, 4vw, 64px)";

const CustomerService = (): JSX.Element => {
  useEffect(() => {
    // Auto-scroll to section if hash is present in URL
    if (window.location.hash) {
      const element = document.getElementById(window.location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="cs" style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh", paddingTop: "var(--v2nav-h, 113px)", overflowX: "clip" }}>
      <style>{`
        .cs a { color: inherit; text-decoration: none; }
        .cs-wrap { max-width: 1240px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }
        .cs-eyebrow { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
        @keyframes csRise { from { opacity: 0; transform: translateY(16px); } }
        .cs-open { text-align: center; padding-top: clamp(26px, 3vw, 44px); padding-bottom: clamp(36px, 4.4vw, 60px); }
        .cs-open > * { animation: csRise 0.9s cubic-bezier(0.22,1,0.36,1) backwards; }
        .cs-open > :nth-child(3) { animation-delay: 0.1s; } .cs-open > :nth-child(4) { animation-delay: 0.2s; }
        .cs-crumb { display: flex; justify-content: center; gap: 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: clamp(26px, 3.4vw, 48px); }
        .cs-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(38px, 5vw, 72px); line-height: 1.05; margin: 14px 0 0; color: ${T.text}; }
        .cs-h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(26px, 2.6vw, 36px); line-height: 1.16; margin: 0; color: ${T.text}; }
        .cs-h3 { font-family: ${FONT_BODY}; font-weight: 400; font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 6px; color: ${T.text}; }
        .cs-p { font-size: 15.5px; line-height: 1.8; color: ${T.text}; margin: 0; }

        .cs-jump { display: flex; justify-content: center; flex-wrap: wrap; gap: 0 clamp(18px, 2.6vw, 38px); border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .cs-jump a { position: relative; padding: 18px 0 17px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.textMuted}; white-space: nowrap; transition: color 0.2s ease; }
        .cs-jump a::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: ${T.gold}; transform: scaleX(0); transition: transform 0.3s ease; }
        .cs-jump a:hover { color: ${T.text}; }
        .cs-jump a:hover::after { transform: scaleX(1); }

        .cs-svc { scroll-margin-top: calc(var(--v2nav-h, 113px) + 20px); display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(28px, 6vw, 104px); align-items: start; padding: clamp(44px, 5.4vw, 84px) 0; border-bottom: 1px solid ${T.line}; }
        .cs-svc.is-cols { grid-template-columns: minmax(0, 1fr); gap: clamp(24px, 3vw, 40px); }
        .cs-num { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; font-size: 12px; letter-spacing: 0.16em; color: ${T.textMuted}; font-variant-numeric: tabular-nums; }
        .cs-num::after { content: ""; width: 36px; height: 1px; background: ${T.gold}; }
        .cs-points { list-style: none; margin: 22px 0 0; padding: 0; display: grid; gap: 11px; }
        .cs-points li { display: flex; align-items: baseline; gap: 13px; font-size: 15.5px; line-height: 1.6; color: ${T.text}; }
        .cs-points svg { flex: none; transform: translateY(-1px); }
        .cs-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); max-width: 420px; margin-top: 28px; border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .cs-stats div { padding: 20px 0; text-align: center; border-left: 1px solid ${T.line}; }
        .cs-stats div:first-child { border-left: 0; }
        .cs-stats b { display: block; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 28px; line-height: 1.1; color: ${T.text}; }
        .cs-stats span { display: block; margin-top: 8px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }
        .cs-list { list-style: none; margin: 14px 0 0; padding: 0; border-top: 1px solid ${T.line}; counter-reset: cs; }
        .cs-list li { display: grid; grid-template-columns: minmax(0, 1fr); gap: 4px; padding: 16px 0; border-bottom: 1px solid ${T.line}; }
        .cs-list.is-numbered li { grid-template-columns: 34px minmax(0, 1fr); counter-increment: cs; }
        .cs-list.is-numbered li::before { content: counter(cs); grid-row: 1 / 3; font-family: ${FONT_DISPLAY}; font-size: 20px; line-height: 1.2; color: ${T.text}; }
        .cs-list b { font-weight: 400; font-size: 16px; color: ${T.text}; }
        .cs-list span { font-size: 14.5px; line-height: 1.6; color: ${T.textMuted}; }
        .cs-list.is-plain { display: grid; grid-template-columns: 1fr 1fr; column-gap: 28px; }
        .cs-cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid ${T.line}; }
        .cs-cols > div { padding: 24px clamp(16px, 2.4vw, 34px) 0; border-left: 1px solid ${T.line}; }
        .cs-cols > div:first-child { padding-left: 0; border-left: 0; }
        .cs-cols b { display: block; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 21px; line-height: 1.25; margin-bottom: 10px; color: ${T.text}; }

        .cs-ask { background: ${T.sand}; }
        .cs-ask-in { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px 40px; padding-top: clamp(48px, 5.4vw, 80px); padding-bottom: clamp(48px, 5.4vw, 80px); }
        .cs-btn { display: inline-block; padding: 17px 34px; background: ${T.ink}; color: ${T.cream} !important; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
        .cs-btn:hover { background: ${T.text}; }
        .cs-link { display: inline-block; border-bottom: 1px solid ${T.ruleStrong}; padding-bottom: 4px; font-size: 11.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
        .cs-link:hover { border-bottom-color: ${T.gold}; }

        @media (max-width: 900px) {
          .cs-jump { justify-content: flex-start; flex-wrap: nowrap; overflow-x: auto; margin: 0 calc(-1 * ${pageX}); padding: 0 ${pageX}; gap: 0 26px; scrollbar-width: none; }
          .cs-jump::-webkit-scrollbar { display: none; }
          .cs-svc { grid-template-columns: minmax(0, 1fr); }
          .cs-cols { grid-template-columns: minmax(0, 1fr); border-top: 0; }
          .cs-cols > div { padding: 22px 0; border-left: 0; border-top: 1px solid ${T.line}; }
          .cs-cols > div:last-child { padding-bottom: 0; }
        }
        @media (max-width: 560px) { .cs-ask .cs-btn { width: 100%; } .cs-stats { max-width: none; } }
        @media (prefers-reduced-motion: reduce) { .cs-open > * { animation: none !important; } }
      `}</style>

      <NavigationV2 solid />

      <header className="cs-wrap">
        <div className="cs-open">
          <div className="cs-crumb"><Link to="/">Home</Link><span>/</span><span>Customer service</span></div>
          <div className="cs-eyebrow">Our services</div>
          <h1 className="cs-h1">Customer Service</h1>
          <p className="cs-p" style={{ maxWidth: "46ch", margin: "20px auto 0" }}>Exceptional service and expert craftsmanship for all your jewellery needs.</p>
        </div>
        <nav className="cs-jump" aria-label="Services">
          {SERVICES.map((s) => <a key={s.id} href={`#${s.id}`} data-goto={s.id} onClick={go(s.id)}>{s.title}</a>)}
        </nav>
      </header>

      <main className="cs-wrap">
        {SERVICES.map((s, i) => (
          <section key={s.id} id={s.id} className={`cs-svc${s.columns ? " is-cols" : ""}`}>
            <div>
              <div className="cs-num">{String(i + 1).padStart(2, "0")}</div>
              <h2 className="cs-h2">{s.title}</h2>
              {s.intro && <p className="cs-p" style={{ marginTop: 18, maxWidth: "52ch" }}>{s.intro}</p>}
              {s.points && (
                <ul className="cs-points">
                  {s.points.map((p) => <li key={p}><svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.3" /></svg>{p}</li>)}
                </ul>
              )}
              {s.stats && <div className="cs-stats">{s.stats.map((x) => <div key={x.l}><b>{x.n}</b><span>{x.l}</span></div>)}</div>}
            </div>

            {s.columns && (
              <div className="cs-cols">
                {s.columns.map((c) => <div key={c.h}><b>{c.h}</b><p className="cs-p">{c.p}</p></div>)}
              </div>
            )}

            {s.aside && (
              <div>
                <h3 className="cs-h3">{s.aside.title}</h3>
                <ol className={`cs-list${s.aside.numbered ? " is-numbered" : ""}${s.aside.items.every((x) => !x.p) ? " is-plain" : ""}`}>
                  {s.aside.items.map((x) => <li key={x.h}><b>{x.h}</b>{x.p && <span>{x.p}</span>}</li>)}
                </ol>
              </div>
            )}
          </section>
        ))}
      </main>

      <section className="cs-ask">
        <div className="cs-wrap cs-ask-in">
          <div>
            <div className="cs-eyebrow">Need a hand?</div>
            <h2 className="cs-h2" style={{ marginTop: 14 }}>Speak to the workshop.</h2>
            <p className="cs-p" style={{ marginTop: 12 }}>Call 0115 925 7552, or come and see us at 7 The Square, Beeston.</p>
          </div>
          <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "16px 30px" }}>
            <Link to="/contact" className="cs-btn">Contact us</Link>
            <Link to="/book-appointment" className="cs-link">Book an appointment</Link>
          </span>
        </div>
      </section>

      <FooterV2 />
    </div>
  );
};

export default CustomerService;
