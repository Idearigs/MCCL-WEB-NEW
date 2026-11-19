// "The journal" homepage strip: the 3 latest posts from the WordPress blog at /blog.
// Reads the public WP REST API; renders nothing until there's at least one real post.
import React, { useEffect, useState } from "react";
import { T, FONT_DISPLAY, SP } from "./tokens";

// In dev the shop runs on localhost, so read the live blog (WP allows cross-origin GETs).
const BLOG_ORIGIN = import.meta.env.DEV ? "https://mccullochjewellers.co.uk" : "";
const POSTS_URL = `${BLOG_ORIGIN}/blog/?rest_route=/wp/v2/posts&per_page=4&_embed=wp:featuredmedia,wp:term`;

interface WpPost {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  _embedded?: {
    "wp:featuredmedia"?: { source_url?: string; alt_text?: string; media_details?: { sizes?: Record<string, { source_url: string }> } }[];
    "wp:term"?: { taxonomy: string; name: string }[][];
  };
}

interface Card { id: number; href: string; title: string; category: string; img: string | null; alt: string }

// WordPress returns titles as HTML (&#8217; etc.); decode to plain text.
const decode = (html: string) => new DOMParser().parseFromString(html, "text/html").documentElement.textContent || "";

const toCard = (p: WpPost): Card => {
  const media = p._embedded?.["wp:featuredmedia"]?.[0];
  const sizes = media?.media_details?.sizes;
  const category = (p._embedded?.["wp:term"] || []).flat().find(t => t.taxonomy === "category" && t.name !== "Uncategorized");
  return {
    id: p.id,
    href: p.link,
    title: decode(p.title.rendered),
    category: category?.name || "Journal",
    img: sizes?.medium_large?.source_url || sizes?.large?.source_url || media?.source_url || null,
    alt: media?.alt_text || decode(p.title.rendered),
  };
};

// The shop's existing guide pages, used while the blog is empty.
const GUIDES: Card[] = [
  { id: -1, href: "/jewellery-care", title: "Looking after fine jewellery", category: "Guide", img: "/images/workshop-bench-1600.jpg", alt: "A McCulloch jeweller at the workshop bench, seen from above" },
  { id: -2, href: "/diamond-guide", title: "The diamond guide", category: "Guide", img: null, alt: "" },
  { id: -3, href: "/gemstone-guide", title: "Choosing a coloured gemstone", category: "Guide", img: null, alt: "" },
  { id: -4, href: "/ring-size-guide", title: "Finding your ring size", category: "Guide", img: null, alt: "" },
];

interface JournalV2Props { pageX: string; h2Style: React.CSSProperties }

const JournalV2 = ({ pageX, h2Style }: JournalV2Props): JSX.Element | null => {
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(POSTS_URL, { signal: ctrl.signal })
      .then(r => (r.ok ? r.json() : []))
      .then((posts: WpPost[]) => {
        if (!Array.isArray(posts)) return;
        // Skip WordPress's default sample post if it's still there.
        setCards(posts.filter(p => p.slug !== "hello-world").slice(0, 3).map(toCard));
      })
      .catch(() => { /* blog unreachable: keep the section hidden */ });
    return () => ctrl.abort();
  }, []);

  // Until the blog has real posts, the section shows the shop's own guides so it is never empty.
  const fromBlog = cards.length > 0;
  const list = fromBlog ? cards : GUIDES;
  const [lead, ...rest] = list;

  return (
    // One lead article with a photograph, the others as a plain list beside it.
    <section id="journal" className="v2-s-journal" style={{ padding: `${SP} ${pageX} 0` }}>
      <div style={{ maxWidth: 1250, margin: "0 auto" }}>
        <div className="v2-stagger v2-sechead" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
          <div>
            <div className="v2-eyebrow" style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text, marginBottom: 14 }}>{fromBlog ? "The journal" : "Guides"}</div>
            <h2 style={{ ...h2Style, fontSize: "clamp(23px, 2.2vw, 31px)" }}>{fromBlog ? "From the journal" : "Good to know before you choose"}</h2>
          </div>
          {fromBlog && <a href="/blog/" className="v2-textlink" style={{ whiteSpace: "nowrap" }}>All articles</a>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr)", gap: "clamp(32px, 6vw, 96px)", alignItems: "center", marginTop: 40 }} className="v2-split">
          <a href={lead.href} className="v2-prodcard v2-reveal" style={{ display: "block" }}>
            <div className="v2-reveal v2-rv-mask" style={{ position: "relative", aspectRatio: "16 / 10", overflow: "hidden", background: T.tint }}>
              {lead.img && <img src={lead.img} srcSet={lead.img === "/images/workshop-bench-1600.jpg" ? "/images/workshop-bench-900.jpg 900w, /images/workshop-bench-1600.jpg 1600w" : undefined} sizes="(max-width: 900px) 100vw, 70vw" alt={lead.alt} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted, margin: "18px 0 8px" }}>{lead.category}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(19px, 1.7vw, 23px)", lineHeight: 1.28, color: T.text }}>{lead.title}</div>
          </a>
          <div className="v2-stagger">
            {rest.map((c, i) => (
              <a key={c.id} href={c.href} className="v2-journalrow" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "clamp(18px, 2vw, 26px) 0", borderTop: `1px solid ${T.rule}`, borderBottom: i === rest.length - 1 ? `1px solid ${T.rule}` : undefined }}>
                <span>
                  <span style={{ display: "block", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>{c.category}</span>
                  <span style={{ display: "block", fontFamily: FONT_DISPLAY, fontSize: "clamp(16.5px, 1.35vw, 19px)", lineHeight: 1.3, color: T.text }}>{c.title}</span>
                </span>
                <span aria-hidden="true" style={{ flex: "none", fontSize: 18, color: T.muted }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JournalV2;
