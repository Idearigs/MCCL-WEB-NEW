import React from 'react';
import { Button } from "@/components/ui/button";
import { X, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CartItem {
  id: string;
  name: string;
  price: string;
  metal: string;
  size: string;
  image: string;
  quantity: number;
}

interface CartSlideProps {
  isOpen: boolean;
  isVisible: boolean;
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (itemIndex: number, newQuantity: number) => void;
  onRemoveItem: (itemIndex: number) => void;
}

const CartSlide: React.FC<CartSlideProps> = ({
  isOpen,
  isVisible,
  cartItems,
  onClose,
  onUpdateQuantity,
  onRemoveItem
}) => {
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace('£', '').replace(',', ''));
      return total + (price * item.quantity);
    }, 0);
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
      
      {/* Cart Panel */}
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
          <h2 className="text-lg font-cormorant font-medium text-gray-900">
            Shopping Bag
          </h2>
          <span className="text-sm font-cormorant text-gray-600">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                  <path d="M3 6h18"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <p className="font-cormorant text-gray-900 mb-2">Your bag is empty</p>
              <p className="font-cormorant text-sm text-gray-600 mb-6">Discover our exquisite collection</p>
              <Button 
                onClick={onClose}
                className="bg-gray-900 hover:bg-gray-800 text-white font-cormorant font-medium uppercase tracking-wider text-xs px-6 py-2"
              >
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item, index) => (
                <div key={index} className="flex space-x-4 border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-cormorant font-medium text-gray-900 pr-2 leading-tight">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => onRemoveItem(index)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-600 font-cormorant">
                      {item.metal.charAt(0).toUpperCase() + item.metal.slice(1)} / Size {item.size}
                    </p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-cormorant text-gray-600">Qty:</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                            className="w-6 h-6 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-cormorant">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                            className="w-6 h-6 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <span className="text-sm font-cormorant font-medium text-gray-900">
                        {item.price}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="font-cormorant font-medium text-gray-900">Subtotal:</span>
              <span className="font-cormorant text-lg font-medium text-gray-900">
                £{getSubtotal().toLocaleString()}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Link to="/cart" onClick={onClose}>
                <Button className="w-full h-12 bg-[#f4e6c8] hover:bg-[#f0ddb0] text-gray-900 font-cormorant font-medium uppercase tracking-wider text-xs border-0">
                  View Bag
                </Button>
              </Link>
              <Link to="/checkout" onClick={onClose}>
                <Button className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-cormorant font-medium uppercase tracking-wider text-xs border-0">
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartSlide;