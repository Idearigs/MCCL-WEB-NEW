import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { useFavorites } from "../contexts/FavoritesContext";
import { LISTING_CSS, GROUND, TILE, PAGE_SIZE, PAGE_X, BAR_TOP_CSS, M_BAR_TOP_CSS, Chev, XICON, PillTick, useFilterPanel } from "../components/home-v2/listingShared";

/**
 * Jewellery listing — v2, one template for Earrings / Necklaces / Bracelets
 * (design_handoff_mcculloch_jewellery, 9th package), restyled in Nov 2026 to match the
 * engagement rings listing: centred header, one slim filter row (the last group changes
 * per category: Fastening / Length / Fit), a 4-up grid with a save heart, and "Show more".
 * The look itself lives in components/home-v2/listingShared.tsx.
 *
 * DATA: fetches ?category=<cat>. Real jewellery products currently carry no structured
 * facet tags, so Style / Metal / Stone / detail are inferred from the product name
 * (like the watch listing). Filters improve automatically once real tags are added.
 * NOT YET PUBLISHED — photography and catalogue are still in progress.
 */


type Key = "availability" | "style" | "metal" | "stone" | "detail";
const AVAIL_LIVE = "Ready to ship";
const AVAIL_ORDER = "Made to order";
interface CatDef {
  slug: string; label: string;
  standfirst: string[]; // intro paragraphs (client-approved copy, Nov 2026)
  cta?: { label: string; to: string; kind: "link" | "button" };
  only?: RegExp; // keep only products whose name matches (pendants share the necklaces category)
  styles: string[]; detailTitle: string; detailOptions: string[];
  band: { headline: string; body: string; guide: { k: string; title: string; meta: string; note: string }[] };
}

const METALS = ["Platinum", "18ct White Gold", "18ct Yellow Gold", "18ct Rose Gold"];
const STONES = ["Diamond", "Sapphire", "Emerald", "None"];

const CATS: Record<string, CatDef> = {
  earrings: {
    slug: "earrings", label: "Earrings",
    standfirst: [
      "Discover our beautiful collection of earrings, from timeless classics to distinctive designs. Perfect for everyday elegance, special occasions or thoughtful gifts.",
      "Looking for something unique? Let us create your perfect pair with our bespoke jewellery service.",
    ],
    cta: { label: "Explore Our Bespoke Service", to: "/bespoke-design", kind: "link" },
    styles: ["Studs", "Hoops", "Drops", "Climbers"],
    detailTitle: "Fastening", detailOptions: ["Butterfly", "Screw", "Lever", "Hook"],
    band: {
      headline: "Earrings are the piece people get wrong.",
      body: "Weight matters more than size — a heavy drop on a fine post drags over an evening. Posts come in three thicknesses; we set platinum for sensitive ears, and anything above 25mm is made hollow to keep the weight down.",
      guide: [
        { k: "Studs", title: "Studs", meta: "From £320", note: "Everyday, front-facing. A butterfly or screw back for security." },
        { k: "Hoops", title: "Hoops", meta: "From £480", note: "Hollow above 25mm so they never drag. Hinged or lever fastening." },
        { k: "Drops", title: "Drops", meta: "From £650", note: "Movement and length. Balanced so the weight sits on the lobe, not the post." },
        { k: "Climbers", title: "Climbers", meta: "From £540", note: "Follow the ear upward. A single line of stones, no visible drop." },
      ],
    },
  },
  necklaces: {
    slug: "necklaces", label: "Necklaces",
    standfirst: [
      "Discover our carefully selected necklaces and pendants, featuring beautiful gemstones and distinctive designs.",
      "Have a particular stone, colour, shape or setting in mind? We can create a bespoke piece to suit your style and budget.",
    ],
    cta: { label: "Enquire About Bespoke Jewellery", to: "/contact", kind: "button" },
    styles: ["Pendant", "Chain", "Collar", "Station"],
    detailTitle: "Length", detailOptions: ['16"', '18"', '20"', '24"'],
    band: {
      headline: "Measure the one you wear most.",
      body: "Take a necklace you already own, lay it flat, and measure end to end including the clasp. That length tells us more than any size chart — where a piece sits on you is personal, and a pendant an inch too long changes the whole look.",
      guide: [
        { k: '16"', title: '16" · Choker', meta: "From £390", note: "Sits at the base of the neck. Best on a higher neckline." },
        { k: '18"', title: '18" · Princess', meta: "From £420", note: "The most-worn length. Rests just below the collarbone." },
        { k: '20"', title: '20" · Matinee', meta: "From £460", note: "Sits on the sternum. Layers well over a shirt." },
        { k: '24"', title: '24" · Opera', meta: "From £520", note: "Longer line for a lower neckline, or doubled." },
      ],
    },
  },
  // Pendants are stored under the necklaces category; this page shows just the pendants.
  pendants: {
    slug: "necklaces", label: "Pendants", only: /pendant/i,
    standfirst: [
      "Discover our carefully selected pendants, featuring beautiful gemstones and distinctive designs.",
      "Have a particular stone, colour, shape or setting in mind? We can create a bespoke piece to suit your style and budget.",
    ],
    cta: { label: "Enquire About Bespoke Jewellery", to: "/contact", kind: "button" },
    styles: ["Solitaire", "Halo", "Cluster", "Drop", "Heart", "Cross"],
    detailTitle: "Length", detailOptions: ['16"', '18"', '20"', '24"'],
    band: {
      headline: "Choose the chain as carefully as the pendant.",
      body: "A pendant sits where its chain lets it. Measure a necklace you already wear, lay it flat end to end including the clasp, and we will cut the chain to that length so the stone falls where you want it.",
      guide: [
        { k: '16"', title: '16" · Choker', meta: "From £390", note: "Sits at the base of the neck. Best on a higher neckline." },
        { k: '18"', title: '18" · Princess', meta: "From £420", note: "The most-worn length. Rests just below the collarbone." },
        { k: '20"', title: '20" · Matinee', meta: "From £460", note: "Sits on the sternum. Layers well over a shirt." },
        { k: '24"', title: '24" · Opera', meta: "From £520", note: "Longer line for a lower neckline, or doubled." },
      ],
    },
  },
  bracelets: {
    slug: "bracelets", label: "Bracelets",
    standfirst: [
      "From delicate tennis bracelets to elegant link designs, discover our carefully selected collection in yellow, white and rose gold.",
      "Explore our collection below and discover a bracelet to treasure for years to come.",
    ],
    styles: ["Tennis", "Bangle", "Chain", "Cuff"],
    detailTitle: "Fit", detailOptions: ["Sized to wrist", "Bangle", "Adjustable", "Cuff"],
    band: {
      headline: "Two millimetres decides everything.",
      body: "A fraction loose and it spins, so the clasp ends up on top of the wrist; a fraction tight and it never leaves the shelf. Measure at the wrist bone, add a centimetre for a chain, two for a bangle that has to pass the hand.",
      guide: [
        { k: "Tennis", title: "Tennis", meta: "From £1,400", note: "A continuous line of stones. Sized exactly — no adjustment once set." },
        { k: "Bangle", title: "Bangle", meta: "From £780", note: "Solid or hinged. Must pass the hand, so measured across the knuckles." },
        { k: "Chain", title: "Chain", meta: "From £520", note: "Adjustable by a link or two. Forgiving, and the easiest to layer." },
        { k: "Cuff", title: "Cuff", meta: "From £890", note: "Open-backed. Slips on at the side; holds its shape to the wrist." },
      ],
    },
  },
};
const ORDER = ["earrings", "pendants", "necklaces", "bracelets"];

const money = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");

// Infer a facet value from the product name (real products carry no structured tags yet).
// Also matches the singular of a plural option ("Studs" -> "stud") so names phrased in
// the singular still register.
const infer = (name: string, options: string[], aliases: Record<string, string[]> = {}): string[] => {
  const t = name.toLowerCase();
  return options.filter(o => {
    const base = o.toLowerCase().replace(/"/g, "");
    const singular = base.endsWith("s") ? base.slice(0, -1) : base;
    const keys = [base, singular, ...(aliases[o] || [])];
    return keys.some(k => k && t.includes(k.toLowerCase()));
  });
};
const METAL_ALIASES: Record<string, string[]> = {
  "Platinum": ["platinum", "plat "], "18ct White Gold": ["white gold", "18ct w", "18k white"],
  "18ct Yellow Gold": ["yellow gold", "18ct y", "18k yellow"], "18ct Rose Gold": ["rose gold", "18ct r", "18k rose"],
};

interface Product {
  id: string; name: string; slug: string; price: string; base_price: number; sale_price?: number;
  is_featured?: boolean; in_stock?: boolean; is_live_stock?: boolean;
  category: { slug: string };
  image?: { url: string } | null; images?: { url: string; is_primary?: boolean }[];
}

type PanelKey = Key | "price" | "sort";
const PRICE_MAX = 4400;

const JewelleryListingV2 = ({ category }: { category: string }): JSX.Element => {
  const cat = CATS[category] || CATS.earrings;
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const groups: { key: Key; title: string; options: string[] }[] = useMemo(() => [
    { key: "availability", title: "Availability", options: [AVAIL_LIVE, AVAIL_ORDER] },
    { key: "style", title: "Style", options: cat.styles },
    { key: "metal", title: "Metal", options: METALS },
    { key: "stone", title: "Stone", options: STONES },
    { key: "detail", title: cat.detailTitle, options: cat.detailOptions },
  ], [cat]);

  const NONE: Record<Key, string[]> = { availability: [], style: [], metal: [], stone: [], detail: [] };
  const [sel, setSel] = useState<Record<Key, string[]>>(NONE);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState<Record<Key, boolean>>({ availability: true, style: true, metal: false, stone: false, detail: false });
  const [panel, setPanel] = useState<PanelKey | null>(null); // which filter panel is open on a laptop
  const [shown, setShown] = useState(PAGE_SIZE);             // how many results are on screen
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sheet, setSheet] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);

  // Reset filters/sort when the category changes (filters don't carry across)
  useEffect(() => {
    setSel(NONE); setMaxPrice(PRICE_MAX); setSort("featured"); setPanel(null);
    setOpen({ availability: true, style: true, metal: false, stone: false, detail: false });
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    const lock = sheet || sortSheet; document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheet, sortSheet]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/products?category=${cat.slug}&sort=sort_order&order=asc&limit=1000`)
      .then(r => r.json())
      .then(d => { if (d.success) setProducts((d.data.products || []).filter((p: Product) => !cat.only || cat.only.test(p.name || ""))); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cat]);

  useEffect(() => {
    const style = searchParams.get("style"); if (style) setSel(s => ({ ...s, style: [style] }));
  }, [searchParams]);

  const rows = useMemo(() => products.map(p => {
    const name = p.name || "";
    return {
      p,
      availability: [p.is_live_stock ? AVAIL_LIVE : AVAIL_ORDER],
      style: infer(name, cat.styles),
      metal: infer(name, METALS, METAL_ALIASES),
      stone: (() => { const s = infer(name, STONES.filter(x => x !== "None")); return s.length ? s : ["None"]; })(),
      detail: infer(name, cat.detailOptions),
      price: p.sale_price || p.base_price || 0,
      hasImage: !!(p.image?.url || p.images?.[0]?.url),
      inStock: !!p.is_live_stock, // ready to ship = live stock; everything else is made to order
    };
  }), [products, cat]);

  const passes = (r: typeof rows[number], skip?: Key) => {
    const ok = (k: Key, field: string[]) => skip === k || !sel[k].length || sel[k].some(v => field.includes(v));
    return ok("availability", r.availability) && ok("style", r.style) && ok("metal", r.metal) && ok("stone", r.stone) && ok("detail", r.detail) && r.price <= maxPrice;
  };
  const fieldFor = (r: typeof rows[number], k: Key) => r[k];

  // Leave out options no piece in this category has, unless already chosen; a group with nothing left is left off.
  const visibleOpts = (g: { key: Key; options: string[] }) => g.options.filter(o => sel[g.key].includes(o) || rows.some(r => fieldFor(r, g.key).includes(o)));
  const shownGroups = groups.filter(g => loading || visibleOpts(g).length > 1 || sel[g.key].length > 0);
  // Only label pieces "Ready to ship" where the category mixes stock and made-to-order pieces.
  const mixed = rows.some(r => r.inStock) && rows.some(r => !r.inStock);

  const results = useMemo(() => {
    let list = rows.filter(r => passes(r));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "new") list = [...list].reverse();
    else list = [...list].sort((a, b) => Number(b.hasImage) - Number(a.hasImage));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sel, maxPrice, sort]);

  // A new filter or sort starts again from the first rows.
  useEffect(() => { setShown(PAGE_SIZE); }, [sel, maxPrice, sort, category]);

  const { barRef, mainRef, toResults } = useFilterPanel(!!panel, () => setPanel(null));
  const toggle = (k: Key, v: string) => { setSel(s => ({ ...s, [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v] })); toResults(); };
  const clearAll = () => { setSel(NONE); setMaxPrice(PRICE_MAX); toResults(); };
  const showLabel = (n: number) => `Show ${n} ${n === 1 ? "piece" : "pieces"}`;
  const chips = groups.flatMap(g => sel[g.key].map(v => ({ key: g.key, label: v })));
  const activeCount = chips.length + (maxPrice < PRICE_MAX ? 1 : 0);
  const sortOptions = [{ value: "featured", label: "Featured" }, { value: "low", label: "Price, low to high" }, { value: "high", label: "Price, high to low" }, { value: "new", label: "Newest" }];
  const sortLabel = sortOptions.find(o => o.value === sort)?.label || "Featured";
  const priceLabel = maxPrice >= PRICE_MAX ? "Any" : "Up to " + money(maxPrice);
  const countLabel = loading ? "Loading…" : `${results.length} ${results.length === 1 ? "piece" : "pieces"}`;

  // One option row; "big" is the phone sheet size.
  const optRow = (g: { key: Key }, o: string, big: boolean) => {
    const on = sel[g.key].includes(o);
    const n = rows.filter(r => passes(r, g.key) && fieldFor(r, g.key).includes(o)).length;
    return (
      <button key={o} type="button" onClick={() => toggle(g.key, o)} className="erv2-opt" data-fopt aria-pressed={on}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: big ? "12px 0" : "10px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: big ? 15 : 14, color: T.text }}>
        <span style={{ display: "flex", alignItems: "center", gap: big ? 12 : 11 }}>
          <span className="erv2-box" style={{ width: big ? 16 : 14, height: big ? 16 : 14, flex: "none", border: `1px solid ${on ? T.text : T.ruleStrong}`, background: on ? T.text : "transparent" }} />
          {g.key === "stone" && o === "None" ? "No stones" : o}
        </span>
        <span style={{ fontSize: big ? 12.5 : 12, color: T.textMuted }}>{n}</span>
      </button>
    );
  };

  // Laptop panels: each choice is an outlined pill.
  const pill = (g: { key: Key }, o: string) => {
    const on = sel[g.key].includes(o);
    const n = rows.filter(r => passes(r, g.key) && fieldFor(r, g.key).includes(o)).length;
    return (
      <button key={o} type="button" onClick={() => toggle(g.key, o)} className="erv2-pill" data-fopt aria-pressed={on}>
        <PillTick />
        {g.key === "stone" && o === "None" ? "No stones" : o}<span className="erv2-pill-n">{n}</span>
      </button>
    );
  };

  // Phone sheet: the same groups as accordions, then price
  const filterGroupsJsx = (
    <>
      {shownGroups.map(g => (
        <div key={g.key} style={{ borderBottom: `1px solid ${T.rule}` }}>
          <button type="button" data-acc aria-expanded={open[g.key]} onClick={() => setOpen(o => ({ ...o, [g.key]: !o[g.key] }))}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "17px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>
            <span>{g.title}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {sel[g.key].length > 0 && <span style={{ fontSize: 12, color: T.textMuted }}>({sel[g.key].length})</span>}
              <Chev />
            </span>
          </button>
          <div style={{ display: open[g.key] ? "flex" : "none", flexDirection: "column", gap: 1, paddingBottom: 16 }}>
            {visibleOpts(g).map(o => optRow(g, o, true))}
          </div>
        </div>
      ))}
      <div style={{ padding: "20px 0 8px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Price</span>
          <span style={{ fontSize: 13.5, color: T.textMuted }}>{priceLabel}</span>
        </div>
        <input type="range" min={200} max={PRICE_MAX} step={100} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="erv2-range" aria-valuetext={priceLabel} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8A8377", marginTop: 8 }}><span>£200</span><span>£4,400+</span></div>
      </div>
    </>
  );

  // Bracelets: ready-to-ship stock and made-to-order pieces are shown apart, all at once.
  const split = cat.slug === "bracelets";

  const card = ({ p, inStock }: typeof results[number]) => {
    const imgs = p.images || [];
    const primaryObj = imgs.find(i => i.is_primary) || imgs[0];
    const img = p.image?.url || primaryObj?.url;
    // These are photographs, not cut-outs, so they fill the tile edge to edge. Hover: the piece's next photograph.
    const second = imgs.find(i => i.url && i.url !== img)?.url;
    const href = `/${cat.slug}/${p.slug}`;
    const saved = isFavorite(p.id);
    const label = !split && mixed && inStock ? "Ready to ship" : p.is_featured ? "Most asked for" : "";
    const from = ((p as any).variants || []).filter((v: any) => Number(v.price) > 0).length > 1 ? "From " : "";
    return (
      <div key={p.id} className={`erv2-card${second ? " has-alt" : ""}`} style={{ position: "relative" }}>
        <Link to={href} style={{ display: "block" }}>
          <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: TILE, overflow: "hidden" }}>
            {img
              ? <img src={getMediaUrl(img)} alt={p.name} className="erv2-main-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted, padding: 12, textAlign: "center" }}>{p.name}</div>}
            {second && <img src={getMediaUrl(second)} alt="" aria-hidden="true" className="erv2-card-alt" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
            {label && <span style={{ position: "absolute", top: 12, left: 12, padding: "5px 9px", background: "rgba(255,254,253,0.9)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: T.text }}>{label}</span>}
            <span className="erv2-add">Add to bag</span>
          </div>
          {/* Jewellery names are long, so the price sits under the name rather than beside it */}
          <div className="jl-name" style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.45, color: T.text }}>{p.name}</div>
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
  const grid = (list: typeof results) => (
    <div style={{ display: "grid", gap: "clamp(28px,3vw,44px) clamp(16px,1.6vw,28px)", marginTop: 32 }} className="erv2-grid">
      {list.map(card)}
    </div>
  );
  const groupHead = (title: string, note: string) => (
    <div style={{ marginTop: "clamp(44px, 4.4vw, 68px)", textAlign: "center" }}>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(21px, 2vw, 27px)", lineHeight: 1.22, margin: "0 0 8px", color: T.text }}>{title}</h2>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: T.textMuted }}>{note}</p>
    </div>
  );
  const ready = results.filter(r => r.inStock), bespoke = results.filter(r => !r.inStock);

  return (
    <div style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility" } as React.CSSProperties}>
      <style>{LISTING_CSS}</style>
      <style>{`
        .jl-tab { padding: 6px 0 5px; font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; border-bottom: 1px solid transparent; transition: color 0.2s ease, border-color 0.2s ease; }
        .jl-tab:hover { color: ${T.text}; }
        .jl-tab[aria-current="page"] { color: ${T.text}; border-bottom-color: ${T.text}; }
        @media (max-width: 900px) {
          .jl-tab { font-size: 10.5px; letter-spacing: 0.12em; }
          .jl-tabs { gap: 6px 15px !important; }
          .jl-name { font-size: 13.5px !important; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        }
        @keyframes jlIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .jl-body { animation: none !important; } }
      `}</style>

      <NavigationV2 solid />

      <div className="erv2" style={{ paddingTop: "var(--v2nav-h, 96px)" }}>
        <div key={category} className="jl-body" style={{ animation: "jlIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: `clamp(30px,3.4vw,52px) ${PAGE_X} 16px`, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>
            <Link to="/">Home</Link><span>/</span><Link to="/jewellery">Jewellery</Link><span>/</span><span style={{ color: T.text }}>{cat.label}</span>
          </div>

          {/* Page header — centred and compact */}
          <section className="erv2-head" style={{ padding: `0 ${PAGE_X} clamp(34px,3.8vw,56px)`, textAlign: "center" }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(28px, 3.2vw, 44px)", lineHeight: 1.15, margin: "0 0 16px", color: T.text }}>{cat.label}</h1>
            {cat.standfirst.map((para, i) => (
              <p key={i} style={{ margin: i ? "10px auto 0" : "0 auto", maxWidth: "58ch", fontSize: 15.5, lineHeight: 1.7, color: T.text }}>{para}</p>
            ))}
            {cat.cta && <div><Link to={cat.cta.to} className="erv2-textlink" style={{ color: T.text, marginTop: 6 }}>{cat.cta.label}</Link></div>}
            {/* The four jewellery pages, one tap apart */}
            <nav aria-label="Jewellery categories" className="jl-tabs" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px clamp(18px, 2.4vw, 36px)", marginTop: "clamp(26px, 2.8vw, 38px)" }}>
              {ORDER.map(k => <Link key={k} to={`/${k}`} className="jl-tab" aria-current={k === category ? "page" : undefined}>{CATS[k].label}</Link>)}
            </nav>
          </section>

          {/* Phone filter row: Filter on the left, the count in the middle, Sort on the right */}
          <div className="erv2-triggerbar" style={{ position: "sticky", top: M_BAR_TOP_CSS, zIndex: 40, background: GROUND, padding: `0 ${PAGE_X}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
              <button type="button" className="erv2-mbtn" data-sheetbtn="filter" onClick={() => setSheet(true)} style={{ justifySelf: "start" }}>
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M0 3h16M0 9h16" stroke="currentColor" strokeWidth="1" /><circle cx="5" cy="3" r="2" fill={GROUND} stroke="currentColor" strokeWidth="1" /><circle cx="11" cy="9" r="2" fill={GROUND} stroke="currentColor" strokeWidth="1" /></svg>
                Filter{activeCount > 0 && <span style={{ color: T.textMuted }}>({activeCount})</span>}
              </button>
              <span style={{ fontSize: 12.5, color: T.textMuted }}>{countLabel}</span>
              <button type="button" className="erv2-mbtn" data-sheetbtn="sort" onClick={() => setSortSheet(true)} style={{ justifySelf: "end" }}>
                Sort<Chev />
              </button>
            </div>
          </div>

          <div>
            {/* Laptop filter bar: one quiet row; each label opens its options underneath */}
            <div ref={barRef} className={`erv2-bar${panel ? " has-open" : ""}`} style={{ position: "sticky", top: BAR_TOP_CSS, zIndex: 30, background: GROUND, padding: `0 ${PAGE_X}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.6vw, 44px)" }}>
                  {[...shownGroups.map(g => ({ key: g.key as PanelKey, label: g.title, n: sel[g.key].length })), { key: "price" as PanelKey, label: "Price", n: maxPrice < PRICE_MAX ? 1 : 0 }].map(b => (
                    <button key={b.key} type="button" className="erv2-fbtn" data-fbtn={b.key} aria-expanded={panel === b.key} onClick={() => setPanel(v => v === b.key ? null : b.key)}>
                      {b.label}{b.n > 0 && <span style={{ color: T.textMuted }}>({b.n})</span>}<Chev />
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.6vw, 44px)" }}>
                  <span style={{ fontSize: 12.5, color: T.textMuted }}>{countLabel}</span>
                  <button type="button" className="erv2-fbtn" data-fbtn="sort" aria-expanded={panel === "sort"} onClick={() => setPanel(v => v === "sort" ? null : "sort")}>
                    Sort<span style={{ color: T.textMuted, textTransform: "none", letterSpacing: 0, fontSize: 12.5 }}>{sortLabel}</span><Chev />
                  </button>
                </div>
              </div>
              {shownGroups.map(g => (
                <div key={g.key} data-fpanel={g.key} className={`erv2-panel${panel === g.key ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
                  <div className="erv2-pills">{visibleOpts(g).map(o => pill(g, o))}</div>
                  <div className="erv2-panel-foot">
                    <span />
                    <span style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.4vw, 36px)" }}>
                      {sel[g.key].length > 0 && <button type="button" className="is-quiet" onClick={() => setSel(s => ({ ...s, [g.key]: [] }))}>Clear</button>}
                      <button type="button" data-fclose onClick={() => setPanel(null)}>{showLabel(results.length)}</button>
                    </span>
                  </div>
                </div></div></div>
              ))}
              <div data-fpanel="price" className={`erv2-panel${panel === "price" ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
                <div style={{ maxWidth: 380 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, fontSize: 14, color: T.text }}>
                    <span>Maximum price</span><span style={{ color: T.textMuted }}>{priceLabel}</span>
                  </div>
                  <input type="range" min={200} max={PRICE_MAX} step={100} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="erv2-range" aria-label="Maximum price" />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.textMuted, marginTop: 10 }}><span>£200</span><span>£4,400+</span></div>
                </div>
                <div className="erv2-panel-foot">
                  <span />
                  <span style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.4vw, 36px)" }}>
                    {maxPrice < PRICE_MAX && <button type="button" className="is-quiet" onClick={() => setMaxPrice(PRICE_MAX)}>Clear</button>}
                    <button type="button" data-fclose onClick={() => setPanel(null)}>{showLabel(results.length)}</button>
                  </span>
                </div>
              </div></div></div>
              <div data-fpanel="sort" className={`erv2-panel${panel === "sort" ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
                <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "4px clamp(22px, 2.6vw, 40px)" }}>
                  {sortOptions.map(o => (
                    <button key={o.value} type="button" className="erv2-sortopt" aria-pressed={sort === o.value} onClick={() => { setSort(o.value); setPanel(null); }}
                      style={{ padding: "8px 0 5px", cursor: "pointer", background: "transparent", border: 0, borderBottom: `1px solid ${sort === o.value ? T.text : "transparent"}`, fontFamily: FONT_BODY, fontSize: 14, color: sort === o.value ? T.text : T.textMuted }}>{o.label}</button>
                  ))}
                </div>
              </div></div></div>
            </div>

            <div className={`erv2-scrim${panel ? " is-on" : ""}`} data-scrim onClick={() => setPanel(null)} aria-hidden="true" />

            <main ref={mainRef} style={{ padding: `0 ${PAGE_X} clamp(64px,6vw,104px)` }} className="erv2-main">
              {/* Chosen filters */}
              <div className="erv2-meta" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: activeCount ? 24 : 0 }}>
                {chips.map((c, i) => (
                  <button key={i} type="button" onClick={() => toggle(c.key, c.label)} className="erv2-chip"
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", cursor: "pointer", background: "transparent", border: `1px solid ${T.line}`, fontFamily: FONT_BODY, fontSize: 12, color: T.text }}>
                    {c.label}<span aria-hidden="true" style={{ color: T.textMuted }}>×</span>
                  </button>
                ))}
                {maxPrice < PRICE_MAX && (
                  <button type="button" onClick={() => setMaxPrice(PRICE_MAX)} className="erv2-chip"
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", cursor: "pointer", background: "transparent", border: `1px solid ${T.line}`, fontFamily: FONT_BODY, fontSize: 12, color: T.text }}>
                    {priceLabel}<span aria-hidden="true" style={{ color: T.textMuted }}>×</span>
                  </button>
                )}
                {activeCount > 0 && <button type="button" className="erv2-clear" onClick={clearAll} style={{ marginLeft: 8, padding: "7px 0", cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 12, color: T.textMuted, textDecoration: "underline", textUnderlineOffset: 4 }}>Clear all</button>}
              </div>

              {loading ? (
                <div style={{ display: "grid", gap: "clamp(28px,3vw,44px) clamp(16px,1.6vw,28px)", marginTop: 32 }} className="erv2-grid">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ aspectRatio: "1 / 1.1", background: TILE }} />)}
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: "clamp(72px, 9vw, 130px) 0 40px", textAlign: "center" }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(21px, 2vw, 27px)", color: T.text, marginBottom: 12 }}>Nothing matches those choices</div>
                  <p style={{ margin: "0 auto 10px", maxWidth: "40ch", fontSize: 15, lineHeight: 1.7, color: T.text }}>Remove a filter to see more, or ask us to make the piece you have in mind.</p>
                  <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px clamp(20px, 3vw, 40px)" }}>
                    <button type="button" onClick={clearAll} className="erv2-textlink" style={{ cursor: "pointer", background: "transparent", borderTop: 0, borderLeft: 0, borderRight: 0, fontFamily: FONT_BODY, color: T.text }}>Clear all filters</button>
                    <Link to="/bespoke-design" className="erv2-textlink" style={{ color: T.text }}>Start a commission</Link>
                  </div>
                </div>
              ) : split ? (
                <>
                  {ready.length > 0 && <>{groupHead("Ready to ship", "In our showroom now. Ships in 48 hours.")}{grid(ready)}</>}
                  {bespoke.length > 0 && <div id="bespoke">{groupHead("Bespoke bracelets", "Made to order in our own workshop, in your choice of gold and stones. Please allow up to 6 weeks.")}{grid(bespoke)}</div>}
                </>
              ) : (
                <>
                  {grid(results.slice(0, shown))}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: "clamp(40px, 4vw, 64px)" }}>
                    <span style={{ fontSize: 12.5, color: T.textMuted }}>Showing {Math.min(shown, results.length)} of {results.length} pieces</span>
                    <span aria-hidden="true" style={{ width: 160, height: 1, background: T.line, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, height: 1, background: T.text, width: `${Math.min(100, (shown / results.length) * 100)}%` }} />
                    </span>
                    {shown < results.length && (
                      <button type="button" className="erv2-more" onClick={() => setShown(n => n + PAGE_SIZE)}
                        style={{ marginTop: 10, padding: "15px 34px", cursor: "pointer", background: "transparent", border: `1px solid ${T.text}`, fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Show more {cat.label.toLowerCase()}</button>
                    )}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

        <FooterV2 />
      </div>

      {/* Phone filter sheet */}
      <div data-sheet="filter" style={{ position: "fixed", inset: 0, zIndex: 80, display: sheet ? "flex" : "none", flexDirection: "column", justifyContent: "flex-end" }}>
        <div data-sheetclose onClick={() => setSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(28,26,23,0.38)" }} />
        <div style={{ position: "relative", background: GROUND, maxHeight: "86vh", display: "flex", flexDirection: "column", animation: "erv2SheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 24px", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: T.text }}>Filter</span>
            <button type="button" data-sheetclose onClick={() => setSheet(false)} aria-label="Close" className="erv2-x">{XICON}</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 24px" }}>{filterGroupsJsx}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, padding: "14px 24px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.line}` }}>
            <button type="button" onClick={clearAll} style={{ padding: "16px 0", background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, textDecoration: "underline", textUnderlineOffset: 5, textDecorationColor: T.ruleStrong }}>Clear all</button>
            <button type="button" data-sheetclose onClick={() => setSheet(false)} style={{ padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Show {results.length} {results.length === 1 ? "piece" : "pieces"}</button>
          </div>
        </div>
      </div>

      {/* Phone sort sheet */}
      <div data-sheet="sort" style={{ position: "fixed", inset: 0, zIndex: 80, display: sortSheet ? "flex" : "none", flexDirection: "column", justifyContent: "flex-end" }}>
        <div data-sheetclose onClick={() => setSortSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(28,26,23,0.38)" }} />
        <div style={{ position: "relative", background: GROUND, animation: "erv2SheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 24px", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: T.text }}>Sort</span>
            <button type="button" data-sheetclose onClick={() => setSortSheet(false)} aria-label="Close" className="erv2-x">{XICON}</button>
          </div>
          <div style={{ padding: "4px 24px calc(18px + env(safe-area-inset-bottom))" }}>
            {sortOptions.map(o => (
              <button key={o.value} type="button" data-sheetclose onClick={() => { setSort(o.value); setSortSheet(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "17px 0", background: "none", border: 0, borderBottom: `1px solid ${T.line}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, color: sort === o.value ? T.text : T.textMuted }}>
                {o.label}{sort === o.value && <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5l4 4 8-8" stroke={T.gold} strokeWidth="1.25" /></svg>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JewelleryListingV2;
