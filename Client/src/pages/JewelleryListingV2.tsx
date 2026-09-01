import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL, { getMediaUrl } from "../config/api";

/**
 * Jewellery listing — v2, one template for Earrings / Necklaces / Bracelets
 * (design_handoff_mcculloch_jewellery, 9th package). Category tab bar, a filter rail
 * whose 4th group changes per category (Fastening / Length / Fit), a 3-up grid with a
 * save heart and lead time, and a per-category "Before you ask" advice band.
 *
 * DATA: fetches ?category=<cat>. Real jewellery products currently carry no structured
 * facet tags, so Style / Metal / Stone / detail are inferred from the product name
 * (like the watch listing). Filters improve automatically once real tags are added.
 * NOT YET PUBLISHED — photography and catalogue are still in progress.
 */

const NAV_H = 96;

type Key = "availability" | "style" | "metal" | "stone" | "detail";
const AVAIL_LIVE = "Live stock — ready to ship";
const AVAIL_ORDER = "Made to order";
interface CatDef {
  slug: string; label: string; standfirst: string;
  styles: string[]; detailTitle: string; detailOptions: string[];
  band: { headline: string; body: string; guide: { k: string; title: string; meta: string; note: string }[] };
}

const METALS = ["Platinum", "18ct White Gold", "18ct Yellow Gold", "18ct Rose Gold"];
const STONES = ["Diamond", "Sapphire", "Emerald", "None"];

const CATS: Record<string, CatDef> = {
  earrings: {
    slug: "earrings", label: "Earrings",
    standfirst: "Studs, hoops and drops made to order on our own bench — balanced for the weight of an evening, not just the look in the box.",
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
    standfirst: "Pendants and chains cut to the length you actually wear, hung on chains made to carry them without kinking.",
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
  bracelets: {
    slug: "bracelets", label: "Bracelets",
    standfirst: "Tennis lines, bangles and chains sized to your wrist, so the clasp stays where it should and the piece stays on.",
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
const ORDER = ["earrings", "necklaces", "bracelets"];

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

  const [sel, setSel] = useState<Record<Key, string[]>>({ availability: [], style: [], metal: [], stone: [], detail: [] });
  const [maxPrice, setMaxPrice] = useState(4400);
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState<Record<Key, boolean>>({ availability: true, style: true, metal: true, stone: false, detail: false });
  const [saved, setSaved] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);

  // Reset filters/sort when the category changes (filters don't carry across)
  useEffect(() => {
    setSel({ availability: [], style: [], metal: [], stone: [], detail: [] });
    setMaxPrice(4400); setSort("featured");
    setOpen({ availability: true, style: true, metal: true, stone: false, detail: false });
    window.scrollTo(0, 0);
  }, [category]);

  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem("mcc_saved_jewellery") || "[]")); } catch { /* ignore */ } }, []);
  const toggleSave = (id: string) => setSaved(prev => { const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]; try { localStorage.setItem("mcc_saved_jewellery", JSON.stringify(next)); } catch { /* ignore */ } return next; });

  useEffect(() => {
    const lock = sheet || sortSheet; document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheet, sortSheet]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/products?category=${cat.slug}&sort=sort_order&order=asc&limit=1000`)
      .then(r => r.json())
      .then(d => { if (d.success) setProducts(d.data.products || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cat.slug]);

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
      inStock: p.in_stock !== false,
    };
  }), [products, cat]);

  const passes = (r: typeof rows[number], skip?: Key) => {
    const ok = (k: Key, field: string[]) => skip === k || !sel[k].length || sel[k].some(v => field.includes(v));
    return ok("availability", r.availability) && ok("style", r.style) && ok("metal", r.metal) && ok("stone", r.stone) && ok("detail", r.detail) && r.price <= maxPrice;
  };
  const fieldFor = (r: typeof rows[number], k: Key) => r[k];

  const results = useMemo(() => {
    let list = rows.filter(r => passes(r));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "new") list = [...list].reverse();
    else list = [...list].sort((a, b) => Number(b.hasImage) - Number(a.hasImage));
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sel, maxPrice, sort]);

  const toggle = (k: Key, v: string) => setSel(s => ({ ...s, [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v] }));
  const clearAll = () => { setSel({ availability: [], style: [], metal: [], stone: [], detail: [] }); setMaxPrice(4400); };
  const chips = groups.flatMap(g => sel[g.key].map(v => ({ key: g.key, label: v })));
  const activeCount = chips.length + (maxPrice < 4400 ? 1 : 0);
  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };
  const sortOptions = [{ value: "featured", label: "Featured" }, { value: "low", label: "Price, low to high" }, { value: "high", label: "Price, high to low" }, { value: "new", label: "Newest" }];
  const sortLabel = sortOptions.find(o => o.value === sort)?.label || "Featured";
  const priceLabel = maxPrice >= 4400 ? "Any" : "Up to " + money(maxPrice);
  const leadTime = (inStock: boolean) => inStock ? "Ships in 48 hours" : "Made to order, ~3 weeks";

  const filterGroupsJsx = (
    <>
      {groups.map(g => (
        <div key={g.key} style={{ borderBottom: `1px solid ${T.rule}` }}>
          <button onClick={() => setOpen(o => ({ ...o, [g.key]: !o[g.key] }))}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "17px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink }}>
            <span>{g.title}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              {sel[g.key].length > 0 && <span style={{ fontSize: 11, color: T.gold }}>{sel[g.key].length}</span>}
              <span style={{ fontSize: 14, color: "#8A8377" }}>{open[g.key] ? "−" : "+"}</span>
            </span>
          </button>
          {open[g.key] && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingBottom: 16 }}>
              {g.options.map(o => {
                const on = sel[g.key].includes(o);
                const n = rows.filter(r => passes(r, g.key) && fieldFor(r, g.key).includes(o)).length;
                return (
                  <button key={o} onClick={() => toggle(g.key, o)} className="jl-opt"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 8px 9px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 13, color: on ? T.ink : T.body }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 16, height: 16, flex: "none", border: `1px solid ${on ? T.ink : T.ruleStrong}`, background: on ? T.ink : "transparent" }} />
                      {o}
                    </span>
                    <span style={{ fontSize: 11.5, color: "#8A8377" }}>{n}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <div style={{ padding: "20px 0 8px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase" }}>Price</span>
          <span style={{ fontSize: 12.5, color: T.muted }}>{priceLabel}</span>
        </div>
        <input type="range" min={200} max={4400} step={100} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="jl-range" aria-valuetext={priceLabel} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8A8377", marginTop: 8 }}><span>£200</span><span>£4,400+</span></div>
      </div>
      {/* Commission card inside the rail */}
      <div style={{ marginTop: 22, padding: "20px", background: T.tint }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, marginBottom: 8 }}>Not quite it?</div>
        <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.6, color: T.body }}>If nothing here is right, we make {cat.label.toLowerCase()} to order on our own bench.</p>
        <Link to="/bespoke-design" style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink, borderBottom: `1px solid ${T.ruleStrong}`, paddingBottom: 2 }}>Commission it</Link>
      </div>
    </>
  );

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        .jl a { color: inherit; text-decoration: none; }
        .jl-opt:hover { color: ${T.ink} !important; }
        .jl-chip:hover { border-color: ${T.ink} !important; }
        .jl-card img { transition: transform 0.5s ease; }
        .jl-card:hover img { transform: scale(1.04); }
        .jl-range { -webkit-appearance:none; appearance:none; width:100%; height:1px; background:${T.ruleStrong}; outline:none; }
        .jl-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:15px; height:15px; border-radius:50%; background:${T.gold}; cursor:pointer; }
        .jl-range::-moz-range-thumb { width:15px; height:15px; border:0; border-radius:50%; background:${T.gold}; cursor:pointer; }
        @keyframes jlIn { from { opacity:0; transform: translateY(10px);} to {opacity:1; transform:none;} }
        @media (prefers-reduced-motion: reduce){ .jl-body { animation: none !important; } }
      `}</style>

      <NavigationV2 solid />

      <div className="jl" style={{ paddingTop: NAV_H }}>
        {/* Category tab bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 clamp(24px, 3vw, 52px)", background: T.tint, borderBottom: `1px solid ${T.rule}`, overflowX: "auto" }}>
          {ORDER.map(k => {
            const on = k === cat.slug;
            return (
              <Link key={k} to={`/${k}`} style={{ padding: "15px clamp(14px, 2vw, 26px)", borderBottom: `2px solid ${on ? T.ink : "transparent"}`, fontSize: 12.5, letterSpacing: "0.1em", textTransform: "uppercase", color: on ? T.ink : T.muted, whiteSpace: "nowrap" }}>
                {CATS[k].label}
              </Link>
            );
          })}
        </div>

        <div key={category} className="jl-body" style={{ animation: "jlIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div style={{ display: "flex", gap: 10, padding: "18px clamp(24px, 3vw, 52px)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8377" }}>
            <Link to="/">Home</Link><span>/</span><Link to="/jewellery">Jewellery</Link><span>/</span><span style={{ color: T.ink }}>{cat.label}</span>
          </div>

          <section style={{ padding: "clamp(20px,3vw,40px) clamp(24px,3vw,52px) clamp(36px,4vw,56px)", borderBottom: `1px solid ${T.rule}` }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(44px, 5.2vw, 84px)", lineHeight: 1, letterSpacing: "0.005em", margin: "0 0 20px" }}>{cat.label}</h1>
            <p style={{ margin: 0, maxWidth: "48ch", fontSize: 15, lineHeight: 1.75, color: T.body }}>{cat.standfirst}</p>
          </section>

          {/* Mobile trigger bar */}
          <div className="jl-triggerbar" style={{ position: "sticky", top: 78, zIndex: 40, gridTemplateColumns: "1fr 1fr", gap: 1, background: T.rule, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
            <button onClick={() => setSheet(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", background: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>
              Filter{activeCount > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: T.gold, color: "#fff", fontSize: 10.5, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{activeCount}</span>}
            </button>
            <button onClick={() => setSortSheet(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 0", background: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>
              Sort<span style={{ fontSize: 10, color: "#8A8377", textTransform: "none", letterSpacing: 0 }}>· {sortLabel}</span>
            </button>
          </div>

          <main style={{ display: "grid", gridTemplateColumns: "236px minmax(0, 1fr)", gap: "clamp(28px, 3vw, 56px)", padding: "clamp(28px,3vw,44px) clamp(24px,3vw,52px) clamp(56px,5vw,88px)", alignItems: "start" }} className="jl-main">
            <aside style={{ position: "sticky", top: NAV_H + 12 }} className="jl-aside">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingBottom: 14, borderBottom: `1px solid ${T.ink}` }}>
                <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" }}>Filter</span>
                <button className="jl-opt" onClick={clearAll} style={{ padding: 0, cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 11, color: "#8A8377" }}>Clear all</button>
              </div>
              {filterGroupsJsx}
            </aside>

            <div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12.5, color: T.muted }}>{loading ? "Loading…" : `${results.length} ${results.length === 1 ? "piece" : "pieces"}`}</span>
                  {chips.map((c, i) => (
                    <button key={i} onClick={() => toggle(c.key, c.label)} className="jl-chip" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 11px", cursor: "pointer", background: T.tint, border: `1px solid ${T.ruleSoft}`, fontFamily: FONT_BODY, fontSize: 11.5, color: T.ink }}>
                      {c.label}<span style={{ color: "#8A8377" }}>×</span>
                    </button>
                  ))}
                </div>
                <div className="jl-sortdesktop" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8377" }}>Sort</span>
                  <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "9px 12px", fontFamily: FONT_BODY, fontSize: 13, color: T.ink, background: T.paper, border: `1px solid ${T.ruleStrong}`, borderRadius: 0, cursor: "pointer" }}>
                    {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(18px,2vw,32px)", marginTop: 32 }}>
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ aspectRatio: "4 / 5", background: T.tint }} />)}
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: "72px 0", textAlign: "center" }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, marginBottom: 14 }}>Nothing matches those filters</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                    <button onClick={clearAll} style={{ padding: "13px 26px", cursor: "pointer", background: T.ink, color: T.paper, border: 0, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Clear filters</button>
                    <Link to="/bespoke-design" style={{ padding: "13px 26px", border: `1px solid ${T.ruleStrong}`, color: T.ink, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Commission it instead</Link>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(18px,2vw,32px)", marginTop: 32 }} className="jl-grid">
                  {results.map(({ p, inStock }) => {
                    const img = p.image?.url || p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url;
                    const on = saved.includes(p.id);
                    return (
                      <div key={p.id} className="jl-card">
                        <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden" }}>
                          <Link to={`/${cat.slug}/${p.slug}`} style={{ position: "absolute", inset: 0, display: "block" }}>
                            {img
                              ? <img src={getMediaUrl(img)} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                              : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: "#8C8375", padding: 12, textAlign: "center" }}>{p.name}</div>}
                          </Link>
                          {p.is_featured && <span style={{ position: "absolute", top: 10, left: 10, padding: "5px 10px", background: "rgba(248,246,240,0.94)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.body }}>Most asked for</span>}
                          {p.is_live_stock && <span style={{ position: "absolute", bottom: 10, left: 10, padding: "5px 10px", background: "rgba(248,246,240,0.94)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.body }}>Ready to ship</span>}
                          <button type="button" onClick={() => toggleSave(p.id)} aria-pressed={on} aria-label={`Save ${p.name}`} style={{ position: "absolute", top: 8, right: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(248,246,240,0.92)", border: 0, fontSize: 15, lineHeight: 1, color: on ? T.gold : "#8A8377" }}>{on ? "♥" : "♡"}</button>
                        </div>
                        <Link to={`/${cat.slug}/${p.slug}`} style={{ display: "block" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 16, fontSize: 14.5 }}>
                            <span>{p.name}</span><span style={{ color: "#56534D" }}>{p.price}</span>
                          </div>
                          <div style={{ fontSize: 11.5, color: inStock ? "#4A7A52" : T.muted, marginTop: 6 }}>{leadTime(inStock)}</div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* "Before you ask" band */}
          <section style={{ background: T.ink, color: T.onDarkSoft, padding: "clamp(56px,6vw,96px) clamp(24px,3vw,52px)" }}>
            <div style={{ maxWidth: 1180, margin: "0 auto" }}>
              <div style={{ maxWidth: "52ch", marginBottom: 44 }}>
                <div style={{ ...eyebrow, marginBottom: 20 }}>Before you ask</div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(28px,3.2vw,46px)", lineHeight: 1.1, margin: "0 0 20px", color: "#FFFFFF" }}>{cat.band.headline}</h2>
                <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.8, color: T.onDarkBody }}>{cat.band.body}</p>
              </div>
              <div className="jl-guide" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: `1px solid ${T.ruleDark}` }}>
                {cat.band.guide.map((g, i) => (
                  <div key={g.k} className="jl-guide-cell" style={{ display: "flex", flexDirection: "column", padding: "24px 22px 26px", borderLeft: i ? `1px solid ${T.ruleDark}` : undefined }}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: "#FFFFFF", marginBottom: 8 }}>{g.title}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, color: T.onDarkMuted, marginBottom: 16 }}>{g.note}</div>
                    <div style={{ marginTop: "auto", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold }}>{g.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <FooterV2 />
      </div>

      {/* Mobile filter sheet */}
      {sheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.45)" }} />
          <div style={{ position: "relative", background: T.paper, maxHeight: "86vh", display: "flex", flexDirection: "column", animation: "jlSheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${T.rule}` }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20 }}>Filter</span>
              <button onClick={() => setSheet(false)} aria-label="Close" style={{ background: "none", border: 0, cursor: "pointer", fontSize: 24, lineHeight: 1, color: T.ink }}>×</button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 20px" }}>{filterGroupsJsx}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, padding: "14px 20px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.rule}` }}>
              <button onClick={clearAll} style={{ padding: "15px 0", background: "transparent", border: `1px solid ${T.ruleStrong}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>Clear</button>
              <button onClick={() => setSheet(false)} style={{ padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Show {results.length} {results.length === 1 ? "piece" : "pieces"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sort sheet */}
      {sortSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setSortSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.45)" }} />
          <div style={{ position: "relative", background: T.paper, animation: "jlSheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${T.rule}` }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20 }}>Sort</span>
              <button onClick={() => setSortSheet(false)} aria-label="Close" style={{ background: "none", border: 0, cursor: "pointer", fontSize: 24, lineHeight: 1, color: T.ink }}>×</button>
            </div>
            <div style={{ padding: "4px 20px calc(14px + env(safe-area-inset-bottom))" }}>
              {sortOptions.map(o => (
                <button key={o.value} onClick={() => { setSort(o.value); setSortSheet(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "16px 0", background: "none", border: 0, borderBottom: `1px solid ${T.rule}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, color: sort === o.value ? T.ink : T.body }}>
                  {o.label}{sort === o.value && <span style={{ color: T.gold }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .jl-triggerbar { display: none; }
        @keyframes jlSheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (max-width: 900px){
          .jl-main{ grid-template-columns: 1fr !important; }
          .jl-aside{ display: none !important; }
          .jl-grid{ grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
          .jl-triggerbar{ display: grid !important; }
          .jl-sortdesktop{ display: none !important; }
          .jl-guide{ grid-template-columns: 1fr !important; }
          .jl-guide-cell{ border-left: 0 !important; border-bottom: 1px solid ${T.ruleDark}; }
          .jl-range::-webkit-slider-thumb{ width:22px !important; height:22px !important; }
          .jl-range::-moz-range-thumb{ width:22px !important; height:22px !important; }
        }
      `}</style>
    </div>
  );
};

export default JewelleryListingV2;
