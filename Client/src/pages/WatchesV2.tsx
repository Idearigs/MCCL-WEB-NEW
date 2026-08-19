import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useIsMobile } from "../hooks/use-mobile";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * WatchesV2 — the watch listing.
 * VISUAL design: design_handoff_mcculloch_signin_chat_watches (Watches). Watch-specific
 * announcement bar, title band, three house cards, a filter rail whose axes are the ones
 * a watch buyer uses (brand / movement / case size / strap + price), a grid with stock
 * state, and a servicing band on ink.
 *
 * WIRED to the real catalogue: GET /watches (945 references across Festina/Roamer/Briston).
 * DATA NOTE: the API cleanly carries brand, price, image and stock. Movement is populated
 * on only ~1 in 6 records and strap is not a field, so both are INFERRED from the name +
 * description (unknown movement defaults to Quartz — the overwhelming majority). Case size
 * comes from specifications.case_diameter, bucketed to ranges and ignoring implausible
 * values (the field carries some data-entry noise). Filter counts exclude their own group,
 * matching the ring listing.
 */

const M2 = "#8A8377";
const GREEN = "#4A7A52";
const HOUSE_META: Record<string, { since: string; note: string; to: string }> = {
  Festina: { since: "Spain, 1902", note: "Sports chronographs and clean everyday steel, at prices that do not ask you to think twice.", to: "/festina" },
  Roamer: { since: "Switzerland, 1888", note: "Swiss made, quietly traditional. Automatics and skeletons that read older than they are.", to: "/roamer" },
  Briston: { since: "France, 2013", note: "Acetate cases in colours nobody else is making. The one people ask about on the wrist.", to: "/briston" },
};
const HOUSE_ORDER = ["Festina", "Roamer", "Briston"];

const SIZE_OPTIONS = ["Under 38mm", "38–41mm", "42mm and over"];
const STRAP_ORDER = ["Bracelet", "Leather", "Nato", "Rubber"];
const SORTS = ["Featured", "Price, low to high", "Price, high to low"];

const SERVICES = [
  { n: "I", title: "Regulated before it leaves", note: "Every watch is timed on our own machine and adjusted if it needs it.", meta: "Included" },
  { n: "II", title: "Bracelet sized to you", note: "Links removed and refitted while you wait, whether you buy here or not.", meta: "No charge" },
  { n: "III", title: "Batteries and seals", note: "Pressure tested after every battery, so the water resistance still means something.", meta: "From £18" },
  { n: "IV", title: "Full service", note: "Movements stripped, cleaned, lubricated and reassembled in the building.", meta: "Quoted first" },
];

const money = (n?: number) => (n == null || isNaN(n) ? "" : "£" + Math.round(n).toLocaleString("en-GB"));

// Product names arrive as long ALL-CAPS strings that repeat the brand and tack on the ref
// ("FESTINA WOMEN'S BLACK TITANIUM WATCH BRACELET F20697/3"). The card already shows the
// brand and ref, so strip both, drop the filler word "watch", title-case, and keep it short.
export const cleanWatchName = (name?: string, brand?: string, ref?: string, maxLen = 34): string => {
  let n = name || "";
  if (brand) n = n.replace(new RegExp(`^\\s*${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "");
  if (ref) n = n.split(ref).join(" ");
  n = n
    .replace(/\b[A-Z]{1,3}[- ]?\d{3,}[/\dA-Za-z.]*\b/g, " ") // stray model codes
    .replace(/\bwatch(es)?\b/gi, " ")
    .replace(/[·,\-\s]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  n = n.toLowerCase().replace(/(^|\s)(\w)/g, (_, p, c) => p + c.toUpperCase());
  if (n.length > maxLen) n = n.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
  return n || (name || "");
};

interface Watch {
  id: string; brand: string; name: string; display: string; slug: string; ref: string; price: number;
  image?: string; movement: "Quartz" | "Automatic"; size: string | null; strap: string | null;
  spec: string; inStock: boolean; featured: boolean;
}

const inferMovement = (text: string, specMove?: string | null): "Quartz" | "Automatic" => {
  const t = `${specMove || ""} ${text}`.toLowerCase();
  if (/autom|self.?wind|sellita|miyota\s*8|mechanical|skeleton/.test(t)) return "Automatic";
  return "Quartz"; // default — the overwhelming majority of these references are quartz
};
const bucketSize = (dia?: string | null): string | null => {
  const mm = parseFloat(String(dia || ""));
  if (isNaN(mm) || mm < 20 || mm > 50) return null; // ignore data-entry noise
  if (mm < 38) return "Under 38mm";
  if (mm <= 41) return "38–41mm";
  return "42mm and over";
};
const inferStrap = (text: string): string | null => {
  const t = text.toLowerCase();
  if (/nato/.test(t)) return "Nato";
  if (/rubber|silicone/.test(t)) return "Rubber";
  if (/leather|calf/.test(t)) return "Leather";
  if (/bracelet|steel band|metal band/.test(t)) return "Bracelet";
  return null;
};

const WatchesV2 = (): JSX.Element => {
  const isMobile = useIsMobile();
  const [all, setAll] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  const [sel, setSel] = useState<Record<string, string[]>>({ brand: [], movement: [], size: [], strap: [] });
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState("Featured");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ brand: true, movement: true, size: false, strap: false });
  const [visible, setVisible] = useState(24);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { document.body.style.background = T.paper; window.scrollTo(0, 0); }, []);
  useEffect(() => { document.body.style.overflow = sheetOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [sheetOpen]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/watches?limit=1000`).then((r) => r.json()).then((d) => {
      const list: any[] = d?.data?.watches || d?.data || [];
      const norm: Watch[] = list.map((w) => {
        const sp = w.specifications || {};
        const text = `${w.name || ""} ${w.description || ""}`;
        const movement = inferMovement(text, sp.movement);
        const size = bucketSize(sp.case_diameter);
        const mm = parseFloat(String(sp.case_diameter || ""));
        const specBits = [movement, !isNaN(mm) && mm >= 20 && mm <= 50 ? `${Math.round(mm)}mm` : null, sp.water_resistance].filter(Boolean);
        const brandName = w.brand?.name || "—";
        const ref = w.model_number || w.sku || "";
        return {
          id: String(w.id), brand: brandName, name: w.name || "Watch", display: cleanWatchName(w.name, brandName, ref),
          slug: w.slug || "", ref, price: Number(w.base_price) || 0,
          image: w.image?.url || w.images?.[0]?.url, movement, size, strap: inferStrap(text),
          spec: specBits.join(" · "), inStock: w.in_stock !== false, featured: !!w.is_featured,
        };
      }).filter((w) => w.price > 0);
      setAll(norm);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const priceBounds = useMemo(() => {
    if (!all.length) return { min: 50, max: 1700 };
    const ps = all.map((w) => w.price);
    return { min: Math.floor(Math.min(...ps) / 25) * 25, max: Math.ceil(Math.max(...ps) / 25) * 25 };
  }, [all]);
  const effMax = maxPrice ?? priceBounds.max;

  // Predicate with one group optionally excluded (for exclusive counts)
  const passes = (w: Watch, skip?: string): boolean => {
    if (skip !== "brand" && sel.brand.length && !sel.brand.includes(w.brand)) return false;
    if (skip !== "movement" && sel.movement.length && !sel.movement.includes(w.movement)) return false;
    if (skip !== "size" && sel.size.length && !(w.size && sel.size.includes(w.size))) return false;
    if (skip !== "strap" && sel.strap.length && !(w.strap && sel.strap.includes(w.strap))) return false;
    if (skip !== "price" && maxPrice != null && w.price > effMax) return false;
    return true;
  };

  const filtered = useMemo(() => {
    let list = all.filter((w) => passes(w));
    if (sort === "Price, low to high") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "Price, high to low") list = [...list].sort((a, b) => b.price - a.price);
    else list = [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [all, sel, maxPrice, sort]);

  useEffect(() => { setVisible(24); }, [sel, maxPrice, sort]);

  const houses = useMemo(() => HOUSE_ORDER.map((name) => ({
    name, ...HOUSE_META[name],
    count: all.filter((w) => w.brand === name).length,
    image: all.find((w) => w.brand === name && w.image)?.image,
  })).filter((h) => h.count > 0 || loading), [all, loading]);

  const groups = useMemo(() => {
    const brandOpts = HOUSE_ORDER.filter((b) => all.some((w) => w.brand === b));
    const strapOpts = STRAP_ORDER.filter((s) => all.some((w) => w.strap === s));
    const defs: { key: string; label: string; options: string[] }[] = [
      { key: "brand", label: "Brand", options: brandOpts },
      { key: "movement", label: "Movement", options: ["Quartz", "Automatic"] },
      { key: "size", label: "Case size", options: SIZE_OPTIONS },
      { key: "strap", label: "Strap", options: strapOpts },
    ];
    return defs.map((g) => ({
      ...g,
      options: g.options.map((v) => ({
        label: v,
        on: sel[g.key].includes(v),
        count: all.filter((w) => passes(w, g.key) && (g.key === "brand" ? w.brand === v : g.key === "movement" ? w.movement === v : g.key === "size" ? w.size === v : w.strap === v)).length,
      })),
    }));
  }, [all, sel, maxPrice]);

  const toggle = (key: string, v: string) => setSel((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));
  const clearAll = () => { setSel({ brand: [], movement: [], size: [], strap: [] }); setMaxPrice(null); };
  const activeCount = Object.values(sel).reduce((n, a) => n + a.length, 0) + (maxPrice != null ? 1 : 0);

  const chips = [
    ...Object.entries(sel).flatMap(([k, arr]) => arr.map((v) => ({ key: k, label: v }))),
    ...(maxPrice != null ? [{ key: "price", label: `Up to ${money(effMax)}` }] : []),
  ];
  const removeChip = (c: { key: string; label: string }) => c.key === "price" ? setMaxPrice(null) : toggle(c.key, c.label);

  const shown = filtered.slice(0, visible);

  // Filter groups + price slider — shared by the desktop rail and the mobile bottom sheet.
  const filterControls = (
    <>
      {groups.map((g) => (
        <div key={g.key} style={{ borderBottom: `1px solid ${T.rule}` }}>
          <button type="button" onClick={() => setOpenGroups((o) => ({ ...o, [g.key]: !o[g.key] }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", padding: "15px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 13, color: T.ink }}>
            <span>{g.label}</span>
            <span style={{ fontSize: 14, color: T.gold, transition: "transform 0.28s ease", transform: openGroups[g.key] ? "rotate(45deg)" : "none" }}>+</span>
          </button>
          {openGroups[g.key] && (
            <div style={{ display: "flex", flexDirection: "column", paddingBottom: 14 }}>
              {g.options.map((o) => (
                <button key={o.label} type="button" onClick={() => toggle(g.key, o.label)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY }}>
                  <span style={{ flex: "none", width: 15, height: 15, background: o.on ? T.ink : "transparent", border: `1px solid ${o.on ? T.ink : T.ruleStrong}` }} />
                  <span style={{ flex: 1, fontSize: 13, color: o.on ? T.ink : T.body }}>{o.label}</span>
                  <span style={{ fontSize: 11, color: "#A9A196" }}>{o.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div style={{ padding: "18px 0 4px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 13 }}>Price</span>
          <span style={{ fontSize: 12, color: T.muted }}>{maxPrice != null ? `Up to ${money(effMax)}` : "Any"}</span>
        </div>
        <input className="wl-range" type="range" min={priceBounds.min} max={priceBounds.max} step={25} value={effMax} onChange={(e) => setMaxPrice(Number(e.target.value))} />
      </div>
    </>
  );

  return (
    <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.ink }}>
      <style>{`
        .wl a { color: inherit; text-decoration: none; }
        .wl-house:hover { background: ${T.tint}; }
        .wl-card:hover .wl-cardimg img { transform: scale(1.04); }
        .wl-under:hover { color: ${T.gold}; }
        .wl-range { -webkit-appearance: none; appearance: none; width: 100%; background: transparent; }
        .wl-range::-webkit-slider-runnable-track { height: 1px; background: ${T.ruleStrong}; }
        .wl-range::-webkit-slider-thumb { -webkit-appearance: none; width: 15px; height: 15px; margin-top: -7px; background: ${T.ink}; border: 0; cursor: pointer; }
        .wl-range::-moz-range-track { height: 1px; background: ${T.ruleStrong}; }
        .wl-range::-moz-range-thumb { width: 15px; height: 15px; background: ${T.ink}; border: 0; cursor: pointer; }
        @keyframes wlScrimIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wlSheetUp { from { transform: translateY(100%); } to { transform: none; } }
      `}</style>

      <div className="wl">
        {/* Watch-specific announcement bar via NavigationV2 (solid); the storefront bar copy
            stays as-is — a per-section bar override is out of scope here. */}
        <NavigationV2 solid />
        <div style={{ height: isMobile ? 96 : 118 }} />

        {/* Title band */}
        <section style={{ padding: "clamp(36px, 4.5vw, 76px) clamp(24px, 3vw, 52px) clamp(30px, 3vw, 44px)", borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.2fr) minmax(0, 0.8fr)", gap: "clamp(24px, 5vw, 80px)", alignItems: "end" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M2, marginBottom: 20 }}>
                <Link to="/">Home</Link><span style={{ color: T.ruleStrong }}>/</span><span style={{ color: T.ink }}>Watches</span>
              </div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(40px, 5vw, 78px)", lineHeight: 1.02, letterSpacing: "0.005em", margin: 0, maxWidth: "16ch" }}>Three houses we stand behind.</h1>
            </div>
            <p style={{ margin: "0 0 6px", maxWidth: "40ch", fontSize: 15, lineHeight: 1.75, color: T.body }}>We are an authorised retailer for Festina, Roamer and Briston. Every watch is delivered with its full manufacturer warranty, set up and regulated here before it leaves, and serviced at our own bench for as long as you own it.</p>
          </div>
        </section>

        {/* House cards */}
        <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", borderBottom: `1px solid ${T.rule}` }}>
          {houses.map((h, i) => (
            <Link key={h.name} to={h.to} className="wl-house" style={{ display: "block", padding: "clamp(24px, 2.6vw, 40px) clamp(20px, 2.4vw, 38px)", borderRight: !isMobile && i < 2 ? `1px solid ${T.rule}` : "none", borderBottom: isMobile && i < 2 ? `1px solid ${T.rule}` : "none", transition: "background 0.25s ease" }}>
              <div style={{ position: "relative", aspectRatio: "16 / 10", background: "#FFFFFF", overflow: "hidden", marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 2vw, 28px)" }}>
                {h.image && <img src={getMediaUrl(h.image)} alt={h.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} loading="lazy" />}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(24px, 2.2vw, 32px)", lineHeight: 1 }}>{h.name}</span>
                <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: M2 }}>{h.since}</span>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: 13.5, lineHeight: 1.7, color: T.muted }}>{h.note}</p>
              <span style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink, paddingBottom: 4, borderBottom: `1px solid ${T.ruleStrong}` }}>{h.count} watches</span>
            </Link>
          ))}
        </section>

        {/* Filter rail + grid */}
        <main style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "236px minmax(0, 1fr)", gap: "clamp(24px, 3.5vw, 60px)", padding: "clamp(24px, 3vw, 44px) clamp(24px, 3vw, 52px) clamp(48px, 6vw, 88px)", alignItems: "start" }}>
          {/* Rail */}
          {!isMobile && (
            <aside style={{ position: "sticky", top: 130 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingBottom: 14, borderBottom: `1px solid ${T.rule}` }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>Filter</span>
                <button type="button" onClick={clearAll} style={{ padding: 0, cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 11, color: activeCount ? T.gold : "#C4BCB0" }}>Clear</button>
              </div>
              {filterControls}
            </aside>
          )}

          {/* Grid */}
          <div>
            {/* Mobile: filter trigger */}
            {isMobile && (
              <button type="button" onClick={() => setSheetOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginBottom: 16, padding: "13px 0", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink, background: "transparent", border: `1px solid ${T.ruleStrong}` }}>
                Filter &amp; sort{activeCount ? <span style={{ color: T.gold }}>({activeCount})</span> : null}
              </button>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 16, paddingBottom: 16, borderBottom: `1px solid ${T.rule}` }}>
              <span style={{ fontSize: 13, color: T.muted }}>{loading ? "Loading…" : filtered.length === 1 ? "1 watch" : `${filtered.length} watches`}</span>
              {!isMobile && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {SORTS.map((x) => (
                    <button key={x} type="button" onClick={() => setSort(x)} style={{ padding: "7px 12px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, color: x === sort ? T.ink : M2, background: x === sort ? T.tint : "transparent", border: 0 }}>{x}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile filter chips row (simple) */}
            {chips.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "16px 0 0" }}>
                {chips.map((c) => (
                  <button key={c.key + c.label} type="button" onClick={() => removeChip(c)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, color: T.heading, background: T.tint, border: 0 }}>{c.label}<span style={{ color: M2 }}>×</span></button>
                ))}
              </div>
            )}

            {filtered.length === 0 && !loading ? (
              <div style={{ padding: "88px 0", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(26px, 2.6vw, 36px)", marginBottom: 14 }}>No watches match those filters.</div>
                <p style={{ margin: "0 auto 26px", maxWidth: "44ch", fontSize: 14, lineHeight: 1.7, color: T.muted }}>Loosen one and try again, or tell us what you are after — we can order most references from all three houses.</p>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
                  <button type="button" onClick={clearAll} style={{ padding: "14px 26px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0 }}>Clear filters</button>
                  <Link to="/contact" style={{ padding: "14px 26px", border: `1px solid ${T.ruleStrong}`, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink }}>Ask us to source one</Link>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: "clamp(14px, 2vw, 30px)", marginTop: 30 }}>
                  {shown.map((w) => (
                    <Link key={w.id} to={`/watches/${w.slug}`} className="wl-card" style={{ display: "block" }}>
                      <div className="wl-cardimg" style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(14px, 2.4vw, 26px)" }}>
                        {w.image && <img src={getMediaUrl(w.image)} alt={w.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.5s ease" }} loading="lazy" />}
                        {w.featured && <span style={{ position: "absolute", top: 10, left: 10, padding: "5px 10px", background: "rgba(248,246,240,0.94)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.body }}>Featured</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "18px 0 7px" }}>
                        <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2 }}>{w.brand}</span>
                        {w.ref && <span style={{ fontSize: 11, color: "#A9A196" }}>{w.ref}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 14.5, lineHeight: 1.3, flex: "1 1 auto", minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w.display}</span>
                        <span style={{ fontSize: 14, whiteSpace: "nowrap", flex: "none" }}>{money(w.price)}</span>
                      </div>
                      {w.spec && <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.muted }}>{w.spec}</div>}
                      <div style={{ fontSize: 11.5, color: w.inStock ? GREEN : M2, marginTop: 7 }}>{w.inStock ? "In stock" : "To order, 2 weeks"}</div>
                    </Link>
                  ))}
                </div>
                {visible < filtered.length && (
                  <div style={{ textAlign: "center", marginTop: 44 }}>
                    <button type="button" onClick={() => setVisible((v) => v + 24)} style={{ padding: "14px 30px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink, background: "transparent", border: `1px solid ${T.ruleStrong}` }}>Show more ({filtered.length - visible})</button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Servicing band */}
        <section style={{ background: T.ink, color: T.onDarkSoft, padding: "clamp(48px, 5vw, 88px) clamp(24px, 3vw, 52px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1.4fr)", gap: "clamp(28px, 5vw, 80px)", alignItems: "center", paddingBottom: "clamp(28px, 3.4vw, 52px)", borderBottom: `1px solid ${T.ruleDark}` }}>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>Bought here, looked after here</div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(28px, 3vw, 44px)", lineHeight: 1.12, margin: 0, maxWidth: "15ch", color: "#FFFFFF" }}>A watch is a mechanism, not an ornament.</h2>
            </div>
            <p style={{ margin: 0, maxWidth: "46ch", fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>Every watch is unpacked, timed and regulated on our own bench before it goes out, and the bracelet is sized to your wrist at no charge. Battery changes, seal tests and full services are done in the building — nothing is posted away.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}>
            {SERVICES.map((s, i) => (
              <div key={s.n} style={{ display: "flex", flexDirection: "column", height: "100%", padding: `clamp(24px, 2.6vw, 40px) clamp(16px, 2vw, 32px) 0 ${!isMobile && i > 0 ? "clamp(16px, 2vw, 32px)" : "0"}`, borderRight: !isMobile && i < 3 ? `1px solid ${T.ruleDark}` : "none" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(30px, 2.6vw, 40px)", lineHeight: 1, color: T.gold, marginBottom: 20 }}>{s.n}</div>
                <div style={{ fontSize: 15, color: "#FFFFFF", marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.7, color: T.onDarkMuted, marginBottom: 22 }}>{s.note}</div>
                <div style={{ marginTop: "auto", paddingBottom: isMobile ? 24 : 0, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6E6259" }}>{s.meta}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Mobile filter bottom sheet */}
        {isMobile && sheetOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 88, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div onClick={() => setSheetOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.42)", animation: "wlScrimIn 0.3s ease both" }} />
            <div style={{ position: "relative", maxHeight: "88vh", display: "flex", flexDirection: "column", background: T.paper, animation: "wlSheetUp 0.34s cubic-bezier(0.22,1,0.36,1) both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 20px", borderBottom: `1px solid ${T.rule}`, flex: "none" }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 22 }}>Filter &amp; sort</span>
                <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close" style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 22, lineHeight: 1, color: T.body }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 20px 16px" }}>
                {/* Sort */}
                <div style={{ padding: "14px 0 6px", borderBottom: `1px solid ${T.rule}` }}>
                  <div style={{ fontSize: 13, marginBottom: 12 }}>Sort by</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {SORTS.map((x) => (
                      <button key={x} type="button" onClick={() => setSort(x)} style={{ padding: "9px 13px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, color: x === sort ? T.paper : T.body, background: x === sort ? T.ink : "transparent", border: `1px solid ${x === sort ? T.ink : T.ruleSoft}` }}>{x}</button>
                    ))}
                  </div>
                </div>
                {filterControls}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, padding: "14px 20px calc(16px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.rule}`, background: T.tint, flex: "none" }}>
                <button type="button" onClick={clearAll} style={{ padding: "15px 20px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink, background: "transparent", border: `1px solid ${T.ruleStrong}` }}>Clear{activeCount ? ` (${activeCount})` : ""}</button>
                <button type="button" onClick={() => setSheetOpen(false)} style={{ padding: "15px 20px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0 }}>Show {filtered.length} {filtered.length === 1 ? "watch" : "watches"}</button>
              </div>
            </div>
          </div>
        )}

        <FooterV2 />
      </div>
    </div>
  );
};

export default WatchesV2;
