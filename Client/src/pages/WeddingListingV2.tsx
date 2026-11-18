import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL from "../config/api";
import { weddingVariant } from "../components/home-v2/WeddingImg";
import { LISTING_CSS, GROUND, TILE, PAGE_SIZE, PAGE_X, Chev, XICON } from "../components/home-v2/listingShared";

/**
 * Wedding rings — configurator listing, wired to the Allied Gold catalogue
 * (migration 019, /api/v1/wedding/designs). One card per COLLECTION, "From £X", and three
 * gold-colour dots that change that card's photograph. Restyled in Nov 2026 to match the
 * engagement rings listing (look shared through components/home-v2/listingShared.tsx):
 * centred header, one slim filter row, a 4-up grid and "Show more". The row also carries a
 * "Shown in" control that changes every photograph's gold colour without filtering.
 * Style is always offered; Metal too; Width / Profile / Stone quality / Stone origin appear
 * once a style is chosen, as before. Prices are indicative trade prices, confirmed at order.
 */

const CAT_ORDER = ["Diamond Set", "Classic", "Two Colour", "Diamond Cut", "Shaped"]; // ordered by stock count, most→least; Cluster moved to Engagement
// Dimensions offered as scoped filters (metal is a base group; weight/carat live on the PDP).
const SCOPED_DIMS = ["width", "profile", "quality", "origin", "collection", "shape"];
const DIM_LABEL: Record<string, string> = {
  category: "Style", metal: "Metal", width: "Width", profile: "Profile", quality: "Stone quality",
  origin: "Stone origin", collection: "Collection", shape: "Stone shape", weight: "Weight", carat: "Carat",
};
// Plain-English metal names; the catalogue's own labels are incomplete ("PT", "9R", "18Y").
const METAL_LABEL: Record<string, string> = {
  "9Y": "9ct Yellow Gold", "9W": "9ct White Gold", "9R": "9ct Rose Gold",
  "14Y": "14ct Yellow Gold", "14W": "14ct White Gold", "14R": "14ct Rose Gold",
  "18Y": "18ct Yellow Gold", "18W": "18ct White Gold", "18R": "18ct Rose Gold",
  PT: "Platinum", PD: "Palladium", PD5: "Palladium 500", ARG960: "Argentium Silver",
};
const METAL_ORDER = ["PT", "18Y", "18W", "18R", "14Y", "14W", "14R", "9Y", "9W", "9R", "PD", "PD5", "ARG960"];
const ORIGIN_LABEL: Record<string, string> = { LabGrown: "Lab-grown", Natural: "Natural" };
const COLOURWAYS = [
  { id: "Y", label: "Yellow", swatch: "#DDBB6E" },
  { id: "W", label: "White", swatch: "#E4E2DD" },
  { id: "R", label: "Rose", swatch: "#E0B19C" },
] as const;
type CW = "Y" | "W" | "R";
const metalDot = (code: string) => /Y$/.test(code) ? COLOURWAYS[0].swatch : /R$/.test(code) ? COLOURWAYS[2].swatch : COLOURWAYS[1].swatch;

const money = (n: number | null | undefined) => (n == null ? "" : "£" + Math.round(n).toLocaleString("en-GB"));
const swatchFor = (id: string) => COLOURWAYS.find(c => c.id === id)?.swatch || "#E4E2DD";

interface ApiDesign {
  id: string; category: string; name: string; family: string; description: string; collection?: string;
  variations: number; priceFrom: number | null; priceTo: number | null; currency: string;
  colourways: string[]; hero: { Y: string | null; W: string | null; R: string | null };
  hasSpin: boolean; facets: Record<string, string[]>;
}
type Card = ApiDesign & { _members: number; _widths: number };

// Tinted ring fallback when a colourway has no photograph.
const RingTile = ({ way, name }: { way: string; name: string }): JSX.Element => {
  const c = swatchFor(way); const gid = `g-${name}-${way}`.replace(/[^a-zA-Z0-9-]/g, "");
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox="0 0 120 120" width="56%" height="56%" aria-hidden="true">
        <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" /><stop offset="0.45" stopColor={c} /><stop offset="1" stopColor="#00000022" />
        </linearGradient></defs>
        <circle cx="60" cy="62" r="40" fill="none" stroke={`url(#${gid})`} strokeWidth="13" />
        <circle cx="60" cy="62" r="40" fill="none" stroke="rgba(28,26,23,0.10)" strokeWidth="0.8" />
      </svg>
    </div>
  );
};

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Price, low to high" },
  { value: "high", label: "Price, high to low" },
  { value: "new", label: "Newest" },
];

const WeddingListingV2 = (): JSX.Element => {
  const location = useLocation();

  const [designs, setDesigns] = useState<ApiDesign[]>([]);
  const [labels, setLabels] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [colourway, setColourway] = useState<CW>("W");
  const [cardPick, setCardPick] = useState<Record<string, CW>>({});
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState("featured");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [panel, setPanel] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({ category: true });
  const [saved, setSaved] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);

  useEffect(() => { document.body.style.background = GROUND; }, []);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/wedding/designs`)
      .then(r => r.json())
      // Cluster (engagement-style) rings are never listed among wedding bands.
      .then(d => { if (alive && d.success) { setDesigns((d.designs || []).filter((x: ApiDesign) => x.category !== "Cluster")); setLabels(d.labels || {}); } })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Apply filters passed in the URL (e.g. from the nav: /wedding?category=Classic
  // or /wedding?metal=PT). Values may be comma-separated. Re-applied whenever the
  // query string changes (a new nav link), but NOT on in-page filter toggles,
  // which never touch the URL — guarded by the last-applied search ref.
  const appliedSearch = useRef<string | null>(null);
  useEffect(() => {
    if (appliedSearch.current === location.search) return;
    appliedSearch.current = location.search;
    const params = new URLSearchParams(location.search);
    const next: Record<string, string[]> = {};
    ["category", "metal", ...SCOPED_DIMS].forEach(dim => {
      const raw = params.get(dim);
      if (raw) next[dim] = raw.split(",").map(s => s.trim()).filter(Boolean);
    });
    if (Object.keys(next).length) { setSel(next); setShown(PAGE_SIZE); }
  }, [location.search]);

  // Position restore
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || loading) return;
    restored.current = true;
    try {
      const y = Number(sessionStorage.getItem("mcc-wr-scroll"));
      const sh = Number(sessionStorage.getItem("mcc-wr-shown"));
      sessionStorage.removeItem("mcc-wr-scroll"); sessionStorage.removeItem("mcc-wr-shown");
      if (sh > PAGE_SIZE) setShown(sh);
      if (y > 0) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
    } catch { /* ignore */ }
  }, [loading]);

  useEffect(() => { const lock = sheet || sortSheet; document.body.style.overflow = lock ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [sheet, sortSheet]);

  const cats = useMemo(() => CAT_ORDER.filter(c => designs.some(d => d.category === c)), [designs]);
  const selCats = sel.category || [];
  // Scoped dims: dimensions (other than metal) with ≥2 distinct values across the chosen styles.
  const scopedDims = useMemo(() => {
    if (!selCats.length) return [] as string[];
    const pool = designs.filter(d => selCats.includes(d.category));
    return SCOPED_DIMS.filter(dim => {
      const vals = new Set<string>(); pool.forEach(d => (d.facets[dim] || []).forEach(v => v !== "n/a" && vals.add(v)));
      return vals.size >= 2;
    });
  }, [designs, selCats]);

  const valuesFor = (dim: string): string[] => {
    if (dim === "category") return cats;
    const relevant = dim === "metal" ? designs : designs.filter(d => !selCats.length || selCats.includes(d.category));
    const set = new Set<string>(); relevant.forEach(d => (d.facets[dim] || []).forEach(v => v !== "n/a" && set.add(v)));
    if (dim === "metal") return METAL_ORDER.filter(m => set.has(m)).concat([...set].filter(m => !METAL_ORDER.includes(m)));
    return Array.from(set).sort((a, b) => (parseFloat(a) - parseFloat(b)) || a.localeCompare(b));
  };
  const lbl = (dim: string, v: string) => dim === "category" ? v : dim === "metal" ? (METAL_LABEL[v] || labels.metal?.[v] || v) : dim === "origin" ? (ORIGIN_LABEL[v] || v) : (labels[dim]?.[v] || v);

  const passes = (d: ApiDesign, s: Record<string, string[]>): boolean => {
    if ((s.category?.length) && !s.category.includes(d.category)) return false;
    for (const dim of ["metal", ...SCOPED_DIMS]) {
      const want = s[dim]; if (!want || !want.length) continue;
      const have = d.facets[dim] || [];
      if (!want.some(v => have.includes(v))) return false;
    }
    return true;
  };

  const list = useMemo(() => designs.filter(d => passes(d, sel)), [designs, sel]); // eslint-disable-line

  // Collapse the many per-design rows (e.g. the 81 "Papplewick" width/weight/gent variants)
  // into ONE card per collection. Width/weight/gender/metal/size are chosen in the PDP.
  const grouped = useMemo(() => {
    const by = new Map<string, ApiDesign[]>();
    for (const d of list) { const k = d.collection || d.name; if (!by.has(k)) by.set(k, []); by.get(k)!.push(d); }
    const cards = [...by.entries()].map(([col, arr]) => {
      const rep = arr.reduce((a, b) => (b.priceFrom != null && (a.priceFrom == null || b.priceFrom < a.priceFrom) ? b : a), arr[0]);
      const priceFrom = arr.reduce<number | null>((m, d) => (d.priceFrom != null && (m == null || d.priceFrom < m) ? d.priceFrom : m), null);
      const colourways = [...new Set(arr.flatMap(d => d.colourways))];
      const hero: any = { Y: null, W: null, R: null };
      (["Y", "W", "R"] as const).forEach(w => { hero[w] = arr.map(d => d.hero[w]).find(Boolean) || null; });
      const widths = new Set<string>(); arr.forEach(d => (d.facets.width || []).forEach(w => widths.add(w)));
      return { ...rep, name: col, collection: col, priceFrom, colourways, hero, _members: arr.length, _widths: widths.size } as Card;
    });
    if (sort === "low") return [...cards].sort((a, b) => (a.priceFrom ?? 1e9) - (b.priceFrom ?? 1e9));
    if (sort === "high") return [...cards].sort((a, b) => (b.priceFrom ?? 0) - (a.priceFrom ?? 0));
    if (sort === "new") return [...cards].reverse();
    // Featured: the shop's own order, with any design that has no photograph yet moved to the end.
    const has = (c: Card) => Number(!!(c.hero.W || c.hero.Y || c.hero.R));
    return [...cards].sort((a, b) => has(b) - has(a));
  }, [list, sort]);

  const visible = grouped.slice(0, shown);
  const noun = (n: number) => n === 1 ? "design" : "designs";
  const countText = loading ? "Loading…" : `${grouped.length} ${noun(grouped.length)}`;

  const cardWay = (d: ApiDesign): CW => {
    const w = cardPick[d.id] || colourway;
    return (d.colourways.includes(w) ? w : (d.colourways[0] as CW)) || "W";
  };
  const heroFor = (d: ApiDesign, way: CW) => d.hero[way] || d.hero.W || d.hero.Y || d.hero.R;

  // After a filter changes part-way down the page, bring the first row of results back under the filter row.
  const barRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const toResults = () => requestAnimationFrame(() => {
    const main = mainRef.current; if (!main) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--v2nav-h")) || 113;
    const y = main.getBoundingClientRect().top + window.scrollY - navH - (barRef.current?.offsetHeight || 0);
    if (window.scrollY > y + 4) window.scrollTo({ top: y, behavior: "smooth" });
  });
  const clearAll = () => { setSel({}); setShown(PAGE_SIZE); toResults(); };
  const toggle = (dim: string, val: string) => { setSel(s => { const cur = s[dim] || []; return { ...s, [dim]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] }; }); setShown(PAGE_SIZE); toResults(); };
  // Esc closes an open panel.
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPanel(null); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const groups = ["category", "metal", ...scopedDims];
  const chips = ["category", "metal", ...SCOPED_DIMS].flatMap(dim => (sel[dim] || []).map(v => ({ dim, val: v, label: lbl(dim, v) })));
  // How many cards (collections) an option would give, with the other groups' choices kept.
  const countFor = (dim: string, v: string) => new Set(designs.filter(d => passes(d, { ...sel, [dim]: [v] })).map(d => d.collection || d.name)).size;
  const optsFor = (dim: string) => valuesFor(dim).map(v => ({ v, n: countFor(dim, v) })).filter(o => o.n > 0 || (sel[dim] || []).includes(o.v));
  const sortLabel = SORTS.find(o => o.value === sort)?.label || "Featured";
  const rememberScroll = () => { try { sessionStorage.setItem("mcc-wr-scroll", String(window.scrollY)); sessionStorage.setItem("mcc-wr-shown", String(shown)); } catch { /* ignore */ } };
  const pickAll = (w: CW) => { setColourway(w); setCardPick({}); };

  const option = (dim: string, o: { v: string; n: number }, big: boolean) => {
    const on = (sel[dim] || []).includes(o.v);
    return (
      <button key={o.v} type="button" onClick={() => toggle(dim, o.v)} className="erv2-opt" data-fopt aria-pressed={on}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: big ? "12px 0" : "10px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: big ? 15 : 14, color: T.text }}>
        <span style={{ display: "flex", alignItems: "center", gap: big ? 12 : 11 }}>
          <span className="erv2-box" style={{ width: big ? 16 : 14, height: big ? 16 : 14, flex: "none", border: `1px solid ${on ? T.text : T.ruleStrong}`, background: on ? T.text : "transparent" }} />
          {dim === "metal" && <span style={{ width: 10, height: 10, flex: "none", borderRadius: "50%", background: metalDot(o.v), boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }} />}
          {lbl(dim, o.v)}
        </span>
        <span style={{ fontSize: big ? 12.5 : 12, color: T.textMuted }}>{o.n}</span>
      </button>
    );
  };

  // Laptop panels: each choice is an outlined pill.
  const pill = (dim: string, o: { v: string; n: number }) => {
    const on = (sel[dim] || []).includes(o.v);
    return (
      <button key={o.v} type="button" onClick={() => toggle(dim, o.v)} className="erv2-pill" data-fopt aria-pressed={on}>
        <span className="erv2-pill-tick" aria-hidden="true"><svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5l3.2 3.2L11 1" stroke="currentColor" strokeWidth="1.1" /></svg></span>
        {dim === "metal" && <span className="erv2-pill-dot" style={{ background: metalDot(o.v) }} />}
        {lbl(dim, o.v)}<span className="erv2-pill-n">{o.n}</span>
      </button>
    );
  };

  // "Shown in": changes every photograph's gold colour; it does not filter.
  const shownIn = (big: boolean) => (
    <div role="radiogroup" aria-label="Show every ring in" style={{ display: "flex", alignItems: "center", gap: big ? 6 : 2 }}>
      {COLOURWAYS.map(c => {
        const on = c.id === colourway;
        return (
          <button key={c.id} type="button" role="radio" aria-checked={on} aria-label={`${c.label} gold`} title={c.label} className="wd-way" data-allway={c.id} onClick={() => pickAll(c.id as CW)}
            style={{ display: "flex", alignItems: "center", gap: 9, height: 40, padding: big ? "0 14px 0 6px" : "0 6px", cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 14, color: T.text }}>
            <span className="wd-way-dot" style={{ width: 16, height: 16, borderRadius: "50%", background: c.swatch }} />
            {big && c.label}
          </button>
        );
      })}
    </div>
  );

  const accordions = (
    <>
      <div style={{ padding: "18px 0 14px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, marginBottom: 4 }}>Shown in</div>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 6 }}>Changes the photographs, not the results</div>
        <div style={{ marginLeft: -6 }}>{shownIn(true)}</div>
      </div>
      {groups.map(dim => {
        const n = (sel[dim] || []).length;
        return (
          <div key={dim} style={{ borderBottom: `1px solid ${T.line}` }}>
            <button type="button" data-acc aria-expanded={!!open[dim]} onClick={() => setOpen(o => ({ ...o, [dim]: !o[dim] }))}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "17px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>
              <span>{DIM_LABEL[dim] || dim}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 9 }}>{n > 0 && <span style={{ fontSize: 12, color: T.textMuted }}>({n})</span>}<Chev /></span>
            </button>
            <div style={{ display: open[dim] ? "flex" : "none", flexDirection: "column", gap: 1, paddingBottom: 16 }}>
              {optsFor(dim).map(o => option(dim, o, true))}
            </div>
          </div>
        );
      })}
      {!selCats.length && <p style={{ margin: 0, padding: "16px 0 20px", fontSize: 13, lineHeight: 1.6, color: T.textMuted }}>Choose a style to filter by width and profile.</p>}
    </>
  );

  return (
    <div style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility" } as React.CSSProperties}>
      <style>{LISTING_CSS}</style>
      <style>{`
        .wd-way-dot { box-shadow: inset 0 0 0 1px rgba(0,0,0,0.07); transition: box-shadow 0.2s ease; }
        .wd-way[aria-checked="true"] .wd-way-dot { box-shadow: 0 0 0 3px ${GROUND}, 0 0 0 4px ${T.textMuted}; }
        @media (max-width: 900px){ .wd-sub { display: none; } }
      `}</style>

      <NavigationV2 solid />

      <div className="erv2" style={{ paddingTop: "var(--v2nav-h, 96px)" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: `clamp(30px,3.4vw,52px) ${PAGE_X} 16px`, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>
          <Link to="/">Home</Link><span>/</span><span style={{ color: T.text }}>Wedding rings</span>
        </div>

        <section className="erv2-head" style={{ padding: `0 ${PAGE_X} clamp(34px,3.8vw,56px)`, textAlign: "center" }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(28px, 3.2vw, 44px)", lineHeight: 1.15, margin: "0 0 16px", color: T.text }}>Wedding rings</h1>
          <div className="wd-intro" style={{ margin: "0 auto", maxWidth: "58ch", fontSize: 15.5, lineHeight: 1.7, color: T.text }}>
            <p style={{ margin: 0 }}>From the simplicity of a classic wedding band to more distinctive designs, explore a wide selection of profiles, widths and stone settings.</p>
            <p style={{ margin: "10px 0 0" }}>Whether your preference is timeless and understated or something more individual, our aim is to help you find a ring that feels perfectly suited to you.</p>
          </div>
        </section>

        {/* Phone row: Filter / count / Sort */}
        <div className="erv2-triggerbar" style={{ position: "sticky", top: "calc(var(--v2nav-h, 101px) - 1px)", zIndex: 40, background: GROUND, padding: `0 ${PAGE_X}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
            <button type="button" className="erv2-mbtn" data-sheetbtn="filter" onClick={() => setSheet(true)} style={{ justifySelf: "start" }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M0 3h16M0 9h16" stroke="currentColor" strokeWidth="1" /><circle cx="5" cy="3" r="2" fill={GROUND} stroke="currentColor" strokeWidth="1" /><circle cx="11" cy="9" r="2" fill={GROUND} stroke="currentColor" strokeWidth="1" /></svg>
              Filter{chips.length > 0 && <span style={{ color: T.textMuted }}>({chips.length})</span>}
            </button>
            <span style={{ fontSize: 12.5, color: T.textMuted }}>{countText}</span>
            <button type="button" className="erv2-mbtn" data-sheetbtn="sort" onClick={() => setSortSheet(true)} style={{ justifySelf: "end" }}>Sort<Chev /></button>
          </div>
        </div>

        <div>
          {/* Laptop filter row */}
          <div ref={barRef} className={`erv2-bar${panel ? " has-open" : ""}`} style={{ position: "sticky", top: "calc(var(--v2nav-h, 113px) - 1px)", zIndex: 30, background: GROUND, padding: `0 ${PAGE_X}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.6vw, 44px)" }}>
                {groups.map(dim => {
                  const n = (sel[dim] || []).length;
                  return (
                    <button key={dim} type="button" className="erv2-fbtn" data-fbtn={dim} aria-expanded={panel === dim} onClick={() => setPanel(v => v === dim ? null : dim)}>
                      {DIM_LABEL[dim] || dim}{n > 0 && <span style={{ color: T.textMuted }}>({n})</span>}<Chev />
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(18px, 2.2vw, 36px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Shown in</span>
                  {shownIn(false)}
                </div>
                <span style={{ fontSize: 12.5, color: T.textMuted }}>{countText}</span>
                <button type="button" className="erv2-fbtn" data-fbtn="sort" aria-expanded={panel === "sort"} onClick={() => setPanel(v => v === "sort" ? null : "sort")}>
                  Sort<span style={{ color: T.textMuted, textTransform: "none", letterSpacing: 0, fontSize: 12.5 }}>{sortLabel}</span><Chev />
                </button>
              </div>
            </div>
            {groups.map(dim => (
              <div key={dim} data-fpanel={dim} className={`erv2-panel${panel === dim ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
                <div className="erv2-pills">{optsFor(dim).map(o => pill(dim, o))}</div>
                <div className="erv2-panel-foot">
                  <span style={{ fontSize: 13, color: T.textMuted }}>{dim === "category" && !selCats.length ? "Choose a style to filter by width and profile." : ""}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.4vw, 36px)" }}>
                    {(sel[dim] || []).length > 0 && <button type="button" className="is-quiet" onClick={() => { setSel(s => ({ ...s, [dim]: [] })); setShown(PAGE_SIZE); }}>Clear</button>}
                    <button type="button" data-fclose onClick={() => setPanel(null)}>Show {grouped.length} {noun(grouped.length)}</button>
                  </span>
                </div>
              </div></div></div>
            ))}
            <div data-fpanel="sort" className={`erv2-panel${panel === "sort" ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
              <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "4px clamp(22px, 2.6vw, 40px)" }}>
                {SORTS.map(o => (
                  <button key={o.value} type="button" className="erv2-sortopt" aria-pressed={sort === o.value} onClick={() => { setSort(o.value); setShown(PAGE_SIZE); setPanel(null); }}
                    style={{ padding: "8px 0 5px", cursor: "pointer", background: "transparent", border: 0, borderBottom: `1px solid ${sort === o.value ? T.text : "transparent"}`, fontFamily: FONT_BODY, fontSize: 14, color: sort === o.value ? T.text : T.textMuted }}>{o.label}</button>
                ))}
              </div>
            </div></div></div>
          </div>

          <div className={`erv2-scrim${panel ? " is-on" : ""}`} data-scrim onClick={() => setPanel(null)} aria-hidden="true" />

          <main ref={mainRef} style={{ padding: `0 ${PAGE_X} clamp(64px,6vw,104px)` }} className="erv2-main">
            <div className="erv2-meta" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: chips.length ? 24 : 0 }}>
              {chips.map((c, i) => (
                <button key={i} type="button" onClick={() => toggle(c.dim, c.val)} className="erv2-chip"
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", cursor: "pointer", background: "transparent", border: `1px solid ${T.line}`, fontFamily: FONT_BODY, fontSize: 12, color: T.text }}>
                  {c.label}<span aria-hidden="true" style={{ color: T.textMuted }}>×</span>
                </button>
              ))}
              {chips.length > 0 && <button type="button" className="erv2-clear" onClick={clearAll} style={{ marginLeft: 8, padding: "7px 0", cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 12, color: T.textMuted, textDecoration: "underline", textUnderlineOffset: 4 }}>Clear all</button>}
            </div>

            {loading ? (
              <div style={{ display: "grid", gap: "clamp(28px,3vw,44px) clamp(16px,1.6vw,28px)", marginTop: 32 }} className="erv2-grid">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ aspectRatio: "1 / 1.1", background: TILE }} />)}
              </div>
            ) : grouped.length === 0 ? (
              <div style={{ padding: "clamp(72px, 9vw, 130px) 0 40px", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(21px, 2vw, 27px)", color: T.text, marginBottom: 12 }}>No rings match those choices</div>
                <p style={{ margin: "0 auto 10px", maxWidth: "40ch", fontSize: 15, lineHeight: 1.7, color: T.text }}>Clear a filter or two, or tell us what you have in mind and we will make it.</p>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px clamp(20px, 3vw, 40px)" }}>
                  <button type="button" onClick={clearAll} className="erv2-textlink" style={{ cursor: "pointer", background: "transparent", borderTop: 0, borderLeft: 0, borderRight: 0, fontFamily: FONT_BODY, color: T.text }}>Clear all filters</button>
                  <Link to="/bespoke-design" className="erv2-textlink" style={{ color: T.text }}>Have one made</Link>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "clamp(28px,3vw,44px) clamp(16px,1.6vw,28px)", marginTop: 32 }} className="erv2-grid">
                {visible.map(d => {
                  const way = cardWay(d);
                  const img = weddingVariant(heroFor(d, way), "tile");
                  const href = `/wedding-rings/${encodeURIComponent(d.id)}`;
                  const isSaved = saved.includes(d.id);
                  const ways = COLOURWAYS.filter(c => d.colourways.includes(c.id) && d.hero[c.id as CW]);
                  return (
                    <div key={d.id} className="erv2-card" style={{ position: "relative" }}>
                      <Link to={href} onClick={rememberScroll} style={{ display: "block" }}>
                        <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: TILE, overflow: "hidden" }}>
                          {img
                            ? <img key={img} src={img} alt={`${d.name} wedding ring in ${COLOURWAYS.find(c => c.id === way)?.label.toLowerCase()} gold`} className="erv2-blend erv2-main-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                            : <RingTile way={way} name={d.name} />}
                          <span className="erv2-add">Choose options</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginTop: 14, fontSize: 14.5, color: T.text }}>
                          <span>{d.name}</span>{d.priceFrom != null && <span style={{ color: T.textMuted, whiteSpace: "nowrap" }}>From {money(d.priceFrom)}</span>}
                        </div>
                        <div className="wd-sub" style={{ marginTop: 4, fontSize: 13, color: T.textMuted }}>{d.category}{d._widths > 1 ? ` · ${d._widths} widths` : ""}</div>
                      </Link>
                      {ways.length > 1 && (
                        <div role="group" aria-label={`${d.name}: show in`} className="erv2-dots" style={{ display: "flex", marginTop: 2, marginLeft: -9 }}>
                          {ways.map(c => (
                            <button key={c.id} type="button" className="erv2-dot" data-way={c.id} title={c.label} aria-label={`Show ${d.name} in ${c.label.toLowerCase()} gold`} aria-pressed={c.id === way}
                              data-img={weddingVariant(d.hero[c.id as CW], "tile") || undefined}
                              onClick={() => setCardPick(p => ({ ...p, [d.id]: c.id as CW }))}
                              style={{ width: 32, height: 34, padding: 0, border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ width: 14, height: 14, borderRadius: "50%", background: c.swatch }} />
                            </button>
                          ))}
                        </div>
                      )}
                      <button type="button" className="erv2-save" aria-pressed={isSaved} aria-label={isSaved ? `Remove ${d.name} from saved` : `Save ${d.name}`}
                        onClick={() => setSaved(s => isSaved ? s.filter(n => n !== d.id) : [...s, d.id])}
                        style={{ position: "absolute", top: 6, right: 6, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: 0, color: T.text }}>
                        <svg width="20" height="18" viewBox="0 0 20 18" fill={isSaved ? "currentColor" : "none"} aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.7 2.8-2.7 4.6-2.7C17 1.4 19 3.3 19 5.9c0 3.7-3.6 6.8-9 10.7z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {!loading && grouped.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: "clamp(40px, 4vw, 64px)" }}>
                <span style={{ fontSize: 12.5, color: T.textMuted }}>Showing {visible.length} of {grouped.length} {noun(grouped.length)}</span>
                <span aria-hidden="true" style={{ width: 160, height: 1, background: T.line, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, top: 0, height: 1, background: T.text, width: `${Math.min(100, (visible.length / grouped.length) * 100)}%` }} />
                </span>
                {visible.length < grouped.length && (
                  <button type="button" className="erv2-more" onClick={() => setShown(n => n + PAGE_SIZE)}
                    style={{ marginTop: 10, padding: "15px 34px", cursor: "pointer", background: "transparent", border: `1px solid ${T.text}`, fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Show more designs</button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Phone filter sheet */}
      <div data-sheet="filter" style={{ position: "fixed", inset: 0, zIndex: 80, display: sheet ? "flex" : "none", flexDirection: "column", justifyContent: "flex-end" }}>
        <div data-sheetclose onClick={() => setSheet(false)} style={{ position: "absolute", inset: 0, background: "rgba(28,26,23,0.38)" }} />
        <div style={{ position: "relative", background: GROUND, maxHeight: "86vh", display: "flex", flexDirection: "column", animation: "erv2SheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 24px", borderBottom: `1px solid ${T.line}` }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 21, color: T.text }}>Filter</span>
            <button type="button" data-sheetclose onClick={() => setSheet(false)} aria-label="Close" className="erv2-x">{XICON}</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>{accordions}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, padding: "14px 24px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.line}` }}>
            <button type="button" onClick={clearAll} style={{ padding: "16px 0", background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, textDecoration: "underline", textUnderlineOffset: 5, textDecorationColor: T.ruleStrong }}>Clear all</button>
            <button type="button" data-sheetclose onClick={() => setSheet(false)} style={{ padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Show {grouped.length} {noun(grouped.length)}</button>
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
            {SORTS.map(o => (
              <button key={o.value} type="button" data-sheetclose onClick={() => { setSort(o.value); setShown(PAGE_SIZE); setSortSheet(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "17px 0", background: "none", border: 0, borderBottom: `1px solid ${T.line}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, color: sort === o.value ? T.text : T.textMuted }}>
                {o.label}{sort === o.value && <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true"><path d="M1 5l4 4 8-8" stroke={T.gold} strokeWidth="1.25" /></svg>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <FooterV2 />
    </div>
  );
};

export default WeddingListingV2;
