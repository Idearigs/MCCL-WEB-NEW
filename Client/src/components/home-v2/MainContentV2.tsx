import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL, { getMediaUrl } from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY, SP } from "./tokens";
import JournalV2 from "./JournalV2";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useAfterLoad } from "../../hooks/use-after-load";

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
  const inView = useRef(false);
  // The film (several MB) waits until the page itself has loaded; the poster shows meanwhile.
  const afterLoad = useAfterLoad();
  const afterLoadRef = useRef(afterLoad);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = !!(navigator as any).connection?.saveData;
    if (reduce || saveData) userPaused.current = true; // stays on the poster until the visitor presses play
    const io = new IntersectionObserver(([e]) => {
      inView.current = e.isIntersecting;
      if (e.isIntersecting && !userPaused.current && afterLoadRef.current) v.play().catch(() => {});
      else if (!e.isIntersecting) v.pause();
    }, { threshold: 0.15 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    afterLoadRef.current = afterLoad;
    const v = ref.current;
    if (afterLoad && v && inView.current && !userPaused.current) v.play().catch(() => {});
  }, [afterLoad]);
  const toggle = () => {
    const v = ref.current; if (!v) return;
    if (v.paused) { userPaused.current = false; v.play().catch(() => {}); }
    else { userPaused.current = true; v.pause(); }
  };
  return (
    <>
      <video
        ref={ref} muted loop playsInline preload={lazy || !afterLoad ? "none" : "auto"} poster={poster} aria-label={title}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
      >
        {formats.map(f => <source key={f} src={`${base}.${f}`} type={`video/${f}`} />)}
      </video>
      <button type="button" onClick={toggle} className="v2-vidbtn" aria-label={playing ? `Pause the film: ${title}` : `Play the film: ${title}`}
        style={{ position: "absolute", zIndex: 3, width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(248,246,240,0.45)", background: "rgba(28,26,23,0.42)", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto", ...buttonStyle }}>
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
// Small labels: text colour with a short gold hairline (class "v2-eyebrow"); gold is never small text on light grounds.
const CATS = [
  { to: "/rings", label: "Rings", meta: "Engagement & more", img: "/images/cat-rings.jpeg" },
  { to: "/earrings", label: "Earrings", meta: "Studs to drops", img: "/images/cat-earrings.jpeg" },
  { to: "/necklaces", label: "Necklaces", meta: "Pendants & chains", img: "/images/cat-necklaces.jpeg" },
  { to: "/bracelets", label: "Bracelets", meta: "Tennis & bangles", img: "/images/cat-bracelets.jpeg" },
];
const eyebrow: React.CSSProperties = { fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text };
const h2Style: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, lineHeight: 1.2, margin: 0, color: T.text };
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

  // Section entrances: mark each [.v2-reveal] / [.v2-stagger] element .is-in once, as it enters the viewport.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = Array.from(rootRef.current?.querySelectorAll(".v2-reveal, .v2-stagger") ?? []);
    if (reduce) { targets.forEach(t => t.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    targets.forEach(t => io.observe(t));
    return () => io.disconnect();
    // Re-run when async data lands: product/watch cards mount after the initial
    // pass, so they must be (re)observed or they stay stuck at opacity 0.
  }, [products, watches]);

  // overflowX "clip", not "hidden": hidden makes this wrapper its own vertical scroll box (a second
  // scrollbar that traps the wheel/trackpad gesture before the page scrolls).
  const [cat, setCat] = useState(0);
  return (
    <div ref={rootRef} style={{ fontFamily: FONT_BODY, color: T.text, background: '#FFFEFD', overflowX: "clip", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility" } as React.CSSProperties}>
      <style>{`
        .v2-panel { transition: flex 0.55s cubic-bezier(0.22,1,0.36,1); }
        .v2-panel:hover { flex: 1.9 !important; }
        .v2-panel img { transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .v2-panel:hover img { transform: scale(1.05); }
        .v2-cat img { transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .v2-cat:hover img { transform: scale(1.04); }
        /* One solid (ink) button per screen; everything else is an outline or a text link. */
        .v2-btn-ink { transition: background 0.3s ease; }
        .v2-btn-ink:hover { background: ${T.text} !important; }
        .v2-btn-outline { transition: background 0.3s ease, color 0.3s ease; }
        .v2-btn-outline:hover { background: ${T.ink} !important; color: ${T.cream} !important; }
        /* Outline on the hero film: cream line and text (an ink outline would vanish on the video). */
        .v2-btn-outline-l { transition: background 0.3s ease, border-color 0.3s ease; }
        .v2-btn-outline-l:hover { border-color: ${T.cream} !important; background: rgba(248,246,240,0.14); }
        .v2-textlink { display: inline-block; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid ${T.line}; padding: 14px 0 5px; transition: border-color 0.2s ease; }
        .v2-vidbtn { opacity: 0.85; transition: opacity 0.2s ease, background 0.2s ease; }
        .v2-vidbtn:hover, .v2-vidbtn:focus-visible { opacity: 1; background: rgba(28,26,23,0.72) !important; }
        .v2-vidbtn:focus-visible { outline-color: ${T.cream}; }
        .v2-save { transition: color 0.2s ease, background 0.2s ease; }
        .v2-save:hover { color: ${T.text} !important; }
        .v2-herolink { transition: border-color 0.25s ease; }
        .v2-herolink:hover { border-bottom-color: #FFFFFF !important; }
        .v2-save { opacity: 0; }
        .v2-prodcard:hover .v2-save, .v2-save:focus-visible, .v2-save[aria-pressed="true"] { opacity: 1; }
        @media (hover: none) { .v2-save { opacity: 1; } }
        /* Product renders are white-background files: blend them into the sand card. */
        .v2-blend { mix-blend-mode: multiply; }
        .v2-swatch { transition: box-shadow 0.2s ease; }
        .v2-textlink:hover { border-bottom-color: ${T.gold}; }
        .v2-prodcard img { transition: transform 0.5s ease; }
        .v2-prodcard:hover img { transform: scale(1.04); }
        .v2-igcell img { transition: transform 0.6s ease; }
        .v2-igcell:hover img { transform: scale(1.06); }
        /* ── Section entrances. One observer adds .is-in; everything below is CSS.
           Animations (not transitions) so they never fight hover transitions or inline opacity. ── */
        @keyframes v2Rise { from { opacity: 0; transform: translateY(20px); } }
        @keyframes v2Focus { from { opacity: 0; transform: translateY(16px); filter: blur(8px); } to { filter: blur(0); } }
        @keyframes v2Unveil { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
        @keyframes v2Settle { from { transform: scale(1.12); } }
        @keyframes v2FromLeft { from { opacity: 0; transform: translateX(-44px); } }
        @keyframes v2FromRight { from { opacity: 0; transform: translateX(44px); } }
        .v2-reveal:not(.is-in), .v2-stagger:not(.is-in) > * { opacity: 0 !important; }
        .v2-reveal.is-in, .v2-stagger.is-in > * { animation: v2Rise 1.1s cubic-bezier(0.22,1,0.36,1) backwards; }
        .v2-rv-focus.is-in, .v2-stagger.v2-rv-focus.is-in > * { animation-name: v2Focus; animation-duration: 1.5s; }
        .v2-rv-mask.is-in { animation: v2Unveil 1.5s cubic-bezier(0.7,0,0.2,1) backwards; }
        .v2-rv-mask.is-in > * { animation: v2Settle 2.4s cubic-bezier(0.22,1,0.36,1) backwards; }
        .v2-rv-left.is-in { animation-name: v2FromLeft; animation-duration: 1.3s; }
        .v2-rv-right.is-in { animation-name: v2FromRight; animation-duration: 1.3s; }
        .v2-reveal-d1.is-in { animation-delay: 0.12s; }
        .v2-reveal-d2.is-in { animation-delay: 0.24s; }
        .v2-reveal-d3.is-in { animation-delay: 0.36s; }
        .v2-stagger.is-in > :nth-child(2) { animation-delay: 0.12s; }
        .v2-stagger.is-in > :nth-child(3) { animation-delay: 0.24s; }
        .v2-stagger.is-in > :nth-child(4) { animation-delay: 0.36s; }
        .v2-stagger.is-in > :nth-child(5) { animation-delay: 0.48s; }
        .v2-stagger.is-in > :nth-child(n+6) { animation-delay: 0.6s; }
        @media (max-width: 767px) { .v2-rv-left.is-in, .v2-rv-right.is-in { animation-name: v2Rise; animation-duration: 1.1s; } }
        @media (prefers-reduced-motion: reduce) {
          .v2-reveal, .v2-stagger > * { opacity: 1 !important; animation: none !important; }
          .v2-rv-mask > * { animation: none !important; }
        }

        /* ── Hero entrance: staggered rise-in on load ── */
        @keyframes v2HeroRise { from { opacity: 0; transform: translateY(115%); } to { opacity: 1; transform: translateY(0); } }
        @keyframes v2HeroFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        /* Hero text eases in: each piece fades up out of a soft blur, one after the other */
        @keyframes v2HeroSoft { from { opacity: 0; transform: translateY(22px); filter: blur(8px); } to { opacity: 1; transform: none; filter: blur(0); } }
        @keyframes v2HeroTrack { from { opacity: 0; letter-spacing: 0.6em; } to { opacity: 1; letter-spacing: 0.32em; } }
        .v2-hero-in { animation: v2HeroSoft 1.7s cubic-bezier(0.22,1,0.36,1) both; }
        .v2-hero-label { letter-spacing: 0.32em; padding-left: 0.32em; animation: v2HeroTrack 2.2s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.15s; }
        @media (prefers-reduced-motion: reduce) { .v2-hero-in, .v2-hero-label { animation: none !important; } }
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
          .v2-services { grid-template-columns: 1fr 1fr !important; row-gap: 44px !important; }
          .v2-services > div:nth-child(odd) { border-left: 0 !important; padding-left: 0 !important; }
          .v2-iggrid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
        }
        /* ── Phone ── */
        @media (max-width: 767px) {
          #top { height: 100svh !important; }
          /* Keep the hero buttons clear of the round chat button in the bottom corner */
          .v2-hero-overlay { padding-bottom: 40px !important; }
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
          .v2-herocap { grid-template-columns: 1fr !important; justify-items: center; text-align: center; gap: 12px !important; padding-bottom: 28px !important; }
          .v2-herocap > div:last-child { justify-self: center !important; }
          .v2-heroframe { margin-left: 16px !important; margin-right: 16px !important; }
          /* Section rhythm: 72px between sections on a phone, not 120px */
          .v2-s-statement { padding-top: 72px !important; }
          .v2-s-cats { padding-top: 56px !important; }
          #arrivals, #watches, .v2-s-reviews, .v2-s-journal { padding-top: 72px !important; }
          #heritage { margin-top: 72px !important; }
          #heritage { padding-top: 56px !important; padding-bottom: 56px !important; }
          /* Categories: a tappable list, each row with its own photograph; the hover stage is desktop-only */
          .v2-catgrid { grid-template-columns: 1fr !important; gap: 0 !important; }
          .v2-catstage { display: none !important; }
          .v2-catrow { opacity: 1 !important; align-items: center !important; gap: 18px !important; padding: 12px 0 !important; justify-content: flex-start !important; }
          .v2-catthumb { display: block !important; }
          .v2-catlabel { font-size: 22px !important; }
          .v2-catmeta { display: none !important; }
          .v2-catarrow { display: block !important; }
          /* Split sections: photograph first at 4:3, then the text */
          .v2-media { min-height: 0 !important; aspect-ratio: 4 / 3; }
          .v2-panelpad { padding: 48px 24px 56px !important; }
          .v2-steps { grid-template-columns: 1fr !important; gap: 0 !important; margin-top: 30px !important; padding-top: 0 !important; }
          .v2-steps > div { display: flex; align-items: baseline; gap: 16px; padding: 14px 0; border-bottom: 1px solid ${T.ruleDark}; }
          .v2-steps > div > div:last-child { margin-top: 0 !important; }
          .v2-fullcta { flex: 1 1 100%; text-align: center; }
          .v2-visitimg { order: -1; }
          #bespoke { padding-top: 72px !important; }
          .v2-bfilm { aspect-ratio: 16 / 10 !important; }
          /* Save heart: a small bare outline in the tile corner, no disc behind it */
          .v2-save { top: 2px !important; right: 2px !important; width: 36px !important; height: 36px !important; background: transparent !important; font-size: 15px !important; }
          /* Bespoke on a phone: words, film, then the three steps as a quiet row with no rules; the link closes the section */
          #bespoke .v2-split { gap: 14px !important; }
          .v2-bcta-top { display: none !important; }
          /* Watches on a phone: the link follows the two watches */
          .v2-wcta-top { display: none !important; }
          .v2-wcta-bottom { display: inline-block !important; margin-top: 4px; justify-self: center !important; }
          #watches .v2-stagger > p { margin-bottom: 0 !important; }
          .v2-bcta-bottom { display: inline-block !important; margin-top: 26px; }
          .v2-bfilm { margin-top: 24px !important; }
          .v2-bsteps { grid-template-columns: repeat(3, 1fr) !important; gap: 14px !important; margin-top: 18px !important; }
          .v2-bsteps > div { flex-direction: column; gap: 6px !important; padding-top: 0 !important; border-top: 0 !important; }
          .v2-bsteps > div > span:last-child { font-size: 13.5px !important; line-height: 1.35; }
          /* Heritage on a phone: one centred column — heading, print, the two dates, the link */
          .v2-heritage { grid-template-columns: 1fr !important; gap: 28px !important; margin-top: 36px !important; }
          .v2-heritage > figure { order: -1; width: min(100%, 280px); margin: 0 auto !important; }
          .v2-heritage-a, .v2-heritage-b { text-align: center !important; }
          .v2-heritage-a > div, .v2-heritage-b > div { font-size: 36px !important; }
          .v2-heritage-a p, .v2-heritage-b p { margin: 10px auto 0 !important; max-width: 26ch !important; }
          .v2-heritage-note { display: none; }
          .v2-heritage-foot { margin-top: 40px; }
          #appointment { padding-top: 72px !important; padding-bottom: 64px !important; }
          .v2-services { grid-template-columns: 1fr !important; gap: 48px !important; }
          .v2-contactgrid > div:nth-child(n+3) { grid-column: 1 / -1; }
        }
      `}</style>

      {/* 1. HERO — full-screen film, minimal centred text that eases in on load */}
      <section id="top" className="v2-on-dark" style={{ position: "relative", height: "100vh", minHeight: 620, background: T.ink, overflow: "hidden" }}>
        <VideoCover base="/videos/hero" poster="/videos/hero-poster.jpg" title="McCulloch brand film" formats={["mp4", "webm"]}
          buttonStyle={{ top: "calc(var(--v2nav-h, 112px) + 16px)", right: pageX }} />
        {/* An even veil keeps centred white text readable on any frame; a little extra at the top for the header */}
        <div className="v2-hero-overlay" style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", padding: `var(--v2nav-h, 112px) ${pageX} 40px`, background: "linear-gradient(to bottom, rgba(28,26,23,0.5) 0%, rgba(28,26,23,0.3) 22%, rgba(28,26,23,0.34) 70%, rgba(28,26,23,0.5) 100%)" }}>
          <div style={{ maxWidth: 980, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="v2-hero-in v2-hero-label" style={{ fontSize: 11.5, textTransform: "uppercase", color: "#F1EBDF", marginBottom: "clamp(20px, 3vh, 34px)" }}>The Celestial Collection</div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.01em", fontSize: "clamp(26px, 3.2vw, 46px)", lineHeight: 1.2, margin: 0, color: "#FFFFFF" }}>
              <span className="v2-hero-in" style={{ display: "block", animationDelay: "0.45s" }}>A heritage of craftsmanship.</span>
              <span className="v2-hero-in" style={{ display: "block", animationDelay: "0.85s" }}>A lifetime of meaning.</span>
            </h1>
            <div className="v2-hero-in" style={{ marginTop: "clamp(28px, 4.5vh, 48px)", pointerEvents: "auto", animationDelay: "1.5s" }}>
              <Link to="/rings?availability=live" className="v2-herolink" style={{ fontSize: 11.5, letterSpacing: "0.24em", textTransform: "uppercase", color: "#FFFFFF", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.7)" }}>Discover the collection</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 1b. STATEMENT — one quiet sentence before any product */}
      <section className="v2-s-statement" style={{ padding: `clamp(88px, 10vw, 150px) ${pageX} 0`, textAlign: "center" }}>
        <div className="v2-stagger v2-rv-focus" style={{ maxWidth: 860, margin: "0 auto" }}>
          <div className="v2-eyebrow" style={{ ...eyebrow, justifyContent: "center", marginBottom: 28 }}>Made in Beeston, Nottingham</div>
          <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: "clamp(20px, 2vw, 29px)", lineHeight: 1.4, color: T.text, textWrap: "balance" } as React.CSSProperties}>Every ring is set by hand in our own workshop. Choose a stone with us, or start from a blank sheet.</p>
        </div>
      </section>

      {/* 2. CATEGORY BAND */}
      <section className="v2-s-cats" style={{ padding: `${SP} ${pageX} 0` }}>
        {/* Category index: a typographic list on the left, one photograph on the right that follows the list. */}
        <div style={{ maxWidth: 1250, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)", gap: "clamp(32px, 6vw, 96px)", alignItems: "center" }} className="v2-catgrid">
          <div className="v2-stagger">
            <div className="v2-eyebrow" style={{ ...eyebrow, marginBottom: 26 }}>The collections</div>
            {CATS.map((c, i) => (
              <Link key={c.to} to={c.to} className="v2-catrow" data-cat={i} onMouseEnter={() => setCat(i)} onFocus={() => setCat(i)}
                style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, padding: "clamp(16px, 1.7vw, 24px) 0", borderTop: `1px solid ${T.line}`, borderBottom: i === CATS.length - 1 ? `1px solid ${T.line}` : undefined, opacity: cat === i ? 1 : 0.42, transition: "opacity 0.35s ease" }}>
                {/* Phones have no hover, so each row carries its own small photograph there. */}
                <img className="v2-catthumb" src={c.img.replace(/\.jpeg$/, "-480.jpg")} width={72} height={72} alt="" loading="lazy" style={{ display: "none", width: 72, height: 72, objectFit: "cover", flex: "none" }} />
                <span className="v2-catlabel" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(26px, 2.8vw, 40px)", lineHeight: 1.1, color: T.text }}>{c.label}</span>
                <span className="v2-catmeta" style={{ fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", color: T.text, whiteSpace: "nowrap" }}>{c.meta}</span>
                <span className="v2-catarrow" aria-hidden="true" style={{ display: "none", marginLeft: "auto", fontSize: 18, color: T.textMuted }}>→</span>
              </Link>
            ))}
          </div>
          <div className="v2-catstage v2-reveal v2-rv-mask v2-reveal-d1" style={{ position: "relative", aspectRatio: "1 / 1.02", overflow: "hidden", background: T.sand }}>
            {CATS.map((c, i) => (
              <img key={c.to} data-catimg={i} src={c.img.replace(/\.jpeg$/, "-960.jpg")} width={960} height={960} alt="" loading={i ? "lazy" : undefined}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: cat === i ? 1 : 0, transition: "opacity 0.6s ease" }} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. NEW ARRIVALS */}
      <section id="arrivals" style={{ padding: `${SP} ${pageX} 0` }}>
        <div style={{ maxWidth: 1250, margin: "0 auto" }}>
        <div className="v2-stagger v2-sechead" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
          <div>
            <div className="v2-eyebrow" style={{ ...eyebrow, marginBottom: 14 }}>New in</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(23px, 2.2vw, 31px)" }}>Just off the bench</h2>
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
                      <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: '#FBFAF7', overflow: "hidden" }}>
                        {img?.url
                          ? <img src={getMediaUrl(img.url)} alt={`${p.name}${chosen ? ` in ${chosen.name.toLowerCase()}` : ""}`} className="v2-blend" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "7%" }} loading="lazy" />
                          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted }}>{p.name}</div>}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 14, fontSize: 14.5, color: T.text }}><span>{p.name}</span><span style={{ color: T.textMuted }}>{p.price}</span></div>
                    </Link>
                    <button type="button" className="v2-save" aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
                      onClick={() => toggleFavorite(p.id, p.name, img?.url ? getMediaUrl(img.url) : "", href)}
                      style={{ position: "absolute", top: 8, right: 8, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(248,246,240,0.92)", border: 0, borderRadius: "50%", fontSize: 18, lineHeight: 1, color: saved ? T.gold : T.textMuted }}>{saved ? "♥" : "♡"}</button>
                    {false && p.metals.length > 1 && (
                      <div role="group" aria-label={`${p.name}: show in`} style={{ display: "flex", gap: 0, marginTop: 6, marginLeft: -12 }}>
                        {p.metals.map((m: any) => {
                          const on = (cardMetal[p.id] || "") === m.id;
                          return (
                            <button key={m.id} type="button" className="v2-swatch" title={m.name} aria-label={`Show in ${m.name.toLowerCase()}`} aria-pressed={on}
                              onClick={() => setCardMetal(c => ({ ...c, [p.id]: on ? "" : m.id }))}
                              style={{ width: 40, height: 40, padding: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ width: 16, height: 16, borderRadius: "50%", background: swatchFor(m.name), boxShadow: on ? `0 0 0 2px ${T.cream}, 0 0 0 3px ${T.text}` : `inset 0 0 0 1px rgba(0,0,0,0.12)` }} />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : (
              <div key={i} style={{ aspectRatio: "4 / 5", background: '#FBFAF7' }} />
            )
          ))}
        </div>
        </div>
      </section>

      {/* 4. BESPOKE — light and compact: a headline row, the workshop film as a shallow strip, three steps on one line */}
      <section id="bespoke" style={{ padding: `${SP} ${pageX} 0` }}>
        <div style={{ maxWidth: 1250, margin: "0 auto" }}>
          <div className="v2-stagger v2-split" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)", gap: "clamp(24px, 6vw, 96px)", alignItems: "end" }}>
            <div>
              <div className="v2-eyebrow" style={{ ...eyebrow, marginBottom: 18 }}>Bespoke</div>
              <h2 style={{ ...h2Style, fontSize: "clamp(23px, 2.2vw, 31px)", lineHeight: 1.22 }}>Designed with you. Crafted by us.</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px 28px", flexWrap: "wrap" }}>
              <p style={{ flex: "1 1 240px", maxWidth: "36ch", margin: 0, fontSize: 15.5, lineHeight: 1.65, color: T.text }}>Work directly with our jewellers. Most commissions take about six weeks.</p>
              <Link to="/bespoke-design" className="v2-textlink v2-bcta-top" style={{ color: T.text, whiteSpace: "nowrap" }}>Start a commission</Link>
            </div>
          </div>
          <div className="v2-reveal v2-rv-mask v2-on-dark v2-bfilm" style={{ position: "relative", aspectRatio: "3.2 / 1", marginTop: "clamp(28px, 3vw, 40px)", overflow: "hidden", background: T.ink }}>
            <VideoCover base="/videos/workshop" poster="/videos/workshop-poster.jpg" title="In the workshop" lazy buttonStyle={{ top: 16, right: 16 }} />
          </div>
          <div className="v2-bsteps v2-stagger" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(20px, 3vw, 48px)", marginTop: 22 }}>
            {[["01", "Consultation"], ["02", "Design and stones"], ["03", "Made at our bench"]].map(([n, label]) => (
              <div key={n} style={{ display: "flex", alignItems: "baseline", gap: 14, paddingTop: 16, borderTop: `1px solid ${T.line}` }}>
                <span style={{ fontSize: 12, letterSpacing: "0.16em", color: T.textMuted }}>{n}</span>
                <span style={{ fontSize: 15, color: T.text }}>{label}</span>
              </div>
            ))}
          </div>
          <Link to="/bespoke-design" className="v2-textlink v2-bcta-bottom" style={{ display: "none", color: T.text }}>Start a commission</Link>
        </div>
      </section>

      {/* 5. WATCHES — a short introduction beside two pieces, not a second product grid */}
      <section id="watches" style={{ padding: `${SP} ${pageX} 0` }}>
        <div style={{ maxWidth: 1250, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)", gap: "clamp(32px, 6vw, 96px)", alignItems: "center" }} className="v2-split">
          <div className="v2-stagger">
            <div className="v2-eyebrow" style={{ ...eyebrow, marginBottom: 20 }}>Watches</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(23px, 2.2vw, 31px)", lineHeight: 1.22, marginBottom: 20 }}>New, pre-owned and serviced in house</h2>
            <p style={{ maxWidth: "38ch", margin: "0 0 26px", fontSize: 16, lineHeight: 1.7, color: T.text }}>Roamer, Briston and Festina, looked after by the same people who sell them.</p>
            <Link to="/watches" className="v2-textlink v2-wcta-top">All watches</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "clamp(16px, 1.6vw, 28px)" }}>
            {(() => {
              // Feature pieces photographed on a clean white ground; supplier shots with a grey backdrop sit badly on the tile.
              const clean = watches.filter((w: any) => w?.image?.url && !/cdn\.shopify/.test(w.image.url));
              const list: any[] = (clean.length >= 2 ? clean : watches).slice(0, 2);
              return (list.length ? list : Array.from({ length: 2 })).map((w: any, i: number) => (
                w && w.slug ? (
                  <Link key={w.id || i} to={`/watches/${w.slug}`} className={`v2-prodcard v2-reveal${i ? " v2-reveal-d1" : ""}`} style={{ display: "block" }}>
                    <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: '#FBFAF7', overflow: "hidden" }}>
                      {w.image?.url
                        ? <img src={getMediaUrl(w.image.url)} alt={w.image.alt || w.name} className="v2-blend" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "13%" }} loading="lazy" />
                        : null}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 14, fontSize: 14.5, color: T.text }}>
                      {/* Brand only, like the ring cards; the full model name is on the watch page. One line, never wraps. */}
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.brand?.name || cleanWatchName(w.name, w.brand?.name, w.model_number || w.sku)}</span>
                      <span style={{ color: T.textMuted, flex: "none" }}>{roundPrice(w.sale_price || w.base_price)}</span>
                    </div>
                  </Link>
                ) : (
                  <div key={i} style={{ aspectRatio: "1 / 1.1", background: '#FBFAF7' }} />
                )
              ));
            })()}
          </div>
          <Link to="/watches" className="v2-textlink v2-wcta-bottom" style={{ display: "none", justifySelf: "start" }}>All watches</Link>
        </div>
      </section>

      {/* 6. HERITAGE — the page's one sand band: the old photograph as a mounted print, a date on either side */}
      <section id="heritage" style={{ marginTop: SP, background: T.sand, padding: `clamp(72px, 8vw, 124px) ${pageX}`, textAlign: "center" }}>
        <div style={{ maxWidth: 1250, margin: "0 auto" }}>
          <div className="v2-stagger v2-rv-focus">
            <div className="v2-eyebrow" style={{ ...eyebrow, justifyContent: "center", marginBottom: 24 }}>Our story</div>
            <h2 style={{ ...h2Style, lineHeight: 1.22, fontSize: "clamp(24px, 2.4vw, 34px)", maxWidth: "20ch", margin: "0 auto", textWrap: "balance" } as React.CSSProperties}>Generations of jewellers, one bench, the same care.</h2>
          </div>
          <div className="v2-heritage" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 360px) minmax(0, 1fr)", gap: "clamp(28px, 5vw, 84px)", alignItems: "center", marginTop: "clamp(40px, 5vw, 68px)" }}>
            <div className="v2-reveal v2-rv-left v2-reveal-d2 v2-heritage-a" style={{ textAlign: "right" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 3.6vw, 52px)", lineHeight: 1, color: T.text }}>1895</div>
              <p style={{ margin: "14px 0 0 auto", maxWidth: "24ch", fontSize: 15, lineHeight: 1.65, color: T.text }}>J. A. de Silva Jewellers is founded.</p>
            </div>
            <figure className="v2-reveal" style={{ margin: 0, padding: 10, background: T.cream, boxShadow: `0 0 0 1px ${T.ruleStrong}` }}>
              <div className="v2-reveal v2-rv-mask v2-reveal-d1" style={{ position: "relative", aspectRatio: "4 / 5", overflow: "hidden", background: T.sand }}>
                <img src="/images/desilva-shopfront-960.jpg" width={960} height={1086} alt="The original J. A. de Silva Jewellers shopfront" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
              </div>
            </figure>
            <div className="v2-reveal v2-rv-right v2-reveal-d2 v2-heritage-b" style={{ textAlign: "left" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 3.6vw, 52px)", lineHeight: 1, color: T.text }}>2017</div>
              <p style={{ margin: "14px 0 0", maxWidth: "26ch", fontSize: 15, lineHeight: 1.65, color: T.text }}>Hasita de Silva, his great-grandson, takes on Andrew McCulloch’s in Beeston.</p>
            </div>
          </div>
          <div className="v2-stagger v2-heritage-foot">
            <p className="v2-heritage-note" style={{ margin: "clamp(40px, 5vw, 64px) auto 26px", maxWidth: "52ch", fontSize: 16, lineHeight: 1.75, color: T.text }}>We cut, set, size and repair everything ourselves, which is why we can tell you exactly who made your ring and how long it took.</p>
            <Link to="/our-story" className="v2-textlink">Read our story</Link>
          </div>
        </div>
      </section>

      {/* 7. CLIENT WORDS — one review at a time, centred */}
      <section className="v2-s-reviews" style={{ padding: `${SP} ${pageX} 0`, textAlign: "center" }}>
        <div className="v2-stagger v2-rv-focus" style={{ maxWidth: 880, margin: "0 auto" }}>
          <div className="v2-eyebrow" style={{ ...eyebrow, justifyContent: "center", marginBottom: 34 }}>What clients say</div>
          {quotes.length > 0 && (
            <>
              <div style={{ display: "grid" }}>
                {quotes.map(([q, name, cat2, date], i) => (
                  <figure key={name + i} data-quote={i} style={{ gridArea: "1 / 1", margin: 0, opacity: activeQuote === i ? 1 : 0, visibility: activeQuote === i ? "visible" : "hidden", transition: "opacity 0.5s ease" }}>
                    <blockquote style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: "clamp(19px, 1.9vw, 27px)", lineHeight: 1.42, color: T.text, textWrap: "balance" } as React.CSSProperties}>{q}</blockquote>
                    <figcaption style={{ marginTop: 26, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>{name} · {cat2}{date ? ` · ${date}` : ""}</figcaption>
                  </figure>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
                {quotes.map(([, name], i) => (
                  <button key={name + i} type="button" data-qdot={i} aria-label={`Show review ${i + 1}`} aria-current={activeQuote === i} onClick={() => setActiveQuote(i)}
                    style={{ width: 44, height: 44, border: 0, padding: 0, cursor: "pointer", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ width: 26, height: activeQuote === i ? 2 : 1, background: T.text, opacity: activeQuote === i ? 1 : 0.35 }} />
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(20px, 3vw, 40px)", flexWrap: "wrap", marginTop: 22 }}>
            <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="v2-textlink" style={{ color: T.text }}>Read our reviews on Google</a>
            <Link to="/share-your-experience" className="v2-textlink" style={{ color: T.text }}>Share your experience</Link>
          </div>
        </div>
      </section>

      {/* 8. JOURNAL — latest posts from the WordPress blog; hidden until there are any */}
      <JournalV2 pageX={pageX} h2Style={h2Style} />

      {/* 9. SHOWROOM — a contained photograph and a few plain lines; no grid of labels */}
      <section id="appointment" style={{ padding: `${SP} ${pageX}` }}>
        <div style={{ maxWidth: 1250, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)", gap: "clamp(40px, 7vw, 110px)", alignItems: "center" }} className="v2-split">
          <div className="v2-stagger">
            <div className="v2-eyebrow" style={{ ...eyebrow, marginBottom: 20 }}>Visit us</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(23px, 2.2vw, 31px)", lineHeight: 1.22, marginBottom: 20 }}>Come and see them in daylight.</h2>
            <p style={{ maxWidth: "40ch", margin: 0, fontSize: 16, lineHeight: 1.7, color: T.text }}>Appointments are free and take about an hour. Walk-ins welcome whenever we are open.</p>
            <p style={{ margin: "26px 0 0", fontSize: 15.5, lineHeight: 1.8, color: T.text }}>7 The Square, Beeston, Nottingham NG9 2JG<br />Monday to Saturday, 9 to 5:30</p>
            <div className="v2-visitlinks" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "18px clamp(20px, 2.4vw, 34px)", marginTop: 34 }}>
              <Link to="/contact" className="v2-btn-ink v2-fullcta" style={{ padding: "15px 28px", background: T.ink, color: T.cream, fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase" }}>Book an appointment</Link>
              <a href="https://www.google.com/maps/dir/?api=1&destination=7+The+Square+Beeston+Nottingham+NG9+2JG" target="_blank" rel="noopener noreferrer" className="v2-textlink" style={{ color: T.text }}>Get directions</a>
              <a href="tel:+441159257552" className="v2-textlink" style={{ color: T.text }}>0115 925 7552</a>
              <a href="mailto:has@mccullochjewellers.co.uk" className="v2-textlink" style={{ color: T.text }}>Email us</a>
            </div>
          </div>
          <div className="v2-reveal v2-rv-mask v2-reveal-d1 v2-visitimg" style={{ position: "relative", aspectRatio: "5 / 4", overflow: "hidden", background: T.sand }}>
            <img src="/images/shopfront-2-upscaled.webp" width={764} height={1020} alt="The McCulloch showroom in Beeston" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 62%" }} />
          </div>
        </div>
      </section>

      {/* 9b. SERVICES — four quiet columns before the footer; no icons, hairlines between */}
      <section aria-label="Our services" style={{ background: T.cream, padding: `clamp(48px, 5vw, 76px) ${pageX}` }}>
        <div style={{ maxWidth: 1250, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(24px, 3vw, 56px)" }} className="v2-services v2-stagger">
          {[
            { title: "Delivery and returns", text: "Free insured UK delivery, and 30 days to return ready-to-ship pieces.", link: "Delivery details", to: "/delivery", icon: <><path d="M4 11h19v16H4z" /><path d="M23 16h7.5l5.5 6.5V27H23" /><path d="M29.5 16v6.5H36" /><circle cx="12" cy="28" r="3.6" fill={T.cream} stroke={T.gold} /><circle cx="29.5" cy="28" r="3.6" fill={T.cream} stroke={T.gold} /></> },
            { title: "Repairs and aftercare", text: "Resizing, repairs and servicing, carried out on our own premises.", link: "Repairs", to: "/repairs", icon: <><g transform="rotate(45 20 20)"><rect x="11" y="6" width="18" height="9" rx="1.2" /><path d="M20 15v22" /><path d="M17.6 37h4.8" /></g><path stroke={T.gold} d="M8 5c.5 3 2 4.5 5 5-3 .5-4.5 2-5 5-.5-3-2-4.5-5-5 3-.5 4.5-2 5-5z" /></> },
            { title: "Warranty", text: "Every piece we make or sell carries a one-year warranty.", link: "What it covers", to: "/warranty", icon: <><path d="M20 4l13 4.5V19c0 7.5-5.2 13.3-13 16.5C12.2 32.3 7 26.5 7 19V8.5z" /><path stroke={T.gold} d="M14 19.5l4.5 4.5 8-9" /></> },
            { title: "Ring sizing", text: "Find your size at home with our guide, or be measured in the showroom.", link: "Ring size guide", to: "/ring-size-guide", icon: <><circle cx="20" cy="26" r="10" /><path stroke={T.gold} d="M15 4.5h10l3.5 4.5L20 16l-8.5-7z" /><path stroke={T.gold} d="M11.5 9h17M17 4.5 20 9l3-4.5" /></> },
          ].map((x, i) => (
            <div key={x.to} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <svg width="44" height="44" viewBox="0 0 40 40" fill="none" stroke={T.text} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" shapeRendering="geometricPrecision" aria-hidden="true" style={{ marginBottom: 18 }}>{x.icon}</svg>
              <h3 style={{ margin: 0, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(17px, 1.4vw, 20px)", lineHeight: 1.25, color: T.text }}>{x.title}</h3>
              <p style={{ margin: "12px 0 16px", maxWidth: "30ch", fontSize: 14.5, lineHeight: 1.65, color: T.text }}>{x.text}</p>
              <Link to={x.to} className="v2-textlink" style={{ color: T.text }}>{x.link}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* 10. INSTAGRAM — hidden for now (uncomment to restore) */}
      {false && (
      <section style={{ borderTop: `1px solid ${T.rule}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: `26px ${pageX}` }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.text }}>@andrewmccullochjewellers</div>
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
