import React, { useState, useEffect } from "react";

const TopBanner = (): JSX.Element => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const bannerItems = [
    "FREE WORLDWIDE DELIVERY",
    "30 DAY RETURNS / 60 DAY EXCHANGE", 
    "5 YEAR WARRANTY",
    "0% APR FINANCE",
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
        <span className="uppercase tracking-wider">Free Worldwide Delivery</span>
        <span className="text-gray-400">|</span>
        <span className="uppercase tracking-wider">30 Day Returns / 60 Day Exchange</span>
        <span className="text-gray-400">|</span>
        <span className="uppercase tracking-wider">5 Year Warranty</span>
        <span className="text-gray-400">|</span>
        <span className="uppercase tracking-wider">0% APR Finance</span>
        <span className="text-gray-400">|</span>
        <span className="uppercase tracking-wider">UK Handcrafted</span>
      </div>
      
      {/* Mobile - Enhanced Pop Reveal Animation */}
      <div className="lg:hidden flex items-center justify-center h-full w-full">
        <div 
          key={currentBannerIndex}
          className="animate-pop-reveal text-center font-light uppercase tracking-wider"
        >
          {bannerItems[currentBannerIndex]}
        </div>
      </div>
    </div>
  );
};

export default TopBanner;