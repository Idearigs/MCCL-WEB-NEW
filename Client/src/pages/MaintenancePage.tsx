import { T, FONT_DISPLAY, FONT_LOGO, FONT_BODY } from "../components/home-v2/tokens";

/**
 * Maintenance page, light redesign (Nov 2026). Shown to everyone when MAINTENANCE_MODE is on
 * in App.tsx, so it stands alone: no navigation, no footer, no links into the site. The
 * wordmark is set in the site's own lettering (the old page used a logo image and three fonts
 * the new design no longer loads), and the shop's telephone number now sits beside the email,
 * since a closed website should still say how to reach the shop.
 */

const MaintenancePage = () => (
  <div className="mt" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: T.cream, fontFamily: FONT_BODY, color: T.text }}>
    <style>{`
      .mt a { color: inherit; text-decoration: none; }
      @keyframes mtRise { from { opacity: 0; transform: translateY(18px); } }
      @keyframes mtRule { from { transform: scaleX(0); } }
      .mt-in > * { animation: mtRise 1.1s cubic-bezier(0.22,1,0.36,1) backwards; }
      .mt-in > :nth-child(3) { animation-delay: 0.12s; } .mt-in > :nth-child(5) { animation-delay: 0.24s; } .mt-in > :nth-child(6) { animation-delay: 0.36s; }
      .mt-word { font-family: ${FONT_LOGO}; font-size: clamp(26px, 3vw, 34px); letter-spacing: 0.16em; line-height: 1; color: ${T.text}; }
      .mt-sub { margin-top: 10px; font-size: 10px; letter-spacing: 0.34em; text-transform: uppercase; color: ${T.textMuted}; }
      .mt-rule { width: 64px; height: 1px; background: ${T.gold}; margin: clamp(34px, 5vw, 52px) auto; animation: mtRule 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s backwards !important; }
      .mt-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(36px, 5vw, 64px); line-height: 1.08; margin: 0 auto; max-width: 14ch; color: ${T.text}; text-wrap: balance; }
      .mt-p { margin: 24px auto 0; max-width: 44ch; font-size: 15.5px; line-height: 1.8; color: ${T.text}; }
      .mt-ways { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; max-width: 620px; margin: clamp(40px, 5vw, 60px) auto 0; border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
      .mt-way { display: block; padding: 24px 12px; border-left: 1px solid ${T.line}; }
      .mt-way:first-child { border-left: 0; }
      .mt-way span { display: block; }
      .mt-way .l { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${T.textMuted}; }
      .mt-way .v { margin-top: 10px; font-family: ${FONT_DISPLAY}; font-size: clamp(17px, 1.7vw, 21px); color: ${T.text}; overflow-wrap: anywhere; user-select: all; }
      .mt-foot { padding: 26px 20px; text-align: center; font-size: 12.5px; line-height: 1.7; color: ${T.textMuted}; }
      @media (max-width: 560px) {
        .mt-ways { grid-template-columns: 1fr; }
        .mt-way { border-left: 0; border-top: 1px solid ${T.line}; }
        .mt-way:first-child { border-top: 0; }
      }
      @media (prefers-reduced-motion: reduce) { .mt-in > *, .mt-rule { animation: none !important; } }
    `}</style>

    <main className="mt-in" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "clamp(48px, 8vh, 96px) clamp(20px, 4vw, 64px)", textAlign: "center" }}>
      <div className="mt-word">McCulloch</div>
      <div className="mt-sub">Fine Jewellery</div>
      <div className="mt-rule" />
      <h1 className="mt-h1">We’ll be back soon.</h1>
      <p className="mt-p">We are making improvements to our website and will be back shortly. Thank you for your patience.</p>

      <div className="mt-ways">
        <a href="tel:01159257552" className="mt-way"><span className="l">Telephone</span><span className="v">0115 925 7552</span></a>
        <a href="mailto:has@mccullochjewellers.co.uk" className="mt-way"><span className="l">Email</span><span className="v">has@mccullochjewellers.co.uk</span></a>
      </div>
    </main>

    <footer className="mt-foot">Andrew McCulloch Jewellers, 7 The Square, Beeston, Nottingham NG9 2JG</footer>
  </div>
);

export default MaintenancePage;
