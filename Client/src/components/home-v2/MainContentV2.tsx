import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL, { getMediaUrl } from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY, SP } from "./tokens";
import ReviewForm from "./ReviewForm";

/**
 * MainContentV2 — the homepage v2 body (everything between nav and footer).
 * Visual design from design_handoff_mcculloch_homepage. Videos, products and
 * imagery are the site's real assets; every link points at a real route.
 */

interface Product { id: string; name: string; slug: string; price: string; image: { url: string; alt: string } | null; }

// Pick a product's Yellow Gold render for the card, falling back to its primary
// image. The list API returns images[] (with metal_id + is_metal_preview) and
// available_metals[] (with id + name), so we can resolve the gold metal locally.
const pickGoldImage = (p: any): { url: string; alt: string } | null => {
  const gold = (p.available_metals || []).find((m: any) => /yellow\s*gold/i.test(m?.name || ""));
  const imgs = p.images || [];
  if (gold) {
    const g = imgs.find((i: any) => i.metal_id === gold.id && i.is_metal_preview)
      || imgs.find((i: any) => i.metal_id === gold.id);
    if (g?.url) return { url: g.url, alt: g.alt || p.name || "" };
  }
  return p.image || null;
};
interface Watch { id: string; name: string; slug: string; base_price: number; sale_price?: number; image: { url: string; alt: string } | null; }

// Self-hosted, muted, looping background video that behaves like object-fit: cover.
// No player chrome, no third-party branding. WebM preferred, MP4 fallback.
const VideoCover = ({ base, poster, title }: { base: string; poster: string; title: string }) => (
  <video
    autoPlay muted loop playsInline preload="auto" poster={poster} aria-label={title}
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
  >
    <source src={`${base}.webm`} type="video/webm" />
    <source src={`${base}.mp4`} type="video/mp4" />
  </video>
);

const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };
const h2Style: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, lineHeight: 1.06, margin: 0, color: T.ink };
const pageX = "clamp(24px, 3vw, 52px)";

// Fallback testimonials — shown if the reviews API is unavailable or has no
// featured, published reviews yet. Once the admin publishes featured reviews
// they replace these. [body, author, category]
const FALLBACK_QUOTES: [string, string, string][] = [
  ["They redesigned my grandmother's ring around a stone I already had. It came back better than the original.", "Hannah W.", "Bespoke"],
  ["No pressure, no upselling. We spent an hour looking at stones and left knowing what we were paying for.", "Daniel R.", "Engagement"],
  ["Resized and rhodium-plated in two days while I waited nearby. Hard to find that kind of service now.", "Priya S.", "Servicing"],
];

interface Review { id: string; author_name: string; category?: string; body: string; }

const MainContentV2 = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // "Just off the bench" = most recently updated products (surfaces pieces
    // that just got new images/edits). Image-having products already outrank
    // image-less ones server-side. Cards show the YELLOW GOLD render where a
    // product has one (falls back to its primary image otherwise).
    fetch(`${API_BASE_URL}/products/category/engagement-rings?sort=updated_at&order=desc&limit=8`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.products) {
          setProducts(d.data.products.slice(0, 4).map((p: any) => ({
            id: p.id, name: p.name, slug: p.slug, price: p.price,
            image: pickGoldImage(p),
          })));
        }
      })
      .catch(() => {});
    fetch(`${API_BASE_URL}/watches?limit=8`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.watches) setWatches(d.data.watches.slice(0, 4)); })
      .catch(() => {});
    fetch(`${API_BASE_URL}/reviews?featured=true&limit=3`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.reviews?.length) setReviews(d.data.reviews.slice(0, 3)); })
      .catch(() => {});
  }, []);

  // Published featured reviews if we have them, otherwise the fallback trio.
  const quotes: [string, string, string][] = reviews.length
    ? reviews.map(r => [r.body, r.author_name, r.category || ""])
    : FALLBACK_QUOTES;

  // Slide the testimonials in when the section scrolls into view.
  const quotesRef = useRef<HTMLDivElement>(null);
  const [quotesIn, setQuotesIn] = useState(false);
  useEffect(() => {
    const el = quotesRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setQuotesIn(true); io.disconnect(); } },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  return (
    <div ref={rootRef} style={{ fontFamily: FONT_BODY, color: T.ink, background: T.paper, overflowX: "hidden" }}>
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
        .v2-textlink { display: inline-block; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid ${T.ruleStrong}; padding-bottom: 5px; transition: color 0.2s ease; }
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

        /* ── Tablet ── */
        @media (max-width: 1023px) {
          .v2-prodgrid { grid-template-columns: 1fr 1fr !important; }
          .v2-iggrid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
        }
        /* ── Phone ── */
        @media (max-width: 767px) {
          #top { height: 100svh !important; }
          .v2-hero-grid { grid-template-columns: 1fr !important; gap: 22px !important; }
          .v2-hero-grid > div:last-child { margin-left: 0 !important; margin-right: 0 !important; max-width: none !important; }
          .v2-hero-cta { flex-direction: column !important; }
          .v2-hero-cta > a { text-align: center; }
          .v2-split { grid-template-columns: 1fr !important; }
          .v2-prodgrid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .v2-statrow { grid-template-columns: 1fr 1fr !important; row-gap: 28px !important; }
          .v2-quotes { grid-template-columns: 1fr !important; }
          .v2-quotes figure { border-left: none !important; padding-left: 0 !important; padding-right: 0 !important; }
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
        <VideoCover base="/videos/hero" poster="/videos/hero-poster.jpg" title="McCulloch — brand film" />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: `132px ${pageX} clamp(32px, 4vw, 72px)`, background: "linear-gradient(to top, rgba(18,16,13,0.8), rgba(18,16,13,0.12) 46%, rgba(18,16,13,0.38))" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "end", gap: 48, width: "100%" }} className="v2-hero-grid">
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "#DED7CB", marginBottom: 20 }}>The Celestial Collection — 2026</div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(40px, 5vw, 78px)", lineHeight: 0.98, margin: 0, maxWidth: "15ch", color: "#FFFFFF" }}>Made once, for one person.</h1>
            </div>
            <div style={{ maxWidth: 340, paddingBottom: 6, marginLeft: "auto", marginRight: "clamp(40px, 7vw, 130px)" }}>
              <p style={{ margin: "0 0 22px", fontSize: 14.5, lineHeight: 1.65, color: "#D3CCC1" }}>Every ring is set by hand in our own workshop. Choose a stone with us, or start from a blank sheet.</p>
              <div className="v2-hero-cta" style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
                <Link to="/engagement-rings" className="v2-btn-ivory" style={{ padding: "13px 24px", background: T.paper, color: T.ink, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Shop new in</Link>
                <Link to="/contact" className="v2-btn-outline-l" style={{ padding: "13px 24px", border: "1px solid rgba(248,246,240,0.5)", color: "#FFFFFF", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Book a fitting</Link>
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
            <img src={c.img} alt={c.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: "auto 0 0 0", pointerEvents: "none", padding: 22, background: "linear-gradient(to top, rgba(20,18,15,0.72), rgba(20,18,15,0))" }}>
              <div style={{ color: "#FFFFFF", fontSize: 15, letterSpacing: "0.04em" }}>{c.label}</div>
              <div style={{ color: "#DCD3C4", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 6 }}>{c.meta}</div>
            </div>
          </Link>
        ))}
      </section>

      {/* 3. NEW ARRIVALS */}
      <section id="arrivals" style={{ padding: `${SP} ${pageX} 0` }}>
        <div className="v2-reveal" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, paddingBottom: 22, borderBottom: `1px solid ${T.rule}` }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 14 }}>New in</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(28px, 3vw, 44px)" }}>Just off the bench</h2>
          </div>
          <Link to="/engagement-rings" className="v2-textlink">View all</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(16px, 1.6vw, 28px)", marginTop: 40 }} className="v2-prodgrid">
          {(products.length ? products : Array.from({ length: 4 })).map((p: any, i) => (
            p && p.slug ? (
              <Link key={p.id || i} to={`/engagement-rings/${p.slug}`} className={`v2-prodcard v2-reveal${i ? ` v2-reveal-d${Math.min(i, 3)}` : ""}`} style={{ display: "block" }}>
                <div style={{ position: "relative", aspectRatio: "4 / 5", background: T.tint, overflow: "hidden" }}>
                  {p.image?.url
                    ? <img src={getMediaUrl(p.image.url)} alt={p.image.alt || p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted }}>{p.name}</div>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 16, fontSize: 14 }}><span>{p.name}</span><span style={{ color: "#56534D" }}>{p.price}</span></div>
              </Link>
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
            <VideoCover base="/videos/workshop" poster="/videos/workshop-poster.jpg" title="In the workshop" />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, pointerEvents: "none", padding: `24px ${pageX}`, background: "linear-gradient(to top, rgba(20,18,15,0.72), rgba(20,18,15,0))" }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: "#FFFFFF" }}>In the workshop — Beeston, Nottingham</div>
            </div>
          </div>
          <div className="v2-reveal" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(56px, 6vw, 104px) clamp(32px, 4.5vw, 88px)" }}>
            <div style={{ ...eyebrow, marginBottom: 22 }}>03 — Bespoke</div>
            <h2 style={{ ...h2Style, color: "#FFFFFF", fontSize: "clamp(34px, 3.8vw, 58px)", marginBottom: 24 }}>Designed with you, over six weeks.</h2>
            <p style={{ maxWidth: "44ch", margin: "0 0 44px", fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>You meet the person who will make it. We draw, you choose the stone, and the piece is cut, set and finished on site.</p>
            <div>
              {[["01", "Consultation, in the showroom or by video"], ["02", "Drawings and stone selection"], ["03", "Making, setting and hallmarking"]].map(([n, label], i, a) => (
                <div key={n} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 24, alignItems: "baseline", padding: "20px 0", borderTop: `1px solid ${T.ruleDark}`, borderBottom: i === a.length - 1 ? `1px solid ${T.ruleDark}` : undefined }}>
                  <span style={{ fontSize: 12, letterSpacing: "0.14em", color: T.onDarkMuted }}>{n}</span>
                  <span style={{ fontSize: 14.5, color: T.onDarkStep }}>{label}</span>
                </div>
              ))}
            </div>
            <Link to="/bespoke-design" className="v2-btn-outline-d" style={{ alignSelf: "flex-start", marginTop: 44, padding: "14px 28px", border: `1px solid ${T.ruleDarkStrong}`, color: "#FFFFFF", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Start a commission</Link>
          </div>
        </div>
      </section>

      {/* 5. WATCHES */}
      <section id="watches" style={{ padding: `${SP} ${pageX} 0` }}>
        <div className="v2-reveal" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, paddingBottom: 22, borderBottom: `1px solid ${T.rule}` }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 14 }}>Watches — official stockist</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(30px, 3.2vw, 46px)" }}>New, pre-owned and serviced in house</h2>
          </div>
          <Link to="/watches" className="v2-textlink">All watches</Link>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 16, fontSize: 14 }}>
                  <span>{w.name}</span>
                  <span style={{ color: "#56534D" }}>£{(w.sale_price || w.base_price)?.toLocaleString?.() ?? w.base_price}</span>
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
          <div className="v2-reveal" style={{ position: "relative", aspectRatio: "4 / 3", background: T.tint, overflow: "hidden" }}>
            <img src="/images/desilva-family-upscaled.jpg" alt="The McCulloch family" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className="v2-reveal v2-reveal-d1">
            <div style={{ ...eyebrow, marginBottom: 22 }}>Since 1952</div>
            <h2 style={{ ...h2Style, lineHeight: 1.14, fontSize: "clamp(30px, 3.4vw, 50px)", maxWidth: "18ch", marginBottom: 26 }}>Generations of jewellers, one bench, the same care.</h2>
            <p style={{ margin: "0 0 22px", maxWidth: "46ch", fontSize: 16, lineHeight: 1.75, color: T.body }}>We cut, set, size and repair everything ourselves, which is why we can tell you exactly who made your ring and how long it took.</p>
            <Link to="/our-story" className="v2-textlink">Read our story</Link>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(20px, 2.5vw, 48px)", marginTop: "clamp(48px, 5vw, 80px)", borderTop: `1px solid ${T.rule}`, paddingTop: 32 }} className="v2-statrow v2-reveal">
          {[["1952", "Established"], ["Made", "In our workshop"], ["6wk", "Bespoke lead time"], ["1yr", "Warranty"]].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 3vw, 46px)", lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginTop: 10 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      <section style={{ background: T.tint, padding: `clamp(56px, 5vw, 88px) ${pageX}` }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 24, marginBottom: "clamp(36px, 3.5vw, 56px)" }}>
          <div style={eyebrow}>What clients say</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted }}>
            <span style={{ letterSpacing: "0.18em", color: T.gold }}>★★★★★</span>Rated excellent
          </div>
        </div>
        <div ref={quotesRef} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(24px, 2.6vw, 48px)", alignItems: "stretch" }} className="v2-quotes">
          {quotes.map(([q, name, cat], i) => (
            <figure key={name} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 22, padding: "0 clamp(20px, 2.4vw, 44px)", borderLeft: `1px solid ${T.rule}`, opacity: quotesIn ? 1 : 0, transform: quotesIn ? "translateX(0)" : "translateX(-40px)", transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 0.14}s` }}>
              <blockquote style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: "clamp(19px, 1.5vw, 23px)", lineHeight: 1.5, color: T.textPrimary }}>{q}</blockquote>
              <figcaption style={{ marginTop: "auto", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                <span style={{ color: T.textPrimary }}>{name}</span><span style={{ color: "#8A8377" }}>{cat}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 7b. SHARE YOUR EXPERIENCE — visitor review submission (paper band, distinct from the tint testimonials above) */}
      <section style={{ background: T.paper, padding: `clamp(56px, 5vw, 88px) ${pageX}`, marginBottom: SP }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(28px, 4vw, 64px)", alignItems: "start" }}>
          <div style={{ alignSelf: "center" }}>
            <div style={eyebrow}>Share your experience</div>
            <h3 style={{ ...h2Style, fontSize: "clamp(24px, 2.4vw, 36px)", marginTop: 16 }}>Been to the bench?</h3>
            <p style={{ fontSize: 15, color: T.body, lineHeight: 1.7, marginTop: 16, maxWidth: "44ch" }}>
              If we’ve made, remodelled or looked after something for you, we’d love to hear about it. Your words help the next person decide.
            </p>
          </div>
          <ReviewForm />
        </div>
      </section>

      {/* 8. JOURNAL — hidden for now (uncomment to restore) */}
      {false && (
      <section id="journal" style={{ padding: `0 ${pageX} ${SP}` }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, paddingBottom: 22, borderBottom: `1px solid ${T.rule}` }}>
          <h2 style={{ ...h2Style, fontSize: "clamp(24px, 2.4vw, 34px)" }}>The journal</h2>
          <Link to="/our-story" className="v2-textlink">All articles</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(20px, 2.4vw, 40px)", marginTop: 36 }} className="v2-journalgrid">
          {[
            ["/images/diamond-cuts-banner.png", "Buying guide", "Why cut matters more than carat"],
            ["/images/remodel-jewellery.jpg", "Workshop", "Remodelling an inherited ring"],
            ["/images/vintage-jewellery.jpg", "Materials", "Platinum or white gold, honestly"],
          ].map(([img, cat, title]) => (
            <Link key={title} to="/our-story" className="v2-prodcard" style={{ display: "block" }}>
              <div style={{ position: "relative", aspectRatio: "3 / 2", overflow: "hidden", background: T.tint }}>
                <img src={img} alt={title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              </div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6B64", margin: "18px 0 10px" }}>{cat}</div>
              <div style={{ fontSize: 17, lineHeight: 1.35 }}>{title}</div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* 9. SHOWROOM / APPOINTMENT */}
      <section id="appointment" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", borderTop: `1px solid ${T.rule}`, background: T.tint }} className="v2-split">
        <div className="v2-reveal" style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 40, padding: "clamp(56px, 6vw, 104px) clamp(32px, 4vw, 80px)" }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 20 }}>Visit us</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(28px, 3.2vw, 46px)", lineHeight: 1.04, marginBottom: 18 }}>Come and see them in daylight.</h2>
            <p style={{ maxWidth: "42ch", margin: 0, fontSize: 15, lineHeight: 1.7, color: "#56534D" }}>Appointments are free and take about an hour. Walk-ins welcome whenever we are open.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32, fontSize: 14.5, lineHeight: 1.75, color: T.body }}>
            <div><div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6B64", marginBottom: 10 }}>Showroom</div>7 The Square, Beeston<br />Nottingham NG9 2JG</div>
            <div><div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6B64", marginBottom: 10 }}>Opening hours</div>Mon – Sat, 9 – 5:30<br />Sunday, closed</div>
          </div>
          <Link to="/contact" className="v2-btn-ink" style={{ alignSelf: "flex-start", padding: "14px 28px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Book an appointment</Link>
        </div>
        <div className="v2-reveal v2-reveal-d1" style={{ position: "relative", minHeight: "clamp(420px, 56vh, 620px)", borderLeft: `1px solid ${T.rule}` }}>
          <img src="/images/shopfront-2-upscaled.webp" alt="McCulloch shopfront" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </section>

      {/* 10. INSTAGRAM — hidden for now (uncomment to restore) */}
      {false && (
      <section style={{ borderTop: `1px solid ${T.rule}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: `26px ${pageX}` }}>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.body }}>@mccullochjewellers</div>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6E6B64" }}>Follow</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 2 }} className="v2-iggrid">
          {["/images/prod1.png", "/images/prod2.png", "/images/prod3.png", "/images/prod4.png", "/images/prod5.png", "/images/stark-media-bw-23.jpg"].map((src, i) => (
            <a key={i} href="https://instagram.com" target="_blank" rel="noreferrer" className="v2-igcell" style={{ position: "relative", aspectRatio: "1", minWidth: 0, overflow: "hidden", background: T.tint }}>
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
