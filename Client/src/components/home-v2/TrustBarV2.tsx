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
  "30-day returns",
  "1-year warranty",
  "Hand-finished in the UK",
];

const TrustBarV2 = ({ solid = true }: { solid?: boolean }): JSX.Element => {
  const isMobile = useIsMobile();
  const [idx, setIdx] = useState(0);
  // Over the hero, match the header's translucent frosted chrome rather than being
  // fully see-through; once solid, go opaque dark ink.
  const bg = solid ? T.ink : "rgba(28,26,23,0.12)";
  const blur = solid ? "none" : "blur(14px)";

  useEffect(() => {
    if (!isMobile) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const t = setInterval(() => setIdx((i) => (i + 1) % TRUST.length), reduce ? 6000 : 3200);
    return () => clearInterval(t);
  }, [isMobile]);

  // ── Mobile: one item at a time, centred, easing up ────────────────────────
  if (isMobile) {
    return (
      <div style={{ background: bg, color: T.onDarkSoft, fontFamily: FONT_BODY, backdropFilter: blur, WebkitBackdropFilter: blur, transition: "background 0.35s ease" }}>
        <style>{`
          @keyframes trustRise { from { opacity: 0; transform: translateY(85%); } to { opacity: 1; transform: none; } }
          @media (prefers-reduced-motion: reduce){ .trust-rise { animation: none !important; } }
        `}</style>
        <div style={{ position: "relative", height: 32, overflow: "hidden" }}>
          <div key={idx} className="trust-rise"
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#E8E0D2", textAlign: "center", lineHeight: 1.2, animation: "trustRise 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
            {TRUST[idx]}
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop: static centred row with slash separators ─────────────────────
  return (
    <div style={{ background: bg, color: T.onDarkSoft, fontFamily: FONT_BODY, backdropFilter: blur, WebkitBackdropFilter: blur, transition: "background 0.35s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", padding: "8px 20px" }}>
        {TRUST.map((t, i) => (
          <React.Fragment key={t}>
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#D8CFC0" }}>{t}</span>
            {i < TRUST.length - 1 && <span style={{ padding: "0 20px", color: "#4A443B" }}>/</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default TrustBarV2;
