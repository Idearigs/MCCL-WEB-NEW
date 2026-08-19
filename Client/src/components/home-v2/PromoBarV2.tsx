import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "../../hooks/use-mobile";
import API_BASE_URL from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

/**
 * PromoBarV2 — seasonal promotion strip (design_handoff_mcculloch_promo, 10th package).
 * Sits below the hero. On DESKTOP it is a seamless horizontal marquee of the season's
 * messages. On MOBILE the marquee is replaced by a single centred message that eases up and
 * is swapped for the next on a timer. Honours prefers-reduced-motion, dismissible for the session.
 *
 * The messages are managed from the admin panel (Admin → Promotions → the five "banner text"
 * fields on any promotion with "show banner" on). They are fetched from the promotions API;
 * the hardcoded AUTUMN list below is only the fallback shown when no active banner promotion
 * exists (e.g. the API is unreachable).
 */

interface PromoMsg { mark: string; text: string; to?: string }

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const AUTUMN: PromoMsg[] = [
  { mark: "I", text: "Autumn commissions — order by 31 October for Christmas", to: "/bespoke-design" },
  { mark: "II", text: "10% off engagement rings until 30 September", to: "/engagement-rings" },
  { mark: "III", text: "Free insured UK delivery on everything", to: "/delivery" },
  { mark: "IV", text: "Complimentary engraving on wedding bands", to: "/wedding-rings" },
  { mark: "V", text: "Servicing & repairs on our own premises", to: "/repairs" },
  { mark: "VI", text: "Visit the showroom — Beeston, Mon to Sat", to: "/visit-us" },
];

const PromoBarV2 = (): JSX.Element | null => {
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem("mcc_promo_dismissed") === "1"; } catch { return false; }
  });

  // Admin-managed banner texts (fall back to the hardcoded AUTUMN list).
  const [messages, setMessages] = useState<PromoMsg[]>(AUTUMN);
  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/promotions?type=banner&active_only=true`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.success) return;
        const promos: any[] = d.data?.promotions || [];
        const texts: string[] = [];
        promos.forEach((p) => {
          [p.banner_text_1, p.banner_text_2, p.banner_text_3, p.banner_text_4, p.banner_text_5]
            .forEach((t) => { if (t && String(t).trim()) texts.push(String(t).trim()); });
          if (texts.length === 0 && p.banner_text) texts.push(String(p.banner_text).trim());
        });
        if (texts.length) setMessages(texts.map((text, i) => ({ mark: ROMAN[i % ROMAN.length], text })));
      })
      .catch(() => { /* keep fallback */ });
    return () => { alive = false; };
  }, []);

  const [idx, setIdx] = useState(0);

  // Mobile: rotate one message at a time on a timer (respect reduced-motion → hold longer)
  useEffect(() => {
    if (!isMobile || dismissed) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), reduce ? 6000 : 4000);
    return () => clearInterval(t);
  }, [isMobile, dismissed, messages.length]);

  if (dismissed) return null;

  const dur = messages.length * 6; // derived, not fixed
  const track = [...messages, ...messages];

  const dismiss = () => { try { sessionStorage.setItem("mcc_promo_dismissed", "1"); } catch { /* ignore */ } setDismissed(true); };

  // ── Mobile: single centred, eased-up rotator ──────────────────────────────
  if (isMobile) {
    const m = messages[idx] || messages[0];
    const riseStyle: React.CSSProperties = { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 6px", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#E8E0D2", textDecoration: "none", textAlign: "center", lineHeight: 1.2, animation: "promoRise 0.5s cubic-bezier(0.22,1,0.36,1) both" };
    const riseInner = (
      <>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: 0, textTransform: "none", color: T.gold, flex: "none" }}>{m.mark}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{m.text}</span>
      </>
    );
    return (
      <div style={{ display: "grid", gridTemplateColumns: "40px minmax(0, 1fr) 40px", alignItems: "center", background: T.ink, color: T.onDarkSoft, fontFamily: FONT_BODY }}>
        <style>{`
          @keyframes promoRise { from { opacity: 0; transform: translateY(90%); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce){ .promo-rise { animation: none !important; } }
        `}</style>
        <span aria-hidden="true" />
        <div style={{ position: "relative", height: 34, overflow: "hidden" }}>
          {m.to
            ? <Link key={idx} to={m.to} className="promo-rise" style={riseStyle}>{riseInner}</Link>
            : <div key={idx} className="promo-rise" style={riseStyle}>{riseInner}</div>}
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss promotions"
          style={{ width: 40, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: 0, borderLeft: `1px solid ${T.ruleDark}`, color: T.onDarkMuted, fontSize: 15, lineHeight: 1 }}>×</button>
      </div>
    );
  }

  // ── Desktop: seamless horizontal marquee ──────────────────────────────────
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", background: T.ink, color: T.onDarkSoft, fontFamily: FONT_BODY }}>
      <style>{`
        @keyframes promoMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .promo-track { display: flex; width: max-content; align-items: center; animation: promoMarquee ${dur}s linear infinite; will-change: transform; }
        .promo-viewport:hover .promo-track { animation-play-state: paused; }
        .promo-msg { display: inline-flex; align-items: baseline; gap: 9px; padding: 9px 0; font-size: 11px; letter-spacing: 0.09em; text-transform: uppercase; white-space: nowrap; }
        .promo-msg:hover { color: ${T.gold}; }
        .promo-num { font-family: ${FONT_DISPLAY}; font-size: 13px; letter-spacing: 0; text-transform: none; color: ${T.gold}; }
        @media (prefers-reduced-motion: reduce){ .promo-track { animation: none !important; } }
      `}</style>

      <div className="promo-viewport" style={{ position: "relative", overflow: "hidden" }}>
        <div className="promo-track">
          {track.map((m, i) => {
            const col = i % 2 === 0 ? "#E8E0D2" : "#B0A798";
            const msgStyle: React.CSSProperties = { color: col, textDecoration: "none", transition: "color 0.2s ease" };
            const inner = <><span className="promo-num">{m.mark}</span>{m.text}</>;
            return (
              <span key={i} style={{ display: "inline-flex", alignItems: "baseline" }}>
                {m.to
                  ? <Link to={m.to} className="promo-msg" style={msgStyle}>{inner}</Link>
                  : <span className="promo-msg" style={msgStyle}>{inner}</span>}
                <span style={{ padding: "0 22px", color: "#4A443B" }}>/</span>
              </span>
            );
          })}
        </div>
        {/* edge gradient masks */}
        <div className="promo-mask-l" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 56, background: `linear-gradient(to right, ${T.ink}, transparent)`, pointerEvents: "none" }} />
        <div className="promo-mask-r" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 56, background: `linear-gradient(to left, ${T.ink}, transparent)`, pointerEvents: "none" }} />
      </div>

      <button type="button" onClick={dismiss} aria-label="Dismiss promotions"
        style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "transparent", border: 0, borderLeft: `1px solid ${T.ruleDark}`, color: T.onDarkMuted, fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
};

export default PromoBarV2;
