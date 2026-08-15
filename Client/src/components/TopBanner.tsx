import React, { useState, useEffect } from "react";

const TopBanner = (): JSX.Element => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const bannerItems = [
    "FREE INSURED UK DELIVERY",
    "30 DAY RETURNS",
    "1 YEAR WARRANTY",
    "UK HANDCRAFTED"
  ];

  // Mobile banner animation - cycle through items
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerItems.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [bannerItems.length]);

  return (
    <div className="bg-[#2d2d2d] text-white text-xs font-light h-7 flex items-center justify-center">
      {/* Desktop - Static Layout */}
      <div className="hidden lg:flex items-center justify-center gap-x-8 w-full px-4">
        <span className="uppercase tracking-wider">Free Insured UK Delivery</span>
        <span className="text-gray-400">|</span>
        <span className="uppercase tracking-wider">30 Day Returns</span>
        <span className="text-gray-400">|</span>
        <span className="uppercase tracking-wider">1 Year Warranty</span>
        <span className="text-gray-400">|</span>
        <span className="uppercase tracking-wider">UK Handcrafted</span>
      </div>
      
      {/* Mobile - Enhanced Pop Reveal Animation */}
      <div className="lg:hidden flex items-center justify-center h-full w-full">
        <div 
          key={currentBannerIndex}
          className="animate-pop-reveal text-center font-cormorant font-light uppercase tracking-wider"
        >
          {bannerItems[currentBannerIndex]}
        </div>
      </div>
    </div>
  );
};

export default TopBanner;