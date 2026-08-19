import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL, { getMediaUrl } from "../config/api";

/**
 * All rings listing — v2, adapted from EngagementRingsV2. Combines every ring the
 * shop holds — engagement, wedding and in-stock/loose ("rings" category) — into one
 * faceted listing. Fetches ?category=rings (the parent set = rings + engagement-rings,
 * and wedding-rings once activated). Adds a Category facet on top of the shared
 * style/gem/metal/collection filters so the two ranges can still be narrowed.
 * Each card links to its own category's product page (/engagement-rings/:slug, etc.).
 */

const NAV_H = 96;

interface Ref { id: string; name: string; slug: string }
interface Product {
  id: string; name: string; slug: string; price: string; base_price: number; sale_price?: number;
  is_featured?: boolean;
  is_live_stock?: boolean;
  category: { slug: string; name?: string };
  collection?: { name: string } | null;
  ringTypes?: Ref[]; gemstones?: Ref[];
  primary_metal?: { name: string } | null;
  available_metals?: { id: string; name: string }[];
  image?: { url: string; alt: string } | null;
  images?: { url: string; alt: string; is_primary?: boolean }[];
}

type GroupKey = "availability" | "category" | "style" | "gem" | "metal" | "collection";
const GROUP_DEFS: { key: GroupKey; title: string }[] = [
  { key: "availability", title: "Availability" },
  { key: "category", title: "Category" },
  { key: "style", title: "Ring styles" },
  { key: "gem", title: "Gemstones" },
  { key: "metal", title: "Metals" },
  { key: "collection", title: "Collection" },
];
const LIVE = "Live stock — ready to ship";
const ORDER = "Made to order";

const money = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");

const RingsV2 = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [opts, setOpts] = useState<Record<GroupKey, string[]>>({ availability: [LIVE, ORDER], category: [], style: [], gem: [], metal: [], collection: [] });

  const [sel, setSel] = useState<Record<GroupKey, string[]>>({ availability: [], category: [], style: [], gem: [], metal: [], collection: [] });
  const [maxPrice, setMaxPrice] = useState(12000);
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState<Record<GroupKey, boolean>>({ availability: true, category: true, style: true, gem: false, metal: false, collection: false });
  const [sheet, setSheet] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);

  useEffect(() => {
    const lock = sheet || sortSheet;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheet, sortSheet]);

  useEffect(() => {
    const seed: Partial<Record<GroupKey, string[]>> = {};
    const rt = searchParams.get("ringType"); if (rt) seed.style = [rt];
    const gm = searchParams.get("gemstone"); if (gm) seed.gem = [gm];
    const mt = searchParams.get("metal"); if (mt) seed.metal = [mt];
    const co = searchParams.get("collection"); if (co) seed.collection = [co];
    const av = searchParams.get("availability"); if (av === "live") seed.availability = [LIVE];
    if (Object.keys(seed).length) setSel(s => ({ ...s, ...seed }));
  }, [searchParams]);

  // Shared reference facets (global)
  useEffect(() => {
    const grab = (path: string) => fetch(`${API_BASE_URL}/${path}`).then(r => r.json()).then(d => Array.isArray(d) ? d : []).catch(() => []);
    Promise.all([grab("filters/ring-types"), grab("filters/gemstones"), grab("filters/metals"), grab("filters/collections")])
      .then(([styles, gems, metals, collections]: Ref[][]) => {
        setOpts(o => ({
          ...o,
          style: styles.map(x => x.name),
          gem: gems.map(x => x.name),
          metal: metals.filter(x => !x.name.startsWith("_TEST")).map(x => x.name),
          collection: collections.map(x => x.name),
        }));
      });
  }, []);

  // Combined ring catalogue (rings + engagement-rings + wedding-rings when active)
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/products?category=rings&sort=sort_order&order=asc&limit=1000`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const list: Product[] = d.data.products || [];
          setProducts(list);
          // Category facet derived from the products actually present
          const cats = Array.from(new Set(list.map(p => p.category?.name).filter(Boolean) as string[]));
          setOpts(o => ({ ...o, category: cats }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => products.map(p => ({
    p,
    availability: p.is_live_stock ? LIVE : ORDER,
    category: p.category?.name || "",
    styles: (p.ringTypes || []).map(r => r.name),
    gems: (p.gemstones || []).map(g => g.name),
    metals: (p.available_metals || []).map(m => m.name).concat(p.primary_metal?.name ? [p.primary_metal.name] : []),
    collection: p.collection?.name || "",
    price: p.sale_price || p.base_price || 0,
    hasImage: !!(p.image?.url || p.images?.[0]?.url),
  })), [products]);

  const matches = (r: typeof rows[number], ignore?: GroupKey) => {
    const okAvail = ignore === "availability" || !sel.availability.length || sel.availability.includes(r.availability);
    const okCat = ignore === "category" || !sel.category.length || sel.category.includes(r.category);
    const okStyle = ignore === "style" || !sel.style.length || sel.style.some(v => r.styles.includes(v));
    const okGem = ignore === "gem" || !sel.gem.length || sel.gem.some(v => r.gems.includes(v));
    const okMetal = ignore === "metal" || !sel.metal.length || sel.metal.some(v => r.metals.includes(v));
    const okCol = ignore === "collection" || !sel.collection.length || sel.collection.includes(r.collection);
    const okPrice = r.price <= maxPrice;
    return okAvail && okCat && okStyle && okGem && okMetal && okCol && okPrice;
  };

  const fieldFor = (r: typeof rows[number], key: GroupKey): string[] =>
    key === "availability" ? [r.availability] : key === "category" ? [r.category] : key === "style" ? r.styles : key === "gem" ? r.gems : key === "metal" ? r.metals : [r.collection];

  const results = useMemo(() => {
    let list = rows.filter(r => matches(r));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "new") list = [...list].reverse();
    else list = [...list].sort((a, b) => Number(b.hasImage) - Number(a.hasImage));
    return list;
  }, [rows, sel, maxPrice, sort]);

  const toggle = (key: GroupKey, val: string) =>
    setSel(s => ({ ...s, [key]: s[key].includes(val) ? s[key].filter(v => v !== val) : [...s[key], val] }));
  const clearAll = () => { setSel({ availability: [], category: [], style: [], gem: [], metal: [], collection: [] }); setMaxPrice(12000); };

  const chips = GROUP_DEFS.flatMap(g => sel[g.key].map(v => ({ key: g.key, label: v })));
  const priceLabel = maxPrice >= 12000 ? "Any" : "Up to " + money(maxPrice);
  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };
  const activeCount = chips.length + (maxPrice < 12000 ? 1 : 0);
  const sortOptions: { value: string; label: string }[] = [
    { value: "featured", label: "Featured" },
    { value: "low", label: "Price, low to high" },
    { value: "high", label: "Price, high to low" },
    { value: "new", label: "Newest" },
  ];
  const sortLabel = sortOptions.find(o => o.value === sort)?.label || "Featured";
  const linkFor = (p: Product) => `/${p.category?.slug || "rings"}/${p.slug}`;

  const filterGroupsJsx = (
    <>
      {GROUP_DEFS.map(g => (
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
              {opts[g.key].map(o => {
                const on = sel[g.key].includes(o);
                const n = rows.filter(r => matches(r, g.key) && fieldFor(r, g.key).includes(o)).length;
                return (
                  <button key={o} onClick={() => toggle(g.key, o)} className="rv2-opt"
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "9px 8px 9px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 13, color: on ? T.ink : T.body }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 16, height: 16, flex: "none", border: `1px solid ${on ? T.ink : T.ruleStrong}`, background: on ? T.ink : "transparent" }} />
                      {o}
                    </span>
                    <span style={{ fontSize: 11.5, color: "#8A8377" }}>{n}</span>
                  </button>
                );
              })}
              {opts[g.key].length === 0 && <span style={{ fontSize: 12, color: "#8A8377" }}>—</span>}
            </div>
          )}
        </div>
      ))}
      <div style={{ padding: "20px 0 8px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase" }}>Price</span>
          <span style={{ fontSize: 12.5, color: T.muted }}>{priceLabel}</span>
        </div>
        <input type="range" min={300} max={12000} step={100} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="rv2-range" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8A8377", marginTop: 8 }}><span>£300</span><span>£12,000+</span></div>
      </div>
    </>
  );

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        .rv2 a { color: inherit; text-decoration: none; }
        .rv2-opt:hover { color: ${T.ink} !important; }
        .rv2-chip:hover { border-color: ${T.ink} !important; }
        .rv2-card img { transition: transform 0.5s ease; }
        .rv2-card:hover img { transform: scale(1.04); }
        .rv2-clear:hover { color: ${T.ink} !important; }
        .rv2-range { -webkit-appearance:none; appearance:none; width:100%; height:1px; background:${T.ruleStrong}; outline:none; }
        .rv2-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:15px; height:15px; border-radius:50%; background:${T.gold}; cursor:pointer; }
        .rv2-range::-moz-range-thumb { width:15px; height:15px; border:0; border-radius:50%; background:${T.gold}; cursor:pointer; }
      `}</style>

      <NavigationV2 solid />

      <div className="rv2" style={{ paddingTop: NAV_H }}>
        <div style={{ display: "flex", gap: 10, padding: "18px clamp(24px, 3vw, 52px)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8377" }}>
          <Link to="/">Home</Link><span>/</span><span style={{ color: T.ink }}>Rings</span>
        </div>

        <section style={{ padding: "clamp(20px,3vw,40px) clamp(24px,3vw,52px) clamp(36px,4vw,56px)", borderBottom: `1px solid ${T.rule}` }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(44px, 5.2vw, 84px)", lineHeight: 1, letterSpacing: "0.005em", margin: "0 0 20px" }}>All rings</h1>
          <p style={{ margin: 0, maxWidth: "46ch", fontSize: 15, lineHeight: 1.75, color: T.body }}>Every ring under one roof — engagement, wedding and the pieces we hold in stock. Filter by category, style, stone and metal, or come in and try them on the bench.</p>
        </section>

        <div className="rv2-triggerbar" style={{ position: "sticky", top: 78, zIndex: 40, gridTemplateColumns: "1fr 1fr", gap: 1, background: T.rule, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
          <button onClick={() => setSheet(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 0", background: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>
            Filter{activeCount > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: T.gold, color: "#fff", fontSize: 10.5, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{activeCount}</span>}
          </button>
          <button onClick={() => setSortSheet(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 0", background: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>
            Sort<span style={{ fontSize: 10, color: "#8A8377", textTransform: "none", letterSpacing: 0 }}>· {sortLabel}</span>
          </button>
        </div>

        <main style={{ display: "grid", gridTemplateColumns: "264px minmax(0, 1fr)", gap: "clamp(28px, 3vw, 56px)", padding: "clamp(28px,3vw,44px) clamp(24px,3vw,52px) clamp(64px,6vw,104px)", alignItems: "start" }} className="rv2-main">
          <aside style={{ position: "sticky", top: NAV_H + 12 }} className="rv2-aside">
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingBottom: 14, borderBottom: `1px solid ${T.ink}` }}>
              <span style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase" }}>Filter</span>
              <button className="rv2-clear" onClick={clearAll} style={{ padding: 0, cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 11, color: "#8A8377" }}>Clear all</button>
            </div>
            {filterGroupsJsx}
          </aside>

          <div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, color: T.muted }}>{loading ? "Loading…" : `${results.length} ${results.length === 1 ? "ring" : "rings"}`}</span>
                {chips.map((c, i) => (
                  <button key={i} onClick={() => toggle(c.key, c.label)} className="rv2-chip"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 11px", cursor: "pointer", background: T.tint, border: `1px solid ${T.ruleSoft}`, fontFamily: FONT_BODY, fontSize: 11.5, color: T.ink }}>
                    {c.label}<span style={{ color: "#8A8377" }}>×</span>
                  </button>
                ))}
              </div>
              <div className="rv2-sortdesktop" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8377" }}>Sort</span>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  style={{ padding: "9px 12px", fontFamily: FONT_BODY, fontSize: 13, color: T.ink, background: T.paper, border: `1px solid ${T.ruleStrong}`, borderRadius: 0, cursor: "pointer" }}>
                  <option value="featured">Featured</option>
                  <option value="low">Price, low to high</option>
                  <option value="high">Price, high to low</option>
                  <option value="new">Newest</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(18px,2vw,32px)", marginTop: 32 }}>
                {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ aspectRatio: "4 / 5", background: T.tint }} />)}
              </div>
            ) : results.length === 0 ? (
              <div style={{ padding: "72px 0", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, marginBottom: 12 }}>No rings match those filters</div>
                <button onClick={clearAll} style={{ padding: "13px 26px", cursor: "pointer", background: T.ink, color: T.paper, border: 0, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Clear all filters</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(18px,2vw,32px)", marginTop: 32 }} className="rv2-grid">
                {results.map(({ p }) => {
                  const img = p.image?.url || p.images?.find(i => i.is_primary)?.url || p.images?.[0]?.url;
                  const meta = [p.ringTypes?.[0]?.name, p.gemstones?.[0]?.name].filter(Boolean).join(" · ");
                  return (
                    <Link key={p.id} to={linkFor(p)} className="rv2-card" style={{ display: "block" }}>
                      <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden" }}>
                        {img
                          ? <img src={getMediaUrl(img)} alt={p.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                          : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: "#8C8375" }}>{p.name}</div>}
                        {p.is_featured && <span style={{ position: "absolute", top: 12, left: 12, padding: "4px 9px", background: T.ink, color: T.paper, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase" }}>Bestseller</span>}
                        {p.is_live_stock && <span style={{ position: "absolute", top: 12, right: 12, padding: "4px 9px", background: "rgba(248,246,240,0.94)", color: T.body, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase" }}>Ready to ship</span>}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 16, fontSize: 14.5 }}>
                        <span>{p.name}</span><span style={{ color: "#56534D" }}>{p.price}</span>
                      </div>
                      {meta && <div style={{ fontSize: 11.5, color: T.muted, marginTop: 5 }}>{meta}</div>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <section style={{ background: T.ink, color: T.onDarkSoft, padding: "clamp(64px,6vw,108px) clamp(24px,3vw,52px)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
            <div style={{ ...eyebrow, marginBottom: 26 }}>Bespoke</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(32px,3.8vw,58px)", lineHeight: 1.08, margin: "0 auto 24px", maxWidth: "16ch", color: "#FFFFFF" }}>Nothing here quite right?</h2>
            <p style={{ maxWidth: "50ch", margin: "0 auto 48px", fontSize: 15.5, lineHeight: 1.75, color: T.onDarkBody }}>Bring us a sketch, a photograph, or an inherited stone. We draw, you choose, and the piece is made on the bench in our workshop.</p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              <Link to="/bespoke-design" style={{ padding: "14px 30px", background: T.paper, color: T.ink, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Start a commission</Link>
              <Link to="/contact" style={{ padding: "14px 30px", border: `1px solid ${T.ruleDarkStrong}`, color: "#FFFFFF", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Book an appointment</Link>
            </div>
          </div>
        </section>
      </div>

      {sheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.45)" }} />
          <div style={{ position: "relative", background: T.paper, maxHeight: "86vh", display: "flex", flexDirection: "column", animation: "rv2SheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${T.rule}` }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20 }}>Filter</span>
              <button onClick={() => setSheet(false)} aria-label="Close" style={{ background: "none", border: 0, cursor: "pointer", fontSize: 24, lineHeight: 1, color: T.ink }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>{filterGroupsJsx}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, padding: "14px 20px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.rule}` }}>
              <button onClick={clearAll} style={{ padding: "15px 0", background: "transparent", border: `1px solid ${T.ruleStrong}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>Clear</button>
              <button onClick={() => setSheet(false)} style={{ padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Show {results.length} {results.length === 1 ? "ring" : "rings"}</button>
            </div>
          </div>
        </div>
      )}

      {sortSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setSortSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.45)" }} />
          <div style={{ position: "relative", background: T.paper, animation: "rv2SheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
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

      <FooterV2 />

      <style>{`
        .rv2-triggerbar { display: none; }
        @keyframes rv2SheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (max-width: 900px){
          .rv2-main{ grid-template-columns: 1fr !important; }
          .rv2-aside{ display: none !important; }
          .rv2-grid{ grid-template-columns: repeat(2,1fr) !important; gap: 12px !important; }
          .rv2-triggerbar{ display: grid !important; }
          .rv2-sortdesktop{ display: none !important; }
          .rv2-range::-webkit-slider-thumb{ width:22px !important; height:22px !important; }
          .rv2-range::-moz-range-thumb{ width:22px !important; height:22px !important; }
        }
      `}</style>
    </div>
  );
};

export default RingsV2;
