import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import CategoryCopyV2 from "../components/home-v2/CategoryCopyV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { useFavorites } from "../contexts/FavoritesContext";
import { LISTING_CSS, GROUND, TILE, PAGE_SIZE, PAGE_X, BAR_TOP_CSS, M_BAR_TOP_CSS, Chev, XICON, PillTick, useFilterPanel } from "../components/home-v2/listingShared";

/**
 * All rings listing, restyled in Nov 2026 to match the engagement rings listing (centred
 * header, one slim filter row, 4-up grid with a save heart, "Show more"). The look lives
 * in components/home-v2/listingShared.tsx.
 *
 * DATA: fetches ?category=rings, the parent set: ready-to-ship stock rings plus the
 * made-to-order engagement rings. Adds Availability and Category on top of the shared
 * style / gemstone / metal / collection filters. Each card links to its own category's
 * product page. Stock rings are photographs (they fill the tile); engagement rings are
 * cut-outs (they sit inside it, with gold colour dots).
 * The previous version is in git history.
 */

const NAV_H = 96; // fixed NavigationV2 height (announcement + header)

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
const LIVE = "Ready to ship";
const ORDER = "Made to order";
const GROUP_DEFS: { key: GroupKey; title: string; short: string }[] = [
  { key: "availability", title: "Availability", short: "Availability" },
  { key: "category", title: "Category", short: "Category" },
  { key: "style", title: "Ring styles", short: "Style" },
  { key: "gem", title: "Gemstones", short: "Gemstone" },
  { key: "metal", title: "Metals", short: "Metal" },
  { key: "collection", title: "Collection", short: "Collection" },
];
type PanelKey = GroupKey | "price" | "sort";
// Small colour dot beside each metal name.
const metalDot = (name: string) => /yellow/i.test(name) ? "#D8BC74" : /rose|red/i.test(name) ? "#DDAE9B" : "#D9D8D4";
// Gold colours offered as dots under each ring; "test" matches the metal a photograph belongs to.
const GOLDS: { key: string; label: string; dot: string; test: RegExp }[] = [
  { key: "white", label: "White gold", dot: "#D9D8D4", test: /white|platinum/i },
  { key: "yellow", label: "Yellow gold", dot: "#DCC27E", test: /yellow/i },
  { key: "rose", label: "Rose gold", dot: "#E2B4A0", test: /rose|red/i },
];

const money = (n: number) => "£" + Math.round(n).toLocaleString("en-GB");

const RingsV2 = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  // metal id → name, so cards can default their thumbnail to the White Gold colourway
  const [metalNameById, setMetalNameById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [opts, setOpts] = useState<Record<GroupKey, string[]>>({ availability: [LIVE, ORDER], category: [], style: [], gem: [], metal: [], collection: [] });

  const [sel, setSel] = useState<Record<GroupKey, string[]>>({ availability: [], category: [], style: [], gem: [], metal: [], collection: [] });
  const [maxPrice, setMaxPrice] = useState(12000);
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState<Record<GroupKey, boolean>>({ availability: true, category: true, style: true, gem: false, metal: false, collection: false });
  const [panel, setPanel] = useState<PanelKey | null>(null); // which filter panel is open on a laptop
  const [cardMetal, setCardMetal] = useState<Record<string, string>>({}); // gold colour picked on each card
  const [shown, setShown] = useState(PAGE_SIZE);     // how many results are on screen
  const { isFavorite, toggleFavorite } = useFavorites();
  const [sheet, setSheet] = useState(false);       // mobile filter sheet
  const [sortSheet, setSortSheet] = useState(false); // mobile sort sheet

  // Lock body scroll while a mobile sheet is open
  useEffect(() => {
    const lock = sheet || sortSheet;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheet, sortSheet]);

  // Seed a filter from the URL (nav mega-menu links pass ?ringType=/?metal= etc.).
  // "all" (the menu's "Shop all" links) ticks every option in that group and clears the
  // others, so the page shows the whole range with that group's choices visible.
  useEffect(() => {
    const params: [string, GroupKey][] = [["ringType", "style"], ["gemstone", "gem"], ["metal", "metal"], ["collection", "collection"]];
    const seed: Partial<Record<GroupKey, string[]>> = {};
    let shopAll = false;
    for (const [param, key] of params) {
      const v = searchParams.get(param); if (!v) continue;
      if (v === "all") { shopAll = true; seed[key] = opts[key]; setOpen(o => ({ ...o, [key]: true })); }
      else seed[key] = [v];
    }
    const av = searchParams.get("availability"); if (av === "live") seed.availability = [LIVE]; if (av === "order") seed.availability = [ORDER];
    if (!Object.keys(seed).length) return;
    setSel(s => shopAll ? { style: [], gem: [], metal: [], collection: [], ...seed } : { ...s, ...seed });
  }, [searchParams, opts]);

  // Reference facets
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
        setMetalNameById(Object.fromEntries(metals.map((m: any) => [m.id, m.name])));
      });
  }, []);

  // Full catalogue (client-side filtering → live counts)
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/products?category=rings&sort=sort_order&order=asc&limit=1000`)
      .then(r => r.json())
      .then(d => {
        if (!d.success) return;
        const list: Product[] = d.data.products || [];
        setProducts(list);
        // The Category choices are whichever ranges are actually present.
        setOpts(o => ({ ...o, category: Array.from(new Set(list.map(p => p.category?.name).filter(Boolean) as string[])) }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Normalise each product's facet fields once
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

  // Every option ticked = no restriction (so rings without a value for that group stay in).
  const off = (k: GroupKey) => !sel[k].length || (opts[k].length > 0 && opts[k].every(o => sel[k].includes(o)));
  const matches = (r: typeof rows[number], ignore?: GroupKey) => {
    const okAvail = ignore === "availability" || off("availability") || sel.availability.includes(r.availability);
    const okCat = ignore === "category" || off("category") || sel.category.includes(r.category);
    const okStyle = ignore === "style" || off("style") || sel.style.some(v => r.styles.includes(v));
    const okGem = ignore === "gem" || off("gem") || sel.gem.some(v => r.gems.includes(v));
    const okMetal = ignore === "metal" || off("metal") || sel.metal.some(v => r.metals.includes(v));
    const okCol = ignore === "collection" || off("collection") || sel.collection.includes(r.collection);
    const okPrice = r.price <= maxPrice;
    return okAvail && okCat && okStyle && okGem && okMetal && okCol && okPrice;
  };

  const fieldFor = (r: typeof rows[number], key: GroupKey): string[] =>
    key === "availability" ? [r.availability] : key === "category" ? [r.category] : key === "style" ? r.styles : key === "gem" ? r.gems : key === "metal" ? r.metals : [r.collection];

  // Leave out options no ring in the range has (for example a metal we do not offer here), unless already chosen.
  const visibleOpts = (k: GroupKey) => opts[k].filter(o => sel[k].includes(o) || rows.some(r => fieldFor(r, k).includes(o)));

  // A group with nothing to choose from (no collections on these rings, say) is left off the page.
  const shownGroups = GROUP_DEFS.filter(g => loading || visibleOpts(g.key).length > 0);

  const results = useMemo(() => {
    let list = rows.filter(r => matches(r));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "new") list = [...list].reverse();
    // Featured: ready-to-ship stock first, then made to order, so the two kinds of photograph are not mixed.
    else list = [...list].sort((a, b) => (a.availability === LIVE ? 0 : 1) - (b.availability === LIVE ? 0 : 1) || Number(b.hasImage) - Number(a.hasImage));
    return list;
  }, [rows, sel, maxPrice, sort]);

  // A new filter or sort starts again from the first rows.
  useEffect(() => { setShown(PAGE_SIZE); }, [sel, maxPrice, sort]);

  const { barRef, mainRef, toResults } = useFilterPanel(!!panel, () => setPanel(null));
  const toggle = (key: GroupKey, val: string) => {
    setSel(s => ({ ...s, [key]: s[key].includes(val) ? s[key].filter(v => v !== val) : [...s[key], val] })); toResults();
  };
  const clearAll = () => { setSel({ availability: [], category: [], style: [], gem: [], metal: [], collection: [] }); setMaxPrice(12000); toResults(); };
  const showLabel = (n: number) => `Show ${n} ${n === 1 ? "ring" : "rings"}`;

  // A fully ticked group shows as one "All …" chip; removing it clears that group.
  type Chip = { key: GroupKey; label: string; shown?: string; all?: boolean };
  const chips: Chip[] = GROUP_DEFS.flatMap<Chip>(g =>
    sel[g.key].length && off(g.key) ? [{ key: g.key, label: `All ${g.title.toLowerCase()}`, all: true }] : sel[g.key].map(v => ({ key: g.key, label: v, shown: g.key === "metal" ? v.replace(/\bRed\b/, "Rose") : v })));
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

  // Reusable filter groups (accordions + price) — shared by desktop sidebar and mobile sheet
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
          {(
            <div style={{ display: open[g.key] ? "flex" : "none", flexDirection: "column", gap: 1, paddingBottom: 16 }}>
              {visibleOpts(g.key).map(o => {
                const on = sel[g.key].includes(o);
                const n = rows.filter(r => matches(r, g.key) && fieldFor(r, g.key).includes(o)).length;
                return (
                  <button key={o} type="button" onClick={() => toggle(g.key, o)} className="erv2-opt" data-fopt aria-pressed={on}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 15, color: T.text }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="erv2-box" style={{ width: 16, height: 16, flex: "none", border: `1px solid ${on ? T.text : T.ruleStrong}`, background: on ? T.text : "transparent" }} />
                      {g.key === "metal" && <span style={{ width: 10, height: 10, flex: "none", borderRadius: "50%", background: metalDot(o), boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }} />}
                      {g.key === "metal" ? o.replace(/\bRed\b/, "Rose") : o}
                    </span>
                    <span style={{ fontSize: 12.5, color: T.textMuted }}>{n}</span>
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
          <span style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Price</span>
          <span style={{ fontSize: 13.5, color: T.textMuted }}>{priceLabel}</span>
        </div>
        <input type="range" min={300} max={12000} step={100} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="erv2-range" />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8A8377", marginTop: 8 }}><span>£300</span><span>£12,000+</span></div>
      </div>
    </>
  );

  return (
    <div style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility" } as React.CSSProperties}>
      <style>{LISTING_CSS}</style>

      <NavigationV2 solid />

      <div className="erv2" style={{ paddingTop: NAV_H }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: "clamp(30px,3.4vw,52px) clamp(24px, 3vw, 52px) 16px", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>
          <Link to="/">Home</Link><span>/</span><span style={{ color: T.text }}>Rings</span>
        </div>

        {/* Page header — centred and compact, so the rings start high on the page */}
        <section className="erv2-head" style={{ padding: "0 clamp(24px,3vw,52px) clamp(34px,3.8vw,56px)", textAlign: "center" }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(28px, 3.2vw, 44px)", lineHeight: 1.15, margin: "0 0 16px", color: T.text }}>All rings</h1>
          <p style={{ margin: "0 auto", maxWidth: "46ch", fontSize: 15.5, lineHeight: 1.7, color: T.text }}>Every ring under one roof: the pieces we hold in stock, ready to ship, and the engagement rings we make to order in our own workshop.</p>
        </section>

        {/* Phone filter row: Filter on the left, the ring count in the middle, Sort on the right */}
        <div className="erv2-triggerbar" style={{ position: "sticky", top: M_BAR_TOP_CSS, zIndex: 40, background: GROUND, padding: `0 ${PAGE_X}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
            <button type="button" className="erv2-mbtn" data-sheetbtn="filter" onClick={() => setSheet(true)} style={{ justifySelf: "start" }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M0 3h16M0 9h16" stroke="currentColor" strokeWidth="1" /><circle cx="5" cy="3" r="2" fill={GROUND} stroke="currentColor" strokeWidth="1" /><circle cx="11" cy="9" r="2" fill={GROUND} stroke="currentColor" strokeWidth="1" /></svg>
              Filter{activeCount > 0 && <span style={{ color: T.textMuted }}>({activeCount})</span>}
            </button>
            <span style={{ fontSize: 12.5, color: T.textMuted }}>{loading ? "Loading\u2026" : `${results.length} ${results.length === 1 ? "ring" : "rings"}`}</span>
            <button type="button" className="erv2-mbtn" data-sheetbtn="sort" onClick={() => setSortSheet(true)} style={{ justifySelf: "end" }}>
              Sort<Chev />
            </button>
          </div>
        </div>

        {/* Filters and results. The bar stays under the navigation while the rings scroll. */}
        <div>
          {/* Laptop filter bar: one quiet row; each label opens its options underneath */}
          <div ref={barRef} className={`erv2-bar${panel ? " has-open" : ""}`} style={{ position: "sticky", top: BAR_TOP_CSS, zIndex: 30, background: GROUND, padding: `0 ${PAGE_X}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.6vw, 44px)" }}>
                {[...shownGroups.map(g => ({ key: g.key as PanelKey, label: g.short, n: off(g.key) && sel[g.key].length ? 0 : sel[g.key].length })), { key: "price" as PanelKey, label: "Price", n: maxPrice < 12000 ? 1 : 0 }].map(b => (
                  <button key={b.key} type="button" className="erv2-fbtn" data-fbtn={b.key} aria-expanded={panel === b.key} onClick={() => setPanel(v => v === b.key ? null : b.key)}>
                    {b.label}{b.n > 0 && <span style={{ color: T.textMuted }}>({b.n})</span>}<Chev />
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.6vw, 44px)" }}>
                <span style={{ fontSize: 12.5, color: T.textMuted }}>{loading ? "Loading\u2026" : `${results.length} ${results.length === 1 ? "ring" : "rings"}`}</span>
                <button type="button" className="erv2-fbtn" data-fbtn="sort" aria-expanded={panel === "sort"} onClick={() => setPanel(v => v === "sort" ? null : "sort")}>
                  Sort<span style={{ color: T.textMuted, textTransform: "none", letterSpacing: 0, fontSize: 12.5 }}>{sortLabel}</span><Chev />
                </button>
              </div>
            </div>
            {shownGroups.map(g => (
              <div key={g.key} data-fpanel={g.key} className={`erv2-panel${panel === g.key ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
                <div className="erv2-pills">
                  {visibleOpts(g.key).map(o => {
                    const on = sel[g.key].includes(o);
                    const n = rows.filter(r => matches(r, g.key) && fieldFor(r, g.key).includes(o)).length;
                    return (
                      <button key={o} type="button" onClick={() => toggle(g.key, o)} className="erv2-pill" data-fopt aria-pressed={on}>
                        <PillTick />
                        {g.key === "metal" && <span className="erv2-pill-dot" style={{ background: metalDot(o) }} />}
                        {g.key === "metal" ? o.replace(/\bRed\b/, "Rose") : o}<span className="erv2-pill-n">{n}</span>
                      </button>
                    );
                  })}
                </div>
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
                <input type="range" min={300} max={12000} step={100} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="erv2-range" aria-label="Maximum price" />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.textMuted, marginTop: 10 }}><span>£300</span><span>£12,000+</span></div>
              </div>
              <div className="erv2-panel-foot">
                <span />
                <span style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.4vw, 36px)" }}>
                  {maxPrice < 12000 && <button type="button" className="is-quiet" onClick={() => setMaxPrice(12000)}>Clear</button>}
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
            {/* Chosen filters (and, on a phone, the ring count) */}
            <div className="erv2-meta" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: chips.length || maxPrice < 12000 ? 24 : 0 }}>
              <span className="erv2-count-m" style={{ fontSize: 12.5, color: T.textMuted, marginRight: 6 }}>{loading ? "Loading\u2026" : `${results.length} ${results.length === 1 ? "ring" : "rings"}`}</span>
              {chips.map((c, i) => (
                <button key={i} type="button" onClick={() => c.all ? setSel(s => ({ ...s, [c.key]: [] })) : toggle(c.key, c.label)} className="erv2-chip"
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", cursor: "pointer", background: "transparent", border: `1px solid ${T.line}`, fontFamily: FONT_BODY, fontSize: 12, color: T.text }}>
                  {c.shown || c.label}<span aria-hidden="true" style={{ color: T.textMuted }}>×</span>
                </button>
              ))}
              {maxPrice < 12000 && (
                <button type="button" onClick={() => setMaxPrice(12000)} className="erv2-chip"
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
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(21px, 2vw, 27px)", color: T.text, marginBottom: 12 }}>No rings match those choices</div>
                <p style={{ margin: "0 auto 10px", maxWidth: "40ch", fontSize: 15, lineHeight: 1.7, color: T.text }}>Remove a filter to see more, or ask us to make the ring you have in mind.</p>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px clamp(20px, 3vw, 40px)" }}>
                  <button type="button" onClick={clearAll} className="erv2-textlink" style={{ cursor: "pointer", background: "transparent", borderTop: 0, borderLeft: 0, borderRight: 0, fontFamily: FONT_BODY, color: T.text }}>Clear all filters</button>
                  <Link to="/bespoke-design" className="erv2-textlink" style={{ color: T.text }}>Start a commission</Link>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "clamp(28px,3vw,44px) clamp(16px,1.6vw,28px)", marginTop: 32 }} className="erv2-grid">
                {results.slice(0, shown).map(({ p }) => {
                  const imgs = p.images || [];
                  const metalOf = (i: any) => metalNameById[i?.metal_id] || "";
                  // The gold colours this ring is photographed in: one dot each under the card.
                  const colours = GOLDS.map(g => ({ ...g, image: imgs.find(i => i.url && g.test.test(metalOf(i))) })).filter(c => c.image);
                  // Chosen colour first; otherwise white gold when there is one; otherwise the primary / first image.
                  const chosen = colours.find(c => c.key === cardMetal[p.id]);
                  const primaryObj = chosen?.image || colours.find(c => c.key === "white")?.image || imgs.find(i => i.is_primary) || imgs[0];
                  const img = primaryObj?.url || p.image?.url;
                  const pMetal = (primaryObj as any)?.metal_id;
                  const shownKey = colours.find(c => c.image === primaryObj)?.key;
                  // Hover: another angle of the same metal colour only, never a different colour.
                  const second = pMetal ? imgs.find(i => i.url && i.url !== img && (i as any).metal_id === pMetal)?.url : undefined;
                  const href = `/${p.category?.slug || "rings"}/${p.slug}`;
                  // Stock rings are photographs and fill the tile; engagement rings are cut-outs and sit inside it.
                  const photo = p.category?.slug !== "engagement-rings";
                  const alt2 = photo ? imgs.find(i => i.url && i.url !== img)?.url : second;
                  const fit: React.CSSProperties = photo ? { objectFit: "cover" } : { objectFit: "contain", padding: "7%" };
                  const label = p.is_live_stock ? LIVE : p.is_featured ? "Bestseller" : "";
                  const saved = isFavorite(p.id);
                  return (
                    <div key={p.id} className={`erv2-card${alt2 ? " has-alt" : ""}`} style={{ position: "relative" }}>
                      <Link to={href} style={{ display: "block" }}>
                        <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: TILE, overflow: "hidden" }}>
                          {img
                            ? <img key={img} src={getMediaUrl(img)} alt={`${p.name}${chosen ? ` in ${chosen.label.toLowerCase()}` : ""}`} className={photo ? "erv2-main-img" : "erv2-blend erv2-main-img"} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...fit }} loading="lazy" />
                            : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted }}>{p.name}</div>}
                          {alt2 && <img key={alt2} src={getMediaUrl(alt2)} alt="" aria-hidden="true" className={photo ? "erv2-card-alt" : "erv2-card-alt erv2-blend"} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...fit }} loading="lazy" />}
                          {label && <span style={photo ? { position: "absolute", top: 10, left: 10, padding: "4px 8px", background: "rgba(255,254,253,0.9)", fontSize: "clamp(8.5px, 0.4vw + 7px, 10px)", letterSpacing: "0.14em", textTransform: "uppercase", color: T.text } : { position: "absolute", top: 14, left: 14, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: T.textMuted }}>{label}</span>}
                          <span className="erv2-add">Add to bag</span>
                        </div>
                        {/* Stock ring names are long, so the price sits under the name rather than beside it */}
                        <div style={{ marginTop: 14, fontSize: 14.5, lineHeight: 1.45, color: T.text }}>{p.name}</div>
                        <div style={{ marginTop: 5, fontSize: 14, color: T.textMuted }}>{p.price}</div>
                      </Link>
                      {colours.length > 1 && (
                        <div role="group" aria-label={`${p.name}: show in`} className="erv2-dots" style={{ display: "flex", marginTop: 2, marginLeft: -9 }}>
                          {colours.map(c => {
                            const on = shownKey === c.key;
                            return (
                              <button key={c.key} type="button" className="erv2-dot" title={c.label} aria-label={`Show ${p.name} in ${c.label.toLowerCase()}`} aria-pressed={on}
                                data-img={getMediaUrl(c.image!.url)}
                                onClick={() => setCardMetal(m => ({ ...m, [p.id]: c.key }))}
                                style={{ width: 32, height: 34, padding: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.dot }} />
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <button type="button" className="erv2-save" aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
                        onClick={() => toggleFavorite(p.id, p.name, img ? getMediaUrl(img) : "", href)}
                        style={{ position: "absolute", top: 6, right: 6, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: 0, color: T.text }}>
                        <svg width="20" height="18" viewBox="0 0 20 18" fill={saved ? "currentColor" : "none"} aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.7 2.8-2.7 4.6-2.7C17 1.4 19 3.3 19 5.9c0 3.7-3.6 6.8-9 10.7z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {!loading && results.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: "clamp(40px, 4vw, 64px)" }}>
                <span style={{ fontSize: 12.5, color: T.textMuted }}>Showing {Math.min(shown, results.length)} of {results.length} rings</span>
                <span aria-hidden="true" style={{ width: 160, height: 1, background: T.line, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, height: 1, background: T.text, width: `${Math.min(100, (shown / results.length) * 100)}%` }} />
                </span>
                {shown < results.length && (
                  <button type="button" className="erv2-more" onClick={() => setShown(n => n + PAGE_SIZE)}
                    style={{ marginTop: 10, padding: "15px 34px", cursor: "pointer", background: "transparent", border: `1px solid ${T.text}`, fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Show more rings</button>
                )}
              </div>
            )}
          </main>
        </div>

      </div>

      {/* Mobile filter sheet */}
      {(
        <div data-sheet="filter" style={{ position: "fixed", inset: 0, zIndex: 80, display: sheet ? "flex" : "none", flexDirection: "column", justifyContent: "flex-end" }}>
          <div data-sheetclose onClick={() => setSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(28,26,23,0.38)" }} />
          <div style={{ position: "relative", background: GROUND, maxHeight: "86vh", display: "flex", flexDirection: "column", animation: "erv2SheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 24px", borderBottom: `1px solid ${T.line}` }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: T.text }}>Filter</span>
              <button type="button" data-sheetclose onClick={() => setSheet(false)} aria-label="Close" className="erv2-x">{XICON}</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>{filterGroupsJsx}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, padding: "14px 24px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.line}` }}>
              <button type="button" onClick={clearAll} style={{ padding: "16px 0", background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, textDecoration: "underline", textUnderlineOffset: 5, textDecorationColor: T.ruleStrong }}>Clear all</button>
              <button type="button" data-sheetclose onClick={() => setSheet(false)} style={{ padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Show {results.length} {results.length === 1 ? "ring" : "rings"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sort sheet */}
      {(
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
      )}

      <CategoryCopyV2 />
      <FooterV2 />

    </div>
  );
};

export default RingsV2;
