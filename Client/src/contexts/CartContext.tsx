import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: string;
  metal: string;
  size: string;
  image: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  isCartVisible: boolean;
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  updateQuantity: (itemIndex: number, newQuantity: number) => void;
  removeItem: (itemIndex: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getCartCount: () => number;
  getSubtotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'mcculloch_cart_items';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        setCartItems(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cartItems, isHydrated]);

  const addToCart = (newItem: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(item =>
        item.id === newItem.id &&
        item.metal === newItem.metal &&
        item.size === newItem.size
      );

      if (existingItem) {
        return prev.map(item =>
          item === existingItem
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...newItem, quantity: 1 }];
      }
    });

    // Open cart when item is added
    openCart();
  };

  const updateQuantity = (itemIndex: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemIndex);
    } else {
      setCartItems(prev =>
        prev.map((item, index) =>
          index === itemIndex
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeItem = (itemIndex: number) => {
    setCartItems(prev => prev.filter((_, index) => index !== itemIndex));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = () => {
    setIsCartVisible(true);
    setTimeout(() => setIsCartOpen(true), 50);
  };

  const closeCart = () => {
    setIsCartOpen(false);
    setTimeout(() => setIsCartVisible(false), 300);
  };

  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace('£', '').replace(',', ''));
      return total + (price * item.quantity);
    }, 0);
  };

  const value: CartContextType = {
    cartItems,
    isCartOpen,
    isCartVisible,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    getCartCount,
    getSubtotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};