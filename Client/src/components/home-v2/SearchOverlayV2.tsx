import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API_BASE_URL, { getMediaUrl } from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

/**
 * SearchOverlayV2 — the search panel.
 * Design: design_handoff_mcculloch_account_search_saved (Search panel). An overlay that
 * drops from the header (desktop) or fills the screen (mobile), with an Italiana input,
 * three states (idle / results / no-results) and results GROUPED by category.
 *
 * Matching is token-based: the query is lowercased, split on whitespace, and every token
 * must appear in an item's name + spec + keyword string + group (the handoff's fix for
 * two-word queries). The catalogue is the site's real /products feed.
 */

const M2 = "#8A8377";
const A9 = "#A9A196";
const GROUP_ORDER = ["Engagement rings", "Wedding bands", "Jewellery", "Watches"];
const POPULAR = ["Solitaire", "Hidden halo", "Platinum", "Emerald cut", "Eternity", "Pear cut"];
const RECENT_KEY = "mcculloch_recent_searches";

const GUIDES = [
  { title: "How to measure a ring size at home", kind: "Guide", to: "/customer-service", kw: "size sizing measure fit" },
  { title: "Clarity, colour and cut, in plain English", kind: "Guide", to: "/diamonds", kw: "clarity colour cut grading diamond stone" },
  { title: "Choosing between platinum and white gold", kind: "Guide", to: "/customer-service", kw: "platinum white gold metal" },
  { title: "What a halo setting actually does", kind: "Journal", to: "/engagement-rings", kw: "halo setting hidden" },
  { title: "Why we hold no stock", kind: "Journal", to: "/our-story", kw: "made to order stock bespoke" },
  { title: "Resetting an inherited stone", kind: "Journal", to: "/bespoke-design", kw: "reset inherited remodelling stone" },
];

const money = (n?: number) => (n == null || isNaN(n) ? "" : "£" + Math.round(n).toLocaleString("en-GB"));

// Bounded Levenshtein distance — returns early once it exceeds `max` (returns max+1).
// Used for typo correction against the catalogue vocabulary.
const levenshtein = (a: string, b: string, max: number): number => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1);
  const cur = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1; // whole row already over budget
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j];
  }
  return prev[b.length];
};

// Query aliases → the vocabulary that actually appears in the product data. Token search
// requires every token to hit, so a token also hits if any of its aliases is present.
// This lets people describe a piece ("two stone", "diamond", "rose") without the name.
const ALIASES: Record<string, string[]> = {
  two: ["2"], three: ["3"], four: ["4"], five: ["5"],
  "2": ["two"], "3": ["three"], "4": ["four"],
  diamonds: ["diamond"], stones: ["stone"], rings: ["ring"], bands: ["band"],
  earrings: ["earring"], necklaces: ["necklace"], bracelets: ["bracelet"],
  studs: ["stud"], halos: ["halo"], solitaires: ["solitaire"], pendants: ["pendant"],
  "3-stone": ["trilogy", "three stone"], trilogy: ["three stone", "3 stone"],
};

interface Entry {
  id: string; name: string; spec: string; price?: number; image?: string; to: string; group: string;
  nameLc: string;   // name only (highest search weight)
  attr: string;     // category + ring types + gemstones + metals + collection (medium weight)
  desc: string;     // description paragraph (low weight, broad coverage)
}

const groupOf = (p: any): string => {
  const c = String(p?.category?.slug || p?.category?.name || p?.category || "").toLowerCase();
  if (c.includes("engagement")) return "Engagement rings";
  if (c.includes("wedding")) return "Wedding bands";
  if (c.includes("watch")) return "Watches";
  return "Jewellery";
};

interface SearchOverlayV2Props {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  topOffset?: number; // desktop: header bottom, so the panel tucks under the header
}

const SearchOverlayV2: React.FC<SearchOverlayV2Props> = ({ isOpen, onClose, isMobile, topOffset = 100 }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [catalogue, setCatalogue] = useState<Entry[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load the full catalogue once (the list endpoint defaults to 24 per page, so we ask
  // for a large page — client-side token search needs every product, not just page one)
  useEffect(() => {
    if (catalogue.length) return;
    fetch(`${API_BASE_URL}/products?limit=1000`)
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) return;
        const list: any[] = d.data?.products || d.data || [];
        setCatalogue(
          list.map((p) => {
            const collection = p.collection?.name || "";
            const cat = p.category?.name || (typeof p.category === "string" ? p.category : "") || "";
            const ringTypes = (p.ringTypes || []).map((t: any) => t.name).join(" ");
            const gems = (p.gemstones || []).map((g: any) => g.name).join(" ");
            const metals = [p.primary_metal?.name, ...(p.available_metals || []).map((m: any) => m.name)].filter(Boolean).join(" ");
            // Prefer a descriptive spec line: ring style + primary metal, else category
            const styleBits = [ringTypes.split(" ")[0], p.primary_metal?.name].filter(Boolean).join(" · ");
            const spec = styleBits || [collection, cat].filter(Boolean).join(" · ");
            // list serializer returns a pre-formatted price string; use the numeric fields
            const priceNum = p.sale_price ?? p.base_price ?? (typeof p.price === "number" ? p.price : undefined);
            return {
              id: String(p.id),
              name: p.name,
              spec,
              price: priceNum != null ? Number(priceNum) : undefined,
              image: p.image?.url || p.images?.[0]?.url || p.featured_image,
              to: p.slug ? `/product/${p.slug}` : "#",
              group: groupOf(p),
              nameLc: String(p.name || "").toLowerCase(),
              attr: `${cat} ${ringTypes} ${gems} ${metals} ${collection}`.toLowerCase(),
              desc: String(p.description || "").toLowerCase(),
            } as Entry;
          })
        );
      })
      .catch(() => {});
  }, [catalogue.length]);

  // Recent searches + focus on open
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecents(JSON.parse(stored).slice(0, 4));
    } catch {}
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Escape closes; lock body scroll on mobile full-screen
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    if (isMobile) document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [isOpen, isMobile, onClose]);

  const q = query.trim().toLowerCase();
  const rawTokens = q.split(/\s+/).filter(Boolean);
  // A token hits a haystack if the token OR any of its aliases appears in it.
  const tokenIn = (hay: string, tok: string) =>
    hay.includes(tok) || (ALIASES[tok] || []).some((a) => hay.includes(a));

  // Vocabulary: every distinct word (≥3 chars) across names + attributes + descriptions,
  // plus the guide text. Built once per catalogue; the basis for typo correction.
  const vocab = useMemo(() => {
    const set = new Set<string>();
    const add = (text: string) => { for (const w of text.split(/[^a-z0-9]+/)) if (w.length >= 3) set.add(w); };
    catalogue.forEach((e) => { add(e.nameLc); add(e.attr); add(e.desc); });
    GUIDES.forEach((g) => add(`${g.title} ${g.kw}`.toLowerCase()));
    return Array.from(set);
  }, [catalogue]);

  // Correct one token: if it already lives somewhere in the vocabulary (as a substring of
  // some word, e.g. "plat" ⊂ "platinum"), keep it; otherwise snap it to the nearest word
  // within a length-scaled edit distance. Returns null when no correction is found.
  const correctToken = (tok: string): string | null => {
    if (tok.length < 3 || /\d/.test(tok)) return null;
    // "Has a home" = the token is a fragment of a real catalogue word ("plat" ⊂ "platinum").
    // (We deliberately do NOT treat a token that merely CONTAINS a short word as homed —
    // that let "solitare" pass because "are" sits inside it, and blocked plural folding.)
    if (vocab.some((w) => w.includes(tok))) return null;
    const max = tok.length <= 4 ? 1 : 2;
    let best: string | null = null, bestD = max + 1;
    for (const w of vocab) {
      if (Math.abs(w.length - tok.length) > max) continue;
      const dd = levenshtein(tok, w, max);
      if (dd < bestD) { bestD = dd; best = w; if (dd === 1) break; }
    }
    return best;
  };

  // Corrected token list + a display flag, so the UI can say "Showing results for …".
  const correction = useMemo(() => {
    if (!rawTokens.length || !vocab.length) return { tokens: rawTokens, changed: false, text: q };
    let changed = false;
    const tokens = rawTokens.map((t) => { const c = correctToken(t); if (c && c !== t) { changed = true; return c; } return t; });
    return { tokens, changed, text: tokens.join(" ") };
  }, [q, vocab]);

  const tokens = correction.tokens;
  const hitAll = (hay: string) => tokens.every((t) => tokenIn(hay, t));

  // Score a product across weighted fields (name > attributes > description). Every token
  // must land somewhere, or the item is dropped; the total drives ranking.
  const scoreEntry = (e: Entry): number => {
    let score = 0;
    for (const tok of tokens) {
      let tokScore = 0;
      if (tokenIn(e.nameLc, tok)) tokScore = 6;
      else if (tokenIn(e.attr, tok)) tokScore = 3;
      else if (tokenIn(e.desc, tok)) tokScore = 1;
      if (tokScore === 0) return -1; // token missing → not a match
      score += tokScore;
    }
    // Small bonus for a whole-phrase name hit ("elarisa", "hidden halo")
    if (e.nameLc.includes(correction.text)) score += 5;
    return score;
  };

  const matches = useMemo(() => {
    if (!tokens.length) return [] as Entry[];
    return catalogue
      .map((e) => ({ e, s: scoreEntry(e) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.e);
  }, [correction, catalogue]);

  const guideMatches = useMemo(
    () => (tokens.length ? GUIDES.filter((g) => hitAll(`${g.title} ${g.kw}`.toLowerCase())) : []),
    [correction]
  );

  const groups = useMemo(
    () =>
      GROUP_ORDER.map((label) => {
        const items = matches.filter((m) => m.group === label);
        return { label, count: items.length === 1 ? "1 piece" : `${items.length} pieces`, items };
      }).filter((g) => g.items.length),
    [matches]
  );

  // Browse tiles from real category depth
  const browse = useMemo(() => {
    return GROUP_ORDER.map((label) => {
      const items = catalogue.filter((e) => e.group === label);
      const noun = label === "Wedding bands" ? "bands" : label === "Watches" ? "watches" : label === "Engagement rings" ? "rings" : "pieces";
      const short = label === "Engagement rings" ? "Engagement" : label === "Wedding bands" ? "Wedding" : label;
      return { label: short, count: `${items.length} ${noun}`, image: items.find((i) => i.image)?.image, to: label === "Engagement rings" ? "/engagement-rings" : label === "Wedding bands" ? "/wedding" : label === "Watches" ? "/watches" : "/jewellery" };
    });
  }, [catalogue]);

  const total = matches.length + guideMatches.length;
  const idle = !q;
  const noResults = !!q && total === 0;

  const pushRecent = (val: string) => {
    const v = val.trim();
    if (!v) return;
    const next = [v, ...recents.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 4);
    setRecents(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  const go = (to: string) => { onClose(); navigate(to); };
  const seeAll = () => { pushRecent(query); go("/products"); };

  if (!isOpen) return null;

  // ————— Shared inner blocks —————
  const InputRow = (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "center", gap: 20, padding: isMobile ? "18px 20px 16px" : "26px clamp(24px, 3vw, 52px) 22px" }}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && total > 0) seeAll(); }}
        placeholder="Search rings, stones, or a name"
        style={{ width: "100%", padding: 0, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 27 : "clamp(28px, 3vw, 44px)", letterSpacing: "0.01em", color: T.ink, background: "transparent", border: 0, outline: "none" }}
      />
      <button type="button" onClick={onClose} style={{ cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M2 }}>Close</button>
    </div>
  );

  const IdleBlock = (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.85fr) minmax(0, 1.15fr)", gap: isMobile ? 32 : "clamp(32px, 4vw, 72px)", padding: isMobile ? "24px 20px 40px" : "32px clamp(24px, 3vw, 52px) 44px" }}>
      <div>
        {recents.length > 0 && (
          <>
            <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: M2, marginBottom: 16 }}>Recent</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, marginBottom: 32 }}>
              {recents.map((r) => (
                <button key={r} type="button" onClick={() => setQuery(r)} className="sov-recent" style={{ padding: "7px 0", cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 14, color: T.body }}>{r}</button>
              ))}
            </div>
          </>
        )}
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: M2, marginBottom: 16 }}>Most asked for</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {POPULAR.map((p) => (
            <button key={p} type="button" onClick={() => setQuery(p.toLowerCase())} className="sov-chip" style={{ padding: "9px 14px", cursor: "pointer", background: "transparent", border: `1px solid ${T.ruleSoft}`, fontFamily: FONT_BODY, fontSize: 12.5, color: T.body }}>{p}</button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: M2, marginBottom: 16 }}>Browse</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
          {browse.map((b) => (
            <button key={b.label} type="button" onClick={() => go(b.to)} style={{ display: "block", textAlign: "left", background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: FONT_BODY }}>
              <div style={{ position: "relative", aspectRatio: "4 / 5", background: T.tint, overflow: "hidden" }}>
                {b.image && <img src={getMediaUrl(b.image)} alt={b.label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
              </div>
              <div style={{ fontSize: 13, marginTop: 12, color: T.ink }}>{b.label}</div>
              <div style={{ fontSize: 11.5, color: M2, marginTop: 4 }}>{b.count}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const ResultsBlock = (
    <div style={{ padding: isMobile ? "22px 20px 40px" : "26px clamp(24px, 3vw, 52px) 40px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, marginBottom: 26 }}>
        <span style={{ fontSize: 12.5, color: T.muted }}>
          {correction.changed
            ? <>Showing results for <span style={{ color: T.ink }}>“{correction.text}”</span></>
            : <>{total === 1 ? "1 result" : `${total} results`} for “{query}”</>}
        </span>
        {!isMobile && <button type="button" onClick={seeAll} className="sov-seeall">See all results</button>}
      </div>

      {groups.map((g, gi) => (
        <div key={g.label} className="sov-group" style={{ marginBottom: 34, animationDelay: `${(gi * 0.04).toFixed(2)}s` }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, paddingBottom: 14, borderBottom: `1px solid ${T.rule}` }}>
            <span style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: T.ink }}>{g.label}</span>
            <span style={{ fontSize: 11.5, color: M2 }}>{g.count}</span>
          </div>

          {isMobile ? (
            <div style={{ marginTop: 6 }}>
              {g.items.slice(0, 4).map((it) => (
                <Link key={it.id} to={it.to} onClick={onClose} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 14, alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${T.rule}` }}>
                  <div style={{ position: "relative", aspectRatio: "4 / 5", background: T.tint, overflow: "hidden" }}>
                    {it.image && <img src={getMediaUrl(it.image)} alt={it.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 14 }}>{it.name}</span>
                      <span style={{ fontSize: 13, whiteSpace: "nowrap" }}>{money(it.price)}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: M2, marginTop: 4 }}>{it.spec}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "clamp(12px, 1.6vw, 22px)", marginTop: 18 }}>
              {g.items.slice(0, 5).map((it) => (
                <Link key={it.id} to={it.to} onClick={onClose} style={{ display: "block" }}>
                  {/* height capped (not 4:5) so the name + price stay above the panel fold */}
                  <div style={{ position: "relative", height: "clamp(150px, 19vh, 210px)", background: T.tint, overflow: "hidden" }}>
                    {it.image && <img src={getMediaUrl(it.image)} alt={it.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, margin: "13px 0 5px" }}>
                    <span style={{ fontSize: 13.5 }}>{it.name}</span>
                    <span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{money(it.price)}</span>
                  </div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.5, color: M2 }}>{it.spec}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}

      {guideMatches.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, paddingBottom: 14, borderBottom: `1px solid ${T.rule}` }}>
            <span style={{ fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: T.ink }}>Guides &amp; journal</span>
            <span style={{ fontSize: 11.5, color: M2 }}>{guideMatches.length === 1 ? "1 article" : `${guideMatches.length} articles`}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 clamp(24px, 3vw, 48px)" }}>
            {guideMatches.map((g) => (
              <Link key={g.title} to={g.to} onClick={onClose} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, padding: "14px 0", borderBottom: `1px solid ${T.rule}` }}>
                <span style={{ fontSize: 13.5 }}>{g.title}</span>
                <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M2, whiteSpace: "nowrap" }}>{g.kind}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isMobile && (
        <button type="button" onClick={seeAll} style={{ width: "100%", marginTop: 26, padding: "15px 0", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>See all results</button>
      )}
    </div>
  );

  const NoResultsBlock = (
    <div style={{ padding: isMobile ? "48px 20px 56px" : "56px clamp(24px, 3vw, 52px) 60px", textAlign: "center" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(26px, 2.6vw, 36px)", marginBottom: 14 }}>Nothing matches “{query}”.</div>
      <p style={{ margin: "0 auto 26px", maxWidth: "44ch", fontSize: 14, lineHeight: 1.7, color: T.muted }}>We hold no stock, so everything is made to order — if you can describe it, we can probably make it.</p>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
        <button type="button" onClick={() => go("/bespoke-design")} style={{ padding: "14px 26px", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>Commission it</button>
        <button type="button" onClick={() => go("/contact")} style={{ padding: "14px 26px", background: "transparent", border: `1px solid ${T.ruleStrong}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink }}>Ask the workshop</button>
      </div>
    </div>
  );

  const styleTag = (
    <style>{`
      .sov-recent:hover { color: ${T.gold} !important; }
      .sov-chip:hover { border-color: ${T.ink} !important; color: ${T.ink} !important; }
      .sov-seeall { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; padding-bottom: 4px; border-bottom: 1px solid ${T.ruleStrong}; color: ${T.ink}; background: transparent; border-top: 0; border-left: 0; border-right: 0; cursor: pointer; font-family: ${FONT_BODY}; transition: color 0.25s ease, border-color 0.25s ease; }
      .sov-seeall:hover { color: ${T.gold}; border-color: ${T.gold}; }
      .sov-body::-webkit-scrollbar { display: none; }
      .sov-group { animation: sovRowIn 0.3s cubic-bezier(0.22,1,0.36,1) both; }
      @keyframes sovRowIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      @keyframes sovPanelDown { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: none; } }
      @keyframes sovFullIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { .sov-panel, .sov-full, .sov-group { animation: none !important; } }
    `}</style>
  );

  // ————— Mobile: full-screen —————
  if (isMobile) {
    return (
      <div className="sov-full" style={{ position: "fixed", inset: 0, zIndex: 95, background: T.paper, fontFamily: FONT_BODY, display: "flex", flexDirection: "column", animation: "sovFullIn 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
        {styleTag}
        <div style={{ flex: "none", borderBottom: `1px solid ${T.rule}` }}>{InputRow}</div>
        <div className="sov-body" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
          {idle ? IdleBlock : noResults ? NoResultsBlock : ResultsBlock}
        </div>
      </div>
    );
  }

  // ————— Desktop: drop panel + scrim —————
  return (
    <>
      {styleTag}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 55, background: "rgba(20,18,15,0.34)", backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)", animation: "sovRowIn 0.3s ease both" }} />
      <div className="sov-panel" style={{ position: "fixed", top: topOffset, left: 0, right: 0, zIndex: 58, background: T.paper, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}`, boxShadow: "0 24px 48px -32px rgba(28,26,23,0.28)", animation: "sovPanelDown 0.3s cubic-bezier(0.22,1,0.36,1) both" }}>
        {InputRow}
        <div className="sov-body" style={{ maxHeight: "72vh", overflowY: "auto", scrollbarWidth: "none", borderTop: `1px solid ${T.rule}` }}>
          {idle ? IdleBlock : noResults ? NoResultsBlock : ResultsBlock}
        </div>
      </div>
    </>
  );
};

export default SearchOverlayV2;
