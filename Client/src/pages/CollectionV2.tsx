import React, { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useIsMobile } from "../hooks/use-mobile";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { cleanWatchName } from "./WatchesV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * CollectionV2 — one template, every watch collection. Route: /collections/:slug.
 * VISUAL design: design_handoff_mcculloch_watch_collections (Collection page). Title band
 * with a four-level breadcrumb + blurb, a fact strip of the collection's constants, a
 * Grid|List toolbar with sort, the two views, a cross-brand previous/next pair, and a
 * sourcing band on ink.
 *
 * REAL data: GET /watches/collections/:slug returns the collection, its brand and every
 * held reference (name, price, in_stock, images, movement/case). Prev/next cycles the real
 * catalogue via GET /watches/collections/all. Sibling tabs come from the brand's collections.
 *
 * ADAPTATIONS: the design's blurb states "N in the collection; M held here" — we only know
 * what is held, so the copy is composed honestly from the held count. Water resistance is not
 * a stored field, so the fact strip parses it from descriptions and falls back to the
 * reference count when absent. The save heart is local (first save affordance in the project).
 */

const M2 = "#8A8377";
const GREEN = "#4A7A52";
const A9 = "#A9A196";
const money = (n?: number) => (n == null || isNaN(n) ? "" : "£" + Math.round(n).toLocaleString("en-GB"));

const inferMovement = (text: string, specMove?: string | null): "Quartz" | "Automatic" => {
  const t = `${specMove || ""} ${text}`.toLowerCase();
  if (/autom|self.?wind|sellita|miyota\s*8|mechanical|skeleton/.test(t)) return "Automatic";
  return "Quartz";
};
const inferStrap = (text: string): string => {
  const t = text.toLowerCase();
  if (/nato/.test(t)) return "Nato";
  if (/rubber|silicone/.test(t)) return "Rubber";
  if (/leather|calf/.test(t)) return "Leather";
  if (/bracelet|steel band|metal band/.test(t)) return "Bracelet";
  return "—";
};
const parseWR = (text?: string): string | null => {
  const s = (text || "").toLowerCase();
  let m = s.match(/(\d{2,4})\s*m(?:etre|eter)?s?\b/);
  if (m) return `${m[1]} metres`;
  m = s.match(/(\d{1,2})\s*(?:atm|bar)\b/);
  if (m) return `${parseInt(m[1], 10) * 10} metres`;
  return null;
};
const caseSize = (dia?: string | null): number | null => {
  const mm = parseFloat(String(dia || ""));
  if (isNaN(mm) || mm < 20 || mm > 50) return null;
  return Math.round(mm);
};
const mode = <V,>(arr: (V | null | undefined)[]): V | null => {
  const c = new Map<V, number>();
  let best: V | null = null, bn = 0;
  arr.forEach((v) => {
    if (v == null) return;
    const n = (c.get(v) || 0) + 1;
    c.set(v, n);
    if (n > bn) { bn = n; best = v; }
  });
  return best;
};

interface CW {
  id: string; name: string; display: string; slug: string; ref: string;
  price: number; image?: string; movement: "Quartz" | "Automatic"; size: number | null;
  strap: string; wr: string | null; spec: string; inStock: boolean; featured: boolean; tag: string;
}
interface CollMeta { name: string; slug: string; brand: string; brandSlug: string; }

const SORTS = ["Featured", "Name, A to Z", "Price, low to high", "Price, high to low"] as const;
type Sort = typeof SORTS[number];

const CollectionV2 = (): JSX.Element => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  const isMobile = useIsMobile();

  const [meta, setMeta] = useState<CollMeta | null>(null);
  const [watches, setWatches] = useState<CW[]>([]);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [allColls, setAllColls] = useState<any[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");

  const [sort, setSort] = useState<Sort>("Featured");
  const [view, setView] = useState<"Grid" | "List">("Grid");
  const [saved, setSaved] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => { document.body.style.background = T.paper; }, []);
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem("mcc_saved_watches") || "[]")); } catch { /* ignore */ }
  }, []);
  const toggleSave = (id: string) =>
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem("mcc_saved_watches", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

  useEffect(() => {
    window.scrollTo(0, 0);
    setStatus("loading");
    setSort("Featured");
    setView("Grid");
    setSiblings([]);
    let live = true;

    fetch(`${API_BASE_URL}/watches/collections/${collectionSlug}`)
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        const c = d?.data?.collection;
        const list: any[] = d?.data?.watches || [];
        if (!d?.success || !c) { setStatus("missing"); return; }
        const brand = c.brand?.name || "";
        setMeta({ name: c.name, slug: c.slug, brand, brandSlug: c.brand?.slug || "" });
        setWatches(
          list.map((w) => {
            const sp = w.specifications || {};
            const text = `${w.name || ""} ${w.description || ""}`;
            const size = caseSize(sp.case_diameter);
            const movement = inferMovement(text, sp.movement);
            const wr = parseWR(w.description);
            const specBits = [movement, size ? `${size}mm` : null, wr].filter(Boolean);
            return {
              id: String(w.id), name: w.name || "Watch",
              display: cleanWatchName(w.name, brand, "", 38), slug: w.slug || "", ref: w.slug || "",
              price: Number(w.sale_price ?? w.base_price) || 0,
              image: w.images?.[0]?.image_url, movement, size, strap: inferStrap(text), wr,
              spec: specBits.join(" · "), inStock: w.in_stock !== false, featured: !!w.is_featured,
              tag: w.is_featured ? "Most asked for" : "",
            } as CW;
          })
        );
        setStatus("ok");

        if (c.brand?.slug) {
          fetch(`${API_BASE_URL}/watches/brands/slug/${c.brand.slug}/collections`)
            .then((r) => r.json())
            .then((sd) => { if (live) setSiblings((sd?.data || []).filter((x: any) => (x.watches_count || 0) > 0)); })
            .catch(() => {});
        }
      })
      .catch(() => { if (live) setStatus("missing"); });

    if (allColls.length === 0) {
      fetch(`${API_BASE_URL}/watches/collections/all`)
        .then((r) => r.json())
        .then((d) => { if (live) setAllColls((d?.data || []).filter((x: any) => (x.watches_count || 0) > 0)); })
        .catch(() => {});
    }
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionSlug]);

  const facts = useMemo(() => {
    if (!watches.length) return [] as { label: string; value: string }[];
    const sizeMode = mode(watches.map((w) => w.size));
    const caseVal = sizeMode ? `${sizeMode}mm` : "—"; // case_material is not stored on watch specs
    const moveVal = mode(watches.map((w) => w.movement)) || "Quartz";
    const wrMode = mode(watches.map((w) => w.wr));
    const from = Math.min(...watches.map((w) => w.price).filter((p) => p > 0));
    return [
      { label: "Case", value: caseVal },
      { label: "Movement", value: moveVal },
      wrMode ? { label: "Water resistance", value: wrMode } : { label: "References", value: String(watches.length) },
      { label: "From", value: isFinite(from) ? money(from) : "—" },
    ];
  }, [watches]);

  const items = useMemo(() => {
    const list = [...watches];
    if (sort === "Name, A to Z") list.sort((a, b) => a.display.localeCompare(b.display));
    else if (sort === "Price, low to high") list.sort((a, b) => a.price - b.price);
    else if (sort === "Price, high to low") list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return list;
  }, [watches, sort]);

  const { prev, next } = useMemo(() => {
    if (!meta || allColls.length === 0) return { prev: null as any, next: null as any };
    const idx = allColls.findIndex((c) => c.slug === meta.slug);
    if (idx < 0) return { prev: null, next: null };
    return {
      prev: allColls[(idx - 1 + allColls.length) % allColls.length],
      next: allColls[(idx + 1) % allColls.length],
    };
  }, [meta, allColls]);

  if (status === "loading") {
    return (
      <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.ink }}>
        <NavigationV2 solid />
        <div style={{ height: isMobile ? 96 : 118 }} />
        <div style={{ padding: "120px 24px", textAlign: "center", color: T.muted, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}>Loading collection…</div>
        <FooterV2 />
      </div>
    );
  }
  if (status === "missing" || !meta) {
    return (
      <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.ink }}>
        <NavigationV2 solid />
        <div style={{ height: isMobile ? 96 : 118 }} />
        <div style={{ padding: "100px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 34, marginBottom: 14 }}>We couldn’t find that collection.</div>
          <p style={{ margin: "0 auto 26px", maxWidth: "40ch", fontSize: 14.5, lineHeight: 1.7, color: T.muted }}>It may have moved, or the reference has changed. Browse the full range instead.</p>
          <Link to="/watches" style={{ display: "inline-block", padding: "14px 28px", background: T.ink, color: T.paper, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>All watches</Link>
        </div>
        <FooterV2 />
      </div>
    );
  }

  const countLine = items.length === 1 ? "1 watch held" : `${items.length} watches held`;
  const sourceLine = `We are an authorised ${meta.brand} retailer, so anything in the ${meta.name} collection we do not hold can be ordered — usually two to three weeks. Tell us the reference, or describe it and we will find it.`;
  const blurb = `${items.length === 1 ? "One reference" : `${items.length} references`} from the ${meta.name} line, held and ready at the bench. Within a collection the case, movement and water resistance hold steady — what changes is the dial and the strap.`;

  return (
    <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.ink }}>
      <style>{`
        .cv a { color: inherit; text-decoration: none; }
        .cv-card:hover .cv-cardimg img { transform: scale(1.04); }
        .cv-view-a:hover { background: ${T.gold} !important; }
        .cv-src-a:hover { background: ${T.gold} !important; color: #fff !important; }
        @keyframes collIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes cvScrim { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cvSheet { from { transform: translateY(100%); } to { transform: none; } }
        @media (prefers-reduced-motion: reduce) { .cv-body, .cv-sheet, .cv-scrim { animation: none !important; } }
      `}</style>

      <div className="cv">
        <NavigationV2 solid />
        <div style={{ height: isMobile ? 96 : 118 }} />

        {/* Sibling collections tab bar (shippable nav in place of the review-only tab bar) */}
        {siblings.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "0 clamp(24px, 3vw, 52px)", background: T.tint, borderBottom: `1px solid ${T.rule}` }}>
            <div style={{ display: "flex", overflowX: "auto", flex: 1 }}>
              {siblings.map((s) => {
                const on = s.slug === meta.slug;
                return (
                  <Link key={s.slug} to={`/collections/${s.slug}`} style={{ padding: "14px clamp(12px, 1.6vw, 22px)", background: on ? T.paper : "transparent", borderBottom: `2px solid ${on ? T.ink : "transparent"}`, fontSize: 11.5, letterSpacing: "0.06em", color: on ? T.ink : T.muted, whiteSpace: "nowrap", transition: "color 0.25s ease, background 0.25s ease" }}>{s.name}</Link>
                );
              })}
            </div>
            {!isMobile && <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M2, whiteSpace: "nowrap" }}>{meta.brand} collections</span>}
          </div>
        )}

        <div key={meta.slug} className="cv-body" style={{ animation: "collIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
          {/* 1. Title band */}
          <section style={{ padding: "clamp(34px, 3.6vw, 60px) clamp(24px, 3vw, 52px) clamp(26px, 2.6vw, 40px)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M2, marginBottom: 22 }}>
              <Link to="/">Home</Link><span style={{ color: T.ruleStrong }}>/</span>
              <Link to="/watches">Watches</Link><span style={{ color: T.ruleStrong }}>/</span>
              <Link to={`/${meta.brandSlug}`}>{meta.brand}</Link><span style={{ color: T.ruleStrong }}>/</span>
              <span style={{ color: T.ink }}>{meta.name}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.15fr) minmax(0, 0.85fr)", gap: "clamp(24px, 5vw, 80px)", alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>{meta.brand} collection</div>
                <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(40px, 5vw, 78px)", lineHeight: 1.02, letterSpacing: "0.005em", margin: 0 }}>{meta.name}</h1>
              </div>
              <p style={{ margin: "0 0 6px", maxWidth: "44ch", fontSize: 15, lineHeight: 1.75, color: T.body }}>{blurb}</p>
            </div>
          </section>

          {/* 2. Fact strip */}
          {facts.length > 0 && (
            <section style={{ padding: "0 clamp(24px, 3vw, 52px)" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
                {facts.map((f, i) => {
                  const lastCol = isMobile ? i % 2 === 1 : i === 3;
                  return (
                    <div key={f.label} style={{ padding: "20px clamp(14px, 1.8vw, 28px) 20px 0", borderRight: lastCol ? "none" : `1px solid ${T.rule}`, borderTop: isMobile && i >= 2 ? `1px solid ${T.rule}` : "none" }}>
                      <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: M2, marginBottom: 9 }}>{f.label}</div>
                      <div style={{ fontSize: 14.5, color: T.ink }}>{f.value}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <main style={{ padding: "clamp(24px, 2.6vw, 38px) clamp(24px, 3vw, 52px) clamp(52px, 5vw, 88px)" }}>
            {/* 3. Toolbar */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, paddingBottom: 16, borderBottom: `1px solid ${T.rule}` }}>
              <label style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2 }}>Sort</span>
                {isMobile ? (
                  <button type="button" onClick={() => setSheetOpen(true)} style={{ padding: "9px 14px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, color: T.ink, background: "transparent", border: `1px solid ${T.ruleSoft}` }}>{sort} ▾</button>
                ) : (
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} style={{ padding: "9px 30px 9px 12px", fontFamily: FONT_BODY, fontSize: 12.5, color: T.ink, background: "transparent", border: `1px solid ${T.ruleSoft}`, borderRadius: 0, cursor: "pointer", appearance: "none" }}>
                    {SORTS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {!isMobile && (
                  <div style={{ display: "flex", gap: 4 }} role="radiogroup" aria-label="View">
                    {(["Grid", "List"] as const).map((v) => {
                      const on = v === view;
                      return (
                        <button key={v} type="button" role="radio" aria-checked={on} onClick={() => setView(v)} style={{ padding: "8px 14px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: on ? T.ink : M2, background: on ? T.tint : "transparent", border: `1px solid ${on ? T.ruleSoft : "transparent"}` }}>{v}</button>
                      );
                    })}
                  </div>
                )}
                <span style={{ fontSize: 12.5, color: T.muted }}>{countLine}</span>
              </div>
            </div>

            {/* 4a. Grid view */}
            {(isMobile || view === "Grid") && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "clamp(14px, 2vw, 30px)", marginTop: 30 }}>
                {items.map((w) => {
                  const on = saved.includes(w.id);
                  return (
                    <div key={w.id}>
                      <div className="cv-cardimg" style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(14px, 2.4vw, 26px)" }}>
                        <Link to={`/watches/${w.slug}`} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(14px, 2.4vw, 26px)" }}>
                          {w.image && <img src={getMediaUrl(w.image)} alt={w.name} loading="lazy" decoding="async" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.5s ease" }} />}
                        </Link>
                        {w.tag && <span style={{ position: "absolute", top: 10, left: 10, padding: "5px 10px", background: "rgba(248,246,240,0.94)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.body }}>{w.tag}</span>}
                        <button type="button" onClick={() => toggleSave(w.id)} aria-pressed={on} aria-label={`Save ${w.display}`} style={{ position: "absolute", top: 8, right: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(248,246,240,0.92)", border: 0, fontSize: 15, lineHeight: 1, color: on ? T.gold : M2, transition: "color 0.2s ease" }}>{on ? "♥" : "♡"}</button>
                      </div>
                      <Link to={`/watches/${w.slug}`} style={{ display: "block" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "16px 0 7px" }}>
                          <span style={{ fontSize: 14, lineHeight: 1.3 }}>{w.display}</span>
                          <span style={{ fontSize: 13.5, whiteSpace: "nowrap" }}>{money(w.price)}</span>
                        </div>
                        {w.spec && <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.muted }}>{w.spec}</div>}
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: 7 }}>
                          <span style={{ fontSize: 11.5, color: w.inStock ? GREEN : M2 }}>{w.inStock ? "In stock" : "To order"}</span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 4b. List view (desktop only) */}
            {!isMobile && view === "List" && (
              <div style={{ marginTop: 12 }}>
                {items.map((w) => {
                  const on = saved.includes(w.id);
                  return (
                    <div key={w.id} style={{ display: "grid", gridTemplateColumns: "132px minmax(0, 1.1fr) minmax(0, 1fr) auto", gap: "clamp(18px, 2.4vw, 40px)", alignItems: "center", padding: "22px 0", borderBottom: `1px solid ${T.rule}` }}>
                      <Link to={`/watches/${w.slug}`} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "4 / 5", background: "#FFFFFF", padding: 12 }}>
                        {w.image && <img src={getMediaUrl(w.image)} alt={w.name} loading="lazy" decoding="async" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />}
                      </Link>
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 9 }}>
                          <Link to={`/watches/${w.slug}`} style={{ fontSize: 16 }}>{w.display}</Link>
                          {w.tag && <span style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold }}>{w.tag}</span>}
                        </div>
                        {w.spec && <div style={{ fontSize: 13, lineHeight: 1.6, color: T.muted, marginBottom: 8 }}>{w.spec}</div>}
                        <div style={{ fontSize: 11.5, color: A9 }}>{w.inStock ? "In stock" : "To order, 2 weeks"}</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                        {[["Movement", w.movement], ["Case", w.size ? `${w.size}mm` : "—"], ["Strap", w.strap], ["Warranty", "2 years"]].map(([l, v]) => (
                          <div key={l} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, padding: "4px 0" }}>
                            <span style={{ fontSize: 11, color: M2 }}>{l}</span>
                            <span style={{ fontSize: 12.5, color: T.body }}>{v}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 1, marginBottom: 10 }}>{money(w.price)}</div>
                        <div style={{ fontSize: 11.5, color: w.inStock ? GREEN : M2, marginBottom: 14 }}>{w.inStock ? "In stock" : "To order"}</div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                          <button type="button" onClick={() => toggleSave(w.id)} aria-pressed={on} aria-label={`Save ${w.display}`} style={{ padding: "10px 12px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1, color: on ? T.gold : M2, background: "transparent", border: `1px solid ${T.ruleSoft}` }}>{on ? "♥" : "♡"}</button>
                          <Link to={`/watches/${w.slug}`} className="cv-view-a" style={{ padding: "11px 18px", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", background: T.ink, color: T.paper, transition: "background 0.25s ease" }}>View</Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 5. Previous / next collection */}
            {prev && next && (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "clamp(16px, 2vw, 32px)", marginTop: "clamp(44px, 4vw, 68px)" }}>
                <Link to={`/collections/${prev.slug}`} style={{ display: "block", padding: "26px 28px", border: `1px solid ${T.rule}` }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: M2, marginBottom: 12 }}>Previous collection</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px, 2vw, 30px)", lineHeight: 1.1 }}>{prev.name}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 8 }}>{prev.brand?.name} · {prev.watches_count} held</div>
                </Link>
                <Link to={`/collections/${next.slug}`} style={{ display: "block", padding: "26px 28px", textAlign: isMobile ? "left" : "right", border: `1px solid ${T.rule}` }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: M2, marginBottom: 12 }}>Next collection</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px, 2vw, 30px)", lineHeight: 1.1 }}>{next.name}</div>
                  <div style={{ fontSize: 12.5, color: T.muted, marginTop: 8 }}>{next.brand?.name} · {next.watches_count} held</div>
                </Link>
              </div>
            )}
          </main>

          {/* 6. Sourcing band — inkDeep + hairline so it reads as separate from the ink footer below */}
          <section style={{ background: T.inkDeep, color: T.onDarkSoft, padding: "clamp(48px, 4.6vw, 80px) clamp(24px, 3vw, 52px)", borderBottom: `1px solid ${T.ruleDark}` }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1.3fr)", gap: "clamp(28px, 5vw, 80px)", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>Not listed here</div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(26px, 2.8vw, 42px)", lineHeight: 1.12, margin: 0, maxWidth: "16ch", color: "#FFFFFF" }}>We can order the rest of the collection.</h2>
              </div>
              <div>
                <p style={{ margin: "0 0 28px", maxWidth: "48ch", fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>{sourceLine}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <Link to="/contact" className="cv-src-a" style={{ padding: "15px 28px", background: T.paper, color: T.ink, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", transition: "background 0.25s ease, color 0.25s ease" }}>Ask us to source one</Link>
                  <Link to={`/${meta.brandSlug}`} style={{ padding: "15px 28px", border: "1px solid rgba(248,246,240,0.4)", color: "#FFFFFF", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>All {meta.brand}</Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        <FooterV2 />
      </div>

      {/* Mobile sort bottom sheet */}
      {isMobile && sheetOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div className="cv-scrim" onClick={() => setSheetOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.42)", animation: "cvScrim 0.25s ease both" }} />
          <div className="cv-sheet" role="dialog" aria-modal="true" aria-label="Sort" style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: T.paper, borderTop: `1px solid ${T.rule}`, padding: "8px 0 calc(22px + env(safe-area-inset-bottom))", animation: "cvSheet 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: T.ruleStrong, margin: "10px auto 8px" }} />
            <div style={{ padding: "6px 22px 12px", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: M2 }}>Sort by</div>
            {SORTS.map((o) => {
              const on = o === sort;
              return (
                <button key={o} type="button" onClick={() => { setSort(o); setSheetOpen(false); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "16px 22px", cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 15, color: T.ink, textAlign: "left" }}>
                  <span>{o}</span>
                  {on && <span style={{ color: T.gold }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionV2;
