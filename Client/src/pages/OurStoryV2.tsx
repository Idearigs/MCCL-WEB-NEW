import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * Our Story — light redesign (Nov 2026).
 * Centred opening over the Grand Hotel photograph, the house beside the founder's
 * portrait, the first shop, the family line as a drawn timeline on the page's one
 * sand band, two framed archive pieces, how we work, sourcing and a visit block.
 * CONTENT is unchanged: the owner's own account of the de Silva family (jewellers since
 * 1895, J. A. de Silva at the Grand Hotel, Nuwara Eliya; Hasita de Silva, fifth
 * generation, took on Andrew McCulloch's in 2017). Archive photos live in
 * public/images (NOT under /our-story/, which collides with the SPA route).
 * Previous version preserved in git history.
 */

const pageX = "clamp(20px, 4vw, 64px)";
const eyebrow: React.CSSProperties = { fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text };
const h2: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(26px, 2.6vw, 38px)", lineHeight: 1.18, margin: 0, color: T.text };
const para: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.8, color: T.text, margin: 0 };

// Real milestones from the owner's account of the de Silva family's history.
const GENERATIONS = [
  { year: "1895", name: "J. A. de Silva", role: "The first jewellers", note: "J. A. de Silva opens his first jewellers inside the Grand Hotel in Nuwara Eliya, Sri Lanka, where it remains to this day." },
  { year: "Five", name: "A family of jewellers", role: "Generations at the bench", note: "For five generations the de Silva family has handcrafted fine jewellery, creating pieces for everyone from royalty to young couples beginning a life together." },
  { year: "2017", name: "Hasita de Silva", role: "Nottingham", note: "Hasita de Silva, fifth-generation jeweller and great-grandson of J. A. de Silva, brings the family's legacy of handcrafted jewellery to Nottingham, taking on Andrew McCulloch's." },
  { year: "Today", name: "Andrew McCulloch", role: "A fixture of the community", note: "The store is a fixture of the local community, providing bespoke pieces, repairs and watch services, with every commission made by hand." },
];

const PRINCIPLES = [
  "No finished stock; every piece is made to order",
  "Nothing outsourced; designed and made on our own bench",
  "Certified stones only, with documentation",
  "Servicing for life, by the people who made it",
];

const OurStoryV2 = (): JSX.Element => {
  // Section entrances, same behaviour as the home page.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const targets = Array.from(rootRef.current?.querySelectorAll(".v2-reveal, .v2-stagger") ?? []);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { targets.forEach((t) => t.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="os" style={{ background: T.cream, minHeight: "100vh", fontFamily: FONT_BODY, color: T.text, overflowX: "clip", paddingTop: "var(--v2nav-h, 113px)" }}>
      <style>{`
        .os a { color: inherit; text-decoration: none; }
        .os-wrap { max-width: 1320px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }
        .os-sec { padding-top: clamp(56px, 6.5vw, 104px); padding-bottom: clamp(56px, 6.5vw, 104px); }

        /* entrances */
        @keyframes osRise { from { opacity: 0; transform: translateY(20px); } }
        @keyframes osUnveil { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
        @keyframes osSettle { from { transform: scale(1.1); } }
        .os .v2-reveal:not(.is-in), .os .v2-stagger:not(.is-in) > * { opacity: 0; }
        .os .v2-reveal.is-in, .os .v2-stagger.is-in > * { animation: osRise 1.1s cubic-bezier(0.22,1,0.36,1) backwards; }
        .os .v2-rv-mask.is-in { animation: osUnveil 1.5s cubic-bezier(0.7,0,0.2,1) backwards; }
        .os .v2-rv-mask.is-in > img { animation: osSettle 2.4s cubic-bezier(0.22,1,0.36,1) backwards; }
        .os .v2-reveal-d1.is-in { animation-delay: 0.14s; }
        .os .v2-stagger.is-in > :nth-child(2) { animation-delay: 0.12s; }
        .os .v2-stagger.is-in > :nth-child(3) { animation-delay: 0.24s; }
        .os .v2-stagger.is-in > :nth-child(4) { animation-delay: 0.36s; }
        .os .v2-stagger.is-in > :nth-child(n+5) { animation-delay: 0.48s; }

        .os-btn { display: inline-block; padding: 16px 30px; background: ${T.ink}; color: ${T.cream} !important; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
        .os-btn:hover { background: ${T.text}; }
        .os-textlink { display: inline-block; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; border-bottom: 1px solid ${T.ruleStrong}; padding: 14px 0 5px; transition: border-color 0.2s ease; }
        .os-textlink:hover { border-bottom-color: ${T.gold}; }

        /* 1 — opening */
        .os-open { text-align: center; padding-top: clamp(30px, 3.4vw, 52px); padding-bottom: clamp(36px, 4vw, 60px); }
        .os-crumb { display: flex; justify-content: center; gap: 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: clamp(30px, 4vw, 56px); }
        .os-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(34px, 4.2vw, 60px); line-height: 1.1; margin: 0; color: ${T.text}; text-wrap: balance; }
        .os-since { display: inline-flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .os-since::before, .os-since::after { content: ""; width: 28px; height: 1px; background: ${T.gold}; }
        .os-hotel { position: relative; aspect-ratio: 2.35 / 1; overflow: hidden; background: ${T.sand}; }
        .os-hotel img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 42%; display: block; }
        .os-cap { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 12px clamp(24px, 5vw, 88px); align-items: baseline; padding: 20px 0 0; }

        /* frames for the archive photographs */
        .os-frame { margin: 0; padding: clamp(8px, 1vw, 14px); background: ${T.cream}; border: 1px solid ${T.line}; box-shadow: 0 26px 50px -34px rgba(28,26,23,0.42); }
        .os-frame img { width: 100%; height: auto; display: block; }
        .os-frame figcaption { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; padding: 14px 2px 4px; }

        /* 2 — the house / 3 — the first shop */
        .os-house { display: grid; grid-template-columns: minmax(0, 0.72fr) minmax(0, 1fr); gap: clamp(32px, 6vw, 104px); align-items: center; }
        .os-shop { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.86fr); gap: clamp(32px, 6vw, 104px); align-items: center; border-top: 1px solid ${T.line}; }

        /* 4 — the line */
        .os-linesec { background: ${T.sand}; }
        .os-linetop { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(24px, 5vw, 88px); align-items: end; }
        .os-line { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); column-gap: clamp(20px, 3vw, 48px); margin-top: clamp(44px, 5vw, 72px); padding-top: 40px; }
        .os-line::before, .os-line::after { content: ""; position: absolute; left: 0; right: 0; top: 4px; height: 1px; background: ${T.ruleStrong}; }
        .os-line::after { background: ${T.gold}; transform: scaleX(0); transform-origin: left; transition: transform 2.2s cubic-bezier(0.22,1,0.36,1) 0.3s; }
        .os-line.is-in::after { transform: scaleX(1); }
        .os-gen { position: relative; }
        .os-gen::before { content: ""; position: absolute; left: 0; top: -40px; width: 8px; height: 8px; background: ${T.sand}; border: 1px solid ${T.gold}; transform: rotate(45deg); transform-origin: center; z-index: 1; }
        .os-year { font-family: ${FONT_DISPLAY}; font-size: clamp(30px, 2.9vw, 42px); line-height: 1; color: ${T.text}; }

        /* 5 — archive */
        .os-arch { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr); gap: clamp(32px, 6vw, 104px); align-items: center; margin-top: clamp(40px, 5vw, 72px); }
        .os-arch.is-flip > :first-child { order: 2; }
        .os-quote { font-family: ${FONT_DISPLAY}; font-size: clamp(20px, 1.9vw, 26px); line-height: 1.4; color: ${T.text}; margin: 0; text-wrap: pretty; }
        .os-mark { display: block; width: 28px; height: 1px; background: ${T.gold}; margin: 22px 0; }

        /* 6 — how we work */
        .os-work { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr); gap: clamp(32px, 6vw, 104px); align-items: center; border-top: 1px solid ${T.line}; }
        .os-rule { display: grid; grid-template-columns: 44px 1fr; align-items: baseline; padding: 16px 0; border-top: 1px solid ${T.line}; font-size: 15px; line-height: 1.5; color: ${T.text}; }
        .os-rule span:first-child { font-size: 11.5px; letter-spacing: 0.14em; color: ${T.textMuted}; }
        .os-bench { aspect-ratio: 4 / 5; overflow: hidden; background: ${T.sand}; }
        .os-bench img, .os-visitimg img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* 7 — sourcing / 8 — visit */
        .os-source { text-align: center; border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .os-visit { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 6vw, 104px); align-items: center; }
        .os-visitimg { aspect-ratio: 5 / 4; overflow: hidden; background: ${T.sand}; }
        .os-addr { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 28px; padding: 24px 0; border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .os-lab { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: 8px; }

        @media (max-width: 900px) {
          .os-house, .os-shop, .os-linetop, .os-arch, .os-work, .os-visit, .os-cap { grid-template-columns: 1fr; }
          .os-linetop { gap: 16px; }
          .os-house .os-frame { max-width: 380px; }
          .os-shop > :first-child { order: 2; }
          .os-arch.is-flip > :first-child { order: 0; }
          .os-work .os-bench { order: -1; }
          .os-hotel { aspect-ratio: 4 / 3; margin: 0 calc(-1 * ${pageX}); }
          /* the line turns upright */
          .os-line { grid-template-columns: 1fr; padding-top: 0; padding-left: 30px; row-gap: 38px; }
          .os-line::before, .os-line::after { left: 4px; right: auto; top: 8px; bottom: 8px; width: 1px; height: auto; }
          .os-line::after { transform: scaleY(0); transform-origin: top; }
          .os-line.is-in::after { transform: scaleY(1); }
          .os-gen::before { left: -30px; top: 12px; }
        }
        @media (max-width: 640px) {
          .os-actions { flex-direction: column; align-items: stretch !important; }
          .os-actions .os-textlink { align-self: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) {
          .os .v2-reveal, .os .v2-stagger > * { opacity: 1 !important; animation: none !important; }
          .os .v2-rv-mask > * { animation: none !important; }
          .os-line::after { transition: none; transform: none; }
        }
      `}</style>

      <NavigationV2 solid />

      {/* 1 — Opening */}
      <section className="os-wrap">
        <div className="os-open v2-stagger">
          <div className="os-crumb"><Link to="/">Home</Link><span>/</span><span style={{ color: T.text }}>Our story</span></div>
          <div><span className="os-since" style={eyebrow}>Since 1895</span></div>
          <h1 className="os-h1">Five generations of jewellers.</h1>
          <p style={{ ...para, maxWidth: "58ch", margin: "22px auto 0" }}>
            The de Silva family has been in the jewellery world since 1895, from a first shop inside the Grand Hotel in Nuwara Eliya, Sri Lanka, to a bench in Nottingham today, making and mending fine jewellery by hand.
          </p>
        </div>
        <div className="os-hotel v2-reveal v2-rv-mask">
          <img src="/images/grand-hotel.jpg" alt="The Grand Hotel, Nuwara Eliya, Sri Lanka, where J. A. de Silva opened his first jewellers in 1895" />
        </div>
        <div className="os-cap v2-stagger">
          <div>
            <div style={{ ...eyebrow, marginBottom: 10 }}>Where it began</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(21px, 1.9vw, 26px)", lineHeight: 1.25, color: T.text }}>The Grand Hotel, Nuwara Eliya.</div>
          </div>
          <p style={{ ...para, maxWidth: "50ch" }}>Where J. A. de Silva opened his first jewellers in 1895, and where it remains to this day.</p>
        </div>
      </section>

      {/* 2 — The house */}
      <section className="os-wrap os-sec">
        <div className="os-house">
          <figure className="os-frame v2-reveal">
            <img src="/images/desilva-founder.jpg" alt="Mr. J. A. de Silva, founder of J. A. de Silva Jewellers, 1895" loading="lazy" />
            <figcaption>Mr. J. A. de Silva · Founder, 1895</figcaption>
          </figure>
          <div className="v2-stagger">
            <div style={{ ...eyebrow, marginBottom: 18 }}>The house</div>
            <h2 style={h2}>From Nuwara Eliya to Nottingham.</h2>
            <p style={{ ...para, maxWidth: "56ch", marginTop: 22 }}>
              In 1895, J. A. de Silva opened his first jewellers inside the Grand Hotel in Nuwara Eliya, Sri Lanka, where it remains to this day. Our resident jeweller, Hasita de Silva, is a fifth-generation jeweller and the great-grandson of J. A. de Silva.
            </p>
            <p style={{ ...para, maxWidth: "56ch", marginTop: 16 }}>
              Over more than a century the de Silva family has created countless pieces for everyone from royalty to young couples looking to begin a life together. It is the same handcrafted work, carried down through five generations.
            </p>
            <p style={{ ...para, maxWidth: "56ch", marginTop: 16 }}>
              Hasita brought his family's legacy of handcrafted jewellery to Nottingham after taking on Andrew McCulloch's in 2017. Today the store is a fixture of the local community, providing bespoke pieces, repairs and watch services.
            </p>
          </div>
        </div>
      </section>

      {/* 3 — The first shop */}
      <section className="os-wrap">
        <div className="os-shop os-sec">
          <div className="v2-stagger">
            <div style={{ ...eyebrow, marginBottom: 18 }}>The first shop</div>
            <h2 style={h2}>J. A. de Silva Jewellers.</h2>
            <p style={{ ...para, maxWidth: "52ch", marginTop: 22 }}>
              Watches, clocks and jewellery; engagement and wedding rings; repairs, valuations and engraving. The original de Silva shopfront, where a tradition of handcrafted fine jewellery began, and one we still carry on by hand in Nottingham today.
            </p>
          </div>
          <figure className="os-frame v2-reveal">
            <img src="/images/desilva-shopfront.jpg" alt="The original J. A. de Silva Jewellers shopfront: watches, clocks and jewellery, engagement and wedding rings" loading="lazy" />
          </figure>
        </div>
      </section>

      {/* 4 — The line: the page's one sand band */}
      <section className="os-linesec">
        <div className="os-wrap os-sec">
          <div className="os-linetop v2-stagger">
            <div>
              <div style={{ ...eyebrow, marginBottom: 18 }}>The line</div>
              <h2 style={h2}>One family, five generations.</h2>
            </div>
            <p style={{ ...para, maxWidth: "54ch" }}>
              From a first shop in Nuwara Eliya in 1895 to Andrew McCulloch's in Nottingham today, the de Silva family has kept the same craft and the same personal service, passed hand to hand, generation to generation.
            </p>
          </div>
          <div className="os-line v2-stagger">
            {GENERATIONS.map((g) => (
              <div key={g.year} className="os-gen">
                <div className="os-year">{g.year}</div>
                <div style={{ fontSize: 16, color: T.text, marginTop: 18 }}>{g.name}</div>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, marginTop: 6 }}>{g.role}</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: T.text, margin: "14px 0 0", maxWidth: "36ch" }}>{g.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — From the archive */}
      <section className="os-wrap os-sec">
        <div className="v2-stagger" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
          <div style={{ ...eyebrow, marginBottom: 18 }}>From the archive</div>
          <h2 style={h2}>Names in the ledger.</h2>
          <p style={{ ...para, marginTop: 20 }}>
            The de Silva family has served notable customers across its history, among them Wilhelm, the German Crown Prince and great-great grandson of Queen Victoria, and Lord &amp; Lady Willingdon, Governor of Madras from 1919 to 1924.
          </p>
        </div>

        <div className="os-arch">
          <figure className="os-frame v2-reveal">
            <img src="/images/wilhelm-1911.jpg" alt="Wilhelm, the German Crown Prince, photographed at Queen's College, Nuwara Eliya, beside his 1911 note referring to pieces bought from De Silva" loading="lazy" />
          </figure>
          <div className="v2-stagger">
            <div style={{ ...eyebrow }}>1911</div>
            <span className="os-mark" />
            <p className="os-quote">“I have bought a number of pieces from De Silva, and at a very fair price.”</p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T.textMuted, margin: "12px 0 0" }} lang="de">“Ich habe einige Sachen preiswert bei De Silva gekauft.”</p>
            <div style={{ marginTop: 26, fontSize: 15, color: T.text }}>Wilhelm, German Crown Prince</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: T.textMuted, marginTop: 6 }}>
              Great-great-grandson of Queen Victoria<br />
              Queen’s College, Nuwara Eliya · 21 November 1911
            </div>
          </div>
        </div>

        <div className="os-arch is-flip">
          <figure className="os-frame v2-reveal">
            <img src="/images/willingdon-1921.jpg" alt="Framed portrait of H.E. Lord Willingdon, Governor of Madras, and Lady Willingdon, beside a 1921 note endorsing J. A. de Silva & Co." loading="lazy" />
          </figure>
          <div className="v2-stagger">
            <div style={{ ...eyebrow }}>1921</div>
            <span className="os-mark" />
            <p className="os-quote">“I have bought a number of pieces from J. A. de Silva &amp; Co. for Their Excellencies and have found them most satisfactory &amp; their prices quite moderate.”</p>
            <div style={{ marginTop: 26, fontSize: 15, color: T.text }}>For H.E. Lord Willingdon, Governor of Madras, &amp; Lady Willingdon</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.65, color: T.textMuted, marginTop: 6 }}>
              Capt. D. Bonall, A.D.C. to H.E. the Governor of Madras<br />
              The Queen’s Cottage, Nuwara Eliya · 19 August 1921
            </div>
          </div>
        </div>
      </section>

      {/* 6 — How we work */}
      <section className="os-wrap">
        <div className="os-work os-sec">
          <div className="v2-stagger">
            <div style={{ ...eyebrow, marginBottom: 18 }}>How we work</div>
            <h2 style={h2}>Made to order, without exception.</h2>
            <p style={{ ...para, maxWidth: "52ch", marginTop: 22 }}>
              A few rules do not change here. They make the work slower and the workshop smaller than it could be, which is the point.
            </p>
            <div style={{ marginTop: 30, borderBottom: `1px solid ${T.line}`, maxWidth: 560 }}>
              {PRINCIPLES.map((x, i) => (
                <div key={x} className="os-rule"><span>{`0${i + 1}`}</span><span>{x}</span></div>
              ))}
            </div>
          </div>
          <div className="os-bench v2-reveal v2-rv-mask">
            <img src="/images/at-the-bench.jpg" alt="A McCulloch jeweller setting a diamond into a gold ring at the workbench" loading="lazy" />
          </div>
        </div>
      </section>

      {/* 7 — Sourcing */}
      <section className="os-wrap">
        <div className="os-source os-sec">
          <div className="v2-stagger" style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ ...eyebrow, marginBottom: 22 }}>Sourcing</div>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(24px, 2.6vw, 38px)", lineHeight: 1.25, color: T.text, margin: 0, textWrap: "balance" } as React.CSSProperties}>
              We only set a stone we would be happy to inherit.
            </p>
            <p style={{ ...para, maxWidth: 620, margin: "24px auto 0" }}>
              Larger diamonds come with an independent grading report from a recognised laboratory such as GIA, IGI or HRD, and every bespoke commission is supplied with our own Certificate of Authenticity recording its details. Where a client brings their own stone, we assess and advise honestly before anything is set.
            </p>
          </div>
        </div>
      </section>

      {/* 8 — Visit */}
      <section className="os-wrap os-sec">
        <div className="os-visit">
          <div className="os-visitimg v2-reveal v2-rv-mask">
            <img src="/images/shopfront-2-upscaled.webp" alt="McCulloch showroom, Beeston" loading="lazy" />
          </div>
          <div className="v2-stagger">
            <div style={{ ...eyebrow, marginBottom: 18 }}>Visit</div>
            <h2 style={h2}>Come and see the bench.</h2>
            <p style={{ ...para, maxWidth: "50ch", marginTop: 20 }}>
              You’re welcome to visit the showroom in Beeston, to talk through a commission, bring in a piece, or simply see how the work is done.
            </p>
            <div className="os-addr">
              <div>
                <div className="os-lab">Address</div>
                <div style={{ fontSize: 14.5, color: T.text, lineHeight: 1.6 }}>7 The Square, Beeston<br />Nottingham NG9 2JG</div>
              </div>
              <div>
                <div className="os-lab">Opening hours</div>
                <div style={{ fontSize: 14.5, color: T.text, lineHeight: 1.6 }}>Mon to Sat, 9 to 5:30<br /><span style={{ color: T.textMuted }}>Sunday closed</span></div>
              </div>
            </div>
            <div className="os-actions" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px 30px", marginTop: 28 }}>
              <Link to="/contact" className="os-btn">Book an appointment</Link>
              <Link to="/bespoke-design" className="os-textlink">Start a commission</Link>
            </div>
          </div>
        </div>
      </section>

      <FooterV2 />
    </div>
  );
};

export default OurStoryV2;
