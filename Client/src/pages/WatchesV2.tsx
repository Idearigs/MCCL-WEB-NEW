import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { useFavorites } from "../contexts/FavoritesContext";
import { LISTING_CSS, GROUND, TILE, PAGE_SIZE, PAGE_X, BAR_TOP_CSS, M_BAR_TOP_CSS, Chev, XICON, PillTick, useFilterPanel } from "../components/home-v2/listingShared";

/**
 * WatchesV2 — the watch listing, in the same family as the ring and jewellery listings:
 * a centred heading, the three houses as doors, one slim filter row that stays under the
 * navigation, a four-across grid, and a light servicing section.
 *
 * Data: GET /watches (Festina, Roamer, Briston). Brand, collection, price, photo and "for"
 * (men / women / unisex) are clean fields. Movement is filled on about 1 record in 6 and
 * strap is not a field, so both are read from the name and description (unknown movement
 * counts as quartz, which most are). Case size comes from specifications.case_diameter, or
 * the "42 mm" in the name; values outside 20–50mm are ignored as typing errors. Water
 * resistance is only shown when it is a real rating (ATM / bar) — many records carry the
 * case size in that field.
 */

export const HOUSES: { name: string; since: string; note: string; to: string; pick: RegExp }[] = [
  { name: "Festina", since: "Spain, 1902", note: "Sports chronographs and clean everyday steel, at prices that do not ask you to think twice.", to: "/festina", pick: /timeless chrono/i },
  { name: "Roamer", since: "Switzerland, 1888", note: "Swiss made, quietly traditional. Automatics and skeletons that read older than they are.", to: "/roamer", pick: /searock auto/i },
  { name: "Briston", since: "France, 2013", note: "Acetate cases in colours nobody else is making. The one people ask about on the wrist.", to: "/briston", pick: /clubmaster classic/i },
];
const HOUSE_ORDER = HOUSES.map(h => h.name);
// The three houses photograph differently: Roamer's watch sits small on a pale grey square,
// Briston's on a tall white sheet. Each is enlarged (and Roamer's grey lifted to white) so
// every watch reads the same size on the same ground.
export const PHOTO: Record<string, { scale: number; filter?: string }> = {
  Festina: { scale: 1 },
  Roamer: { scale: 1.3, filter: "brightness(1.047)" },
  Briston: { scale: 1.14 },
};

const SIZE_OPTIONS = ["Under 38mm", "38–41mm", "42mm and over"];
const STRAP_ORDER = ["Bracelet", "Leather", "Nato", "Rubber"];
const SORTS = [{ value: "featured", label: "Featured" }, { value: "low", label: "Price, low to high" }, { value: "high", label: "Price, high to low" }];

const SERVICES = [
  { title: "Regulated before it leaves", note: "Every watch is timed on our own machine and adjusted if it needs it.", meta: "Included" },
  { title: "Bracelet sized to you", note: "Links removed and refitted while you wait, whether you buy here or not.", meta: "No charge" },
  { title: "Batteries and seals", note: "Pressure tested after every battery, so the water resistance still means something.", meta: "From £18" },
  { title: "Full service", note: "Movements stripped, cleaned, lubricated and reassembled in the building.", meta: "Quoted first" },
];
const SERVICE_ICONS = [
  <svg key="a" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><circle cx="15" cy="17" r="9.5" stroke="currentColor" /><path d="M15 11.5V17l3.5 2.2M12.5 4h5M15 4v3.5M22.6 9.4l1.6-1.6" stroke="currentColor" /></svg>,
  <svg key="b" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><rect x="10.5" y="2.5" width="9" height="6" stroke="currentColor" /><rect x="10.5" y="12" width="9" height="6" stroke="currentColor" /><rect x="10.5" y="21.5" width="9" height="6" stroke="currentColor" /><path d="M15 8.5V12M15 18v3.5" stroke="currentColor" /></svg>,
  <svg key="c" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M15 3.5c4 5 7 8.600 7 12.500a7 7 0 01-14 0c0-3.900 3-7.500 7-12.500z" stroke="currentColor" /><path d="M11.500 16.500a3.500 3.500 0 003.500 3.500" stroke="currentColor" /></svg>,
  <svg key="d" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><circle cx="15" cy="15" r="4" stroke="currentColor" /><path d="M15 3v4M15 23v4M3 15h4M23 15h4M6.500 6.500l2.800 2.800M20.700 20.700l2.800 2.800M23.500 6.500l-2.800 2.800M9.300 20.700l-2.800 2.800" stroke="currentColor" /><circle cx="15" cy="15" r="8" stroke="currentColor" /></svg>,
];

export const money = (n?: number) => (n == null || isNaN(n) ? "" : "£" + Math.round(n).toLocaleString("en-GB"));

// Product names arrive as long strings that repeat the brand and tack on the reference
// ("FESTINA WOMEN'S BLACK TITANIUM WATCH BRACELET F20697/3"). Strip both, drop the filler
// word "watch", and put ALL-CAPS names into title case. (Also used by the brand pages.)
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
  if (!/[a-z]/.test(n)) n = n.toLowerCase().replace(/(^|\s)(\w)/g, (_, p, c) => p + c.toUpperCase());
  if (n.length > maxLen) n = n.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
  return n || (name || "");
};

// Roamer names are a full specification ("Searock Automatic 42 mm Automatic Three-Hand Date
// Sky Blue Dial Silver Bracelet Sapphire glass…"). The card shows the model and the dial colour.
export const roamerName = (name: string): string | null => {
  const m = name.match(/^(.*?)\s*\d{2}(?:\.\d)?\s?mm\b/i);
  if (!m || !m[1]) return null;
  const c = name.match(/(?:Hand(?: Date)?|Chronograph|Chrono|GMT)\s+((?:[A-Z][A-Za-z-]+\s){1,3}?)(?:Mop|Sunray|Dial|Bracelet|Leather|W\/)/);
  const colour = c ? c[1].trim() : "";
  return m[1].trim() + (colour ? `, ${colour}` : "");
};

interface Watch {
  id: string; brand: string; name: string; display: string; slug: string; price: number; image?: string;
  movement: "Quartz" | "Automatic"; size: string | null; strap: string | null; gender: string; collection: string;
  spec: string; featured: boolean;
}
type Key = "brand" | "for" | "collection" | "movement" | "size" | "strap";
type PanelKey = Key | "price" | "sort";
const NONE: Record<Key, string[]> = { brand: [], for: [], collection: [], movement: [], size: [], strap: [] };
const TITLES: Record<Key, string> = { brand: "Brand", for: "For", collection: "Collection", movement: "Movement", size: "Case size", strap: "Strap" };

export const inferMovement = (text: string, specMove?: string | null): "Quartz" | "Automatic" => {
  const t = `${specMove || ""} ${text}`.toLowerCase();
  if (/autom|self.?wind|sellita|miyota\s*8|mechanical|skeleton/.test(t)) return "Automatic";
  return "Quartz";
};
export const caseMm = (dia: unknown, name: string): number | null => {
  let mm = parseFloat(String(dia || ""));
  if (isNaN(mm)) { const m = name.match(/\b(\d{2}(?:\.\d)?)\s?mm\b/i); mm = m ? parseFloat(m[1]) : NaN; }
  return isNaN(mm) || mm < 20 || mm > 50 ? null : mm;
};
const bucketSize = (mm: number | null): string | null => mm == null ? null : mm < 38 ? "Under 38mm" : mm <= 41 ? "38–41mm" : "42mm and over";
const inferStrap = (text: string): string | null => {
  const t = text.toLowerCase();
  if (/nato/.test(t)) return "Nato";
  if (/rubber|silicone|fkm/.test(t)) return "Rubber";
  if (/leather|calf/.test(t)) return "Leather";
  if (/bracelet|steel band|metal band/.test(t)) return "Bracelet";
  return null;
};

const WatchesV2 = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const [all, setAll] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Record<Key, string[]>>(NONE);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState("featured");
  const [open, setOpen] = useState<Record<Key, boolean>>({ brand: true, for: true, collection: false, movement: false, size: false, strap: false });
  const [panel, setPanel] = useState<PanelKey | null>(null); // which filter panel is open on a laptop
  const [shown, setShown] = useState(PAGE_SIZE);
  const [sheet, setSheet] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { barRef, mainRef, toResults } = useFilterPanel(!!panel, () => setPanel(null));

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => {
    const lock = sheet || sortSheet; document.body.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheet, sortSheet]);
  // /watches?brand=Roamer opens the list on that house.
  useEffect(() => {
    const b = HOUSE_ORDER.find(h => h.toLowerCase() === (searchParams.get("brand") || "").toLowerCase());
    if (b) setSel(s => ({ ...s, brand: [b] }));
  }, [searchParams]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/watches?limit=1000`).then(r => r.json()).then(d => {
      const list: any[] = d?.data?.watches || d?.data || [];
      const norm: Watch[] = list.map(w => {
        const sp = w.specifications || {};
        const name: string = w.name || "Watch";
        const text = `${name} ${w.description || ""}`;
        const brand: string = w.brand?.name || "";
        const ref: string = w.model_number || w.sku || "";
        const movement = inferMovement(text, sp.movement);
        const mm = caseMm(sp.case_diameter, name);
        const water = /^\d+\s?(atm|bar)$/i.test(String(sp.water_resistance || "").trim()) ? String(sp.water_resistance).trim().toUpperCase().replace("BAR", "bar") : null;
        return {
          id: String(w.id), brand, name, slug: w.slug || "", price: Number(w.base_price) || 0,
          display: (brand === "Roamer" && roamerName(name)) || cleanWatchName(name, brand, ref, 64),
          image: w.image?.url || w.images?.[0]?.url, movement, size: bucketSize(mm), strap: inferStrap(text),
          gender: String(w.gender || "").toLowerCase(), collection: w.collection?.name || "",
          spec: [movement, mm != null ? `${Math.round(mm)}mm` : null, water].filter(Boolean).join(" · "), featured: !!w.is_featured,
        };
      }).filter(w => w.price > 0);
      setAll(norm);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const priceBounds = useMemo(() => {
    if (!all.length) return { min: 50, max: 1700 };
    const ps = all.map(w => w.price);
    return { min: Math.floor(Math.min(...ps) / 25) * 25, max: Math.ceil(Math.max(...ps) / 25) * 25 };
  }, [all]);
  const effMax = maxPrice ?? priceBounds.max;
  const oneBrand = sel.brand.length === 1 ? sel.brand[0] : null; // collections are offered once one house is chosen
  useEffect(() => { if (!oneBrand) setSel(s => s.collection.length ? { ...s, collection: [] } : s); }, [oneBrand]);

  const has = (w: Watch, k: Key, v: string): boolean =>
    k === "brand" ? w.brand === v
      : k === "for" ? (w.gender === "unisex" || w.gender === (v === "Men" ? "men" : "women"))
      : k === "collection" ? w.collection === v
      : k === "movement" ? w.movement === v
      : k === "size" ? w.size === v : w.strap === v;
  const passes = (w: Watch, skip?: Key | "price"): boolean => {
    for (const k of Object.keys(sel) as Key[]) {
      if (k === skip || !sel[k].length) continue;
      if (k === "collection" && !oneBrand) continue;
      if (!sel[k].some(v => has(w, k, v))) return false;
    }
    return skip === "price" || maxPrice == null || w.price <= effMax;
  };

  const groups = useMemo(() => {
    const collections = oneBrand
      ? Object.entries(all.filter(w => w.brand === oneBrand && w.collection).reduce<Record<string, number>>((m, w) => { m[w.collection] = (m[w.collection] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).map(e => e[0])
      : [];
    const defs: { key: Key; options: string[] }[] = [
      { key: "brand", options: HOUSE_ORDER },
      { key: "for", options: ["Women", "Men"] },
      { key: "collection", options: collections },
      { key: "movement", options: ["Quartz", "Automatic"] },
      { key: "size", options: SIZE_OPTIONS },
      { key: "strap", options: STRAP_ORDER },
    ];
    return defs.map(g => ({
      key: g.key, title: TITLES[g.key],
      options: g.options.map(v => ({ v, n: all.filter(w => passes(w, g.key) && has(w, g.key, v)).length })).filter(o => o.n > 0 || sel[g.key].includes(o.v)),
    })).filter(g => loading ? g.key !== "collection" : g.options.length > 1 || sel[g.key].length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, sel, maxPrice, loading, oneBrand]);

  const results = useMemo(() => {
    const list = all.filter(w => passes(w));
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    // Featured: anything marked featured first, then the houses in turn, so the first rows show all three.
    const lanes = HOUSE_ORDER.map(h => list.filter(w => w.brand === h && !w.featured));
    const mixed: Watch[] = [];
    for (let i = 0; lanes.some(l => i < l.length); i++) lanes.forEach(l => { if (i < l.length) mixed.push(l[i]); });
    return [...list.filter(w => w.featured), ...mixed, ...list.filter(w => !w.featured && !HOUSE_ORDER.includes(w.brand))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, sel, maxPrice, sort, oneBrand]);

  useEffect(() => { setShown(PAGE_SIZE); }, [sel, maxPrice, sort]);

  const toggle = (k: Key, v: string) => { setSel(s => ({ ...s, [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v] })); toResults(); };
  const clearAll = () => { setSel(NONE); setMaxPrice(null); toResults(); };
  const chips = groups.flatMap(g => sel[g.key].map(v => ({ key: g.key, label: v })));
  const activeCount = chips.length + (maxPrice != null ? 1 : 0);
  const sortLabel = SORTS.find(o => o.value === sort)?.label || "Featured";
  const priceLabel = maxPrice == null ? "Any" : "Up to " + money(effMax);
  const noun = (n: number) => (n === 1 ? "watch" : "watches");
  const countLabel = loading ? "Loading…" : `${results.length} ${noun(results.length)}`;

  // A house door shows that house's watches and brings the list into view.
  const openHouse = (name: string) => {
    setSel({ ...NONE, brand: [name] }); setMaxPrice(null);
    requestAnimationFrame(() => {
      const main = mainRef.current; if (!main) return;
      const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--v2nav-h")) || 113;
      const row = window.innerWidth > 900 ? (barRef.current?.offsetHeight || 0) : 52;
      window.scrollTo({ top: main.getBoundingClientRect().top + window.scrollY - navH - row, behavior: "smooth" });
    });
  };
  const houses = useMemo(() => HOUSES.map(h => {
    const own = all.filter(w => w.brand === h.name);
    return { ...h, count: own.length, image: (own.find(w => w.image && h.pick.test(`${w.collection} ${w.name}`)) || own.find(w => w.image))?.image };
  }), [all]);

  const photo = (w: { brand: string }) => ({ ["--s" as any]: PHOTO[w.brand]?.scale || 1, filter: PHOTO[w.brand]?.filter } as React.CSSProperties);

  // Laptop panels: each choice is an outlined pill.
  const pill = (k: Key, o: { v: string; n: number }) => (
    <button key={o.v} type="button" onClick={() => toggle(k, o.v)} className="erv2-pill" data-fopt aria-pressed={sel[k].includes(o.v)}>
      <PillTick />{o.v}<span className="erv2-pill-n">{o.n}</span>
    </button>
  );
  // Phone sheet: the same choices as a checklist.
  const optRow = (k: Key, o: { v: string; n: number }) => {
    const on = sel[k].includes(o.v);
    return (
      <button key={o.v} type="button" onClick={() => toggle(k, o.v)} className="erv2-opt" data-fopt aria-pressed={on}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 15, color: T.text }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="erv2-box" style={{ width: 16, height: 16, flex: "none", border: `1px solid ${on ? T.text : T.ruleStrong}`, background: on ? T.text : "transparent" }} />
          {o.v}
        </span>
        <span style={{ fontSize: 12.5, color: T.textMuted }}>{o.n}</span>
      </button>
    );
  };
  const panelFoot = (clear: (() => void) | null, hint = "") => (
    <div className="erv2-panel-foot">
      <span style={{ fontSize: 13, color: T.textMuted }}>{hint}</span>
      <span style={{ display: "flex", alignItems: "center", gap: "clamp(20px, 2.4vw, 36px)" }}>
        {clear && <button type="button" className="is-quiet" onClick={clear}>Clear</button>}
        <button type="button" data-fclose onClick={() => setPanel(null)}>Show {results.length} {noun(results.length)}</button>
      </span>
    </div>
  );

  const card = (w: Watch) => {
    const href = `/watches/${w.slug}`;
    const saved = isFavorite(w.id);
    return (
      <div key={w.id} className="erv2-card" style={{ position: "relative" }}>
        <Link to={href} style={{ display: "block" }}>
          <div style={{ position: "relative", aspectRatio: "1 / 1.1", background: TILE, overflow: "hidden" }}>
            {w.image && <img src={getMediaUrl(w.image)} alt={`${w.brand} ${w.display}`} className="erv2-blend erv2-main-img wt-img" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "11%", ...photo(w) }} loading="lazy" />}
            <span className="erv2-add">View watch</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.textMuted }}>{w.brand}</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, marginTop: 6 }}>
            <span className="wt-name" style={{ fontSize: 14.5, lineHeight: 1.45, color: T.text, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w.display}</span>
            <span style={{ flex: "none", fontSize: 14, color: T.text }}>{money(w.price)}</span>
          </div>
          {w.spec && <div className="wt-sub" style={{ marginTop: 5, fontSize: 13, color: T.textMuted }}>{w.spec}</div>}
        </Link>
        <button type="button" className="erv2-save" aria-pressed={saved} aria-label={saved ? `Remove ${w.display} from saved` : `Save ${w.display}`}
          onClick={() => toggleFavorite(w.id, w.name, w.image ? getMediaUrl(w.image) : "", href)}
          style={{ position: "absolute", top: 6, right: 6, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: 0, color: T.text }}>
          <svg width="20" height="18" viewBox="0 0 20 18" fill={saved ? "currentColor" : "none"} aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.700 2.800-2.700 4.600-2.700C17 1.400 19 3.300 19 5.900c0 3.700-3.600 6.800-9 10.700z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
        </button>
      </div>
    );
  };

  return (
    <div style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh", WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility" } as React.CSSProperties}>
      <style>{LISTING_CSS}</style>
      <style>{`
        .wt-img { transform: scale(var(--s, 1)); }
        .erv2-card:hover .wt-img, .wt-door:hover .wt-img { transform: scale(calc(var(--s, 1) * 1.035)); }
        .wt-doors { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2px; max-width: 1320px; margin: 0 auto; }
        .wt-door { display: block; width: 100%; padding: 0; cursor: pointer; background: transparent; border: 0; font-family: ${FONT_BODY}; color: ${T.text}; text-align: center; }
        .wt-door-img { position: relative; aspect-ratio: 1 / 0.92; background: ${TILE}; overflow: hidden; }
        .wt-door-img img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 9%; transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .wt-door-name { display: block; margin-top: 22px; font-family: ${FONT_DISPLAY}; font-size: clamp(22px, 2.1vw, 29px); line-height: 1.15; }
        .wt-door-since { display: block; margin-top: 9px; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; }
        .wt-door-note { margin: 12px auto 0; max-width: 36ch; padding: 0 12px; font-size: 14px; line-height: 1.65; color: ${T.text}; }
        .wt-door-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 0 clamp(18px, 2vw, 30px); margin-top: 4px; }
        .wt-door-links button { cursor: pointer; background: transparent; border-top: 0; border-left: 0; border-right: 0; font-family: ${FONT_BODY}; color: ${T.text}; }
        .wt-quiet { border-bottom-color: transparent !important; color: ${T.textMuted} !important; }
        .wt-quiet:hover { border-bottom-color: ${T.gold} !important; color: ${T.text} !important; }
        .wt-care { background: ${T.sand}; padding: clamp(56px, 6vw, 96px) ${PAGE_X}; text-align: center; }
        .wt-care-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); max-width: 1320px; margin: clamp(36px, 4vw, 60px) auto 0; }
        .wt-care-item { display: flex; flex-direction: column; align-items: center; padding: 6px clamp(16px, 2vw, 34px); border-left: 1px solid ${T.ruleStrong}; }
        .wt-care-item:first-child { border-left: 0; }
        @media (max-width: 900px) {
          .wt-sub { display: none; }
          .wt-name { font-size: 13.5px !important; }
          .wt-doors { grid-template-columns: 1fr; gap: 0; border-top: 1px solid ${T.line}; }
          .wt-house { display: grid; grid-template-columns: 104px minmax(0, 1fr); column-gap: 18px; align-items: center; padding: 14px 0; border-bottom: 1px solid ${T.line}; text-align: left; }
          .wt-door { text-align: left; display: contents; }
          .wt-door-img { grid-row: 1 / span 3; aspect-ratio: 1 / 1.08; }
          .wt-door-name { margin-top: 0; font-size: 22px; }
          .wt-door-since { margin-top: 5px; }
          .wt-door-note { display: none; }
          .wt-door-links { justify-content: flex-start; margin-top: -4px; }
          .wt-care-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 40px; }
          .wt-care-item:nth-child(odd) { border-left: 0; }
        }
        @media (max-width: 520px) {
          .wt-care-grid { grid-template-columns: 1fr; row-gap: 0; }
          .wt-care-item { border-left: 0; padding: 26px 0; border-top: 1px solid ${T.ruleStrong}; }
          .wt-care-item:first-child { border-top: 0; padding-top: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .wt-img, .wt-door-img img { transition: none !important; } }
      `}</style>

      <NavigationV2 solid />

      <div className="erv2" style={{ paddingTop: "var(--v2nav-h, 96px)" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: `clamp(30px,3.4vw,52px) ${PAGE_X} 16px`, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>
          <Link to="/">Home</Link><span>/</span><span style={{ color: T.text }}>Watches</span>
        </div>

        <section className="erv2-head" style={{ padding: `0 ${PAGE_X} clamp(34px,3.8vw,56px)`, textAlign: "center" }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(28px, 3.2vw, 44px)", lineHeight: 1.15, margin: "0 0 16px", color: T.text }}>Watches</h1>
          <p style={{ margin: "0 auto", maxWidth: "62ch", fontSize: 15.5, lineHeight: 1.7, color: T.text }}>We are an authorised retailer for Festina, Roamer and Briston. Every watch is delivered with its full manufacturer warranty, set up and regulated here before it leaves, and serviced at our own bench for as long as you own it.</p>
        </section>

        {/* The three houses */}
        <section aria-label="Our watch houses" style={{ padding: `0 ${PAGE_X} clamp(48px, 5vw, 80px)` }}>
          <div className="wt-doors">
            {houses.map(h => (
              <div key={h.name} className="wt-house">
                <button type="button" className="wt-door" data-house={h.name} onClick={() => openHouse(h.name)} aria-label={`Show ${h.name} watches`}>
                  <span className="wt-door-img" style={{ display: "block" }}>
                    {h.image && <img src={getMediaUrl(h.image)} alt="" className="erv2-blend wt-img" style={photo({ brand: h.name })} loading="lazy" />}
                  </span>
                  <span className="wt-door-name">{h.name}</span>
                  <span className="wt-door-since">{h.since}</span>
                </button>
                <p className="wt-door-note">{h.note}</p>
                <div className="wt-door-links">
                  <button type="button" className="erv2-textlink" data-house={h.name} onClick={() => openHouse(h.name)}>{loading ? "Shop watches" : `Shop ${h.count} ${noun(h.count)}`}</button>
                  <Link to={h.to} className="erv2-textlink wt-quiet">About {h.name}</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Phone filter row: Filter on the left, the count in the middle, Sort on the right */}
        <div className="erv2-triggerbar" style={{ position: "sticky", top: M_BAR_TOP_CSS, zIndex: 40, background: GROUND, padding: `0 ${PAGE_X}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
            <button type="button" className="erv2-mbtn" data-sheetbtn="filter" onClick={() => setSheet(true)} style={{ justifySelf: "start" }}>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M0 3h16M0 9h16" stroke="currentColor" strokeWidth="1" /><circle cx="5" cy="3" r="2" fill={GROUND} stroke="currentColor" strokeWidth="1" /><circle cx="11" cy="9" r="2" fill={GROUND} stroke="currentColor" strokeWidth="1" /></svg>
              Filter{activeCount > 0 && <span style={{ color: T.textMuted }}>({activeCount})</span>}
            </button>
            <span style={{ fontSize: 12.5, color: T.textMuted }}>{countLabel}</span>
            <button type="button" className="erv2-mbtn" data-sheetbtn="sort" onClick={() => setSortSheet(true)} style={{ justifySelf: "end" }}>Sort<Chev /></button>
          </div>
        </div>

        <div>
          {/* Laptop filter row: each label opens its choices underneath */}
          <div ref={barRef} className={`erv2-bar${panel ? " has-open" : ""}`} style={{ position: "sticky", top: BAR_TOP_CSS, zIndex: 30, background: GROUND, padding: `0 ${PAGE_X}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.line}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(18px, 2.4vw, 40px)" }}>
                {[...groups.map(g => ({ key: g.key as PanelKey, label: g.title, n: sel[g.key].length })), { key: "price" as PanelKey, label: "Price", n: maxPrice != null ? 1 : 0 }].map(b => (
                  <button key={b.key} type="button" className="erv2-fbtn" data-fbtn={b.key} aria-expanded={panel === b.key} onClick={() => setPanel(v => v === b.key ? null : b.key)}>
                    {b.label}{b.n > 0 && <span style={{ color: T.textMuted }}>({b.n})</span>}<Chev />
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(18px, 2.4vw, 40px)" }}>
                <span style={{ fontSize: 12.5, color: T.textMuted, whiteSpace: "nowrap" }}>{countLabel}</span>
                <button type="button" className="erv2-fbtn" data-fbtn="sort" aria-expanded={panel === "sort"} onClick={() => setPanel(v => v === "sort" ? null : "sort")}>
                  Sort<span style={{ color: T.textMuted, textTransform: "none", letterSpacing: 0, fontSize: 12.5, whiteSpace: "nowrap" }}>{sortLabel}</span><Chev />
                </button>
              </div>
            </div>
            {groups.map(g => (
              <div key={g.key} data-fpanel={g.key} className={`erv2-panel${panel === g.key ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
                <div className="erv2-pills">{g.options.map(o => pill(g.key, o))}</div>
                {panelFoot(sel[g.key].length ? () => setSel(s => ({ ...s, [g.key]: [] })) : null, g.key === "brand" && !oneBrand ? "Choose one brand to filter by its collections." : "")}
              </div></div></div>
            ))}
            <div data-fpanel="price" className={`erv2-panel${panel === "price" ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
              <div style={{ maxWidth: 380 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, fontSize: 14, color: T.text }}>
                  <span>Maximum price</span><span style={{ color: T.textMuted }}>{priceLabel}</span>
                </div>
                <input type="range" min={priceBounds.min} max={priceBounds.max} step={25} value={effMax} onChange={e => setMaxPrice(+e.target.value >= priceBounds.max ? null : +e.target.value)} className="erv2-range" aria-label="Maximum price" />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: T.textMuted, marginTop: 10 }}><span>{money(priceBounds.min)}</span><span>{money(priceBounds.max)}</span></div>
              </div>
              {panelFoot(maxPrice != null ? () => setMaxPrice(null) : null)}
            </div></div></div>
            <div data-fpanel="sort" className={`erv2-panel${panel === "sort" ? " is-open" : ""}`}><div className="erv2-panel-clip"><div className="erv2-panel-in">
              <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: "4px clamp(22px, 2.6vw, 40px)" }}>
                {SORTS.map(o => (
                  <button key={o.value} type="button" className="erv2-sortopt" aria-pressed={sort === o.value} onClick={() => { setSort(o.value); setPanel(null); }}
                    style={{ padding: "8px 0 5px", cursor: "pointer", background: "transparent", border: 0, borderBottom: `1px solid ${sort === o.value ? T.text : "transparent"}`, fontFamily: FONT_BODY, fontSize: 14, color: sort === o.value ? T.text : T.textMuted }}>{o.label}</button>
                ))}
              </div>
            </div></div></div>
          </div>

          <div className={`erv2-scrim${panel ? " is-on" : ""}`} data-scrim onClick={() => setPanel(null)} aria-hidden="true" />

          <main ref={mainRef} style={{ padding: `0 ${PAGE_X} clamp(64px,6vw,104px)` }} className="erv2-main">
            <div className="erv2-meta" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: activeCount ? 24 : 0 }}>
              {chips.map((c, i) => (
                <button key={i} type="button" onClick={() => toggle(c.key, c.label)} className="erv2-chip"
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 12px", cursor: "pointer", background: "transparent", border: `1px solid ${T.line}`, fontFamily: FONT_BODY, fontSize: 12, color: T.text }}>
                  {c.label}<span aria-hidden="true" style={{ color: T.textMuted }}>×</span>
                </button>
              ))}
              {maxPrice != null && (
                <button type="button" onClick={() => setMaxPrice(null)} className="erv2-chip"
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
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(21px, 2vw, 27px)", color: T.text, marginBottom: 12 }}>No watches match those choices</div>
                <p style={{ margin: "0 auto 10px", maxWidth: "44ch", fontSize: 15, lineHeight: 1.7, color: T.text }}>Remove a filter to see more, or tell us what you are after. We can order most references from all three houses.</p>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "4px clamp(20px, 3vw, 40px)" }}>
                  <button type="button" onClick={clearAll} className="erv2-textlink" style={{ cursor: "pointer", background: "transparent", borderTop: 0, borderLeft: 0, borderRight: 0, fontFamily: FONT_BODY, color: T.text }}>Clear all filters</button>
                  <Link to="/contact" className="erv2-textlink" style={{ color: T.text }}>Ask us to source one</Link>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gap: "clamp(28px,3vw,44px) clamp(16px,1.6vw,28px)", marginTop: 32 }} className="erv2-grid">
                  {results.slice(0, shown).map(card)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: "clamp(40px, 4vw, 64px)" }}>
                  <span style={{ fontSize: 12.5, color: T.textMuted }}>Showing {Math.min(shown, results.length)} of {results.length} {noun(results.length)}</span>
                  <span aria-hidden="true" style={{ width: 160, height: 1, background: T.line, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 0, height: 1, background: T.text, width: `${Math.min(100, (shown / results.length) * 100)}%` }} />
                  </span>
                  {shown < results.length && (
                    <button type="button" className="erv2-more" onClick={() => setShown(n => n + PAGE_SIZE)}
                      style={{ marginTop: 10, padding: "15px 34px", cursor: "pointer", background: "transparent", border: `1px solid ${T.text}`, fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Show more watches</button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>

        {/* Servicing */}
        <section className="wt-care">
          <div style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text, marginBottom: 16 }}>Bought here, looked after here</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(24px, 2.6vw, 36px)", lineHeight: 1.2, margin: "0 auto 16px", maxWidth: "22ch", color: T.text, textWrap: "balance" } as React.CSSProperties}>A watch is a mechanism, not an ornament.</h2>
          <p style={{ margin: "0 auto", maxWidth: "62ch", fontSize: 15.5, lineHeight: 1.7, color: T.text }}>Every watch is unpacked, timed and regulated on our own bench before it goes out, and the bracelet is sized to your wrist at no charge. Battery changes, seal tests and full services are done in the building. Nothing is posted away.</p>
          <div className="wt-care-grid">
            {SERVICES.map((s, i) => (
              <div key={s.title} className="wt-care-item">
                <span style={{ color: T.gold, display: "flex" }}>{SERVICE_ICONS[i]}</span>
                <div style={{ marginTop: 18, fontFamily: FONT_DISPLAY, fontSize: 18.5, lineHeight: 1.3, color: T.text }}>{s.title}</div>
                <p style={{ margin: "10px 0 16px", maxWidth: "30ch", fontSize: 14, lineHeight: 1.65, color: T.text }}>{s.note}</p>
                <div style={{ marginTop: "auto", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.text }}>{s.meta}</div>
              </div>
            ))}
          </div>
        </section>

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
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 24px" }}>
            {groups.map(g => (
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
                  {g.options.map(o => optRow(g.key, o))}
                </div>
              </div>
            ))}
            <div style={{ padding: "20px 0 8px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text }}>Price</span>
                <span style={{ fontSize: 13.5, color: T.textMuted }}>{priceLabel}</span>
              </div>
              <input type="range" min={priceBounds.min} max={priceBounds.max} step={25} value={effMax} onChange={e => setMaxPrice(+e.target.value >= priceBounds.max ? null : +e.target.value)} className="erv2-range" aria-valuetext={priceLabel} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#8A8377", marginTop: 8 }}><span>{money(priceBounds.min)}</span><span>{money(priceBounds.max)}</span></div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 10, padding: "14px 24px calc(14px + env(safe-area-inset-bottom))", borderTop: `1px solid ${T.line}` }}>
            <button type="button" onClick={clearAll} style={{ padding: "16px 0", background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.text, textDecoration: "underline", textUnderlineOffset: 5, textDecorationColor: T.ruleStrong }}>Clear all</button>
            <button type="button" data-sheetclose onClick={() => setSheet(false)} style={{ padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Show {results.length} {noun(results.length)}</button>
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

export default WatchesV2;
