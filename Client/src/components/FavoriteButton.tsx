import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useUserAuth } from '../contexts/UserAuthContext';

interface FavoriteButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onAuthRequired?: () => void; // Callback to open auth modal
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  productId,
  size = 'md',
  showTooltip = true,
  onAuthRequired,
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useUserAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoginTooltip, setShowLoginTooltip] = useState(false);

  const favorite = isFavorite(productId);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
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
          ${sizeClasses[size]}
          relative
          flex items-center justify-center
          rounded-full
          bg-white/90 backdrop-blur-sm
          border border-gray-200
          hover:border-rose-300
          hover:bg-rose-50/80
          transition-all duration-200
          group
          shadow-sm hover:shadow-md
          ${isAnimating ? 'scale-110' : 'scale-100'}
        `}
        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart
          className={`
            ${iconSizes[size]}
            transition-all duration-200
            ${favorite
              ? 'fill-rose-500 text-rose-500'
              : 'text-gray-400 group-hover:text-rose-500 group-hover:fill-rose-100'
            }
            ${isAnimating ? 'scale-125' : 'scale-100'}
          `}
        />

        {/* Pulse effect when favoriting */}
        {isAnimating && favorite && (
          <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-75" />
        )}
      </button>

      {/* Login tooltip */}
      {showLoginTooltip && showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          Sign in to save favorites
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}

      {/* Hover tooltip */}
      {showTooltip && !showLoginTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {favorite ? 'Remove from favorites' : 'Add to favorites'}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;
