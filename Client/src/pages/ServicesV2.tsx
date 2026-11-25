import React from "react";
import { Link, useParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import GoogleReviewsV2 from "../components/home-v2/GoogleReviewsV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND } from "../components/home-v2/listingShared";
import { SERVICES, type ServicePage } from "../content/services";

/**
 * ServicesV2 — the Services & aftercare section (owner's brief, Nov 2026): a landing page at
 * /services and one page per service at /services/:slug. Every service is offered through the
 * Beeston showroom, not bought online, so each page ends with the showroom, the telephone and
 * an enquiry button (the contact form opens on the matching subject). Words: src/content/services.ts.
 */

const pageX = "clamp(20px, 4vw, 64px)";
const MAPS = "https://www.google.com/maps/dir/?api=1&destination=7+The+Square+Beeston+Nottingham+NG9+2JG";

const CSS = `
  .sv { background: ${GROUND}; color: ${T.text}; font-family: ${FONT_BODY}; min-height: 100vh; padding-top: var(--v2nav-h, 113px); }
  .sv a { color: inherit; text-decoration: none; }
  .sv-wrap { max-width: 1250px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }
  .sv-crumb { display: flex; flex-wrap: wrap; gap: 6px 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; padding-top: clamp(26px, 3vw, 44px); }
  .sv-crumb a:hover { color: ${T.text}; }
  .sv-kicker { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.gold}; margin: 0 0 18px; }
  .sv-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(32px, 3.9vw, 54px); line-height: 1.1; margin: 0; color: ${T.text}; text-wrap: balance; }
  .sv-h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(22px, 2.2vw, 30px); line-height: 1.22; margin: 0 0 14px; color: ${T.text}; }
  .sv-p { font-size: 16px; line-height: 1.8; color: ${T.text}; margin: 0 0 14px; max-width: 62ch; }
  .sv-btn { display: inline-block; padding: 16px 30px; background: ${T.ink}; color: ${T.cream} !important; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
  .sv-btn:hover { background: ${T.text}; }
  .sv-link { display: inline-block; border-bottom: 1px solid ${T.ruleStrong}; padding-bottom: 4px; font-size: 11.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
  .sv-link:hover { border-bottom-color: ${T.gold}; }

  .sv-hero { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 5vw, 88px); align-items: center; padding-top: clamp(28px, 3.4vw, 52px); padding-bottom: clamp(56px, 6vw, 96px); }
  .sv-hero-card { background: ${T.cream}; padding: clamp(28px, 3.4vw, 52px); }
  .sv-hero-img { position: relative; aspect-ratio: 3 / 2; background: ${T.sand}; overflow: hidden; }
  .sv-hero-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

  .sv-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid ${T.ruleStrong}; }
  .sv-item { display: flex; flex-direction: column; padding: clamp(22px, 2.4vw, 34px) clamp(18px, 2vw, 30px) clamp(22px, 2.4vw, 34px) 0; border-bottom: 1px solid ${T.ruleStrong}; }
  .sv-item b { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(19px, 1.7vw, 23px); line-height: 1.25; color: ${T.text}; }
  .sv-item span { margin: 10px 0 18px; font-size: 14.5px; line-height: 1.6; color: ${T.text}; max-width: 34ch; }
  .sv-item i { margin-top: auto; font-style: normal; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.text}; display: inline-flex; gap: 8px; align-items: center; }
  .sv-item:hover i { color: ${T.gold}; }

  .sv-detail { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: clamp(36px, 6vw, 104px); align-items: start; padding-top: clamp(28px, 3.4vw, 48px); padding-bottom: clamp(56px, 6vw, 96px); }
  .sv-incl { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 10px; }
  .sv-incl li { position: relative; padding-left: 26px; font-size: 16px; line-height: 1.6; }
  .sv-incl li::before { content: ""; position: absolute; left: 0; top: 0.8em; width: 12px; height: 1px; background: ${T.gold}; }
  .sv-sec { padding-top: clamp(26px, 3vw, 38px); margin-top: clamp(26px, 3vw, 38px); border-top: 1px solid ${T.line}; }
  .sv-aside { position: sticky; top: calc(var(--v2nav-h, 113px) + 28px); background: ${T.cream}; padding: clamp(24px, 2.4vw, 34px); }
  .sv-aside h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 22px; line-height: 1.25; margin: 0 0 12px; }
  .sv-aside p { margin: 0 0 14px; font-size: 14.5px; line-height: 1.7; }
  .sv-aside .sv-btn { display: block; margin: 20px 0 14px; }
  .sv-contacts { display: grid; gap: 6px; font-size: 14.5px; }
  .sv-contacts a { border-bottom: 1px solid transparent; justify-self: start; }
  .sv-contacts a:hover { border-bottom-color: ${T.gold}; }
  .sv-related { display: flex; flex-wrap: wrap; gap: 14px 28px; margin-top: clamp(30px, 3.4vw, 44px); }

  .sv-more { background: ${T.sand}; }
  .sv-more-in { padding-top: clamp(44px, 5vw, 72px); padding-bottom: clamp(48px, 5.4vw, 80px); }
  .sv-more-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 24px; border-top: 1px solid ${T.ruleStrong}; }
  .sv-more-grid a { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; padding: 18px 20px 18px 0; border-bottom: 1px solid ${T.ruleStrong}; font-family: ${FONT_DISPLAY}; font-size: 19px; line-height: 1.3; }
  .sv-more-grid a svg { flex: none; transition: transform 0.3s ease; }
  .sv-more-grid a:hover svg { transform: translateX(4px); }

  .sv-visit { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 5vw, 88px); align-items: center; padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(56px, 6vw, 96px); }
  .sv-visit-img { position: relative; aspect-ratio: 5 / 4; overflow: hidden; background: ${T.sand}; }
  .sv-visit-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 62%; }

  @media (max-width: 1023px) {
    .sv-hero, .sv-visit { grid-template-columns: 1fr; }
    .sv-detail { grid-template-columns: 1fr; }
    .sv-aside { position: static; }
    .sv-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .sv-list { grid-template-columns: 1fr; }
    .sv-item { padding-right: 0; }
    .sv-btn { width: 100%; }
  }
`;

const Arrow = () => <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M0 5h15M11 1l4 4-4 4" stroke="currentColor" /></svg>;

const Showroom = ({ subject }: { subject: string }): JSX.Element => (
  <aside className="sv-aside" aria-label="Visit or contact the showroom">
    <h2>Available in our Beeston showroom</h2>
    <p>This service is carried out through our showroom, not online. Bring your piece in, or get in touch first and speak directly with our jeweller.</p>
    <p style={{ margin: 0 }}>7 The Square, Beeston<br />Nottingham NG9 2JG<br />Monday to Saturday, 9:30 am to 5:00 pm</p>
    <Link to={`/contact?subject=${subject}`} className="sv-btn">Make an enquiry</Link>
    <div className="sv-contacts">
      <a href="tel:+441159257552">0115 925 7552</a>
      <a href="tel:+447859888649">Mobile 07859 888649</a>
      <a href="mailto:has@mccullochjewellers.co.uk">has@mccullochjewellers.co.uk</a>
      <a href={MAPS} target="_blank" rel="noopener noreferrer">Get directions</a>
    </div>
  </aside>
);

const Shell = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <div className="sv">
    <style>{CSS}</style>
    <NavigationV2 solid />
    {children}
    <GoogleReviewsV2 />
    <FooterV2 />
  </div>
);

const Landing = (): JSX.Element => {
  const L = SERVICES.landing;
  const toList = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("sv-all")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  return (
    <Shell>
      <div className="sv-wrap">
        <div className="sv-crumb"><Link to="/">Home</Link><span>/</span><span style={{ color: T.text }}>Services</span></div>
        <section className="sv-hero">
          <div className="sv-hero-card">
            <div className="sv-kicker">{L.eyebrow}</div>
            <h1 className="sv-h1">{L.heading}</h1>
            <div style={{ marginTop: 22 }}>{L.paras.map(t => <p key={t} className="sv-p">{t}</p>)}</div>
            <a href="#sv-all" onClick={toList} className="sv-btn" style={{ marginTop: 14 }}>Discover our services</a>
          </div>
          <div className="sv-hero-img">
            <img src="/images/services-jeweller-1200.webp" srcSet="/images/services-jeweller-700.webp 700w, /images/services-jeweller-1200.webp 1200w" sizes="(max-width: 1023px) 100vw, 50vw" width={1200} height={800} alt="Our jeweller at work at the bench in Beeston" />
          </div>
        </section>

        <section id="sv-all" aria-labelledby="sv-all-h" style={{ scrollMarginTop: "calc(var(--v2nav-h, 113px) + 24px)" }}>
          <h2 id="sv-all-h" className="sv-h2">Our services</h2>
          <p className="sv-p">Each service is available through our Beeston showroom rather than as an online purchase. Choose a service to find out more.</p>
          <div className="sv-list" style={{ marginTop: 22 }}>
            {SERVICES.pages.map(s => (
              <Link key={s.slug} to={`/services/${s.slug}`} className="sv-item">
                <b>{s.name}</b><span>{s.menuNote}</span><i>Find out more <Arrow /></i>
              </Link>
            ))}
            <Link to="/bespoke-design" className="sv-item">
              <b>Bespoke Jewellery</b><span>Design a piece of your own with our jeweller, made in our Beeston workshop.</span><i>Find out more <Arrow /></i>
            </Link>
          </div>
        </section>

        <section className="sv-visit" aria-labelledby="sv-visit-h">
          <div>
            <div className="sv-kicker">Visit us</div>
            <h2 id="sv-visit-h" className="sv-h2">Speak directly with our jeweller.</h2>
            <p className="sv-p">7 The Square, Beeston, Nottingham NG9 2JG<br />Monday to Saturday, 9:30 am to 5:00 pm</p>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px 28px", marginTop: 22 }}>
              <Link to="/contact?subject=repairs" className="sv-btn">Make an enquiry</Link>
              <a href="tel:+441159257552" className="sv-link">0115 925 7552</a>
              <a href={MAPS} target="_blank" rel="noopener noreferrer" className="sv-link">Get directions</a>
            </div>
          </div>
          <div className="sv-visit-img"><img src="/images/shopfront-2-upscaled.webp" width={764} height={1020} alt="The McCulloch showroom on The Square, Beeston" loading="lazy" /></div>
        </section>
      </div>
    </Shell>
  );
};

const Detail = ({ s }: { s: ServicePage }): JSX.Element => {
  const others = SERVICES.pages.filter(o => o.slug !== s.slug);
  return (
    <Shell>
      <div className="sv-wrap">
        <div className="sv-crumb"><Link to="/">Home</Link><span>/</span><Link to="/services">Services</Link><span>/</span><span style={{ color: T.text }}>{s.name}</span></div>
        <div className="sv-detail">
          <article>
            <div className="sv-kicker">Services &amp; aftercare</div>
            <h1 className="sv-h1">{s.h1}</h1>
            <div style={{ marginTop: 24 }}>{s.intro.map(t => <p key={t} className="sv-p">{t}</p>)}</div>
            <div className="sv-sec">
              <h2 className="sv-h2">What we offer</h2>
              <ul className="sv-incl">{s.includes.map(t => <li key={t}>{t}</li>)}</ul>
            </div>
            {s.sections.map(sec => (
              <div key={sec.heading} className="sv-sec">
                <h2 className="sv-h2">{sec.heading}</h2>
                {sec.paras.map(t => <p key={t} className="sv-p">{t}</p>)}
              </div>
            ))}
            <div className="sv-related">{s.related.map(([t, h]) => <Link key={h} to={h} className="sv-link">{t}</Link>)}</div>
          </article>
          <Showroom subject={s.subject} />
        </div>
      </div>
      <section className="sv-more" aria-labelledby="sv-more-h">
        <div className="sv-wrap sv-more-in">
          <h2 id="sv-more-h" className="sv-h2">More services</h2>
          <div className="sv-more-grid">
            {others.map(o => <Link key={o.slug} to={`/services/${o.slug}`}><span>{o.name}</span><Arrow /></Link>)}
            <Link to="/services"><span>All services</span><Arrow /></Link>
          </div>
        </div>
      </section>
    </Shell>
  );
};

const ServicesV2 = (): JSX.Element => {
  const { slug } = useParams();
  if (!slug) return <Landing />;
  const s = SERVICES.pages.find(p => p.slug === slug);
  if (!s) {
    return (
      <Shell>
        <div className="sv-wrap" style={{ padding: "80px 0", textAlign: "center" }}>
          <h1 className="sv-h1">Service not found</h1>
          <p className="sv-p" style={{ margin: "18px auto" }}>That page has moved or no longer exists.</p>
          <Link to="/services" className="sv-link">See all services</Link>
        </div>
      </Shell>
    );
  }
  return <Detail s={s} />;
};

export default ServicesV2;
