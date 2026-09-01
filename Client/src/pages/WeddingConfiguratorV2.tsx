import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { useIsMobile } from "../hooks/use-mobile";
import API_BASE_URL from "../config/api";

/**
 * Wedding ring — configurator PDP, wired to the Allied Gold catalogue
 * (migration 019, /api/v1/wedding/designs/:id). Images key on (design, colourway); the
 * hero and 360 rotation change on metal COLOUR FAMILY only (…Y yellow, …R red, else white).
 *
 * Pricing is intentionally NOT shown yet — a definitive per-combination price list is being
 * supplied separately. The page is made-to-order enquiry until then.
 */

const NAV_H = 96;
type CW = "Y" | "W" | "R";
const CW_LABEL: Record<CW, string> = { Y: "yellow", W: "white", R: "rose" };
const CW_SWATCH: Record<CW, string> = { Y: "#DFB23F", W: "#E1DFDA", R: "#DF9F7B" };

// Stable catalogue metal vocab (code → colourway, hallmark, swatch, short name).
const METAL_META: Record<string, { cw: CW; stamp: string; swatch: string }> = {
  "9Y": { cw: "Y", stamp: "375", swatch: "#D6AE58" }, "9W": { cw: "W", stamp: "375", swatch: "#D4D1CA" }, "9R": { cw: "R", stamp: "375", swatch: "#D6A288" },
  "14Y": { cw: "Y", stamp: "585", swatch: "#DBB24E" }, "14W": { cw: "W", stamp: "585", swatch: "#DAD7D1" }, "14R": { cw: "R", stamp: "585", swatch: "#DB9F82" },
  "18Y": { cw: "Y", stamp: "750", swatch: "#DFB23F" }, "18W": { cw: "W", stamp: "750", swatch: "#E1DFDA" }, "18R": { cw: "R", stamp: "750", swatch: "#DF9F7B" },
  PT: { cw: "W", stamp: "950", swatch: "#CFD1D0" }, PD: { cw: "W", stamp: "950", swatch: "#C4C6C3" }, PD5: { cw: "W", stamp: "500", swatch: "#BCBEBA" },
  ARG960: { cw: "W", stamp: "958", swatch: "#C8CBCA" },
};
const cwOf = (code: string): CW => METAL_META[code]?.cw || (String(code).toUpperCase().endsWith("Y") ? "Y" : String(code).toUpperCase().endsWith("R") ? "R" : "W");

// Cross-section drawings for the profile codes the catalogue uses.
const PROFILE_SVG: Record<string, string> = {
  C: "M2 6 Q22 0 42 6 L42 18 Q22 24 2 18 Z", // Court
  S: "M2 7 Q22 3 42 7 L42 17 Q22 21 2 17 Z", // Soft court
  E: "M2 5 L42 5 L42 17 Q22 22 2 17 Z",       // Flat court
  F: "M2 6 L42 6 L42 18 L2 18 Z",             // Flat
  D: "M2 18 L2 12 Q22 0 42 12 L42 18 Z",       // D-shape
};

// Metal notes by hallmark (from AlliedGold-Products.xlsx "How to use").
const METAL_NOTES: Record<string, string> = {
  "375": "9ct gold is 37.5% pure, the hardest-wearing of the golds and the most affordable.",
  "585": "14ct gold is 58.5% pure, sitting between 9ct and 18ct in both colour depth and price.",
  "750": "18ct gold is 75% pure — a richer, deeper colour and the choice most associated with fine jewellery.",
  "950": "A dense, naturally white precious metal that needs no plating and keeps its colour for life.",
  "500": "Palladium 500 is naturally white and noticeably light on the finger.",
  "958": "Argentium is a modern silver alloy, brighter than sterling and markedly more resistant to tarnish.",
};
const money = (n: number | null | undefined) => (n == null ? "" : "£" + Math.round(n).toLocaleString("en-GB"));

const DIM_ORDER = ["width", "profile", "weight", "quality", "carat", "origin", "coverage", "shape", "collection"];
const DIM_LABEL: Record<string, string> = {
  metal: "Metal", width: "Width", profile: "Profile", weight: "Weight", quality: "Stone quality",
  carat: "Carat", origin: "Stone origin", coverage: "Setting coverage", shape: "Stone shape", collection: "Collection",
};

interface Opt { value: string; label: string; }
interface Design {
  id: string; category: string; name: string; collection: string; family: string;
  description: string; shortDescription: string; descriptionTemplate: string; subtitle: string;
  variations: number; colourways: string[]; pricingModel: string; composed: boolean;
  widthMm: string; profile: string; profileCode: string; weightClass: string; series: string;
  hero: Record<CW, string | null>;
  spin: { Y: string | null; W: string | null; R: string | null; frames: number | null; start: number | null };
  options: Record<string, Opt[]>;
  variationRows: { metal: string; metalName: string; hallmark: string; colourway: string; price: number | null }[];
}

const PANELS = [
  { id: "about", title: "About this piece", body: "Formed from a single length of metal rather than cast, so the grain runs the whole way round. Every band is hallmarked at the London Assay Office and hand-finished on our own bench before it is sized.", points: ["Formed, not cast — no join to wear open", "Hallmarked at the London Assay Office", "Made to order in 3 to 4 weeks"] },
  { id: "sizing", title: "Sizing and fit", body: "Wider and heavier bands sit tighter than a narrow one at the same nominal size. Order from a measurement taken in the width you have chosen.", points: ["Free resizing within twelve months", "Sized in half sizes on request", "Wide bands: we recommend a half size up"] },
  { id: "delivery", title: "Delivery information", body: "Every order is dispatched fully insured and requires a signature on arrival.", points: ["Free insured UK delivery", "Made to order — 3 to 4 weeks", "30-day returns, 60-day exchange"] },
  { id: "engraving", title: "Engraving", body: "Hand engraving inside the band is complimentary on every wedding ring, in a script or block hand.", points: ["Up to 30 characters, no charge", "Hand engraved, not machine cut", "Adds two days to the order"] },
];

const WeddingConfiguratorV2 = (): JSX.Element => {
  const { productId } = useParams();
  const isMobile = useIsMobile();
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sel, setSel] = useState<Record<string, string>>({});
  const [view, setView] = useState<"still" | "360">("still");
  const [angle, setAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const drag = useRef({ on: false, x: 0, a: 0 });
  const [panel, setPanel] = useState<string | null>("about");
  const [variationsOpen, setVariationsOpen] = useState(false);
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    let alive = true; setLoading(true); setNotFound(false);
    fetch(`${API_BASE_URL}/wedding/designs/${encodeURIComponent(productId || "")}`)
      .then(r => r.json())
      .then(d => {
        if (!alive) return;
        if (!d.success) { setNotFound(true); return; }
        const dz: Design = d.design;
        setDesign(dz);
        // sensible defaults: white-ish metal, first value of every other axis
        const init: Record<string, string> = {};
        const metals = dz.options.metal || [];
        const whiteMetal = metals.find(m => cwOf(m.value) === "W") || metals[0];
        if (whiteMetal) init.metal = whiteMetal.value;
        for (const dim of DIM_ORDER) { const vs = dz.options[dim]; if (vs && vs.length) init[dim] = vs[0].value; }
        setSel(init);
      })
      .catch(() => { if (alive) setNotFound(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [productId]);

  // Live price from the authoritative lookup, on every configuration change.
  useEffect(() => {
    if (!design || !sel.metal) return;
    const params = new URLSearchParams({ design: design.id });
    (["metal", "width", "profile", "weight", "quality", "origin"] as const).forEach(k => { if (sel[k]) params.set(k, sel[k]); });
    let alive = true;
    const t = setTimeout(() => {
      fetch(`${API_BASE_URL}/wedding/price?${params.toString()}`)
        .then(r => r.json())
        .then(d => { if (alive) setPrice(d.success ? d.price : null); })
        .catch(() => { if (alive) setPrice(null); });
    }, 120);
    return () => { alive = false; clearTimeout(t); };
  }, [design, sel]);

  const colourway: CW = design && sel.metal ? cwOf(sel.metal) : "W";
  const hero = design ? (design.hero[colourway] || design.hero.W || design.hero.Y || design.hero.R) : null;
  const spinTpl = design ? (design.spin[colourway] || design.spin.W || design.spin.Y || design.spin.R) : null;
  const frames = design?.spin.frames || 0;
  const start = design?.spin.start ?? 0;
  const hasSpin = !!(spinTpl && frames);

  const frameIdx = useMemo(() => {
    if (!frames) return start;
    const a = ((angle % 360) + 360) % 360;
    return start + (Math.round((a / 360) * frames) % frames);
  }, [angle, frames, start]);
  const frameUrl = spinTpl ? spinTpl.replace("{index}", String(frameIdx)) : null;

  // 360 auto-rotates in a loop; the customer's first touch/drag stops it and hands over control.
  useEffect(() => {
    if (view !== "360" || !autoRotate || !hasSpin) return;
    const id = setInterval(() => setAngle((a) => a + 2.4), 55);
    return () => clearInterval(id);
  }, [view, autoRotate, hasSpin]);

  // Preload the whole spin sequence when the viewer opens, so auto-rotation and
  // dragging stay smooth instead of fetching each frame from the CDN on demand.
  useEffect(() => {
    if (view !== "360" || !hasSpin || !spinTpl) return;
    for (let i = 0; i < frames; i++) {
      const img = new Image();
      img.src = spinTpl.replace("{index}", String(start + i));
    }
  }, [view, hasSpin, spinTpl, frames, start]);

  const dragStart = (e: React.MouseEvent | React.TouchEvent) => { setAutoRotate(false); const x = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX; drag.current = { on: true, x, a: angle }; };
  const dragMove = (e: React.MouseEvent | React.TouchEvent) => { if (!drag.current.on) return; const x = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX; setAngle(drag.current.a + (x - drag.current.x) * 1.1); };
  const dragEnd = () => { drag.current.on = false; };

  const metalLabel = (code: string) => design?.options.metal?.find(m => m.value === code)?.label || code;
  const selLabel = (dim: string) => design?.options[dim]?.find(o => o.value === sel[dim])?.label || sel[dim];

  // Which axes are user-selectable (more than one value); single-value dims are fixed spec.
  const axisDims = design ? DIM_ORDER.filter(d => (design.options[d]?.length || 0) > 0) : [];
  const stepDims = design ? ["metal", ...axisDims] : [];

  const title = design ? design.name : "";
  const stampNow = METAL_META[sel.metal]?.stamp || "";
  const resolvedDesc = design
    ? (design.descriptionTemplate || design.description || "")
        .replace(/\{metal\}/g, metalLabel(sel.metal || ""))
        .replace(/\{hallmark\}/g, stampNow)
        .replace(/\{metalNote\}/g, METAL_NOTES[stampNow] || "")
    : "";
  const descParas = resolvedDesc.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  const eyebrow: React.CSSProperties = { fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#8A8377" };
  const stepLabel: React.CSSProperties = { fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: T.ink };

  if (notFound) {
    return (
      <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
        <NavigationV2 solid />
        <div style={{ paddingTop: NAV_H + 80, textAlign: "center", padding: `${NAV_H + 80}px 24px 120px` }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, marginBottom: 12 }}>Design not found</div>
          <Link to="/wedding-rings" style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold, borderBottom: `1px solid ${T.ruleStrong}` }}>Back to wedding rings</Link>
        </div>
        <FooterV2 />
      </div>
    );
  }

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        .wc a { color: inherit; text-decoration: none; }
        .wc-guide:hover { color: ${T.gold} !important; }
        .wc-cta:hover { background: ${T.gold} !important; }
        @keyframes wcStageIn { from { opacity:0; } to { opacity:1; } }
        @keyframes wcPriceIn { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:none; } }
        @media (max-width: 960px){
          .wc-main{ grid-template-columns: 1fr !important; }
          .wc-stage{ position: static !important; }
          .wc-metalgrid{ grid-template-columns: repeat(4,1fr) !important; }
          .wc-stagebox{ aspect-ratio: 5 / 4 !important; }
        }
      `}</style>
      <NavigationV2 solid />

      <div className="wc" style={{ paddingTop: NAV_H }}>
        <div style={{ display: "flex", gap: 10, padding: "18px clamp(24px,3vw,52px)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8377" }}>
          <Link to="/">Home</Link><span>/</span><Link to="/wedding-rings">Wedding rings</Link><span>/</span><span style={{ color: T.ink }}>{loading ? "…" : title}</span>
        </div>

        <main className="wc-main" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.15fr) minmax(460px,0.85fr)", gap: "clamp(32px,4vw,72px)", padding: "0 clamp(24px,3vw,52px) clamp(64px,6vw,104px)", alignItems: "start" }}>

          {/* Image stage */}
          <div className="wc-stage" style={{ position: "sticky", top: NAV_H + 4 }}>
            <div key={colourway + view} className="wc-stagebox" style={{ position: "relative", aspectRatio: "4 / 3", background: T.tint, overflow: "hidden", animation: "wcStageIn 0.32s ease both" }}>
              {view === "still" ? (
                hero ? <img src={hero} alt={title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                     : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: "#8C8375" }}>{title}</div>
              ) : (
                <div onMouseDown={dragStart} onMouseMove={dragMove} onMouseUp={dragEnd} onMouseLeave={dragEnd} onTouchStart={dragStart} onTouchMove={dragMove} onTouchEnd={dragEnd}
                  style={{ position: "absolute", inset: 0, cursor: drag.current.on ? "grabbing" : "grab", touchAction: "none", background: "#E9E3D6" }}>
                  {frameUrl && <img src={frameUrl} alt={`${title} 360`} draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />}
                </div>
              )}
              <div style={{ position: "absolute", top: 16, left: 16, pointerEvents: "none", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>{view === "360" ? "360° — drag to rotate" : "Three-quarter"}</div>
              <div style={{ position: "absolute", bottom: 18, right: 16, pointerEvents: "none", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8A8377" }}>{CW_LABEL[colourway]} metal</div>
              {hasSpin && view === "still" && (
                <button type="button" onClick={() => { setView("360"); setAutoRotate(true); }} className="wc-guide" style={{ position: "absolute", bottom: 16, left: 16, padding: "8px 14px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink, background: "rgba(248,246,240,0.92)", border: `1px solid ${T.ruleSoft}` }}>View 360°</button>
              )}
              {view === "360" && (
                <button type="button" onClick={() => setView("still")} style={{ position: "absolute", bottom: 16, left: 16, padding: "8px 14px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.paper, background: T.ink, border: `1px solid ${T.ink}` }}>Close 360°</button>
              )}
            </div>

            {/* Colourway thumbnails */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {(["Y", "W", "R"] as CW[]).filter(cw => design?.hero[cw]).map(cw => {
                const on = cw === colourway;
                const metalForCw = design?.options.metal?.find(m => cwOf(m.value) === cw);
                return (
                  <button key={cw} type="button" onClick={() => { if (metalForCw) { setSel(s => ({ ...s, metal: metalForCw.value })); setView("still"); } }} title={CW_LABEL[cw]}
                    style={{ position: "relative", width: 84, aspectRatio: "1", padding: 0, cursor: "pointer", background: T.tint, border: `1px solid ${on ? T.ink : T.rule}`, overflow: "hidden" }}>
                    <img src={design!.hero[cw]!} alt={CW_LABEL[cw]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 14, fontSize: 11.5, color: "#8A8377" }}>Photographed in {CW_LABEL[colourway]} metal. Carat and alloy do not change the photograph.</div>
          </div>

          {/* Configurator */}
          <div style={{ paddingTop: 4 }}>
            {loading ? (
              <div style={{ paddingTop: 40 }}>
                <div style={{ height: 44, width: "80%", background: T.tint, marginBottom: 16 }} />
                <div style={{ height: 14, width: "40%", background: T.tint, marginBottom: 40 }} />
                <div style={{ height: 120, background: T.tint }} />
              </div>
            ) : design && (
              <>
                <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(30px,3vw,44px)", lineHeight: 1.08, letterSpacing: "0.005em", margin: "0 0 12px", maxWidth: "24ch" }}>{title}</h1>
                <div style={{ ...eyebrow }}>{design.category} · {metalLabel(sel.metal || "")}</div>

                <div key={price ?? "na"} style={{ display: "flex", alignItems: "baseline", gap: 14, margin: "24px 0 6px", animation: "wcPriceIn 0.34s cubic-bezier(0.22,1,0.36,1) both" }} aria-live="polite">
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, lineHeight: 1 }}>{price != null ? money(price) : "—"}</div>
                  <div style={{ fontSize: 12.5, color: T.muted }}>in {metalLabel(sel.metal || "")}</div>
                </div>
                <div style={{ fontSize: 12, color: "#8A8377", paddingBottom: 24, borderBottom: `1px solid ${T.rule}` }}>Indicative price · includes VAT · confirmed at order. Made to order, hand-finished in the UK.</div>

                {descParas.length > 0
                  ? descParas.map((para, i) => <p key={i} style={{ margin: i === 0 ? "24px 0 0" : "14px 0 0", fontSize: 15, lineHeight: 1.75, color: T.body, maxWidth: "54ch" }}>{para}</p>)
                  : <p style={{ margin: "24px 0 0", fontSize: 15, lineHeight: 1.75, color: T.body, maxWidth: "54ch" }}>A hand-finished wedding band, formed and hallmarked in our workshop.</p>}

                {/* Metal */}
                {design.options.metal?.length ? (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
                      <div style={stepLabel}><span style={{ color: T.gold }}>01</span> &nbsp;Metal</div>
                      <div style={{ fontSize: 12.5, color: T.muted }}>{metalLabel(sel.metal || "")}{METAL_META[sel.metal]?.stamp ? " · " + METAL_META[sel.metal].stamp : ""}</div>
                    </div>
                    <div className="wc-metalgrid" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                      {design.options.metal.map(m => {
                        const on = m.value === sel.metal;
                        const meta = METAL_META[m.value];
                        return (
                          <button key={m.value} type="button" title={m.label} onClick={() => { setSel(s => ({ ...s, metal: m.value })); setView("still"); }}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "9px 4px 8px", cursor: "pointer", fontFamily: FONT_BODY, background: on ? T.ink : "transparent", border: `1px solid ${on ? T.ink : T.ruleSoft}` }}>
                            <span style={{ width: 22, height: 22, borderRadius: "50%", background: meta?.swatch || "#ccc", border: "1px solid rgba(28,26,23,0.18)", boxShadow: "inset 0 -3px 5px rgba(28,26,23,0.14)" }} />
                            <span style={{ fontSize: 10, lineHeight: 1.2, textAlign: "center", color: on ? T.paper : T.body }}>{m.label}</span>
                            <span style={{ fontSize: 9, letterSpacing: "0.1em", color: "#A9A196" }}>{meta?.stamp || ""}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Other axes */}
                {axisDims.map((dim, i) => {
                  const opts = design.options[dim];
                  const isProfile = dim === "profile";
                  return (
                    <div key={dim} style={{ marginTop: 34 }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 14 }}>
                        <div style={stepLabel}><span style={{ color: T.gold }}>{String(i + 2).padStart(2, "0")}</span> &nbsp;{DIM_LABEL[dim] || dim}</div>
                        <div style={{ fontSize: 12.5, color: T.muted }}>{selLabel(dim)}</div>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {opts.map(o => {
                          const on = o.value === sel[dim];
                          if (isProfile) {
                            const d = PROFILE_SVG[o.value] || PROFILE_SVG.C;
                            return (
                              <button key={o.value} type="button" onClick={() => setSel(s => ({ ...s, [dim]: o.value }))}
                                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 12px 9px", cursor: "pointer", fontFamily: FONT_BODY, background: on ? T.ink : "transparent", border: `1px solid ${on ? T.ink : T.ruleSoft}`, minWidth: 92 }}>
                                <svg viewBox="0 0 44 24" width="44" height="24" aria-hidden="true"><path d={d} fill={on ? T.gold : T.ruleSoft} stroke={on ? T.gold : "#8A8377"} strokeWidth="0.9" /></svg>
                                <span style={{ fontSize: 10.5, textAlign: "center", color: on ? T.paper : T.body }}>{o.label}</span>
                              </button>
                            );
                          }
                          return (
                            <button key={o.value} type="button" onClick={() => setSel(s => ({ ...s, [dim]: o.value }))}
                              style={{ padding: "11px 16px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, color: on ? T.paper : T.body, background: on ? T.ink : "transparent", border: `1px solid ${on ? T.ink : T.ruleSoft}` }}>{o.label}</button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Enquiry (pricing pending) */}
                <div style={{ marginTop: 34, padding: "18px 20px", background: T.tint }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: T.body }}>Made to order in your chosen metal and specification. <span style={{ color: T.ink }}>The price is confirmed with you before anything is cut</span> — metal prices move daily.</div>
                </div>
                <Link to="/contact" className="wc-cta" style={{ display: "block", textAlign: "center", width: "100%", marginTop: 16, padding: 17, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0 }}>Enquire about this design{price != null ? " — " + money(price) : ""}</Link>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, marginTop: 20, background: T.rule, border: `1px solid ${T.rule}` }}>
                  {[["01", "Book an appointment"], ["02", "Order by phone"], ["03", "Drop a hint"]].map(([n, label]) => (
                    <Link key={n} to="/contact" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, padding: "20px 8px", background: T.paper, fontSize: 10.5, letterSpacing: "0.13em", textTransform: "uppercase", textAlign: "center", color: T.body }}>
                      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: T.gold }}>{n}</span>{label}
                    </Link>
                  ))}
                </div>

                {/* All metals (no price yet) */}
                {design.variationRows?.length > 0 && (
                  <div style={{ marginTop: 40, borderTop: `1px solid ${T.rule}` }}>
                    <div style={{ borderBottom: `1px solid ${T.rule}` }}>
                      <button type="button" onClick={() => setVariationsOpen(o => !o)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%", padding: "18px 0", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink, background: "transparent", border: 0, textAlign: "left" }}>
                        <span>Available metals</span>
                        <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}><span style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "none", color: "#8A8377" }}>{design.variationRows.length} metals</span><span style={{ color: T.gold, fontSize: 15 }}>{variationsOpen ? "−" : "+"}</span></span>
                      </button>
                      {variationsOpen && (
                        <div style={{ padding: "0 0 22px" }}>
                          {design.variationRows.map(v => (
                            <button key={v.metal} type="button" onClick={() => { setSel(s => ({ ...s, metal: v.metal })); setView("still"); }}
                              style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) 52px 1fr auto", gap: 12, alignItems: "baseline", width: "100%", padding: "11px 8px 11px 0", cursor: "pointer", textAlign: "left", fontFamily: FONT_BODY, background: v.metal === sel.metal ? T.tint : "transparent", border: 0, borderBottom: `1px solid ${T.rule}` }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: T.ink }}>
                                <span style={{ flex: "none", width: 13, height: 13, borderRadius: "50%", background: METAL_META[v.metal]?.swatch || "#ccc", border: "1px solid rgba(28,26,23,0.18)" }} />{v.metalName || metalLabel(v.metal)}
                              </span>
                              <span style={{ fontSize: 11.5, color: "#A9A196" }}>{v.hallmark || METAL_META[v.metal]?.stamp}</span>
                              <span style={{ fontSize: 10.5, color: "#A9A196", textTransform: "uppercase", letterSpacing: "0.1em" }}>{CW_LABEL[cwOf(v.metal)]}</span>
                              <span style={{ fontSize: 13, textAlign: "right", color: "#56534D" }}>{v.price != null ? "from " + money(v.price) : ""}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {PANELS.map(pp => (
                      <div key={pp.id} style={{ borderBottom: `1px solid ${T.rule}` }}>
                        <button type="button" onClick={() => setPanel(panel === pp.id ? null : pp.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%", padding: "18px 0", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink, background: "transparent", border: 0, textAlign: "left" }}>
                          <span>{pp.title}</span><span style={{ color: T.gold, fontSize: 15 }}>{panel === pp.id ? "−" : "+"}</span>
                        </button>
                        {panel === pp.id && (
                          <div style={{ padding: "0 0 22px" }}>
                            <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.75, color: T.body, maxWidth: "54ch" }}>{pp.body}</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {pp.points.map(pt => <div key={pt} style={{ display: "flex", gap: 12, fontSize: 13.5, lineHeight: 1.6, color: T.body }}><span style={{ color: T.gold }}>—</span>{pt}</div>)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Promise band */}
        <section style={{ background: T.ink, color: T.onDarkSoft, padding: "clamp(60px,5.5vw,100px) clamp(24px,3vw,52px)" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) minmax(0,1fr)", gap: "clamp(36px,5vw,88px)", alignItems: "end", paddingBottom: 44, borderBottom: `1px solid ${T.ruleDark}` }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, marginBottom: 22 }}>Our promise</div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(30px,3.4vw,52px)", lineHeight: 1.1, margin: 0, maxWidth: "15ch", color: "#FFFFFF" }}>Where craftsmanship meets distinction.</h2>
              </div>
              <p style={{ margin: "0 0 6px", maxWidth: "44ch", fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>Every band is cut, formed, hallmarked and finished by the same bench. Nothing is outsourced and nothing leaves the building unfinished.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 40 }}>
              <Link to="/contact" style={{ padding: "14px 28px", background: T.paper, color: T.ink, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Book a private consultation</Link>
              <Link to="/wedding-rings" style={{ padding: "14px 28px", border: `1px solid ${T.ruleDarkStrong}`, color: "#FFFFFF", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>All wedding rings</Link>
            </div>
          </div>
        </section>
      </div>

      <FooterV2 />
    </div>
  );
};

export default WeddingConfiguratorV2;
