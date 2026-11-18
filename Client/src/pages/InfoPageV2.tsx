import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND } from "../components/home-v2/listingShared";
import { INFO_PAGES, FAQS } from "../content/infoPages";

/**
 * InfoPageV2 — one reusable template for every informational / legal / guide page.
 * Light redesign (Nov 2026). The words are untouched: content still comes verbatim from the
 * client's Website Essentials (src/content/infoPages.ts). What changed is how a long page is
 * read: a centred opening, an "On this page" list that stays beside the text on a laptop (and
 * folds away on a phone), a narrower reading column, and at the foot the other pages in the
 * same group, so a customer on Delivery can step straight to Returns.
 * Pass a `slug` that keys INFO_PAGES, or slug="faqs" to render the grouped FAQ accordion.
 */

const pageX = "clamp(20px, 4vw, 64px)";

const KICKERS: Record<string, string> = {
  privacy: "Legal", terms: "Legal", cookies: "Legal",
  delivery: "Customer care", returns: "Customer care", warranty: "Customer care",
  repairs: "Customer care", "book-appointment": "Visit us", "visit-us": "Visit us",
  "ring-size-guide": "Guide", "diamond-guide": "Guide", "gemstone-guide": "Guide",
  "birthstone-guide": "Guide", "hallmark-guide": "Guide", "jewellery-care": "Guide",
  sustainability: "Our company", "certificate-of-authenticity": "Our company", guarantees: "Our company",
};
// Each content slug's own address (most match the slug; two do not).
const PATHS: Record<string, string> = { guarantees: "/trust-guarantees" };
const pathOf = (slug: string) => PATHS[slug] || `/${slug}`;
const GROUP_TITLE: Record<string, string> = { Legal: "More legal pages", "Customer care": "More on customer care", "Visit us": "More on visiting us", Guide: "More guides", "Our company": "More about us" };

const anchor = (s: string, i: number) => `s${i}-` + s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const CSS = `
  .ip { background: ${GROUND}; color: ${T.text}; font-family: ${FONT_BODY}; min-height: 100vh; padding-top: var(--v2nav-h, 113px); }
  .ip a { color: inherit; text-decoration: none; }
  .ip-wrap { max-width: 1160px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }
  .ip-eyebrow { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  @keyframes ipRise { from { opacity: 0; transform: translateY(16px); } }
  .ip-open { text-align: center; padding-top: clamp(26px, 3vw, 44px); padding-bottom: clamp(36px, 4.4vw, 64px); border-bottom: 1px solid ${T.line}; }
  .ip-open > * { animation: ipRise 0.9s cubic-bezier(0.22,1,0.36,1) backwards; }
  .ip-open > :nth-child(3) { animation-delay: 0.1s; }
  .ip-crumb { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: clamp(26px, 3.4vw, 48px); }
  .ip-crumb a:hover { color: ${T.text}; }
  .ip-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(36px, 4.8vw, 68px); line-height: 1.06; margin: 14px auto 0; max-width: 18ch; color: ${T.text}; text-wrap: balance; }

  .ip-body { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: clamp(36px, 6vw, 104px); align-items: start; padding-top: clamp(36px, 4.4vw, 64px); padding-bottom: clamp(56px, 6vw, 96px); }
  .ip-body.is-plain { grid-template-columns: minmax(0, 1fr); }
  .ip-body.is-plain .ip-text { margin: 0 auto; }
  .ip-toc { position: sticky; top: calc(var(--v2nav-h, 113px) + 28px); max-height: calc(100vh - var(--v2nav-h, 113px) - 56px); overflow-y: auto; scrollbar-width: thin; }
  .ip-toc-btn { display: block; width: 100%; padding: 0; background: transparent; border: 0; text-align: left; font-family: inherit; cursor: default; }
  .ip-toc ol { list-style: none; margin: 16px 0 0; padding: 0; border-left: 1px solid ${T.line}; }
  .ip-toc a { display: block; padding: 7px 0 7px 16px; margin-left: -1px; border-left: 1px solid transparent; font-size: 14px; line-height: 1.45; color: ${T.textMuted}; transition: color 0.2s ease, border-color 0.2s ease; }
  .ip-toc a:hover { color: ${T.text}; }
  .ip-toc a[aria-current="true"] { color: ${T.text}; border-left-color: ${T.gold}; }
  .ip-text { max-width: 680px; min-width: 0; }
  .ip-sec { scroll-margin-top: calc(var(--v2nav-h, 113px) + 24px); padding-bottom: clamp(26px, 3vw, 38px); }
  .ip-sec + .ip-sec { padding-top: clamp(26px, 3vw, 38px); border-top: 1px solid ${T.line}; }
  .ip-h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(22px, 2.2vw, 28px); line-height: 1.22; margin: 0 0 14px; color: ${T.text}; }
  .ip-p { font-size: 16px; line-height: 1.8; color: ${T.text}; margin: 0 0 14px; }
  .ip-p:last-child { margin-bottom: 0; }
  .ip-ul { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 10px; }
  .ip-ul li { position: relative; padding-left: 26px; font-size: 16px; line-height: 1.7; color: ${T.text}; }
  .ip-ul li::before { content: ""; position: absolute; left: 0; top: 0.82em; width: 12px; height: 1px; background: ${T.gold}; }
  .ip-table { overflow-x: auto; margin: 4px 0 clamp(26px, 3vw, 38px); border-top: 1px solid ${T.ruleStrong}; border-bottom: 1px solid ${T.ruleStrong}; }
  .ip-table table { width: 100%; min-width: 420px; border-collapse: collapse; font-size: 15px; }
  .ip-table th { text-align: left; padding: 14px 16px 14px 0; border-bottom: 1px solid ${T.ruleStrong}; font-family: ${FONT_BODY}; font-size: 11px; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }
  .ip-table td { padding: 12px 16px 12px 0; border-bottom: 1px solid ${T.line}; color: ${T.text}; font-variant-numeric: tabular-nums; }
  .ip-table tr:last-child td { border-bottom: 0; }

  .ip-btn { display: inline-block; padding: 16px 30px; background: ${T.ink}; color: ${T.cream} !important; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
  .ip-btn:hover { background: ${T.text}; }
  .ip-link { display: inline-block; border-bottom: 1px solid ${T.ruleStrong}; padding-bottom: 4px; font-size: 11.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
  .ip-link:hover { border-bottom-color: ${T.gold}; }
  .ip-ask { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px 30px; margin-top: 8px; padding-top: clamp(26px, 3vw, 38px); border-top: 1px solid ${T.ruleStrong}; }
  .ip-ask b { display: block; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 22px; color: ${T.text}; }
  .ip-ask span { display: block; margin-top: 6px; font-size: 14.5px; color: ${T.textMuted}; }

  /* the same group's other pages: the page's one sand band */
  .ip-more { background: ${T.sand}; }
  .ip-more-in { padding-top: clamp(44px, 5vw, 72px); padding-bottom: clamp(48px, 5.4vw, 80px); }
  .ip-more-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); margin-top: 24px; border-top: 1px solid ${T.ruleStrong}; }
  .ip-more-grid a { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; padding: 18px 20px 18px 0; border-bottom: 1px solid ${T.ruleStrong}; font-family: ${FONT_DISPLAY}; font-size: 19px; line-height: 1.3; color: ${T.text}; }
  .ip-more-grid a svg { flex: none; transition: transform 0.3s ease; }
  .ip-more-grid a:hover svg { transform: translateX(4px); }

  /* FAQ */
  .ip-faqgroup { scroll-margin-top: calc(var(--v2nav-h, 113px) + 24px); margin-bottom: clamp(36px, 4vw, 52px); }
  .ip-faqgroup > h2 { margin-bottom: 6px; }
  .ip-faq { border-bottom: 1px solid ${T.line}; }
  .ip-faq > button { display: flex; align-items: center; justify-content: space-between; gap: 20px; width: 100%; padding: 19px 0; cursor: pointer; background: transparent; border: 0; text-align: left; font-family: ${FONT_BODY}; font-size: 16.5px; line-height: 1.45; color: ${T.text}; }
  .ip-plus { position: relative; flex: none; width: 13px; height: 13px; }
  .ip-plus::before, .ip-plus::after { content: ""; position: absolute; left: 0; top: 6px; width: 13px; height: 1px; background: ${T.text}; transition: transform 0.3s ease; }
  .ip-plus::after { transform: rotate(90deg); }
  .ip-faq > button[aria-expanded="true"] .ip-plus::after { transform: rotate(0deg); }
  .ip-faq-a { display: none; padding: 0 34px 22px 0; }
  .ip-faq-a.is-open { display: block; animation: ipRise 0.45s cubic-bezier(0.22,1,0.36,1) backwards; }

  @media (max-width: 900px) {
    .ip-body { grid-template-columns: minmax(0, 1fr); gap: 0; padding-top: 0; }
    .ip-toc { position: static; max-height: none; margin: 0 calc(-1 * ${pageX}) clamp(28px, 5vw, 40px); padding: 0 ${pageX}; border-bottom: 1px solid ${T.line}; }
    .ip-toc-btn { display: flex; align-items: center; justify-content: space-between; padding: 18px 0; cursor: pointer; }
    .ip-toc-btn::after { content: ""; width: 7px; height: 7px; margin-right: 3px; border-right: 1px solid ${T.text}; border-bottom: 1px solid ${T.text}; transform: translateY(-2px) rotate(45deg); transition: transform 0.25s ease; }
    .ip-toc.is-open .ip-toc-btn::after { transform: translateY(2px) rotate(-135deg); }
    .ip-toc ol { display: none; margin: 0 0 20px; }
    .ip-toc.is-open ol { display: block; }
    .ip-text { max-width: none; }
    .ip-body.is-plain { padding-top: clamp(28px, 5vw, 40px); }
  }
  @media (max-width: 560px) { .ip-ask .ip-btn { width: 100%; } }
  @media (prefers-reduced-motion: reduce) { .ip-open > *, .ip-faq-a.is-open { animation: none !important; } html { scroll-behavior: auto; } }
`;

// "On this page": follows the reader down the page.
const useActiveSection = (ids: string[]): string => {
  const [active, setActive] = useState(ids[0] || "");
  useEffect(() => {
    setActive(ids[0] || "");
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-22% 0px -68% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")]);
  return active;
};

const Contents = ({ items, active }: { items: { id: string; label: string }[]; active: string }): JSX.Element => {
  const [open, setOpen] = useState(false); // phone only: the list folds away
  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    setOpen(false);
  };
  return (
    <nav className={`ip-toc${open ? " is-open" : ""}`} aria-label="On this page">
      <button type="button" className="ip-toc-btn" data-toc aria-expanded={open} onClick={() => setOpen((v) => !v)}><span className="ip-eyebrow">On this page</span></button>
      <ol>
        {items.map((it) => <li key={it.id}><a href={`#${it.id}`} data-goto={it.id} aria-current={active === it.id ? "true" : undefined} onClick={go(it.id)}>{it.label}</a></li>)}
      </ol>
    </nav>
  );
};

const Shell = ({ title, kicker, children, after }: { title: string; kicker: string; children: React.ReactNode; after?: React.ReactNode }): JSX.Element => (
  <div className="ip">
    <style>{CSS}</style>
    <NavigationV2 solid />
    <header className="ip-wrap">
      <div className="ip-open">
        <div className="ip-crumb"><Link to="/">Home</Link><span>/</span><span>{title}</span></div>
        <div className="ip-eyebrow">{kicker}</div>
        <h1 className="ip-h1">{title}</h1>
      </div>
    </header>
    {children}
    {after}
    <FooterV2 />
  </div>
);

const Ask = ({ lead, note }: { lead: string; note: string }): JSX.Element => (
  <div className="ip-ask">
    <div><b>{lead}</b><span>{note}</span></div>
    <span style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px 28px" }}>
      <Link to="/contact" className="ip-btn">Contact us</Link>
      <Link to="/customer-service" className="ip-link">Customer service</Link>
    </span>
  </div>
);

const FaqPage = (): JSX.Element => {
  const [open, setOpen] = useState<string | null>(null);
  const groups = useMemo(() => FAQS.map((g, i) => ({ ...g, id: anchor(g.category, i) })), []);
  const active = useActiveSection(groups.map((g) => g.id));
  return (
    <Shell title="Frequently asked questions" kicker="Help & support">
      <div className="ip-wrap ip-body">
        <Contents items={groups.map((g) => ({ id: g.id, label: g.category }))} active={active} />
        <div className="ip-text">
          {groups.map((group) => (
            <section key={group.id} id={group.id} className="ip-faqgroup">
              <h2 className="ip-h2">{group.category}</h2>
              {group.items.map((it) => {
                const id = group.category + "::" + it.q;
                const isOpen = open === id;
                return (
                  <div key={id} className="ip-faq">
                    <button type="button" data-faq aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : id)}>
                      <span>{it.q}</span><span className="ip-plus" aria-hidden="true" />
                    </button>
                    <div className={`ip-faq-a${isOpen ? " is-open" : ""}`}><p className="ip-p">{it.a}</p></div>
                  </div>
                );
              })}
            </section>
          ))}
          <Ask lead="Didn’t find what you were looking for?" note="Contact our team and we’ll be happy to help." />
        </div>
      </div>
    </Shell>
  );
};

const InfoPageV2 = ({ slug }: { slug: string }): JSX.Element => {
  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  const page = slug === "faqs" ? undefined : INFO_PAGES[slug];
  const sections = useMemo(() => (page ? page.sections.map((s, i) => ({ ...s, id: anchor(s.heading || "section", i) })) : []), [page]);
  // The first section usually repeats the page title; it then reads as the introduction.
  const toc = sections.filter((s, i) => s.heading && !(i === 0 && s.heading.trim().toLowerCase() === page?.title.trim().toLowerCase())).map((s) => ({ id: s.id, label: s.heading }));
  const active = useActiveSection(toc.map((t) => t.id));

  if (slug === "faqs") return <FaqPage />;

  if (!page) {
    return (
      <Shell title="Page not found" kicker="McCulloch">
        <div className="ip-wrap ip-body is-plain">
          <div className="ip-text" style={{ textAlign: "center" }}>
            <p className="ip-p">We couldn’t find that page.</p>
            <div style={{ marginTop: 24 }}><Link to="/" className="ip-btn">Return home</Link></div>
          </div>
        </div>
      </Shell>
    );
  }

  const kicker = KICKERS[slug] || "McCulloch";
  const siblings = Object.keys(KICKERS).filter((k) => KICKERS[k] === kicker && k !== slug && INFO_PAGES[k]);
  const hasToc = toc.length >= 3;

  const more = siblings.length > 0 && (
    <section className="ip-more">
      <div className="ip-wrap ip-more-in">
        <div className="ip-eyebrow">{GROUP_TITLE[kicker] || "Related pages"}</div>
        <div className="ip-more-grid">
          {siblings.map((k) => (
            <Link key={k} to={pathOf(k)}>
              <span>{INFO_PAGES[k].title}</span>
              <svg width="16" height="9" viewBox="0 0 16 9" fill="none" aria-hidden="true"><path d="M0 4.5h15M11 1l4 3.5L11 8" stroke={T.gold} /></svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <Shell title={page.title} kicker={kicker} after={more}>
      <div className={`ip-wrap ip-body${hasToc ? "" : " is-plain"}`}>
        {hasToc && <Contents items={toc} active={active} />}
        <div className="ip-text">
          {sections.map((s, i) => {
            const repeatsTitle = i === 0 && s.heading.trim().toLowerCase() === page.title.trim().toLowerCase();
            return (
              <section key={s.id} id={s.id} className="ip-sec">
                {s.heading && !repeatsTitle && <h2 className="ip-h2">{s.heading}</h2>}
                {s.paras.map((p, j) => <p key={j} className="ip-p" style={repeatsTitle && j === 0 ? { fontSize: 18, lineHeight: 1.75 } : undefined}>{p}</p>)}
                {s.bullets.length > 0 && <ul className="ip-ul">{s.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
              </section>
            );
          })}

          {page.table && page.table.length > 0 && (
            <div className="ip-table">
              <table>
                <thead><tr>{page.table[0].map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
                <tbody>{page.table.slice(1).map((row, ri) => <tr key={ri}>{row.map((c, ci) => <td key={ci}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          )}

          <Ask lead="Still have a question?" note="Call 0115 925 7552, or write to us and we will reply within one working day." />
        </div>
      </div>
    </Shell>
  );
};

export default InfoPageV2;
