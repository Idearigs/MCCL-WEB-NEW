import React, { useState } from "react";
import LuxuryNavigation from "../components/LuxuryNavigation";
import { FooterSection } from "../components/FooterSection";
import { Link } from "react-router-dom";
import { Plus, Minus, X, ChevronRight, Heart, Shield, Truck, RotateCcw } from "lucide-react";

const Cart = (): JSX.Element => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "Raindance Classic Platinum Diamond Ring",
      price: "£11,000",
      metal: "Platinum",
      size: "M",
      image: "/images/Engagement.png",
      quantity: 1,
      inStock: true
    },
    {
      id: 2,
      name: "Diamond Tennis Necklace",
      price: "£4,200",
      metal: "White Gold",
      size: "16 inches",
      image: "/images/Diamonds.jpg",
      quantity: 2,
      inStock: true
    },
    {
      id: 3,
      name: "Pearl Drop Earrings",
      price: "£850",
      metal: "Yellow Gold",
      size: "One Size",
      image: "/images/Jewellery.jpg",
      quantity: 1,
      inStock: false
    }
  ]);

  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev => 
        prev.map(item => 
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = (id: number) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const getItemTotal = (price: string, quantity: number) => {
    const numericPrice = parseFloat(price.replace('£', '').replace(',', ''));
    return numericPrice * quantity;
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + getItemTotal(item.price, item.quantity);
    }, 0);
  };

  const getShipping = () => {
    return getSubtotal() > 1000 ? 0 : 50;
  };

  const getDiscount = () => {
    return isPromoApplied ? getSubtotal() * 0.1 : 0;
  };

  const getTotal = () => {
    return getSubtotal() + getShipping() - getDiscount();
  };

  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === "LUXURY10") {
      setIsPromoApplied(true);
    }
  };

  const removePromoCode = () => {
    setIsPromoApplied(false);
    setPromoCode("");
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <div className="flex items-center text-sm text-gray-500 font-inter font-light">
              <Link to="/" className="hover:text-gray-700 cursor-pointer transition-colors">Home</Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-gray-900">Shopping Bag</span>
            </div>
          </nav>

          {/* Page Title */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-4 font-cormorant">
              Shopping Bag
            </h1>
            <p className="text-base text-gray-600 font-cormorant">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your bag
            </p>
          </div>

          {cartItems.length === 0 ? (
            /* Empty Cart */
            <div className="text-center py-16">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-light text-gray-900 mb-4 font-cormorant">Your bag is empty</h2>
                <p className="text-gray-600 font-cormorant mb-8">Discover our exquisite collection of fine jewelry</p>
              </div>
              <Link 
                to="/products"
                className="inline-block bg-gray-900 text-white px-8 py-3 font-inter font-light uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            /* Cart Content */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Cart Items - Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {cartItems.map((item) => (
                  <div key={item.id} className="border-b border-gray-200 pb-8 last:border-b-0">
                    <div className="flex space-x-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-32 h-32 bg-gray-50 rounded overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between">
                          <div className="space-y-2">
                            <h3 className="text-lg font-cormorant font-normal text-gray-900 leading-tight">
                              {item.name}
                            </h3>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600 font-inter font-light">
                                Metal: {item.metal}
                              </p>
                              <p className="text-sm text-gray-600 font-inter font-light">
                                Size: {item.size}
                              </p>
                              {!item.inStock && (
                                <p className="text-sm text-red-600 font-inter font-light">
                                  Currently out of stock
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors self-start"
                            aria-label="Remove item"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>

                        {/* Price and Quantity */}
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-cormorant font-medium text-gray-900">
                            {item.price}
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-inter text-gray-600 uppercase tracking-wider">Quantity:</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                disabled={!item.inStock}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-12 text-center text-sm font-cormorant">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                                disabled={!item.inStock}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="flex justify-between items-center pt-2">
                          <button className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors font-inter font-light">
                            <Heart className="w-4 h-4 mr-2" />
                            Add to Wishlist
                          </button>
                          <div className="text-lg font-cormorant font-medium text-gray-900">
                            £{getItemTotal(item.price, item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary - Right Column */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 p-6 sticky top-8">
                  <h2 className="text-xl font-cormorant font-medium text-gray-900 mb-6">
                    Order Summary
                  </h2>

                  {/* Promo Code */}
                  <div className="mb-6">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-800 font-inter text-sm"
                        disabled={isPromoApplied}
                      />
                      {isPromoApplied ? (
                        <button
                          onClick={removePromoCode}
                          className="px-4 py-3 bg-red-600 text-white font-inter font-light text-sm uppercase tracking-wider hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={applyPromoCode}
                          className="px-4 py-3 bg-gray-900 text-white font-inter font-light text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {isPromoApplied && (
                      <p className="text-sm text-green-600 mt-2 font-inter">
                        Promo code "LUXURY10" applied - 10% discount
                      </p>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-inter text-gray-600 font-light">Subtotal</span>
                      <span className="font-cormorant text-gray-900">£{getSubtotal().toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="font-inter text-gray-600 font-light">
                        Shipping {getShipping() === 0 && "(Free)"}
                      </span>
                      <span className="font-cormorant text-gray-900">
                        {getShipping() === 0 ? "Free" : `£${getShipping()}`}
                      </span>
                    </div>

                    {isPromoApplied && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="font-inter font-light">Discount (10%)</span>
                        <span className="font-cormorant">-£{getDiscount().toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-300 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-cormorant font-medium text-gray-900 text-lg">Total</span>
                        <span className="font-cormorant font-medium text-gray-900 text-xl">
                          £{getTotal().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Buttons */}
                  <div className="space-y-3 mb-6">
                    <Link
                      to="/checkout"
                      className={`block w-full h-12 bg-gray-900 text-white font-inter font-light uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors flex items-center justify-center ${
                        cartItems.some(item => !item.inStock) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                      }`}
                    >
                      Proceed to Checkout
                    </Link>
                    <Link
                      to="/products"
                      className="block w-full h-12 border border-gray-300 text-gray-900 font-inter font-light uppercase tracking-wider text-sm hover:border-gray-800 transition-colors flex items-center justify-center"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  {/* Trust Badges */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-4 h-4 text-gray-600" />
                      <span className="font-inter text-gray-600 font-light">Secure Checkout</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Truck className="w-4 h-4 text-gray-600" />
                      <span className="font-inter text-gray-600 font-light">Free Worldwide Delivery</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RotateCcw className="w-4 h-4 text-gray-600" />
                      <span className="font-inter text-gray-600 font-light">30 Day Returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default Cart;