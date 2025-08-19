import { Menu, X, ChevronDown, User, Plus, Minus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";

// Map categories to their corresponding images
const categoryImages = {
  'Engagement': '/images/Engagement.png',
  'Wedding': '/images/Wedding.jpg',
  'Diamonds': '/images/Diamonds.jpg',
  'Jewellery': '/images/Jewellery.jpg'
};

interface HeaderSectionProps {
  transparent?: boolean;
}

export const HeaderSection = ({ transparent = false }: HeaderSectionProps): JSX.Element => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [engagementDropdownOpen, setEngagementDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Add scroll listener for transparent mode
  useEffect(() => {
    if (transparent) {
      // Set initial scroll state
      const initialScrolled = window.scrollY > 50;
      setIsScrolled(initialScrolled);
      console.log('HeaderSection transparent mode:', { transparent, isScrolled: initialScrolled, scrollY: window.scrollY });
      
      const handleScroll = () => {
        const scrollY = window.scrollY;
        const shouldBeScrolled = scrollY > 50;
        setIsScrolled(shouldBeScrolled);
        console.log('Scroll event:', { scrollY, shouldBeScrolled, transparent });
      };

      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [transparent]);

  const bannerItems = [
    "FREE WORLDWIDE DELIVERY",
    "30 DAY RETURNS / 60 DAY EXCHANGE", 
    "5 YEAR WARRANTY",
    "0% APR FINANCE",
    "UK HANDCRAFTED"
  ];

  // Sample search data
  const searchSuggestions = [
    'eternity rings',
    'rings',
    'ruby rings',
    'Womens Rings',
    'Heart Rings',
    'engagement rings',
    'wedding rings',
    'diamond rings'
  ];

  const searchProducts = [
    {
      id: 1,
      name: 'Aquamarine 0.70CT And Diamond 9K White Gold Ring £5731',
      price: 'Rs 145,300',
      image: '/images/product1.jpg'
    },
    {
      id: 2,
      name: 'Lab Diamond Half Eternity Wave Ring 0.05ct in 925 Silver',
      price: 'Rs 45,400',
      image: '/images/product2.jpg'
    },
    {
      id: 3,
      name: 'Lab Diamond Heritage Half Eternity Ring 0.15ct H/SI in 925 Silver',
      price: 'Rs 62,100',
      image: '/images/product3.jpg'
    }
  ];

  const searchPages = [
    'Eternity Rings',
    'Ring & Jewellery Resizing'
  ];

  // Full-width engagement dropdown menu items
  const engagementDropdownData = {
    diamondEngagementRings: {
      title: "Diamond Engagement Rings",
      items: [
        { name: 'Shop All Engagement Rings', url: '/engagement' },
        { name: 'Solitaire Rings', url: '/engagement/solitaire' },
        { name: 'Halo Rings', url: '/engagement/halo' },
        { name: 'Three Stone Rings', url: '/engagement/three-stone' },
        { name: 'Side Stone Rings', url: '/engagement/side-stone' },
        { name: 'Vintage Rings', url: '/engagement/vintage' },
        { name: 'Art Deco Rings', url: '/engagement/art-deco' }
      ]
    },
    shopByStyles: {
      title: "Shop by Styles",
      items: [
        { name: 'Classic', url: '/engagement/styles/classic' },
        { name: 'Modern', url: '/engagement/styles/modern' },
        { name: 'Vintage', url: '/engagement/styles/vintage' },
        { name: 'Art Deco', url: '/engagement/styles/art-deco' },
        { name: 'Nature Inspired', url: '/engagement/styles/nature' },
        { name: 'Minimalist', url: '/engagement/styles/minimalist' },
        { name: 'Statement', url: '/engagement/styles/statement' }
      ]
    },
    shopByShape: {
      title: "Shop by Shape",
      items: [
        { name: 'Round', url: '/engagement/shape/round' },
        { name: 'Princess', url: '/engagement/shape/princess' },
        { name: 'Oval', url: '/engagement/shape/oval' },
        { name: 'Emerald', url: '/engagement/shape/emerald' },
        { name: 'Pear', url: '/engagement/shape/pear' },
        { name: 'Marquise', url: '/engagement/shape/marquise' },
        { name: 'Cushion', url: '/engagement/shape/cushion' }
      ]
    },
    featuredCollections: {
      title: "Featured Collections",
      items: [
        { name: 'Heritage Collection', url: '/engagement/collections/heritage' },
        { name: 'Royal Collection', url: '/engagement/collections/royal' },
        { name: 'Bespoke Collection', url: '/engagement/collections/bespoke' },
        { name: 'Signature Collection', url: '/engagement/collections/signature' },
        { name: 'Limited Edition', url: '/engagement/collections/limited' },
        { name: 'Custom Design', url: '/engagement/collections/custom' },
        { name: 'Ring Settings Only', url: '/engagement/settings' }
      ]
    }
  };

  // Filter search results based on query
  const filteredSuggestions = searchSuggestions.filter(suggestion => 
    suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const filteredProducts = searchProducts.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPages = searchPages.filter(page => 
    page.toLowerCase().includes(searchQuery.toLowerCase())
  );


  // Handle smooth search close
  const handleSearchClose = () => {
    setSearchClosing(true);
    setTimeout(() => {
      setSearchOpen(false);
      setSearchClosing(false);
    }, 300);
  };

  // Cart functions
  const openCart = () => {
    setIsCartVisible(true);
    setTimeout(() => setIsCartOpen(true), 50);
  };

  const closeCart = () => {
    setIsCartOpen(false);
    setTimeout(() => setIsCartVisible(false), 300);
  };

  const updateQuantity = (itemIndex: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(prev => prev.filter((_, index) => index !== itemIndex));
    } else {
      setCartItems(prev => 
        prev.map((item, index) => 
          index === itemIndex 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeItem = (itemIndex: number) => {
    setCartItems(prev => prev.filter((_, index) => index !== itemIndex));
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace('£', '').replace(',', ''));
      return total + (price * item.quantity);
    }, 0);
  };

  // Mobile banner animation - cycle through items
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerItems.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [bannerItems.length]);


  return (
    <>
      {/* Top Info Bar - Hide in transparent mode */}
      {!transparent && (
        <div className="w-full bg-[#2d2d2d] h-7 flex items-center justify-center text-white text-xs nav-font font-light tracking-wider uppercase">
          {/* Desktop - Static Layout */}
          <div className="hidden lg:flex items-center justify-center gap-x-8 w-full">
            <span>FREE WORLDWIDE DELIVERY</span>
            <span className="text-gray-400">|</span>
            <span>30 DAY RETURNS / 60 DAY EXCHANGE</span>
            <span className="text-gray-400">|</span>
            <span>5 YEAR WARRANTY</span>
            <span className="text-gray-400">|</span>
            <span>0% APR FINANCE</span>
            <span className="text-gray-400">|</span>
            <span>UK HANDCRAFTED</span>
          </div>
          
          {/* Mobile - Enhanced Pop Reveal Animation */}
          <div className="lg:hidden flex items-center justify-center h-full w-full">
            <div 
              key={currentBannerIndex}
              className="animate-pop-reveal text-center nav-font font-light"
            >
              {bannerItems[currentBannerIndex]}
            </div>
          </div>
        </div>
      )}

      <header 
        className={`w-full sticky top-0 z-50 transition-all duration-300 ${
          transparent && !isScrolled 
            ? '!bg-transparent' 
            : 'bg-white/95 backdrop-blur-sm border-b border-gray-100'
        }`}
        style={{
          backgroundColor: transparent && !isScrolled ? 'transparent' : 'rgba(255,255,255,0.95)',
          background: transparent && !isScrolled ? 'transparent' : undefined,
          backdropFilter: transparent && !isScrolled ? 'none' : 'blur(12px)',
          borderBottom: transparent && !isScrolled ? 'none' : '1px solid rgb(243 244 246)',
          boxShadow: transparent && !isScrolled ? 'none' : undefined
        }}
        data-transparent={transparent}
        data-scrolled={isScrolled}
      >
        {/* Desktop Navigation Bar */}
        <div className="hidden lg:block px-6 lg:px-16 py-6">
          {/* Top Row - Search, Logo, User Actions */}
          <div className="grid grid-cols-3 items-center mb-8">
            {/* Left - Search Box */}
            <div className="flex items-center relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  onFocus={() => {
                    setSearchOpen(true);
                    setSearchQuery('');
                  }}
                  className={`pl-4 pr-10 py-2 w-64 border rounded-full text-sm focus:outline-none focus:ring-1 transition-all duration-300 ${
                    transparent && !isScrolled
                      ? 'border-white/30 focus:ring-white/50 focus:border-white/50 bg-transparent text-white placeholder:text-white/70'
                      : 'border-gray-300 focus:ring-gray-400 focus:border-gray-400 bg-gray-50 text-gray-900 placeholder:text-gray-500'
                  }`}
                />
                <button 
                  onClick={() => {
                    setSearchOpen(true);
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <svg className={`w-4 h-4 transition-colors duration-300 ${
                    transparent && !isScrolled 
                      ? 'text-white/70 hover:text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Center - Store Logo */}
            <div className="flex justify-center">
              <Link to="/" className="flex flex-col items-center">
                {/* Company Logo */}
                <div className="mb-2">
                  <img 
                    src="/images/logo.png" 
                    alt="McCulloch Jewellers Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
                {/* Store Name */}
                <div className="text-center">
                  <div className={`text-xl font-serif font-light tracking-[0.3em] uppercase transition-colors duration-300 ${
                    transparent && !isScrolled ? 'text-white' : 'text-black'
                  }`}>
                    McCulloch Jewellers
                  </div>
                  <div className={`text-xs font-serif tracking-[0.4em] uppercase mt-1 transition-colors duration-300 ${
                    transparent && !isScrolled ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    LONDON
                  </div>
                </div>
              </Link>
            </div>

            {/* Right - User Actions */}
            <div className="flex items-center justify-end space-x-6">
              {/* Account */}
              <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                transparent && !isScrolled
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <circle cx="12" cy="8" r="5"/>
                <path d="M20 21a8 8 0 1 0-16 0"/>
              </svg>
              {/* Wishlist */}
              <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                transparent && !isScrolled
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {/* Shopping Bag */}
              <div className="relative">
                <button onClick={openCart} className="group">
                  <svg className={`w-5 h-5 cursor-pointer transition-colors duration-300 ${
                    transparent && !isScrolled
                      ? 'text-white group-hover:text-white/80'
                      : 'text-gray-600 group-hover:text-gray-900'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  <span className={`absolute -top-1 -right-1 text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] transition-colors duration-300 ${
                    transparent && !isScrolled
                      ? 'bg-white text-gray-900'
                      : 'bg-gray-900 text-white'
                  }`}>
                    {cartItems.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row - Navigation */}
          <div className="flex items-center justify-center space-x-12 relative overflow-visible">
            {/* Engagement Dropdown */}
            <div 
              className="relative group"
              onMouseEnter={() => setEngagementDropdownOpen(true)}
              onMouseLeave={() => setEngagementDropdownOpen(false)}
            >
              <div className={`nav-font text-sm font-normal uppercase tracking-wide transition-colors cursor-pointer flex items-center ${
                transparent && !isScrolled 
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-700 hover:text-gray-900'
              }`}>
                ENGAGEMENT
                <ChevronDown className={`w-3 h-3 ml-1 transition-all duration-200 group-hover:rotate-180 ${
                  transparent && !isScrolled ? 'text-white' : 'text-gray-700'
                }`} />
              </div>
              
              {/* Full-Width Dropdown Menu */}
              {engagementDropdownOpen && (
                <div className="fixed left-0 right-0 bg-white shadow-2xl border-t border-gray-200 z-50 animate-dropdown-fast"
                     style={{ 
                       top: '100%',
                       width: '100%'
                     }}>
                  <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="grid grid-cols-4 gap-8">
                      
                      {/* Diamond Engagement Rings Column */}
                      <div>
                        <h3 className="text-base font-medium text-gray-900 uppercase tracking-wider mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {engagementDropdownData.diamondEngagementRings.title}
                        </h3>
                        <ul className="space-y-2">
                          {engagementDropdownData.diamondEngagementRings.items.map((item, index) => (
                            <li key={index}>
                              <Link
                                to={item.url}
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1" 
                                style={{ fontFamily: 'Cormorant Garamond, serif' }}
                                onClick={() => setEngagementDropdownOpen(false)}
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Shop by Styles Column */}
                      <div>
                        <h3 className="text-base font-medium text-gray-900 uppercase tracking-wider mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {engagementDropdownData.shopByStyles.title}
                        </h3>
                        <ul className="space-y-2">
                          {engagementDropdownData.shopByStyles.items.map((item, index) => (
                            <li key={index}>
                              <Link
                                to={item.url}
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1" 
                                style={{ fontFamily: 'Cormorant Garamond, serif' }}
                                onClick={() => setEngagementDropdownOpen(false)}
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Shop by Shape Column */}
                      <div>
                        <h3 className="text-base font-medium text-gray-900 uppercase tracking-wider mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {engagementDropdownData.shopByShape.title}
                        </h3>
                        <ul className="space-y-2">
                          {engagementDropdownData.shopByShape.items.map((item, index) => (
                            <li key={index}>
                              <Link
                                to={item.url}
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1" 
                                style={{ fontFamily: 'Cormorant Garamond, serif' }}
                                onClick={() => setEngagementDropdownOpen(false)}
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Featured Collections Column */}
                      <div>
                        <h3 className="text-base font-medium text-gray-900 uppercase tracking-wider mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {engagementDropdownData.featuredCollections.title}
                        </h3>
                        <ul className="space-y-2">
                          {engagementDropdownData.featuredCollections.items.map((item, index) => (
                            <li key={index}>
                              <Link
                                to={item.url}
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors block py-1" 
                                style={{ fontFamily: 'Cormorant Garamond, serif' }}
                                onClick={() => setEngagementDropdownOpen(false)}
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                    
                    {/* Bottom Section with Featured Image or Call-to-Action */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                      <div className="grid grid-cols-2 gap-6 items-center">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                            Need Help Finding The Perfect Ring?
                          </h4>
                          <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                            Book a consultation with our expert team or browse our complete engagement collection.
                          </p>
                          <div className="flex space-x-4">
                            <Link
                              to="/consultation"
                              className="text-sm bg-gray-900 text-white px-6 py-2 hover:bg-gray-800 transition-colors"
                              style={{ fontFamily: 'Cormorant Garamond, serif' }}
                              onClick={() => setEngagementDropdownOpen(false)}
                            >
                              Book Consultation
                            </Link>
                            <Link
                              to="/engagement"
                              className="text-sm border border-gray-300 text-gray-700 px-6 py-2 hover:border-gray-400 hover:text-gray-900 transition-colors"
                              style={{ fontFamily: 'Cormorant Garamond, serif' }}
                              onClick={() => setEngagementDropdownOpen(false)}
                            >
                              View All Rings
                            </Link>
                          </div>
                        </div>
                        <div className="text-center">
                          <img 
                            src="/images/engagement-featured.jpg" 
                            alt="Featured Engagement Ring"
                            className="w-full h-20 object-cover rounded-lg shadow-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link 
              to="/wedding" 
              className={`nav-font text-sm font-normal uppercase tracking-wide transition-colors ${
                transparent && !isScrolled 
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              WEDDING
            </Link>
            <Link 
              to="/diamonds" 
              className={`nav-font text-sm font-normal uppercase tracking-wide transition-colors ${
                transparent && !isScrolled 
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              DIAMONDS
            </Link>
            <Link 
              to="/jewellery" 
              className={`nav-font text-sm font-normal uppercase tracking-wide transition-colors ${
                transparent && !isScrolled 
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              JEWELLERY
            </Link>
            <Link 
              to="/watches" 
              className={`nav-font text-sm font-normal uppercase tracking-wide transition-colors ${
                transparent && !isScrolled 
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              WATCHES
            </Link>
            <Link 
              to="/guides" 
              className={`nav-font text-sm font-normal uppercase tracking-wide transition-colors ${
                transparent && !isScrolled 
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              GUIDES
            </Link>
            <Link 
              to="/heritage" 
              className={`nav-font text-sm font-normal uppercase tracking-wide transition-colors ${
                transparent && !isScrolled 
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              ABOUT US
            </Link>
            <Link 
              to="/contact" 
              className={`nav-font text-sm font-normal uppercase tracking-wide transition-colors ${
                transparent && !isScrolled 
                  ? 'text-white hover:text-white/80'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              CONTACT
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Bar - Minimal Luxury Design */}
        <div className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-4">
            {/* Left - Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Center - Minimal Logo/Brand */}
            <div className="flex-1 flex justify-center">
              <Link to="/" className="flex flex-col items-center">
                <div className="text-lg font-serif tracking-[0.2em] uppercase text-gray-900">
                  McCulloch
                </div>
                <div className="text-[10px] font-serif tracking-[0.3em] uppercase text-gray-500 -mt-0.5">
                  Jewellers
                </div>
              </Link>
            </div>

            {/* Right - Minimal Actions */}
            <div className="flex items-center space-x-2">
              {/* Search */}
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setSearchQuery('');
                }}
                className="p-2 rounded-full hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>

              {/* Shopping Bag */}
              <button onClick={openCart} className="p-2 rounded-full hover:bg-gray-50 transition-colors relative">
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                  <path d="M3 6h18"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {cartItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gray-900 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    {cartItems.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

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
                    <img 
                      src={categoryImages.Engagement}
                      alt="Engagement"
                      className="w-14 h-14 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="text-sm font-serif text-gray-800 tracking-wide">Engagement</span>
                  </Link>

                  {/* Wedding */}
                  <Link
                    to="/wedding"
                    className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <img 
                      src={categoryImages.Wedding}
                      alt="Wedding"
                      className="w-14 h-14 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="text-sm font-serif text-gray-800 tracking-wide">Wedding</span>
                  </Link>

                  {/* Diamonds */}
                  <Link
                    to="/diamonds"
                    className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <img 
                      src={categoryImages.Diamonds}
                      alt="Diamonds"
                      className="w-14 h-14 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="text-sm font-serif text-gray-800 tracking-wide">Diamonds</span>
                  </Link>

                  {/* Jewellery */}
                  <Link
                    to="/jewellery"
                    className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <img 
                      src={categoryImages.Jewellery}
                      alt="Jewellery"
                      className="w-14 h-14 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="text-sm font-serif text-gray-800 tracking-wide">Jewellery</span>
                  </Link>

                  {/* Watches */}
                  <Link
                    to="/watches"
                    className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                      <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    </div>
                    <span className="text-sm font-serif text-gray-800 tracking-wide">Watches</span>
                  </Link>

                  {/* Heritage */}
                  <Link
                    to="/heritage"
                    className="flex flex-col items-center text-center p-6 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <img 
                      src="/images/desilva-family.jpg"
                      alt="Heritage"
                      className="w-14 h-14 object-cover rounded-lg mb-3 group-hover:scale-105 transition-transform duration-200"
                    />
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
                    <Link
                      to="/guides"
                      className="text-center py-3 text-sm font-serif text-gray-700 hover:text-gray-900 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Guides
                    </Link>
                  </div>
                </div>

              </nav>
            </div>
          </div>
        )}

      {/* Full-Screen Search Overlay */}
      {searchOpen && (
        <div 
          className={`fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm ${
            searchClosing ? 'animate-search-overlay-out' : 'animate-search-overlay-in'
          }`}
          onClick={handleSearchClose}
        >
          <div 
            className={`flex flex-col items-center pt-16 pb-8 ${
              searchClosing ? 'animate-search-window-out' : 'animate-search-window-in'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div className="text-center mb-6">
              <div className="text-sm text-gray-300 uppercase tracking-wider font-light">
                WHAT ARE YOU LOOKING FOR?
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-2xl px-8 mb-8">
              <input
                type="text"
                placeholder="Search for rings, necklaces, earrings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 text-base border-0 rounded-full focus:outline-none shadow-lg bg-white transition-all duration-300 focus:shadow-xl"
                autoFocus
              />
              <button className="absolute right-12 top-1/2 transform -translate-y-1/2 transition-all duration-200 hover:scale-110">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div className={`w-full max-w-5xl bg-white shadow-2xl mx-8 rounded-lg ${
                searchClosing ? 'animate-search-results-out' : 'animate-search-results-in'
              }`}>
                <div className="grid grid-cols-3 min-h-[300px]">
                  {/* Suggestions Column */}
                  <div className="p-6 border-r border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">
                      SUGGESTIONS
                    </h4>
                    <ul className="space-y-2">
                      {filteredSuggestions.map((suggestion, index) => (
                        <li key={index} style={{ animationDelay: `${index * 50}ms` }} className="opacity-0 animate-fade-in">
                          <button 
                            className="text-sm text-blue-600 hover:text-blue-800 text-left block transition-all duration-200 hover:translate-x-1"
                            onClick={() => {
                              setSearchQuery(suggestion);
                              handleSearchClose();
                            }}
                          >
                            {suggestion}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button 
                      className="text-sm text-gray-600 underline hover:text-gray-800 mt-4 block transition-colors duration-200"
                      onClick={handleSearchClose}
                    >
                      Search for "{searchQuery}"
                    </button>
                  </div>

                  {/* Products Column */}
                  <div className="p-6 border-r border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">
                      PRODUCTS
                    </h4>
                    <ul className="space-y-3">
                      {filteredProducts.map((product, index) => (
                        <li key={product.id} style={{ animationDelay: `${(index + 5) * 50}ms` }} className="opacity-0 animate-fade-in">
                          <div className="flex items-start space-x-3 group">
                            <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden transition-transform duration-300 group-hover:scale-105">
                              <img 
                                src="/images/0406900pdcc_550x.webp" 
                                alt="Product" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <button 
                                className="text-xs text-gray-800 text-left hover:text-blue-600 leading-tight block transition-colors duration-200"
                                onClick={handleSearchClose}
                              >
                                {product.name}
                              </button>
                              <p className="text-xs font-medium text-gray-700 mt-1">
                                {product.price}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pages Column */}
                  <div className="p-6">
                    <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-4">
                      PAGES
                    </h4>
                    <ul className="space-y-2">
                      {filteredPages.map((page, index) => (
                        <li key={index} style={{ animationDelay: `${(index + 8) * 50}ms` }} className="opacity-0 animate-fade-in">
                          <button 
                            className="text-sm text-gray-700 hover:text-gray-900 text-left block transition-all duration-200 hover:translate-x-1"
                            onClick={handleSearchClose}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={handleSearchClose}
              className="absolute top-6 right-6 p-2 text-white hover:text-gray-300 transition-all duration-200 hover:scale-110 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Slide-out Cart */}
      {isCartVisible && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className={`absolute inset-0 bg-black transition-opacity duration-300 ${
              isCartOpen ? 'bg-opacity-50' : 'bg-opacity-0'
            }`}
            onClick={closeCart}
          />
          
          {/* Cart Panel */}
          <div 
            className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
              isCartOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <button 
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-sm font-cormorant text-gray-600">
                {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <p className="font-cormorant text-lg">Your cart is empty</p>
                  <p className="font-cormorant text-sm mt-2">Add some beautiful pieces to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex space-x-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-cormorant text-gray-900 pr-2">
                            {item.name}
                          </h3>
                          <button
                            onClick={() => removeItem(index)}
                            className="text-xs text-gray-500 hover:text-gray-700 underline font-inter"
                          >
                            Remove
                          </button>
                        </div>
                        
                        <p className="text-xs text-gray-600 font-cormorant">
                          {item.metal?.charAt(0).toUpperCase() + item.metal?.slice(1)} {item.size && `/ ${item.size}`}
                        </p>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-inter text-gray-600">Qty:</span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="w-6 h-6 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-cormorant">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="w-6 h-6 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <span className="text-sm font-cormorant text-gray-900">
                            {item.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-6 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="font-cormorant text-gray-900">Subtotal:</span>
                  <span className="font-cormorant text-lg text-gray-900">
                    £{getSubtotal().toLocaleString()}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link 
                    to="/cart"
                    className="block w-full h-12 bg-white border border-gray-300 hover:border-gray-800 text-gray-900 font-inter font-light uppercase tracking-wider text-xs transition-colors flex items-center justify-center"
                    onClick={closeCart}
                  >
                    View Bag
                  </Link>
                  <button className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-inter font-light uppercase tracking-wider text-xs transition-colors">
                    Checkout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </> 
  );
};