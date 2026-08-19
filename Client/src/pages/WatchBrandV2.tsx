import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useIsMobile } from "../hooks/use-mobile";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { cleanWatchName } from "./WatchesV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * WatchBrandV2 — one template, three brand pages (Festina / Roamer / Briston).
 * VISUAL design: design_handoff_mcculloch_signin_chat_watches (Brand pages), amended by
 * design_handoff_mcculloch_watch_collections ("Where to start" → "Collections"). Hero with
 * founding year, "The house" split with stats, a "Collections" row (cards link to the
 * collection page, each carrying a held count), in-stock grid with a movement filter, and a
 * "Why we sell it" band on ink. Brand is taken from the route (/festina, /roamer, /briston).
 *
 * REAL data: the in-stock grid and collection from-prices come from GET /watches (filtered
 * to the brand); the "Collections" cards come from the brand's real collections
 * (GET /watches/brands/slug/:slug/collections), stocked-first, and link to /collections/:slug.
 *
 * PLACEHOLDER (needs sign-off): the brand NARRATIVE — standfirst, headline, paragraphs and
 * the "why" copy — is written from general knowledge. The README requires the client to
 * check every brand claim with each house before launch; founding years are the real ones.
 */

const M2 = "#8A8377";
const GREEN = "#4A7A52";
const money = (n?: number) => (n == null || isNaN(n) ? "" : "£" + Math.round(n).toLocaleString("en-GB"));

const inferMovement = (text: string, specMove?: string | null): "Quartz" | "Automatic" => {
  const t = `${specMove || ""} ${text}`.toLowerCase();
  if (/autom|self.?wind|sellita|mechanical|skeleton/.test(t)) return "Automatic";
  return "Quartz";
};

interface BrandMeta {
  slug: string; founded: string; origin: string; heroBg: string;
  standfirst: string; headline: string; paragraphs: string[];
  whyHeadline: string; whyBody: string; warranty: string;
}

// NARRATIVE below is placeholder pending each house's sign-off (README). Founding years real.
const BRANDS: Record<string, BrandMeta> = {
  Festina: {
    slug: "festina", founded: "1902", origin: "Spain", heroBg: "#1A1B20", warranty: "2 years",
    standfirst: "Chronographs and clean steel at prices that leave room for the rest of your life.",
    headline: "The watch you actually wear.",
    paragraphs: [
      "Festina has been making watches since 1902 and has spent most of the last forty years doing one thing extremely well: putting a legible chronograph on a steel bracelet at a price that does not require a conversation with anybody.",
      "The range runs from a plain three-hand on leather to titanium and Swiss-made references, and the sizing is sensible throughout. If you want a first proper watch, or a second one you can wear without thinking about it, this is where most of our customers start.",
      "We hold the core references and can order the rest. Every one is timed on our bench and the bracelet sized before it leaves.",
    ],
    whyHeadline: "Nothing to apologise for at the price.",
    whyBody: "We sell watches at every level, and this is the range we recommend without reservation to anyone who wants something they can wear daily and replace without heartbreak. The steel is properly finished, the movements are serviceable, and the warranty is real because we are authorised.",
  },
  Roamer: {
    slug: "roamer", founded: "1888", origin: "Switzerland", heroBg: "#14161A", warranty: "2 years",
    standfirst: "Swiss made since 1888, and priced as though nobody has told them what that is worth.",
    headline: "Quietly Swiss, quietly serious.",
    paragraphs: [
      "Roamer has been making watches in Switzerland since 1888 and has never been a fashion house. The result is a catalogue that reads older than it is: automatics, skeletons, moonphases and a diver, all built to specifications that would be unremarkable at three times the money.",
      "The Searock is the one we sell most — a Sellita SW200 automatic, sapphire crystal, 200 metres, on a bracelet that tapers the way a good bracelet should. The Competence skeletons are for people who want to watch the thing work.",
      "Every reference we sell is a Swiss movement we can service in the building, with parts that are actually available. That matters more than it sounds.",
    ],
    whyHeadline: "Swiss movements without the Swiss mark-up.",
    whyBody: "This is the range we point people to when they want a mechanical watch and have been quoted four figures for something with the same movement inside. Roamer has no marketing budget to recover, and the difference lands in the specification instead. We service them here for as long as you own them.",
  },
  Briston: {
    slug: "briston", founded: "2013", origin: "France", heroBg: "#191C1A", warranty: "2 years",
    standfirst: "Acetate cases in colours nobody else is making. The watch people ask about.",
    headline: "The one that gets noticed.",
    paragraphs: [
      "Briston started in Paris in 2013 with an idea nobody else was pursuing: build the case out of acetate, the material spectacle frames are cut from, and treat colour as part of the specification rather than an afterthought.",
      "The Clubmaster is the shape everything else is built from — a cushion case, a domed crystal and a nato strap you can change in seconds. The range runs from quartz through to Swiss automatics and a proper 200-metre diver.",
      "It is the only watch in the shop that customers photograph on the wrist before they have decided to buy it. Worth seeing in daylight — the acetate reads completely differently under a window than under a bulb.",
    ],
    whyHeadline: "Colour treated as a specification.",
    whyBody: "Most watch brands offer black, blue or white and call it a range. Briston cuts cases from acetate in patterns that change completely in daylight, and backs it with movements and water resistance that hold up. It is the range we put on the wrist of anyone who says everything looks the same.",
  },
};

const brandFromPath = (path: string): string => {
  if (path.includes("roamer")) return "Roamer";
  if (path.includes("briston")) return "Briston";
  return "Festina";
};

interface BW { id: string; name: string; display: string; slug: string; ref: string; price: number; image?: string; movement: "Quartz" | "Automatic"; spec: string; inStock: boolean; featured: boolean; collection?: string }

const WatchBrandV2 = (): JSX.Element => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const brand = brandFromPath(location.pathname);
  const meta = BRANDS[brand];

  const [watches, setWatches] = useState<BW[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [movement, setMovement] = useState("All");
  const [visible, setVisible] = useState(8);

  useEffect(() => { document.body.style.background = T.paper; window.scrollTo(0, 0); setMovement("All"); setVisible(8); }, [brand]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/watches?limit=1000`).then((r) => r.json()).then((d) => {
      const list: any[] = d?.data?.watches || d?.data || [];
      const mine = list.filter((w) => w.brand?.name === brand).map((w) => {
        const sp = w.specifications || {};
        const text = `${w.name || ""} ${w.description || ""}`;
        const mm = parseFloat(String(sp.case_diameter || ""));
        const specBits = [inferMovement(text, sp.movement), !isNaN(mm) && mm >= 20 && mm <= 50 ? `${Math.round(mm)}mm` : null, sp.water_resistance].filter(Boolean);
        const ref = w.model_number || w.sku || "";
        return {
          id: String(w.id), name: w.name || "Watch", display: cleanWatchName(w.name, brand, ref), slug: w.slug || "", ref,
          price: Number(w.base_price) || 0, image: w.image?.url || w.images?.[0]?.url,
          movement: inferMovement(text, sp.movement), spec: specBits.join(" · "),
          inStock: w.in_stock !== false, featured: !!w.is_featured, collection: w.collection?.name,
        } as BW;
      }).filter((w) => w.price > 0);
      setWatches(mine);
    }).catch(() => {});

    fetch(`${API_BASE_URL}/watches/brands/slug/${meta.slug}/collections`).then((r) => r.json()).then((d) => {
      const arr: any[] = d?.data || d?.collections || (Array.isArray(d) ? d : []);
      setCollections(arr);
    }).catch(() => {});
  }, [brand, meta.slug]);

  const fromPrice = useMemo(() => (watches.length ? Math.min(...watches.map((w) => w.price)) : 0), [watches]);

  const stockedCollections = useMemo(() => collections.filter((c) => (c.watches_count || 0) > 0), [collections]);

  const families = useMemo(() => {
    const byColl: Record<string, number> = {};
    watches.forEach((w) => { if (w.collection) byColl[w.collection] = Math.min(byColl[w.collection] ?? Infinity, w.price); });
    return [...stockedCollections]
      .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || (b.watches_count || 0) - (a.watches_count || 0))
      .map((c) => ({
        name: c.name, slug: c.slug, image: c.preview_image || c.image_url,
        count: c.watches_count || 0,
        from: byColl[c.name] ? `From ${money(byColl[c.name])}` : c.watches_count ? `${c.watches_count} watches` : "",
      }));
  }, [stockedCollections, watches]);

  const grid = useMemo(() => {
    let list = movement === "All" ? watches : watches.filter((w) => w.movement === movement);
    return [...list].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }, [watches, movement]);

  const facts = [
    { value: meta.founded, label: "Founded" },
    { value: fromPrice ? money(fromPrice) : "—", label: "From" },
    { value: meta.warranty, label: "Warranty" },
  ];

  const otherBrands = ["Festina", "Roamer", "Briston"];

  return (
    <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.ink }}>
      <style>{`
        .wb a { color: inherit; text-decoration: none; }
        .wb-under:hover { color: ${T.gold}; }
        .wb-card:hover .wb-cardimg img { transform: scale(1.04); }
        .wb-why-a:hover { background: ${T.gold} !important; color: #FFFFFF !important; }
        .wb-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .wb-scroll::-webkit-scrollbar { display: none; }
        @keyframes wbIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .wb-body { animation: none !important; } }
      `}</style>

      <div className="wb">
        <NavigationV2 solid />
        <div style={{ height: isMobile ? 96 : 118 }} />

        {/* Brand tabs */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "0 clamp(24px, 3vw, 52px)", background: T.tint, borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ display: "flex", overflowX: "auto" }}>
            {otherBrands.map((b) => {
              const on = b === brand;
              return (
                <Link key={b} to={`/${BRANDS[b].slug}`} style={{ padding: "16px clamp(16px, 2.2vw, 34px)", background: on ? T.paper : "transparent", borderBottom: `2px solid ${on ? T.ink : "transparent"}`, fontFamily: FONT_BODY, fontSize: 12.5, letterSpacing: "0.12em", textTransform: "uppercase", color: on ? T.ink : T.muted, whiteSpace: "nowrap", transition: "color 0.25s ease, background 0.25s ease" }}>{b}</Link>
              );
            })}
          </div>
          {!isMobile && <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: M2 }}>Authorised retailer</div>}
        </div>

        <div key={brand} className="wb-body" style={{ animation: "wbIn 0.4s cubic-bezier(0.22,1,0.36,1) both" }}>
          {/* Hero */}
          <section style={{ position: "relative", height: "clamp(400px, 60vh, 660px)", background: meta.heroBg, overflow: "hidden" }}>
            {watches.find((w) => w.image) && <img src={getMediaUrl(watches.find((w) => w.image)!.image!)} alt={brand} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: "clamp(24px,5vw,72px)" }} />}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "clamp(28px, 3.4vw, 60px) clamp(24px, 3vw, 52px)", background: "linear-gradient(to top, rgba(18,16,13,0.8), rgba(18,16,13,0.05) 58%, rgba(18,16,13,0.32))" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(248,246,240,0.68)", marginBottom: 22, pointerEvents: "auto" }}>
                <Link to="/watches" style={{ color: "rgba(248,246,240,0.68)" }}>Watches</Link>
                <span style={{ color: "rgba(248,246,240,0.4)" }}>/</span><span style={{ color: "#FFFFFF" }}>{brand}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 28 }}>
                <div>
                  <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(44px, 5.6vw, 90px)", lineHeight: 0.98, letterSpacing: "0.02em", textTransform: "uppercase", margin: "0 0 18px", color: "#FFFFFF" }}>{brand}</h1>
                  <p style={{ margin: 0, maxWidth: "44ch", fontSize: 15.5, lineHeight: 1.7, color: "#D3CCC1" }}>{meta.standfirst}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 2.6vw, 40px)", lineHeight: 1, color: "#FFFFFF" }}>{meta.founded}</div>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(248,246,240,0.66)", marginTop: 10 }}>{meta.origin}</div>
                </div>
              </div>
            </div>
          </section>

          {/* The house */}
          <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.85fr) minmax(0, 1.15fr)", gap: "clamp(28px, 5vw, 88px)", padding: "clamp(44px, 5vw, 88px) clamp(24px, 3vw, 52px) clamp(36px, 4vw, 64px)", alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>The house</div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(28px, 3.2vw, 46px)", lineHeight: 1.1, margin: 0, maxWidth: "16ch" }}>{meta.headline}</h2>
            </div>
            <div>
              {meta.paragraphs.map((p, i) => <p key={i} style={{ margin: "0 0 20px", maxWidth: "54ch", fontSize: 16, lineHeight: 1.8, color: T.body }}>{p}</p>)}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 12, paddingTop: 26, borderTop: `1px solid ${T.rule}` }}>
                {facts.map((f) => (
                  <div key={f.label}>
                    <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(24px, 2.2vw, 32px)", lineHeight: 1 }}>{f.value}</div>
                    <div style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginTop: 9 }}>{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Collections (was "Where to start" — renamed per package eight; cards link to the collection page) */}
          {families.length > 0 && (
            <section style={{ padding: "0 clamp(24px, 3vw, 52px) clamp(44px, 5vw, 88px)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(26px, 2.8vw, 40px)", lineHeight: 1.06, margin: 0 }}>Collections</h2>
                <span style={{ fontSize: 12.5, color: T.muted }}>{stockedCollections.length} collection{stockedCollections.length === 1 ? "" : "s"} we stock{families.length > (isMobile ? 1 : 3) ? " — scroll for more" : ""}</span>
              </div>
              <div className="wb-scroll" style={{ display: "flex", gap: "clamp(16px, 2.2vw, 34px)", marginTop: 30, overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                {families.map((f) => (
                  <Link key={f.slug} to={`/collections/${f.slug}`} className="wb-card" style={{ display: "block", flex: "0 0 auto", width: isMobile ? "76%" : "clamp(260px, 30vw, 340px)", scrollSnapAlign: "start" }}>
                    <div className="wb-cardimg" style={{ position: "relative", aspectRatio: "3 / 2", background: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(16px, 2vw, 28px)" }}>
                      {f.image && <img src={getMediaUrl(f.image)} alt={f.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.5s ease" }} loading="lazy" />}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "18px 0 8px" }}>
                      <span style={{ fontSize: 15.5 }}>{f.name}</span>
                      <span style={{ fontSize: 11.5, color: M2 }}>{f.from}</span>
                    </div>
                    {f.count > 0 && <span style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, borderBottom: `1px solid ${T.ruleStrong}`, paddingBottom: 2 }}>{f.count} held</span>}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* In stock grid */}
          <section style={{ padding: "0 clamp(24px, 3vw, 52px) clamp(48px, 6vw, 92px)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 20, paddingBottom: 18, borderBottom: `1px solid ${T.rule}` }}>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(26px, 2.8vw, 40px)", lineHeight: 1.06, margin: 0 }}>{brand} in stock</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {["All", "Quartz", "Automatic"].map((m) => {
                  const on = m === movement;
                  return (
                    <button key={m} type="button" onClick={() => { setMovement(m); setVisible(8); }} style={{ padding: "8px 14px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11.5, color: on ? T.paper : T.body, background: on ? T.ink : "transparent", border: `1px solid ${on ? T.ink : T.ruleSoft}` }}>{m === "All" ? "All movements" : m}</button>
                  );
                })}
              </div>
            </div>

            {grid.length === 0 ? (
              <div style={{ padding: "72px 0", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, marginBottom: 14 }}>Nothing in that movement here.</div>
                <p style={{ margin: "0 auto 24px", maxWidth: "42ch", fontSize: 14, lineHeight: 1.7, color: T.muted }}>We can order most references from this house — tell us what you are after.</p>
                <Link to="/contact" style={{ display: "inline-block", padding: "14px 26px", background: T.ink, color: T.paper, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>Ask us to source one</Link>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "clamp(14px, 2vw, 30px)", marginTop: 30 }}>
                  {grid.slice(0, visible).map((w) => (
                    <Link key={w.id} to={`/watches/${w.slug}`} className="wb-card" style={{ display: "block" }}>
                      <div className="wb-cardimg" style={{ position: "relative", aspectRatio: "4 / 5", background: "#FFFFFF", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(14px, 2.4vw, 26px)" }}>
                        {w.image && <img src={getMediaUrl(w.image)} alt={w.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", transition: "transform 0.5s ease" }} loading="lazy" />}
                        {w.featured && <span style={{ position: "absolute", top: 10, left: 10, padding: "5px 10px", background: "rgba(248,246,240,0.94)", fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.body }}>Featured</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, margin: "16px 0 7px" }}>
                        <span style={{ fontSize: 14, lineHeight: 1.3, flex: "1 1 auto", minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{w.display}</span>
                        <span style={{ fontSize: 13.5, whiteSpace: "nowrap", flex: "none" }}>{money(w.price)}</span>
                      </div>
                      {w.spec && <div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.muted }}>{w.spec}</div>}
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: 7 }}>
                        <span style={{ fontSize: 11.5, color: w.inStock ? GREEN : M2 }}>{w.inStock ? "In stock" : "To order"}</span>
                        {w.ref && <span style={{ fontSize: 11, color: "#A9A196" }}>{w.ref}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
                {visible < grid.length && (
                  <div style={{ textAlign: "center", marginTop: 40 }}>
                    <button type="button" onClick={() => setVisible((v) => v + 8)} style={{ padding: "14px 30px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.ink, background: "transparent", border: `1px solid ${T.ruleStrong}` }}>Show more ({grid.length - visible})</button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Why we sell it — inkDeep (a shade darker than the footer's ink) + hairline so the two dark bands read as separate */}
          <section style={{ background: T.inkDeep, color: T.onDarkSoft, padding: "clamp(48px, 5vw, 88px) clamp(24px, 3vw, 52px)", borderBottom: `1px solid ${T.ruleDark}` }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1.3fr)", gap: "clamp(28px, 5vw, 80px)", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, marginBottom: 18 }}>Why we sell it</div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: "clamp(26px, 2.8vw, 42px)", lineHeight: 1.12, margin: 0, maxWidth: "16ch", color: "#FFFFFF" }}>{meta.whyHeadline}</h2>
              </div>
              <div>
                <p style={{ margin: "0 0 30px", maxWidth: "50ch", fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>{meta.whyBody}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <Link to="/contact" className="wb-why-a" style={{ padding: "15px 28px", background: T.paper, color: T.ink, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", transition: "background 0.25s ease, color 0.25s ease" }}>See them in the showroom</Link>
                  <Link to="/watches" style={{ padding: "15px 28px", border: "1px solid rgba(248,246,240,0.4)", color: "#FFFFFF", fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>All watches</Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        <FooterV2 />
      </div>
    </div>
  );
};

export default WatchBrandV2;
