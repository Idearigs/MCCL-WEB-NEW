import React, { useState } from "react";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import { FooterSection } from "../components/FooterSection";
import { Link } from "react-router-dom";
import { Plus, Minus, X } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { getMediaUrl } from "../config/api";

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

  const formatPrice = (amount: number) => {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />

      <main className="flex-1 pt-32 lg:pt-48 pb-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 lg:mb-14">
            <h1 className="text-3xl lg:text-5xl font-light text-gray-900 mb-2 font-cormorant">
              Shopping Bag
            </h1>
            <p className="text-xs text-gray-400 font-inter font-light tracking-[0.15em] uppercase">
              {cartItems.length} {cartItems.length === 1 ? 'piece' : 'pieces'}
            </p>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                  <path d="M3 6h18"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <h2 className="text-xl font-light text-gray-900 mb-2 font-cormorant">Your bag is empty</h2>
              <p className="text-sm text-gray-400 font-inter font-light mb-8">Explore our collections</p>
              <Link
                to="/engagement-rings"
                className="inline-block border border-gray-900 text-gray-900 px-10 py-3 font-inter font-light uppercase tracking-[0.15em] text-[11px] hover:bg-gray-900 hover:text-white transition-all duration-300"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            <div className="lg:grid lg:grid-cols-12 lg:gap-12">
              {/* Items Column */}
              <div className="lg:col-span-7">
                {/* Column header - desktop */}
                <div className="hidden lg:flex items-center justify-between pb-4 border-b border-gray-200 mb-0">
                  <span className="text-[10px] font-inter font-light text-gray-400 uppercase tracking-[0.15em]">Product</span>
                  <span className="text-[10px] font-inter font-light text-gray-400 uppercase tracking-[0.15em]">Total</span>
                </div>

                {cartItems.map((item, index) => (
                  <div
                    key={`${item.id}-${item.metal}-${item.size}`}
                    className="py-6 lg:py-8 border-b border-gray-100"
                  >
                    {/* Mobile: stacked layout / Desktop: row */}
                    <div className="flex gap-5 lg:gap-8">
                      {/* Image */}
                      <Link
                        to={`/engagement-rings/${item.id}`}
                        className="flex-shrink-0 w-28 h-28 lg:w-32 lg:h-32 bg-gray-50 overflow-hidden"
                      >
                        <img
                          src={getMediaUrl(item.image)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        {/* Top: name + remove */}
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-base lg:text-lg font-cormorant font-normal text-gray-900 leading-snug">
                              {item.name}
                            </h3>
                            <button
                              onClick={() => removeItem(index)}
                              className="flex-shrink-0 text-gray-300 hover:text-gray-900 transition-colors mt-0.5"
                              aria-label="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Specs */}
                          <div className="mt-1.5 space-y-0.5">
                            {item.type === 'watch' ? (
                              <p className="text-[11px] text-gray-400 font-inter font-light">
                                {item.brand}{item.variant_name && ` — ${item.variant_name}`}
                              </p>
                            ) : (
                              <>
                                {item.metal && (
                                  <p className="text-[11px] text-gray-400 font-inter font-light">{item.metal}</p>
                                )}
                                {(item as any).diamondSize && (
                                  <p className="text-[11px] text-gray-400 font-inter font-light">Diamond Size {(item as any).diamondSize}</p>
                                )}
                                {item.size && (
                                  <p className="text-[11px] text-gray-400 font-inter font-light">{item.size}</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Bottom: qty + price */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-8 h-8 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-10 text-center text-sm font-inter font-light text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-inter font-light text-gray-900">
                            {formatPrice(getItemTotal(item.price, item.quantity))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Continue shopping */}
                <div className="pt-6 hidden lg:block">
                  <Link
                    to="/engagement-rings"
                    className="text-[11px] text-gray-400 font-inter font-light tracking-[0.1em] uppercase hover:text-gray-900 transition-colors"
                  >
                    ← Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Summary Column */}
              <div className="lg:col-span-5 mt-8 lg:mt-0">
                <div className="lg:sticky lg:top-48">
                  {/* Summary box */}
                  <div className="border border-gray-200 p-6 lg:p-8">
                    <h2 className="text-[11px] font-inter font-normal text-gray-900 uppercase tracking-[0.2em] mb-6 pb-4 border-b border-gray-200">
                      Summary
                    </h2>

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-inter font-light text-gray-500">Subtotal</span>
                        <span className="font-inter font-light text-gray-900">{formatPrice(getSubtotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-inter font-light text-gray-500">Shipping</span>
                        <span className="font-inter font-light text-gray-900">
                          {getShipping() === 0 ? 'Complimentary' : formatPrice(getShipping())}
                        </span>
                      </div>
                      {isPromoApplied && (
                        <div className="flex justify-between">
                          <span className="font-inter font-light text-green-700">Promo discount</span>
                          <span className="font-inter font-light text-green-700">−{formatPrice(getDiscount())}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-baseline mt-6 pt-5 border-t border-gray-200">
                      <span className="text-[11px] font-inter font-normal text-gray-900 uppercase tracking-[0.15em]">Total</span>
                      <span className="text-xl font-cormorant font-light text-gray-900">
                        {formatPrice(getTotal())}
                      </span>
                    </div>

                    {/* Promo code */}
                    <div className="mt-6 pt-5 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Promo code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 focus:outline-none focus:border-gray-400 font-inter text-xs bg-transparent placeholder-gray-300 tracking-wider"
                          disabled={isPromoApplied}
                        />
                        {isPromoApplied ? (
                          <button
                            onClick={removePromoCode}
                            className="flex-shrink-0 px-4 py-2.5 text-[10px] font-inter tracking-[0.15em] uppercase text-gray-500 hover:text-gray-900 border border-gray-200 transition-colors"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={applyPromoCode}
                            className="flex-shrink-0 px-4 py-2.5 text-[10px] font-inter tracking-[0.15em] uppercase text-gray-900 border border-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300"
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {isPromoApplied && (
                        <p className="text-[10px] text-green-700 font-inter font-light mt-2 tracking-wide">
                          LUXURY10 applied
                        </p>
                      )}
                    </div>

                    {/* Checkout */}
                    <div className="mt-6 space-y-3">
                      <Link
                        to="/checkout"
                        className="block w-full py-4 bg-gray-900 text-white font-inter font-light uppercase tracking-[0.2em] text-[11px] hover:bg-gray-800 transition-colors text-center"
                      >
                        Checkout
                      </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-6">
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span className="text-[9px] font-inter font-light tracking-wider uppercase">Secure</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5a2 2 0 01-2 2h-1"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                        <span className="text-[9px] font-inter font-light tracking-wider uppercase">Free over £1k</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-300">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
                        </svg>
                        <span className="text-[9px] font-inter font-light tracking-wider uppercase">Returns</span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile continue shopping */}
                  <div className="mt-6 text-center lg:hidden">
                    <Link
                      to="/engagement-rings"
                      className="text-[11px] text-gray-400 font-inter font-light tracking-[0.1em] uppercase hover:text-gray-900 transition-colors"
                    >
                      ← Continue Shopping
                    </Link>
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
