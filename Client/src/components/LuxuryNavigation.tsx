import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import TopBanner from "./TopBanner";

const LuxuryNavigation = (): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          {/* Desktop Navigation */}
          <div className="hidden lg:block max-w-7xl mx-auto px-8">
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
                <div className="flex items-center justify-center space-x-6 lg:space-x-8 xl:space-x-10">
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

          {/* Mobile Navigation */}
          <div className="lg:hidden px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left - Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Menu className={`w-5 h-5 transition-colors duration-300 ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                }`} />
              </button>

              {/* Center - Minimal Logo/Brand */}
              <div className="flex-1 flex justify-center">
                <Link to="/" className="flex flex-col items-center">
                  <div className={`text-lg font-serif tracking-[0.2em] uppercase transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`}>
                    McCulloch
                  </div>
                  <div className={`text-[10px] font-serif tracking-[0.3em] uppercase transition-colors duration-300 ${
                    isScrolled ? 'text-gray-500' : 'text-white/70'
                  }`}>
                    Jewellers
                  </div>
                </Link>
              </div>

              {/* Right - Minimal Actions */}
              <div className="flex items-center space-x-2">
                {/* Search */}
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                  <svg className={`w-4 h-4 transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>

                {/* Shopping Bag */}
                <button className="p-2 rounded-full hover:bg-white/10 transition-colors relative">
                  <svg className={`w-4 h-4 transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu - Elegant Full Screen Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50">
          <div className="h-full overflow-y-auto">
            {/* Mobile Header - Minimal */}
            <div className="border-b border-gray-100 px-4 py-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <div className="text-xl font-serif tracking-[0.2em] uppercase text-gray-900">
                    McCulloch
                  </div>
                  <div className="text-xs font-serif tracking-[0.3em] uppercase text-gray-500 mt-1">
                    Jewellers • London
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          
            <nav className="px-4 py-6 overflow-y-auto">
              {/* Main Categories - Clean Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Engagement */}
                <Link
                  to="/engagement"
                  className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <span className="text-2xl">💍</span>
                  </div>
                  <span className="text-sm font-serif text-gray-800 tracking-wide">Engagement</span>
                </Link>

                {/* Wedding */}
                <Link
                  to="/wedding"
                  className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <span className="text-2xl">💒</span>
                  </div>
                  <span className="text-sm font-serif text-gray-800 tracking-wide">Wedding</span>
                </Link>

                {/* Diamonds */}
                <Link
                  to="/diamonds"
                  className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <span className="text-2xl">💎</span>
                  </div>
                  <span className="text-sm font-serif text-gray-800 tracking-wide">Diamonds</span>
                </Link>

                {/* Jewellery */}
                <Link
                  to="/jewellery"
                  className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <span className="text-2xl">✨</span>
                  </div>
                  <span className="text-sm font-serif text-gray-800 tracking-wide">Jewellery</span>
                </Link>

                {/* Watches */}
                <Link
                  to="/watches"
                  className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <span className="text-2xl">⌚</span>
                  </div>
                  <span className="text-sm font-serif text-gray-800 tracking-wide">Watches</span>
                </Link>

                {/* Heritage */}
                <Link
                  to="/heritage"
                  className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                    <span className="text-2xl">🏛️</span>
                  </div>
                  <span className="text-sm font-serif text-gray-800 tracking-wide">Heritage</span>
                </Link>
              </div>

              {/* Additional Links - Minimal */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex flex-col space-y-4">
                  <Link
                    to="/contact"
                    className="text-center py-3 text-sm font-serif text-gray-700 hover:text-gray-900 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default LuxuryNavigation;