import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useCart } from '../contexts/CartContext';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    image: string;
    price?: string | number;
    metal?: string;
    size?: string;
  };
  className?: string;
  variant?: 'default' | 'compact';
  onSuccess?: () => void;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  className = "",
  variant = 'default',
  onSuccess
}) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const formatPrice = (price: string | number | undefined): string => {
    if (!price) return "£0.00";
    if (typeof price === 'string') {
      // If already has £ symbol, return as is
      if (price.includes('£')) return price;
      // Otherwise format with £
      const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      return `£${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    // It's a number
    return `£${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    try {
      addToCart({
        id: product.id,
        name: product.name,
        price: formatPrice(product.price),
        metal: product.metal || "Not specified",
        size: product.size || "One size",
        image: product.image
      });

      // Call success callback if provided
      onSuccess?.();

      // Reset after animation
      setTimeout(() => setIsAdding(false), 300);
    } catch (error) {
      setIsAdding(false);
      console.error('Error adding to cart:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className={`text-xs uppercase tracking-widest font-light text-gray-900 hover:text-gray-600 transition-colors disabled:opacity-50 ${className}`}
      >
        {isAdding ? 'Adding...' : 'Add to Bag'}
      </button>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding}
      className={`bg-[#f4e6c8] hover:bg-[#f0ddb0] text-gray-900 font-cormorant font-medium uppercase tracking-wider text-xs border-0 transition-all duration-300 disabled:opacity-70 ${className}`}
    >
      {isAdding ? 'Adding to Bag...' : 'Add to Bag'}
    </Button>
  );
};

export default AddToCartButton;