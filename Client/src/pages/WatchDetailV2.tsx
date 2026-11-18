import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoritesContext";
import API_BASE_URL, { getMediaUrl } from "../config/api";
import { cleanWatchName, roamerName, inferMovement, PHOTO } from "./WatchesV2";
import { GROUND, TILE } from "../components/home-v2/listingShared";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * WatchDetailV2 — the watch product page, light redesign (Nov 2026) in the same family as the
 * jewellery product page: one tall picture plate that stays put, a short buying column (name,
 * price, three facts, Add to bag), then the description and specification set as a catalogue
 * entry, the four things we do for every watch on the page's one sand band, and more from the
 * same house. The dark hero, the boxed buy panel and the dimension bars are gone.
 *
 * WIRED exactly as before to GET /watches/:slug (+ /watches/:id/straps, and the brand's
 * watches for "More from"). Money stays truthful: total = base price + any real strap add-on
 * (from the straps endpoint's price_gbp). Engraving is still a free caseback note ("we confirm
 * any charge before cutting"), never an invented charge. Only specification rows that carry a
 * real, clean value are shown.
 */

const money = (n?: number) => (n == null || isNaN(n) ? "" : "£" + Math.round(n).toLocaleString("en-GB"));
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
// Some imported specification fields hold a stray half-sentence instead of a value
// ("and protected by sapphire glass"). Those are dropped rather than shown.
const clean = (v?: string | null): string | undefined => {
  const t = String(v || "").trim();
  if (!t || t.length > 46 || /^and\b|\bthis watch\b|[.!?]\s/i.test(t)) return undefined;
  return t;
};

interface Strap { id: string; name: string; strap_type?: string; color?: string; width_mm?: number; price_gbp?: number; image_url?: string }

const PANELS = [
  { id: "warranty", title: "Warranty and servicing", body: "Manufacturer warranty from the date of purchase, registered by us on the day it leaves. After that, servicing is done at our own bench. A full service is quoted before any work starts, and we will tell you honestly whether it needs one yet. We do not post movements away." },
  { id: "delivery", title: "Delivery and sizing", body: "In-stock references are timed, regulated and posted within 48 hours by insured courier, signature required. Tell us your wrist measurement at checkout and the bracelet is sized before dispatch, with the removed links in the box. Prefer it sized in person? Choose collection and we will do it while you wait." },
  { id: "returns", title: "Returns and exchanges", body: "Thirty days to change your mind, provided the watch is unworn, the protective films are on, and the papers and links are with it. Engraved casebacks cannot be returned unless there is a fault. We confirm the wording with you in writing before anything is cut." },
  { id: "authorised", title: "Why buy from an authorised retailer", body: "The warranty is valid, the reference is the one on the box, and the watch has not been sitting in a grey-market drawer for years. We are authorised for all three houses we sell, which also means we can order references we do not hold and get parts when a service needs them." },
];

const ASSURANCES: [string, string, React.ReactNode][] = [
  ["Timed and regulated", "On our bench before dispatch.", <path key="a" d="M14 24.5a10.500 10.500 0 100-21 10.500 10.500 0 000 21z M14 8v6l4 2.500" />],
  ["Sized to your wrist", "Bracelet adjusted, links in the box.", <path key="b" d="M5.500 10.500h7v7h-7z M15.500 10.500h7v7h-7z M12.500 14h3" />],
  ["Warranty registered", "Manufacturer warranty, registered by us.", <path key="c" d="M14 3.500l9 3v7c0 6-4 9.500-9 11.500-5-2-9-5.500-9-11.500v-7z M10 14l3 3 5.500-6" />],
  ["Serviced here", "For as long as you own it.", <path key="d" d="M22 14a8 8 0 01-14.500 4.500 M6 14a8 8 0 0114.500-4.500 M20.500 5.500v4h-4 M7.500 22.500v-4h4" />],
];

const pageX = "clamp(20px, 4vw, 64px)";

const WP_CSS = `
  .wp { background: ${GROUND}; color: ${T.text}; font-family: ${FONT_BODY}; min-height: 100vh; padding-top: var(--v2nav-h, 113px); }
  .wp a { color: inherit; text-decoration: none; }
  .wp-wrap { max-width: 1400px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }
  .wp-eyebrow { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .wp-h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(30px, 3.4vw, 48px); line-height: 1.12; margin: 0; color: ${T.text}; text-wrap: balance; }
  .wp-link { display: inline-block; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; padding: 0 0 3px; font-family: ${FONT_BODY}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; white-space: nowrap; transition: border-color 0.2s ease; }
  .wp-link:hover { border-bottom-color: ${T.gold}; }
  .wp-btn { display: block; width: 100%; padding: 21px 24px; background: ${T.ink}; color: ${T.cream} !important; border: 0; cursor: pointer; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
  .wp-btn:hover { background: ${T.text}; }
  .wp-btn2 { display: block; padding: 19px 24px; border: 1px solid ${T.ruleStrong}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; color: ${T.text}; transition: border-color 0.2s ease; }
  .wp-btn2:hover { border-color: ${T.text}; }

  /* the dial: the watch alone in the middle of the page */
  .wp-plate { position: relative; height: clamp(400px, calc(100vh - var(--v2nav-h, 113px) - 200px), 680px); background: ${TILE}; overflow: hidden; }
  .wp-crumb { position: absolute; z-index: 2; left: ${pageX}; top: clamp(18px, 2.2vw, 30px); display: flex; flex-wrap: wrap; gap: 6px 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }
  .wp-crumb a:hover { color: ${T.text}; }
  .wp-stage { position: absolute; inset: 0; }
  .wp-slide { position: absolute; inset: 0; opacity: 0; pointer-events: none; transition: opacity 0.9s ease; }
  .wp-slide[data-on="1"] { opacity: 1; pointer-events: auto; }
  .wp-slide img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 44px 20px 82px; mix-blend-mode: multiply; cursor: zoom-in; transform: scale(var(--s, 1)); }
  /* the case size, drawn as a measure under the watch (a detail only a watch page has) */
  .wp-measure { position: absolute; left: 50%; bottom: 36px; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; white-space: nowrap; pointer-events: none; }
  .wp-measure i { position: relative; width: clamp(48px, 8vw, 116px); height: 1px; background: ${T.gold}; }
  .wp-measure i::before { content: ""; position: absolute; top: -4px; width: 1px; height: 9px; background: ${T.gold}; }
  .wp-measure i:first-child::before { left: 0; }
  .wp-measure i:last-child::before { right: 0; }
  .wp-index { position: absolute; left: ${pageX}; right: ${pageX}; bottom: 22px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
  .wp-index > div { display: flex; flex-wrap: wrap; gap: 0 clamp(16px, 2.2vw, 30px); }
  .wp-index button { position: relative; padding: 8px 0 10px; cursor: pointer; background: transparent; border: 0; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; font-variant-numeric: tabular-nums; transition: color 0.3s ease; }
  .wp-index button::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: ${T.gold}; transform: scaleX(0); transform-origin: left; transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); }
  .wp-index button:hover, .wp-index button[aria-selected="true"] { color: ${T.text}; }
  .wp-index button[aria-selected="true"]::after, .wp-enlarge:hover::after { transform: scaleX(1); }
  .wp-index .wp-enlarge { cursor: zoom-in; }
  .wp-dots { display: none; }

  /* name, price and facts, centred beneath */
  .wp-buy { max-width: 900px; margin: 0 auto; padding: clamp(34px, 4vw, 56px) ${pageX} clamp(56px, 6vw, 96px); text-align: center; }
  .wp-status { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .wp-status i { width: 6px; height: 6px; border-radius: 50%; background: ${T.gold}; }
  .wp-status i.is-order { background: transparent; border: 1px solid ${T.gold}; }
  .wp-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(34px, 4vw, 56px); line-height: 1.08; margin: 14px 0 0; color: ${T.text}; text-wrap: balance; }
  .wp-h1.is-long { font-size: clamp(28px, 3vw, 42px); line-height: 1.14; }
  .wp-price { margin-top: 14px; font-size: 20px; letter-spacing: 0.04em; line-height: 1.2; color: ${T.text}; font-variant-numeric: tabular-nums lining-nums; }
  .wp-facts { display: grid; grid-template-columns: repeat(var(--cols, 4), minmax(0, 1fr)); gap: 24px; max-width: 820px; margin: clamp(32px, 3.6vw, 48px) auto 0; }
  .wp-facts dt { font-size: 10.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.textMuted}; }
  .wp-facts dd { margin: 9px 0 0; font-family: ${FONT_DISPLAY}; font-size: 19px; line-height: 1.25; color: ${T.text}; }
  .wp-linename { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
  .wp-line { padding-top: 34px; }
  .wp-words { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 2px clamp(18px, 2vw, 28px); margin-top: 8px; }
  .wp-word { position: relative; display: inline-flex; align-items: baseline; gap: 9px; min-height: 40px; padding: 6px 0 8px; cursor: pointer; background: transparent; border: 0; font-family: ${FONT_BODY}; font-size: 15px; color: ${T.textMuted}; transition: color 0.25s ease; }
  .wp-word::after { content: ""; position: absolute; left: 0; right: 0; bottom: 4px; height: 1px; background: ${T.gold}; transform: scaleX(0); transform-origin: left; transition: transform 0.45s cubic-bezier(0.22,1,0.36,1); }
  .wp-word:hover, .wp-word[aria-checked="true"] { color: ${T.text}; }
  .wp-word[aria-checked="true"]::after { transform: scaleX(1); }
  .wp-word small { font-size: 13px; color: ${T.textMuted}; font-variant-numeric: tabular-nums; }
  .wp-engrave { max-width: 560px; margin: 18px auto 0; text-align: left; }
  .wp-engrave input { display: block; width: 100%; height: 54px; padding: 0 16px; background: #FFFFFF; border: 1px solid ${T.ruleStrong}; border-radius: 0; outline: none; color: ${T.text}; font-family: ${FONT_BODY}; font-size: 16px; transition: border-color 0.2s ease; }
  .wp-engrave input:focus { border-color: ${T.text}; }
  .wp-engrave p { display: flex; justify-content: space-between; gap: 16px; margin: 8px 0 0; font-size: 13px; color: ${T.textMuted}; }
  .wp-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 560px; margin: clamp(32px, 3.6vw, 48px) auto 0; }
  .wp-quiet { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px 30px; margin-top: 16px; }
  .wp-note { margin: 18px 0 0; font-size: 13.5px; line-height: 1.6; color: ${T.textMuted}; }
  .wp-accs { max-width: 720px; margin: clamp(44px, 5vw, 68px) auto 0; border-top: 1px solid ${T.line}; text-align: left; }
  .wp-accitem { border-bottom: 1px solid ${T.line}; }
  .wp-acc { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; padding: 19px 0; cursor: pointer; background: transparent; border: 0; text-align: left; font-family: ${FONT_BODY}; font-size: 15px; color: ${T.text}; }
  .wp-plus { position: relative; flex: none; width: 13px; height: 13px; }
  .wp-plus::before, .wp-plus::after { content: ""; position: absolute; left: 0; top: 6px; width: 13px; height: 1px; background: ${T.text}; transition: transform 0.3s ease; }
  .wp-plus::after { transform: rotate(90deg); }
  .wp-acc[aria-expanded="true"] .wp-plus::after { transform: rotate(0deg); }
  .wp-accbody { display: none; padding: 0 0 22px; }
  .wp-accbody.is-open { display: block; }
  .wp-accbody p { margin: 0; max-width: 56ch; font-size: 14.5px; line-height: 1.75; color: ${T.text}; }

  /* about: a catalogue entry */
  @keyframes wpFade { from { opacity: 0; } }
  .wp-story { border-top: 1px solid ${T.line}; padding: clamp(64px, 7vw, 112px) 0; }
  .wp-story-open { max-width: 660px; margin: 0 auto; text-align: center; }
  .wp-story-open p { margin: 26px 0 0; font-size: 18px; line-height: 1.75; color: ${T.text}; }
  .wp-catalogue { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 36px 24px; max-width: 1080px; margin: clamp(48px, 5.4vw, 76px) auto 0; text-align: center; }
  .wp-catalogue dt { font-size: 10.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.textMuted}; }
  .wp-catalogue dd { margin: 10px 0 0; font-family: ${FONT_DISPLAY}; font-size: 18px; line-height: 1.3; color: ${T.text}; overflow-wrap: anywhere; }
  .wp-catmore { margin-top: clamp(40px, 4.6vw, 64px); text-align: center; }
  .wp-catrest { display: none; max-width: 660px; margin: 30px auto 0; text-align: left; }
  .wp-catrest.is-open { display: block; animation: wpFade 0.5s ease; }
  .wp-catrest p { margin: 0 0 16px; font-size: 16px; line-height: 1.8; color: ${T.text}; }
  .wp-catrest p:last-child { margin-bottom: 0; }

  /* with every watch: the page's one sand band */
  .wp-promise { background: ${T.sand}; padding: clamp(64px, 7vw, 112px) 0; text-align: center; }
  .wp-promise-open { max-width: 620px; margin: 0 auto; }
  .wp-promise-open .wp-h2 { margin-top: 18px; }
  .wp-promise-open p { margin: 22px 0 0; font-size: 16px; line-height: 1.8; color: ${T.text}; }
  .wp-promise-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 40px clamp(20px, 3vw, 48px); max-width: 1120px; margin: clamp(48px, 5.4vw, 80px) auto 0; }
  .wp-promise-grid svg { display: block; margin: 0 auto; }
  .wp-promise-grid b { display: block; margin: 18px 0 8px; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 20px; line-height: 1.25; color: ${T.text}; }
  .wp-promise-grid p { margin: 0 auto; max-width: 26ch; font-size: 14.5px; line-height: 1.65; color: ${T.text}; }
  .wp-promise-acts { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 14px 34px; margin-top: clamp(40px, 4.4vw, 60px); }

  /* more from the house */
  .wp-recs { padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(64px, 7vw, 112px); text-align: center; }
  .wp-recgrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(28px, 3vw, 44px) clamp(12px, 1.6vw, 24px); margin-top: clamp(30px, 3.4vw, 48px); text-align: left; }
  .wp-rec > div { position: relative; aspect-ratio: 1 / 1.1; background: ${TILE}; overflow: hidden; }
  .wp-rec img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; padding: 11%; mix-blend-mode: multiply; transform: scale(var(--s, 1)); transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
  .wp-rec:hover img { transform: scale(calc(var(--s, 1) * 1.035)); }
  .wp-rec p { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; margin: 14px 0 0; font-size: 14.5px; line-height: 1.45; color: ${T.text}; }
  .wp-rec p span:last-child { flex: none; }

  /* enlarged view */
  .wp-lb { position: fixed; inset: 0; z-index: 300; display: flex; flex-direction: column; background: ${TILE}; animation: wpFade 0.3s ease; }
  .wp-lb-x { position: absolute; top: 14px; right: 14px; z-index: 2; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; border: 0; color: ${T.text}; }
  .wp-lb-stage { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 16px; }
  .wp-lb-stage img { max-width: 100%; max-height: 100%; object-fit: contain; mix-blend-mode: multiply; cursor: zoom-in; transition: transform 0.35s cubic-bezier(0.22,1,0.36,1); }
  .wp-lb-stage img[data-zoom="1"] { cursor: zoom-out; }
  .wp-lb-nav { display: flex; align-items: center; justify-content: center; gap: 26px; padding: 12px 16px calc(18px + env(safe-area-inset-bottom)); font-size: 12.5px; letter-spacing: 0.1em; font-variant-numeric: tabular-nums; }
  .wp-lb-nav button { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: transparent; border: 1px solid ${T.line}; color: ${T.text}; transition: border-color 0.2s ease; }
  .wp-lb-nav button:hover { border-color: ${T.text}; }

  .wp-bar { display: none; }
  @media (max-width: 1000px) { .wp-catalogue { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  @media (max-width: 900px) {
    /* phone: the plate becomes a square that swipes sideways through the views */
    .wp-plate { height: auto; aspect-ratio: 1; }
    .wp-stage { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .wp-stage::-webkit-scrollbar { display: none; }
    .wp-slide { position: relative; inset: auto; flex: 0 0 100%; scroll-snap-align: center; opacity: 1; pointer-events: auto; transition: none; }
    .wp-slide img { padding: 44px 12% 64px; }
    .wp-measure { bottom: 34px; }
    .wp-index { left: auto; right: 8px; bottom: 6px; }
    .wp-index > div { display: none; }
    .wp-index .wp-enlarge { font-size: 10.5px; padding: 12px 10px; }
    .wp-dots { display: flex; justify-content: center; gap: 6px; position: absolute; left: 0; right: 0; bottom: 14px; pointer-events: none; }
    .wp-dots span { width: 18px; height: 2px; background: ${T.ruleStrong}; transition: background 0.2s ease; }
    .wp-dots span[data-on="1"] { background: ${T.gold}; }
    .wp-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 14px; }
    .wp-actions { grid-template-columns: 1fr; }
    .wp-add { display: none; }
    .wp { padding-bottom: 86px; }
    .wp-bar { display: flex; align-items: center; gap: 16px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 55; padding: 12px ${pageX} calc(12px + env(safe-area-inset-bottom)); background: rgba(255,254,253,0.96); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid ${T.line}; }
    .wp-bar b { display: block; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 22px; line-height: 1; }
    .wp-bar small { display: block; margin-top: 4px; font-size: 12px; color: ${T.textMuted}; }
    .wp-bar .wp-btn { width: auto; padding: 16px 22px; margin-left: auto; }
    .wp-promise-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 16px; }
    .wp-recgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 12px; }
    .wp-rec p { display: block; font-size: 14px; }
    .wp-rec p span:last-child { display: block; margin-top: 4px; }
  }
  @media (max-width: 560px) { .wp-catalogue { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 14px; } .wp-catalogue dd { font-size: 16.5px; } }
  @media (prefers-reduced-motion: reduce) { .wp-slide, .wp-lb, .wp-lb-stage img, .wp-catrest.is-open { transition: none; animation: none; } }
`;

const WatchDetailV2 = (): JSX.Element => {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [watch, setWatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<any[]>([]);
  const [straps, setStraps] = useState<Strap[]>([]);

  const [viewIdx, setViewIdx] = useState(0);
  const [strapId, setStrapId] = useState<string | null>(null);
  const [engrave, setEngrave] = useState(false);
  const [engraveText, setEngraveText] = useState("");
  const [panel, setPanel] = useState<string | null>(null);
  const [fullStory, setFullStory] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [productId]);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/watches/${productId}`).then((r) => r.json()).then((d) => {
      const w = d?.data?.watch || d?.data || null;
      setWatch(w); setLoading(false); setViewIdx(0); setStrapId(null); setEngrave(false); setEngraveText(""); setFullStory(false);
      if (w?.id) {
        fetch(`${API_BASE_URL}/watches/${w.id}/straps`).then((r) => r.json()).then((sd) => setStraps(sd?.data || sd?.straps || [])).catch(() => {});
      }
      if (w?.brand?.slug || w?.brand?.name) {
        // Server-side brand filter + tiny limit, instead of pulling 24 full records to
        // keep 4 — much less to download and parse on this secondary request.
        const q = w.brand?.slug ? `brand=${encodeURIComponent(w.brand.slug)}&limit=5` : `limit=24`;
        fetch(`${API_BASE_URL}/watches?${q}`).then((r) => r.json()).then((rd) => {
          const list: any[] = rd?.data?.watches || rd?.data || [];
          setRelated(list.filter((x) => x.id !== w.id && (!x.brand?.name || x.brand.name === w.brand.name)).slice(0, 4));
        }).catch(() => {});
      }
    }).catch(() => setLoading(false));
  }, [productId]);

  // Enlarged view: hold the page still, and listen for Escape and the arrow keys.
  const imageCount = (watch?.images || []).length;
  useEffect(() => {
    if (lightbox == null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightbox(null); setZoomed(false); }
      if (e.key === "ArrowRight" && imageCount) { setLightbox((i) => ((i ?? 0) + 1) % imageCount); setZoomed(false); }
      if (e.key === "ArrowLeft" && imageCount) { setLightbox((i) => ((i ?? 0) - 1 + imageCount) % imageCount); setZoomed(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [lightbox, imageCount]);

  const images: any[] = (watch?.images || []).slice(0, 8);
  const imgUrl = (im: any) => im?.image_url || im?.url;
  const heroImg = imgUrl(images[viewIdx]) || imgUrl(images[0]) || watch?.image?.url;
  const views: string[] = images.length ? images.map(imgUrl).filter(Boolean) : (watch?.image?.url ? [watch.image.url] : []);

  const sp = watch?.specifications || {};
  const basePrice = Number(watch?.sale_price ?? watch?.base_price) || 0;
  const selStrap = straps.find((s) => s.id === strapId) || null;
  const total = basePrice + (selStrap?.price_gbp ? Number(selStrap.price_gbp) : 0);

  const specRows = useMemo(() => {
    const dia = sp.case_diameter && `${Math.round(parseFloat(sp.case_diameter))}mm`;
    const rows: [string, string | undefined | null][] = [
      ["Reference", watch?.model_number || watch?.sku],
      ["Movement", cap(clean(sp.movement)) || cap(clean(sp.movement_type))],
      ["Case material", cap(clean(sp.case_material))],
      ["Case diameter", dia],
      ["Case thickness", sp.case_thickness && `${sp.case_thickness}mm`],
      ["Crystal", cap(clean(sp.crystal_material)) || cap(clean(sp.glass_type))],
      ["Water resistance", clean(sp.water_resistance)],
      ["Dial", cap(clean(sp.dial_color)) || cap(clean(sp.dial))],
      ["Strap", [cap(clean(sp.strap_material)), cap(clean(sp.strap_color))].filter(Boolean).join(", ") || undefined],
      ["Lug width", sp.lug_width && `${sp.lug_width}mm`],
      ["Functions", cap(clean(sp.complications)) || cap(clean(sp.functions))],
      ["Power reserve", clean(sp.power_reserve)],
      ["Gender", cap(watch?.gender)],
      ["Warranty", watch?.warranty_years ? `${watch.warranty_years} year${watch.warranty_years > 1 ? "s" : ""}, manufacturer` : undefined],
    ];
    return rows.filter(([, v]) => v && String(v).trim()) as [string, string][];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  // The three facts beside the price: movement, case, water resistance (real values only;
  // the movement falls back to what the name and description say).
  const facts = useMemo(() => {
    if (!watch) return [] as [string, string][];
    const dia = sp.case_diameter && !isNaN(parseFloat(sp.case_diameter)) ? `${Math.round(parseFloat(sp.case_diameter))}mm` : "";
    const move = cap(clean(sp.movement_type)) || inferMovement(`${watch.name || ""} ${watch.description || ""}`, sp.movement);
    const warranty = watch.warranty_years ? `${watch.warranty_years} year${watch.warranty_years > 1 ? "s" : ""}` : "";
    return ([["Movement", move], ["Case", dia], ["Water resistance", clean(sp.water_resistance) || ""], ["Warranty", warranty]] as [string, string][]).filter(([, v]) => v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  // Description: a short opening on show, the rest behind one link.
  const storyParts = useMemo(() => {
    const paras = String(watch?.description || watch?.short_description || "").split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
    if (!paras.length) return { lead: "", rest: [] as string[] };
    let lead = paras[0]; const rest = paras.slice(1);
    if (lead.length > 380) {
      const sentences = lead.match(/[^.!?]+[.!?]+(\s|$)/g) || [lead];
      lead = sentences.slice(0, 2).join("").trim();
      const tail = sentences.slice(2).join("").trim();
      if (tail) rest.unshift(tail);
    }
    return { lead, rest };
  }, [watch]);

  const addBag = () => {
    if (!watch) return;
    const opts: any = { brand: watch.brand?.name };
    if (selStrap) opts.strap = `${selStrap.name}${selStrap.price_gbp ? ` (+${money(Number(selStrap.price_gbp))})` : ""}`;
    if (engrave && engraveText.trim()) opts.engraving = engraveText.trim();
    addToCart({ id: watch.id, name: watch.name, price: money(total), image: heroImg ? getMediaUrl(heroImg) : "", brand: watch.brand?.name, type: "watch", productUrl: window.location.pathname, selectedOptions: opts });
  };

  // Index click fades to that view (laptop) and moves the swipe strip to it (phone).
  const showView = (i: number) => { setViewIdx(i); const el = stageRef.current; if (el && el.scrollWidth > el.clientWidth + 4) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" }); };
  const onStageScroll = () => { const el = stageRef.current; if (!el || el.scrollWidth <= el.clientWidth + 4) return; setViewIdx(Math.round(el.scrollLeft / el.clientWidth)); };

  const shell = (children: React.ReactNode) => (
    <div className="wp">
      <style>{WP_CSS}</style>
      <NavigationV2 solid />
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "clamp(72px, 14vh, 160px) 24px clamp(88px, 14vw, 180px)", textAlign: "center" }}>{children}</div>
      <FooterV2 />
    </div>
  );
  if (loading) return shell(<p style={{ margin: 0, fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>Loading the watch</p>);
  if (!watch) return shell(<><h1 className="wp-h2">We couldn’t find that watch.</h1><div style={{ marginTop: 28 }}><Link to="/watches" className="wp-link">Back to watches</Link></div></>);

  const brandName: string = watch.brand?.name || "";
  const ref = watch.model_number || watch.sku;
  const display = ((brandName === "Roamer" && roamerName(watch.name || "")) || cleanWatchName(watch.name, brandName, ref, 80)).replace(/\s+-\s+/g, ", ");
  const ph = PHOTO[brandName] || { scale: 1 };
  const photo = { ["--s" as string]: ph.scale, filter: ph.filter } as React.CSSProperties;
  // On the tall plate Briston's full-length photographs already fill the frame; only Roamer's small ones need enlarging.
  const platePhoto = { ["--s" as string]: brandName === "Briston" ? 1 : ph.scale, filter: ph.filter } as React.CSSProperties;
  const inStock = watch.in_stock !== false;
  const saved = isFavorite(watch.id);
  const lbUrl = lightbox != null ? views[lightbox] : undefined;
  const caseDia = parseFloat(sp.case_diameter);
  const caseMm = !isNaN(caseDia) && caseDia >= 20 && caseDia <= 50 ? Math.round(caseDia) : 0;

  return (
    <div className="wp">
      <style>{WP_CSS}</style>
      <NavigationV2 solid />

      {/* The dial. Unlike the jewellery page (picture left, choices right) the watch stands
          alone in the middle of the page, face on, with a fine gold line under it giving the
          case size. Name, price and the facts are centred beneath, like a catalogue plate. */}
      <main>
        <div className="wp-plate">
          <nav className="wp-crumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link><span>/</span><Link to="/watches">Watches</Link>
            {brandName && <><span>/</span><Link to={`/${watch.brand?.slug || brandName.toLowerCase()}`}>{brandName}</Link></>}
          </nav>
          <div className="wp-stage" ref={stageRef} onScroll={onStageScroll}>
            {views.map((u, i) => (
              <div key={i} className="wp-slide" data-on={i === Math.min(viewIdx, views.length - 1) ? "1" : "0"}>
                <img src={getMediaUrl(u)} alt={`${brandName} ${display}${views.length > 1 ? `, view ${i + 1}` : ""}`} style={platePhoto} decoding="async" loading={i === 0 ? undefined : "lazy"} onClick={() => { setLightbox(i); setZoomed(false); }} />
              </div>
            ))}
          </div>
          {caseMm && viewIdx === 0 && <div className="wp-measure" data-measure aria-hidden="true"><i />{caseMm} mm<i /></div>}
          {views.length > 0 && (
            <div className="wp-index">
              <div role="tablist" aria-label="Views">
                {views.length > 1 && views.map((_, i) => (
                  <button key={i} type="button" role="tab" data-view={i} aria-selected={i === viewIdx} aria-label={`View ${i + 1} of ${views.length}`} onClick={() => showView(i)}>{String(i + 1).padStart(2, "0")}</button>
                ))}
              </div>
              <button type="button" className="wp-enlarge" data-enlarge onClick={() => { setLightbox(Math.min(viewIdx, views.length - 1)); setZoomed(false); }}>Enlarge</button>
            </div>
          )}
          {views.length > 1 && <div className="wp-dots" aria-hidden="true">{views.map((_, i) => <span key={i} data-on={i === viewIdx ? "1" : "0"} />)}</div>}
        </div>

        <div className="wp-buy">
          <div className="wp-status"><i className={inStock ? "" : "is-order"} />{brandName}{brandName ? " · " : ""}{inStock ? "In stock" : "To order"}</div>
          <h1 className={`wp-h1${display.length > 34 ? " is-long" : ""}`}>{display}</h1>
          <div className="wp-price" data-total>{money(total)}</div>

          {facts.length > 0 && (
            <dl className="wp-facts" style={{ ["--cols" as string]: facts.length }}>
              {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          )}

          {/* Strap add-ons (real accessories, real prices) */}
          {straps.length > 0 && (
            <section className="wp-line">
              <div className="wp-linename">Strap: {selStrap ? (selStrap.name || [cap(selStrap.strap_type), selStrap.color].filter(Boolean).join(" ")) : "As supplied"}</div>
              <div className="wp-words" role="radiogroup" aria-label="Strap">
                <button type="button" role="radio" aria-checked={strapId === null} data-radio="strap" className="wp-word" onClick={() => setStrapId(null)}>As supplied</button>
                {straps.map((s) => (
                  <button key={s.id} type="button" role="radio" aria-checked={strapId === s.id} data-radio="strap" className="wp-word" onClick={() => setStrapId(s.id)}>
                    {s.name || [cap(s.strap_type), s.color].filter(Boolean).join(" ")}{s.price_gbp ? <small>+ {money(Number(s.price_gbp))}</small> : null}
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className="wp-actions">
            <button type="button" onClick={addBag} className="wp-btn wp-add" data-addbag>Add to bag</button>
            <Link to="/book-appointment" className="wp-btn2">Reserve to view</Link>
          </div>
          <p className="wp-note">
            {inStock ? "In stock, posted within 48 hours." : "To order. We will confirm the lead time with you."} Free insured UK delivery.
          </p>
          <div className="wp-quiet">
            <button type="button" className="wp-link" data-engravebtn aria-expanded={engrave} onClick={() => setEngrave((v) => !v)}>{engrave ? "Leave the caseback plain" : "Add an engraving"}</button>
            <button type="button" className="wp-link" aria-pressed={saved} data-savebtn onClick={() => toggleFavorite(watch.id, watch.name, heroImg ? getMediaUrl(heroImg) : "", window.location.pathname)}>{saved ? "Saved" : "Save"}</button>
          </div>
          {engrave && (
            <div className="wp-engrave">
              <input type="text" aria-label="Engraving on the caseback" value={engraveText} onChange={(e) => setEngraveText(e.target.value.slice(0, 30))} maxLength={30} placeholder="Up to 30 characters" />
              <p><span>Hand-engraved here. We confirm any charge before cutting.</span><span>{engraveText.length} / 30</span></p>
            </div>
          )}

          <div className="wp-accs">
            {PANELS.map((p) => {
              const on = panel === p.id;
              return (
                <div key={p.id} className="wp-accitem">
                  <button type="button" className="wp-acc" data-faq aria-expanded={on} onClick={() => setPanel(on ? null : p.id)}><span>{p.title}</span><span className="wp-plus" aria-hidden="true" /></button>
                  <div className={`wp-accbody${on ? " is-open" : ""}`}><p>{p.body}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* About this watch: an opening, then the specification as a grid of facts */}
      {(storyParts.lead || specRows.length > 0) && (
        <section className="wp-story">
          <div className="wp-wrap">
            <div className="wp-story-open">
              <div className="wp-eyebrow">About this watch</div>
              {storyParts.lead && <p>{storyParts.lead}</p>}
            </div>
            {specRows.length > 0 && (
              <dl className="wp-catalogue">
                {specRows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
            )}
            {storyParts.rest.length > 0 && (
              <div className="wp-catmore">
                <button type="button" className="wp-link" data-catmore aria-expanded={fullStory} onClick={() => setFullStory((v) => !v)}>{fullStory ? "Show less" : "Read the full description"}</button>
                <div className={`wp-catrest${fullStory ? " is-open" : ""}`}>{storyParts.rest.map((t, i) => <p key={i}>{t}</p>)}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* With every watch: the page's one sand band */}
      <section className="wp-promise">
        <div className="wp-wrap">
          <div className="wp-promise-open">
            <div className="wp-eyebrow">With every watch</div>
            <h2 className="wp-h2">Looked after on the premises.</h2>
            <p>Watch servicing and battery replacement carried out on the premises. Bring it in, or ask us in the showroom or by telephone.</p>
          </div>
          <div className="wp-promise-grid">
            {ASSURANCES.map(([t, d, icon]) => (
              <div key={t}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={T.gold} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">{icon}</svg>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <div className="wp-promise-acts">
            <Link to="/book-appointment" className="wp-link">Try it on in the showroom</Link>
            <a href="tel:01159257552" className="wp-link">Order by phone</a>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="wp-wrap wp-recs">
          <h2 className="wp-h2">More from {brandName}</h2>
          <div className="wp-recgrid">
            {related.map((r) => {
              const rName = ((brandName === "Roamer" && roamerName(r.name || "")) || cleanWatchName(r.name, brandName, r.model_number || r.sku, 60)).replace(/\s+-\s+/g, ", ");
              return (
                <Link key={r.id} to={`/watches/${r.slug}`} className="wp-rec">
                  <div>{(r.image?.url || r.images?.[0]?.url) && <img src={getMediaUrl(r.image?.url || r.images?.[0]?.url)} alt={`${brandName} ${rName}`} style={photo} loading="lazy" />}</div>
                  <p><span>{rName}</span><span>{money(Number(r.base_price))}</span></p>
                </Link>
              );
            })}
          </div>
          <div style={{ marginTop: "clamp(36px, 4vw, 56px)" }}><Link to="/watches" className="wp-link">All watches</Link></div>
        </section>
      )}

      <FooterV2 />

      {/* Phone: the price and Add to bag stay at the bottom of the screen */}
      <div className="wp-bar">
        <div><b data-total>{money(total)}</b><small>{inStock ? "In stock" : "To order"}</small></div>
        <button type="button" onClick={addBag} className="wp-btn" data-addbag>Add to bag</button>
      </div>

      {lightbox != null && lbUrl && (
        <div className="wp-lb" role="dialog" aria-modal="true" aria-label={`${display}, enlarged view`}>
          <button type="button" className="wp-lb-x" aria-label="Close" onClick={() => { setLightbox(null); setZoomed(false); }}><svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" /></svg></button>
          <div className="wp-lb-stage" onClick={(e) => { if (e.target === e.currentTarget) { setLightbox(null); setZoomed(false); } }}>
            <img src={getMediaUrl(lbUrl)} alt={display} data-zoom={zoomed ? "1" : "0"} style={{ transform: `scale(${zoomed ? 2.2 : 1})`, filter: ph.filter }}
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; setZoomed((z) => !z); }}
              onMouseMove={(e) => { if (!zoomed) return; const r = e.currentTarget.parentElement!.getBoundingClientRect(); e.currentTarget.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`; }} />
          </div>
          {views.length > 1 && (
            <div className="wp-lb-nav">
              <button type="button" aria-label="Previous view" onClick={() => { setLightbox((lightbox - 1 + views.length) % views.length); setZoomed(false); }}><svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true"><path d="M8 1L1 8l7 7" stroke="currentColor" /></svg></button>
              <span>{lightbox + 1} / {views.length}</span>
              <button type="button" aria-label="Next view" onClick={() => { setLightbox((lightbox + 1) % views.length); setZoomed(false); }}><svg width="9" height="16" viewBox="0 0 9 16" fill="none" aria-hidden="true"><path d="M1 1l7 7-7 7" stroke="currentColor" /></svg></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchDetailV2;
