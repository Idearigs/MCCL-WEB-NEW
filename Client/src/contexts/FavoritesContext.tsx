import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserAuth } from './UserAuthContext';
import API_BASE_URL from '../config/api';

interface FavoriteProduct {
  favoriteId: string;
  notes?: string;
  favoritedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    category: string;
    inStock: boolean;
    sku: string;
    images: any[];
    image?: string;
  };
}

interface FavoritesContextType {
  favorites: FavoriteProduct[];
  favoritesCount: number;
  isLoading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  addFavorite: (productId: string, notes?: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, user } = useUserAuth();

  // Fetch favorites when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      refreshFavorites();
    } else {
      // Clear favorites when user logs out
      setFavorites([]);
    }
  }, [isAuthenticated]);

  // API helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('user_access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  };

  // Fetch all favorites
  const refreshFavorites = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await apiCall('/favorites');
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if product is in favorites
  const isFavorite = (productId: string): boolean => {
    return favorites.some(fav => fav.product.id === productId);
  };

  // Add to favorites
  const addFavorite = async (productId: string, notes?: string) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to add favorites');
    }

    try {
      const response = await apiCall('/favorites', {
        method: 'POST',
        body: JSON.stringify({ productId, notes }),
      });

      // Refresh favorites list
      await refreshFavorites();

      return response.data;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      throw error;
    }
  };

  // Remove from favorites
  const removeFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to manage favorites');
    }

    try {
      await apiCall(`/favorites/${productId}`, {
        method: 'DELETE',
      });

      // Update local state immediately for better UX
      setFavorites(prev => prev.filter(fav => fav.product.id !== productId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      throw error;
    }
  };

  // Toggle favorite (add if not exists, remove if exists)
  const toggleFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to save favorites');
    }

    try {
      const response = await apiCall(`/favorites/toggle/${productId}`, {
        method: 'POST',
      });

      // Refresh favorites to get updated list
      await refreshFavorites();

      return response.data;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  };

  const value: FavoritesContextType = {
    favorites,
    favoritesCount: favorites.length,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// Custom hook to use favorites context
export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);

  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }

  return context;
};
