import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { useIsMobile } from "../hooks/use-mobile";
import API_BASE_URL from "../config/api";

/**
 * Wedding rings — configurator listing, wired to the Allied Gold catalogue
 * (migration 019, /api/v1/wedding/designs). One card per DESIGN, "from £X", a variation
 * count, three colourway dots that preview that card only, plus a rail colourway row that
 * restyles every card without filtering. Filters are scoped by the chosen category. Prices
 * are indicative trade prices (captured 24 Aug 2026), confirmed at order.
 *
 * The 12th-handoff demo data lives in data/weddingDesigns.ts and is no longer used here.
 */

const NAV_H = 96;
const CAT_ORDER = ["Classic", "Diamond Cut", "Two Colour", "Diamond Set", "Shaped", "Cluster"];
// Dimensions offered as scoped filters (metal is a base group; weight/carat live on the PDP).
const SCOPED_DIMS = ["width", "profile", "quality", "origin", "collection", "shape"];
const DIM_LABEL: Record<string, string> = {
  metal: "Metal", width: "Width", profile: "Profile", quality: "Stone quality",
  origin: "Stone origin", collection: "Collection", shape: "Stone shape", weight: "Weight", carat: "Carat",
};
const COLOURWAYS = [
  { id: "Y", label: "Yellow", swatch: "#DFB23F" },
  { id: "W", label: "White", swatch: "#E1DFDA" },
  { id: "R", label: "Rose", swatch: "#DF9F7B" },
] as const;
type CW = "Y" | "W" | "R";

const money = (n: number | null | undefined) => (n == null ? "" : "£" + Math.round(n).toLocaleString("en-GB"));
// Listing has no single metal, so drop the "in {metal}" clause and any leftover tokens.
const cleanDesc = (s?: string) => (s || "").replace(/,?\s*in \{metal\}/gi, "").replace(/\{[^}]+\}/g, "").replace(/\s+/g, " ").replace(/\s+\./g, ".").trim();
const swatchFor = (id: string) => COLOURWAYS.find(c => c.id === id)?.swatch || "#E1DFDA";

interface ApiDesign {
  id: string; category: string; name: string; family: string; description: string;
  variations: number; priceFrom: number | null; priceTo: number | null; currency: string;
  colourways: string[]; hero: { Y: string | null; W: string | null; R: string | null };
  hasSpin: boolean; facets: Record<string, string[]>;
}

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
      <span style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", fontFamily: FONT_DISPLAY, fontSize: 13, color: "#8C8375" }}>{name}</span>
    </div>
  );
};

const WeddingListingV2 = (): JSX.Element => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [designs, setDesigns] = useState<ApiDesign[]>([]);
  const [labels, setLabels] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [colourway, setColourway] = useState<CW>("W");
  const [cardPreview, setCardPreview] = useState<Record<string, CW>>({});
  const [cardPick, setCardPick] = useState<Record<string, CW>>({});
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState("Featured");
  const [shown, setShown] = useState(9);
  const [pair, setPair] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ category: true, metal: false });
  const [saved, setSaved] = useState<string[]>([]);
  const [railOpen, setRailOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/wedding/designs`)
      .then(r => r.json())
      .then(d => { if (alive && d.success) { setDesigns(d.designs || []); setLabels(d.labels || {}); } })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  // Position restore
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || loading) return;
    restored.current = true;
    try {
      const y = Number(sessionStorage.getItem("mcc-wr-scroll"));
      const sh = Number(sessionStorage.getItem("mcc-wr-shown"));
      sessionStorage.removeItem("mcc-wr-scroll"); sessionStorage.removeItem("mcc-wr-shown");
      if (sh > 9) setShown(sh);
      if (y > 0) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, y)));
    } catch { /* ignore */ }
  }, [loading]);

  useEffect(() => { document.body.style.overflow = railOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [railOpen]);

  const cats = useMemo(() => CAT_ORDER.filter(c => designs.some(d => d.category === c)), [designs]);
  const catCount = (c: string) => designs.filter(d => d.category === c).length;

  const selCats = sel.category || [];
  // Scoped dims: dimensions (other than metal) with ≥2 distinct values across the chosen categories.
  const scopedDims = useMemo(() => {
    if (!selCats.length) return [] as string[];
    const pool = designs.filter(d => selCats.includes(d.category));
    return SCOPED_DIMS.filter(dim => {
      const vals = new Set<string>(); pool.forEach(d => (d.facets[dim] || []).forEach(v => vals.add(v)));
      return vals.size >= 2;
    });
  }, [designs, selCats]);

  const valuesFor = (dim: string): string[] => {
    const relevant = dim === "metal" || dim === "category" ? designs : designs.filter(d => !selCats.length || selCats.includes(d.category));
    if (dim === "category") return cats;
    const set = new Set<string>(); relevant.forEach(d => (d.facets[dim] || []).forEach(v => set.add(v)));
    return Array.from(set).sort((a, b) => (parseFloat(a) - parseFloat(b)) || a.localeCompare(b));
  };
  const lbl = (dim: string, v: string) => (dim === "category" ? v : labels[dim]?.[v] || v);

  const passes = (d: ApiDesign, s: Record<string, string[]>, skip?: string): boolean => {
    if (skip !== "category" && (s.category?.length) && !s.category.includes(d.category)) return false;
    for (const dim of ["metal", ...SCOPED_DIMS]) {
      if (skip === dim) continue;
      const want = s[dim]; if (!want || !want.length) continue;
      const have = d.facets[dim] || [];
      if (!want.some(v => have.includes(v))) return false;
    }
    return true;
  };

  const list = useMemo(() => {
    let l = designs.filter(d => passes(d, sel));
    if (sort === "Newest") l = [...l].reverse();
    return l;
  }, [designs, sel, sort]); // eslint-disable-line

  const visible = list.slice(0, shown);

  const cardWay = (d: ApiDesign): CW => {
    const w = cardPreview[d.id] || cardPick[d.id] || colourway;
    return (d.colourways.includes(w) ? w : (d.colourways[0] as CW)) || "W";
  };
  const heroFor = (d: ApiDesign, way: CW) => d.hero[way] || d.hero.W || d.hero.Y || d.hero.R;

  const clearAll = () => { setSel({}); setShown(9); };
  const toggle = (dim: string, val: string) => { setSel(s => { const cur = s[dim] || []; return { ...s, [dim]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] }; }); setShown(9); };

  const activeDims = ["category", "metal", ...SCOPED_DIMS];
  const chips = activeDims.flatMap(dim => (sel[dim] || []).map(v => ({ dim, label: lbl(dim, v) })));
  const anyChips = chips.length > 0;

  const countFor = (dim: string, v: string) => designs.filter(d => passes(d, { ...sel, [dim]: [v] })).length;

  const eyebrow: React.CSSProperties = { fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8377" };
  const rememberScroll = () => { try { sessionStorage.setItem("mcc-wr-scroll", String(window.scrollY)); sessionStorage.setItem("mcc-wr-shown", String(shown)); } catch { /* ignore */ } };
  const goTo = (d: ApiDesign) => { rememberScroll(); navigate(`/wedding-rings/${encodeURIComponent(d.id)}`); };

  const FilterGroup = ({ dim }: { dim: string }) => {
    const on = sel[dim] || [];
    const isOpen = !!open[dim];
    const vals = valuesFor(dim);
    return (
      <div style={{ borderTop: `1px solid ${T.rule}` }}>
        <button type="button" onClick={() => setOpen(o => ({ ...o, [dim]: !o[dim] }))}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "15px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY }}>
          <span style={{ display: "flex", alignItems: "baseline", gap: 9, fontSize: 13, color: T.ink }}>{DIM_LABEL[dim] || dim}{on.length > 0 && <span style={{ fontSize: 10.5, color: T.gold }}>{on.length}</span>}</span>
          <span style={{ fontSize: 14, color: T.gold, transition: "transform 0.28s ease", transform: isOpen ? "rotate(45deg)" : "none" }}>+</span>
        </button>
        {isOpen && (
          <div style={{ display: "flex", flexDirection: "column", paddingBottom: 14, animation: "wlGroupIn 0.24s ease both" }}>
            {vals.map(v => {
              const isSel = on.includes(v);
              return (
                <button key={v} type="button" onClick={() => toggle(dim, v)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY }}>
                  <span style={{ flex: "none", width: 15, height: 15, background: isSel ? T.ink : "transparent", border: `1px solid ${isSel ? T.ink : T.ruleStrong}` }} />
                  <span style={{ flex: 1, fontSize: 13, color: isSel ? T.ink : T.body }}>{lbl(dim, v)}</span>
                  <span style={{ fontSize: 11, color: "#A9A196" }}>{countFor(dim, v)}</span>
                </button>
              );
            })}
            {vals.length === 0 && <span style={{ fontSize: 12, color: "#A9A196", padding: "4px 0" }}>—</span>}
          </div>
        )}
      </div>
    );
  };

  const scopeLabel = selCats.length === 1
    ? ({ Classic: "Plain bands", "Diamond Cut": "Patterned bands", "Two Colour": "Patterned bands", "Diamond Set": "Stone-set bands", Shaped: "Shaped bands", Cluster: "Stone-set bands" } as Record<string, string>)[selCats[0]] || selCats[0]
    : "Selected categories";

  const rail = (
    <>
      <div style={{ paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ ...eyebrow, marginBottom: 4 }}>Colourway</div>
        <div style={{ fontSize: 11.5, lineHeight: 1.55, color: "#A9A196", marginBottom: 14 }}>Changes the photographs, not the results</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }} role="radiogroup" aria-label="Colourway">
          {COLOURWAYS.map(c => {
            const isOn = c.id === colourway;
            return (
              <button key={c.id} type="button" role="radio" aria-checked={isOn} onClick={() => { setColourway(c.id as CW); setCardPreview({}); setCardPick({}); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "11px 4px 9px", cursor: "pointer", fontFamily: FONT_BODY, background: isOn ? T.tint : "transparent", border: `1px solid ${isOn ? T.ink : T.ruleSoft}` }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: c.swatch, border: "1px solid rgba(28,26,23,0.18)", boxShadow: "inset 0 -3px 5px rgba(28,26,23,0.14)" }} />
                <span style={{ fontSize: 10.5, color: isOn ? T.ink : T.muted }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, padding: "20px 0 12px" }}>
        <div>
          <div style={eyebrow}>Refine</div>
          <div style={{ fontSize: 11.5, color: "#A9A196", marginTop: 4 }}>{scopedDims.length ? "Filters for " + scopeLabel.toLowerCase() : "Choose a category for more"}</div>
        </div>
        <button type="button" onClick={clearAll} style={{ padding: 0, cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 11, color: anyChips ? T.gold : "#C4BCB0" }}>Clear</button>
      </div>

      <FilterGroup dim="category" />
      <FilterGroup dim="metal" />

      {scopedDims.length > 0 && (
        <div key={selCats.join("|")} style={{ animation: "wlRevealIn 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "16px 0 12px", borderTop: `1px solid ${T.rule}` }}>
            <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: T.gold }}>{scopeLabel}</span>
          </div>
          {scopedDims.map(dim => <FilterGroup key={dim} dim={dim} />)}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${T.rule}`, marginTop: 4, paddingTop: 20 }}>
        <button type="button" onClick={() => setPair(p => !p)}
          style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", padding: "18px 18px 16px", cursor: "pointer", textAlign: "left", fontFamily: FONT_BODY, background: pair ? T.tint : "transparent", border: `1px solid ${pair ? T.ruleStrong : T.rule}` }}>
          <span style={{ flex: "none", marginTop: 2, width: 15, height: 15, background: pair ? T.ink : "transparent", border: `1px solid ${pair ? T.ink : T.ruleStrong}` }} />
          <span style={{ display: "block" }}>
            <span style={{ display: "block", fontSize: 13, color: pair ? T.ink : "#332F2A", marginBottom: 6 }}>Shop as a pair</span>
            <span style={{ display: "block", fontSize: 11.5, lineHeight: 1.55, color: pair ? T.muted : "#8A8377" }}>Show ladies and gents widths together, priced as two</span>
          </span>
        </button>
      </div>
    </>
  );

  const SORTS = ["Featured", "Newest"];

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        .wl a { color: inherit; text-decoration: none; }
        .wl-card-link:hover .wl-name { color: ${T.gold}; }
        .wl-more:hover { background: ${T.ink}; color: ${T.paper}; border-color: ${T.ink} !important; }
        .wl-range { -webkit-appearance:none; appearance:none; width:100%; height:1px; background:${T.ruleStrong}; outline:none; }
        .wl-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:15px; height:15px; border-radius:50%; background:${T.ink}; cursor:pointer; }
        .wl-range::-moz-range-thumb { width:15px; height:15px; border:0; border-radius:50%; background:${T.ink}; cursor:pointer; }
        .wl-card img { transition: transform 0.5s ease; }
        .wl-card:hover img { transform: scale(1.04); }
        @keyframes wlRevealIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        @keyframes wlGroupIn { from { opacity:0; } to { opacity:1; } }
        @keyframes wlCardIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes wlSheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @media (max-width: 900px){
          .wl-main{ grid-template-columns: 1fr !important; }
          .wl-aside-desktop{ display:none !important; }
          .wl-grid{ grid-template-columns: repeat(2,1fr) !important; gap:14px !important; }
          .wl-mobile-refine{ display:flex !important; }
        }
        @media (max-width: 560px){ .wl-grid{ grid-template-columns: 1fr !important; } }
      `}</style>

      <NavigationV2 solid />

      <div className="wl" style={{ paddingTop: NAV_H }}>
        <section style={{ padding: "clamp(30px,4vw,60px) clamp(24px,3vw,52px) clamp(22px,3vw,36px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1.2fr) minmax(0,0.8fr)", gap: "clamp(24px,4vw,72px)", alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8377", marginBottom: 20 }}>
                <Link to="/">Home</Link><span style={{ color: T.ruleStrong }}>/</span><span style={{ color: T.ink }}>Wedding rings</span>
              </div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(40px,5vw,78px)", lineHeight: 1.02, letterSpacing: "0.005em", margin: 0, maxWidth: "16ch" }}>Bands made for wearing.</h1>
            </div>
            <p style={{ margin: "0 0 6px", maxWidth: "42ch", fontSize: 15, lineHeight: 1.75, color: T.body }}>{designs.length ? `${designs.length.toLocaleString()} designs` : "Our full collection"}, each made to your width, profile and weight in up to thirteen metals. Every design is shown once — choose the colourway on the left to see them in yellow, white or rose.</p>
          </div>
        </section>

        <div className="wl-mobile-refine" style={{ display: "none", position: "sticky", top: 78, zIndex: 40, gridTemplateColumns: "1fr", background: T.paper, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
          <button type="button" onClick={() => setRailOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px 0", background: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>
            Refine &amp; colourway{anyChips && <span style={{ minWidth: 18, height: 18, borderRadius: 9, background: T.gold, color: "#fff", fontSize: 10.5, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{chips.length}</span>}
          </button>
        </div>

        <main className="wl-main" style={{ display: "grid", gridTemplateColumns: "246px minmax(0,1fr)", gap: "clamp(28px,3.5vw,60px)", padding: "0 clamp(24px,3vw,52px) clamp(56px,6vw,88px)", alignItems: "start" }}>
          <aside className="wl-aside-desktop" style={{ position: "sticky", top: NAV_H + 12 }}>{rail}</aside>

          <div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 16, paddingBottom: 14, borderBottom: `1px solid ${T.rule}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <span style={{ fontSize: 13, color: T.ink }}>{loading ? "Loading…" : (list.length === 1 ? "1 design" : list.length.toLocaleString() + " designs")}</span>
                <span style={{ fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A9A196" }}>shown in {COLOURWAYS.find(c => c.id === colourway)?.label.toLowerCase()}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#A9A196", marginRight: 8 }}>Sort</span>
                {SORTS.map(x => (
                  <button key={x} type="button" onClick={() => { setSort(x); setShown(9); }}
                    style={{ padding: "7px 11px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, color: x === sort ? T.ink : "#8A8377", background: x === sort ? T.tint : "transparent", border: 0 }}>{x}</button>
                ))}
              </div>
            </div>

            {anyChips && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, padding: "14px 0 0" }}>
                {chips.map((c, i) => (
                  <button key={i} type="button" onClick={() => toggle(c.dim, (sel[c.dim] || []).find(v => lbl(c.dim, v) === c.label) || c.label)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, color: "#332F2A", background: T.tint, border: 0 }}>
                    <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#A9A196" }}>{DIM_LABEL[c.dim] || c.dim}</span>{c.label}<span style={{ color: "#8A8377" }}>×</span>
                  </button>
                ))}
                <button type="button" onClick={clearAll} style={{ padding: "8px 10px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, color: T.gold, background: "transparent", border: 0 }}>Clear all</button>
              </div>
            )}

            {pair && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20, marginTop: 22, padding: "20px 24px", background: T.tint }}>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, lineHeight: 1.2, marginBottom: 6 }}>Priced as a pair</div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.6, color: T.body, maxWidth: "58ch" }}>Each design shown with a ladies and a gents width, cut and finished together so the pair matches. Bands ordered together are engraved at no charge.</div>
                </div>
                <Link to="/contact" style={{ flex: "none", padding: "13px 22px", background: T.ink, color: T.paper, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase" }}>Book a fitting for two</Link>
              </div>
            )}

            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "clamp(18px,2vw,34px)", marginTop: 30 }} className="wl-grid">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ aspectRatio: "4 / 5", background: T.tint }} />)}
              </div>
            ) : list.length > 0 ? (
              <>
                <div key={colourway + sort + pair} className="wl-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "clamp(18px,2vw,34px)", marginTop: 30, animation: "wlCardIn 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
                  {visible.map(d => {
                    const way = cardWay(d);
                    const hero = heroFor(d, way);
                    const isSaved = saved.includes(d.id);
                    return (
                      <div key={d.id}>
                        <div className="wl-card" style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden" }}>
                          <button type="button" onClick={() => goTo(d)} aria-label={d.name} style={{ position: "absolute", inset: 0, display: "block", padding: 0, cursor: "pointer", background: "transparent", border: 0 }}>
                            {hero ? <img src={hero} alt={d.name} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <RingTile way={way} name={d.name} />}
                          </button>
                          <button type="button" onClick={() => setSaved(s => isSaved ? s.filter(n => n !== d.id) : [...s, d.id])} aria-label={isSaved ? "Saved" : "Save"} aria-pressed={isSaved}
                            style={{ position: "absolute", top: 8, right: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(248,246,240,0.92)", border: 0, fontSize: 15, lineHeight: 1, color: isSaved ? T.gold : "#8A8377" }}>{isSaved ? "♥" : "♡"}</button>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14 }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            {COLOURWAYS.filter(c => d.colourways.includes(c.id)).map(c => (
                              <button key={c.id} type="button" aria-label={`${d.name} in ${c.label.toLowerCase()}`} title={c.label} aria-pressed={c.id === (cardPick[d.id] || colourway)}
                                onMouseEnter={() => setCardPreview(p => ({ ...p, [d.id]: c.id as CW }))}
                                onMouseLeave={() => setCardPreview(p => { const n = { ...p }; delete n[d.id]; return n; })}
                                onClick={() => setCardPick(p => ({ ...p, [d.id]: c.id as CW }))}
                                style={{ width: 16, height: 16, padding: 0, cursor: "pointer", borderRadius: "50%", background: c.swatch, border: `1px solid ${c.id === way ? T.ink : "rgba(28,26,23,0.18)"}`, boxShadow: "inset 0 -2px 4px rgba(28,26,23,0.14)", transition: "border-color 0.2s ease" }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A9A196" }}>{d.category}</span>
                        </div>

                        <button type="button" onClick={() => goTo(d)} className="wl-card-link" style={{ display: "block", width: "100%", marginTop: 10, padding: 0, textAlign: "left", background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY }}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 7 }}>
                            <span className="wl-name" style={{ fontSize: 14.5, color: T.ink, transition: "color 0.2s ease" }}>{d.name}</span>
                            {d.priceFrom != null && <span style={{ fontSize: 13.5, whiteSpace: "nowrap", color: "#56534D" }}>from {money(d.priceFrom)}</span>}
                          </div>
                          {cleanDesc(d.description) && <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.muted }}>{cleanDesc(d.description)}</div>}
                          <div style={{ fontSize: 11.5, color: "#8A8377", marginTop: 6 }}>{pair ? "Ladies and gents widths" : (d.variations || 1).toLocaleString("en-GB") + " variations · " + (d.colourways.length) + " colourways"}</div>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: "clamp(40px,4vw,64px)", paddingTop: "clamp(28px,3vw,44px)", borderTop: `1px solid ${T.rule}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", maxWidth: 280 }}>
                    <span style={{ flex: 1, height: 2, background: T.rule, display: "block" }}>
                      <span style={{ display: "block", width: (list.length ? Math.round((visible.length / list.length) * 100) : 100) + "%", height: 2, background: T.gold }} />
                    </span>
                  </div>
                  <div style={{ fontSize: 12, letterSpacing: "0.06em", color: "#8A8377" }}>Showing {visible.length} of {list.length.toLocaleString()} {list.length === 1 ? "design" : "designs"}</div>
                  {visible.length < list.length ? (
                    <button type="button" className="wl-more" onClick={() => setShown(s => s + 9)} style={{ padding: "15px 32px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink, background: "transparent", border: `1px solid ${T.ruleStrong}` }}>Show 9 more</button>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                      <div style={{ fontSize: 12.5, color: "#8A8377" }}>That is every design in this selection.</div>
                      <Link to="/bespoke-design" style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", paddingBottom: 4, borderBottom: `1px solid ${T.ruleStrong}` }}>Have one made instead</Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ marginTop: 30, padding: "clamp(52px,5vw,84px) clamp(28px,3vw,48px)", background: T.tint }}>
                <div style={{ maxWidth: "48ch" }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>No matches</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(26px,2.8vw,40px)", lineHeight: 1.1, marginBottom: 16 }}>Nothing matches those filters.</div>
                  <p style={{ margin: "0 0 26px", fontSize: 14.5, lineHeight: 1.75, color: T.body }}>Clear a filter or two, or tell us what you have in mind and we will make it.</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button type="button" onClick={clearAll} style={{ padding: "14px 26px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0 }}>Clear every filter</button>
                    <Link to="/bespoke-design" style={{ padding: "14px 26px", border: `1px solid ${T.ruleStrong}`, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>Have one made</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <section style={{ background: T.ink, color: T.onDarkSoft, padding: "clamp(52px,5vw,88px) clamp(24px,3vw,52px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1.4fr)", gap: "clamp(28px,5vw,80px)", alignItems: "center", paddingBottom: "clamp(32px,3.4vw,52px)", borderBottom: `1px solid ${T.ruleDark}` }}>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>Before you choose</div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(28px,3vw,44px)", lineHeight: 1.12, margin: 0, maxWidth: "15ch", color: "#FFFFFF" }}>A band is worn every day for fifty years.</h2>
            </div>
            <p style={{ margin: 0, maxWidth: "46ch", fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>Which is why width, profile and weight matter more than the photograph. A 6mm band feels quite different from a 3mm one, and a heavy court holds its shape where a light flat band will not. Come and try them on if you can.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)" }}>
            {[
              { n: "I", title: "Width changes everything", note: "A 6mm band covers twice the finger a 3mm one does. If you have never worn a ring, start narrower than you think.", meta: "Try three widths" },
              { n: "II", title: "Profile is comfort", note: "Court profiles curve inside as well as out, which is why they disappear on the hand. Flat bands read sharper.", meta: "Court for daily wear" },
              { n: "III", title: "Weight is longevity", note: "A heavy band resists going out of round. On anything above 5mm we would not recommend the lightest weight.", meta: "Medium or above" },
            ].map((a, i) => (
              <div key={a.n} style={{ display: "flex", flexDirection: "column", height: "100%", padding: "clamp(28px,2.6vw,40px) clamp(18px,2.2vw,36px) 0 0", borderRight: (!isMobile && i !== 2) ? `1px solid ${T.ruleDark}` : "none" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(26px,2.2vw,34px)", lineHeight: 1, color: T.gold, marginBottom: 18 }}>{a.n}</div>
                <div style={{ fontSize: 15, color: "#FFFFFF", marginBottom: 10 }}>{a.title}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: T.onDarkMuted, marginBottom: 20 }}>{a.note}</div>
                <div style={{ marginTop: "auto", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6259" }}>{a.meta}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {railOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setRailOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.45)" }} />
          <div style={{ position: "relative", background: T.paper, maxHeight: "88vh", display: "flex", flexDirection: "column", animation: "wlSheetIn 0.32s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${T.rule}` }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20 }}>Refine</span>
              <button onClick={() => setRailOpen(false)} aria-label="Close" style={{ background: "none", border: 0, cursor: "pointer", fontSize: 24, lineHeight: 1, color: T.ink }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 0" }}>{rail}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, padding: "14px 20px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.rule}` }}>
              <button onClick={clearAll} style={{ padding: "15px 0", background: "transparent", border: `1px solid ${T.ruleStrong}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink }}>Clear</button>
              <button onClick={() => setRailOpen(false)} style={{ padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Show {list.length.toLocaleString()} designs</button>
            </div>
          </div>
        </div>
      )}

      <FooterV2 />
    </div>
  );
};

export default WeddingListingV2;
