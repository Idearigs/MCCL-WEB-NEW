import React, { useState } from "react";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import { FooterSection } from "../components/FooterSection";
import { Link } from "react-router-dom";
import { Plus, Minus, X, ChevronRight, Heart, Shield, Truck, RotateCcw } from "lucide-react";
import { useCart } from "../contexts/CartContext";

const Cart = (): JSX.Element => {
  const { cartItems, updateQuantity, removeItem } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);

  const getItemTotal = (price: string | number, quantity: number) => {
    const priceStr = typeof price === 'number' ? price.toString() : price;
    const numericPrice = parseFloat(priceStr.replace('£', '').replace(',', ''));
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
      {/* White Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <Link to="/" className="flex flex-col items-start">
              <div className="text-xl font-serif font-light tracking-widest text-gray-900">
                McCulloch
              </div>
              <div className="text-xs font-light tracking-widest text-gray-600">
                Jewellers
              </div>
            </Link>

            {/* Right Icons */}
            <div className="flex items-center space-x-6">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              <Link to="/favorites" className="text-gray-600 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </Link>
              <button className="text-gray-600 hover:text-gray-900 transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                  <path d="M3 6h18"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          {/* Minimal Header with Luxury Wording */}
          <div className="mb-16 text-center">
            <h1 className="text-5xl lg:text-6xl font-light text-gray-900 mb-4 font-cormorant tracking-wide">
              Your Collection
            </h1>
            <p className="text-sm text-gray-500 font-inter font-light tracking-widest uppercase">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} selected
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
                <h2 className="text-2xl font-light text-gray-900 mb-4 font-cormorant">Your collection is empty</h2>
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">
              {/* Cart Items - Left Column */}
              <div className="lg:col-span-7 space-y-12">
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${item.metal}-${item.size}`} className={`pb-8 ${index !== cartItems.length - 1 ? 'border-b border-gray-200' : ''}`}>
                    <div className="flex gap-8">
                      {/* Product Image - Minimal */}
                      <div className="flex-shrink-0 w-40 h-40 bg-white border border-gray-200 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Details - Refined */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <h3 className="text-lg font-cormorant font-light text-gray-900 mb-3 leading-relaxed">
                                {item.name}
                              </h3>
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 font-inter font-light tracking-wide uppercase">
                                  {item.type === 'watch' ? (
                                    <>
                                      {item.brand && <span>{item.brand}</span>}
                                      {item.variant_name && <span> • {item.variant_name}</span>}
                                    </>
                                  ) : (
                                    <>
                                      {item.metal && <span>{item.metal}</span>}
                                      {item.size && <span> • {item.size}</span>}
                                    </>
                                  )}
                                </p>
                                {/* Display Nivoda stone options if available */}
                                {item.selectedOptions?.stoneType && (
                                  <p className="text-xs text-gray-500 font-inter font-light tracking-wide">
                                    <span className="block">
                                      Stone: {item.selectedOptions.stoneType}
                                      {item.selectedOptions.carat && `, ${item.selectedOptions.carat} carat`}
                                    </span>
                                    {item.selectedOptions.clarity && (
                                      <span className="block">
                                        Clarity: {item.selectedOptions.clarity}
                                      </span>
                                    )}
                                    {item.selectedOptions.colour && (
                                      <span className="block">
                                        Colour: {item.selectedOptions.colour}
                                      </span>
                                    )}
                                    {item.selectedOptions.cut && (
                                      <span className="block">
                                        Cut: {item.selectedOptions.cut}
                                      </span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Remove Button - Minimal */}
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                              aria-label="Remove item"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Price and Controls */}
                        <div className="flex items-end justify-between">
                          <div className="text-sm font-inter text-gray-600 font-light">
                            {typeof item.price === 'number' ? `£${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : item.price}
                          </div>

                          {/* Quantity Controls - Minimal */}
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-cormorant text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <div className="text-sm font-cormorant font-medium text-gray-900 ml-4 w-20 text-right">
                              £{getItemTotal(item.price, item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary - Right Column */}
              <div className="lg:col-span-5">
                <div className="sticky top-32 space-y-8">
                  {/* Price Summary - Minimal */}
                  <div className="space-y-6 pb-8 border-b border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase">Subtotal</span>
                      <span className="text-sm font-cormorant text-gray-900">£{getSubtotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase">
                        {getShipping() === 0 ? "Shipping (Free)" : "Shipping"}
                      </span>
                      <span className="text-sm font-cormorant text-gray-900">
                        {getShipping() === 0 ? "—" : `£${getShipping()}`}
                      </span>
                    </div>

                    {isPromoApplied && (
                      <div className="flex justify-between">
                        <span className="text-xs font-inter text-green-600 font-light tracking-wide uppercase">Discount</span>
                        <span className="text-sm font-cormorant text-green-600">-£{getDiscount().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>

                  {/* Total - Bold */}
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-inter text-gray-500 font-light tracking-wide uppercase">Total</span>
                    <span className="text-3xl font-cormorant font-light text-gray-900">
                      £{getTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Promo Code */}
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 px-0 py-2 border-b border-gray-300 focus:outline-none focus:border-gray-800 font-inter text-sm bg-transparent placeholder-gray-400"
                        disabled={isPromoApplied}
                      />
                      {isPromoApplied ? (
                        <button
                          onClick={removePromoCode}
                          className="text-xs text-gray-600 hover:text-gray-900 transition-colors font-inter font-light tracking-wide uppercase"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={applyPromoCode}
                          className="text-xs text-gray-600 hover:text-gray-900 transition-colors font-inter font-light tracking-wide uppercase"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {isPromoApplied && (
                      <p className="text-xs text-green-600 font-inter font-light">
                        LUXURY10 applied
                      </p>
                    )}
                  </div>

                  {/* Checkout Button */}
                  <Link
                    to="/checkout"
                    className="block w-full py-4 bg-gray-900 text-white font-inter font-light uppercase tracking-wider text-xs hover:bg-gray-800 transition-colors text-center"
                  >
                    Proceed to Checkout
                  </Link>

                  <Link
                    to="/products"
                    className="block w-full py-4 border border-gray-300 text-gray-900 font-inter font-light uppercase tracking-wider text-xs hover:border-gray-800 transition-colors text-center"
                  >
                    Continue Shopping
                  </Link>

                  {/* Trust Info - Minimal */}
                  <div className="pt-4 space-y-4 text-center">
                    <p className="text-xs text-gray-500 font-inter font-light">
                      Secure checkout with encryption
                    </p>
                    <p className="text-xs text-gray-500 font-inter font-light">
                      Free delivery on orders over £1,000 • Easy returns
                    </p>
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
