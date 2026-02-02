import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useUserAuth } from '../contexts/UserAuthContext';

interface FavoriteButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onAuthRequired?: () => void;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  productId,
  size = 'md',
  showTooltip = false,
  onAuthRequired,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useUserAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoginTooltip, setShowLoginTooltip] = useState(false);

  const favorite = isFavorite(productId);

  // Icon sizes only - no container
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If not authenticated, show login prompt
    if (!isAuthenticated) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        setShowLoginTooltip(true);
        setTimeout(() => setShowLoginTooltip(false), 2000);
      }
      return;
    }

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    try {
      await toggleFavorite(productId);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className={`
          relative
          flex items-center justify-center
          p-1
          transition-all duration-200
          group
          ${isAnimating ? 'scale-125' : 'scale-100'}
        `}
        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={`
            ${iconSizes[size]}
            transition-all duration-200
            drop-shadow-sm
            ${favorite
              ? 'fill-white text-white drop-shadow-md'
              : 'text-gray-400 fill-none hover:text-white group-hover:text-white'
            }
            ${isAnimating ? 'scale-110' : 'scale-100'}
          `}
          strokeWidth={1.5}
        />
      </button>

      {/* Login tooltip */}
      {showLoginTooltip && showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          Sign in to save favorites
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;
