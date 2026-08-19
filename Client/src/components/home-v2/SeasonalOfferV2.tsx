import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "../../hooks/use-mobile";
import API_BASE_URL from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

/**
 * SeasonalOfferV2 — the offer window that appears 1.2s after load, once per visitor.
 *
 * Its content is managed from the admin panel (Admin → Promotions → any promotion with
 * "show popup" on): title, description, discount %, image and an optional featured product.
 * When an active popup promotion exists it drives the window (title / body / "up to X% off" /
 * plate image / Shop-now CTA). When there is none, it falls back to the hardcoded seasonal
 * offer below — which keeps the fuller two-step email→code design.
 */

interface PopupPromo {
  id: string;
  title: string;
  description?: string;
  discount_percentage?: number;
  image_url?: string;
  product?: { id: string; name: string; slug: string; base_price: number; sale_price?: number };
}

const SEASON = {
  plateEyebrow: "Autumn on the bench",
  plateLine: "Six weeks on the bench. Order by the end of October and it is here for Christmas.",
  eyebrow: "Autumn at the workshop",
  title: "Ten per cent, and six weeks in hand.",
  body: "Until 30 September we are taking ten per cent off every engagement ring, made to your specification. After that the Christmas book fills and the honest answer becomes January.",
  terms: [
    "Ten per cent off engagement rings ordered before 30 September",
    "Applies to made-to-order pieces, including your own stones",
    "Applied at checkout, or in the showroom — whichever you prefer",
  ],
  footnote: "One code per customer",
  code: "AUTUMN10",
  expires: "30 September",
  doneTitle: "Ten per cent, held for you.",
  redeem: "Enter it at checkout, or mention it in the showroom and we will apply it there. Valid on engagement rings ordered before 30 September.",
  primaryLabel: "Shop engagement",
  primaryHref: "/engagement-rings",
};

const EMAIL_RE = /.+@.+\..+/;

const SeasonalOfferV2 = (): JSX.Element | null => {
  const isMobile = useIsMobile();
  const [openState, setOpenState] = useState(false);
  const [step, setStep] = useState<"intro" | "done">("intro");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState(false);

  // Admin-managed popup promotion (null → fall back to the hardcoded seasonal offer)
  const [promo, setPromo] = useState<PopupPromo | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/promotions?type=popup&active_only=true`)
      .then((r) => r.json())
      .then((d) => { if (alive && d?.success) { const p = d.data?.promotions?.[0]; if (p) setPromo(p); } })
      .catch(() => { /* keep fallback */ })
      .finally(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, []);

  const seenKey = `mcc_offer_seen_${promo?.id || "default"}`;
  const adminMode = !!promo;

  // Effective content — admin promotion overrides the seasonal defaults where present.
  const S = {
    plateEyebrow: adminMode ? "The offer" : SEASON.plateEyebrow,
    plateLine: adminMode ? promo!.title : SEASON.plateLine,
    eyebrow: adminMode ? (promo!.discount_percentage ? `Up to ${promo!.discount_percentage}% off` : "Special offer") : SEASON.eyebrow,
    title: adminMode ? promo!.title : SEASON.title,
    body: adminMode ? (promo!.description || "") : SEASON.body,
    image: adminMode ? (promo!.image_url || "") : "",
    primaryLabel: adminMode ? (promo!.product ? "Shop now" : "Discover more") : SEASON.primaryLabel,
    primaryHref: adminMode ? (promo!.product ? `/products/${promo!.product.slug}` : SEASON.primaryHref) : SEASON.primaryHref,
    code: SEASON.code,
  };

  // Show once per visitor, 1.2s after the promotion has been fetched
  useEffect(() => {
    if (!loaded) return;
    let seen = false;
    try { seen = localStorage.getItem(seenKey) === "1"; } catch { /* ignore */ }
    if (seen) return;
    const t = setTimeout(() => setOpenState(true), 1200);
    return () => clearTimeout(t);
  }, [loaded, seenKey]);

  useEffect(() => {
    document.body.style.overflow = openState ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [openState]);

  const close = () => {
    try { localStorage.setItem(seenKey, "1"); } catch { /* ignore */ }
    setOpenState(false);
  };

  const valid = useMemo(() => EMAIL_RE.test(email), [email]);
  const submit = () => { if (valid) setStep("done"); };
  const copy = () => {
    try { navigator.clipboard?.writeText(S.code); } catch { /* ignore */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (!openState) return null;

  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };

  const plate = (
    <div style={{ position: "relative", background: T.inkDeep, overflow: "hidden", minHeight: isMobile ? 176 : 0, maxHeight: isMobile ? 176 : undefined, flex: isMobile ? "none" : undefined, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: isMobile ? "20px" : "30px" }}>
      {S.image && <img src={S.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      <div style={{ position: "absolute", inset: 0, background: S.image ? "linear-gradient(to top, rgba(18,16,13,0.82), rgba(18,16,13,0.12) 60%, rgba(18,16,13,0.34))" : "radial-gradient(120% 90% at 30% 20%, rgba(168,129,60,0.18), transparent 60%)" }} />
      {isMobile && !S.image && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to top, rgba(18,16,13,0.86), rgba(18,16,13,0.05) 62%)" }} />}
      <div style={{ position: "relative" }}>
        <div style={{ ...eyebrow, color: "rgba(232,224,210,0.72)", marginBottom: 10 }}>{S.plateEyebrow}</div>
        {isMobile
          ? <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, lineHeight: 1.25, color: "#FFFFFF", maxWidth: "26ch" }}>{S.plateLine}</div>
          : <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(20px,1.8vw,26px)", lineHeight: 1.25, color: "#F4EFE6", maxWidth: "22ch" }}>{S.plateLine}</div>}
      </div>
      {isMobile && (
        <button type="button" onClick={close} aria-label="Close" style={{ position: "absolute", top: 10, right: 10, width: 38, height: 38, cursor: "pointer", background: "rgba(248,246,240,0.9)", border: 0, fontSize: 20, lineHeight: 1, color: T.ink }}>×</button>
      )}
    </div>
  );

  const stepIntro = (
    <>
      <div style={{ ...eyebrow, marginBottom: 14 }}>{S.eyebrow}</div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(30px, 3.1vw, 42px)", lineHeight: 1.06, margin: "0 0 16px", color: T.ink }}>{S.title}</h2>
      {S.body && <p style={{ margin: "0 0 22px", fontSize: 14.5, lineHeight: 1.7, color: T.body }}>{S.body}</p>}

      {adminMode ? (
        /* Admin-managed offer: straight to the CTAs (no seasonal terms / code) */
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
          <Link to={S.primaryHref} onClick={close} style={{ flex: 1, textAlign: "center", padding: "15px 20px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{S.primaryLabel}</Link>
          <Link to="/book-appointment" onClick={close} style={{ flex: 1, textAlign: "center", padding: "15px 20px", border: `1px solid ${T.ruleStrong}`, color: T.ink, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Book an appointment</Link>
        </div>
      ) : (
        <>
          <div style={{ borderTop: `1px solid ${T.rule}`, marginBottom: 22 }}>
            {SEASON.terms.map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${T.rule}`, fontSize: 13.5, lineHeight: 1.55, color: T.body }}>
                <span style={{ fontFamily: FONT_DISPLAY, color: T.gold, fontSize: 15 }}>{["I", "II", "III"][i]}</span><span>{t}</span>
              </div>
            ))}
          </div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setTouched(true)}
            placeholder="Your email address"
            style={{ width: "100%", padding: "14px 16px", fontFamily: FONT_BODY, fontSize: 14.5, color: T.ink, background: T.paper, border: `1px solid ${touched && !valid ? "#C4A46A" : T.ruleStrong}`, outline: "none", marginBottom: 14 }} />
          <button type="button" onClick={submit} disabled={!valid}
            style={{ width: "100%", padding: "15px", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", border: 0, cursor: valid ? "pointer" : "not-allowed", background: valid ? T.ink : "#EFEADF", color: valid ? T.paper : "#A9A196", transition: "background 0.2s ease, color 0.2s ease" }}>
            Send me the code
          </button>
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 16 }}>
        <button type="button" onClick={close} style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: T.muted, padding: 0 }}>No thank you</button>
        <span style={{ fontSize: 11, color: "#A9A196" }}>{SEASON.footnote}</span>
      </div>
    </>
  );

  const stepDone = (
    <>
      <div style={{ ...eyebrow, marginBottom: 14 }}>Yours until {SEASON.expires}</div>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(28px, 2.9vw, 40px)", lineHeight: 1.08, margin: "0 0 12px", color: T.ink }}>{SEASON.doneTitle}</h2>
      <p style={{ margin: "0 0 22px", fontSize: 14, lineHeight: 1.7, color: T.body }}>We’ve emailed it to you as well, so it’s there when you need it.</p>
      <div style={{ background: T.tint, padding: "22px 24px", marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 14 }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(30px, 3vw, 40px)", letterSpacing: "0.06em", color: T.ink }}>{SEASON.code}</span>
          <button type="button" onClick={copy} style={{ padding: "12px 22px", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", cursor: "pointer", background: copied ? "transparent" : T.ink, color: copied ? T.gold : T.paper, border: copied ? `1px solid ${T.gold}` : 0, width: isMobile ? "100%" : "auto" }}>{copied ? "Copied" : "Copy"}</button>
        </div>
        <div className="offer-rule" style={{ height: 1, background: T.ruleStrong, transformOrigin: "left", margin: "18px 0 14px", animation: "offerRule 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s both" }} />
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: T.muted }}>{SEASON.redeem}</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        <Link to={SEASON.primaryHref} onClick={close} style={{ flex: 1, textAlign: "center", padding: "14px 20px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{SEASON.primaryLabel}</Link>
        <Link to="/book-appointment" onClick={close} style={{ flex: 1, textAlign: "center", padding: "14px 20px", border: `1px solid ${T.ruleStrong}`, color: T.ink, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Book an appointment</Link>
      </div>
      <button type="button" onClick={close} style={{ background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: T.muted, padding: 0 }}>Keep looking</button>
    </>
  );

  const rightCol = (
    <div className="offer-scroll" style={{ position: "relative", minHeight: 0, overflowY: "auto", padding: isMobile ? "22px 20px calc(26px + env(safe-area-inset-bottom))" : "clamp(28px, 3vw, 44px)" }}>
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, letterSpacing: "0.26em", textTransform: "uppercase", color: T.ink }}>McCulloch</div>
            <div style={{ fontSize: 8, letterSpacing: "0.42em", textTransform: "uppercase", color: T.muted, marginTop: 4, paddingLeft: 2 }}>Fine jewellery</div>
          </div>
          <button type="button" onClick={close} aria-label="Close" style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: 22, lineHeight: 1, color: T.muted }}>×</button>
        </div>
      )}
      <div key={step} style={{ animation: "offerStep 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
        {step === "intro" ? stepIntro : stepDone}
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <style>{`
        @keyframes offerIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes offerSheet { from { transform: translateY(100%); } to { transform: none; } }
        @keyframes offerStep { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes offerRule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce){ .offer-panel, .offer-rule { animation: none !important; } }
      `}</style>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.56)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
      <div className="offer-panel" onClick={e => e.stopPropagation()}
        style={isMobile
          ? { position: "relative", width: "100%", maxHeight: "92vh", background: T.paper, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", animation: "offerSheet 0.36s cubic-bezier(0.22,1,0.36,1) both" }
          : { position: "relative", width: "min(920px, 100%)", height: "min(560px, 92vh)", background: T.paper, display: "grid", gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 1.08fr)", gridTemplateRows: "minmax(0, 1fr)", overflow: "hidden", boxShadow: "0 40px 80px -40px rgba(20,18,15,0.5)", animation: "offerIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
        {plate}
        {rightCol}
      </div>
    </div>
  );
};

export default SeasonalOfferV2;
