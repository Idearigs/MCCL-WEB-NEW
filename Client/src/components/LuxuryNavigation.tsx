import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import TopBanner from "./TopBanner";

const LuxuryNavigation = (): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBanner />
        <nav 
          className={`transition-all duration-300 ${
            isScrolled 
              ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
              : 'bg-transparent'
          }`}
        >
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col items-center py-6">
              {/* Top Row - Logo Center */}
              <div className="flex items-center justify-between w-full mb-6">
                {/* Left side */}
                <div className="flex items-center space-x-4 min-w-[120px]">
                  <span className={`text-xs uppercase tracking-widest transition-colors duration-300 ${
                    isScrolled ? 'text-gray-600' : 'text-white/70'
                  }`}>UK</span>
                </div>

                {/* Center Logo */}
                <div className="flex-1 flex justify-center mx-12">
                  <Link to="/" className="flex flex-col items-center">
                    <div className={`text-2xl font-serif font-light tracking-[0.3em] uppercase transition-colors duration-300 ${
                      isScrolled ? 'text-gray-900' : 'text-white'
                    }`}>
                      McCulloch
                    </div>
                    <div className={`text-sm font-light tracking-[0.5em] uppercase transition-colors duration-300 ${
                      isScrolled ? 'text-gray-600' : 'text-white/80'
                    }`}>
                      Jewellers
                    </div>
                  </Link>
                </div>

                {/* Right Icons */}
                <div className="flex items-center space-x-4 min-w-[120px] justify-end">
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </div>
              </div>

              {/* Bottom Row - Navigation Links */}
              <div className="w-full flex items-center justify-center mt-1">
                <div className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8 xl:space-x-10">
                  <Link 
                    to="/engagement" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Engagement
                  </Link>
                  <Link 
                    to="/wedding" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Wedding
                  </Link>
                  <Link 
                    to="/diamonds" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Diamonds
                  </Link>
                  <Link 
                    to="/jewellery" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Jewellery
                  </Link>
                  <Link 
                    to="/watches" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Watches
                  </Link>
                  <Link 
                    to="/heritage" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Our Heritage
                  </Link>
                  <Link 
                    to="/contact" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`}
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default LuxuryNavigation;