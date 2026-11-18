import React from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import ReviewForm from "../components/home-v2/ReviewForm";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND } from "../components/home-v2/listingShared";

/**
 * /share-your-experience — the visitor review form, moved off the homepage (it took ~1,100px of
 * a phone screen for every visitor, most of whom are not yet customers). Link to it from order
 * and collection emails, and from the homepage reviews band.
 * Light redesign (Nov 2026): the same ground, breadcrumb and heading style as the other pages.
 * The form itself (components/home-v2/ReviewForm.tsx) is unchanged.
 */
const pageX = "clamp(20px, 4vw, 64px)";

const ShareExperienceV2 = (): JSX.Element => (
  <div style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh" }}>
    <style>{`
      .se a { color: inherit; text-decoration: none; }
      .se-grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(32px, 6vw, 104px); align-items: center; max-width: 1240px; margin: 0 auto; padding: clamp(28px, 4vw, 64px) ${pageX} clamp(64px, 7vw, 112px); }
      @media (max-width: 900px) { .se-grid { grid-template-columns: minmax(0, 1fr); } .se-intro { text-align: center; } .se-intro p { margin-left: auto; margin-right: auto; } }
    `}</style>
    <NavigationV2 solid />
    <main id="main" className="se" style={{ paddingTop: "var(--v2nav-h, 113px)" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, padding: `clamp(26px, 3vw, 44px) ${pageX} 0`, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.textMuted }}>
        <Link to="/">Home</Link><span>/</span><span>Share your experience</span>
      </div>
      <section className="se-grid">
        <div className="se-intro">
          <div style={{ fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text }}>Share your experience</div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(36px, 4.6vw, 64px)", lineHeight: 1.06, margin: "16px 0 0", color: T.text }}>Been to the bench?</h1>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.8, margin: "20px 0 0", maxWidth: "44ch" }}>
            If we’ve made, remodelled or looked after something for you, we’d love to hear about it. Your words help the next person decide.
          </p>
        </div>
        <ReviewForm />
      </section>
    </main>
    <FooterV2 />
  </div>
);

export default ShareExperienceV2;
