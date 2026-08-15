import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useUserAuth } from "../../contexts/UserAuthContext";
import { useIsMobile } from "../../hooks/use-mobile";
import CartSlide from "../CartSlide";
import SavedDrawerV2 from "./SavedDrawerV2";
import SearchOverlayV2 from "./SearchOverlayV2";
import AuthModal from "../AuthModalV2";
import API_BASE_URL from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

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

const NAV_ITEMS = [
  { key: "engagement", label: "Engagement", to: "/engagement-rings", hasMenu: true },
  { key: "wedding", label: "Wedding", to: "/wedding", hasMenu: true },
  { key: "jewellery", label: "Jewellery", to: "/jewellery", hasMenu: true },
  { key: "watches", label: "Watches", to: "/watches", hasMenu: true },
  { key: "bespoke", label: "Bespoke", to: "/bespoke-design", hasMenu: false },
  { key: "story", label: "Our story", to: "/our-story", hasMenu: false },
];

const NavigationV2 = ({ solid: forceSolid = false }: { solid?: boolean }): JSX.Element => {
  const [menu, setMenu] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
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
  const { isAuthenticated } = useUserAuth();

  const [wishOpen, setWishOpen] = useState(false);
  const [wishVisible, setWishVisible] = useState(false);
  const openWishlist = () => { setWishVisible(true); setTimeout(() => setWishOpen(true), 10); };
  const closeWishlist = () => { setWishOpen(false); setTimeout(() => setWishVisible(false), 300); };

  // Scroll → solid header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
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
    Promise.all([
      fetch(`${API_BASE_URL}/filters/earring-types`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/filters/necklace-types`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE_URL}/filters/bracelet-types`).then(r => r.json()).catch(() => ({})),
    ]).then(([e, n, b]) => {
      if (e.success) setEarringTypes(e.data || []);
      if (n.success) setNecklaceTypes(n.data || []);
      if (b.success) setBraceletTypes(b.data || []);
    });
  }, []);

  const menuContent = useMemo<Record<string, MenuContent>>(() => {
    const enc = encodeURIComponent;
    return {
      engagement: {
        columns: [
          {
            title: "Ring types",
            links: (navigationData?.ring_types || []).slice(0, 8).map(i => ({ label: i.name, to: `/engagement-rings?ringType=${enc(i.name)}` })),
            shopAll: { label: "Shop all", to: "/engagement-rings" },
          },
          {
            title: "Gemstones",
            links: (navigationData?.gemstones || []).slice(0, 8).map(i => ({ label: i.name, to: `/engagement-rings?gemstone=${enc(i.name)}` })),
            shopAll: { label: "Shop all", to: "/engagement-rings" },
          },
          {
            title: "Eternity rings",
            links: (navigationData?.eternity_rings || []).map(i => ({ label: i.name, to: `/engagement-rings?collection=${enc(i.name)}` })),
          },
          {
            title: "Metals",
            links: (navigationData?.metals || []).filter(i => !i.name.startsWith("_TEST")).slice(0, 7).map(i => ({ label: i.name, to: `/engagement-rings?metal=${enc(i.name)}` })),
            shopAll: { label: "Shop all", to: "/engagement-rings" },
          },
        ],
        feature: { title: "The Celestial Collection", to: "/engagement-rings", img: "/images/Engagement.png" },
      },
      wedding: {
        columns: [
          {
            title: "Wedding rings", titleTo: "/wedding",
            links: [
              { label: "Wedding Bands", to: "/wedding-bands" },
              { label: "His & Hers Sets", to: "/his-hers-sets" },
              { label: "Women's Wedding Rings", to: "/womens-wedding-rings" },
              { label: "Men's Wedding Rings", to: "/mens-wedding-rings" },
              { label: "Diamond Wedding Rings", to: "/diamond-wedding-rings" },
              { label: "Plain Wedding Bands", to: "/plain-wedding-bands" },
              { label: "Vintage Wedding Rings", to: "/vintage-wedding-rings" },
              { label: "Matching Wedding Sets", to: "/matching-wedding-sets" },
            ],
          },
          {
            title: "Styles",
            links: [
              { label: "Classic Bands", to: "/classic-wedding-bands" },
              { label: "Pavé Setting", to: "/pavé-wedding-rings" },
              { label: "Channel Set", to: "/channel-set-wedding-rings" },
              { label: "Eternity Style", to: "/eternity-wedding-bands" },
              { label: "Engraved", to: "/engraved-wedding-rings" },
              { label: "Milgrain Detail", to: "/milgrain-wedding-rings" },
              { label: "Twisted Design", to: "/twisted-wedding-bands" },
              { label: "Curved Bands", to: "/curved-wedding-rings" },
            ],
          },
          {
            title: "Metals",
            links: [
              { label: "Platinum", to: "/platinum-wedding-rings" },
              { label: "White Gold", to: "/white-gold-wedding-rings" },
              { label: "Yellow Gold", to: "/yellow-gold-wedding-rings" },
              { label: "Rose Gold", to: "/rose-gold-wedding-rings" },
              { label: "Titanium", to: "/titanium-wedding-rings" },
              { label: "Mixed Metals", to: "/mixed-metal-wedding-rings" },
            ],
          },
          {
            title: "Services & guide",
            links: [
              { label: "Wedding Ring Guide", to: "/wedding-ring-guide" },
              { label: "Ring Sizing", to: "/ring-sizing" },
              { label: "Custom Design", to: "/custom-wedding-rings" },
              { label: "Engraving Services", to: "/wedding-ring-engraving" },
              { label: "Care & Maintenance", to: "/wedding-ring-care" },
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
          {
            title: "Gifts & occasions",
            links: [
              { label: "Birthday Gifts", to: "/birthday-gifts" },
              { label: "Anniversary Gifts", to: "/anniversary-gifts" },
              { label: "Mother's Day", to: "/mothers-day-gifts" },
              { label: "Valentine's Day", to: "/valentine-gifts" },
              { label: "Graduation Gifts", to: "/graduation-gifts" },
              { label: "Gift Sets", to: "/gift-sets" },
            ],
            shopAll: { label: "Explore jewellery", to: "/jewellery" },
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
  // Over the hero the bar matches the header (translucent dark); once scrolled it
  // goes solid dark ink with light text, while the header row below turns ivory.
  const barBg = solid ? T.ink : headerBg;
  const barColor = solid ? T.onDarkSoft : utilColor;

  const active = menu ? menuContent[menu] : null;

  return (
    <>
      <style>{`
        .v2nav a { color: inherit; text-decoration: none; }
        .v2nav-item { position: relative; padding: 6px 0; border-bottom: 1px solid transparent; white-space: nowrap; transition: border-color 0.25s ease, color 0.25s ease; }
        .v2nav-item:hover { border-bottom-color: ${T.ink}; }
        .v2nav-util { transition: color 0.25s ease; cursor: pointer; background: none; border: 0; font: inherit; padding: 0; }
        .v2nav-util:hover { color: ${T.gold}; }
        .v2nav-sublink { display: block; padding: 5px 6px 5px 8px; margin-left: -8px; font-size: 13px; color: ${T.body}; border-radius: 3px; transition: background 0.2s ease, color 0.2s ease; }
        .v2nav-sublink:hover { background: ${T.tint}; color: ${T.ink}; }
        .v2nav-shopall { display: inline-block; margin-top: 14px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid ${T.ruleStrong}; padding-bottom: 4px; transition: color 0.2s ease; }
        .v2nav-shopall:hover { color: ${T.gold}; }
        .v2nav-coltitle { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.ink}; padding-bottom: 14px; border-bottom: 1px solid ${T.rule}; margin-bottom: 14px; }
        @keyframes v2drawerIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes v2itemIn { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
        @keyframes v2subIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .v2drawer, .v2drawer * { animation: none !important; } }
      `}</style>

      <div ref={navRef} className="v2nav" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 60, fontFamily: FONT_BODY }}>
        {/* Announcement bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 40, padding: "9px 32px", background: barBg, color: barColor, backdropFilter: blur, WebkitBackdropFilter: blur, fontSize: 10.5, letterSpacing: "0.13em", textTransform: "uppercase", transition: "background 0.35s ease, color 0.35s ease" }}>
          <span className="hidden sm:inline">Free insured UK delivery</span><span className="hidden sm:inline" style={{ color: T.ruleDarkStrong }}>/</span>
          <span>30-day returns</span><span style={{ color: T.ruleDarkStrong }}>/</span>
          <span>1-year warranty</span><span className="hidden sm:inline" style={{ color: T.ruleDarkStrong }}>/</span>
          <span className="hidden sm:inline">Hand-finished in the UK</span>
        </div>

        {/* Header */}
        <header
          onMouseLeave={() => setMenu(null)}
          style={{ position: "relative", zIndex: 50, background: headerBg, backdropFilter: blur, WebkitBackdropFilter: blur, borderBottom: `1px solid ${headerBorder}`, transition: "background 0.35s ease, border-color 0.35s ease" }}
        >
          {/* Desktop row */}
          <div className="hidden lg:grid" style={{ gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: "clamp(20px, 3vw, 48px)", padding: "16px clamp(24px, 3vw, 52px)" }}>
            <Link to="/" onMouseEnter={() => setMenu(null)} style={{ display: "block", lineHeight: 1 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 25, letterSpacing: "0.26em", textTransform: "uppercase", color: navColor, transition: "color 0.35s ease" }}>McCulloch</div>
              <div style={{ fontSize: 8.5, letterSpacing: "0.44em", textTransform: "uppercase", color: utilColor, marginTop: 5, paddingLeft: 3, transition: "color 0.35s ease" }}>Fine jewellery</div>
            </Link>

            <nav style={{ display: "flex", justifyContent: "center", gap: "clamp(14px, 2vw, 32px)", fontSize: 12.5, letterSpacing: "0.02em", color: navColor, transition: "color 0.35s ease" }}>
              {NAV_ITEMS.map(item => (
                <Link key={item.key} to={item.to} className="v2nav-item" onMouseEnter={() => setMenu(item.hasMenu ? item.key : null)}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "clamp(12px, 1.4vw, 20px)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: utilColor, transition: "color 0.35s ease" }}>
              <button className="v2nav-util" onMouseEnter={() => setMenu(null)} onClick={() => setSearchOpen(true)}>Search</button>
              <button className="v2nav-util" onClick={openWishlist} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>Saved{favoritesCount > 0 ? <span style={{ color: T.gold }}>{favoritesCount}</span> : null}</button>
              {isAuthenticated
                ? <Link to="/account" className="v2nav-util">Account</Link>
                : <button className="v2nav-util" onClick={() => setAuthOpen(true)}>Account</button>}
              <button className="v2nav-util" onClick={openCart}>Bag ({getCartCount()})</button>
            </div>
          </div>

          {/* Mobile row */}
          <div className="flex lg:hidden" style={{ alignItems: "center", justifyContent: "space-between", padding: "12px 20px" }}>
            <button className="v2nav-util" onClick={() => setMobileOpen(true)} aria-label="Menu"><Menu style={{ width: 22, height: 22, color: navColor }} /></button>
            <Link to="/" style={{ textAlign: "center" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, letterSpacing: "0.24em", textTransform: "uppercase", color: navColor }}>McCulloch</div>
            </Link>
            <button className="v2nav-util" onClick={openCart} style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: utilColor }}>Bag ({getCartCount()})</button>
          </div>

          {/* Mega menu */}
          {active && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: T.paper, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}`, boxShadow: "0 24px 48px -32px rgba(28,26,23,0.22)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "clamp(32px, 4vw, 72px)", padding: "clamp(32px, 3vw, 48px) clamp(24px, 3vw, 52px)", maxWidth: 1560, margin: "0 auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(24px, 3vw, 56px)" }}>
                  {active.columns.map((col, ci) => (
                    <div key={ci}>
                      {col.titleTo
                        ? <Link to={col.titleTo} className="v2nav-coltitle" style={{ display: "block" }}>{col.title}</Link>
                        : <div className="v2nav-coltitle">{col.title}</div>}
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {col.links.map((l, li) => (
                          <Link key={li} to={l.to} className="v2nav-sublink">{l.label}</Link>
                        ))}
                      </div>
                      {col.shopAll && <Link to={col.shopAll.to} className="v2nav-shopall">{col.shopAll.label}</Link>}
                    </div>
                  ))}
                </div>
                <Link to={active.feature.to} style={{ display: "block" }}>
                  <div style={{ position: "relative", aspectRatio: "4 / 5", background: T.tint, overflow: "hidden" }}>
                    <img src={active.feature.img} alt={active.feature.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.gold, margin: "14px 0 7px" }}>Featured</div>
                  <div style={{ fontSize: 14.5, lineHeight: 1.4, color: T.ink }}>{active.feature.title}</div>
                </Link>
              </div>
            </div>
          )}
        </header>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="v2drawer" style={{ position: "fixed", inset: 0, zIndex: 70, background: T.paper, fontFamily: FONT_BODY, display: "flex", flexDirection: "column", animation: "v2drawerIn 0.34s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${T.rule}`, flex: "none" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, letterSpacing: "0.24em", textTransform: "uppercase", color: T.ink }}>McCulloch</div>
            <button className="v2nav-util" onClick={() => setMobileOpen(false)} aria-label="Close"><X style={{ width: 24, height: 24, color: T.ink }} /></button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 20px 28px" }}>
            <nav style={{ display: "flex", flexDirection: "column" }}>
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
                      <Link to={item.to} onClick={() => setMobileOpen(false)} style={{ display: "block", padding: "16px 0", fontSize: 15, letterSpacing: "0.02em", color: T.heading }}>{item.label}</Link>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Action block */}
            <div style={{ marginTop: 24, animation: "v2itemIn 0.4s cubic-bezier(0.22,1,0.36,1) both", animationDelay: "0.28s" }}>
              <Link to="/contact" onClick={() => setMobileOpen(false)} style={{ display: "block", textAlign: "center", padding: "15px 0", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Book an appointment</Link>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <button onClick={() => { setMobileOpen(false); setSearchOpen(true); }} style={{ padding: "13px 0", background: "transparent", border: `1px solid ${T.ruleStrong}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink }}>Search</button>
                <button onClick={() => { setMobileOpen(false); openWishlist(); }} style={{ padding: "13px 0", background: "transparent", border: `1px solid ${T.ruleStrong}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink }}>Saved{favoritesCount > 0 ? ` (${favoritesCount})` : ""}</button>
                {isAuthenticated
                  ? <Link to="/account" onClick={() => setMobileOpen(false)} style={{ textAlign: "center", padding: "13px 0", border: `1px solid ${T.ruleStrong}`, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink, gridColumn: "span 2" }}>Account</Link>
                  : <button onClick={() => { setMobileOpen(false); setAuthOpen(true); }} style={{ padding: "13px 0", background: "transparent", border: `1px solid ${T.ruleStrong}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink, gridColumn: "span 2" }}>Account</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Functional overlays */}
      <CartSlide isOpen={isCartOpen} isVisible={isCartVisible} cartItems={cartItems} onClose={closeCart} onUpdateQuantity={updateQuantity} onRemoveItem={removeItem} />
      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} isMobile={isMobile} topOffset={navH} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialView="login" />
      <SavedDrawerV2 isOpen={wishOpen} isVisible={wishVisible} onClose={closeWishlist} />
    </>
  );
};

export default NavigationV2;
