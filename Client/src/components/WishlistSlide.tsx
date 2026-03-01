import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCart } from '../contexts/CartContext';
import { toast } from 'sonner';

interface WishlistSlideProps {
  isOpen: boolean;
  isVisible: boolean;
  onClose: () => void;
}

const WishlistSlide: React.FC<WishlistSlideProps> = ({
  isOpen,
  isVisible,
  onClose,
}) => {
  const { favorites, localFavorites, favoritesCount, removeFavorite, isLoading } = useFavorites();
  const { addToCart } = useCart();

  const handleRemove = async (productId: string) => {
    try {
      await removeFavorite(productId);
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: `£${product.price?.toLocaleString() || '0'}`,
      image: product.image || product.images?.[0]?.url || '',
      type: 'jewelry',
    });
    toast.success(`${product.name} added to bag`);
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return '£0';
    return `£${price.toLocaleString()}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Wishlist Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-cormorant font-medium text-gray-900 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-rose-500 fill-rose-500" />
            Wishlist
          </h2>
          <span className="text-sm font-cormorant text-gray-600">
            {favoritesCount} item{favoritesCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Wishlist Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="font-cormorant text-sm">Loading wishlist...</p>
            </div>
          ) : favoritesCount === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-cormorant text-gray-900 mb-2">Your wishlist is empty</p>
              <p className="font-cormorant text-sm text-gray-600 mb-6">Save items you love to your wishlist</p>
              <Button
                onClick={onClose}
                className="bg-gray-900 hover:bg-gray-800 text-white font-cormorant font-medium uppercase tracking-wider text-xs px-6 py-2"
              >
                <Link to="/engagement-rings">Browse Collection</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Authenticated API favorites */}
              {favorites.map((fav) => (
                <div key={fav.favoriteId} className="flex space-x-4 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  {/* Product Image */}
                  <Link
                    to={`/${fav.product.category}/${fav.product.slug}`}
                    onClick={onClose}
                    className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded overflow-hidden"
                  >
                    <img
                      src={fav.product.image || fav.product.images?.[0]?.url || '/images/placeholder.jpg'}
                      alt={fav.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <Link
                        to={`/${fav.product.category}/${fav.product.slug}`}
                        onClick={onClose}
                        className="text-sm font-cormorant font-medium text-gray-900 pr-2 leading-tight hover:text-gray-600 transition-colors"
                      >
                        {fav.product.name}
                      </Link>
                      <button
                        onClick={() => handleRemove(fav.product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-xs text-gray-600 font-cormorant">
                      {fav.product.category}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-cormorant font-medium text-gray-900">
                        {formatPrice(fav.product.price)}
                      </span>

                      {fav.product.inStock !== false && (
                        <button
                          onClick={() => handleAddToCart(fav.product)}
                          className="flex items-center text-xs font-cormorant text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4 mr-1" />
                          Add to Bag
                        </button>
                      )}
                    </div>

                    {fav.product.inStock === false && (
                      <span className="text-xs text-red-500 font-cormorant">Out of stock</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Local (non-auth) favorites */}
              {localFavorites.map((fav) => (
                <div key={fav.productId} className="flex space-x-4 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  {/* Placeholder image */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-50 flex items-center justify-center rounded">
                    <Heart className="w-6 h-6 text-rose-300 fill-rose-200" />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-cormorant font-medium text-gray-900 pr-2 leading-tight">
                        {fav.name || 'Saved item'}
                      </span>
                      <button
                        onClick={() => handleRemove(fav.productId)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 font-cormorant">
                      Sign in to view full details
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {favoritesCount > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-3">
            <Link to="/favorites" onClick={onClose}>
              <Button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-cormorant font-medium uppercase tracking-wider text-xs border-0">
                View All Wishlist
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistSlide;
