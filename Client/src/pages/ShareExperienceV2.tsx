import React from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import ReviewForm from "../components/home-v2/ReviewForm";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * /share-your-experience — the visitor review form, moved off the homepage (it took ~1,100px of
 * a phone screen for every visitor, most of whom are not yet customers). Link to it from order
 * and collection emails, and from the homepage reviews band.
 */
const pageX = "clamp(24px, 3vw, 52px)";

const ShareExperienceV2 = (): JSX.Element => (
  <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
    <NavigationV2 solid />
    <main id="main" style={{ paddingTop: "var(--v2nav-h, 96px)" }}>
      <div style={{ display: "flex", gap: 10, padding: `18px ${pageX}`, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6E6A60" }}>
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link><span>/</span><span style={{ color: T.ink }}>Share your experience</span>
      </div>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "clamp(28px, 4vw, 64px)", alignItems: "start", padding: `clamp(24px, 4vw, 56px) ${pageX} clamp(56px, 6vw, 96px)` }}>
        <div style={{ alignSelf: "center" }}>
          <div className="v2-eyebrow" style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase" }}>Share your experience</div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(34px, 4vw, 58px)", lineHeight: 1.05, margin: "16px 0 0" }}>Been to the bench?</h1>
          <p style={{ fontSize: 16, color: T.body, lineHeight: 1.7, marginTop: 18, maxWidth: "44ch" }}>
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
