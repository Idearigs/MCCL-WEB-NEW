import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import { useIsMobile } from "../hooks/use-mobile";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { cleanWatchName } from "./WatchesV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * WatchDetailV2 — the watch PDP, the deliberate opposite of the ring PDP.
 * VISUAL design: design_handoff_mcculloch_signin_chat_watches (Watch PDP). Dark full-bleed
 * hero, four-fact strip, spec ledger, "On the wrist" dimension bars, sticky buy column,
 * accordions, movement section on ink.
 *
 * WIRED to GET /watches/:slug (+ /watches/:id/straps). Only spec rows that carry a real
 * value are shown. Money stays truthful: total = base price + any real strap add-on
 * (from the straps endpoint's price_gbp). Engraving is collected as a free caseback note
 * ("we confirm any charge before cutting") rather than an invented upcharge. Dimension
 * bars are computed against fixed maxima so they stay comparable across the catalogue.
 */

const M2 = "#8A8377";
const GREEN = "#4A7A52";
const money = (n?: number) => (n == null || isNaN(n) ? "—" : "£" + Math.round(n).toLocaleString("en-GB"));
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

interface Strap { id: string; name: string; strap_type?: string; color?: string; width_mm?: number; price_gbp?: number; image_url?: string }

const PANELS = [
  { id: "warranty", title: "Warranty and servicing", body: "Manufacturer warranty from the date of purchase, registered by us on the day it leaves. After that, servicing is done at our own bench — a full service is quoted before any work starts, and we will tell you honestly whether it needs one yet. We do not post movements away." },
  { id: "delivery", title: "Delivery and sizing", body: "In-stock references are timed, regulated and posted within 48 hours by insured courier, signature required. Tell us your wrist measurement at checkout and the bracelet is sized before dispatch, with the removed links in the box. Prefer it sized in person? Choose collection and we will do it while you wait." },
  { id: "returns", title: "Returns and exchanges", body: "Thirty days to change your mind, provided the watch is unworn, the protective films are on, and the papers and links are with it. Engraved casebacks cannot be returned unless there is a fault — we confirm the wording with you in writing before anything is cut." },
  { id: "authorised", title: "Why buy from an authorised retailer", body: "The warranty is valid, the reference is the one on the box, and the watch has not been sitting in a grey-market drawer for years. We are authorised for all three houses we sell, which also means we can order references we do not hold and get parts when a service needs them." },
];

const ASSURANCES = [
  "Timed and regulated on our bench before dispatch",
  "Bracelet sized to your wrist, links in the box",
  "Manufacturer warranty, registered by us",
  "Serviced here for as long as you own it",
];

const WatchDetailV2 = (): JSX.Element => {
  const { productId } = useParams();
  const isMobile = useIsMobile();
  const { addToCart } = useCart();
  const { addFavorite } = useFavorites();

  const [watch, setWatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<any[]>([]);
  const [straps, setStraps] = useState<Strap[]>([]);

  const [viewIdx, setViewIdx] = useState(0);
  const [strapId, setStrapId] = useState<string | null>(null);
  const [engrave, setEngrave] = useState(false);
  const [engraveText, setEngraveText] = useState("");
  const [panel, setPanel] = useState<string | null>("warranty");
  const [saved, setSaved] = useState(false);

  useEffect(() => { document.body.style.background = T.paper; window.scrollTo(0, 0); }, [productId]);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/watches/${productId}`).then((r) => r.json()).then((d) => {
      const w = d?.data?.watch || d?.data || null;
      setWatch(w); setLoading(false); setViewIdx(0);
      if (w?.id) {
        fetch(`${API_BASE_URL}/watches/${w.id}/straps`).then((r) => r.json()).then((sd) => setStraps(sd?.data || sd?.straps || [])).catch(() => {});
      }
      if (w?.brand?.slug || w?.brand?.name) {
        // Server-side brand filter + tiny limit, instead of pulling 24 full records to
        // keep 4 — much less to download and parse on this secondary request.
        const q = w.brand?.slug ? `brand=${encodeURIComponent(w.brand.slug)}&limit=5` : `limit=24`;
        fetch(`${API_BASE_URL}/watches?${q}`).then((r) => r.json()).then((rd) => {
          const list: any[] = rd?.data?.watches || rd?.data || [];
          setRelated(list.filter((x) => x.id !== w.id && (!x.brand?.name || x.brand.name === w.brand.name)).slice(0, 4));
        }).catch(() => {});
      }
    }).catch(() => setLoading(false));
  }, [productId]);

  const images: any[] = watch?.images || [];
  const imgUrl = (im: any) => im?.image_url || im?.url;
  const heroImg = imgUrl(images[viewIdx]) || imgUrl(images[0]) || watch?.image?.url;

  const sp = watch?.specifications || {};
  const basePrice = Number(watch?.sale_price ?? watch?.base_price) || 0;
  const selStrap = straps.find((s) => s.id === strapId) || null;
  const total = basePrice + (selStrap?.price_gbp ? Number(selStrap.price_gbp) : 0);

  const specRows = useMemo(() => {
    const dia = sp.case_diameter && `${Math.round(parseFloat(sp.case_diameter))}mm`;
    const rows: [string, string | undefined | null][] = [
      ["Reference", watch?.model_number || watch?.sku],
      ["Movement", cap(sp.movement) || cap(sp.movement_type)],
      ["Case material", cap(sp.case_material)],
      ["Case diameter", dia],
      ["Case thickness", sp.case_thickness && `${sp.case_thickness}mm`],
      ["Crystal", cap(sp.crystal_material) || cap(sp.glass_type)],
      ["Water resistance", sp.water_resistance],
      ["Dial", cap(sp.dial_color) || cap(sp.dial)],
      ["Strap", [cap(sp.strap_material), cap(sp.strap_color)].filter(Boolean).join(", ") || undefined],
      ["Lug width", sp.lug_width && `${sp.lug_width}mm`],
      ["Complications", cap(sp.complications) || cap(sp.functions)],
      ["Power reserve", sp.power_reserve],
      ["Gender", cap(watch?.gender)],
      ["Warranty", watch?.warranty_years ? `${watch.warranty_years} year${watch.warranty_years > 1 ? "s" : ""}, manufacturer` : undefined],
    ];
    return rows.filter(([, v]) => v && String(v).trim()) as [string, string][];
  }, [watch]);

  const dims = useMemo(() => {
    const out: { label: string; value: string; pct: number }[] = [];
    const dia = parseFloat(sp.case_diameter);
    const thick = parseFloat(sp.case_thickness);
    const lug = parseFloat(sp.lug_width);
    if (!isNaN(dia) && dia >= 20 && dia <= 50) out.push({ label: "Case diameter", value: `${Math.round(dia)}mm`, pct: Math.min(100, (dia / 50) * 100) });
    if (!isNaN(thick) && thick > 0 && thick < 25) out.push({ label: "Thickness", value: `${thick}mm`, pct: Math.min(100, (thick / 18) * 100) });
    if (!isNaN(lug) && lug > 0 && lug < 30) out.push({ label: "Lug width", value: `${lug}mm`, pct: Math.min(100, (lug / 24) * 100) });
    return out;
  }, [watch]);

  const fourFacts = useMemo(() => {
    const dia = sp.case_diameter && `${Math.round(parseFloat(sp.case_diameter))}mm`;
    return [
      { label: "Movement", value: cap(sp.movement_type) || cap(sp.movement) || "—" },
      { label: "Case", value: [dia, cap(sp.case_material)].filter(Boolean).join(" ") || "—" },
      { label: "Water resistance", value: sp.water_resistance || "—" },
      { label: "Crystal", value: cap(sp.crystal_material) || cap(sp.glass_type) || "—" },
    ];
  }, [watch]);

  const addBag = () => {
    if (!watch) return;
    const opts: any = { brand: watch.brand?.name };
    if (selStrap) opts.strap = `${selStrap.name}${selStrap.price_gbp ? ` (+${money(Number(selStrap.price_gbp))})` : ""}`;
    if (engrave && engraveText.trim()) opts.engraving = engraveText.trim();
    addToCart({ id: watch.id, name: watch.name, price: money(total), image: heroImg ? getMediaUrl(heroImg) : "", brand: watch.brand?.name, type: "watch", selectedOptions: opts });
  };

  const save = () => { if (watch) { addFavorite(watch.id).catch(() => {}); setSaved(true); } };

  if (loading) return (<div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY }}><NavigationV2 solid /><div style={{ height: 118 }} /><div style={{ padding: "80px 24px", textAlign: "center", color: T.muted }}>Loading…</div><FooterV2 /></div>);
  if (!watch) return (<div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY }}><NavigationV2 solid /><div style={{ height: 118 }} /><div style={{ padding: "80px 24px", textAlign: "center" }}><div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, marginBottom: 12 }}>Watch not found.</div><Link to="/watches" className="wd-under" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", borderBottom: `1px solid ${T.ruleStrong}`, paddingBottom: 4 }}>Back to watches</Link></div><FooterV2 /></div>);

  const brandName = watch.brand?.name || "";

  return (
    <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.ink }}>
      <style>{`
        .wd a { color: inherit; text-decoration: none; }
        .wd-under:hover { color: ${T.gold}; }
        .wd-add:hover { background: ${T.gold} !important; }
        .wd-outline:hover { border-color: ${T.ink} !important; }
        .wd-range::-webkit-slider-thumb { -webkit-appearance: none; }
      `}</style>

      <div className="wd">
        <NavigationV2 solid />
        <div style={{ height: isMobile ? 96 : 118 }} />

        {/* Dark hero */}
        <section style={{ position: "relative", background: T.inkDeep, color: T.onDarkSoft }}>
          <div style={{ position: "relative", height: "clamp(420px, 62vh, 700px)", overflow: "hidden" }}>
            {heroImg && <img src={getMediaUrl(heroImg)} alt={watch.name} decoding="async" {...({ fetchpriority: "high" } as any)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "clamp(24px,5vw,64px)" }} />}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to top, rgba(18,16,13,0.72), rgba(18,16,13,0) 46%, rgba(18,16,13,0.42))" }} />

            {/* Top row: breadcrumb + ref */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "22px clamp(24px, 3vw, 52px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(248,246,240,0.7)" }}>
                <Link to="/watches" style={{ color: "rgba(248,246,240,0.7)" }}>Watches</Link>
                <span style={{ color: "rgba(248,246,240,0.4)" }}>/</span>
                <span style={{ color: "#FFFFFF" }}>{brandName}</span>
              </div>
              {(watch.model_number || watch.sku) && <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(248,246,240,0.7)" }}>Ref. {watch.model_number || watch.sku}</div>}
            </div>

            {/* Bottom: name + thumbnails */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, padding: "0 clamp(24px, 3vw, 52px) 30px" }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: "#DED7CB", marginBottom: 14 }}>{brandName}</div>
                <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(30px, 4.4vw, 64px)", lineHeight: 1.02, letterSpacing: "0.005em", margin: 0, color: "#FFFFFF", maxWidth: "20ch" }}>{cleanWatchName(watch.name, brandName, watch.model_number || watch.sku, 80)}</h1>
              </div>
              {images.length > 1 && (
                <div style={{ display: "flex", gap: 6 }}>
                  {images.slice(0, 5).map((im, i) => (
                    <button key={i} type="button" onClick={() => setViewIdx(i)} style={{ width: 68, padding: 0, cursor: "pointer", background: "transparent", border: `1px solid ${i === viewIdx ? "#F8F6F0" : "rgba(248,246,240,0.32)"}` }}>
                      <span style={{ position: "relative", display: "block", aspectRatio: 1, background: "#22201B" }}>
                        {imgUrl(im) && <img src={getMediaUrl(imgUrl(im))} alt="" loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Four-fact strip */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", borderTop: "1px solid #2A2620" }}>
            {fourFacts.map((h, i) => (
              <div key={h.label} style={{ padding: "20px clamp(16px, 2vw, 32px)", borderRight: !isMobile && i < 3 ? "1px solid #2A2620" : "none", borderBottom: isMobile && i < 2 ? "1px solid #2A2620" : "none" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#6E6259", marginBottom: 10 }}>{h.label}</div>
                <div style={{ fontSize: 15, color: "#FFFFFF" }}>{h.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Body */}
        <main style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.25fr) minmax(360px, 0.75fr)", gap: "clamp(32px, 4vw, 76px)", padding: "clamp(32px, 4vw, 68px) clamp(24px, 3vw, 52px) clamp(48px, 6vw, 92px)", alignItems: "start" }}>
          {/* Left */}
          <div>
            {watch.short_description || watch.description ? (
              <p style={{ margin: "0 0 34px", maxWidth: "58ch", fontSize: 16, lineHeight: 1.8, color: T.body }}>{watch.short_description || watch.description}</p>
            ) : null}

            {/* Spec ledger */}
            {specRows.length > 0 && (
              <>
                <div style={{ paddingBottom: 16, borderBottom: `1px solid ${T.rule}` }}>
                  <span style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>Specification</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: `0 clamp(28px, 3.4vw, 56px)` }}>
                  {specRows.map(([label, value]) => (
                    <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)", gap: 16, alignItems: "baseline", padding: "13px 0", borderBottom: `1px solid ${T.rule}` }}>
                      <span style={{ fontSize: 12, color: M2 }}>{label}</span>
                      <span style={{ fontSize: 13.5, color: T.ink }}>{value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* On the wrist */}
            {dims.length > 0 && (
              <div style={{ marginTop: "clamp(40px, 4vw, 64px)" }}>
                <div style={{ paddingBottom: 16, borderBottom: `1px solid ${T.rule}` }}>
                  <span style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase" }}>On the wrist</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "clamp(24px, 3.4vw, 56px)", marginTop: 26 }}>
                  <div>
                    {dims.map((d) => (
                      <div key={d.label} style={{ padding: "14px 0", borderBottom: `1px solid ${T.rule}` }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 9 }}>
                          <span style={{ fontSize: 12.5, color: T.body }}>{d.label}</span>
                          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 19, lineHeight: 1 }}>{d.value}</span>
                        </div>
                        <div style={{ height: 2, background: T.rule }}><div style={{ width: `${d.pct}%`, height: 2, background: T.gold }} /></div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.75, color: T.body }}>The measurements above are the honest ones — case, thickness and lug width decide how a watch actually sits, more than the name on the dial. If you are between sizes, tell us your wrist measurement and we will say plainly whether this is the right shape for you.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 20, borderTop: `1px solid ${T.rule}` }}>
                      <Link to="/contact" className="wd-under" style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", paddingBottom: 4, borderBottom: `1px solid ${T.ruleStrong}`, alignSelf: "flex-start" }}>Try it on in the showroom</Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accordions */}
            <div style={{ marginTop: "clamp(40px, 4vw, 64px)", borderTop: `1px solid ${T.rule}` }}>
              {PANELS.map((p) => {
                const on = panel === p.id;
                return (
                  <div key={p.id} style={{ borderBottom: `1px solid ${T.rule}` }}>
                    <button type="button" onClick={() => setPanel(on ? null : p.id)} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, width: "100%", padding: "20px 0", cursor: "pointer", background: "transparent", border: 0, textAlign: "left", fontFamily: FONT_BODY, fontSize: 15, color: on ? T.ink : T.heading }}>
                      <span>{p.title}</span>
                      <span style={{ fontSize: 16, color: T.gold, transition: "transform 0.28s ease", transform: on ? "rotate(45deg)" : "none" }}>+</span>
                    </button>
                    {on && <p style={{ margin: 0, padding: "0 0 22px", maxWidth: "62ch", fontSize: 14, lineHeight: 1.75, color: T.body }}>{p.body}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buy column */}
          <aside style={{ position: isMobile ? "static" : "sticky", top: 130 }}>
            <div style={{ padding: 28, border: `1px solid ${T.rule}` }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, paddingBottom: 20, borderBottom: `1px solid ${T.rule}` }}>
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: M2, marginBottom: 10 }}>Price</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 38, lineHeight: 1 }}>{money(basePrice)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: watch.in_stock !== false ? GREEN : M2, marginBottom: 7 }}>{watch.in_stock !== false ? "In stock" : "To order"}</div>
                  <div style={{ fontSize: 11.5, color: M2 }}>Posted within 48 hours</div>
                </div>
              </div>

              {/* Strap add-ons (real accessories) */}
              {straps.length > 0 && (
                <div style={{ padding: "22px 0 0" }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2 }}>Add a strap</span>
                    <span style={{ fontSize: 12, color: T.muted }}>Optional</span>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <button type="button" onClick={() => setStrapId(null)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "13px 14px", cursor: "pointer", fontFamily: FONT_BODY, background: strapId === null ? T.ink : "transparent", border: `1px solid ${strapId === null ? T.ink : T.ruleSoft}` }}>
                      <span style={{ fontSize: 13, color: strapId === null ? T.paper : T.body }}>As supplied</span>
                      <span style={{ fontSize: 12, color: strapId === null ? T.gold : M2 }}>Included</span>
                    </button>
                    {straps.map((s) => {
                      const on = strapId === s.id;
                      return (
                        <button key={s.id} type="button" onClick={() => setStrapId(s.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "13px 14px", cursor: "pointer", fontFamily: FONT_BODY, background: on ? T.ink : "transparent", border: `1px solid ${on ? T.ink : T.ruleSoft}` }}>
                          <span style={{ fontSize: 13, color: on ? T.paper : T.body }}>{s.name || [cap(s.strap_type), s.color].filter(Boolean).join(" ")}</span>
                          <span style={{ fontSize: 12, color: on ? T.gold : M2 }}>{s.price_gbp ? `+ ${money(Number(s.price_gbp))}` : "Included"}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Engraving (free note) */}
              <div style={{ padding: "22px 0 0" }}>
                <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 12 }}>Engraving on the caseback</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[false, true].map((v) => {
                    const on = engrave === v;
                    return (
                      <button key={String(v)} type="button" onClick={() => setEngrave(v)} style={{ padding: "12px 8px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, color: on ? T.paper : T.body, background: on ? T.ink : "transparent", border: `1px solid ${on ? T.ink : T.ruleSoft}` }}>{v ? "Add a message" : "Leave it plain"}</button>
                    );
                  })}
                </div>
                {engrave && (
                  <div style={{ marginTop: 10 }}>
                    <input type="text" value={engraveText} onChange={(e) => setEngraveText(e.target.value.slice(0, 30))} maxLength={30} placeholder="Up to 30 characters" style={{ width: "100%", padding: "13px 14px", fontFamily: FONT_BODY, fontSize: 13.5, color: T.ink, background: "#FFFFFF", border: `1px solid ${T.ruleStrong}`, borderRadius: 0, outline: "none" }} />
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: 8, fontSize: 11.5, color: M2 }}>
                      <span>Hand-engraved here. We confirm any charge before cutting.</span><span>{engraveText.length} / 30</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Total */}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.rule}` }}>
                <span style={{ fontSize: 12.5, color: T.body }}>Total</span>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 26, lineHeight: 1 }}>{money(total)}</span>
              </div>

              <button type="button" onClick={addBag} className="wd-add" style={{ width: "100%", marginTop: 16, padding: 17, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0, transition: "background 0.25s ease" }}>Add to bag</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <button type="button" onClick={save} className="wd-outline" style={{ padding: "14px 8px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink, background: "transparent", border: `1px solid ${T.ruleStrong}` }}>{saved ? "Saved" : "Save"}</button>
                <Link to="/contact" className="wd-outline" style={{ padding: "14px 8px", textAlign: "center", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", border: `1px solid ${T.ruleStrong}`, color: T.ink }}>Reserve to view</Link>
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.rule}` }}>
                {ASSURANCES.map((a, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", gap: 10, alignItems: "baseline", padding: "9px 0" }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: T.gold }}>{["I", "II", "III", "IV"][i]}</span>
                    <span style={{ fontSize: 12.5, lineHeight: 1.6, color: T.body }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, padding: "20px 24px", background: T.tint }}>
              <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 10 }}>Servicing</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: T.body }}>Watch servicing and battery replacement carried out on the premises. Bring it in, or ask us in the showroom or by telephone.</p>
            </div>
          </aside>
        </main>

        {/* Related */}
        {related.length > 0 && (
          <section style={{ padding: "clamp(40px, 5vw, 88px) clamp(24px, 3vw, 52px)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(26px, 2.8vw, 40px)", lineHeight: 1.06, margin: 0 }}>More from {brandName}</h2>
              <Link to="/watches" className="wd-under" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", paddingBottom: 4, borderBottom: `1px solid ${T.ruleStrong}` }}>All watches</Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "clamp(14px, 2vw, 30px)", marginTop: 30 }}>
              {related.map((r) => (
                <Link key={r.id} to={`/watches/${r.slug}`} style={{ display: "block" }}>
                  <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(14px, 2.4vw, 26px)" }}>
                    {(r.image?.url || r.images?.[0]?.url) && <img src={getMediaUrl(r.image?.url || r.images?.[0]?.url)} alt={r.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} loading="lazy" />}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "16px 0 6px" }}>
                    <span style={{ fontSize: 14, lineHeight: 1.3 }}>{cleanWatchName(r.name, brandName, r.model_number || r.sku)}</span>
                    <span style={{ fontSize: 13.5, whiteSpace: "nowrap" }}>{money(Number(r.base_price))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <FooterV2 />

        {/* Mobile sticky price bar — the buy column stacks far down, so keep price + add
            reachable at all times. Spacer prevents the fixed bar covering the footer. */}
        {isMobile && (
          <>
            <div style={{ height: "calc(72px + env(safe-area-inset-bottom))" }} />
            <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: 14, padding: "12px 20px calc(12px + env(safe-area-inset-bottom))", background: "rgba(248,246,240,0.97)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderTop: `1px solid ${T.rule}` }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, lineHeight: 1 }}>{money(total)}</div>
                <div style={{ fontSize: 10.5, color: watch.in_stock !== false ? GREEN : M2, marginTop: 3 }}>{watch.in_stock !== false ? "In stock" : "To order"}</div>
              </div>
              <button type="button" onClick={addBag} className="wd-add" style={{ padding: "16px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0, transition: "background 0.25s ease" }}>Add to bag</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WatchDetailV2;
