import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { useFavorites } from "../contexts/FavoritesContext";
import { cleanWatchName, roamerName, inferMovement, caseMm, money, PHOTO, HOUSES } from "./WatchesV2";
import { LISTING_CSS, GROUND, TILE, PillTick } from "../components/home-v2/listingShared";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * WatchBrandV2 — one template, three brand pages (Festina / Roamer / Briston), light redesign
 * (Nov 2026) in the same family as the watch listing: a switch between the three houses, a
 * light opening with three of the brand's watches on a pale tile, a facts row, "The house",
 * the collections as tiles, the brand's watches on the listing's own cards, and "Why we sell
 * it" on the page's one sand band. Brand is taken from the route (/festina, /roamer, /briston).
 *
 * REAL data: watches and from-prices come from GET /watches (filtered to the brand); the
 * collections come from GET /watches/brands/slug/:slug/collections and link to /collections/:slug.
 *
 * PLACEHOLDER (needs sign-off): the brand NARRATIVE (standfirst, headline, paragraphs and the
 * "why" copy) is written from general knowledge. The client must check every brand claim with
 * each house before launch; founding years are the real ones.
 */

const pageX = "clamp(20px, 4vw, 64px)";
const eyebrow: React.CSSProperties = { fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text };
const h2: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(26px, 2.6vw, 38px)", lineHeight: 1.18, margin: 0, color: T.text };
const para: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.8, color: T.text, margin: 0 };
const STEP = 8;

interface BrandMeta {
  slug: string; founded: string; origin: string;
  standfirst: string; headline: string; paragraphs: string[];
  whyHeadline: string; whyBody: string; warranty: string;
}

// NARRATIVE below is placeholder pending each house's sign-off. Founding years real.
const BRANDS: Record<string, BrandMeta> = {
  Festina: {
    slug: "festina", founded: "1902", origin: "Spain", warranty: "2 years",
    standfirst: "Chronographs and clean steel at prices that leave room for the rest of your life.",
    headline: "The watch you actually wear.",
    paragraphs: [
      "Festina has been making watches since 1902 and has spent most of the last forty years doing one thing extremely well: putting a legible chronograph on a steel bracelet at a price that does not require a conversation with anybody.",
      "The range runs from a plain three-hand on leather to titanium and Swiss-made references, and the sizing is sensible throughout. If you want a first proper watch, or a second one you can wear without thinking about it, this is where most of our customers start.",
      "We hold the core references and can order the rest. Every one is timed on our bench and the bracelet sized before it leaves.",
    ],
    whyHeadline: "Nothing to apologise for at the price.",
    whyBody: "We sell watches at every level, and this is the range we recommend without reservation to anyone who wants something they can wear daily and replace without heartbreak. The steel is properly finished, the movements are serviceable, and the warranty is real because we are authorised.",
  },
  Roamer: {
    slug: "roamer", founded: "1888", origin: "Switzerland", warranty: "2 years",
    standfirst: "Swiss made since 1888, and priced as though nobody has told them what that is worth.",
    headline: "Quietly Swiss, quietly serious.",
    paragraphs: [
      "Roamer has been making watches in Switzerland since 1888 and has never been a fashion house. The result is a catalogue that reads older than it is: automatics, skeletons, moonphases and a diver, all built to specifications that would be unremarkable at three times the money.",
      "The Searock is the one we sell most: a Sellita SW200 automatic, sapphire crystal, 200 metres, on a bracelet that tapers the way a good bracelet should. The Competence skeletons are for people who want to watch the thing work.",
      "Every reference we sell is a Swiss movement we can service in the building, with parts that are actually available. That matters more than it sounds.",
    ],
    whyHeadline: "Swiss movements without the Swiss mark-up.",
    whyBody: "This is the range we point people to when they want a mechanical watch and have been quoted four figures for something with the same movement inside. Roamer has no marketing budget to recover, and the difference lands in the specification instead. We service them here for as long as you own them.",
  },
  Briston: {
    slug: "briston", founded: "2013", origin: "France", warranty: "2 years",
    standfirst: "Acetate cases in colours nobody else is making. The watch people ask about.",
    headline: "The one that gets noticed.",
    paragraphs: [
      "Briston started in Paris in 2013 with an idea nobody else was pursuing: build the case out of acetate, the material spectacle frames are cut from, and treat colour as part of the specification rather than an afterthought.",
      "The Clubmaster is the shape everything else is built from: a cushion case, a domed crystal and a nato strap you can change in seconds. The range runs from quartz through to Swiss automatics and a proper 200-metre diver.",
      "It is the only watch in the shop that customers photograph on the wrist before they have decided to buy it. Worth seeing in daylight, where the acetate reads completely differently than under a bulb.",
    ],
    whyHeadline: "Colour treated as a specification.",
    whyBody: "Most watch brands offer black, blue or white and call it a range. Briston cuts cases from acetate in patterns that change completely in daylight, and backs it with movements and water resistance that hold up. It is the range we put on the wrist of anyone who says everything looks the same.",
  },
};
const ORDER = ["Festina", "Roamer", "Briston"];

const brandFromPath = (path: string): string => {
  if (path.includes("roamer")) return "Roamer";
  if (path.includes("briston")) return "Briston";
  return "Festina";
};

interface BW { id: string; name: string; display: string; slug: string; price: number; image?: string; movement: "Quartz" | "Automatic"; spec: string; featured: boolean; collection: string }

const WatchBrandV2 = (): JSX.Element => {
  const location = useLocation();
  const brand = brandFromPath(location.pathname);
  const meta = BRANDS[brand];
  const { isFavorite, toggleFavorite } = useFavorites();

  const [watches, setWatches] = useState<BW[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [movement, setMovement] = useState("All");
  const [visible, setVisible] = useState(STEP);
  const [allColl, setAllColl] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0, 0); setMovement("All"); setVisible(STEP); setAllColl(false); }, [brand]);

  useEffect(() => {
    setWatches([]); setCollections([]);
    fetch(`${API_BASE_URL}/watches?limit=1000`).then((r) => r.json()).then((d) => {
      const list: any[] = d?.data?.watches || d?.data || [];
      const mine = list.filter((w) => w.brand?.name === brand).map((w) => {
        const sp = w.specifications || {};
        const name: string = w.name || "Watch";
        const text = `${name} ${w.description || ""}`;
        const ref = w.model_number || w.sku || "";
        const move = inferMovement(text, sp.movement);
        const mm = caseMm(sp.case_diameter, name);
        const water = /^\d+\s?(atm|bar)$/i.test(String(sp.water_resistance || "").trim()) ? String(sp.water_resistance).trim().toUpperCase().replace("BAR", "bar") : null;
        return {
          id: String(w.id), name, slug: w.slug || "", price: Number(w.base_price) || 0,
          display: ((brand === "Roamer" && roamerName(name)) || cleanWatchName(name, brand, ref, 64)).replace(/\s+-\s+/g, ", "),
          image: w.image?.url || w.images?.[0]?.url, movement: move,
          spec: [move, mm != null ? `${Math.round(mm)}mm` : null, water].filter(Boolean).join(" · "),
          featured: !!w.is_featured, collection: w.collection?.name || "",
        } as BW;
      }).filter((w) => w.price > 0);
      setWatches(mine);
    }).catch(() => {});

    fetch(`${API_BASE_URL}/watches/brands/slug/${meta.slug}/collections`).then((r) => r.json()).then((d) => {
      const arr: any[] = d?.data || d?.collections || (Array.isArray(d) ? d : []);
      setCollections(arr);
    }).catch(() => {});
  }, [brand, meta.slug]);

  // Section entrances; re-run when the data lands so late cards are observed too.
  useEffect(() => {
    const targets = Array.from(rootRef.current?.querySelectorAll(".v2-reveal:not(.is-in), .v2-stagger:not(.is-in)") ?? []);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { targets.forEach((t) => t.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [brand, watches.length, collections.length]);

  const fromPrice = useMemo(() => (watches.length ? Math.min(...watches.map((w) => w.price)) : 0), [watches]);

  const families = useMemo(() => {
    const byColl: Record<string, number> = {};
    watches.forEach((w) => { if (w.collection) byColl[w.collection] = Math.min(byColl[w.collection] ?? Infinity, w.price); });
    return collections.filter((c) => (c.watches_count || 0) > 0)
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (b.watches_count || 0) - (a.watches_count || 0))
      .map((c) => ({ name: c.name as string, slug: c.slug as string, image: (c.preview_image || c.image_url) as string | undefined, count: c.watches_count || 0, from: byColl[c.name] ? `From ${money(byColl[c.name])}` : "" }));
  }, [collections, watches]);

  // Opening: the house's signature watch in the middle, one from each of two other collections beside it.
  const trio = useMemo(() => {
    const withImg = watches.filter((w) => w.image);
    const pick = HOUSES.find((h) => h.name === brand)?.pick;
    const main = (pick && withImg.find((w) => pick.test(`${w.collection} ${w.name}`))) || withImg[0];
    if (!main) return [];
    const sides: BW[] = [];
    for (const w of withImg) {
      if (sides.length === 2) break;
      if (w.id !== main.id && w.collection !== main.collection && !sides.some((s) => s.collection === w.collection)) sides.push(w);
    }
    return sides.length === 2 ? [sides[0], main, sides[1]] : [main];
  }, [watches, brand]);

  const grid = useMemo(() => {
    const list = movement === "All" ? watches : watches.filter((w) => w.movement === movement);
    // Take one watch from each collection in turn, so the first rows show the range
    // rather than a single collection; featured pieces still lead.
    const groups: BW[][] = [];
    const at: Record<string, number> = {};
    list.forEach((w) => { const k = w.collection || "_"; if (at[k] == null) { at[k] = groups.length; groups.push([]); } groups[at[k]].push(w); });
    const mixed: BW[] = [];
    for (let i = 0; mixed.length < list.length; i++) groups.forEach((g) => { if (g[i]) mixed.push(g[i]); });
    return mixed.sort((x, y) => (y.featured ? 1 : 0) - (x.featured ? 1 : 0));
  }, [watches, movement]);
  const counts = useMemo(() => ({ All: watches.length, Quartz: watches.filter((w) => w.movement === "Quartz").length, Automatic: watches.filter((w) => w.movement === "Automatic").length } as Record<string, number>), [watches]);

  const ph = PHOTO[brand] || { scale: 1 };
  const photo = { ["--s" as string]: ph.scale, filter: ph.filter } as React.CSSProperties;

  const goTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id); if (!el) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--v2nav-h")) || 113;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - navH - 8, behavior: "smooth" });
  };

  const facts = [
    { value: meta.founded, label: `Founded in ${meta.origin}` },
    { value: fromPrice ? money(fromPrice) : "", label: "Prices from" },
    { value: meta.warranty, label: "Manufacturer warranty" },
    { value: watches.length ? String(watches.length) : "", label: "Watches to choose from" },
  ];
  const shownColl = allColl ? families : families.slice(0, 8);

  return (
    <div ref={rootRef} className="wb" style={{ background: GROUND, minHeight: "100vh", fontFamily: FONT_BODY, color: T.text, overflowX: "clip", paddingTop: "var(--v2nav-h, 113px)" }}>
      <style>{LISTING_CSS}</style>
      <style>{`
        .wb a { color: inherit; text-decoration: none; }
        .wb-wrap { max-width: 1320px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }
        .wb-sec { padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(56px, 6vw, 96px); }
        .wt-img { transform: scale(var(--s, 1)); }
        .erv2-card:hover .wt-img, .wb-coll:hover .wt-img { transform: scale(calc(var(--s, 1) * 1.035)); }

        @keyframes wbRise { from { opacity: 0; transform: translateY(20px); } }
        .wb .v2-reveal:not(.is-in), .wb .v2-stagger:not(.is-in) > * { opacity: 0; }
        .wb .v2-reveal.is-in, .wb .v2-stagger.is-in > * { animation: wbRise 1.1s cubic-bezier(0.22,1,0.36,1) backwards; }
        .wb .v2-reveal-d1.is-in { animation-delay: 0.14s; }
        .wb .v2-stagger.is-in > :nth-child(2) { animation-delay: 0.1s; }
        .wb .v2-stagger.is-in > :nth-child(3) { animation-delay: 0.2s; }
        .wb .v2-stagger.is-in > :nth-child(4) { animation-delay: 0.3s; }
        .wb .v2-stagger.is-in > :nth-child(n+5) { animation-delay: 0.4s; }

        .wb-btn { display: inline-block; padding: 16px 30px; background: ${T.ink}; color: ${T.cream} !important; border: 0; cursor: pointer; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
        .wb-btn:hover { background: ${T.text}; }
        .wb-textlink { display: inline-block; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; padding: 14px 0 5px; transition: border-color 0.2s ease; }
        .wb-textlink:hover { border-bottom-color: ${T.gold}; }

        /* the three houses */
        .wb-houses { display: flex; justify-content: center; gap: clamp(26px, 4vw, 60px); border-bottom: 1px solid ${T.line}; }
        .wb-house { position: relative; padding: 20px 2px 18px; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; transition: color 0.2s ease; }
        .wb-house:hover { color: ${T.text}; }
        .wb-house[aria-current="page"] { color: ${T.text}; }
        .wb-house[aria-current="page"]::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 1px; background: ${T.gold}; }

        /* opening */
        .wb-hero { display: grid; grid-template-columns: minmax(0, 0.78fr) minmax(0, 1.22fr); gap: clamp(28px, 5vw, 80px); align-items: center; padding-top: clamp(32px, 4vw, 60px); padding-bottom: clamp(40px, 5vw, 72px); }
        .wb-crumb { display: flex; gap: 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: clamp(24px, 3vw, 44px); }
        .wb-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(46px, 6vw, 88px); line-height: 1; margin: 14px 0 0; color: ${T.text}; }
        .wb-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px 30px; margin-top: 30px; }
        .wb-stage { position: relative; aspect-ratio: 1 / 0.74; background: ${TILE}; overflow: hidden; display: grid; grid-template-columns: 1fr 1.45fr 1fr; align-items: center; padding: 0 3%; }
        .wb-stage a { position: relative; display: block; height: 100%; }
        .wb-stage img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; transition: transform 0.9s cubic-bezier(0.22,1,0.36,1); }
        .wb-stage a.is-side img { inset: 14% 0; height: 72%; opacity: 0.92; }
        .wb-stage a:hover img { transform: scale(calc(var(--s, 1) * 1.04)); }
        .wb-stage.is-one { grid-template-columns: 1fr; }

        /* facts */
        .wb-facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .wb-fact { padding: clamp(22px, 2.4vw, 32px) 16px; text-align: center; border-left: 1px solid ${T.line}; }
        .wb-fact:first-child { border-left: 0; }
        .wb-fact b { display: block; min-height: 1.1em; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(24px, 2.3vw, 32px); line-height: 1.1; color: ${T.text}; }
        .wb-fact span { display: block; margin-top: 9px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }

        /* the house */
        .wb-story { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(28px, 6vw, 104px); align-items: start; }

        /* collections */
        .wb-head { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 14px 24px; }
        .wb-colls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(28px, 3vw, 44px) clamp(12px, 1.6vw, 24px); margin-top: clamp(28px, 3vw, 44px); }
        .wb-coll { display: block; }
        .wb-coll-img { position: relative; aspect-ratio: 1 / 0.86; background: ${TILE}; overflow: hidden; }
        .wb-coll-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 9%; mix-blend-mode: multiply; transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .wb-coll-name { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-top: 14px; font-size: 15px; color: ${T.text}; }
        .wb-coll-name span:last-child { flex: none; font-size: 13px; color: ${T.textMuted}; }
        .wb-coll-sub { margin-top: 5px; font-size: 13px; color: ${T.textMuted}; }

        /* watches */
        .wb-moves { display: flex; flex-wrap: wrap; gap: 8px; }
        .wb-moves .erv2-pill { height: 40px; padding: 0 16px; }
        .wb-sub { margin-top: 5px; font-size: 13px; color: ${T.textMuted}; }

        /* why */
        .wb-why { background: ${T.sand}; }
        .wb-whygrid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(28px, 6vw, 104px); align-items: center; }

        @media (max-width: 1023px) {
          .wb-hero, .wb-story, .wb-whygrid { grid-template-columns: 1fr; }
          .wb-hero { gap: 34px; }
          .wb-colls { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .wb-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .wb-fact:nth-child(3) { border-left: 0; }
          .wb-fact:nth-child(n+3) { border-top: 1px solid ${T.line}; }
        }
        @media (max-width: 640px) {
          .wb-houses { justify-content: space-between; gap: 0; margin: 0 calc(-1 * ${pageX}); padding: 0 ${pageX}; }
          .wb-stage { margin: 0 calc(-1 * ${pageX}); aspect-ratio: 1 / 0.8; }
          .wb-actions .wb-btn { width: 100%; }
          .wb-colls { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
          .wb-coll-name { display: block; font-size: 14px; }
          .wb-coll-name span:last-child { display: block; margin-top: 4px; }
          .wb-coll-sub, .wb-sub { display: none; }
          .wb-fact { padding: 20px 8px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .wb .v2-reveal, .wb .v2-stagger > * { opacity: 1 !important; animation: none !important; }
        }
      `}</style>

      <NavigationV2 solid />

      {/* The three houses */}
      <nav className="wb-wrap" aria-label="Watch brands">
        <div className="wb-houses">
          {ORDER.map((b) => <Link key={b} to={`/${BRANDS[b].slug}`} className="wb-house" aria-current={b === brand ? "page" : undefined}>{b}</Link>)}
        </div>
      </nav>

      <div key={brand}>
        {/* Opening */}
        <section className="wb-wrap wb-hero">
          <div className="v2-stagger">
            <div className="wb-crumb"><Link to="/">Home</Link><span>/</span><Link to="/watches">Watches</Link><span>/</span><span style={{ color: T.text }}>{brand}</span></div>
            <div style={eyebrow}>{meta.origin}, {meta.founded} · Authorised retailer</div>
            <h1 className="wb-h1">{brand}</h1>
            <p style={{ ...para, maxWidth: "40ch", marginTop: 22 }}>{meta.standfirst}</p>
            <div className="wb-actions">
              <a href="#watches" onClick={goTo("watches")} data-goto="watches" className="wb-btn">{watches.length ? `Shop ${watches.length} watches` : "Shop the watches"}</a>
              {families.length > 0 && <a href="#collections" onClick={goTo("collections")} data-goto="collections" className="wb-textlink">The collections</a>}
            </div>
          </div>
          <div className={`wb-stage v2-reveal v2-reveal-d1${trio.length === 1 ? " is-one" : ""}`}>
            {trio.map((w, i) => (
              <Link key={w.id} to={`/watches/${w.slug}`} className={trio.length === 3 && i !== 1 ? "is-side" : ""} aria-label={`${brand} ${w.display}`}>
                <img src={getMediaUrl(w.image!)} alt={`${brand} ${w.display}`} className="wt-img" style={photo} />
              </Link>
            ))}
          </div>
        </section>

        {/* Facts */}
        <section className="wb-wrap">
          <div className="wb-facts v2-stagger">
            {facts.map((f) => <div key={f.label} className="wb-fact"><b>{f.value}</b><span>{f.label}</span></div>)}
          </div>
        </section>

        {/* The house */}
        <section className="wb-wrap wb-sec">
          <div className="wb-story">
            <div className="v2-stagger">
              <div style={{ ...eyebrow, marginBottom: 18 }}>The house</div>
              <h2 style={{ ...h2, maxWidth: "16ch" }}>{meta.headline}</h2>
            </div>
            <div className="v2-stagger">
              {meta.paragraphs.map((p, i) => <p key={i} style={{ ...para, maxWidth: "58ch", marginTop: i ? 16 : 0 }}>{p}</p>)}
            </div>
          </div>
        </section>

        {/* Collections */}
        {families.length > 0 && (
          <section id="collections" className="wb-wrap" style={{ paddingBottom: "clamp(56px, 6vw, 96px)" }}>
            <div className="wb-head" style={{ paddingTop: "clamp(40px, 4.5vw, 64px)", borderTop: `1px solid ${T.line}` }}>
              <div>
                <div style={{ ...eyebrow, marginBottom: 14 }}>{families.length} collection{families.length === 1 ? "" : "s"}</div>
                <h2 style={h2}>The {brand} collections.</h2>
              </div>
              {families.length > 8 && <button type="button" className="wb-textlink" data-allcoll onClick={() => setAllColl((v) => !v)}>{allColl ? "Show fewer" : `See all ${families.length}`}</button>}
            </div>
            <div className="wb-colls">
              {shownColl.map((f) => (
                <Link key={f.slug} to={`/collections/${f.slug}`} className="wb-coll">
                  <div className="wb-coll-img">{f.image && <img src={getMediaUrl(f.image)} alt={`${brand} ${f.name}`} className="wt-img" style={photo} loading="lazy" />}</div>
                  <div className="wb-coll-name"><span>{f.name}</span><span>{f.from}</span></div>
                  <div className="wb-coll-sub">{f.count} watch{f.count === 1 ? "" : "es"}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Watches */}
        <section id="watches" className="wb-wrap" style={{ paddingBottom: "clamp(56px, 6vw, 96px)" }}>
          <div className="wb-head" style={{ paddingTop: "clamp(40px, 4.5vw, 64px)", borderTop: `1px solid ${T.line}` }}>
            <div>
              <div style={{ ...eyebrow, marginBottom: 14 }}>{grid.length} watch{grid.length === 1 ? "" : "es"}</div>
              <h2 style={h2}>{brand} watches.</h2>
            </div>
            <div className="wb-moves" role="group" aria-label="Movement">
              {["All", "Quartz", "Automatic"].filter((m) => m === "All" || counts[m] > 0).map((m) => (
                <button key={m} type="button" className="erv2-pill" data-move={m} aria-pressed={m === movement} onClick={() => { setMovement(m); setVisible(STEP); }}>
                  <PillTick />{m === "All" ? "All movements" : m}<span className="erv2-pill-n">{counts[m]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="erv2-grid" style={{ display: "grid", gap: "clamp(34px, 3.4vw, 52px) clamp(12px, 1.6vw, 24px)", marginTop: "clamp(28px, 3vw, 44px)" }}>
            {grid.slice(0, visible).map((w) => {
              const href = `/watches/${w.slug}`;
              const saved = isFavorite(w.id);
              return (
                <div key={w.id} className="erv2-card" data-movement={w.movement} style={{ position: "relative" }}>
                  <Link to={href} style={{ display: "block" }}>
                    <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: TILE, overflow: "hidden" }}>
                      {w.image && <img src={getMediaUrl(w.image)} alt={`${brand} ${w.display}`} className="erv2-blend erv2-main-img wt-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "11%", ...photo }} loading="lazy" />}
                      <span className="erv2-add">View watch</span>
                    </div>
                    {w.collection && <div style={{ marginTop: 14, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.collection}</div>}
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, marginTop: 6 }}>
                      <span style={{ fontSize: 14.5, lineHeight: 1.45, color: T.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w.display}</span>
                      <span style={{ flex: "none", fontSize: 14, color: T.text }}>{money(w.price)}</span>
                    </div>
                    {w.spec && <div className="wb-sub">{w.spec}</div>}
                  </Link>
                  <button type="button" className="erv2-save" aria-pressed={saved} aria-label={saved ? `Remove ${w.display} from saved` : `Save ${w.display}`}
                    onClick={() => toggleFavorite(w.id, w.name, w.image ? getMediaUrl(w.image) : "", href)}
                    style={{ position: "absolute", top: 6, right: 6, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: 0, color: T.text }}>
                    <svg width="20" height="18" viewBox="0 0 20 18" fill={saved ? "currentColor" : "none"} aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.7 2.8-2.7 4.6-2.700C17 1.400 19 3.300 19 5.900c0 3.700-3.600 6.800-9 10.700z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              );
            })}
          </div>

          {grid.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: "clamp(40px, 4.5vw, 64px)" }}>
              <span style={{ fontSize: 13, color: T.textMuted }}>Showing {Math.min(visible, grid.length)} of {grid.length} watches</span>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "12px 30px" }}>
                {visible < grid.length && (
                  <button type="button" className="erv2-more" onClick={() => setVisible((v) => v + STEP * 2)}
                    style={{ padding: "15px 34px", cursor: "pointer", background: "transparent", border: `1px solid ${T.text}`, fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Show more watches</button>
                )}
                <Link to={`/watches?brand=${brand}`} className="wb-textlink">Filter all {brand} watches</Link>
              </span>
            </div>
          )}
        </section>

        {/* Why we sell it: the page's one sand band */}
        <section className="wb-why">
          <div className="wb-wrap wb-sec wb-whygrid">
            <div className="v2-stagger">
              <div style={{ ...eyebrow, marginBottom: 18 }}>Why we sell it</div>
              <h2 style={{ ...h2, maxWidth: "17ch" }}>{meta.whyHeadline}</h2>
            </div>
            <div className="v2-stagger">
              <p style={{ ...para, maxWidth: "56ch" }}>{meta.whyBody}</p>
              <div className="wb-actions">
                <Link to="/contact" className="wb-btn">See them in the showroom</Link>
                <Link to="/watches" className="wb-textlink">All watches</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <FooterV2 />
    </div>
  );
};

export default WatchBrandV2;
