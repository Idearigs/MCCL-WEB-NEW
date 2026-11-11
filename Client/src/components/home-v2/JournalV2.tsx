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

  if (cards.length === 0) return null;

  return (
    // Carries its own top spacing: it only renders when there are posts, so the gap goes with it.
    <section id="journal" style={{ padding: `${SP} ${pageX}` }}>
      <div className="v2-sechead" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, paddingBottom: 22, borderBottom: `1px solid ${T.rule}` }}>
        <h2 style={{ ...h2Style, fontSize: "clamp(24px, 2.4vw, 34px)" }}>The journal</h2>
        <a href="/blog/" className="v2-textlink" style={{ whiteSpace: "nowrap" }}>All articles</a>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(20px, 2.4vw, 40px)", marginTop: 36 }} className="v2-journalgrid">
        {cards.map(c => (
          <a key={c.id} href={c.href} className="v2-prodcard" style={{ display: "block" }}>
            <div style={{ position: "relative", aspectRatio: "3 / 2", overflow: "hidden", background: T.tint }}>
              {c.img && <img src={c.img} alt={c.alt} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
            </div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold, margin: "18px 0 10px" }}>{c.category}</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, lineHeight: 1.25, color: T.ink }}>{c.title}</div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default JournalV2;
