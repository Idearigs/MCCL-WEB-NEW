import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL, { getMediaUrl } from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY, SP } from "./tokens";
import JournalV2 from "./JournalV2";
import { useFavorites } from "../../contexts/FavoritesContext";

/**
 * MainContentV2 — the homepage v2 body (everything between nav and footer).
 * Visual design from design_handoff_mcculloch_homepage. Videos, products and
 * imagery are the site's real assets; every link points at a real route.
 */

interface Product {
  id: string; name: string; slug: string; price: string; image: { url: string; alt: string } | null;
  line: string;                                                   // e.g. "Shoulder set · Lab grown diamond"
  metals: { id: string; name: string; image: { url: string; alt: string } | null }[];
}

// Resolve a product's preview render for a given metal name (e.g. "yellow gold",
// "white gold"). Prefers the metal-preview image, then any image of that metal.
const pickMetalImage = (p: any, re: RegExp): { url: string; alt: string } | null => {
  const metal = (p.available_metals || []).find((m: any) => re.test(m?.name || ""));
  const imgs = p.images || [];
  if (metal) {
    const g = imgs.find((i: any) => i.metal_id === metal.id && i.is_metal_preview)
      || imgs.find((i: any) => i.metal_id === metal.id);
    if (g?.url) return { url: g.url, alt: g.alt || p.name || "" };
  }
  return null;
};
// Card shows the Yellow Gold render, falling back to the primary image.
const pickGoldImage = (p: any): { url: string; alt: string } | null =>
  pickMetalImage(p, /yellow\s*gold/i) || p.image || null;
interface Watch { id: string; name: string; slug: string; base_price: number; sale_price?: number; image: { url: string; alt: string } | null; }

// Watch names arrive as long ALL-CAPS strings that repeat the brand and tack on the ref
// ("FESTINA WOMEN'S BLACK TITANIUM WATCH BRACELET F20697/3"). Strip the brand, ref and the
// filler word "watch", then title-case. Kept local so the eager homepage bundle doesn't have
// to pull in the lazy WatchesV2 page just for this helper.
const cleanWatchName = (name?: string, brand?: string, ref?: string): string => {
  let n = name || "";
  if (brand) n = n.replace(new RegExp(`^\\s*${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "");
  if (ref) n = n.split(ref).join(" ");
  n = n
    .replace(/\b[A-Z]{1,3}[- ]?\d{3,}[/\dA-Za-z.]*\b/g, " ")
    .replace(/\bwatch(es)?\b/gi, " ")
    .replace(/[·,\-\s]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  n = n.toLowerCase().replace(/(^|\s)(\w)/g, (_, p, c) => p + c.toUpperCase());
  return n || (name || "");
};

// Self-hosted, muted, looping background video that behaves like object-fit: cover.
// - `formats` sets the source order: the browser takes the first it can play, so list the
//   smaller file first (hero: the MP4 is 2.7 MB, the WebM 11 MB).
// - Plays only while on screen; `lazy` videos also download nothing until then.
// - A pause/play button (WCAG 2.2.2), and no autoplay when the device asks for reduced motion.
const VideoCover = ({ base, poster, title, formats = ["webm", "mp4"], lazy = false, buttonStyle }: {
  base: string; poster: string; title: string; formats?: ("webm" | "mp4")[]; lazy?: boolean; buttonStyle?: React.CSSProperties;
}) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const userPaused = useRef(false);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) userPaused.current = true; // stays on the poster until the visitor presses play
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused.current) v.play().catch(() => {});
      else if (!e.isIntersecting) v.pause();
    }, { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  const toggle = () => {
    const v = ref.current; if (!v) return;
    if (v.paused) { userPaused.current = false; v.play().catch(() => {}); }
    else { userPaused.current = true; v.pause(); }
  };
  return (
    <>
      <video
        ref={ref} muted loop playsInline preload={lazy ? "none" : "auto"} poster={poster} aria-label={title}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
      >
        {formats.map(f => <source key={f} src={`${base}.${f}`} type={`video/${f}`} />)}
      </video>
      <button type="button" onClick={toggle} className="v2-vidbtn" aria-label={playing ? `Pause the film: ${title}` : `Play the film: ${title}`}
        style={{ position: "absolute", zIndex: 3, width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(248,246,240,0.45)", background: "rgba(20,18,15,0.42)", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto", ...buttonStyle }}>
        {playing
          ? <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><rect x="1" y="1" width="3" height="12" fill="currentColor" /><rect x="8" y="1" width="3" height="12" fill="currentColor" /></svg>
          : <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true"><path d="M2 1 L11 7 L2 13 Z" fill="currentColor" /></svg>}
      </button>
    </>
  );
};

// Metal swatch colours for the new-in cards.
const SWATCH: Record<string, string> = { "yellow gold": "#D6B46A", "white gold": "#E4E3DF", "rose gold": "#DDA58C", platinum: "#CFCFD3", silver: "#C6C8CB" };
const swatchFor = (name: string) => SWATCH[name.toLowerCase()] || "#D8D2C6";
const roundPrice = (n?: number) => (n ? "£" + Math.round(n).toLocaleString("en-GB") : "");

// Small labels: 12px minimum, darker gold on light grounds for contrast; brand gold on dark ones.
const eyebrow: React.CSSProperties = { fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: T.goldText };
const eyebrowDark: React.CSSProperties = { ...eyebrow, color: T.gold };
const h2Style: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, lineHeight: 1.06, margin: 0, color: T.ink };
const pageX = "clamp(24px, 3vw, 52px)";

// Only published reviews are shown; with none, the quotes are left out (no stand-in quotes).
interface Review { id: string; author_name: string; category?: string; body: string; created_at?: string; }

// Where visitors can check the reviews for themselves: the shop on Google Maps.
const GOOGLE_REVIEWS_URL = "https://www.google.com/maps/search/?api=1&query=McCulloch+Jewellers+7+The+Square+Beeston+Nottingham";

const MainContentV2 = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // "Just off the bench" = most recently updated products (surfaces pieces
    // that just got new images/edits). Image-having products already outrank
    // image-less ones server-side. Cards show the YELLOW GOLD render where a
    // product has one (falls back to its primary image otherwise).
    // /products (not /products/category) returns ring types, stones and metals for the card line.
    fetch(`${API_BASE_URL}/products?category=engagement-rings&sort=updated_at&order=desc&limit=8`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.products) {
          const cap = (t?: string) => (t ? t.charAt(0) + t.slice(1).toLowerCase() : "");
          setProducts(d.data.products.slice(0, 4).map((p: any) => {
            const style = (p.ringTypes || []).map((r: any) => r.name).find((n: string) => !/wedding band/i.test(n));
            const stone = (p.gemstones || [])[0]?.name;
            const metals = (p.available_metals || [])
              .map((m: any) => ({ id: m.id, name: m.name, image: pickMetalImage(p, new RegExp(`^${m.name}$`, "i")) }))
              .filter((m: any) => m.image);
            return {
              id: p.id, name: p.name, slug: p.slug, price: p.price,
              image: pickGoldImage(p),
              line: [cap(style), cap(stone)].filter(Boolean).join(" · ") || "Engagement ring",
              metals,
            };
          }));
        }
      })
      .catch(() => {});
    // A mix of brands rather than four near-identical watches from one.
    Promise.all(["roamer", "briston", "festina"].map(b =>
      fetch(`${API_BASE_URL}/watches?brand=${b}&in_stock=true&limit=2`).then(r => r.json()).then(d => (d.success && d.data?.watches) || []).catch(() => [])))
      .then(([ro, br, fe]) => setWatches([ro[0], br[0], fe[0], ro[1] || br[1] || fe[1]].filter(Boolean).slice(0, 4)))
      .catch(() => {});
    fetch(`${API_BASE_URL}/reviews?featured=true&limit=3`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.reviews?.length) setReviews(d.data.reviews.slice(0, 3)); })
      .catch(() => {});
  }, []);

  // Published featured reviews only. [body, author, category, date]
  const quotes: [string, string, string, string][] = reviews.map(r => [
    r.body, r.author_name, r.category || "",
    r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "",
  ]);
  const { isFavorite, toggleFavorite } = useFavorites();
  // Metal chosen per new-in card (swatches replace the old silent hover swap).
  const [cardMetal, setCardMetal] = useState<Record<string, string>>({});

  // Slide the testimonials in when the section scrolls into view.
  const quotesRef = useRef<HTMLDivElement>(null);
  const [quotesIn, setQuotesIn] = useState(false);
  const [activeQuote, setActiveQuote] = useState(0);
  const onQuotesScroll = () => {
    const el = quotesRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setActiveQuote(i);
  };
  useEffect(() => {
    const el = quotesRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setQuotesIn(true); io.disconnect(); } },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
    // The quotes only render once reviews have loaded, so (re)attach when they arrive.
  }, [reviews.length]);

  // Reveal any [.v2-reveal] element with a soft fade-up as it enters the viewport.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = Array.from(rootRef.current?.querySelectorAll(".v2-reveal") ?? []);
    if (reduce) { targets.forEach(t => t.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
    // Re-run when async data lands: product/watch cards mount after the initial
    // pass, so they must be (re)observed or they stay stuck at opacity 0.
  }, [products, watches]);

  // overflowX "clip", not "hidden": hidden makes this wrapper its own vertical scroll box (a second
  // scrollbar that traps the wheel/trackpad gesture before the page scrolls).
  return (
    <div ref={rootRef} style={{ fontFamily: FONT_BODY, color: T.ink, background: T.paper, overflowX: "clip" }}>
      <style>{`
        .v2-panel { transition: flex 0.55s cubic-bezier(0.22,1,0.36,1); }
        .v2-panel:hover { flex: 1.9 !important; }
        .v2-panel img { transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .v2-panel:hover img { transform: scale(1.05); }
        .v2-btn-ivory { transition: background 0.3s ease, color 0.3s ease; }
        .v2-btn-ivory:hover { background: ${T.gold} !important; color: #fff !important; }
        .v2-btn-outline-l { transition: background 0.3s ease, border-color 0.3s ease; }
        .v2-btn-outline-l:hover { border-color: ${T.paper} !important; background: rgba(248,246,240,0.14); }
        .v2-btn-outline-d { transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
        .v2-btn-outline-d:hover { background: ${T.paper} !important; color: ${T.ink} !important; border-color: ${T.paper} !important; }
        .v2-btn-ink { transition: background 0.3s ease; }
        .v2-btn-ink:hover { background: ${T.gold}; }
        .v2-textlink { display: inline-block; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid ${T.ruleStrong}; padding: 14px 0 5px; transition: color 0.2s ease; }
        .v2-vidbtn { opacity: 0.85; transition: opacity 0.2s ease, background 0.2s ease; }
        .v2-vidbtn:hover, .v2-vidbtn:focus-visible { opacity: 1; background: rgba(20,18,15,0.7) !important; }
        .v2-save { transition: color 0.2s ease, background 0.2s ease; }
        .v2-save:hover { color: ${T.ink} !important; }
        .v2-swatch { transition: box-shadow 0.2s ease; }
        .v2-textlink:hover { color: ${T.gold}; }
        .v2-prodcard img { transition: transform 0.5s ease; }
        .v2-prodcard:hover img { transform: scale(1.04); }
        .v2-igcell img { transition: transform 0.6s ease; }
        .v2-igcell:hover img { transform: scale(1.06); }
        .v2-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.85s cubic-bezier(0.22,1,0.36,1), transform 0.85s cubic-bezier(0.22,1,0.36,1); will-change: opacity, transform; }
        .v2-reveal.is-in { opacity: 1; transform: none; }
        .v2-reveal-d1 { transition-delay: 0.08s; }
        .v2-reveal-d2 { transition-delay: 0.16s; }
        .v2-reveal-d3 { transition-delay: 0.24s; }
        @media (prefers-reduced-motion: reduce) { .v2-reveal { opacity: 1; transform: none; transition: none; } }

        /* ── Hero entrance: staggered rise-in on load ── */
        @keyframes v2HeroRise { from { opacity: 0; transform: translateY(115%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes v2HeroFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .v2-hero-line { display: block; overflow: hidden; }
        .v2-hero-line > span { display: block; animation: v2HeroRise 1.05s cubic-bezier(0.16,1,0.3,1) both; }
        .v2-hero-eyebrow { animation: v2HeroFade 0.9s cubic-bezier(0.22,1,0.36,1) both; }
        .v2-hero-copy { animation: v2HeroFade 1s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.75s; }
        @media (prefers-reduced-motion: reduce) {
          .v2-hero-line > span, .v2-hero-eyebrow, .v2-hero-copy { animation: none !important; opacity: 1 !important; transform: none !important; }
        }

        /* ── Tablet ── */
        @media (max-width: 1023px) {
          .v2-prodgrid { grid-template-columns: 1fr 1fr !important; }
          .v2-iggrid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
        }
        /* ── Phone ── */
        @media (max-width: 767px) {
          #top { height: 100svh !important; }
          /* Keep the hero buttons clear of the round chat button in the bottom corner */
          .v2-hero-overlay { padding-bottom: 86px !important; }
          .v2-hero-grid { grid-template-columns: 1fr !important; gap: 22px !important; }
          .v2-hero-grid > div:last-child { margin-left: 0 !important; margin-right: 0 !important; max-width: none !important; }
          .v2-hero-cta { flex-direction: column !important; }
          .v2-hero-cta > a { text-align: center; }
          .v2-split { grid-template-columns: 1fr !important; }
          .v2-prodgrid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          /* Testimonials → one-at-a-time horizontal swipe carousel */
          .v2-quotes { display: flex !important; grid-template-columns: none !important; gap: 0 !important; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .v2-quotes::-webkit-scrollbar { display: none; }
          .v2-quotes figure { flex: 0 0 100% !important; scroll-snap-align: center; border-left: none !important; padding-left: 4px !important; padding-right: 4px !important; }
          .v2-quotedots { display: flex !important; }
          /* Section headers (heading + "all" link) stack so the link never clamps */
          .v2-sechead { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .v2-journalgrid { grid-template-columns: 1fr !important; }
          /* Category band → horizontal snap carousel (no hover-expand on touch) */
          .v2-catband { height: auto !important; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding: 0 20px 0 20px !important; }
          .v2-catband::-webkit-scrollbar { display: none; }
          .v2-catband .v2-panel { flex: 0 0 68% !important; scroll-snap-align: start; aspect-ratio: 3 / 4; }
          .v2-catband .v2-panel:hover { flex: 0 0 68% !important; }
        }
      `}</style>

      {/* 1. HERO */}
      <section id="top" style={{ position: "relative", height: "100vh", minHeight: 640, background: T.inkDeep, overflow: "hidden" }}>
        <VideoCover base="/videos/hero" poster="/videos/hero-poster.jpg" title="McCulloch brand film" formats={["mp4", "webm"]}
          buttonStyle={{ top: "calc(var(--v2nav-h, 112px) + 16px)", right: pageX }} />
        {/* Steady dark shading behind the text (lower part) and the header (top), so white text keeps
            its contrast even when a bright frame passes behind it. */}
        <div className="v2-hero-overlay" style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: `132px ${pageX} 104px`, background: "linear-gradient(to top, rgba(18,16,13,0.88) 0%, rgba(18,16,13,0.66) 28%, rgba(18,16,13,0.2) 56%, rgba(18,16,13,0.08) 70%, rgba(18,16,13,0.52) 100%)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "end", gap: 48, width: "100%" }} className="v2-hero-grid">
            <div>
              <div className="v2-hero-eyebrow" style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: "#F1EBDF", textShadow: "0 1px 10px rgba(0,0,0,0.55)", marginBottom: 20 }}>The Celestial Collection — 2026</div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(40px, 5vw, 78px)", lineHeight: 0.98, margin: 0, maxWidth: "19ch", color: "#FFFFFF" }}>
                {/* One sentence per line; a long line wraps evenly rather than leaving one word alone. */}
                <span className="v2-hero-line"><span style={{ animationDelay: "0.15s", textWrap: "balance" } as React.CSSProperties}>A heritage of craftsmanship.</span></span>
                <span className="v2-hero-line"><span style={{ animationDelay: "0.32s", textWrap: "balance" } as React.CSSProperties}>A lifetime of meaning.</span></span>
              </h1>
            </div>
            <div style={{ maxWidth: 340, paddingBottom: 6, marginLeft: "auto", marginRight: "clamp(40px, 7vw, 130px)" }}>
              <p className="v2-hero-copy" style={{ margin: "0 0 22px", fontSize: 16, lineHeight: 1.6, color: "#E6DFD3", textShadow: "0 1px 10px rgba(0,0,0,0.5)" }}>Every ring is set by hand in our own workshop. Choose a stone with us, or start from a blank sheet.</p>
              <div className="v2-hero-cta" style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
                <Link to="/rings?availability=live" className="v2-btn-ivory" style={{ padding: "15px 24px", background: T.paper, color: T.ink, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>Shop new in</Link>
                <Link to="/contact" className="v2-btn-outline-l" style={{ padding: "15px 24px", border: "1px solid rgba(248,246,240,0.6)", color: "#FFFFFF", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>Book a fitting</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY BAND */}
      <section style={{ display: "flex", height: "clamp(380px, 46vh, 500px)", gap: 2, background: T.paper }} className="v2-catband">
        {[
          { to: "/rings", label: "Rings", meta: "Engagement & more", img: "/images/cat-rings.jpeg" },
          { to: "/earrings", label: "Earrings", meta: "Studs to drops", img: "/images/cat-earrings.jpeg" },
          { to: "/necklaces", label: "Necklaces", meta: "Pendants & chains", img: "/images/cat-necklaces.jpeg" },
          { to: "/bracelets", label: "Bracelets", meta: "Tennis & bangles", img: "/images/cat-bracelets.jpeg" },
        ].map((c, i) => (
          <Link key={i} to={c.to} className="v2-panel" style={{ position: "relative", flex: 1, minWidth: 0, overflow: "hidden" }}>
            {/* 480/960px copies sit beside each 2048px original (audit L5) */}
            <img src={c.img.replace(/\.jpeg$/, "-960.jpg")} srcSet={`${c.img.replace(/\.jpeg$/, "-480.jpg")} 480w, ${c.img.replace(/\.jpeg$/, "-960.jpg")} 960w, ${c.img} 2048w`}
              sizes="(max-width: 767px) 70vw, 30vw" width={960} height={960} alt={c.label} loading={i ? "lazy" : undefined}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: "auto 0 0 0", pointerEvents: "none", padding: 22, background: "linear-gradient(to top, rgba(20,18,15,0.72), rgba(20,18,15,0))" }}>
              <div style={{ color: "#FFFFFF", fontSize: 16, letterSpacing: "0.04em" }}>{c.label}</div>
              <div style={{ color: "#E6DED0", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>{c.meta}</div>
            </div>
          </Link>
        ))}
      </section>

      {/* 3. NEW ARRIVALS */}
      <section id="arrivals" style={{ padding: `${SP} ${pageX} 0` }}>
        <div className="v2-reveal v2-sechead" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, paddingBottom: 22, borderBottom: `1px solid ${T.rule}` }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 14 }}>New in</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(28px, 3vw, 44px)" }}>Just off the bench</h2>
          </div>
          <Link to="/engagement-rings" className="v2-textlink" style={{ whiteSpace: "nowrap" }}>View all</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(16px, 1.6vw, 28px)", marginTop: 40 }} className="v2-prodgrid">
          {(products.length ? products : Array.from({ length: 4 })).map((p: any, i) => (
            p && p.slug ? (
              (() => {
                const chosen = p.metals.find((m: any) => m.id === cardMetal[p.id]);
                const img = chosen?.image || p.image;
                const href = `/engagement-rings/${p.slug}`;
                const saved = isFavorite(p.id);
                return (
                  <div key={p.id || i} className={`v2-prodcard v2-reveal${i ? ` v2-reveal-d${Math.min(i, 3)}` : ""}`} style={{ position: "relative" }}>
                    <Link to={href} style={{ display: "block" }}>
                      <div style={{ position: "relative", aspectRatio: "4 / 5", background: T.tint, overflow: "hidden" }}>
                        {img?.url
                          ? <img src={getMediaUrl(img.url)} alt={`${p.name}${chosen ? ` in ${chosen.name.toLowerCase()}` : ""}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted }}>{p.name}</div>}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 16, fontSize: 15 }}><span>{p.name}</span><span style={{ color: "#56534D" }}>{p.price}</span></div>
                      <div style={{ marginTop: 4, fontSize: 13, color: T.muted }}>{p.line}</div>
                    </Link>
                    <button type="button" className="v2-save" aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
                      onClick={() => toggleFavorite(p.id, p.name, img?.url ? getMediaUrl(img.url) : "", href)}
                      style={{ position: "absolute", top: 8, right: 8, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(248,246,240,0.92)", border: 0, borderRadius: "50%", fontSize: 18, lineHeight: 1, color: saved ? T.gold : "#6E6A60" }}>{saved ? "♥" : "♡"}</button>
                    {p.metals.length > 1 && (
                      <div role="group" aria-label={`${p.name}: show in`} style={{ display: "flex", gap: 0, marginTop: 6, marginLeft: -12 }}>
                        {p.metals.map((m: any) => {
                          const on = (cardMetal[p.id] || "") === m.id;
                          return (
                            <button key={m.id} type="button" className="v2-swatch" title={m.name} aria-label={`Show in ${m.name.toLowerCase()}`} aria-pressed={on}
                              onClick={() => setCardMetal(c => ({ ...c, [p.id]: on ? "" : m.id }))}
                              style={{ width: 40, height: 40, padding: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ width: 16, height: 16, borderRadius: "50%", background: swatchFor(m.name), boxShadow: on ? `0 0 0 2px ${T.paper}, 0 0 0 3px ${T.ink}` : `inset 0 0 0 1px rgba(0,0,0,0.12)` }} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div key={i} style={{ aspectRatio: "4 / 5", background: T.tint }} />
            )
          ))}
        </div>
      </section>

      {/* 4. BESPOKE */}
      <section id="bespoke" style={{ marginTop: SP, background: T.ink, color: T.onDarkSoft }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", alignItems: "stretch" }} className="v2-split">
          <div style={{ position: "relative", minHeight: "clamp(460px, 68vh, 760px)", overflow: "hidden", background: T.inkDeep }}>
            <VideoCover base="/videos/workshop" poster="/videos/workshop-poster.jpg" title="In the workshop" lazy buttonStyle={{ top: 16, right: 16 }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, pointerEvents: "none", padding: `24px ${pageX}`, background: "linear-gradient(to top, rgba(20,18,15,0.72), rgba(20,18,15,0))" }}>
              <div style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: "#FFFFFF" }}>In the workshop — Beeston, Nottingham</div>
            </div>
          </div>
          <div className="v2-reveal" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(56px, 6vw, 104px) clamp(32px, 4.5vw, 88px)" }}>
            <div style={{ ...eyebrowDark, marginBottom: 22 }}>03 — Bespoke</div>
            <h2 style={{ ...h2Style, color: "#FFFFFF", fontSize: "clamp(34px, 3.8vw, 58px)", marginBottom: 24 }}>Designed with you.<br />Crafted by us.</h2>
            <p style={{ maxWidth: "44ch", margin: "0 0 44px", fontSize: 16, lineHeight: 1.7, color: T.onDarkBody }}>A truly personal journey, from your first idea to the finished piece. Work directly with our jewellers to create something uniquely yours, combining your vision with generations of craftsmanship.</p>
            <div>
              {[
                ["01", "Personal consultation", "Share your ideas, inspirations and preferences with our jeweller."],
                ["02", "Design & gemstone selection", "Explore your design and choose the perfect stones and precious metals."],
                ["03", "Crafted especially for you", "Your piece is expertly made, set and finished with meticulous attention to detail."],
              ].map(([n, label, note], i, a) => (
                <div key={n} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 14, alignItems: "baseline", padding: "20px 0", borderTop: `1px solid ${T.ruleDark}`, borderBottom: i === a.length - 1 ? `1px solid ${T.ruleDark}` : undefined }}>
                  <span style={{ fontSize: 12, letterSpacing: "0.14em", color: T.onDarkMuted }}>{n}</span>
                  <span>
                    <span style={{ display: "block", fontSize: 15, color: T.onDarkStep }}>{label}</span>
                    <span style={{ display: "block", marginTop: 6, fontSize: 14.5, lineHeight: 1.6, color: T.onDarkBody }}>{note}</span>
                  </span>
                </div>
              ))}
            </div>
            <p style={{ margin: "22px 0 0", fontSize: 14, fontStyle: "italic", color: T.onDarkBody }}>Most bespoke creations take approximately six weeks, depending on the design.</p>
            <Link to="/bespoke-design" className="v2-btn-outline-d" style={{ alignSelf: "flex-start", marginTop: 44, padding: "15px 28px", border: `1px solid ${T.ruleDarkStrong}`, color: "#FFFFFF", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Start a commission</Link>
          </div>
        </div>
      </section>

      {/* 5. WATCHES */}
      <section id="watches" style={{ padding: `${SP} ${pageX} 0` }}>
        <div className="v2-reveal v2-sechead" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, paddingBottom: 22, borderBottom: `1px solid ${T.rule}` }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 14 }}>Watches — official stockist</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(30px, 3.2vw, 46px)" }}>New, pre-owned and serviced in house</h2>
          </div>
          <Link to="/watches" className="v2-textlink" style={{ whiteSpace: "nowrap" }}>All watches</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(16px, 1.6vw, 28px)", marginTop: 40 }} className="v2-prodgrid">
          {(watches.length ? watches : Array.from({ length: 4 })).map((w: any, i) => (
            w && w.slug ? (
              <Link key={w.id || i} to={`/watches/${w.slug}`} className={`v2-prodcard v2-reveal${i ? ` v2-reveal-d${Math.min(i, 3)}` : ""}`} style={{ display: "block" }}>
                <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden" }}>
                  {w.image?.url
                    ? <img src={getMediaUrl(w.image.url)} alt={w.image.alt || w.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "14%" }} loading="lazy" />
                    : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted }}>{w.name}</div>}
                </div>
                <div style={{ marginTop: 16, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>{w.brand?.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 4, fontSize: 15 }}>
                  <span style={{ flex: "1 1 auto", minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{`${cleanWatchName(w.name, w.brand?.name, w.model_number || w.sku)} watch`}</span>
                  <span style={{ color: "#56534D", flex: "none" }}>{roundPrice(w.sale_price || w.base_price)}</span>
                </div>
              </Link>
            ) : (
              <div key={i} style={{ aspectRatio: "4 / 5", background: T.tint }} />
            )
          ))}
        </div>
      </section>

      {/* 6. HERITAGE */}
      <section id="heritage" style={{ padding: `${SP} ${pageX} clamp(56px, 5vw, 88px)` }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)", gap: "clamp(40px, 5vw, 88px)", alignItems: "center" }} className="v2-split">
          <figure className="v2-reveal" style={{ margin: 0 }}>
            <div style={{ position: "relative", aspectRatio: "4 / 3", background: T.tint, overflow: "hidden" }}>
              <img src="/images/desilva-shopfront-960.jpg" srcSet="/images/desilva-shopfront-480.jpg 480w, /images/desilva-shopfront-960.jpg 960w, /images/desilva-shopfront.jpg 1179w"
                sizes="(max-width: 767px) 92vw, 46vw" width={960} height={1086} alt="The original J. A. de Silva Jewellers shopfront" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
            </div>
            {/* Links the de Silva name in the photograph to McCulloch today (from the owner's account on Our Story). */}
            <figcaption style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: T.muted }}>The original J. A. de Silva Jewellers, founded in 1895. Hasita de Silva, J. A. de Silva’s great-grandson, took on Andrew McCulloch’s in Beeston in 2017.</figcaption>
          </figure>
          <div className="v2-reveal v2-reveal-d1">
            <div style={{ ...eyebrow, marginBottom: 22 }}>Since 1895</div>
            <h2 style={{ ...h2Style, lineHeight: 1.14, fontSize: "clamp(30px, 3.4vw, 50px)", maxWidth: "18ch", marginBottom: 26 }}>Generations of jewellers, one bench, the same care.</h2>
            <p style={{ margin: "0 0 22px", maxWidth: "46ch", fontSize: 16, lineHeight: 1.75, color: T.body }}>We cut, set, size and repair everything ourselves, which is why we can tell you exactly who made your ring and how long it took.</p>
            <Link to="/our-story" className="v2-textlink">Read our story</Link>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS — published reviews only, plus where to check them and how to leave one */}
      <section style={{ background: T.tint, padding: `clamp(56px, 5vw, 88px) ${pageX}` }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: quotes.length ? "clamp(36px, 3.5vw, 56px)" : 0 }}>
          <div style={eyebrow}>What clients say</div>
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="v2-textlink" style={{ color: T.ink }}>Read our reviews on Google</a>
        </div>
        {quotes.length > 0 && (
          <>
            <div ref={quotesRef} onScroll={onQuotesScroll} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(24px, 2.6vw, 48px)", alignItems: "stretch" }} className="v2-quotes">
              {quotes.map(([q, name, cat, date], i) => (
                <figure key={name + i} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 22, padding: "0 clamp(20px, 2.4vw, 44px)", borderLeft: `1px solid ${T.rule}`, opacity: quotesIn ? 1 : 0, transform: quotesIn ? "translateX(0)" : "translateX(-40px)", transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 0.14}s` }}>
                  <blockquote style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: "clamp(20px, 1.5vw, 23px)", lineHeight: 1.5, color: T.textPrimary }}>{q}</blockquote>
                  <figcaption style={{ marginTop: "auto", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    <span style={{ color: T.textPrimary }}>{name}{date ? <span style={{ color: T.muted, textTransform: "none", letterSpacing: "0.02em" }}> · {date}</span> : null}</span><span style={{ color: T.muted }}>{cat}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
            {/* Swipe dots — mobile only (shown via .v2-quotedots media rule); 44px tap area around a small dot */}
            <div className="v2-quotedots" style={{ display: "none", justifyContent: "center", gap: 0, marginTop: 16 }}>
              {quotes.map(([, name], i) => (
                <button key={name + i} type="button" aria-label={`Go to review ${i + 1}`} aria-current={activeQuote === i}
                  onClick={() => quotesRef.current?.scrollTo({ left: i * quotesRef.current.clientWidth, behavior: "smooth" })}
                  style={{ width: 44, height: 44, border: 0, padding: 0, cursor: "pointer", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: activeQuote === i ? 20 : 8, height: 8, borderRadius: 4, background: activeQuote === i ? T.gold : T.ruleStrong, transition: "width 0.3s ease, background 0.3s ease" }} />
                </button>
              ))}
            </div>
          </>
        )}
        <p style={{ margin: "clamp(28px, 3vw, 44px) 0 0", paddingTop: 22, borderTop: `1px solid ${T.rule}`, fontSize: 15, color: T.body }}>
          Been to the bench? <Link to="/share-your-experience" style={{ color: T.ink, borderBottom: `1px solid ${T.ruleStrong}`, paddingBottom: 2 }}>Share your experience</Link>
        </p>
      </section>

      {/* 8. JOURNAL — latest posts from the WordPress blog; hidden until there are any */}
      <JournalV2 pageX={pageX} h2Style={h2Style} />

      {/* 9. SHOWROOM / APPOINTMENT */}
      <section id="appointment" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", borderTop: `1px solid ${T.rule}`, background: T.tint }} className="v2-split">
        <div className="v2-reveal" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 40, padding: "clamp(56px, 6vw, 104px) clamp(32px, 4vw, 80px)" }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 20 }}>Visit us</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(28px, 3.2vw, 46px)", lineHeight: 1.04, marginBottom: 18 }}>Come and see them in daylight.</h2>
            <p style={{ maxWidth: "42ch", margin: 0, fontSize: 16, lineHeight: 1.7, color: "#56534D" }}>Appointments are free and take about an hour. Walk-ins welcome whenever we are open.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32, fontSize: 15.5, lineHeight: 1.75, color: T.body }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.body, marginBottom: 10 }}>Showroom</div>
              7 The Square, Beeston<br />Nottingham NG9 2JG<br />
              <a href="https://www.google.com/maps/dir/?api=1&destination=7+The+Square+Beeston+Nottingham+NG9+2JG" target="_blank" rel="noopener noreferrer" className="v2-textlink" style={{ color: T.ink, marginTop: 2 }}>Get directions</a>
            </div>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.body, marginBottom: 10 }}>Opening hours</div>
              Mon – Sat, 9 – 5:30<br />Sunday, closed
            </div>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.body, marginBottom: 10 }}>Call</div>
              <a href="tel:+441159257552" style={{ color: T.ink, borderBottom: `1px solid ${T.ruleStrong}`, display: "inline-block", padding: "10px 0 2px" }}>0115 925 7552</a>
            </div>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.body, marginBottom: 10 }}>Email</div>
              <a href="mailto:has@mccullochjewellers.co.uk" style={{ color: T.ink, borderBottom: `1px solid ${T.ruleStrong}`, display: "inline-block", padding: "10px 0 2px", wordBreak: "break-all" }}>has@mccullochjewellers.co.uk</a>
            </div>
          </div>
          <Link to="/contact" className="v2-btn-ink" style={{ alignSelf: "flex-start", padding: "15px 28px", background: T.ink, color: T.paper, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>Book an appointment</Link>
        </div>
        <div className="v2-reveal v2-reveal-d1" style={{ position: "relative", minHeight: "clamp(420px, 56vh, 620px)", borderLeft: `1px solid ${T.rule}` }}>
          <img src="/images/shopfront-2-upscaled.webp" srcSet="/images/shopfront-2-upscaled-480.jpg 480w, /images/shopfront-2-upscaled.webp 764w" sizes="(max-width: 767px) 100vw, 50vw"
            width={764} height={1020} alt="The McCulloch showroom in Beeston" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </section>

      {/* 10. INSTAGRAM — hidden for now (uncomment to restore) */}
      {false && (
      <section style={{ borderTop: `1px solid ${T.rule}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: `26px ${pageX}` }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.body }}>@andrewmccullochjewellers</div>
          <a href="https://www.instagram.com/andrewmccullochjewellers/" target="_blank" rel="noreferrer" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E6B64" }}>Follow</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 2 }} className="v2-iggrid">
          {["/images/prod1.png", "/images/prod2.png", "/images/prod3.png", "/images/prod4.png", "/images/prod5.png", "/images/stark-media-bw-23.jpg"].map((src, i) => (
            <a key={i} href="https://www.instagram.com/andrewmccullochjewellers/" target="_blank" rel="noreferrer" className="v2-igcell" style={{ position: "relative", aspectRatio: "1", minWidth: 0, overflow: "hidden", background: T.tint }}>
              <img src={src} alt={`Instagram ${i + 1}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            </a>
          ))}
        </div>
      </section>
      )}
    </div>
  );
};

export default MainContentV2;
