import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search as SearchIcon, User as UserIcon, Heart as HeartIcon, ShoppingBag as BagIcon } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { useIsMobile } from "../../hooks/use-mobile";
import { useAfterLoad } from "../../hooks/use-after-load";
// The drawers and panels open on a click, so their code loads after the page, not with it.
const CartSlide = lazy(() => import("../CartSlide"));
const SavedDrawerV2 = lazy(() => import("./SavedDrawerV2"));
const SearchOverlayV2 = lazy(() => import("./SearchOverlayV2"));
const AuthModal = lazy(() => import("../AuthModalV2"));
import TrustBarV2 from "./TrustBarV2";
import API_BASE_URL from "../../config/api";
import { T, FONT_DISPLAY, FONT_LOGO, FONT_BODY } from "./tokens";

/**
 * NavigationV2 — the homepage v2 header.
 * The VISUAL design comes from design_handoff_mcculloch_homepage (announcement bar,
 * Italiana wordmark, hairline mega menu, transparent-over-hero → solid on scroll).
 * The LINK DESTINATIONS and the mega-menu data are the site's real routes/APIs —
 * they are deliberately unchanged from the previous navigation.
 */

interface NavItem { id: string; name: string; slug?: string }
interface NavigationData {
  ring_types: NavItem[];
  gemstones: NavItem[];
  metals: NavItem[];
  eternity_rings: NavItem[];
}
interface WatchCollection { id: string; name: string; slug: string }
interface WatchBrand { id: string; name: string; slug: string; collections: WatchCollection[] }

interface Column {
  title: string;
  titleTo?: string;
  links: { label: string; to: string }[];
  shopAll?: { label: string; to: string };
}
interface MenuContent {
  columns: Column[];
  feature: { title: string; to: string; img: string };
}


// ── Menu icons: fine line drawings in the site's ink, with gem and metal colours kept muted ──────────
const INK = "#332F2A";
const PAGE = "#FFFEFD";
type Stone = { x: number; r: number };
const ringIcon = (kind: string): JSX.Element => {
  // A ring seen from above: the band as a line, the setting drawn over it.
  const band = <path d="M1 8H31" stroke={INK} strokeWidth="1" strokeLinecap="round" />;
  const stone = (st: Stone, i: number, table = true) => (
    <g key={i}>
      <circle cx={st.x} cy="8" r={st.r} fill={PAGE} stroke={INK} strokeWidth="0.9" />
      {table && st.r > 2.4 && <circle cx={st.x} cy="8" r={st.r * 0.5} fill="none" stroke={INK} strokeWidth="0.5" opacity="0.7" />}
      {table && st.r > 3 && [0, 45, 90, 135].map(a => {
        const c = Math.cos((a * Math.PI) / 180), sn = Math.sin((a * Math.PI) / 180);
        return <path key={a} d={`M${st.x + c * st.r * 0.5} ${8 + sn * st.r * 0.5}L${st.x + c * st.r} ${8 + sn * st.r}M${st.x - c * st.r * 0.5} ${8 - sn * st.r * 0.5}L${st.x - c * st.r} ${8 - sn * st.r}`} stroke={INK} strokeWidth="0.45" opacity="0.6" />;
      })}
    </g>
  );
  const k = kind.toLowerCase();
  let body: JSX.Element;
  if (k.includes("shoulder")) body = <>{[{ x: 5.6, r: 1.2 }, { x: 9.2, r: 1.6 }, { x: 22.8, r: 1.6 }, { x: 26.4, r: 1.2 }].map((st, i) => stone(st, i, false))}{stone({ x: 16, r: 4 }, 9)}</>;
  else if (k.includes("hidden")) body = <>{stone({ x: 16, r: 4.4 }, 0, false)}<circle cx="16" cy="8" r="2.6" fill="none" stroke={INK} strokeWidth="0.6" strokeDasharray="1 1.1" /></>;
  else if (k.includes("halo")) body = <><circle cx="16" cy="8" r="5.8" fill={PAGE} stroke={INK} strokeWidth="0.9" />{Array.from({ length: 12 }).map((_, i) => { const a = (i * 30 * Math.PI) / 180; return <circle key={i} cx={16 + Math.cos(a) * 4.7} cy={8 + Math.sin(a) * 4.7} r="0.55" fill={INK} opacity="0.75" />; })}{stone({ x: 16, r: 3.3 }, 20)}</>;
  else if (k.includes("trilogy")) body = <>{stone({ x: 9.4, r: 2.7 }, 0)}{stone({ x: 22.6, r: 2.7 }, 1)}{stone({ x: 16, r: 4 }, 2)}</>;
  else if (k.includes("bezel")) body = <><circle cx="16" cy="8" r="4.7" fill={PAGE} stroke={INK} strokeWidth="2" /><circle cx="16" cy="8" r="2.1" fill="none" stroke={INK} strokeWidth="0.5" opacity="0.7" /></>;
  else if (k.includes("2 stone") || k.includes("two")) body = <>{stone({ x: 12.4, r: 3.5 }, 0)}{stone({ x: 19.6, r: 3.5 }, 1)}</>;
  else if (k.includes("vintage")) body = <><path d="M9 8Q16 0.6 23 8Q16 15.4 9 8Z" fill={PAGE} stroke={INK} strokeWidth="0.9" /><path d="M12.4 8Q16 4 19.6 8Q16 12 12.4 8Z" fill="none" stroke={INK} strokeWidth="0.5" opacity="0.7" /><circle cx="6.4" cy="8" r="1.1" fill={PAGE} stroke={INK} strokeWidth="0.7" /><circle cx="25.6" cy="8" r="1.1" fill={PAGE} stroke={INK} strokeWidth="0.7" /></>;
  else if (k.includes("cluster")) body = <>{Array.from({ length: 6 }).map((_, i) => { const a = (i * 60 * Math.PI) / 180; return <circle key={i} cx={16 + Math.cos(a) * 3.9} cy={8 + Math.sin(a) * 3.9} r="2" fill={PAGE} stroke={INK} strokeWidth="0.8" />; })}<circle cx="16" cy="8" r="2.2" fill={PAGE} stroke={INK} strokeWidth="0.9" /></>;
  else body = stone({ x: 16, r: 4.4 }, 0);
  return <svg viewBox="0 0 32 16" width="42" height="21" aria-hidden="true" style={{ flex: "none", display: "block" }}>{band}{body}</svg>;
};
// Gem colours: [name contains, body colour, is it a dark stone?]
const GEM_FILL: [string, string, boolean][] = [
  ["yellow", "#E9C84F", false], ["black", "#26262A", true], ["sapphire", "#2647A6", true], ["ruby", "#B01E3A", true],
  ["emerald", "#178A5A", true], ["aquamarine", "#8FD0DA", false], ["diamond", "#E9EDF1", false],
];
const mix = (hex: string, to: number, amt: number) => {
  const n = parseInt(hex.slice(1), 16); const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v + (to - v) * amt));
  return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
};
// A round brilliant seen from above: table, eight bezel facets and sixteen girdle facets, shaded so it catches light.
const gemIcon = (name: string): JSX.Element => {
  const hit = GEM_FILL.find(g => name.toLowerCase().includes(g[0])) || GEM_FILL[GEM_FILL.length - 1];
  const [key, base, dark] = hit;
  const id = `v2gem-${key}`;
  const P = (deg: number, r: number) => `${(12 + Math.cos((deg * Math.PI) / 180) * r).toFixed(2)} ${(12 + Math.sin((deg * Math.PI) / 180) * r).toFixed(2)}`;
  const facets: JSX.Element[] = [];
  for (let i = 0; i < 8; i++) {
    const t0 = 22.5 + 45 * i, t1 = t0 + 45, gPrev = 45 * i, gMid = 45 * i + 45;
    // light falls from the upper left, so facets facing that way are brighter
    const lit = Math.cos(((t0 + 22.5 + 135) * Math.PI) / 180);
    facets.push(<path key={`b${i}`} d={`M${P(t0, 5.2)}L${P(t1, 5.2)}L${P(gMid, 11)}Z`} fill="#fff" opacity={(dark ? 0.1 : 0.2) + Math.max(0, -lit) * (dark ? 0.32 : 0.5)} />);
    facets.push(<path key={`l${i}`} d={`M${P(t0, 5.2)}L${P(gPrev, 11)}L${P(t0, 11)}Z`} fill="#000" opacity={0.05 + Math.max(0, lit) * (dark ? 0.3 : 0.2)} />);
    facets.push(<path key={`r${i}`} d={`M${P(t0, 5.2)}L${P(t0, 11)}L${P(gMid, 11)}Z`} fill="#fff" opacity={0.04 + Math.max(0, -lit) * (dark ? 0.2 : 0.34)} />);
  }
  const table = Array.from({ length: 8 }).map((_, i) => P(22.5 + 45 * i, 5.2)).join("L");
  const lines = Array.from({ length: 8 }).map((_, i) => `M${P(22.5 + 45 * i, 5.2)}L${P(45 * i, 11)}M${P(22.5 + 45 * i, 5.2)}L${P(45 * i + 45, 11)}M${P(22.5 + 45 * i, 5.2)}L${P(22.5 + 45 * i, 11)}`).join("");
  const edge = dark ? "rgba(255,255,255,0.42)" : "rgba(40,50,60,0.34)";
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style={{ flex: "none", display: "block" }}>
      <defs>
        <radialGradient id={id} cx="38%" cy="34%" r="75%">
          <stop offset="0" stopColor={mix(base, 255, dark ? 0.32 : 0.6)} />
          <stop offset="0.55" stopColor={base} />
          <stop offset="1" stopColor={mix(base, 0, dark ? 0.45 : 0.28)} />
        </radialGradient>
        <clipPath id={`${id}-c`}><circle cx="12" cy="12" r="11" /></clipPath>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#${id})`} />
      <g clipPath={`url(#${id}-c)`}>
        {facets}
        <path d={`M${table}Z`} fill="#fff" opacity={dark ? 0.12 : 0.3} />
        <path d={`M${P(202.5, 5.2)}L${P(247.5, 5.2)}L${P(292.5, 5.2)}L12 12Z`} fill="#fff" opacity={dark ? 0.2 : 0.45} />
        <path d={lines} stroke={edge} strokeWidth="0.35" fill="none" />
        <path d={`M${table}Z`} stroke={edge} strokeWidth="0.45" fill="none" />
      </g>
      <circle cx="12" cy="12" r="11" fill="none" stroke={dark ? mix(base, 0, 0.5) : "rgba(40,50,60,0.42)"} strokeWidth="0.6" />
      <path d="M6.2 5.2l0.5 1.3 1.3 0.5-1.3 0.5-0.5 1.3-0.5-1.3-1.3-0.5 1.3-0.5z" fill="#fff" opacity="0.95" />
    </svg>
  );
};
// A polished metal bead: a bevelled rim and a domed centre, each with its own sheen.
const metalIcon = (name: string): JSX.Element => {
  const k = name.toLowerCase();
  const [key, base] = k.includes("rose") || k.includes("red") ? ["rose", "#D99C86"] : k.includes("yellow") ? ["yellow", "#DDB552"] : k.includes("platinum") ? ["platinum", "#C9CCD0"] : ["white", "#D6D5D1"];
  const id = `v2metal-${key}`;
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style={{ flex: "none", display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mix(base, 255, 0.72)} /><stop offset="0.3" stopColor={base} /><stop offset="0.52" stopColor={mix(base, 0, 0.3)} />
          <stop offset="0.72" stopColor={base} /><stop offset="1" stopColor={mix(base, 255, 0.5)} />
        </linearGradient>
        <linearGradient id={`${id}-i`} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={mix(base, 255, 0.55)} /><stop offset="0.45" stopColor={base} /><stop offset="1" stopColor={mix(base, 0, 0.22)} />
        </linearGradient>
        <radialGradient id={`${id}-h`} cx="34%" cy="30%" r="42%"><stop offset="0" stopColor="#fff" stopOpacity="0.95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10.6" fill={`url(#${id})`} stroke={mix(base, 0, 0.38)} strokeWidth="0.5" />
      <circle cx="12" cy="12" r="7.6" fill={`url(#${id}-i)`} stroke={mix(base, 0, 0.22)} strokeWidth="0.35" />
      <circle cx="12" cy="12" r="7.6" fill={`url(#${id}-h)`} />
      <path d="M5.6 15.8A8 8 0 0 0 16.4 18.4" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.7" strokeLinecap="round" />
    </svg>
  );
};
// A wedding band seen from above, drawn in the same line as the engagement ring icons.
const bandIcon = (kind: string): JSX.Element => {
  const k = kind.toLowerCase();
  const strip = <rect x="1" y="4.5" width="30" height="7" rx="1.2" fill={PAGE} stroke={INK} strokeWidth="0.9" />;
  let body: JSX.Element;
  if (k.includes("diamond cut")) body = <>{strip}{[7, 10, 13, 16, 19, 22].map(x => <path key={x} d={`M${x} 11.5L${x + 3} 4.5`} stroke={INK} strokeWidth="0.55" opacity="0.75" />)}</>;
  else if (k.includes("diamond set")) body = <>{strip}{[8, 12, 16, 20, 24].map(x => <g key={x}><circle cx={x} cy="8" r="1.75" fill={PAGE} stroke={INK} strokeWidth="0.7" /><circle cx={x} cy="8" r="0.7" fill="none" stroke={INK} strokeWidth="0.4" opacity="0.7" /></g>)}</>;
  else if (k.includes("two")) body = <>{strip}<rect x="1.5" y="6.7" width="29" height="2.6" fill="#DDB552" opacity="0.6" /><path d="M1.5 6.7H30.5M1.5 9.3H30.5" stroke={INK} strokeWidth="0.5" opacity="0.7" /></>;
  else if (k.includes("shaped")) body = <path d="M1 3.2Q9 3.2 16 8Q23 3.2 31 3.2V8.4Q23 8.4 16 13.2Q9 8.4 1 8.4Z" fill={PAGE} stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />;
  else body = <>{strip}<path d="M3.5 6.4H28.5" stroke={INK} strokeWidth="0.5" opacity="0.4" /></>;
  return <svg viewBox="0 0 32 16" width="42" height="21" aria-hidden="true" style={{ flex: "none", display: "block" }}>{body}</svg>;
};
// The band cut through: the outside of the ring is the top edge, the finger side is the bottom edge.
const PROFILE_PATH: [string, string][] = [
  ["traditional", "M7 8.6Q16 0.4 25 8.6Q16 12.6 7 8.6Z"],
  ["soft", "M7 8Q7 5.2 10 4.9Q16 3.9 22 4.9Q25 5.2 25 8Q25 10.5 22 10.8Q16 11.7 10 10.8Q7 10.5 7 8Z"],
  ["flat court", "M7.6 4.6H24.4Q25 4.6 25 5.2V8.6Q16 12.6 7 8.6V5.2Q7 4.6 7.6 4.6Z"],
  ["flat", "M7.6 4.8H24.4Q25 4.8 25 5.4V10.6Q25 11.2 24.4 11.2H7.6Q7 11.2 7 10.6V5.4Q7 4.8 7.6 4.8Z"],
  ["d-shape", "M7 11.2Q7 3.4 16 3.4Q25 3.4 25 11.2Z"],
  ["concave", "M7 4.4Q16 8.2 25 4.4V10.6Q25 11.2 24.4 11.2H7.6Q7 11.2 7 10.6Z"],
];
const profileIcon = (name: string): JSX.Element => {
  const d = (PROFILE_PATH.find(([key]) => name.toLowerCase().includes(key)) || PROFILE_PATH[0])[1];
  return (
    <svg viewBox="0 0 32 16" width="42" height="21" aria-hidden="true" style={{ flex: "none", display: "block" }}>
      <path d="M2 13.6H30" stroke={INK} strokeWidth="0.5" strokeDasharray="1 1.4" opacity="0.45" />
      <path d={d} fill={PAGE} stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
    </svg>
  );
};
const menuIcon = (colTitle: string, label: string): JSX.Element | null => {
  const t = colTitle.toLowerCase();
  if (t.includes("ring type")) return ringIcon(label);
  if (t.includes("ring style")) return bandIcon(label);
  if (t === "profile") return profileIcon(label);
  if (t.includes("gemstone")) return gemIcon(label);
  if (t.includes("metal")) return metalIcon(label);
  return null;
};

const NAV_ITEMS = [
  { key: "engagement", label: "Engagement", to: "/engagement-rings", hasMenu: true },
  { key: "wedding", label: "Wedding", to: "/wedding", hasMenu: true },
  { key: "jewellery", label: "Jewellery", to: "/jewellery", hasMenu: true },
  { key: "pendants", label: "Pendants", to: "/pendants", hasMenu: false },
  { key: "bracelets", label: "Bracelets", to: "/bracelets", hasMenu: false },
  { key: "necklaces", label: "Necklaces", to: "/necklaces", hasMenu: false },
  { key: "watches", label: "Watches", to: "/watches", hasMenu: true },
  { key: "bespoke", label: "Bespoke", to: "/bespoke-design", hasMenu: false },
  { key: "story", label: "Our story", to: "/our-story", hasMenu: false },
  // WordPress, not a shop route, so its links do a full page load (reloadDocument).
  { key: "journal", label: "Journal", to: "/blog/", hasMenu: false },
];

const NavigationV2 = ({ solid: forceSolid = false }: { solid?: boolean }): JSX.Element => {
  // Preview-only: open a menu from the URL hash so the panel can be captured (not for the real site).
  const [menu, setMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const overlaysReady = useAfterLoad();
  const [authOpen, setAuthOpen] = useState(false);

  // Measure the header stack so the search panel tucks directly under it
  const navRef = useRef<HTMLDivElement>(null);
  const [navH, setNavH] = useState(100);
  useEffect(() => {
    if (!searchOpen) return;
    const measure = () => { if (navRef.current) setNavH(navRef.current.getBoundingClientRect().height); };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [searchOpen]);

  // Publish the real header height (it varies with the promo strip and breakpoint)
  // so pages can sit directly under it.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty("--v2nav-h", `${Math.round(el.getBoundingClientRect().height)}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [earringTypes, setEarringTypes] = useState<NavItem[]>([]);
  const [necklaceTypes, setNecklaceTypes] = useState<NavItem[]>([]);
  const [braceletTypes, setBraceletTypes] = useState<NavItem[]>([]);
  const [watchBrands, setWatchBrands] = useState<WatchBrand[]>([]);

  const isMobile = useIsMobile();
  const { cartItems, isCartOpen, isCartVisible, openCart, closeCart, updateQuantity, removeItem, getCartCount } = useCart();
  const { favoritesCount } = useFavorites();
  const { isAuthenticated, user } = useUserAuth();
  const accountFirstName = (user?.firstName || user?.fullName?.split(" ")[0] || user?.email?.split("@")[0] || "Account");

  const [wishOpen, setWishOpen] = useState(false);
  const [wishVisible, setWishVisible] = useState(false);
  const openWishlist = () => { setWishVisible(true); setTimeout(() => setWishOpen(true), 10); };
  const closeWishlist = () => { setWishOpen(false); setTimeout(() => setWishVisible(false), 300); };

  // Scroll → solid header; on the homepage the top bar folds away after the first screen.
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 40); setPastHero(window.scrollY > window.innerHeight * 0.85); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch the same navigation data the previous nav used
  useEffect(() => {
    fetch(`${API_BASE_URL}/products/navigation`).then(r => r.json())
      .then(d => { if (d.success) setNavigationData(d.data); }).catch(() => {});
    fetch(`${API_BASE_URL}/watches/featured-collections`).then(r => r.json())
      .then(d => { if (d.success) setWatchBrands(d.data); }).catch(() => {});
  }, []);

  // The earring / necklace / bracelet type lists only appear in the Jewellery menu, so fetch
  // them the first time that menu (or the phone drawer) opens, not on every page load.
  const [wantJewelTypes, setWantJewelTypes] = useState(false);
  useEffect(() => { if (menu === "jewellery" || mobileOpen) setWantJewelTypes(true); }, [menu, mobileOpen]);
  useEffect(() => {
    if (!wantJewelTypes) return;
    Promise.all([
      fetch(`${API_BASE_URL}/filters/earring-types`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/filters/necklace-types`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/filters/bracelet-types`).then(r => r.json()).catch(() => ({})),
    ]).then(([e, n, b]) => {
      if (e.success) setEarringTypes(e.data || []);
      if (n.success) setNecklaceTypes(n.data || []);
      if (b.success) setBraceletTypes(b.data || []);
    });
  }, [wantJewelTypes]);

  // While the phone menu is open the floating chat button is hidden (it covered the
  // booking button); ChatWidgetV2 reads this attribute.
  useEffect(() => {
    if (mobileOpen) document.body.setAttribute("data-v2-menu", "open"); else document.body.removeAttribute("data-v2-menu");
    return () => document.body.removeAttribute("data-v2-menu");
  }, [mobileOpen]);

  const menuContent = useMemo<Record<string, MenuContent>>(() => {
    const enc = encodeURIComponent;
    return {
      engagement: {
        columns: [
          {
            title: "Ring types",
            // Cluster is an engagement setting (moved here from Wedding). Shown explicitly
            // so it appears regardless of the dynamic ring_types ordering/slice.
            links: [
              ...(navigationData?.ring_types || []).filter(i => !/cluster/i.test(i.name)).slice(0, 8).map(i => ({ label: i.name, to: `/engagement-rings?ringType=${enc(i.name)}` })),
              { label: "Cluster", to: `/engagement-rings?ringType=${enc("Cluster")}` },
            ],
            shopAll: { label: "Shop all", to: "/engagement-rings?ringType=all" },
          },
          {
            title: "Gemstones",
            links: (navigationData?.gemstones || []).slice(0, 8).map(i => ({ label: i.name, to: `/engagement-rings?gemstone=${enc(i.name)}` })),
            shopAll: { label: "Shop all", to: "/engagement-rings?gemstone=all" },
          },
          {
            title: "Eternity rings",
            links: (navigationData?.eternity_rings || []).map(i => ({ label: i.name, to: `/engagement-rings?collection=${enc(i.name)}` })),
          },
          {
            title: "Metals",
            links: (navigationData?.metals || []).filter(i => !i.name.startsWith("_TEST")).slice(0, 7).map(i => ({ label: i.name.replace(/\bRed\b/, "Rose"), to: `/engagement-rings?metal=${enc(i.name)}` })),
            shopAll: { label: "Shop all", to: "/engagement-rings?metal=all" },
          },
        ],
        feature: { title: "The Celestial Collection", to: "/engagement-rings", img: "/images/Engagement.png" },
      },
      wedding: {
        // Real Allied Gold catalogue facets (/api/v1/wedding). Each link deep-links
        // into the wedding listing, which reads these query params on load.
        columns: [
          {
            title: "Ring styles", titleTo: "/wedding",
            links: [
              { label: "Classic bands", to: `/wedding?category=${enc("Classic")}` },
              { label: "Diamond cut", to: `/wedding?category=${enc("Diamond Cut")}` },
              { label: "Diamond set", to: `/wedding?category=${enc("Diamond Set")}` },
              { label: "Two colour", to: `/wedding?category=${enc("Two Colour")}` },
              { label: "Shaped", to: `/wedding?category=${enc("Shaped")}` },
            ],
            shopAll: { label: "Shop all wedding", to: "/wedding" },
          },
          {
            title: "Metal",
            links: [
              { label: "Platinum", to: `/wedding?metal=PT` },
              { label: "18ct White gold", to: `/wedding?metal=18W` },
              { label: "18ct Yellow gold", to: `/wedding?metal=18Y` },
              { label: "18ct Rose gold", to: `/wedding?metal=18R` },
              { label: "9ct White gold", to: `/wedding?metal=9W` },
              { label: "9ct Yellow gold", to: `/wedding?metal=9Y` },
              { label: "Palladium", to: `/wedding?metal=PD` },
            ],
          },
          {
            title: "Profile",
            links: [
              { label: "Traditional court", to: `/wedding?profile=C` },
              { label: "Soft court", to: `/wedding?profile=S` },
              { label: "Flat court", to: `/wedding?profile=E` },
              { label: "Flat", to: `/wedding?profile=F` },
              { label: "D-shape", to: `/wedding?profile=D` },
              { label: "Concave", to: `/wedding?profile=U` },
            ],
          },
          {
            title: "Guidance",
            links: [
              { label: "Shop as a pair", to: "/wedding" },
              { label: "Ring size guide", to: "/ring-size-guide" },
              { label: "Book an appointment", to: "/book-appointment" },
              { label: "Bespoke wedding rings", to: "/bespoke-design" },
            ],
            shopAll: { label: "Explore wedding", to: "/wedding" },
          },
        ],
        feature: { title: "Made in pairs", to: "/wedding", img: "/images/Wedding.jpg" },
      },
      jewellery: {
        columns: [
          {
            title: "Earrings", titleTo: "/earrings",
            links: earringTypes.map(t => ({ label: t.name, to: `/earrings?type=${enc(t.name)}` })),
            shopAll: { label: "Shop all earrings", to: "/earrings" },
          },
          {
            title: "Necklaces", titleTo: "/necklaces",
            links: necklaceTypes.map(t => ({ label: t.name, to: `/necklaces?type=${enc(t.name)}` })),
            shopAll: { label: "Shop all necklaces", to: "/necklaces" },
          },
          {
            title: "Bracelets", titleTo: "/bracelets",
            links: braceletTypes.map(t => ({ label: t.name, to: `/bracelets?type=${enc(t.name)}` })),
            shopAll: { label: "Shop all bracelets", to: "/bracelets" },
          },
        ],
        feature: { title: "Fine jewellery", to: "/jewellery", img: "/images/Necklaces.jpg" },
      },
      watches: {
        columns: (watchBrands.length ? watchBrands : []).slice(0, 4).map(b => ({
          title: b.name,
          titleTo: `/${b.slug}`,
          links: (b.collections || []).map(c => ({ label: c.name, to: `/collections/${c.slug}` })),
          shopAll: { label: `View all ${b.name}`, to: `/${b.slug}` },
        })),
        feature: { title: "New & pre-owned", to: "/watches", img: "/images/sample-watch.avif" },
      },
    };
  }, [navigationData, earringTypes, necklaceTypes, braceletTypes, watchBrands]);

  const solid = forceSolid || scrolled || !!menu;
  // The translucent + blurred chrome only makes sense over the homepage hero video.
  // On forced-solid pages (listing / product) use a fully opaque header with no blur.
  const blur = forceSolid ? "none" : "blur(14px)";
  const headerBg = forceSolid ? T.paper : (solid ? "rgba(248,246,240,0.92)" : "rgba(28,26,23,0.12)");
  const headerBorder = solid ? T.rule : "rgba(248,246,240,0.22)";
  const navColor = solid ? T.heading : "#FFFFFF";
  const utilColor = solid ? T.muted : "rgba(255,255,255,0.78)";
  // Count bubble on the wish list and bag icons: dark on the solid bar, light over the hero.
  const navBadge = (n: number) => n > 0
    ? <span className="v2nav-badge" aria-hidden="true" style={{ background: solid ? T.ink : "#FFFFFF", color: solid ? "#FFFFFF" : T.ink }}>{n > 99 ? "99+" : n}</span>
    : null;
  // Over the hero the bar matches the header (translucent dark); once scrolled it
  // goes solid dark ink with light text, while the header row below turns ivory.

  const active = menu ? menuContent[menu] : null;

  // Desktop mega menu: opened by hover or keyboard focus on its top-level link.
  const activeItem = NAV_ITEMS.find(i => i.key === menu);
  const megaPanel = active ? (
            <div id="v2nav-panel" style={{ position: "absolute", top: "100%", left: 0, right: 0, whiteSpace: "normal", textAlign: "left", letterSpacing: "normal", fontSize: 14, color: T.text, background: "#FFFEFD", borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}`, boxShadow: "0 22px 40px -34px rgba(28,26,23,0.25)" }}>
              {/* Three zones: the section name, short link groups, one small feature. Kept shallow so it never fills the screen. */}
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 3fr) minmax(0, 0.9fr)", gap: "clamp(28px, 4vw, 72px)", alignItems: "start", padding: "clamp(30px, 2.8vw, 44px) clamp(24px, 3vw, 52px) clamp(32px, 3vw, 48px)", maxWidth: 1354, margin: "0 auto" }}>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px, 1.9vw, 28px)", lineHeight: 1.18, color: T.text }}>{activeItem?.label}</div>
                  {/* Rings can be bought two ways; say so before the detailed lists */}
                  {activeItem?.key === "engagement" && (
                    <div style={{ marginTop: 20, borderTop: `1px solid ${T.rule}` }}>
                      {[
                        { label: "Ready to ship", note: "In the showroom now. Ships in 48 hours.", to: "/rings?availability=live" },
                        { label: "Made to order", note: "Made for you, in up to six weeks.", to: "/rings?availability=order" },
                      ].map(o => (
                        <Link key={o.to} to={o.to} className="v2nav-way" style={{ display: "block", padding: "13px 0", borderBottom: `1px solid ${T.rule}` }}>
                          <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: T.ink }}>{o.label}</span>
                          <span style={{ display: "block", marginTop: 3, fontSize: 12.5, lineHeight: 1.5, color: T.muted }}>{o.note}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {activeItem && <Link to={activeItem.to} className="v2nav-shopall" style={{ marginTop: 18 }}>View all</Link>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(active.columns.length, 1)}, minmax(0, 1fr))`, gap: "clamp(16px, 2vw, 36px)" }}>
                  {active.columns.map((col, ci) => (
                    <div key={ci}>
                      {col.titleTo
                        ? <Link to={col.titleTo} className="v2nav-coltitle" style={{ display: "block", border: 0, padding: 0, marginBottom: 12, color: T.muted }}>{col.title}</Link>
                        : <div className="v2nav-coltitle" style={{ border: 0, padding: 0, marginBottom: 12, color: T.muted }}>{col.title}</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {col.links.slice(0, 6).map((l, li) => (
                          <Link key={li} to={l.to} className="v2nav-sublink" style={{ fontSize: 13, color: T.text, display: "flex", alignItems: "center", gap: 12 }}>{menuIcon(col.title, l.label)}<span style={{ whiteSpace: "nowrap" }}>{l.label.replace(/\bRed\b/, "Rose")}</span></Link>
                        ))}
                      </div>
                      {(col.shopAll || col.links.length > 6) && <Link to={(col.shopAll || { to: activeItem?.to || "/" }).to} className="v2nav-shopall" style={{ marginTop: 12 }}>{col.links.length > 6 ? `All ${col.links.length}` : "View all"}</Link>}
                    </div>
                  ))}
                </div>
                <Link to={active.feature.to} style={{ display: "block" }}>
                  <div style={{ position: "relative", aspectRatio: "1 / 1", background: T.tint, overflow: "hidden" }}>
                    <img src={active.feature.img} alt={active.feature.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.4, color: T.text }}>{active.feature.title}</div>
                </Link>
              </div>
            </div>
  ) : null;

  return (
    <>
      <style>{`
        .v2nav a { color: inherit; text-decoration: none; }
        .v2nav-item { position: relative; padding: 6px 0; border-bottom: 1px solid transparent; white-space: nowrap; transition: border-color 0.25s ease, color 0.25s ease; }
        .v2nav-item:hover { border-bottom-color: ${T.gold}; }
        .v2nav-util { transition: color 0.25s ease; cursor: pointer; background: none; border: 0; font: inherit; padding: 10px 0; }
        .v2nav-icon { position: relative; }
        .v2nav-icon:hover { text-decoration: none; opacity: 0.7; }
        .v2nav-badge { position: absolute; top: 6px; right: 4px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; font-family: ${FONT_BODY}; font-size: 10px; line-height: 16px; letter-spacing: 0; text-align: center; font-weight: 500; pointer-events: none; }
        .v2nav-tap { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0 !important; }
        .v2-skip { position: fixed; left: 12px; top: -60px; z-index: 100; padding: 12px 18px; background: ${T.ink}; color: ${T.paper}; font-family: ${FONT_BODY}; font-size: 13px; text-decoration: none; transition: top 0.2s ease; }
        .v2-skip:focus { top: 12px; }
        .v2nav-util:hover { text-decoration: underline; text-decoration-color: ${T.gold}; text-decoration-thickness: 1px; text-underline-offset: 6px; }
        .v2nav-sublink { display: block; padding: 5px 6px 5px 8px; margin-left: -8px; font-size: 13px; color: ${T.body}; border-radius: 3px; transition: background 0.2s ease, color 0.2s ease; }
        .v2nav-sublink:hover { text-decoration: underline; text-decoration-color: ${T.gold}; text-decoration-thickness: 1px; text-underline-offset: 5px; }
        .v2nav-shopall { display: inline-block; margin-top: 14px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid ${T.line}; padding-bottom: 4px; transition: color 0.2s ease; }
        .v2nav-shopall:hover { border-bottom-color: ${T.gold}; }
        .v2nav-way span:first-child { transition: color 0.2s ease; }
        .v2nav-way:hover span:first-child { text-decoration: underline; text-decoration-color: ${T.gold}; text-decoration-thickness: 1px; text-underline-offset: 5px; }
        .v2nav-coltitle { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.ink}; padding-bottom: 14px; border-bottom: 1px solid ${T.rule}; margin-bottom: 14px; }
        @keyframes v2drawerIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes v2itemIn { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
        @keyframes v2subIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .v2drawer, .v2drawer * { animation: none !important; } }
      `}</style>

      <a href="#main" className="v2-skip">Skip to content</a>
      <div ref={navRef} className="v2nav" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 60, fontFamily: FONT_BODY }}>
        {/* Trust / reassurance strip — sits above the header on every page.
            Transparent over the homepage hero (forceSolid false, not yet scrolled),
            solid dark once scrolled or on any forced-solid page. */}
        <TrustBarV2 solid={forceSolid || scrolled} hidden={!forceSolid && pastHero} />

        {/* Header */}
        <header
          onMouseLeave={() => setMenu(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && menu) {
              const key = menu; setMenu(null);
              (document.getElementById(`v2nav-top-${key}`) as HTMLElement | null)?.focus();
            }
          }}
          style={{ position: "relative", zIndex: 50, background: headerBg, backdropFilter: blur, WebkitBackdropFilter: blur, borderBottom: `1px solid ${headerBorder}`, transition: "background 0.35s ease, border-color 0.35s ease" }}
        >
          {/* Desktop row */}
          {/* Full link row from 1280px; below that the menu drawer (ten links need the width). */}
          <div className="hidden xl:grid" style={{ gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "clamp(16px, 2vw, 48px)", padding: "16px clamp(24px, 3vw, 52px)" }}>
            <Link to="/" onMouseEnter={() => setMenu(null)} onFocus={() => setMenu(null)} style={{ display: "block", lineHeight: 1 }}>
              <div style={{ fontFamily: FONT_LOGO, fontSize: 25, letterSpacing: "0.16em", color: navColor, transition: "color 0.35s ease" }}>McCulloch</div>
              <div style={{ fontSize: 10, letterSpacing: "0.4em", textTransform: "uppercase", color: utilColor, marginTop: 5, paddingLeft: 3, transition: "color 0.35s ease" }}>Fine jewellery</div>
            </Link>

            <nav style={{ display: "flex", justifyContent: "center", gap: "clamp(12px, 1.3vw, 30px)", whiteSpace: "nowrap", fontSize: 12.5, letterSpacing: "0.02em", color: navColor, transition: "color 0.35s ease" }}>
              {NAV_ITEMS.map(item => (
                <React.Fragment key={item.key}>
                  <Link id={`v2nav-top-${item.key}`} to={item.to} reloadDocument={item.to.startsWith("/blog")} className="v2nav-item"
                    onMouseEnter={() => setMenu(item.hasMenu ? item.key : null)}
                    onFocus={() => setMenu(item.hasMenu ? item.key : null)}
                    aria-haspopup={item.hasMenu ? "true" : undefined}
                    aria-expanded={item.hasMenu ? menu === item.key : undefined}
                    aria-controls={item.hasMenu ? "v2nav-panel" : undefined}>
                    {item.label}
                  </Link>
                  {item.hasMenu && menu === item.key && megaPanel}
                </React.Fragment>
              ))}
            </nav>

            <div onFocus={() => setMenu(null)} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, whiteSpace: "nowrap", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: navColor, marginRight: -12, transition: "color 0.35s ease" }}>
              <button className="v2nav-util v2nav-tap v2nav-icon" onMouseEnter={() => setMenu(null)} onClick={() => setSearchOpen(true)} aria-label="Search" title="Search"><SearchIcon size={19} strokeWidth={1.6} /></button>
              <button className="v2nav-util v2nav-tap v2nav-icon" onClick={openWishlist} aria-label={favoritesCount > 0 ? `Wish list, ${favoritesCount} item${favoritesCount === 1 ? "" : "s"}` : "Wish list"} title="Wish list"><HeartIcon size={19} strokeWidth={1.6} />{navBadge(favoritesCount)}</button>
              {isAuthenticated
                ? <Link to="/account" className="v2nav-util v2nav-tap v2nav-icon" aria-label={`Account, signed in as ${accountFirstName}`} title={`Signed in as ${user?.email || accountFirstName}`}><UserIcon size={19} strokeWidth={1.6} /></Link>
                : <button className="v2nav-util v2nav-tap v2nav-icon" onClick={() => setAuthOpen(true)} aria-label="Sign in" title="Sign in"><UserIcon size={19} strokeWidth={1.6} /></button>}
              <button className="v2nav-util v2nav-tap v2nav-icon" onClick={openCart} aria-label={`Bag, ${getCartCount()} item${getCartCount() === 1 ? "" : "s"}`} title="Bag"><BagIcon size={19} strokeWidth={1.6} />{navBadge(getCartCount())}</button>
            </div>
          </div>

          {/* Mobile row */}
          <div className="flex xl:hidden" style={{ alignItems: "center", justifyContent: "space-between", padding: "12px 20px" }}>
            <button className="v2nav-util v2nav-tap" onClick={() => setMobileOpen(true)} aria-label="Menu" style={{ marginLeft: -11 }}><Menu style={{ width: 22, height: 22, color: navColor }} /></button>
            <Link to="/" style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT_LOGO, fontSize: 19, letterSpacing: "0.15em", color: navColor }}>McCulloch</div>
            </Link>
            <div style={{ display: "flex", alignItems: "center", marginRight: -6 }}>
              <button className="v2nav-util v2nav-tap" onClick={() => setSearchOpen(true)} aria-label="Search"><SearchIcon style={{ width: 19, height: 19, color: navColor }} strokeWidth={1.6} /></button>
              <button className="v2nav-util v2nav-tap v2nav-icon" onClick={openWishlist} aria-label={favoritesCount > 0 ? `Wish list, ${favoritesCount} item${favoritesCount === 1 ? "" : "s"}` : "Wish list"} style={{ color: navColor }}><HeartIcon style={{ width: 19, height: 19 }} strokeWidth={1.6} />{navBadge(favoritesCount)}</button>
              <button className="v2nav-util v2nav-tap v2nav-icon" onClick={openCart} aria-label={`Bag, ${getCartCount()} item${getCartCount() === 1 ? "" : "s"}`} style={{ color: navColor }}><BagIcon style={{ width: 19, height: 19 }} strokeWidth={1.6} />{navBadge(getCartCount())}</button>
            </div>
          </div>

        </header>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="v2drawer" style={{ position: "fixed", inset: 0, zIndex: 70, background: T.paper, fontFamily: FONT_BODY, display: "flex", flexDirection: "column", animation: "v2drawerIn 0.34s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.rule}`, flex: "none" }}>
            <div style={{ fontFamily: FONT_LOGO, fontSize: 20, letterSpacing: "0.15em", color: T.ink }}>McCulloch</div>
            <button className="v2nav-util v2nav-tap" onClick={() => setMobileOpen(false)} aria-label="Close" style={{ marginRight: -10 }}><X style={{ width: 24, height: 24, color: T.ink }} /></button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 28px" }}>
            <nav style={{ display: "flex", flexDirection: "column" }}>
              {/* Live Stock — mobile only (ready-to-ship pieces) */}
              <Link to="/rings?availability=live" onClick={() => setMobileOpen(false)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: `1px solid ${T.rule}`, fontSize: 15, letterSpacing: "0.02em", color: T.text, animation: "v2itemIn 0.4s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.03s" }}>
                <span>Ready to Ship</span>
              </Link>
              {NAV_ITEMS.map((item, idx) => {
                const content = menuContent[item.key];
                const expandable = item.hasMenu && content && content.columns.length > 0;
                const isOpen = navOpen === item.key;
                return (
                  <div key={item.key} style={{ borderBottom: `1px solid ${T.rule}`, animation: "v2itemIn 0.4s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${0.05 + idx * 0.035}s` }}>
                    {expandable ? (
                      <>
                        <button onClick={() => setNavOpen(isOpen ? null : item.key)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "16px 0", background: "none", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 15, letterSpacing: "0.02em", color: isOpen ? T.ink : T.heading }}>
                          <span>{item.label}</span>
                          <span style={{ color: T.gold, fontSize: 18, lineHeight: 1, transform: isOpen ? "rotate(45deg)" : "none", transition: "transform 0.28s ease" }}>+</span>
                        </button>
                        {isOpen && (
                          <div style={{ paddingBottom: 16, animation: "v2subIn 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
                            <Link to={item.to} onClick={() => setMobileOpen(false)} className="v2nav-shopall" style={{ marginTop: 0, marginBottom: 12 }}>Shop all {item.label.toLowerCase()}</Link>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                              {content.columns.flatMap(c => c.links).slice(0, 12).map((l, li) => (
                                <Link key={li} to={l.to} onClick={() => setMobileOpen(false)} style={{ padding: "9px 0", fontSize: 13, color: T.muted }}>{l.label}</Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Link to={item.to} reloadDocument={item.to.startsWith("/blog")} onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "16px 0", fontSize: 15, letterSpacing: "0.02em", color: T.heading }}>{item.label}</Link>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Action block */}
            <div style={{ marginTop: 24, animation: "v2itemIn 0.4s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.28s" }}>
              <Link to="/contact" onClick={() => setMobileOpen(false)} style={{ display: "block", textAlign: "center", padding: "15px 0", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Book an appointment</Link>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }} style={{ padding: "13px 0", background: "transparent", border: `1px solid ${T.ink}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink }}>Search</button>
                <button onClick={() => { setMobileOpen(false); openWishlist(); }} style={{ padding: "13px 0", background: "transparent", border: `1px solid ${T.ink}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink }}>Wish list{favoritesCount > 0 ? ` (${favoritesCount})` : ""}</button>
                {isAuthenticated
                  ? <Link to="/account" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "13px 0", border: `1px solid ${T.ink}`, fontSize: 11, letterSpacing: "0.04em", color: T.ink, gridColumn: "span 2" }}><UserIcon size={15} strokeWidth={1.6} />{accountFirstName}</Link>
                  : <button onClick={() => { setMobileOpen(false); setAuthOpen(true); }} style={{ padding: "13px 0", background: "transparent", border: `1px solid ${T.ink}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink, gridColumn: "span 2" }}>Account</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Functional overlays: mounted once the page has loaded, or straight away if one is opened first */}
      {(overlaysReady || isCartOpen || isCartVisible || searchOpen || authOpen || wishVisible) && (
        <Suspense fallback={null}>
          <CartSlide isOpen={isCartOpen} isVisible={isCartVisible} cartItems={cartItems} onClose={closeCart} onUpdateQuantity={updateQuantity} onRemoveItem={removeItem} />
          <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} isMobile={isMobile} topOffset={navH} />
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
          <SavedDrawerV2 isOpen={wishOpen} isVisible={wishVisible} onClose={closeWishlist} />
        </Suspense>
      )}
    </>
  );
};

export default NavigationV2;
