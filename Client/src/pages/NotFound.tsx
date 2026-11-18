import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND } from "../components/home-v2/listingShared";

/**
 * Page not found, light redesign (Nov 2026). The old page was an unstyled grey screen with a
 * blue link and no way back into the shop. This one keeps the navigation and footer, says what
 * happened in one line, and offers the four places most people were looking for.
 */

const PLACES = [
  { to: "/engagement-rings", label: "Engagement rings" },
  { to: "/wedding-rings", label: "Wedding rings" },
  { to: "/jewellery", label: "Jewellery" },
  { to: "/watches", label: "Watches" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="nf" style={{ background: GROUND, minHeight: "100vh", fontFamily: FONT_BODY, color: T.text, paddingTop: "var(--v2nav-h, 113px)" }}>
      <style>{`
        .nf a { color: inherit; text-decoration: none; }
        @keyframes nfRise { from { opacity: 0; transform: translateY(18px); } }
        @keyframes nfRule { from { transform: scaleX(0); } }
        .nf-in > * { animation: nfRise 1s cubic-bezier(0.22,1,0.36,1) backwards; }
        .nf-in > :nth-child(2) { animation-delay: 0.1s; } .nf-in > :nth-child(4) { animation-delay: 0.25s; } .nf-in > :nth-child(5) { animation-delay: 0.35s; }
        .nf-box { max-width: 880px; margin: 0 auto; padding: clamp(64px, 11vh, 130px) clamp(20px, 4vw, 64px) clamp(80px, 12vw, 150px); text-align: center; }
        .nf-eyebrow { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
        .nf-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(36px, 5vw, 68px); line-height: 1.06; margin: 16px auto 0; max-width: 14ch; color: ${T.text}; text-wrap: balance; }
        .nf-rule { width: 64px; height: 1px; background: ${T.gold}; margin: 28px auto; animation: nfRule 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s backwards !important; }
        .nf-p { margin: 0 auto; max-width: 46ch; font-size: 15.5px; line-height: 1.8; color: ${T.text}; }
        .nf-btn { display: inline-block; margin-top: 32px; padding: 17px 34px; background: ${T.ink}; color: ${T.cream} !important; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; transition: background 0.3s ease; }
        .nf-btn:hover { background: ${T.text}; }
        .nf-places { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: clamp(48px, 6vw, 80px); border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .nf-place { display: block; padding: clamp(20px, 2.4vw, 30px) 10px; border-left: 1px solid ${T.line}; font-family: ${FONT_DISPLAY}; font-size: clamp(16px, 1.6vw, 20px); color: ${T.text}; }
        .nf-place:first-child { border-left: 0; }
        .nf-place span { display: inline-block; padding-bottom: 4px; border-bottom: 1px solid transparent; transition: border-color 0.2s ease; }
        .nf-place:hover span { border-bottom-color: ${T.gold}; }
        .nf-help { margin-top: 30px; font-size: 14.5px; color: ${T.textMuted}; }
        .nf-help a { color: ${T.text}; border-bottom: 1px solid ${T.ruleStrong}; padding-bottom: 2px; }
        @media (max-width: 640px) {
          .nf-places { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .nf-place:nth-child(3) { border-left: 0; }
          .nf-place:nth-child(n+3) { border-top: 1px solid ${T.line}; }
          .nf-btn { display: block; }
        }
        @media (prefers-reduced-motion: reduce) { .nf-in > *, .nf-rule { animation: none !important; } }
      `}</style>

      <NavigationV2 solid />

      <main className="nf-box nf-in">
        <div className="nf-eyebrow">Page not found</div>
        <h1 className="nf-h1">This page has moved on.</h1>
        <div className="nf-rule" />
        <p className="nf-p">The page you were looking for is no longer here, or the address was mistyped. Everything else is where you left it.</p>
        <div><Link to="/" className="nf-btn">Return to the home page</Link></div>

        <nav className="nf-places" aria-label="Popular pages">
          {PLACES.map((p) => <Link key={p.to} to={p.to} className="nf-place"><span>{p.label}</span></Link>)}
        </nav>
        <p className="nf-help">Looking for something in particular? <Link to="/contact">Ask us</Link> or call <a href="tel:01159257552">0115 925 7552</a>.</p>
      </main>

      <FooterV2 />
    </div>
  );
};

export default NotFound;
