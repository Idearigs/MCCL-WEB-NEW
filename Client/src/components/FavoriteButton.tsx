import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';

interface FavoriteButtonProps {
  productId: string;
  productName?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  // kept for backwards compat — no longer used
  showTooltip?: boolean;
  onAuthRequired?: () => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  productId,
  productName,
  imageUrl,
  size = 'md',
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  const favorite = isFavorite(productId);

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    try {
      await toggleFavorite(productId, productName, imageUrl);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative flex items-center justify-center p-1
        transition-all duration-200 group
        ${isAnimating ? 'scale-125' : 'scale-100'}
      `}
      aria-label={favorite ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`
          ${iconSizes[size]}
          transition-all duration-200 drop-shadow-sm
          ${favorite
            ? 'fill-red-400 text-red-400 drop-shadow-md'
            : 'text-gray-400 fill-none hover:text-white group-hover:text-white'
          }
          ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
        strokeWidth={1.5}
      />
    </button>
  );
};

export default FavoriteButton;
