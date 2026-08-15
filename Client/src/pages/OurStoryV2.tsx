import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * Our Story — v2 redesign (design_handoff_mcculloch_bespoke_story_thankyou).
 * Title block, heritage imagery, the house, the real milestone line, how we work,
 * a sourcing statement and a visit block.
 * CONTENT: rewritten 2026-08-14 from the client's Website Essentials — Andrew McCulloch
 * Jewellers established in Beeston 1952; owned since 2017 by the de Silva family (Has de
 * Silva, a fifth-generation jeweller, BA Hons Univ. of Kent); Bespoke Jeweller of the Year
 * 2021. Original preserved at pages/OurStory.original.tsx.
 */

const NAV_H = 96;
const pageX = "clamp(24px, 4vw, 64px)";
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };

// Real milestones from the client's Website Essentials.
const GENERATIONS = [
  { year: "1952", name: "Andrew McCulloch Jewellers", role: "Established in Beeston", note: "A jeweller opens on The Square in Beeston, working to commission and looking after the town's jewellery — a trusted independent name for decades." },
  { year: "2017", name: "The de Silva family take over", role: "Current ownership", note: "Has de Silva — a fifth-generation jeweller — takes on the business, keeping the same bench and the same personal service the shop has always been known for." },
  { year: "Trained", name: "Has de Silva", role: "Founder & master jeweller", note: "BA (Hons) in Jewellery Design and Manufacturing at the University of Kent, then years with respected jewellers in Mayfair, London and in Winchester before leading the bench here." },
  { year: "2021", name: "Bespoke Jeweller of the Year", role: "Award", note: "Recognised for bespoke work — every commission designed and made by hand on our own bench in Beeston." },
];

const PRINCIPLES = [
  "No finished stock — every piece is made to order",
  "Nothing outsourced — designed and made on our own bench",
  "Certified stones only, with documentation",
  "Servicing for life, by the people who made it",
];

const OurStoryV2 = (): JSX.Element => {
  const p: React.CSSProperties = { fontSize: 16, color: T.body, lineHeight: 1.8, maxWidth: "54ch" };

  // Cinematic scroll reveal: fade/slide each [.os-rise] in as it enters view.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = Array.from(rootRef.current?.querySelectorAll(".os-rise, .os-hero, .os-draw, .os-kenwrap") ?? []);
    if (reduce) { targets.forEach(t => t.classList.add("in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.body }}>
      <style>{`
        .os-cta:hover { background: ${T.inkDeep} !important; }
        .os-outline:hover { background: ${T.tint} !important; }

        /* Cinematic reveal — slow, deep-eased fade + rise */
        .os-rise { opacity: 0; transform: translateY(34px); transition: opacity 1.1s cubic-bezier(0.19,1,0.22,1), transform 1.1s cubic-bezier(0.19,1,0.22,1); will-change: opacity, transform; }
        .os-rise.in { opacity: 1; transform: none; }
        .os-d1 { transition-delay: 0.12s; }
        .os-d2 { transition-delay: 0.24s; }
        .os-d3 { transition-delay: 0.36s; }
        .os-d4 { transition-delay: 0.48s; }

        /* Big title: settle in with a touch more travel + a subtle blur clearing */
        .os-hero { opacity: 0; transform: translateY(40px); filter: blur(6px); transition: opacity 1.3s cubic-bezier(0.19,1,0.22,1), transform 1.3s cubic-bezier(0.19,1,0.22,1), filter 1.3s cubic-bezier(0.19,1,0.22,1); }
        .os-hero.in { opacity: 1; transform: none; filter: none; }

        /* Hairline that draws itself under the title */
        .os-draw { transform: scaleX(0); transform-origin: left; transition: transform 1.2s cubic-bezier(0.19,1,0.22,1) 0.25s; }
        .os-draw.in { transform: scaleX(1); }

        /* Ken Burns: slow, perpetual drift on the full-bleed imagery */
        .os-ken { transform: scale(1.04); transition: transform 1.6s cubic-bezier(0.19,1,0.22,1); }
        .os-kenwrap.in .os-ken { animation: osKen 22s ease-in-out 0.2s infinite alternate; }
        @keyframes osKen { from { transform: scale(1.04); } to { transform: scale(1.14); } }

        @media (prefers-reduced-motion: reduce) {
          .os-rise, .os-hero, .os-draw { opacity: 1 !important; transform: none !important; filter: none !important; transition: none !important; }
          .os-kenwrap.in .os-ken { animation: none !important; transform: none !important; }
        }
        @media (max-width: 900px) {
          .os-title, .os-house, .os-work, .os-visit, .os-linetop { grid-template-columns: 1fr !important; }
          .os-title { row-gap: 18px; }
          .os-workimg { order: -1; }
          .os-fullimg { aspect-ratio: 4 / 3 !important; height: auto !important; }
          .os-gen { grid-template-columns: 1fr !important; row-gap: 4px; padding: 20px 0 !important; }
          .os-gen-year { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
          .os-addr2 { grid-template-columns: 1fr 1fr !important; }
          .os-visitbtns { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>

      <NavigationV2 solid />

      {/* 1 — Title block */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: `${NAV_H + 48}px ${pageX} clamp(36px, 4vw, 56px)` }}>
        <div className="os-title" style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "clamp(24px, 4vw, 72px)", alignItems: "baseline", paddingBottom: 30 }}>
          <div>
            <div className="os-rise" style={{ ...eyebrow, marginBottom: 20 }}>Since 1952</div>
            <h1 className="os-hero" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(44px, 5.4vw, 86px)", lineHeight: 1.02, color: T.ink, fontWeight: 400, margin: 0 }}>
              A family jeweller in Beeston.
            </h1>
          </div>
          <p className="os-rise os-d2" style={{ fontSize: 15.5, color: T.body, lineHeight: 1.75, alignSelf: "end" }}>
            An independent jeweller on The Square since 1952, owned since 2017 by the de Silva family — making and mending fine jewellery by hand, by people you can meet.
          </p>
        </div>
        <div className="os-draw" style={{ height: 1, background: T.rule }} />
      </section>

      {/* 2 — Full-bleed heritage image */}
      <div className="os-fullimg os-kenwrap" style={{ height: "clamp(400px, 58vh, 620px)", background: T.tint, overflow: "hidden" }}>
        <img className="os-ken" src="/images/desilva-family-upscaled.jpg" alt="The de Silva family at Andrew McCulloch Jewellers, Beeston" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* 3 — The house */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}` }}>
        <div className="os-house" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "clamp(32px, 5vw, 80px)", alignItems: "start" }}>
          <div className="os-rise">
            <div style={{ ...eyebrow, marginBottom: 16 }}>The house</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 3vw, 46px)", lineHeight: 1.08, color: T.ink, fontWeight: 400, margin: 0 }}>
              A workshop, not a chain.
            </h2>
          </div>
          <div className="os-rise os-d2">
            <p style={p}>
              Andrew McCulloch Jewellers has always been a bench before it was a shop. Every ring, every setting and every repair passes through the hands of the jewellers who work here — there is no central factory and no anonymous supplier.
            </p>
            <p style={{ ...p, marginTop: 18 }}>
              That is unusual now, and deliberately so. It means the person who designs your piece is the person who makes it, and the person you will see again when it needs looking after years from now.
            </p>
            <p style={{ ...p, marginTop: 18 }}>
              Traditional bench craftsmanship, alongside modern CAD design, on our own premises in Beeston — made and cared for with passion and precision.
            </p>
          </div>
        </div>
      </section>

      {/* 4 — The line */}
      <section style={{ background: T.ink, color: T.onDarkSoft }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}` }}>
          <div className="os-linetop" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "clamp(24px, 4vw, 72px)", alignItems: "center", paddingBottom: 36, borderBottom: `1px solid ${T.ruleDark}` }}>
            <div className="os-rise">
              <div style={{ ...eyebrow, marginBottom: 16 }}>The line</div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 3vw, 46px)", lineHeight: 1.08, color: "#F4EFE6", fontWeight: 400, margin: 0 }}>
                A Beeston name, in family hands.
              </h2>
            </div>
            <p className="os-rise os-d2" style={{ fontSize: 15.5, color: T.onDarkBody, lineHeight: 1.75, margin: 0 }}>
              Andrew McCulloch has been a Beeston jeweller since 1952. It is now owned by the de Silva family — jewellers for five generations — who have kept the same bench, and the same personal service, exactly where they should be.
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            {GENERATIONS.map((g, i) => (
              <div key={g.year} className={`os-gen os-rise os-d${Math.min(i + 1, 4)}`} style={{ display: "grid", gridTemplateColumns: "120px 0.9fr 1.4fr", gap: "clamp(16px, 3vw, 48px)", alignItems: "baseline", padding: "26px 0", borderTop: i === 0 ? "none" : `1px solid ${T.ruleDark}` }}>
                <div className="os-gen-year" style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: T.gold, lineHeight: 1 }}>
                  {g.year}
                  <span style={{ fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: T.onDarkMuted }} className="os-gen-role-m" />
                </div>
                <div>
                  <div style={{ fontSize: 16, color: "#F4EFE6" }}>{g.name}</div>
                  <div style={{ fontSize: 12.5, color: T.onDarkMuted, marginTop: 4 }}>{g.role}</div>
                </div>
                <p style={{ fontSize: 14.5, color: T.onDarkBody, lineHeight: 1.65, margin: 0 }}>{g.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — How we work */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}` }}>
        <div className="os-work" style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: "clamp(32px, 5vw, 80px)", alignItems: "center" }}>
          <div className="os-rise">
            <div style={{ ...eyebrow, marginBottom: 16 }}>How we work</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(30px, 3.4vw, 52px)", lineHeight: 1.06, color: T.ink, fontWeight: 400, margin: 0 }}>
              Made to order, without exception.
            </h2>
            <p style={{ fontSize: 15.5, color: T.body, lineHeight: 1.75, marginTop: 22 }}>
              A few rules do not change here. They make the work slower and the workshop smaller than it could be — which is the point.
            </p>
            <div style={{ marginTop: 28 }}>
              {PRINCIPLES.map((x, i) => (
                <div key={x} style={{ display: "grid", gridTemplateColumns: "36px 1fr", alignItems: "baseline", gap: 8, padding: "15px 0", borderTop: `1px solid ${T.rule}` }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: T.gold }}>{["I", "II", "III", "IV"][i]}</span>
                  <span style={{ fontSize: 15, color: T.body, lineHeight: 1.5 }}>{x}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="os-workimg os-rise os-d2" style={{ aspectRatio: "4 / 5", background: T.tint, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted, fontSize: 15 }}>
            At the bench
          </div>
        </div>
      </section>

      {/* 6 — Sourcing */}
      <section style={{ background: T.tint }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}`, textAlign: "center" }}>
          <div className="os-rise" style={{ ...eyebrow, marginBottom: 22 }}>Sourcing</div>
          <p className="os-rise os-d1" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(24px, 2.6vw, 38px)", lineHeight: 1.25, color: T.ink, fontWeight: 400, margin: 0 }}>
            We only set a stone we would be happy to inherit.
          </p>
          <p className="os-rise os-d2" style={{ fontSize: 15.5, color: T.body, lineHeight: 1.75, maxWidth: 620, margin: "24px auto 0" }}>
            Larger diamonds come with an independent grading report from a recognised laboratory such as GIA, IGI or HRD, and every bespoke commission is supplied with our own Certificate of Authenticity recording its details. Where a client brings their own stone, we assess and advise honestly before anything is set.
          </p>
        </div>
      </section>

      {/* 7 — Visit */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}` }}>
        <div className="os-visit" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(32px, 5vw, 80px)", alignItems: "center" }}>
          <div className="os-kenwrap" style={{ aspectRatio: "3 / 2", background: T.tint, overflow: "hidden" }}>
            <img className="os-ken" src="/images/shopfront-2-upscaled.webp" alt="McCulloch showroom, Beeston" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="os-rise os-d1">
            <div style={{ ...eyebrow, marginBottom: 16 }}>Visit</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 3vw, 46px)", lineHeight: 1.08, color: T.ink, fontWeight: 400, margin: 0 }}>
              Come and see the bench.
            </h2>
            <p style={{ fontSize: 15.5, color: T.body, lineHeight: 1.75, marginTop: 20 }}>
              You’re welcome to visit the showroom in Beeston — to talk through a commission, bring in a piece, or simply see how the work is done.
            </p>
            <div className="os-addr2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 28, padding: "24px 0", borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>Address</div>
                <div style={{ fontSize: 14.5, color: T.ink, lineHeight: 1.6 }}>7 The Square, Beeston<br />Nottingham NG9 2JG</div>
              </div>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>Opening hours</div>
                <div style={{ fontSize: 14.5, color: T.ink, lineHeight: 1.6 }}>Mon – Sat, 9 – 5:30<br /><span style={{ color: "#8A8377" }}>Sunday closed</span></div>
              </div>
            </div>
            <div className="os-visitbtns" style={{ display: "flex", gap: 14, marginTop: 26 }}>
              <Link to="/contact" className="os-cta" style={{ padding: "15px 30px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s", textAlign: "center" }}>Book an appointment</Link>
              <Link to="/bespoke-design" className="os-outline" style={{ padding: "15px 30px", background: "transparent", color: T.ink, border: `1px solid ${T.ruleStrong}`, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s", textAlign: "center" }}>Start a commission</Link>
            </div>
          </div>
        </div>
      </section>

      <FooterV2 />
    </div>
  );
};

export default OurStoryV2;
