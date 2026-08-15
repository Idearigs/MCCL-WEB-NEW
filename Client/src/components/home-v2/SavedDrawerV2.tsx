import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useCart } from "../../contexts/CartContext";
import { getMediaUrl } from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

/**
 * SavedDrawerV2 — the saved pieces drawer.
 * Design: design_handoff_mcculloch_account_search_saved (Saved drawer). Right-edge
 * drawer over a scrim; rows carry the full specification and a note line; a champagne
 * footer states the promise (specification kept, nothing reserved).
 *
 * Wired to FavoritesContext (real saved items, authenticated or local). The handoff's
 * "Price changed — was £X" note needs a stored saved-configuration to diff against the
 * live price; until that exists the note shows when the piece was saved.
 */

const M2 = "#8A8377";

const money = (n?: number) => (n == null || isNaN(Number(n)) ? "" : "£" + Math.round(Number(n)).toLocaleString("en-GB"));

// Favorites come back with basePrice/salePrice (not `price`) and no category slug,
// so price falls back across those and links use the universal /product/:slug route.
const favPrice = (p: any): number | undefined => {
  const v = p?.salePrice ?? p?.basePrice ?? p?.price;
  return v == null ? undefined : Number(v);
};
const favLink = (p: any) => (p?.slug ? `/product/${p.slug}` : "#");

const savedAgo = (iso?: string): string => {
  if (!iso) return "Saved";
  const then = new Date(iso).getTime();
  if (isNaN(then)) return "Saved";
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "Saved today";
  if (days === 1) return "Saved yesterday";
  if (days < 14) return `Saved ${days} days ago`;
  if (days < 60) return `Saved ${Math.round(days / 7)} weeks ago`;
  return "Saved last month";
};

interface SavedDrawerV2Props {
  isOpen: boolean;      // slid-in state (drives the transition)
  isVisible: boolean;   // mounted state (kept during exit animation)
  onClose: () => void;
}

const SavedDrawerV2: React.FC<SavedDrawerV2Props> = ({ isOpen, isVisible, onClose }) => {
  const { favorites, localFavorites, favoritesCount, removeFavorite } = useFavorites();
  const { addToCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = isVisible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isVisible]);

  if (!isVisible) return null;

  const items = favorites.length
    ? favorites.map((f) => {
        const p: any = f.product;
        return {
          id: p.id,
          name: p.name,
          price: favPrice(p),
          spec: "",
          image: p.image || p.images?.[0]?.url,
          to: favLink(p),
          note: savedAgo(f.favoritedAt),
        };
      })
    : localFavorites.map((f) => ({
        id: f.productId,
        name: f.name || "Saved item",
        price: undefined as number | undefined,
        spec: "",
        image: f.image,
        to: f.url || "#",
        note: savedAgo(f.addedAt),
      }));

  const savedLine = favoritesCount === 1 ? "1 piece kept" : `${favoritesCount} pieces kept`;

  const addBag = (s: (typeof items)[number]) => {
    addToCart({ id: s.id, name: s.name, price: money(s.price) || "£0", image: s.image ? getMediaUrl(s.image) : "", type: "jewelry" });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, fontFamily: FONT_BODY }}>
      <style>{`
        @keyframes svScrimIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes svDrawerIn { from { transform: translateX(100%); } to { transform: none; } }
        .sv-nobar::-webkit-scrollbar { display: none; }
        .sv-addbag:hover { background: ${T.gold} !important; }
        .sv-remove:hover { color: ${T.ink} !important; }
        @media (prefers-reduced-motion: reduce) { .sv-drawer { animation: none !important; } }
      `}</style>

      {/* Scrim */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.42)", opacity: isOpen ? 1 : 0, transition: "opacity 0.3s ease" }}
      />

      {/* Drawer */}
      <aside
        className="sv-drawer"
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column",
          width: "min(432px, 100vw)", background: T.paper, borderLeft: `1px solid ${T.rule}`,
          transform: isOpen ? "none" : "translateX(100%)", transition: "transform 0.34s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "24px 26px 20px", borderBottom: `1px solid ${T.rule}`, flex: "none" }}>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, lineHeight: 1 }}>Saved</div>
            <div style={{ fontSize: 11.5, color: M2, marginTop: 7 }}>{savedLine}</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 22, lineHeight: 1, color: T.body }}>×</button>
        </div>

        {/* Body */}
        <div className="sv-nobar" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 26px" }}>
          {items.length === 0 ? (
            <div style={{ padding: "64px 0", textAlign: "center" }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, marginBottom: 12 }}>Nothing saved yet.</div>
              <p style={{ margin: "0 auto 24px", maxWidth: "30ch", fontSize: 13.5, lineHeight: 1.7, color: T.muted }}>Tap the save mark on any piece and it will wait here, specification and all.</p>
              <Link to="/engagement-rings" onClick={onClose} style={{ display: "inline-block", padding: "13px 24px", background: T.ink, color: T.paper, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" }}>Browse rings</Link>
            </div>
          ) : (
            items.map((s) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "84px minmax(0, 1fr)", gap: 16, padding: "22px 0", borderBottom: `1px solid ${T.rule}` }}>
                <Link to={s.to} onClick={onClose} style={{ position: "relative", display: "block", aspectRatio: "4 / 5", background: T.tint, overflow: "hidden" }}>
                  {s.image && <img src={getMediaUrl(s.image)} alt={s.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />}
                </Link>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
                    <Link to={s.to} onClick={onClose} style={{ fontSize: 14.5, color: T.ink, textDecoration: "none" }}>{s.name}</Link>
                    {s.price != null && <span style={{ fontSize: 13.5, whiteSpace: "nowrap" }}>{money(s.price)}</span>}
                  </div>
                  {s.spec && <div style={{ fontSize: 12, lineHeight: 1.55, color: T.muted, textTransform: "capitalize" }}>{s.spec}</div>}
                  <div style={{ fontSize: 11.5, color: M2, marginTop: 6 }}>{s.note}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
                    <button type="button" onClick={() => addBag(s)} className="sv-addbag" style={{ padding: "9px 16px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0, transition: "background 0.25s ease" }}>Add to bag</button>
                    <button type="button" onClick={() => removeFavorite(s.id)} className="sv-remove" style={{ cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 11, color: M2, transition: "color 0.25s ease" }}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "20px 26px 24px", borderTop: `1px solid ${T.rule}`, background: T.tint, flex: "none" }}>
          <p style={{ margin: "0 0 16px", fontSize: 12.5, lineHeight: 1.65, color: T.body }}>Saved pieces keep their specification. Nothing is reserved — everything is made to order.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Link to="/account" onClick={onClose} style={{ padding: 14, textAlign: "center", background: T.ink, color: T.paper, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase" }}>Open in account</Link>
            <Link to="/contact" onClick={onClose} style={{ padding: 14, textAlign: "center", border: `1px solid ${T.ruleStrong}`, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.ink }}>See them in person</Link>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SavedDrawerV2;
