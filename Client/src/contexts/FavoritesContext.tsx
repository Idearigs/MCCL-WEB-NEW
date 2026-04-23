import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { useUserAuth } from './UserAuthContext';
import API_BASE_URL from '../config/api';

const LOCAL_FAVORITES_KEY = 'mcculloch_wishlist';

interface LocalFavorite {
  productId: string;
  name: string;
  image?: string;
  addedAt: string;
}

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
  localFavorites: LocalFavorite[];
  favoritesCount: number;
  isLoading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string, productName?: string, imageUrl?: string) => Promise<void>;
  addFavorite: (productId: string, notes?: string, imageUrl?: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [localFavorites, setLocalFavorites] = useState<LocalFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const { isAuthenticated } = useUserAuth();

  // Load localStorage favorites on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
      if (stored) setLocalFavorites(JSON.parse(stored));
    } catch {}
  }, []);

  // Sync to API when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      refreshFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated]);

  const showToast = (message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('user_access_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'API request failed');
    return data;
  };

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

  const isFavorite = (productId: string): boolean => {
    if (isAuthenticated) {
      return favorites.some(fav => fav.product.id === productId);
    }
    return localFavorites.some(fav => fav.productId === productId);
  };

  const addFavorite = async (productId: string, notes?: string, imageUrl?: string) => {
    if (!isAuthenticated) {
      const already = localFavorites.some(f => f.productId === productId);
      if (!already) {
        const updated = [...localFavorites, { productId, name: '', image: imageUrl, addedAt: new Date().toISOString() }];
        setLocalFavorites(updated);
        localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updated));
      }
      return;
    }
    await apiCall('/favorites', { method: 'POST', body: JSON.stringify({ productId, notes }) });
    await refreshFavorites();
  };

  const removeFavorite = async (productId: string) => {
    if (!isAuthenticated) {
      const updated = localFavorites.filter(f => f.productId !== productId);
      setLocalFavorites(updated);
      localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updated));
      return;
    }
    await apiCall(`/favorites/${productId}`, { method: 'DELETE' });
    setFavorites(prev => prev.filter(fav => fav.product.id !== productId));
  };

  const toggleFavorite = async (productId: string, productName?: string, imageUrl?: string) => {
    if (!isAuthenticated) {
      const existing = localFavorites.find(f => f.productId === productId);
      if (existing) {
        const updated = localFavorites.filter(f => f.productId !== productId);
        setLocalFavorites(updated);
        localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updated));
        showToast(`${productName || 'Item'} removed from wishlist`);
      } else {
        const updated = [...localFavorites, { productId, name: productName || '', image: imageUrl, addedAt: new Date().toISOString() }];
        setLocalFavorites(updated);
        localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(updated));
        showToast(`${productName || 'Item'} added to your wishlist`);
      }
      return;
    }

    try {
      const response = await apiCall(`/favorites/toggle/${productId}`, { method: 'POST' });
      await refreshFavorites();
      const isNowFavorite = response.data?.action === 'added';
      showToast(isNowFavorite
        ? `${productName || 'Item'} added to your wishlist`
        : `${productName || 'Item'} removed from wishlist`
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      localFavorites,
      favoritesCount: isAuthenticated ? favorites.length : localFavorites.length,
      isLoading,
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      refreshFavorites,
    }}>
      {children}

      {/* Wishlist toast — bottom-left */}
      <div
        className={`fixed bottom-6 left-6 z-[9999] flex items-center gap-3 bg-gray-900 text-white px-4 py-3 shadow-xl max-w-xs pointer-events-none transition-all duration-300 ${
          toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <Heart className="w-4 h-4 fill-red-400 text-red-400 flex-shrink-0" strokeWidth={1.5} />
        <p className="text-sm font-inter font-light leading-snug">{toast.message}</p>
      </div>
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
};
