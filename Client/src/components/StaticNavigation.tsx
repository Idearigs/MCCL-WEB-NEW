import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp, Calendar, Phone, Mail, HelpCircle } from "lucide-react";
import TopBanner from "./TopBanner";
import CartSlide from "./CartSlide";
import SearchOverlay from "./SearchOverlay";
import { useCart } from "../contexts/CartContext";
import { useIsMobile } from "../hooks/use-mobile";

const StaticNavigation = (): JSX.Element => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  
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
        <nav className="relative bg-white/95 backdrop-blur-sm">
          {/* Desktop Navigation */}
          <div className="hidden lg:block max-w-7xl mx-auto px-8">
            <div className="flex flex-col items-center py-6">
              {/* Top Row - Logo Center */}
              <div className="flex items-center justify-between w-full mb-6">
                {/* Left Icons */}
                <div className="flex items-center space-x-4 min-w-[120px]">
                  <svg className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </div>

                {/* Center Logo */}
                <div className="flex-1 flex flex-col items-center">
                  <Link to="/" className="flex flex-col items-center">
                    <div className="text-2xl font-cormorant tracking-[0.2em] uppercase text-gray-900">
                      McCulloch
                    </div>
                    <div className="text-xs font-cormorant tracking-[0.3em] uppercase text-gray-500 mt-0.5">
                      Jewellers
                    </div>
                  </Link>
                </div>

                {/* Right Icons */}
                <div className="flex items-center space-x-4 min-w-[120px] justify-end">
                  <button onClick={openSearch}>
                    <svg className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                  </button>
                  <svg className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <button 
                    onClick={openCart}
                    className="relative"
                  >
                    <svg className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                      <path d="M3 6h18"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    {getCartCount() > 0 && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-gray-900 text-white rounded-full text-xs flex items-center justify-center font-medium">
                        {getCartCount()}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Row - Navigation Links */}
              <div className="flex items-center space-x-12">
                <Link to="/engagement" className="text-sm font-inter font-light text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wider">
                  ENGAGEMENT
                </Link>
                <Link to="/wedding" className="text-sm font-inter font-light text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wider">
                  WEDDING
                </Link>
                <Link to="/diamonds" className="text-sm font-inter font-light text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wider">
                  DIAMONDS
                </Link>
                <Link to="/jewellery" className="text-sm font-inter font-light text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wider">
                  JEWELLERY
                </Link>
                <Link to="/watches" className="text-sm font-inter font-light text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wider">
                  WATCHES
                </Link>
                <Link to="/heritage" className="text-sm font-inter font-light text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wider">
                  OUR HERITAGE
                </Link>
                <Link to="/contact" className="text-sm font-inter font-light text-gray-700 hover:text-gray-900 transition-colors uppercase tracking-wider">
                  CONTACT
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Left - Menu Button */}
              <button
                onClick={openMobileMenu}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>

              {/* Center Logo */}
              <Link to="/" className="flex flex-col items-center">
                <div className="text-lg font-cormorant tracking-[0.2em] uppercase text-gray-900">
                  McCulloch
                </div>
                <div className="text-xs font-cormorant tracking-[0.3em] uppercase text-gray-500 mt-0.5">
                  Jewellers
                </div>
              </Link>

              {/* Right - Minimal Actions */}
              <div className="flex items-center space-x-2">
                {/* Search */}
                <button 
                  onClick={openSearch}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>

                {/* Shopping Bag */}
                <button 
                  onClick={openCart}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                >
                  <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white rounded-full text-xs flex items-center justify-center font-medium">
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
                        <div className="text-xs font-cormorant font-medium text-gray-700 uppercase tracking-wider mb-3">DIAMOND ENGAGEMENT RINGS</div>
                        <div className="space-y-3 pl-4">
                          <Link to="/solitaire-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Solitaire Rings</Link>
                          <Link to="/trilogy-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Trilogy Rings</Link>
                          <Link to="/cluster-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Cluster Rings</Link>
                          <Link to="/vintage-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Vintage Rings</Link>
                          <Link to="/yellow-gold-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Yellow Gold Rings</Link>
                        </div>
                      </div>

                      {/* Colored Stone Engagement Rings */}
                      <div className="px-6 py-4 border-b border-gray-200">
                        <div className="text-xs font-cormorant font-medium text-gray-700 uppercase tracking-wider mb-3">COLORED STONE ENGAGEMENT RINGS</div>
                        <div className="space-y-3 pl-4">
                          <Link to="/sapphire-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Sapphire Rings</Link>
                          <Link to="/ruby-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Ruby Rings</Link>
                          <Link to="/emerald-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Emerald Rings</Link>
                        </div>
                      </div>

                      {/* Wedding Rings */}
                      <div className="px-6 py-4">
                        <div className="text-xs font-cormorant font-medium text-gray-700 uppercase tracking-wider mb-3">WEDDING RINGS</div>
                        <div className="space-y-3 pl-4">
                          <Link to="/diamond-wedding-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Diamond Wedding Rings</Link>
                          <Link to="/plain-wedding-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Plain Wedding Rings</Link>
                          <Link to="/vintage-wedding-rings" onClick={closeMobileMenu} className="block text-sm font-cormorant text-gray-600 hover:text-gray-900 transition-colors">Vintage Wedding Rings</Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other navigation sections would go here - Wedding, Diamonds, etc. */}
                <Link to="/wedding" onClick={closeMobileMenu} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">WEDDING</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                <Link to="/diamonds" onClick={closeMobileMenu} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">DIAMONDS</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                <Link to="/jewellery" onClick={closeMobileMenu} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">JEWELLERY</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                <Link to="/watches" onClick={closeMobileMenu} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors border-b border-gray-100">
                  <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">WATCHES</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                <Link to="/heritage" onClick={closeMobileMenu} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-cormorant font-medium text-gray-800 uppercase tracking-wider">OUR HERITAGE</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>
              </div>

              {/* Contact & Services Section */}
              <div className="bg-gray-50">
                {/* Book Appointment */}
                <Link
                  to="/appointment"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-cormorant font-medium text-gray-900">Book an Appointment</div>
                    <div className="text-xs font-cormorant text-gray-600">Schedule your consultation</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Contact Phone */}
                <Link
                  to="/contact"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Phone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-cormorant font-medium text-gray-900">+44 (0) 20 7123 4567</div>
                    <div className="text-xs font-cormorant text-gray-600">Call us directly</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Email */}
                <Link
                  to="/contact"
                  className="flex items-center px-6 py-4 border-b border-gray-200 hover:bg-gray-100 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-cormorant font-medium text-gray-900">Email Us</div>
                    <div className="text-xs font-cormorant text-gray-600">info@mcculloch.co.uk</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Help & FAQs */}
                <Link
                  to="/help"
                  className="flex items-center px-6 py-4 hover:bg-gray-100 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <HelpCircle className="w-4 h-4 text-orange-600" />
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

export default StaticNavigation;