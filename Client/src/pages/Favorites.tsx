import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { useFavorites } from "../contexts/FavoritesContext";
import { useUserAuth } from "../contexts/UserAuthContext";
import { useCart } from "../contexts/CartContext";
import { getMediaUrl } from "../config/api";
import { ACCOUNT_CSS, money, tidy, EmptyPane, Notice } from "../components/home-v2/accountShared";

/**
 * Saved (route /favorites), light redesign (Nov 2026): the new navigation and footer and the
 * same piece tiles as the account page. It now also works before signing in, showing the pieces
 * saved on this device, where the old page only said "sign in".
 *
 * Two faults in the old page are gone with the rewrite: it called a cart function that does
 * not exist (addItem), and it formatted product.price, which the saved-items API does not send
 * (it sends basePrice / salePrice), so both would throw.
 */

const favPrice = (p: any): number | undefined => {
  const v = p?.salePrice ?? p?.basePrice ?? p?.price;
  return v == null ? undefined : Number(v);
};

const Favorites: React.FC = () => {
  const { favorites, localFavorites, favoritesCount, isLoading, removeFavorite } = useFavorites();
  const { isAuthenticated, isLoading: authLoading } = useUserAuth();
  const { addToCart } = useCart();

  const items = useMemo(() => {
    if (isAuthenticated) {
      return favorites.map((f) => {
        const p: any = f.product;
        return { id: p.id as string, name: p.name as string, price: favPrice(p), image: (p.image || p.images?.[0]?.url) as string | undefined, to: p?.slug ? `/product/${p.slug}` : "#" };
      });
    }
    return localFavorites.map((f) => ({ id: f.productId, name: f.name || "Saved item", price: undefined as number | undefined, image: f.image, to: f.url || "#" }));
  }, [isAuthenticated, favorites, localFavorites]);

  const addToBag = (s: (typeof items)[number]) =>
    addToCart({ id: s.id, name: s.name, price: money(s.price) || "£0", image: s.image ? getMediaUrl(s.image) : "", type: "jewelry" });

  const shell = (children: React.ReactNode) => (
    <div className="ac">
      <style>{ACCOUNT_CSS}</style>
      <NavigationV2 solid />
      {children}
      <FooterV2 />
    </div>
  );

  if (authLoading || isLoading) {
    return shell(<Notice title="Loading your saved pieces"><span className="ac-spinner" style={{ margin: 0 }} /></Notice>);
  }

  return shell(
    <>
      <section className="ac-wrap ac-open">
        <div className="ac-crumb"><Link to="/">Home</Link><span>/</span><span>Saved</span></div>
        <h1 className="ac-h1" style={{ marginTop: 0 }}>Saved</h1>
        <div className="ac-eyebrow" style={{ marginTop: 16 }}>{favoritesCount} {favoritesCount === 1 ? "piece" : "pieces"}</div>
      </section>

      <main className="ac-wrap" style={{ paddingBottom: "clamp(64px, 7vw, 112px)" }}>
        {items.length === 0 ? (
          <EmptyPane head="Nothing saved yet." body="Tap the heart on any piece and it will wait here for you." cta={{ label: "Browse engagement rings", to: "/engagement-rings" }} />
        ) : (
          <div className="ac-saved is-four" style={{ marginTop: "clamp(30px, 3.6vw, 52px)" }}>
            {items.map((s) => (
              <div key={s.id} data-saved>
                <div style={{ position: "relative" }}>
                  <Link to={s.to} className="ac-piece-img" aria-label={s.name}>
                    {s.image && <img src={getMediaUrl(s.image)} alt={s.name} loading="lazy" />}
                  </Link>
                  <button type="button" className="ac-piece-x" data-unsave onClick={() => removeFavorite(s.id).catch(() => {})} aria-label={`Remove ${s.name} from saved`}>
                    <svg width="20" height="18" viewBox="0 0 20 18" fill="currentColor" aria-hidden="true"><path d="M10 16.6C4.6 12.7 1 9.6 1 5.9 1 3.3 3 1.4 5.4 1.4c1.8 0 3.5 1 4.6 2.7 1.1-1.7 2.8-2.7 4.6-2.7C17 1.4 19 3.3 19 5.9c0 3.7-3.6 6.800-9 10.700z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" /></svg>
                  </button>
                </div>
                <div className="ac-piece-name">
                  <Link to={s.to}>{tidy(s.name)}</Link>
                  {s.price != null && <span>{money(s.price)}</span>}
                </div>
                {s.price != null
                  ? <button type="button" className="ac-ghost" onClick={() => addToBag(s)}>Add to bag</button>
                  : <Link to={s.to} className="ac-ghost" style={{ textAlign: "center" }}>View piece</Link>}
              </div>
            ))}
          </div>
        )}

        {!isAuthenticated && items.length > 0 && (
          <div style={{ marginTop: "clamp(40px, 5vw, 64px)", paddingTop: 28, borderTop: "1px solid #E3DDD0", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px 30px" }}>
            <span style={{ fontSize: 15, lineHeight: 1.7 }}>These are saved on this device only. Sign in to keep them wherever you are.</span>
            <Link to="/account" className="ac-link">Sign in</Link>
          </div>
        )}
      </main>
    </>
  );
};

export default Favorites;
