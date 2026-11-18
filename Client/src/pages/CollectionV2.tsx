import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { useFavorites } from "../contexts/FavoritesContext";
import { cleanWatchName, roamerName, inferMovement, caseMm, money, PHOTO } from "./WatchesV2";
import { LISTING_CSS, GROUND, TILE, PillTick } from "../components/home-v2/listingShared";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * CollectionV2 — one template, every watch collection. Route: /collections/:slug.
 * Light redesign (Nov 2026) in the same family as the watch brand pages: a centred opening,
 * a line-up of five watches from the collection on a pale tile (a collection is one case in
 * many dials, so the page opens by showing exactly that), a facts row, the watches on the
 * listing's own cards, the brand's neighbouring collections, and the sourcing note on the
 * page's one sand band.
 *
 * REAL data: GET /watches/collections/:slug returns the collection, its brand and its watches.
 * Neighbouring collections come from GET /watches/brands/slug/:slug/collections.
 *
 * Everything stated in the opening and the facts row is worked out from the watches returned
 * (count, lowest price, case size, movement). Movement is inferred from the name/description
 * where the specification is empty.
 */

const pageX = "clamp(20px, 4vw, 64px)";
const eyebrow: React.CSSProperties = { fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text };
const h2: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(26px, 2.6vw, 38px)", lineHeight: 1.18, margin: 0, color: T.text };
const para: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.8, color: T.text, margin: 0 };
const STEP = 12;

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Price, low to high" },
  { value: "high", label: "Price, high to low" },
  { value: "name", label: "Name, A to Z" },
];

// "Timeless Chronograph (Men)" → { title: "Timeless Chronograph", who: "Men's" }
const splitName = (name: string): { title: string; who: string } => {
  const m = name.match(/^(.*?)\s*\((men|women|man|woman|unisex)\)\s*$/i);
  if (!m) return { title: name, who: "" };
  const g = m[2].toLowerCase();
  return { title: m[1], who: g.startsWith("wom") ? "Women's" : g.startsWith("m") ? "Men's" : "" };
};
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Inside a collection the collection's own name is noise: "Clubmaster Classic - Chrono - Black"
// reads "Chrono, Black". Festina's reference (F20560/1) moves to a small label above the name,
// because it is the only thing that tells two blue-dial chronographs apart.
const festinaRef = (name: string): string => (name.match(/\bF\d{4,5}\/[0-9A-Z]{1,2}\b/i)?.[0] || "").toUpperCase();
const displayName = (name: string, brand: string, title: string): string => {
  let n = (brand === "Roamer" && roamerName(name)) || cleanWatchName(name, brand, "", 64);
  const stripped = n.replace(new RegExp(`^\\s*${esc(title)}\\s*[-,·]?\\s*`, "i"), "");
  if (stripped.length > 2) n = stripped;
  n = n
    .replace(/\s+-\s+/g, ", ")
    .replace(/[,.]?\s*\b(wo)?m[ae]n('?s)?\b\.?\s*$/i, "")
    .replace(/^(wo)?m[ae]n'?s\s+/i, "")
    .replace(/[,.\s]+$/g, "")
    .trim();
  return n ? n.charAt(0).toUpperCase() + n.slice(1) : name;
};

interface CW {
  id: string; name: string; display: string; slug: string; ref: string; price: number; image?: string;
  movement: "Quartz" | "Automatic"; mm: number | null; spec: string; featured: boolean;
}
interface CollMeta { name: string; title: string; who: string; slug: string; brand: string; brandSlug: string }

const CollectionV2 = (): JSX.Element => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [meta, setMeta] = useState<CollMeta | null>(null);
  const [watches, setWatches] = useState<CW[]>([]);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");
  const [sort, setSort] = useState("featured");
  const [movement, setMovement] = useState("All");
  const [visible, setVisible] = useState(STEP);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setStatus("loading"); setSort("featured"); setMovement("All"); setVisible(STEP); setSiblings([]);
    let live = true;

    fetch(`${API_BASE_URL}/watches/collections/${collectionSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        const c = d?.data?.collection;
        const list: any[] = d?.data?.watches || [];
        if (!d?.success || !c) { setStatus("missing"); return; }
        const brand: string = c.brand?.name || "";
        const { title, who } = splitName(c.name || "");
        setMeta({ name: c.name, title, who, slug: c.slug, brand, brandSlug: c.brand?.slug || "" });
        setWatches(
          list.map((w) => {
            const sp = w.specifications || {};
            const name: string = w.name || "Watch";
            const move = inferMovement(`${name} ${w.description || ""}`, sp.movement);
            const mm = caseMm(sp.case_diameter, name);
            return {
              id: String(w.id), name, slug: w.slug || "",
              display: displayName(name, brand, title),
              ref: brand === "Festina" ? festinaRef(name) : "",
              price: Number(w.sale_price ?? w.base_price) || 0,
              image: (w.images?.find((i: any) => i.is_primary) || w.images?.[0])?.image_url,
              movement: move, mm: mm != null ? Math.round(mm) : null,
              spec: [move, mm != null ? `${Math.round(mm)}mm` : null].filter(Boolean).join(" · "),
              featured: !!w.is_featured,
            } as CW;
          }).filter((w) => w.price > 0)
        );
        setStatus("ok");

        if (c.brand?.slug) {
          fetch(`${API_BASE_URL}/watches/brands/slug/${c.brand.slug}/collections`)
            .then((r) => r.json())
            .then((sd) => { if (live) setSiblings((sd?.data || []).filter((x: any) => (x.watches_count || 0) > 0)); })
            .catch(() => {});
        }
      })
      .catch(() => { if (live) setStatus("missing"); });
    return () => { live = false; };
  }, [collectionSlug]);

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
  }, [status, collectionSlug, watches.length, siblings.length]);

  const counts = useMemo(() => ({ All: watches.length, Quartz: watches.filter((w) => w.movement === "Quartz").length, Automatic: watches.filter((w) => w.movement === "Automatic").length } as Record<string, number>), [watches]);
  const mixedMoves = counts.Quartz > 0 && counts.Automatic > 0;

  const facts = useMemo(() => {
    if (!watches.length) return [] as { value: string; label: string }[];
    const sizes = Array.from(new Set(watches.map((w) => w.mm).filter((v): v is number => v != null))).sort((a, b) => a - b);
    const from = Math.min(...watches.map((w) => w.price));
    return [
      { value: String(watches.length), label: watches.length === 1 ? "Watch" : "Watches" },
      { value: money(from), label: "Prices from" },
      sizes.length ? { value: sizes.length === 1 ? `${sizes[0]}mm` : `${sizes[0]} to ${sizes[sizes.length - 1]}mm`, label: sizes.length === 1 ? "Case size" : "Case sizes" } : { value: "2 years", label: "Manufacturer warranty" },
      { value: mixedMoves ? "Quartz & automatic" : counts.Automatic ? "Automatic" : "Quartz", label: mixedMoves ? "Movements" : "Movement" },
    ];
  }, [watches, counts, mixedMoves]);

  // Opening line-up: five watches taken evenly through the collection, so the row shows its spread.
  const lineup = useMemo(() => {
    const withImg = watches.filter((w) => w.image);
    const n = Math.min(5, withImg.length);
    if (n < 3) return withImg.slice(0, 1);
    const take = n === 4 ? 3 : n;
    return Array.from({ length: take }, (_, i) => withImg[Math.round((i * (withImg.length - 1)) / (take - 1))]);
  }, [watches]);

  const items = useMemo(() => {
    const list = movement === "All" ? [...watches] : watches.filter((w) => w.movement === movement);
    if (sort === "name") list.sort((a, b) => a.display.localeCompare(b.display));
    else if (sort === "low") list.sort((a, b) => a.price - b.price);
    else if (sort === "high") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [watches, sort, movement]);

  // Neighbours: the same collection for the other audience first (Men / Women), then the brand's largest.
  const more = useMemo(() => {
    if (!meta) return [] as any[];
    const others = siblings.filter((s) => s.slug !== meta.slug);
    const twin = meta.who ? others.find((s) => splitName(s.name).title === meta.title) : undefined;
    const rest = others.filter((s) => s !== twin).sort((a, b) => (b.watches_count || 0) - (a.watches_count || 0));
    return (twin ? [twin, ...rest] : rest).slice(0, 4);
  }, [siblings, meta]);

  const shell = (children: React.ReactNode) => (
    <div style={{ background: GROUND, minHeight: "100vh", fontFamily: FONT_BODY, color: T.text, paddingTop: "var(--v2nav-h, 113px)" }}>
      <NavigationV2 solid />
      {children}
      <FooterV2 />
    </div>
  );

  if (status === "loading") {
    return shell(<div style={{ padding: "140px 24px", textAlign: "center", color: T.textMuted, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>Loading the collection</div>);
  }
  if (status === "missing" || !meta) {
    return shell(
      <div style={{ padding: "110px 24px", textAlign: "center" }}>
        <h1 style={{ ...h2, marginBottom: 16 }}>We couldn’t find that collection.</h1>
        <p style={{ ...para, margin: "0 auto 30px", maxWidth: "40ch" }}>It may have moved, or the name has changed. The full range is on the watches page.</p>
        <Link to="/watches" style={{ display: "inline-block", padding: "16px 30px", background: T.ink, color: T.cream, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none" }}>All watches</Link>
      </div>
    );
  }

  const ph = PHOTO[meta.brand] || { scale: 1 };
  const photo = { ["--s" as string]: ph.scale, filter: ph.filter } as React.CSSProperties;
  const brandHref = `/${meta.brandSlug}`;
  const from = watches.length ? money(Math.min(...watches.map((w) => w.price))) : "";
  const standfirst = watches.length
    ? `${watches.length === 1 ? "One watch" : `${watches.length} watches`} from ${meta.brand}${from ? `, from ${from}` : ""}. Within a collection the case and the movement hold steady. What changes is the dial and the strap.`
    : `The ${meta.title} collection from ${meta.brand}.`;

  return (
    <div ref={rootRef} className="cl" style={{ background: GROUND, minHeight: "100vh", fontFamily: FONT_BODY, color: T.text, overflowX: "clip", paddingTop: "var(--v2nav-h, 113px)" }}>
      <style>{LISTING_CSS}</style>
      <style>{`
        .cl a { color: inherit; text-decoration: none; }
        .cl-wrap { max-width: 1320px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }
        .wt-img { transform: scale(var(--s, 1)); }
        .erv2-card:hover .wt-img, .cl-coll:hover .wt-img { transform: scale(calc(var(--s, 1) * 1.035)); }

        @keyframes clRise { from { opacity: 0; transform: translateY(20px); } }
        .cl .v2-reveal:not(.is-in), .cl .v2-stagger:not(.is-in) > * { opacity: 0; }
        .cl .v2-reveal.is-in, .cl .v2-stagger.is-in > * { animation: clRise 1.1s cubic-bezier(0.22,1,0.36,1) backwards; }
        .cl .v2-reveal-d1.is-in { animation-delay: 0.14s; }
        .cl .v2-stagger.is-in > :nth-child(2) { animation-delay: 0.08s; }
        .cl .v2-stagger.is-in > :nth-child(3) { animation-delay: 0.16s; }
        .cl .v2-stagger.is-in > :nth-child(4) { animation-delay: 0.24s; }
        .cl .v2-stagger.is-in > :nth-child(n+5) { animation-delay: 0.32s; }

        .cl-btn { display: inline-block; padding: 16px 30px; background: ${T.ink}; color: ${T.cream} !important; border: 0; cursor: pointer; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
        .cl-btn:hover { background: ${T.text}; }
        .cl-textlink { display: inline-block; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; padding: 14px 0 5px; transition: border-color 0.2s ease; }
        .cl-textlink:hover { border-bottom-color: ${T.gold}; }

        /* opening */
        .cl-open { text-align: center; padding-top: clamp(26px, 3vw, 44px); }
        .cl-crumb { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: clamp(30px, 4vw, 56px); }
        .cl-crumb a:hover { color: ${T.text}; }
        .cl-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(40px, 5.4vw, 80px); line-height: 1.04; margin: 16px auto 0; max-width: 16ch; color: ${T.text}; text-wrap: balance; }
        .cl-stand { max-width: 52ch; margin: 22px auto 0 !important; }

        /* the line-up: one case, many dials */
        .cl-line { position: relative; margin-top: clamp(30px, 3.6vw, 52px); background: ${TILE}; display: grid; grid-template-columns: repeat(var(--n, 5), minmax(0, 1fr)); align-items: end; padding: clamp(18px, 2.4vw, 36px) clamp(8px, 3vw, 48px) 0; overflow: hidden; }
        .cl-line a { position: relative; display: block; aspect-ratio: 1 / 1.16; }
        .cl-line img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; mix-blend-mode: multiply; transition: transform 0.9s cubic-bezier(0.22,1,0.36,1); }
        .cl-line a:hover img { transform: scale(calc(var(--s, 1) * 1.05)); }
        .cl-line.is-one { grid-template-columns: minmax(0, 320px); justify-content: center; }
        .cl-linecap { display: flex; justify-content: space-between; gap: 16px; margin-top: 12px; font-size: 12.5px; color: ${T.textMuted}; }

        /* facts */
        .cl-facts { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: clamp(36px, 4vw, 60px); border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .cl-fact { padding: clamp(22px, 2.4vw, 32px) 16px; text-align: center; border-left: 1px solid ${T.line}; }
        .cl-fact:first-child { border-left: 0; }
        .cl-fact b { display: block; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(22px, 2.2vw, 30px); line-height: 1.1; color: ${T.text}; }
        .cl-fact span { display: block; margin-top: 9px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }

        /* watches */
        .cl-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px 24px; padding-top: clamp(44px, 5vw, 76px); }
        .cl-count { font-size: 13px; color: ${T.textMuted}; }
        .cl-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 12px 26px; }
        .cl-moves { display: flex; flex-wrap: wrap; gap: 8px; }
        .cl-moves .erv2-pill { height: 40px; padding: 0 16px; }
        .cl-sort { display: inline-flex; align-items: center; gap: 10px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }
        .cl-sort select { appearance: none; -webkit-appearance: none; cursor: pointer; background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23332F2A'/%3E%3C/svg%3E") no-repeat right 2px center; border: 0; border-bottom: 1px solid ${T.ruleStrong}; border-radius: 0; padding: 9px 22px 8px 0; font-family: ${FONT_BODY}; font-size: 13.5px; letter-spacing: 0; text-transform: none; color: ${T.text}; }
        .cl-sort select:hover, .cl-sort select:focus-visible { border-bottom-color: ${T.gold}; outline: none; }
        .cl-ref { margin-top: 14px; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; }
        .cl-sub { margin-top: 5px; font-size: 13px; color: ${T.textMuted}; }

        /* more collections */
        .cl-head { display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 14px 24px; padding-top: clamp(40px, 4.5vw, 64px); border-top: 1px solid ${T.line}; }
        .cl-colls { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(28px, 3vw, 44px) clamp(12px, 1.6vw, 24px); margin-top: clamp(28px, 3vw, 44px); }
        .cl-coll { display: block; }
        .cl-coll-img { position: relative; aspect-ratio: 1 / 0.86; background: ${TILE}; overflow: hidden; }
        .cl-coll-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 9%; mix-blend-mode: multiply; transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .cl-coll-name { margin-top: 14px; font-size: 15px; color: ${T.text}; }
        .cl-coll-sub { margin-top: 5px; font-size: 13px; color: ${T.textMuted}; }

        /* sourcing: the page's one sand band */
        .cl-src { background: ${T.sand}; }
        .cl-srcgrid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(28px, 6vw, 104px); align-items: center; padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(56px, 6vw, 96px); }
        .cl-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px 30px; margin-top: 30px; }

        @media (max-width: 1023px) {
          .cl-srcgrid { grid-template-columns: 1fr; }
          .cl-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .cl-fact:nth-child(3) { border-left: 0; }
          .cl-fact:nth-child(n+3) { border-top: 1px solid ${T.line}; }
        }
        @media (max-width: 640px) {
          .cl-line { margin-left: calc(-1 * ${pageX}); margin-right: calc(-1 * ${pageX}); grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 18px 6px 0; }
          .cl-line:not(.is-one) a:nth-child(n+4) { display: none; }
          .cl-linecap span:last-child { display: none; }
          .cl-fact { padding: 20px 8px; }
          .cl-bar { align-items: flex-start; }
          .cl-tools { width: 100%; justify-content: space-between; }
          .cl-colls { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
          .cl-coll-name { font-size: 14px; }
          .cl-ref { margin-top: 12px; }
          .cl-sub { display: none; }
          .cl-actions .cl-btn { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cl .v2-reveal, .cl .v2-stagger > * { opacity: 1 !important; animation: none !important; }
        }
      `}</style>

      <NavigationV2 solid />

      <div key={meta.slug}>
        {/* Opening */}
        <section className="cl-wrap cl-open">
          <div className="v2-stagger">
            <div className="cl-crumb">
              <Link to="/">Home</Link><span>/</span>
              <Link to="/watches">Watches</Link><span>/</span>
              <Link to={brandHref}>{meta.brand}</Link><span>/</span>
              <span style={{ color: T.text }}>{meta.title}</span>
            </div>
            <div style={eyebrow}>{meta.brand} · {meta.who ? `${meta.who} collection` : "Collection"}</div>
            <h1 className="cl-h1">{meta.title}</h1>
            <p className="cl-stand" style={para}>{standfirst}</p>
          </div>

          {lineup.length > 0 && (
            <>
              <div className={`cl-line v2-reveal v2-reveal-d1${lineup.length === 1 ? " is-one" : ""}`} style={{ ["--n" as string]: lineup.length }}>
                {lineup.map((w) => (
                  <Link key={w.id} to={`/watches/${w.slug}`} aria-label={`${meta.brand} ${meta.title}, ${w.display}`}>
                    <img src={getMediaUrl(w.image!)} alt={`${meta.brand} ${meta.title}, ${w.display}`} className="wt-img" style={photo} />
                  </Link>
                ))}
              </div>
              {lineup.length > 1 && (
                <div className="cl-linecap">
                  <span>From the {watches.length} in the collection</span>
                  <span>Authorised {meta.brand} retailer</span>
                </div>
              )}
            </>
          )}

          {facts.length > 0 && (
            <div className="cl-facts v2-stagger">
              {facts.map((f) => <div key={f.label} className="cl-fact"><b>{f.value}</b><span>{f.label}</span></div>)}
            </div>
          )}
        </section>

        {/* Watches */}
        <section id="watches" className="cl-wrap" style={{ paddingBottom: "clamp(56px, 6vw, 96px)" }}>
          <div className="cl-bar">
            <h2 style={h2}>The watches.</h2>
            <div className="cl-tools">
              {mixedMoves && (
                <div className="cl-moves" role="group" aria-label="Movement">
                  {["All", "Quartz", "Automatic"].map((m) => (
                    <button key={m} type="button" className="erv2-pill" data-move={m} aria-pressed={m === movement} onClick={() => { setMovement(m); setVisible(STEP); }}>
                      <PillTick />{m === "All" ? "All" : m}<span className="erv2-pill-n">{counts[m]}</span>
                    </button>
                  ))}
                </div>
              )}
              <label className="cl-sort">
                <span>Sort</span>
                <select value={sort} onChange={(e) => { setSort(e.target.value); setVisible(STEP); }}>
                  {SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="erv2-grid" style={{ display: "grid", gap: "clamp(34px, 3.4vw, 52px) clamp(12px, 1.6vw, 24px)", marginTop: "clamp(24px, 2.6vw, 38px)" }}>
            {items.slice(0, visible).map((w) => {
              const href = `/watches/${w.slug}`;
              const saved = isFavorite(w.id);
              const label = `${meta.brand} ${meta.title}, ${w.display}`;
              return (
                <div key={w.id} className="erv2-card" data-movement={w.movement} style={{ position: "relative" }}>
                  <Link to={href} style={{ display: "block" }}>
                    <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: TILE, overflow: "hidden" }}>
                      {w.image && <img src={getMediaUrl(w.image)} alt={label} className="erv2-blend erv2-main-img wt-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "11%", ...photo }} loading="lazy" />}
                      <span className="erv2-add">View watch</span>
                    </div>
                    {w.ref && <div className="cl-ref">Ref. {w.ref}</div>}
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, marginTop: w.ref ? 6 : 14 }}>
                      <span style={{ fontSize: 14.5, lineHeight: 1.45, color: T.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w.display}</span>
                      <span style={{ flex: "none", fontSize: 14, color: T.text }}>{money(w.price)}</span>
                    </div>
                    {w.spec && <div className="cl-sub">{w.spec}</div>}
                  </Link>
                  <button type="button" className="erv2-save" aria-pressed={saved} aria-label={saved ? `Remove ${label} from saved` : `Save ${label}`}
                    onClick={() => toggleFavorite(w.id, w.name, w.image ? getMediaUrl(w.image) : "", href)}
                    style={{ position: "absolute", top: 6, right: 6, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: 0, color: T.text }}>
                    <svg width="20" height="18" viewBox="0 0 20 18" fill={saved ? "currentColor" : "none"} aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.7 2.8-2.7 4.6-2.7C17 1.4 19 3.3 19 5.9c0 3.7-3.6 6.8-9 10.7z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              );
            })}
          </div>

          {items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: "clamp(40px, 4.5vw, 64px)" }}>
              <span className="cl-count">Showing {Math.min(visible, items.length)} of {items.length} watches</span>
              {visible < items.length && (
                <button type="button" className="erv2-more" onClick={() => setVisible((v) => v + STEP)}
                  style={{ padding: "15px 34px", cursor: "pointer", background: "transparent", border: `1px solid ${T.text}`, fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Show more watches</button>
              )}
            </div>
          )}
        </section>

        {/* More from the brand */}
        {more.length > 0 && (
          <section className="cl-wrap" style={{ paddingBottom: "clamp(56px, 6vw, 96px)" }}>
            <div className="cl-head">
              <div>
                <div style={{ ...eyebrow, marginBottom: 14 }}>Keep looking</div>
                <h2 style={h2}>More from {meta.brand}.</h2>
              </div>
              <Link to={brandHref} className="cl-textlink">All {meta.brand} collections</Link>
            </div>
            <div className="cl-colls v2-stagger">
              {more.map((s) => {
                const img = s.preview_image || s.image_url;
                return (
                  <Link key={s.slug} to={`/collections/${s.slug}`} className="cl-coll">
                    <div className="cl-coll-img">{img && <img src={getMediaUrl(img)} alt={`${meta.brand} ${s.name}`} className="wt-img" style={photo} loading="lazy" />}</div>
                    <div className="cl-coll-name">{s.name}</div>
                    <div className="cl-coll-sub">{s.watches_count} watch{s.watches_count === 1 ? "" : "es"}</div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Sourcing */}
        <section className="cl-src">
          <div className="cl-wrap cl-srcgrid">
            <div className="v2-stagger">
              <div style={{ ...eyebrow, marginBottom: 18 }}>Not listed here</div>
              <h2 style={{ ...h2, maxWidth: "16ch" }}>We can order the rest of the collection.</h2>
            </div>
            <div className="v2-stagger">
              <p style={{ ...para, maxWidth: "56ch" }}>We are an authorised {meta.brand} retailer, so anything in the {meta.title} collection we do not hold can be ordered, usually within two to three weeks. Tell us the reference, or describe it and we will find it.</p>
              <div className="cl-actions">
                <Link to="/contact" className="cl-btn">Ask us to source one</Link>
                <Link to={brandHref} className="cl-textlink">All {meta.brand}</Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <FooterV2 />
    </div>
  );
};

export default CollectionV2;
