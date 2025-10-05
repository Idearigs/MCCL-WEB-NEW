import React from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import LuxuryNavigation from '../components/LuxuryNavigation';
import { FooterSection } from '../components/FooterSection';
import { useFavorites } from '../contexts/FavoritesContext';
import { useUserAuth } from '../contexts/UserAuthContext';
import { useCart } from '../contexts/CartContext';

const Favorites: React.FC = () => {
  const { favorites, favoritesCount, isLoading, removeFavorite } = useFavorites();
  const { isAuthenticated } = useUserAuth();
  const { addItem } = useCart();

  const handleRemove = async (productId: string) => {
    try {
      await removeFavorite(productId);
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || product.images?.[0]?.url,
      quantity: 1,
    });
  };

  if (!isAuthenticated) {
    return (
      <>
        <LuxuryNavigation />
        <div className="min-h-screen bg-gray-50 pt-32">
          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <Heart className="w-16 h-16 mx-auto text-gray-300 mb-6" />
            <h1 className="text-3xl font-light text-gray-900 mb-4">Sign in to view your favorites</h1>
            <p className="text-gray-600 font-light mb-8">
              Create an account or sign in to save your favorite pieces
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-3 rounded-md hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-light"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <FooterSection />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <LuxuryNavigation />
        <div className="min-h-screen bg-gray-50 pt-32">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="animate-pulse space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6 h-48" />
              ))}
            </div>
          </div>
        </div>
        <FooterSection />
      </>
    );
  }

  return (
    <>
      <LuxuryNavigation />
      <div className="min-h-screen bg-gray-50 pt-32">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
              <h1 className="text-4xl font-light text-gray-900">My Favorites</h1>
            </div>
            <p className="text-gray-600 font-light">
              {favoritesCount} {favoritesCount === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>

          {/* Empty state */}
          {favoritesCount === 0 ? (
            <div className="text-center py-20">
              <Heart className="w-20 h-20 mx-auto text-gray-200 mb-6" />
              <h2 className="text-2xl font-light text-gray-900 mb-3">No favorites yet</h2>
              <p className="text-gray-600 font-light mb-8 max-w-md mx-auto">
                Start adding pieces you love to your favorites. Click the heart icon on any product to save it here.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-8 py-3 rounded-md hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-light shadow-lg shadow-amber-500/20"
              >
                Explore Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            /* Favorites grid */
            <div className="grid gap-6">
              {favorites.map((favorite) => (
                <div
                  key={favorite.favoriteId}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row gap-6 p-6">
                    {/* Product image */}
                    <Link
                      to={`/product/${favorite.product.slug}`}
                      className="flex-shrink-0 w-full md:w-48 h-48 bg-gray-100 rounded-md overflow-hidden group"
                    >
                      {favorite.product.image ? (
                        <img
                          src={favorite.product.image}
                          alt={favorite.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </Link>

                    {/* Product details */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <Link
                          to={`/product/${favorite.product.slug}`}
                          className="group"
                        >
                          <h3 className="text-xl font-light text-gray-900 group-hover:text-amber-700 transition-colors mb-2">
                            {favorite.product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 font-light line-clamp-2 mb-3">
                          {favorite.product.description}
                        </p>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl font-light text-gray-900">
                            £{favorite.product.price.toFixed(2)}
                          </span>
                          {favorite.product.compareAtPrice && (
                            <span className="text-sm text-gray-400 line-through font-light">
                              £{favorite.product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            favorite.product.inStock
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {favorite.product.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                          <span className="text-xs text-gray-500 font-light">
                            SKU: {favorite.product.sku}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleAddToCart(favorite.product)}
                          disabled={!favorite.product.inStock}
                          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white px-6 py-2.5 rounded-md hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-light text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Add to Cart
                        </button>
                        <Link
                          to={`/product/${favorite.product.slug}`}
                          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 font-light text-sm"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleRemove(favorite.product.id)}
                          className="ml-auto p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <FooterSection />
    </>
  );
};

export default Favorites;
