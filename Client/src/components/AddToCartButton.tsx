import React from 'react';
import { Button } from "@/components/ui/button";
import { useCart } from '../contexts/CartContext';

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    image: string;
  };
  className?: string;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({ product, className = "" }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      name: product.name,
      price: "£2,500", // Default price for demo
      metal: "Platinum",
      size: "M",
      image: product.image
    });
  };

  return (
    <Button
      onClick={handleAddToCart}
      className={`bg-[#f4e6c8] hover:bg-[#f0ddb0] text-gray-900 font-cormorant font-medium uppercase tracking-wider text-xs border-0 transition-all duration-300 ${className}`}
    >
      Add to Bag
    </Button>
  );
};

export default AddToCartButton;