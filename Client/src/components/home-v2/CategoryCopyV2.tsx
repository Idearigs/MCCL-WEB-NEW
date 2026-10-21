// "About this category" copy under a listing's products. The same text is served to
// crawlers by Client/seo/server.mjs, so people and search engines see the same page.
// Only the first paragraph shows until "Read more"; the rest stays in the page (just
// collapsed), so search engines still read all of it.
import React, { useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";
import { CATEGORY_COPY } from "../../content/categoryCopy";

// "**text**" in the copy → bold.
const withBold = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} style={{ fontWeight: 600, color: T.heading }}>{part.slice(2, -2)}</strong>
      : part,
  );

const CategoryCopyV2 = (): JSX.Element | null => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const moreId = useId();
  const copy = CATEGORY_COPY[pathname.replace(/\/+$/, "") || "/"];
  if (!copy) return null;

  const para = (p: string, i: number) => (
    <p key={i} style={{ fontSize: 15.5, lineHeight: 1.8, color: T.body, margin: "0 0 16px" }}>{withBold(p)}</p>
  );
  const [first, ...rest] = copy.paras;

  return (
    <section aria-labelledby="category-copy-heading" style={{ borderTop: `1px solid ${T.rule}`, background: T.paper, padding: "clamp(56px, 6vw, 96px) clamp(24px, 3vw, 52px)", fontFamily: FONT_BODY }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2 id="category-copy-heading" style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(26px, 2.6vw, 36px)", lineHeight: 1.15, color: T.ink, margin: "0 0 22px" }}>
          {copy.heading}
        </h2>
        {first && para(first, 0)}
        {rest.length > 0 && (
          <>
            <div id={moreId} style={{ display: open ? "block" : "none" }}>
              {rest.map((p, i) => para(p, i + 1))}
            </div>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={moreId}
              onClick={() => setOpen((o) => !o)}
              style={{ background: "none", border: 0, padding: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: T.gold, display: "inline-flex", alignItems: "center", gap: 6, margin: "2px 0 0" }}
            >
              {open ? "Read less" : "Read more"}
              <span aria-hidden style={{ display: "inline-block", transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "none" }}>⌄</span>
            </button>
          </>
        )}
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
