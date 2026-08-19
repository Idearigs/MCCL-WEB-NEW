import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL, { getMediaUrl } from "../config/api";

/**
 * Combined jewellery page — /jewellery (design_handoff_mcculloch_jewellery_all, 11th package).
 * All three categories on one page. Category pills + a Category filter group, plus Metal /
 * Stone / Style (all 11 styles pooled — no category-specific 4th filter here). Conditional
 * grouping: on "Everything" + Featured sort the grid splits into three labelled sections;
 * any other sort/category flattens to one grid (with a category label per card). The tabbed
 * per-category pages (JewelleryListingV2) live below this at /earrings /necklaces /bracelets.
 * DATA: facets inferred from the product name (jewellery carries no structured tags yet).
 * NOT YET PUBLISHED — catalogue and photography still in progress.
 */

const NAV_H = 96;
const CATS = ["Earrings", "Necklaces", "Bracelets"] as const;
type CatName = typeof CATS[number];
const SLUG: Record<CatName, string> = { Earrings: "earrings", Necklaces: "necklaces", Bracelets: "bracelets" };
const NOTE: Record<CatName, string> = {
  Earrings: "Weight matters more than size.",
  Necklaces: "Measure the one you wear most.",
  Bracelets: "Two millimetres decides everything.",
};
const STYLES_BY_CAT: Record<CatName, string[]> = {
  Earrings: ["Studs", "Hoops", "Drops", "Climbers"],
  Necklaces: ["Pendant", "Chain", "Collar", "Station"],
  Bracelets: ["Tennis", "Bangle", "Chain", "Cuff"],
};
const STYLE_POOL = ["Studs", "Hoops", "Drops", "Climbers", "Pendant", "Chain", "Collar", "Station", "Tennis", "Bangle", "Cuff"];
const METALS = ["Platinum", "18ct White Gold", "18ct Yellow Gold", "18ct Rose Gold"];
const STONES = ["Diamond", "Sapphire", "Emerald", "None"];
const METAL_ALIASES: Record<string, string[]> = {
  "Platinum": ["platinum"], "18ct White Gold": ["white gold"], "18ct Yellow Gold": ["yellow gold"], "18ct Rose Gold": ["rose gold"],
};

const money = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");
const infer = (name: string, options: string[], aliases: Record<string, string[]> = {}): string[] => {
  const t = name.toLowerCase();
  return options.filter(o => {
    const base = o.toLowerCase().replace(/"/g, "");
    const singular = base.endsWith("s") ? base.slice(0, -1) : base;
    return [base, singular, ...(aliases[o] || [])].some(k => k && t.includes(k.toLowerCase()));
  });
};

type Key = "cat" | "availability" | "metal" | "stone" | "style";
type SelKey = "availability" | "metal" | "stone" | "style";
const LIVE = "Live stock — ready to ship";
const ORDER = "Made to order";
interface Product { id: string; name: string; slug: string; price: string; base_price: number; sale_price?: number; is_featured?: boolean; in_stock?: boolean; is_live_stock?: boolean; category: { slug: string }; image?: { url: string } | null; images?: { url: string; is_primary?: boolean }[]; }
interface Row { p: Product; cat: CatName; availability: string[]; metal: string[]; stone: string[]; style: string[]; price: number; hasImage: boolean; inStock: boolean; }

const JewelleryAllV2 = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<"Everything" | CatName>("Everything");
  const [sel, setSel] = useState<Record<SelKey, string[]>>({ availability: [], metal: [], stone: [], style: [] });
  const [maxPrice, setMaxPrice] = useState(4400);
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState<Record<Key, boolean>>({ cat: true, availability: true, metal: true, stone: false, style: false });
  const [saved, setSaved] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);

  useEffect(() => { document.body.style.background = T.paper; window.scrollTo(0, 0); }, []);
  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem("mcc_saved_jewellery") || "[]")); } catch { /* ignore */ } }, []);
  const toggleSave = (id: string) => setSaved(prev => { const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]; try { localStorage.setItem("mcc_saved_jewellery", JSON.stringify(next)); } catch { /* ignore */ } return next; });
  useEffect(() => { const lock = sheet || sortSheet; document.body.style.overflow = lock ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [sheet, sortSheet]);
  useEffect(() => { const c = searchParams.get("cat"); if (c && (CATS as readonly string[]).includes(c)) setCat(c as CatName); }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    Promise.all(CATS.map(c =>
      fetch(`${API_BASE_URL}/products?category=${SLUG[c]}&sort=sort_order&order=asc&limit=1000`)
        .then(r => r.json()).then(d => ({ c, list: (d.success ? d.data.products : []) as Product[] })).catch(() => ({ c, list: [] as Product[] }))
    )).then(results => {
      const rows: Row[] = [];
      results.forEach(({ c, list }) => list.forEach(p => {
        const name = p.name || "";
        const stone = infer(name, STONES.filter(x => x !== "None"));
        rows.push({
          p, cat: c, availability: [p.is_live_stock ? LIVE : ORDER], metal: infer(name, METALS, METAL_ALIASES), stone: stone.length ? stone : ["None"],
          style: infer(name, STYLES_BY_CAT[c]), price: p.sale_price || p.base_price || 0,
          hasImage: !!(p.image?.url || p.images?.[0]?.url), inStock: p.in_stock !== false,
        });
      }));
      setProducts(rows);
    }).finally(() => setLoading(false));
  }, []);

  const passes = (r: Row, skip?: Key) => {
    const okCat = skip === "cat" || cat === "Everything" || r.cat === cat;
    const okAvail = skip === "availability" || !sel.availability.length || sel.availability.some(v => r.availability.includes(v));
    const okMetal = skip === "metal" || !sel.metal.length || sel.metal.some(v => r.metal.includes(v));
    const okStone = skip === "stone" || !sel.stone.length || sel.stone.some(v => r.stone.includes(v));
    const okStyle = skip === "style" || !sel.style.length || sel.style.some(v => r.style.includes(v));
    return okCat && okAvail && okMetal && okStone && okStyle && r.price <= maxPrice;
  };

  const sortRows = (list: Row[]) => {
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "new") return [...list].reverse();
    return [...list].sort((a, b) => Number(b.hasImage) - Number(a.hasImage));
  };

  const filtered = useMemo(() => products.filter(r => passes(r)), [products, cat, sel, maxPrice]);
  const grouped = cat === "Everything" && sort === "featured";
  const sections = useMemo(() => {
    if (grouped) return CATS.map(c => ({ cat: c, items: sortRows(filtered.filter(r => r.cat === c)) })).filter(s => s.items.length);
    return [{ cat: null as CatName | null, items: sortRows(filtered) }];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, grouped, sort]);
  const total = filtered.length;

  const catCount = (c: CatName) => products.filter(r => r.cat === c && (() => { const okAvail = !sel.availability.length || sel.availability.some(v => r.availability.includes(v)); const okMetal = !sel.metal.length || sel.metal.some(v => r.metal.includes(v)); const okStone = !sel.stone.length || sel.stone.some(v => r.stone.includes(v)); const okStyle = !sel.style.length || sel.style.some(v => r.style.includes(v)); return okAvail && okMetal && okStone && okStyle && r.price <= maxPrice; })()).length;

  const toggle = (k: SelKey, v: string) => setSel(s => ({ ...s, [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v] }));
  const clearAll = () => { setCat("Everything"); setSel({ availability: [], metal: [], stone: [], style: [] }); setMaxPrice(4400); };
  const chips = [
    ...(cat !== "Everything" ? [{ k: "cat" as const, label: cat }] : []),
    ...(["availability", "metal", "stone", "style"] as const).flatMap(k => sel[k].map(v => ({ k, label: v }))),
  ];
  const activeCount = chips.length + (maxPrice < 4400 ? 1 : 0);
  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };
  const sortOptions = [{ value: "featured", label: "Featured" }, { value: "low", label: "Price, low to high" }, { value: "high", label: "Price, high to low" }, { value: "new", label: "Newest" }];
  const sortLabel = sortOptions.find(o => o.value === sort)?.label || "Featured";
  const priceLabel = maxPrice >= 4400 ? "Any" : "Up to " + money(maxPrice);
  const leadTime = (inStock: boolean) => inStock ? "Ships in 48 hours" : "Made to order, ~3 weeks";

  const railGroups: { key: Key; title: string; options: string[]; radio?: boolean }[] = [
    { key: "cat", title: "Category", options: [...CATS], radio: true },
    { key: "availability", title: "Availability", options: [LIVE, ORDER] },
    { key: "metal", title: "Metal", options: METALS },
    { key: "stone", title: "Stone", options: STONES },
    { key: "style", title: "Style", options: STYLE_POOL },
  ];

  const countFor = (g: Key, o: string) => {
    if (g === "cat") return catCount(o as CatName);
    return products.filter(r => passes(r, g) && (r[g as SelKey]).includes(o)).length;
  };

  const filterRail = (
    <>
      {railGroups.map(g => (
        <div key={g.key} style={{ borderBottom: `1px solid ${T.rule}` }}>
          <button onClick={() => setOpen(o => ({ ...o, [g.key]: !o[g.key] }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "17px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink }}>
            <span>{g.title}</span>
            <span style={{ fontSize: 14, color: "#8A8377" }}>{open[g.key] ? "−" : "+"}</span>
          </button>
          {open[g.key] && (
            <div style={{ display: "flex", flexDirection: "column", gap: 1, paddingBottom: 16 }}>
              {g.options.map(o => {
                const on = g.key === "cat" ? cat === o : sel[g.key as SelKey].includes(o);
                return (
                  <button key={o} onClick={() => g.key === "cat" ? setCat(cat === o ? "Everything" : (o as CatName)) : toggle(g.key as SelKey, o)} className="jl-opt"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 8px 9px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 13, color: on ? T.ink : T.body }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 16, height: 16, flex: "none", borderRadius: g.radio ? "50%" : 0, border: `1px solid ${on ? T.ink : T.ruleStrong}`, background: on ? T.ink : "transparent" }} />
                      {o}
                    </span>
                    <span style={{ fontSize: 11.5, color: "#8A8377" }}>{countFor(g.key, o)}</span>
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
    </>
  );

  const card = (r: Row) => {
    const img = r.p.image?.url || r.p.images?.find(i => i.is_primary)?.url || r.p.images?.[0]?.url;
    const on = saved.includes(r.p.id);
    return (
      <div key={r.p.id} className="jl-card">
        <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden" }}>
          <Link to={`/${SLUG[r.cat]}/${r.p.slug}`} style={{ position: "absolute", inset: 0, display: "block" }}>
            {img ? <img src={getMediaUrl(img)} alt={r.p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
              : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: "#8C8375", padding: 12, textAlign: "center" }}>{r.p.name}</div>}
          </Link>
          {r.p.is_featured && <span style={{ position: "absolute", top: 10, left: 10, padding: "5px 10px", background: "rgba(248,246,240,0.94)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.body }}>Most asked for</span>}
          {r.p.is_live_stock && <span style={{ position: "absolute", bottom: 10, left: 10, padding: "5px 10px", background: "rgba(248,246,240,0.94)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.body }}>Ready to ship</span>}
          <button type="button" onClick={() => toggleSave(r.p.id)} aria-pressed={on} aria-label={`Save ${r.p.name}`} style={{ position: "absolute", top: 8, right: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(248,246,240,0.92)", border: 0, fontSize: 15, lineHeight: 1, color: on ? T.gold : "#8A8377" }}>{on ? "♥" : "♡"}</button>
        </div>
        <Link to={`/${SLUG[r.cat]}/${r.p.slug}`} style={{ display: "block" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 16, fontSize: 14.5 }}>
            <span>{r.p.name}</span><span style={{ color: "#56534D" }}>{r.p.price}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
            <span style={{ fontSize: 11.5, color: r.inStock ? "#4A7A52" : T.muted }}>{leadTime(r.inStock)}</span>
            {!grouped && <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A9A196" }}>{r.cat}</span>}
          </div>
        </Link>
      </div>
    );
  };

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        .jl a { color: inherit; text-decoration: none; }
        .jl-opt:hover { color: ${T.ink} !important; }
        .jl-chip:hover { border-color: ${T.ink} !important; }
        .jl-card img { transition: transform 0.5s ease; }
        .jl-card:hover img { transform: scale(1.04); }
        .jl-pill:hover { border-color: ${T.ink} !important; }
        .jl-range { -webkit-appearance:none; appearance:none; width:100%; height:1px; background:${T.ruleStrong}; outline:none; }
        .jl-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:15px; height:15px; border-radius:50%; background:${T.gold}; cursor:pointer; }
        .jl-range::-moz-range-thumb { width:15px; height:15px; border:0; border-radius:50%; background:${T.gold}; cursor:pointer; }
      `}</style>

      <NavigationV2 solid />

      <div className="jl" style={{ paddingTop: NAV_H }}>
        <div style={{ display: "flex", gap: 10, padding: "18px clamp(24px, 3vw, 52px)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8377" }}>
          <Link to="/">Home</Link><span>/</span><span style={{ color: T.ink }}>Jewellery</span>
        </div>

        <section style={{ padding: "clamp(20px,3vw,40px) clamp(24px,3vw,52px) clamp(28px,3vw,40px)", borderBottom: `1px solid ${T.rule}` }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(44px, 5.2vw, 84px)", lineHeight: 1, letterSpacing: "0.005em", margin: "0 0 20px" }}>Jewellery</h1>
          <p style={{ margin: 0, maxWidth: "48ch", fontSize: 15, lineHeight: 1.75, color: T.body }}>Earrings, necklaces and bracelets — made to order on our own bench. Browse everything together, or narrow to a category on the left.</p>
        </section>

        {/* Category pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "18px clamp(24px, 3vw, 52px)", borderBottom: `1px solid ${T.rule}` }} className="jl-pills">
          {(["Everything", ...CATS] as const).map(c => {
            const on = cat === c;
            const n = c === "Everything" ? CATS.reduce((s, cc) => s + catCount(cc), 0) : catCount(c as CatName);
            return (
              <button key={c} onClick={() => setCat(c)} className="jl-pill" style={{ display: "flex", alignItems: "baseline", gap: 7, padding: "9px 16px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, letterSpacing: "0.04em", color: on ? T.paper : T.ink, background: on ? T.ink : "transparent", border: `1px solid ${on ? T.ink : T.ruleSoft}`, transition: "color 0.2s, background 0.2s, border-color 0.2s" }}>
                {c}<span style={{ fontSize: 11, color: on ? "rgba(248,246,240,0.7)" : "#8A8377" }}>{n}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile trigger bar */}
        <div className="jl-triggerbar" style={{ position: "sticky", top: 78, zIndex: 40, gridTemplateColumns: "1fr 1fr", gap: 1, background: T.rule, borderBottom: `1px solid ${T.rule}` }}>
          <button onClick={() => setSheet(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", background: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>
            Filter{activeCount > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: T.gold, color: "#fff", fontSize: 10.5, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{activeCount}</span>}
          </button>
          <button onClick={() => setSortSheet(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 0", background: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>Sort<span style={{ fontSize: 10, color: "#8A8377", textTransform: "none", letterSpacing: 0 }}>· {sortLabel}</span></button>
        </div>

        <main style={{ display: "grid", gridTemplateColumns: "236px minmax(0, 1fr)", gap: "clamp(28px, 3vw, 56px)", padding: "clamp(28px,3vw,44px) clamp(24px,3vw,52px) clamp(56px,5vw,88px)", alignItems: "start" }} className="jl-main">
          <aside style={{ position: "sticky", top: NAV_H + 12 }} className="jl-aside">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingBottom: 14, borderBottom: `1px solid ${T.ink}` }}>
              <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" }}>Filter</span>
              <button className="jl-opt" onClick={clearAll} style={{ padding: 0, cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 11, color: "#8A8377" }}>Clear all</button>
            </div>
            {filterRail}
          </aside>

          <div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, color: T.muted }}>{loading ? "Loading…" : `${total} ${total === 1 ? "piece" : "pieces"}`}</span>
                {chips.map((c, i) => (
                  <button key={i} onClick={() => c.k === "cat" ? setCat("Everything") : toggle(c.k as "metal" | "stone" | "style", c.label)} className="jl-chip" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 11px", cursor: "pointer", background: T.tint, border: `1px solid ${T.ruleSoft}`, fontFamily: FONT_BODY, fontSize: 11.5, color: T.ink }}>{c.label}<span style={{ color: "#8A8377" }}>×</span></button>
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
            ) : total === 0 ? (
              <div style={{ padding: "72px 0", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, marginBottom: 14 }}>Nothing matches those filters</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
                  <button onClick={clearAll} style={{ padding: "13px 26px", cursor: "pointer", background: T.ink, color: T.paper, border: 0, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Clear filters</button>
                  <Link to="/bespoke-design" style={{ padding: "13px 26px", border: `1px solid ${T.ruleStrong}`, color: T.ink, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Commission it instead</Link>
                </div>
              </div>
            ) : (
              sections.map((sec, si) => (
                <div key={si} style={{ marginTop: si === 0 ? 32 : 52 }}>
                  {sec.cat && (
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, paddingBottom: 16, borderBottom: `1px solid ${T.rule}`, marginBottom: 28 }}>
                      <div>
                        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(24px,2.6vw,36px)", lineHeight: 1.05, margin: "0 0 6px" }}>{sec.cat} <span style={{ fontSize: 15, color: T.muted }}>{sec.items.length}</span></h2>
                        <span style={{ fontSize: 13, color: T.muted }}>{NOTE[sec.cat]}</span>
                      </div>
                      <Link to={`/${SLUG[sec.cat]}`} className="cv2-textlink" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink, borderBottom: `1px solid ${T.ruleStrong}`, paddingBottom: 3, whiteSpace: "nowrap" }}>All {sec.cat}</Link>
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(18px,2vw,32px)" }} className="jl-grid">
                    {sec.items.map(card)}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Advice band — one band, three columns */}
        <section style={{ background: T.ink, color: T.onDarkSoft, padding: "clamp(56px,6vw,96px) clamp(24px,3vw,52px)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div style={{ ...eyebrow, marginBottom: 20 }}>Before you ask</div>
            <div className="jl-advice" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: `1px solid ${T.ruleDark}` }}>
              {([
                ["Earrings", "Earrings are the piece people get wrong.", "Weight matters more than size — a heavy drop on a fine post drags over an evening. Platinum for sensitive ears; hoops above 25mm made hollow.", "/earrings"],
                ["Necklaces", "Measure the one you wear most.", "Lay a necklace you own flat and measure end to end including the clasp. Where a piece sits on you is personal — an inch changes the whole look.", "/necklaces"],
                ["Bracelets", "Two millimetres decides everything.", "Measure at the wrist bone; add a centimetre for a chain, two for a bangle that must pass the hand. A fraction out and it spins or never leaves the shelf.", "/bracelets"],
              ] as const).map(([label, head, body, to], i) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", padding: "28px 26px 30px", borderLeft: i ? `1px solid ${T.ruleDark}` : undefined }}>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.gold, marginBottom: 14 }}>{label}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(20px,1.9vw,26px)", lineHeight: 1.15, color: "#FFFFFF", marginBottom: 14 }}>{head}</div>
                  <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.7, color: T.onDarkBody }}>{body}</p>
                  <Link to={to} style={{ marginTop: "auto", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFFFFF", borderBottom: `1px solid ${T.ruleDarkStrong}`, paddingBottom: 3, alignSelf: "flex-start" }}>Shop {label.toLowerCase()}</Link>
                </div>
              ))}
            </div>
          </div>
        </section>

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
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 20px" }}>{filterRail}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, padding: "14px 20px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.rule}` }}>
              <button onClick={clearAll} style={{ padding: "15px 0", background: "transparent", border: `1px solid ${T.ruleStrong}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>Clear</button>
              <button onClick={() => setSheet(false)} style={{ padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Show {total} {total === 1 ? "piece" : "pieces"}</button>
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
                <button key={o.value} onClick={() => { setSort(o.value); setSortSheet(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "16px 0", background: "none", border: 0, borderBottom: `1px solid ${T.rule}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, color: sort === o.value ? T.ink : T.body }}>{o.label}{sort === o.value && <span style={{ color: T.gold }}>✓</span>}</button>
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
          .jl-advice{ grid-template-columns: 1fr !important; }
          .jl-advice > div{ border-left: 0 !important; border-bottom: 1px solid ${T.ruleDark}; }
          .jl-range::-webkit-slider-thumb{ width:22px !important; height:22px !important; }
          .jl-range::-moz-range-thumb{ width:22px !important; height:22px !important; }
        }
      `}</style>
    </div>
  );
};

export default JewelleryAllV2;
