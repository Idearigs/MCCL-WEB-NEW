import React, { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { useFavorites } from "../contexts/FavoritesContext";
import { LISTING_CSS, GROUND, TILE, PAGE_X } from "../components/home-v2/listingShared";

/**
 * Jewellery — /jewellery. Redesigned Nov 2026 as the doorway to the jewellery pages rather
 * than a third product listing: three category photographs side by side, then a short shelf
 * of four pieces from each category with a link through to the full page, and a closing line
 * about commissions. Filtering lives on the category pages (JewelleryListingV2).
 * Cards and colours come from components/home-v2/listingShared.tsx, as on those pages.
 * An old link such as /jewellery?cat=Earrings is sent on to that category page.
 */

const CATS = [
  { label: "Earrings", slug: "earrings", img: "/images/cat-earrings", note: "Weight matters more than size." },
  { label: "Necklaces", slug: "necklaces", img: "/images/cat-necklaces", note: "Measure the one you wear most." },
  { label: "Bracelets", slug: "bracelets", img: "/images/cat-bracelets", note: "Two millimetres decides everything." },
] as const;
type Slug = typeof CATS[number]["slug"];
const SHELF = 4; // pieces shown from each category

interface Product { id: string; name: string; slug: string; price: string; is_featured?: boolean; is_live_stock?: boolean; image?: { url: string } | null; images?: { url: string; is_primary?: boolean }[]; variants?: { price?: number | string }[]; }
const photo = (p: Product) => p.image?.url || p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url;

const Arrow = () => (
  <svg className="ja-arrow" width="18" height="9" viewBox="0 0 18 9" fill="none" aria-hidden="true"><path d="M0 4.5h17M13.5 1l3.5 3.5L13.5 8" stroke="currentColor" strokeWidth="1" /></svg>
);

const JewelleryAllV2 = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const [lists, setLists] = useState<Record<Slug, Product[]>>({ earrings: [], necklaces: [], bracelets: [] });
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => { document.body.style.background = GROUND; window.scrollTo(0, 0); }, []);
  useEffect(() => {
    Promise.all(CATS.map(c =>
      fetch(`${API_BASE_URL}/products?category=${c.slug}&sort=sort_order&order=asc&limit=1000`)
        .then(r => r.json()).then(d => [c.slug, (d.success ? d.data.products : []) as Product[]] as const).catch(() => [c.slug, [] as Product[]] as const)
    )).then(res => setLists(Object.fromEntries(res) as Record<Slug, Product[]>)).finally(() => setLoading(false));
  }, []);

  const old = CATS.find(c => c.label === searchParams.get("cat"));
  if (old) return <Navigate to={`/${old.slug}`} replace />;

  // The shelf: pieces marked as featured first, then the rest in the shop's own order; only pieces with a photograph.
  const shelf = (slug: Slug) => {
    const withPhoto = lists[slug].filter(p => photo(p));
    return [...withPhoto.filter(p => p.is_featured), ...withPhoto.filter(p => !p.is_featured)].slice(0, SHELF);
  };

  const card = (slug: Slug, p: Product) => {
    const img = photo(p);
    const second = (p.images || []).find(i => i.url && i.url !== img)?.url;
    const href = `/${slug}/${p.slug}`;
    const saved = isFavorite(p.id);
    const from = (p.variants || []).filter(v => Number(v.price) > 0).length > 1 ? "From " : "";
    return (
      <div key={p.id} className={`erv2-card${second ? " has-alt" : ""}`} style={{ position: "relative" }}>
        <Link to={href} style={{ display: "block" }}>
          <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: TILE, overflow: "hidden" }}>
            {img && <img src={getMediaUrl(img)} alt={p.name} className="erv2-main-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
            {second && <img src={getMediaUrl(second)} alt="" aria-hidden="true" className="erv2-card-alt" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
            <span className="erv2-add">Add to bag</span>
          </div>
          <div className="ja-name" style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.45, color: T.text }}>{p.name}</div>
          <div style={{ marginTop: 5, fontSize: 14, color: T.textMuted }}>{from}{p.price}</div>
        </Link>
        <button type="button" className="erv2-save" aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
          onClick={() => toggleFavorite(p.id, p.name, img ? getMediaUrl(img) : "", href)}
          style={{ position: "absolute", top: 6, right: 6, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: 0, color: T.text }}>
          <svg width="20" height="18" viewBox="0 0 20 18" fill={saved ? "currentColor" : "none"} aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.7 2.8-2.7 4.6-2.7C17 1.4 19 3.3 19 5.9c0 3.7-3.6 6.8-9 10.7z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
        </button>
      </div>
    );
  };

  const count = (slug: Slug) => lists[slug].length;

  return (
    <div style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh", WebkitFontSmoothing: "antialiased" }}>
      <style>{LISTING_CSS}</style>
      <style>{`
        .ja-wrap { max-width: 1320px; margin: 0 auto; }
        /* The three photographs share one cream backdrop, so set edge to edge they read as a single still life */
        .ja-doors { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; }
        .ja-door { display: block; }
        .ja-door-img { position: relative; aspect-ratio: 1 / 1.08; overflow: hidden; background: ${TILE}; }
        .ja-door-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 1.1s cubic-bezier(0.22,1,0.36,1); }
        .ja-door:hover .ja-door-img img { transform: scale(1.035); }
        .ja-door-text { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 20px 12px 0; text-align: center; }
        .ja-arrow { transition: transform 0.35s cubic-bezier(0.22,1,0.36,1); flex: none; }
        .ja-all:hover .ja-arrow { transform: translateX(5px); }
        .ja-shelfgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(28px,3vw,44px) clamp(16px,1.6vw,28px); }
        .ja-shelfhead { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding-bottom: 22px; }
        .ja-all { display: inline-flex; align-items: center; gap: 12px; font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap; padding: 6px 0; }
        .ja-all-m { display: none; }
        .ja-body { animation: jaIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        @keyframes jaIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .ja-body { animation: none; } .ja-door-img img, .ja-arrow { transition: none; } }
        @media (max-width: 900px){
          .ja-doors { grid-template-columns: 1fr; gap: 28px; }
          .ja-door-img { aspect-ratio: 3 / 2; }
          .ja-door-text { padding-top: 14px; }
          .ja-shelfgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 12px; }
          .ja-shelfhead { display: block; text-align: center; padding-bottom: 20px; }
          .ja-shelfhead .ja-all { display: none; }
          .ja-all-m { display: flex; justify-content: center; margin-top: 28px; }
          .ja-all-m a { display: flex; align-items: center; justify-content: center; width: 100%; height: 50px; border: 1px solid ${T.ruleStrong}; font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; }
          .ja-name { font-size: 13.5px !important; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        }
      `}</style>

      <NavigationV2 solid />

      <div className="erv2" style={{ paddingTop: "var(--v2nav-h, 96px)" }}>
        <div className="ja-body">
          <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: `clamp(30px,3.4vw,52px) ${PAGE_X} 16px`, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>
            <Link to="/">Home</Link><span>/</span><span style={{ color: T.text }}>Jewellery</span>
          </div>

          <section className="erv2-head" style={{ padding: `0 ${PAGE_X} clamp(34px,3.8vw,56px)`, textAlign: "center" }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(28px, 3.2vw, 44px)", lineHeight: 1.15, margin: "0 0 16px", color: T.text }}>Jewellery</h1>
            <p style={{ margin: "0 auto", maxWidth: "46ch", fontSize: 15, lineHeight: 1.75, color: T.textMuted }}>Earrings, necklaces and bracelets, made to order on our own bench.</p>
          </section>

          {/* Three doors */}
          <section style={{ padding: `0 ${PAGE_X}` }}>
            <div className="ja-wrap ja-doors">
              {CATS.map(c => (
                <Link key={c.slug} to={`/${c.slug}`} className="ja-door" aria-label={`Shop ${c.label.toLowerCase()}`}>
                  <div className="ja-door-img">
                    <img src={`${c.img}-960.jpg`} srcSet={`${c.img}-480.jpg 480w, ${c.img}-960.jpg 960w`} sizes="(max-width: 900px) 100vw, 33vw" alt={c.label} />
                  </div>
                  <div className="ja-door-text">
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(20px, 1.9vw, 26px)", lineHeight: 1.2, color: T.text }}>{c.label}</span>
                    <span style={{ minHeight: 20, fontSize: 13, color: T.textMuted }}>{!loading && count(c.slug) > 0 ? `${count(c.slug)} pieces` : ""}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* A shelf from each category */}
          {CATS.map(c => {
            const items = shelf(c.slug);
            if (!loading && !items.length) return null;
            return (
              <section key={c.slug} style={{ padding: `clamp(64px, 7vw, 112px) ${PAGE_X} 0` }}>
                <div className="ja-wrap">
                  <div className="ja-shelfhead">
                    <div>
                      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(23px, 2.3vw, 31px)", lineHeight: 1.2, margin: "0 0 8px", color: T.text }}>{c.label}</h2>
                      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: T.textMuted }}>{c.note}</p>
                    </div>
                    <Link to={`/${c.slug}`} className="ja-all">View all {c.label.toLowerCase()}<Arrow /></Link>
                  </div>
                  <div className="ja-shelfgrid">
                    {loading
                      ? Array.from({ length: SHELF }).map((_, i) => <div key={i} style={{ aspectRatio: "1 / 1.1", background: TILE }} />)
                      : items.map(p => card(c.slug, p))}
                  </div>
                  <div className="ja-all-m"><Link to={`/${c.slug}`}>View all {c.label.toLowerCase()}</Link></div>
                </div>
              </section>
            );
          })}

          {/* Commissions */}
          <section style={{ padding: `clamp(72px, 8vw, 128px) ${PAGE_X} clamp(72px, 8vw, 120px)`, textAlign: "center" }}>
            <div style={{ width: 1, height: 44, background: T.ruleStrong, margin: "0 auto clamp(26px, 2.6vw, 36px)" }} />
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(23px, 2.3vw, 31px)", lineHeight: 1.2, margin: "0 0 12px", color: T.text }}>Not quite it?</h2>
            <p style={{ margin: "0 auto 8px", maxWidth: "40ch", fontSize: 15, lineHeight: 1.75, color: T.textMuted }}>If nothing here is right, we can create a bespoke piece for you.</p>
            <Link to="/bespoke-design" className="erv2-textlink">Commission it</Link>
          </section>
        </div>

        <FooterV2 />
      </div>
    </div>
  );
};

export default JewelleryAllV2;
