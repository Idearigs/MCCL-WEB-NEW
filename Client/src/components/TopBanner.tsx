import React from "react";

const TopBanner = (): JSX.Element => {
  return (
    <div className="bg-gray-900 text-white text-xs font-light">
      <div className="flex items-center justify-center px-4 py-2">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-center">
          <span className="uppercase tracking-wider">Free Worldwide Delivery</span>
          <span className="hidden md:inline text-gray-300">|</span>
          <span className="uppercase tracking-wider">30 Day Returns / 60 Day Exchange</span>
          <span className="hidden md:inline text-gray-300">|</span>
          <span className="uppercase tracking-wider">5 Year Warranty</span>
          <span className="hidden md:inline text-gray-300">|</span>
          <span className="uppercase tracking-wider">0% APR Finance</span>
          <span className="hidden md:inline text-gray-300">|</span>
          <span className="uppercase tracking-wider">UK Handcrafted</span>
        </div>
      </div>
    </div>
  );
};

export default TopBanner;