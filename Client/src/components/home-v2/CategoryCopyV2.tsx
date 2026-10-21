// "About this category" copy under a listing's products. The same text is served to
// crawlers by Client/seo/server.mjs, so people and search engines see the same page.
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";
import { CATEGORY_COPY } from "../../content/categoryCopy";

const CategoryCopyV2 = (): JSX.Element | null => {
  const { pathname } = useLocation();
  const copy = CATEGORY_COPY[pathname.replace(/\/+$/, "") || "/"];
  if (!copy) return null;

  return (
    <section aria-labelledby="category-copy-heading" style={{ borderTop: `1px solid ${T.rule}`, background: T.paper, padding: "clamp(56px, 6vw, 96px) clamp(24px, 3vw, 52px)", fontFamily: FONT_BODY }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2 id="category-copy-heading" style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(26px, 2.6vw, 36px)", lineHeight: 1.15, color: T.ink, margin: "0 0 22px" }}>
          {copy.heading}
        </h2>
        {copy.paras.map((p, i) => (
          <p key={i} style={{ fontSize: 15.5, lineHeight: 1.8, color: T.body, margin: "0 0 16px" }}>{p}</p>
        ))}
        <nav aria-label="Related" style={{ display: "flex", flexWrap: "wrap", gap: "10px 26px", marginTop: 26 }}>
          {copy.links.map(([label, to]) => (
            <Link key={to} to={to} className="v2-textlink" style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink, borderBottom: `1px solid ${T.ruleStrong}`, paddingBottom: 4 }}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
};

export default CategoryCopyV2;
