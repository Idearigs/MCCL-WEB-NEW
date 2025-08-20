import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp, Calendar, Phone, Mail, HelpCircle } from "lucide-react";
import TopBanner from "./TopBanner";
import CartSlide from "./CartSlide";
import SearchOverlay from "./SearchOverlay";
import { useCart } from "../contexts/CartContext";
import { useIsMobile } from "../hooks/use-mobile";

const LuxuryNavigation = (): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [engagementHover, setEngagementHover] = useState(false);
  
  // Cart context
  const { 
    cartItems, 
    isCartOpen, 
    isCartVisible, 
    openCart, 
    closeCart, 
    updateQuantity, 
    removeItem, 
    getCartCount 
  } = useCart();

  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Functions for mobile menu animation
  const openMobileMenu = () => {
    setMobileMenuVisible(true);
    setTimeout(() => setMobileMenuOpen(true), 10);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      setMobileMenuVisible(false);
      setExpandedSection(null);
    }, 200);
  };

  // Functions for search
  const openSearch = () => {
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBanner />
        <nav 
          className={`relative transition-all duration-300 ${
            engagementHover
              ? 'bg-white shadow-lg'
              : isScrolled 
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
                    engagementHover || isScrolled ? 'text-gray-600' : 'text-white/70'
                  }`}>UK</span>
                </div>

                {/* Center Logo */}
                <div className="flex-1 flex justify-center mx-12">
                  <Link to="/" className="flex flex-col items-center">
                    <div className={`text-2xl font-serif font-light tracking-[0.3em] uppercase transition-colors duration-300 ${
                      engagementHover || isScrolled ? 'text-gray-900' : 'text-white'
                    }`}>
                      McCulloch
                    </div>
                    <div className={`text-sm font-light tracking-[0.5em] uppercase transition-colors duration-300 ${
                      engagementHover || isScrolled ? 'text-gray-600' : 'text-white/80'
                    }`}>
                      Jewellers
                    </div>
                  </Link>
                </div>

                {/* Right Icons */}
                <div className="flex items-center space-x-4 min-w-[120px] justify-end">
                  <button onClick={openSearch}>
                    <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                      engagementHover || isScrolled 
                        ? 'text-gray-600 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </button>
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    engagementHover || isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="12" cy="8" r="5"/>
                    <path d="M20 21a8 8 0 1 0-16 0"/>
                  </svg>
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    engagementHover || isScrolled 
                      ? 'text-gray-600 hover:text-gray-900' 
                      : 'text-white hover:text-white/80'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <button 
                    onClick={openCart}
                    className="relative"
                  >
                    <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                      engagementHover || isScrolled 
                        ? 'text-gray-600 hover:text-gray-900' 
                        : 'text-white hover:text-white/80'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                      <path d="M3 6h18"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    {getCartCount() > 0 && (
                      <span className={`absolute -top-2 -right-2 w-4 h-4 rounded-full text-xs flex items-center justify-center font-medium ${
                        engagementHover || isScrolled 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-white text-gray-900'
                      }`}>
                        {getCartCount()}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Row - Navigation Links */}
              <div className="w-full flex items-center justify-center mt-1">
                <div className="flex items-center justify-center space-x-6 lg:space-x-8 xl:space-x-10">
                  <div 
                    className="relative"
                    onMouseEnter={() => setEngagementHover(true)}
                    onMouseLeave={() => setEngagementHover(false)}
                  >
                    <Link 
                      to="/engagement" 
                      className={`text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                        engagementHover || isScrolled 
                          ? 'text-gray-700 hover:text-gray-900' 
                          : 'text-white hover:text-white/80'
                      }`}
                    >
                      Engagement
                    </Link>
                    
                    {/* Engagement Dropdown */}
                    {engagementHover && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 w-screen max-w-6xl bg-white shadow-xl border-t border-gray-100 z-50">
                        <div className="px-8 py-12">
                          <div className="grid grid-cols-4 gap-12">
                            {/* RING TYPES Column */}
                            <div>
                              <h3 className="text-xs font-inter font-medium text-gray-900 uppercase tracking-wider mb-6">RING TYPES</h3>
                              <div className="space-y-4">
                                <Link to="/wedding-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Wedding</Link>
                                <Link to="/engagement-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Engagement</Link>
                                <Link to="/vintage-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Vintage</Link>
                                <Link to="/promise-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Promise</Link>
                                <Link to="/wishbone-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Wishbone</Link>
                                <Link to="/stacking-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Stacking</Link>
                                <Link to="/cocktail-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Cocktail</Link>
                                <Link to="/bridal-sets" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Bridal sets</Link>
                                <Link to="/mens-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Men's Rings</Link>
                                <Link to="/all-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">All Rings</Link>
                              </div>
                            </div>

                            {/* GEMSTONE Column */}
                            <div>
                              <h3 className="text-xs font-inter font-medium text-gray-900 uppercase tracking-wider mb-6">GEMSTONE</h3>
                              <div className="space-y-4">
                                <Link to="/mined-diamond" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Mined Diamond</Link>
                                <Link to="/lab-grown-diamond" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Lab Grown Diamond</Link>
                                <Link to="/sapphire" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Sapphire</Link>
                                <Link to="/emerald" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Emerald</Link>
                                <Link to="/ruby" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Ruby</Link>
                                <Link to="/aquamarine" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Aquamarine</Link>
                                <Link to="/tanzanite" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Tanzanite</Link>
                                <Link to="/blue-topaz" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Blue Topaz</Link>
                              </div>
                            </div>

                            {/* ETERNITY RINGS Column */}
                            <div>
                              <h3 className="text-xs font-inter font-medium text-gray-900 uppercase tracking-wider mb-6">ETERNITY RINGS</h3>
                              <div className="space-y-4">
                                <Link to="/diamond-full-band" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Diamond Full Band</Link>
                                <Link to="/diamond-half-band" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Diamond Half Band</Link>
                                <Link to="/unique-eternity-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Unique Eternity Rings</Link>
                                <Link to="/sapphire-eternity" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Sapphire</Link>
                                <Link to="/emerald-eternity" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Emerald</Link>
                                <Link to="/ruby-eternity" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Ruby</Link>
                                <Link to="/mens-eternity-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Men's Eternity Rings</Link>
                                <Link to="/all-eternity-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">All Eternity Rings</Link>
                              </div>
                            </div>

                            {/* METALS & Image Column */}
                            <div>
                              <h3 className="text-xs font-inter font-medium text-gray-900 uppercase tracking-wider mb-6">METALS</h3>
                              <div className="space-y-4 mb-8">
                                <Link to="/yellow-gold" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Yellow Gold</Link>
                                <Link to="/white-gold" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">White Gold</Link>
                                <Link to="/platinum" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Platinum</Link>
                                <Link to="/silver" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Silver</Link>
                                <Link to="/gold-vermeil" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Gold Vermeil</Link>
                              </div>
                              
                              {/* Ring Image */}
                              <div className="bg-gray-100 rounded-lg p-8 text-center">
                                <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="3"/>
                                    <path d="M12 1v6m0 6v6m11-7h-6M8 12H2"/>
                                  </svg>
                                </div>
                                <Link to="/rings" className="text-xs font-inter font-medium text-gray-700 hover:text-gray-900 uppercase tracking-wider transition-colors">
                                  EXPLORE RINGS
                                </Link>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Section */}
                          <div className="mt-12 pt-8 border-t border-gray-100">
                            <div className="grid grid-cols-5 gap-8">
                              <div>
                                <h4 className="text-xs font-inter font-medium text-gray-900 uppercase tracking-wider mb-3">BEST SELLERS</h4>
                                <div className="space-y-2">
                                  <Link to="/best-selling-rings" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Best-Selling Rings</Link>
                                  <Link to="/under-250" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Under £250</Link>
                                  <Link to="/250-350" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">£250 - £350</Link>
                                  <Link to="/350-500" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">£350 - £500</Link>
                                  <Link to="/500-1000" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">£500 - £1000</Link>
                                  <Link to="/1000-2000" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">£1000 - £2000</Link>
                                  <Link to="/2000+" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">£2000+</Link>
                                  <Link to="/new-in" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">New In</Link>
                                  <Link to="/sample-sale" className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Sample Sale</Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
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
                onClick={openMobileMenu}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <Menu className={`w-5 h-5 transition-colors duration-300 ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                }`} />
              </button>

              {/* Center - Minimal Logo/Brand */}
              <div className="flex-1 flex justify-center">
                <Link to="/" className="flex flex-col items-center">
                  <div className={`text-lg font-cormorant tracking-[0.2em] uppercase transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  }`}>
                    McCulloch
                  </div>
                  <div className={`text-[10px] font-cormorant tracking-[0.3em] uppercase transition-colors duration-300 ${
                    isScrolled ? 'text-gray-500' : 'text-white/70'
                  }`}>
                    Jewellers
                  </div>
                </Link>
              </div>

              {/* Right - Minimal Actions */}
              <div className="flex items-center space-x-2">
                {/* Search */}
                <button 
                  onClick={openSearch}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>

                {/* Shopping Bag */}
                <button 
                  onClick={openCart}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
                >
                  <svg className={`w-4 h-4 transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  {getCartCount() > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-medium ${
                      isScrolled 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-white text-gray-900'
                    }`}>
                      {getCartCount()}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Desktop Search Overlay - positioned at very top */}
          {searchOpen && !isMobile && (
            <div className="absolute top-0 left-0 right-0 z-60">
              <SearchOverlay
                isOpen={searchOpen}
                onClose={closeSearch}
                isMobile={false}
              />
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Menu - Professional Structure with Animations */}
      {mobileMenuVisible && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-200 ${
              mobileMenuOpen ? 'bg-opacity-20' : 'bg-opacity-0'
            }`}
            onClick={closeMobileMenu}
          />
          
          {/* Menu Panel */}
          <div 
            className={`absolute left-0 top-0 h-full w-full bg-white shadow-xl transform transition-transform duration-200 ease-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="h-full overflow-y-auto">
            {/* Mobile Header */}
            <div className="border-b border-gray-200 px-0 py-0">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex-1 text-center">
                  <div className="text-lg font-cormorant tracking-[0.2em] uppercase text-gray-900">
                    McCulloch
                  </div>
                  <div className="text-xs font-cormorant tracking-[0.3em] uppercase text-gray-500 mt-0.5">
                    Jewellers
                  </div>
                </div>
                <button 
                  onClick={closeMobileMenu}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          
            <nav className="px-0 py-0 overflow-y-auto">
              {/* Main Navigation Sections */}
              <div className="border-b border-gray-200">
                {/* Engagement Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'engagement' ? null : 'engagement')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">ENGAGEMENT</span>
                    {expandedSection === 'engagement' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedSection === 'engagement' && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {/* Diamond Engagement Rings Subsection */}
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-cormorant font-medium text-gray-700 uppercase tracking-wider">DIAMOND ENGAGEMENT RINGS</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-3 ml-4">
                          <Link
                            to="/engagement/all"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            All Engagement Rings
                          </Link>
                          <Link
                            to="/engagement/quickship"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Quickship Collection
                          </Link>
                          <Link
                            to="/engagement/inspiration"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Inspiration Gallery
                          </Link>
                          <Link
                            to="/engagement/reviews"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Reviews
                          </Link>
                        </div>
                      </div>

                      {/* Shop by Styles Subsection */}
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-cormorant font-medium text-gray-700 uppercase tracking-wider">SHOP BY STYLES</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-3 ml-4">
                          <Link
                            to="/engagement/solitaire"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Solitaire
                          </Link>
                          <Link
                            to="/engagement/trilogy"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Trilogy
                          </Link>
                          <Link
                            to="/engagement/diamond-band"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Diamond Band
                          </Link>
                          <Link
                            to="/engagement/halo"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Halo
                          </Link>
                          <Link
                            to="/engagement/platinum"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Platinum
                          </Link>
                          <Link
                            to="/engagement/rose-gold"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Rose Gold
                          </Link>
                          <Link
                            to="/engagement/yellow-gold"
                            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            onClick={closeMobileMenu}
                          >
                            <span className="w-2 h-2 bg-gray-300 rounded-full mr-3"></span>
                            Yellow Gold
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wedding Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'wedding' ? null : 'wedding')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">WEDDING</span>
                    {expandedSection === 'wedding' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Diamonds Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'diamonds' ? null : 'diamonds')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">DIAMONDS</span>
                    {expandedSection === 'diamonds' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Jewellery Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'jewellery' ? null : 'jewellery')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">JEWELLERY</span>
                    {expandedSection === 'jewellery' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Guides Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'guides' ? null : 'guides')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">GUIDES</span>
                    {expandedSection === 'guides' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* About Us Section */}
                <div>
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'about' ? null : 'about')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">ABOUT US</span>
                    {expandedSection === 'about' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Contact & Services Section */}
              <div className="bg-gray-50">
                {/* Book Appointment */}
                <Link
                  to="/appointment"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-cormorant font-medium text-gray-900">Book Appointment</div>
                    <div className="text-xs font-cormorant text-gray-600">Schedule your free consultation</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Phone */}
                <Link
                  to="/contact"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-cormorant font-medium text-gray-900">Phone</div>
                    <div className="text-xs font-cormorant text-gray-600">Call on +44 207 831 1901</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Email */}
                <Link
                  to="/contact"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-cormorant font-medium text-gray-900">Email</div>
                    <div className="text-xs font-cormorant text-gray-600">Got any questions about rings? Send us an email</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Help & FAQs */}
                <Link
                  to="/faq"
                  className="flex items-center px-6 py-4 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <HelpCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-cormorant font-medium text-gray-900">Help & FAQs</div>
                    <div className="text-xs font-cormorant text-gray-600">Phone lines available Mon-Fri 9:30am - 6pm</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>
              </div>
            </nav>
            </div>
          </div>
        </div>
      )}

      {/* Cart Slide Component */}
      <CartSlide
        isOpen={isCartOpen}
        isVisible={isCartVisible}
        cartItems={cartItems}
        onClose={closeCart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
      />

      {/* Mobile Search Overlay Component */}
      {searchOpen && isMobile && (
        <SearchOverlay
          isOpen={searchOpen}
          onClose={closeSearch}
          isMobile={true}
        />
      )}
    </>
  );
};

export default LuxuryNavigation;