import React, { useEffect, useState } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { T, FONT_BODY } from "./tokens";

/**
 * TrustBarV2 — the evergreen reassurance strip that sits above the header on every page.
 * Desktop shows all four promises in a single centred row separated by hairline slashes.
 * On mobile they are shown one at a time, centred, each easing up as it replaces the last
 * (a static row of four would be unreadable on a phone). Not dismissible — this is standing
 * service information, not a promotion (the seasonal promo lives in its own PromoBarV2).
 *
 * `solid` controls the background: on the homepage it is passed false while the header is
 * transparent over the hero video (so the strip is see-through at the top) and true once the
 * page is scrolled; every other page is always solid.
 */

const TRUST = [
  "Free insured UK delivery",
  "30-day returns on ready-to-ship",
  "1-year warranty",
  "Hand-finished in the UK",
];

const TrustBarV2 = ({ solid = true, hidden = false }: { solid?: boolean; hidden?: boolean }): JSX.Element => {
  const isMobile = useIsMobile();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false); // tap the strip to stop / restart the rotation
  // Over the hero, match the header's translucent frosted chrome rather than being
  // fully see-through; once solid, go opaque dark ink.
  // Solid = cream with a line beneath (the brief keeps large dark areas to the footer).
  const bg = solid ? T.cream : "rgba(28,26,23,0.12)";
  const fg = solid ? T.text : "#E8E0D2";
  const edge = solid ? `1px solid ${T.line}` : "1px solid transparent";
  const blur = solid ? "none" : "blur(14px)";

  useEffect(() => {
    if (!isMobile || paused) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = setInterval(() => setIdx((i) => (i + 1) % TRUST.length), reduce ? 6000 : 3200);
    return () => clearInterval(t);
  }, [isMobile, paused]);

  // Collapses smoothly when `hidden` (homepage, once past the first screen).
  const wrap: React.CSSProperties = { display: "grid", gridTemplateRows: hidden ? "0fr" : "1fr", transition: "grid-template-rows 0.3s ease" };

  // ── Mobile: one item at a time, centred, easing up ────────────────────────
  if (isMobile) {
    return (
      <div style={wrap}><div style={{ overflow: "hidden" }}>
      <div style={{ background: bg, color: fg, borderBottom: edge, fontFamily: FONT_BODY, backdropFilter: blur, WebkitBackdropFilter: blur, transition: "background 0.35s ease, color 0.35s ease" }}>
        <style>{`
          @keyframes trustRise { from { opacity: 0; transform: translateY(85%); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce){ .trust-rise { animation: none !important; } }
        `}</style>
        <button type="button" onClick={() => setPaused(p => !p)} aria-label={paused ? "Resume rotating messages" : "Pause rotating messages"} title={paused ? "Tap to resume" : "Tap to pause"}
          style={{ position: "relative", display: "block", width: "100%", height: 32, overflow: "hidden", background: "transparent", border: 0, padding: 0, cursor: "pointer", font: "inherit" }}>
          <div key={idx} className="trust-rise" aria-live="off"
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: fg, textAlign: "center", lineHeight: 1.2, animation: "trustRise 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
            {TRUST[idx]}
          </div>
        </button>
      </div>
      </div></div>
    );
  }

  // ── Desktop: static centred row with slash separators ─────────────────────
  return (
    <div style={wrap}><div style={{ overflow: "hidden" }}>
    <div style={{ background: bg, color: fg, borderBottom: edge, fontFamily: FONT_BODY, backdropFilter: blur, WebkitBackdropFilter: blur, transition: "background 0.35s ease, color 0.35s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", padding: "8px 20px" }}>
        {TRUST.map((t, i) => (
          <React.Fragment key={t}>
            <span style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: fg }}>{t}</span>
            {i < TRUST.length - 1 && <span aria-hidden="true" style={{ padding: "0 20px", color: solid ? T.gold : "rgba(232,224,210,0.5)" }}>/</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
    </div></div>
  );
};

export default TrustBarV2;
