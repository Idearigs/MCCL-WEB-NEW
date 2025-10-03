import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp, Calendar, Phone, Mail, HelpCircle, Diamond, Gem, Circle, Layers, Star, Heart, Crown } from "lucide-react";
import TopBanner from "./TopBanner";
import CartSlide from "./CartSlide";
import SearchOverlay from "./SearchOverlay";
import { useCart } from "../contexts/CartContext";
import { useIsMobile } from "../hooks/use-mobile";
import API_BASE_URL from '../config/api';

interface WatchCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  is_featured: boolean;
  launch_year?: number;
  watches_count: number;
}

interface WatchBrand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  collections: WatchCollection[];
}

const LuxuryNavigation = (): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [engagementHover, setEngagementHover] = useState(false);
  const [weddingHover, setWeddingHover] = useState(false);
  const [diamondsHover, setDiamondsHover] = useState(false);
  const [jewelleryHover, setJewelleryHover] = useState(false);
  const [watchesHover, setWatchesHover] = useState(false);
  const [heritageHover, setHeritageHover] = useState(false);
  const [navbarHover, setNavbarHover] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Watch brands and collections state
  const [watchBrands, setWatchBrands] = useState<WatchBrand[]>([]);
  const [loadingWatches, setLoadingWatches] = useState(false);

  // Closing animation states
  const [engagementClosing, setEngagementClosing] = useState(false);
  const [weddingClosing, setWeddingClosing] = useState(false);
  const [diamondsClosing, setDiamondsClosing] = useState(false);
  const [jewelleryClosing, setJewelleryClosing] = useState(false);
  const [watchesClosing, setWatchesClosing] = useState(false);
  const [heritageClosing, setHeritageClosing] = useState(false);
  
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
  const anyDropdownOpen = engagementHover || weddingHover || diamondsHover || jewelleryHover || watchesHover || heritageHover;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch watch brands and collections on component mount
  useEffect(() => {
    const fetchWatchBrands = async () => {
      try {
        setLoadingWatches(true);
        const response = await fetch(`${API_BASE_URL}/watches/featured-collections`);
        const data = await response.json();

        if (data.success) {
          setWatchBrands(data.data);
        }
      } catch (error) {
        console.error('Error fetching watch brands:', error);
      } finally {
        setLoadingWatches(false);
      }
    };

    fetchWatchBrands();
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

  // Functions for hover with delay
  const handleHoverEnter = (setHover: (value: boolean) => void) => () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    // Close all other dropdowns
    setEngagementHover(false);
    setWeddingHover(false);
    setDiamondsHover(false);
    setJewelleryHover(false);
    setWatchesHover(false);
    setHeritageHover(false);
    // Reset all closing states
    setEngagementClosing(false);
    setWeddingClosing(false);
    setDiamondsClosing(false);
    setJewelleryClosing(false);
    setWatchesClosing(false);
    setHeritageClosing(false);
    // Open the current one
    setHover(true);
  };

  const handleHoverLeave = (setHover: (value: boolean) => void, setClosing: (value: boolean) => void) => () => {
    const timeout = setTimeout(() => {
      setClosing(true);
      // Wait for closing animation to complete before hiding
      setTimeout(() => {
        setHover(false);
        setClosing(false);
      }, 200); // Match the animation duration
    }, 100); // 100ms delay
    setHoverTimeout(timeout);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopBanner />
        <nav 
          className={`relative transition-all duration-0 ${
            anyDropdownOpen || navbarHover
              ? 'bg-white shadow-lg'
              : isScrolled 
                ? 'bg-white/95 backdrop-blur-sm shadow-sm' 
                : 'bg-transparent'
          }`}
          onMouseEnter={() => setNavbarHover(true)}
          onMouseLeave={() => setNavbarHover(false)}
        >
          {/* Desktop Navigation */}
          <div className="hidden lg:block max-w-7xl mx-auto px-8">
            <div className="flex flex-col items-center py-6">
              {/* Top Row - Logo Center */}
              <div className="flex items-center justify-between w-full mb-6">
                {/* Left side */}
                <div className="flex items-center space-x-4 min-w-[120px]">
                  <span className={`text-xs uppercase tracking-widest transition-colors duration-0 ${
                    anyDropdownOpen || navbarHover || isScrolled ? 'text-gray-600' : 'text-white/70'
                  }`}>UK</span>
                </div>

                {/* Center Logo */}
                <div className="flex-1 flex justify-center mx-12">
                  <Link to="/" className="flex flex-col items-center">
                    <div className={`text-2xl font-serif font-light tracking-[0.3em] uppercase transition-colors duration-0 ${
                      anyDropdownOpen || navbarHover || isScrolled ? 'text-gray-900' : 'text-white'
                    }`}>
                      McCulloch
                    </div>
                    <div className={`text-sm font-light tracking-[0.5em] uppercase transition-colors duration-0 ${
                      anyDropdownOpen || navbarHover || isScrolled ? 'text-gray-600' : 'text-white/80'
                    }`}>
                      Jewellers
                    </div>
                  </Link>
                </div>

                {/* Right Icons */}
                <div className="flex items-center space-x-4 min-w-[120px] justify-end">
                  {/* Search Icon */}
                  <div className="relative group">
                    <button onClick={openSearch}>
                      <svg className={`w-5 h-5 cursor-pointer transition-colors duration-0 ${
                        anyDropdownOpen || navbarHover || isScrolled
                          ? 'text-gray-600 hover:text-gray-900'
                          : 'text-white hover:text-white/80'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                    </button>
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                      Search
                    </div>
                  </div>

                  {/* Account Icon */}
                  <div className="relative group">
                    <svg className={`w-5 h-5 cursor-pointer transition-colors duration-0 ${
                      anyDropdownOpen || navbarHover || isScrolled
                        ? 'text-gray-600 hover:text-gray-900'
                        : 'text-white hover:text-white/80'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <circle cx="12" cy="8" r="5"/>
                      <path d="M20 21a8 8 0 1 0-16 0"/>
                    </svg>
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                      Account
                    </div>
                  </div>

                  {/* Favorites Icon */}
                  <div className="relative group">
                    <svg className={`w-5 h-5 cursor-pointer transition-colors duration-0 ${
                      anyDropdownOpen || navbarHover || isScrolled
                        ? 'text-gray-600 hover:text-gray-900'
                        : 'text-white hover:text-white/80'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                      Favorites
                    </div>
                  </div>

                  {/* Cart Icon */}
                  <div className="relative group">
                    <button
                      onClick={openCart}
                      className="relative"
                    >
                      <svg className={`w-5 h-5 cursor-pointer transition-colors duration-0 ${
                        anyDropdownOpen || navbarHover || isScrolled
                          ? 'text-gray-600 hover:text-gray-900'
                          : 'text-white hover:text-white/80'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                        <path d="M3 6h18"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                      </svg>
                      {getCartCount() > 0 && (
                        <span className={`absolute -top-2 -right-2 w-4 h-4 rounded-full text-xs flex items-center justify-center font-medium transition-colors duration-0 ${
                          anyDropdownOpen || navbarHover || isScrolled
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-gray-900'
                        }`}>
                          {getCartCount()}
                        </span>
                      )}
                    </button>
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                      Cart ({getCartCount()})
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Navigation Links */}
              <div className="w-full flex items-center justify-center mt-1">
                <div className="flex items-center justify-center space-x-6 lg:space-x-8 xl:space-x-10">
                  <div 
                    className="relative"
                    onMouseEnter={handleHoverEnter(setEngagementHover)}
                    onMouseLeave={handleHoverLeave(setEngagementHover, setEngagementClosing)}
                  >
                    <Link 
                      to="/engagement" 
                      className={`text-xs uppercase tracking-[0.2em] transition-colors duration-0 ${
                        anyDropdownOpen || navbarHover || isScrolled 
                          ? 'text-gray-700 hover:text-gray-900' 
                          : 'text-white hover:text-white/80'
                      }`}
                    >
                      Engagement
                    </Link>
                  </div>
                  <div 
                    className="relative"
                    onMouseEnter={handleHoverEnter(setWeddingHover)}
                    onMouseLeave={handleHoverLeave(setWeddingHover, setWeddingClosing)}
                  >
                    <Link 
                      to="/wedding" 
                      className={`text-xs uppercase tracking-[0.2em] transition-colors duration-0 ${
                        anyDropdownOpen || navbarHover || isScrolled 
                          ? 'text-gray-700 hover:text-gray-900' 
                          : 'text-white hover:text-white/80'
                      }`}
                    >
                      Wedding
                    </Link>
                  </div>
                  <div 
                    className="relative"
                    onMouseEnter={handleHoverEnter(setDiamondsHover)}
                    onMouseLeave={handleHoverLeave(setDiamondsHover, setDiamondsClosing)}
                  >
                    <Link 
                      to="/diamonds" 
                      className={`text-xs uppercase tracking-[0.2em] transition-colors duration-0 ${
                        anyDropdownOpen || navbarHover || isScrolled 
                          ? 'text-gray-700 hover:text-gray-900' 
                          : 'text-white hover:text-white/80'
                      }`}
                    >
                      Diamonds
                    </Link>
                  </div>
                  <div 
                    className="relative"
                    onMouseEnter={handleHoverEnter(setJewelleryHover)}
                    onMouseLeave={handleHoverLeave(setJewelleryHover, setJewelleryClosing)}
                  >
                    <Link 
                      to="/jewellery" 
                      className={`text-xs uppercase tracking-[0.2em] transition-colors duration-0 ${
                        anyDropdownOpen || navbarHover || isScrolled 
                          ? 'text-gray-700 hover:text-gray-900' 
                          : 'text-white hover:text-white/80'
                      }`}
                    >
                      Jewellery
                    </Link>
                  </div>
                  <div 
                    className="relative"
                    onMouseEnter={handleHoverEnter(setWatchesHover)}
                    onMouseLeave={handleHoverLeave(setWatchesHover, setWatchesClosing)}
                  >
                    <Link 
                      to="/watches" 
                      className={`text-xs uppercase tracking-[0.2em] transition-colors duration-0 ${
                        anyDropdownOpen || navbarHover || isScrolled 
                          ? 'text-gray-700 hover:text-gray-900' 
                          : 'text-white hover:text-white/80'
                      }`}
                    >
                      Watches
                    </Link>
                  </div>
                  <div 
                    className="relative"
                    onMouseEnter={handleHoverEnter(setHeritageHover)}
                    onMouseLeave={handleHoverLeave(setHeritageHover, setHeritageClosing)}
                  >
                    <Link 
                      to="/heritage" 
                      className={`text-xs uppercase tracking-[0.2em] transition-colors duration-0 ${
                        anyDropdownOpen || navbarHover || isScrolled 
                          ? 'text-gray-700 hover:text-gray-900' 
                          : 'text-white hover:text-white/80'
                      }`}
                    >
                      Our Heritage
                    </Link>
                  </div>
                  <Link 
                    to="/contact" 
                    className={`text-xs uppercase tracking-[0.2em] transition-colors duration-0 ${
                      anyDropdownOpen || navbarHover || isScrolled 
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

          {/* Engagement Dropdown - Positioned at nav level */}
          {engagementHover && (
            <div 
              className={`absolute left-0 right-0 top-full w-full shadow-xl border border-gray-100/50 z-[60] duration-300 ease-out ${
                engagementClosing 
                  ? 'animate-out slide-out-to-top-4' 
                  : 'animate-in slide-in-from-top-4'
              }`}
              onMouseEnter={handleHoverEnter(setEngagementHover)}
              onMouseLeave={handleHoverLeave(setEngagementHover, setEngagementClosing)}
              style={{backgroundColor: '#fcfcfc'}}
            >
              <div className="max-w-7xl mx-auto px-12 pt-6 pb-8">
                <div className="grid grid-cols-4 gap-8">
                  {/* RING TYPES Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">RING TYPES</h3>
                    <div className="space-y-1">
                      <Link to="/wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Wedding</Link>
                      <Link to="/engagement-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Engagement</Link>
                      <Link to="/vintage-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Vintage</Link>
                      <Link to="/promise-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Promise</Link>
                      <Link to="/wishbone-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Wishbone</Link>
                      <Link to="/stacking-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Stacking</Link>
                      <Link to="/cocktail-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Cocktail</Link>
                      <Link to="/bridal-sets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Bridal sets</Link>
                      <Link to="/mens-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Men's Rings</Link>
                      <Link to="/all-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>All Rings</Link>
                    </div>
                  </div>

                  {/* GEMSTONE Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">GEMSTONE</h3>
                    <div className="space-y-1">
                      <Link to="/mined-diamond" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Mined Diamond</Link>
                      <Link to="/lab-grown-diamond" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Lab Grown Diamond</Link>
                      <Link to="/sapphire" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Sapphire</Link>
                      <Link to="/emerald" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Emerald</Link>
                      <Link to="/ruby" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Ruby</Link>
                      <Link to="/aquamarine" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Aquamarine</Link>
                      <Link to="/tanzanite" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Tanzanite</Link>
                      <Link to="/blue-topaz" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Blue Topaz</Link>
                    </div>
                  </div>

                  {/* ETERNITY RINGS Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">ETERNITY RINGS</h3>
                    <div className="space-y-1">
                      <Link to="/diamond-full-band" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Full Band</Link>
                      <Link to="/diamond-half-band" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Half Band</Link>
                      <Link to="/unique-eternity-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Unique Eternity Rings</Link>
                      <Link to="/sapphire-eternity" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Sapphire</Link>
                      <Link to="/emerald-eternity" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Emerald</Link>
                      <Link to="/ruby-eternity" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Ruby</Link>
                      <Link to="/mens-eternity-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Men's Eternity Rings</Link>
                      <Link to="/all-eternity-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>All Eternity Rings</Link>
                    </div>
                  </div>

                  {/* METALS Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">METALS</h3>
                    <div className="space-y-1">
                      <Link to="/yellow-gold" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Yellow Gold</Link>
                      <Link to="/white-gold" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>White Gold</Link>
                      <Link to="/platinum" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Platinum</Link>
                      <Link to="/silver" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Silver</Link>
                      <Link to="/gold-vermeil" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Gold Vermeil</Link>
                    </div>
                    
                    {/* Explore Rings Button */}
                    <div className="mt-4">
                      <Link 
                        to="/rings" 
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-xs font-inter font-semibold uppercase tracking-wide hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all duration-200 ease-out rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                      >
                        EXPLORE RINGS
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Wedding Dropdown */}
          {weddingHover && (
            <div 
              className={`absolute left-0 right-0 top-full w-full shadow-xl border border-gray-100/50 z-[60] duration-300 ease-out ${
                weddingClosing 
                  ? 'animate-out slide-out-to-top-4' 
                  : 'animate-in slide-in-from-top-4'
              }`}
              onMouseEnter={handleHoverEnter(setWeddingHover)}
              onMouseLeave={handleHoverLeave(setWeddingHover, setWeddingClosing)}
              style={{backgroundColor: '#fcfcfc'}}
            >
              <div className="max-w-7xl mx-auto px-12 pt-6 pb-8">
                <div className="grid grid-cols-4 gap-8">
                  {/* WEDDING RINGS Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">WEDDING RINGS</h3>
                    <div className="space-y-1">
                      <Link to="/wedding-bands" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Wedding Bands</Link>
                      <Link to="/his-hers-sets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>His & Hers Sets</Link>
                      <Link to="/womens-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Women's Wedding Rings</Link>
                      <Link to="/mens-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Men's Wedding Rings</Link>
                      <Link to="/diamond-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Wedding Rings</Link>
                      <Link to="/plain-wedding-bands" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Plain Wedding Bands</Link>
                      <Link to="/vintage-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Vintage Wedding Rings</Link>
                      <Link to="/matching-wedding-sets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Matching Wedding Sets</Link>
                    </div>
                  </div>

                  {/* STYLES Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">STYLES</h3>
                    <div className="space-y-1">
                      <Link to="/classic-wedding-bands" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Classic Bands</Link>
                      <Link to="/pavé-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Pavé Setting</Link>
                      <Link to="/channel-set-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Channel Set</Link>
                      <Link to="/eternity-wedding-bands" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Eternity Style</Link>
                      <Link to="/engraved-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Engraved</Link>
                      <Link to="/milgrain-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Milgrain Detail</Link>
                      <Link to="/twisted-wedding-bands" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Twisted Design</Link>
                      <Link to="/curved-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Curved Bands</Link>
                    </div>
                  </div>

                  {/* METALS Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">METALS</h3>
                    <div className="space-y-1">
                      <Link to="/platinum-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Platinum</Link>
                      <Link to="/white-gold-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>White Gold</Link>
                      <Link to="/yellow-gold-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Yellow Gold</Link>
                      <Link to="/rose-gold-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Rose Gold</Link>
                      <Link to="/titanium-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Titanium</Link>
                      <Link to="/mixed-metal-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Mixed Metals</Link>
                    </div>
                  </div>

                  {/* SERVICES & GUIDE Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">SERVICES & GUIDE</h3>
                    <div className="space-y-1">
                      <Link to="/wedding-ring-guide" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Wedding Ring Guide</Link>
                      <Link to="/ring-sizing" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Ring Sizing</Link>
                      <Link to="/custom-wedding-rings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Custom Design</Link>
                      <Link to="/wedding-ring-engraving" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Engraving Services</Link>
                      <Link to="/wedding-ring-care" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Care & Maintenance</Link>
                    </div>
                    
                    {/* Explore Wedding Button */}
                    <div className="mt-4">
                      <Link 
                        to="/wedding" 
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-xs font-inter font-semibold uppercase tracking-wide hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all duration-200 ease-out rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                      >
                        EXPLORE WEDDING
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diamonds Dropdown */}
          {diamondsHover && (
            <div 
              className={`absolute left-0 right-0 top-full w-full shadow-xl border border-gray-100/50 z-[60] duration-300 ease-out ${
                diamondsClosing 
                  ? 'animate-out slide-out-to-top-4' 
                  : 'animate-in slide-in-from-top-4'
              }`}
              onMouseEnter={handleHoverEnter(setDiamondsHover)}
              onMouseLeave={handleHoverLeave(setDiamondsHover, setDiamondsClosing)}
              style={{backgroundColor: '#fcfcfc'}}
            >
              <div className="max-w-7xl mx-auto px-12 pt-6 pb-8">
                <div className="grid grid-cols-4 gap-8">
                  {/* DIAMOND TYPES Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">DIAMOND TYPES</h3>
                    <div className="space-y-1">
                      <Link to="/natural-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Natural Diamonds</Link>
                      <Link to="/lab-grown-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Lab Grown Diamonds</Link>
                      <Link to="/certified-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Certified Diamonds</Link>
                      <Link to="/loose-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Loose Diamonds</Link>
                      <Link to="/colored-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Colored Diamonds</Link>
                      <Link to="/vintage-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Vintage Diamonds</Link>
                    </div>
                  </div>

                  {/* SHAPES Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">DIAMOND SHAPES</h3>
                    <div className="space-y-1">
                      <Link to="/round-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Round</Link>
                      <Link to="/princess-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Princess</Link>
                      <Link to="/oval-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Oval</Link>
                      <Link to="/emerald-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Emerald</Link>
                      <Link to="/cushion-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Cushion</Link>
                      <Link to="/pear-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Pear</Link>
                      <Link to="/marquise-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Marquise</Link>
                      <Link to="/heart-diamonds" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Heart</Link>
                    </div>
                  </div>

                  {/* QUALITY Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">DIAMOND QUALITY</h3>
                    <div className="space-y-1">
                      <Link to="/diamond-cut" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Cut Quality</Link>
                      <Link to="/diamond-color" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Color Grades</Link>
                      <Link to="/diamond-clarity" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Clarity Grades</Link>
                      <Link to="/diamond-carat" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Carat Weight</Link>
                      <Link to="/diamond-certification" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Certification</Link>
                      <Link to="/diamond-grading" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Grading Reports</Link>
                    </div>
                  </div>

                  {/* EDUCATION & SERVICES Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">EDUCATION & SERVICES</h3>
                    <div className="space-y-1">
                      <Link to="/diamond-education" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Education</Link>
                      <Link to="/4cs-guide" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>The 4 C's Guide</Link>
                      <Link to="/diamond-appraisal" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Appraisal</Link>
                      <Link to="/diamond-upgrade" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Upgrade</Link>
                      <Link to="/diamond-care" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Care</Link>
                    </div>
                    
                    {/* Explore Diamonds Button */}
                    <div className="mt-4">
                      <Link 
                        to="/diamonds" 
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-xs font-inter font-semibold uppercase tracking-wide hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all duration-200 ease-out rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                      >
                        EXPLORE DIAMONDS
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Jewellery Dropdown */}
          {jewelleryHover && (
            <div 
              className={`absolute left-0 right-0 top-full w-full shadow-xl border border-gray-100/50 z-[60] duration-300 ease-out ${
                jewelleryClosing 
                  ? 'animate-out slide-out-to-top-4' 
                  : 'animate-in slide-in-from-top-4'
              }`}
              onMouseEnter={handleHoverEnter(setJewelleryHover)}
              onMouseLeave={handleHoverLeave(setJewelleryHover, setJewelleryClosing)}
              style={{backgroundColor: '#fcfcfc'}}
            >
              <div className="max-w-7xl mx-auto px-12 pt-6 pb-8">
                <div className="grid grid-cols-4 gap-8">
                  {/* EARRINGS Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">EARRINGS</h3>
                    <div className="space-y-1">
                      <Link to="/stud-earrings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Stud Earrings</Link>
                      <Link to="/drop-earrings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Drop Earrings</Link>
                      <Link to="/hoop-earrings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Hoop Earrings</Link>
                      <Link to="/chandelier-earrings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Chandelier Earrings</Link>
                      <Link to="/huggie-earrings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Huggie Earrings</Link>
                      <Link to="/diamond-earrings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Earrings</Link>
                      <Link to="/pearl-earrings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Pearl Earrings</Link>
                      <Link to="/gemstone-earrings" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Gemstone Earrings</Link>
                    </div>
                  </div>

                  {/* NECKLACES Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">NECKLACES</h3>
                    <div className="space-y-1">
                      <Link to="/pendant-necklaces" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Pendant Necklaces</Link>
                      <Link to="/chain-necklaces" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Chain Necklaces</Link>
                      <Link to="/choker-necklaces" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Choker Necklaces</Link>
                      <Link to="/tennis-necklaces" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Tennis Necklaces</Link>
                      <Link to="/layering-necklaces" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Layering Necklaces</Link>
                      <Link to="/lockets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Lockets</Link>
                      <Link to="/statement-necklaces" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Statement Necklaces</Link>
                      <Link to="/pearl-necklaces" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Pearl Necklaces</Link>
                    </div>
                  </div>

                  {/* BRACELETS Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">BRACELETS</h3>
                    <div className="space-y-1">
                      <Link to="/tennis-bracelets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Tennis Bracelets</Link>
                      <Link to="/charm-bracelets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Charm Bracelets</Link>
                      <Link to="/bangle-bracelets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Bangle Bracelets</Link>
                      <Link to="/link-bracelets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Link Bracelets</Link>
                      <Link to="/cuff-bracelets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Cuff Bracelets</Link>
                      <Link to="/diamond-bracelets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Diamond Bracelets</Link>
                      <Link to="/gemstone-bracelets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Gemstone Bracelets</Link>
                      <Link to="/pearl-bracelets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Pearl Bracelets</Link>
                    </div>
                  </div>

                  {/* GIFTS & OCCASIONS Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">GIFTS & OCCASIONS</h3>
                    <div className="space-y-1">
                      <Link to="/birthday-gifts" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Birthday Gifts</Link>
                      <Link to="/anniversary-gifts" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Anniversary Gifts</Link>
                      <Link to="/mothers-day-gifts" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Mother's Day</Link>
                      <Link to="/valentine-gifts" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Valentine's Day</Link>
                      <Link to="/graduation-gifts" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Graduation Gifts</Link>
                      <Link to="/gift-sets" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Gift Sets</Link>
                    </div>
                    
                    {/* Explore Jewellery Button */}
                    <div className="mt-4">
                      <Link 
                        to="/jewellery" 
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-xs font-inter font-semibold uppercase tracking-wide hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all duration-200 ease-out rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                      >
                        EXPLORE JEWELLERY
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Watches Dropdown */}
          {watchesHover && (
            <div
              className={`absolute left-0 right-0 top-full w-full shadow-xl border border-gray-100/50 z-[60] duration-300 ease-out ${
                watchesClosing
                  ? 'animate-out slide-out-to-top-4'
                  : 'animate-in slide-in-from-top-4'
              }`}
              onMouseEnter={handleHoverEnter(setWatchesHover)}
              onMouseLeave={handleHoverLeave(setWatchesHover, setWatchesClosing)}
              style={{backgroundColor: '#fcfcfc'}}
            >
              <div className="max-w-7xl mx-auto px-12 pt-8 pb-10">
                {loadingWatches ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm font-inter text-gray-500">Loading collections...</p>
                  </div>
                ) : watchBrands.length > 0 ? (
                  <div className="grid grid-cols-3 gap-12">
                    {watchBrands.map((brand) => (
                      <div key={brand.id} className="space-y-4">
                        {/* Brand Header */}
                        <div className="border-b border-gray-200 pb-3">
                          <Link
                            to={`/watches?brand=${brand.slug}`}
                            className="group flex items-center space-x-2 hover:opacity-70 transition-opacity"
                          >
                            <h3 className="text-sm font-cormorant font-semibold text-gray-950 uppercase tracking-wider">
                              {brand.name}
                            </h3>
                            <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg] group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>

                        {/* Collections */}
                        <div className="space-y-3">
                          {brand.collections.length > 0 ? (
                            brand.collections.map((collection) => (
                              <Link
                                key={collection.id}
                                to={`/watches?brand=${brand.slug}&collection=${collection.slug}`}
                                className="group block"
                              >
                                <div className="flex items-start space-x-3">
                                  {collection.image_url && (
                                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-sm overflow-hidden">
                                      <img
                                        src={collection.image_url}
                                        alt={collection.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-inter font-medium text-gray-900 group-hover:text-gray-600 transition-colors leading-snug">
                                      {collection.name}
                                      {collection.is_featured && (
                                        <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                      )}
                                    </p>
                                    {collection.launch_year && (
                                      <p className="text-xs font-inter text-gray-500 mt-0.5">
                                        Est. {collection.launch_year}
                                      </p>
                                    )}
                                    {collection.watches_count > 0 && (
                                      <p className="text-xs font-inter text-gray-400 mt-0.5">
                                        {collection.watches_count} {collection.watches_count === 1 ? 'watch' : 'watches'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <p className="text-xs font-inter text-gray-400 italic">No collections available</p>
                          )}

                          {/* View All Link */}
                          <Link
                            to={`/watches?brand=${brand.slug}`}
                            className="inline-flex items-center text-xs font-inter font-medium text-gray-600 hover:text-gray-900 transition-colors mt-2"
                          >
                            View all {brand.name}
                            <ChevronDown className="w-3 h-3 ml-1 transform rotate-[-90deg]" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm font-inter text-gray-500">No watch collections available</p>
                  </div>
                )}

                {/* Explore All Watches Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
                  <Link
                    to="/watches"
                    className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white text-xs font-inter font-semibold uppercase tracking-wider hover:bg-gray-800 hover:shadow-lg hover:scale-105 transition-all duration-200 ease-out rounded-sm"
                  >
                    EXPLORE ALL WATCHES
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Our Heritage Dropdown */}
          {heritageHover && (
            <div 
              className={`absolute left-0 right-0 top-full w-full shadow-xl border border-gray-100/50 z-[60] duration-300 ease-out ${
                heritageClosing 
                  ? 'animate-out slide-out-to-top-4' 
                  : 'animate-in slide-in-from-top-4'
              }`}
              onMouseEnter={handleHoverEnter(setHeritageHover)}
              onMouseLeave={handleHoverLeave(setHeritageHover, setHeritageClosing)}
              style={{backgroundColor: '#fcfcfc'}}
            >
              <div className="max-w-7xl mx-auto px-12 pt-6 pb-8">
                <div className="grid grid-cols-4 gap-8">
                  {/* OUR STORY Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">OUR STORY</h3>
                    <div className="space-y-1">
                      <Link to="/our-story#about-us" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>About Us</Link>
                      <Link to="/our-story#our-history" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Our History</Link>
                      <Link to="/our-story#our-craftsmen" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Our Craftsmen</Link>
                      <Link to="/our-story#our-philosophy" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Our Philosophy</Link>
                      <Link to="/our-story#awards-recognition" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Awards & Recognition</Link>
                      <Link to="/our-story#customer-stories" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Customer Stories</Link>
                    </div>
                  </div>

                  {/* SERVICES Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">CUSTOMER SERVICE</h3>
                    <div className="space-y-1">
                      <Link to="/customer-service#bespoke-design" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Bespoke Design</Link>
                      <Link to="/customer-service#jewellery-repair" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Jewellery Repair</Link>
                      <Link to="/customer-service#ring-resizing" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Ring Resizing</Link>
                      <Link to="/customer-service#valuations" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Valuations</Link>
                      <Link to="/customer-service#cleaning-care" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Cleaning & Care</Link>
                      <Link to="/customer-service#engraving-services" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Engraving Services</Link>
                      <Link to="/customer-service#gift-wrapping" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Gift Wrapping</Link>
                    </div>
                  </div>

                  {/* LOCATION & CONTACT Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">VISIT US</h3>
                    <div className="space-y-1">
                      <Link to="/visit-us#our-showroom" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Our Showroom</Link>
                      <Link to="/visit-us#book-appointment" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Book Appointment</Link>
                      <Link to="/visit-us#private-viewing" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Private Viewing</Link>
                      <Link to="/visit-us#directions" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Directions</Link>
                      <Link to="/visit-us#opening-hours" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Opening Hours</Link>
                      <Link to="/visit-us#parking-information" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Parking Information</Link>
                    </div>
                  </div>

                  {/* TRUST & GUARANTEES Column */}
                  <div>
                    <h3 className="text-xs font-inter font-bold text-gray-950 uppercase tracking-wide mb-3">TRUST & GUARANTEES</h3>
                    <div className="space-y-1">
                      <Link to="/trust-guarantees#lifetime-warranty" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Lifetime Warranty</Link>
                      <Link to="/trust-guarantees#money-back-guarantee" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Money Back Guarantee</Link>
                      <Link to="/trust-guarantees#certified-quality" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Certified Quality</Link>
                      <Link to="/trust-guarantees#ethical-sourcing" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Ethical Sourcing</Link>
                      <Link to="/trust-guarantees#secure-shopping" className="block font-inter font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12.36px'}}>Secure Shopping</Link>
                    </div>
                    
                    {/* Learn More Button */}
                    <div className="mt-4">
                      <Link 
                        to="/trust-guarantees#learn-more" 
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-xs font-inter font-semibold uppercase tracking-wide hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all duration-200 ease-out rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                      >
                        LEARN MORE
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
            className={`absolute left-0 top-0 h-full w-full shadow-xl transform transition-transform duration-300 ease-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{
              background: 'linear-gradient(180deg, #fefefe 0%, #fcfcfc 50%, #fafafa 100%)',
              backdropFilter: 'blur(20px)'
            }}
          >
            <div className="h-full overflow-y-auto">
            {/* Mobile Header */}
            <div className="border-b border-gray-200/30 px-0 py-0" style={{background: 'linear-gradient(90deg, #fafafa 0%, #fcfcfc 100%)'}}>
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex-1 text-center">
                  <div className="text-xl font-cormorant font-light uppercase text-gray-900" style={{letterSpacing: '0.3em'}}>
                    McCulloch
                  </div>
                  <div className="text-xs font-cormorant font-light uppercase text-gray-600 mt-0.5" style={{letterSpacing: '0.5em'}}>
                    Jewellers
                  </div>
                </div>
                <button 
                  onClick={closeMobileMenu}
                  className="p-2 hover:bg-white/60 hover:shadow-sm rounded-full transition-all duration-200"
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
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/40 hover:shadow-sm transition-all duration-300 ease-out"
                  >
                    <span className="text-sm font-inter font-normal text-gray-800 uppercase tracking-wide">ENGAGEMENT</span>
                    {expandedSection === 'engagement' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSection === 'engagement' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="bg-gray-50/30">
                      {/* Diamond Engagement Rings Subsection */}
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/40">
                          <span className="text-xs font-inter font-medium text-gray-800 uppercase tracking-wide">DIAMOND ENGAGEMENT RINGS</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-1 ml-4">
                          <Link
                            to="/engagement/all"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Circle className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            All Engagement Rings
                          </Link>
                          <Link
                            to="/engagement/quickship"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Diamond className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Quickship Collection
                          </Link>
                          <Link
                            to="/engagement/inspiration"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Star className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Inspiration Gallery
                          </Link>
                          <Link
                            to="/engagement/reviews"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Star className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Reviews
                          </Link>
                        </div>
                      </div>

                      {/* Shop by Styles Subsection */}
                      <div className="px-6 py-4 border-t border-gray-200/30">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/40">
                          <span className="text-xs font-inter font-medium text-gray-800 uppercase tracking-wide">SHOP BY STYLES</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-1 ml-4">
                          <Link
                            to="/engagement/solitaire"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Circle className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Solitaire
                          </Link>
                          <Link
                            to="/engagement/trilogy"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Gem className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Trilogy
                          </Link>
                          <Link
                            to="/engagement/diamond-band"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Layers className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Diamond Band
                          </Link>
                          <Link
                            to="/engagement/halo"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Crown className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Halo
                          </Link>
                          <Link
                            to="/engagement/platinum"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Circle className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Platinum
                          </Link>
                          <Link
                            to="/engagement/rose-gold"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Heart className="w-4 h-4 text-rose-400 mr-3" />
                            Rose Gold
                          </Link>
                          <Link
                            to="/engagement/yellow-gold"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md" style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Circle className="w-4 h-4 text-yellow-400 mr-3" />
                            Yellow Gold
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wedding Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'wedding' ? null : 'wedding')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/40 hover:shadow-sm transition-all duration-300 ease-out"
                  >
                    <span className="text-sm font-inter font-normal text-gray-800 uppercase tracking-wide">WEDDING</span>
                    {expandedSection === 'wedding' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSection === 'wedding' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="bg-gray-50/30">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/40">
                          <span className="text-xs font-inter font-medium text-gray-800 uppercase tracking-wide">WEDDING COLLECTIONS</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-1 ml-4">
                          <Link
                            to="/wedding/all"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md"
                            style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Circle className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            All Wedding Rings
                          </Link>
                          <Link
                            to="/wedding/his"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md"
                            style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Circle className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            His Wedding Rings
                          </Link>
                          <Link
                            to="/wedding/hers"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md"
                            style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Heart className="w-4 h-4 text-rose-400 mr-3 flex-shrink-0" />
                            Her Wedding Rings
                          </Link>
                          <Link
                            to="/wedding/matching-sets"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md"
                            style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Layers className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Matching Sets
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diamonds Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'diamonds' ? null : 'diamonds')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/40 hover:shadow-sm transition-all duration-300 ease-out"
                  >
                    <span className="text-sm font-inter font-normal text-gray-800 uppercase tracking-wide">DIAMONDS</span>
                    {expandedSection === 'diamonds' ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSection === 'diamonds' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="bg-gray-50/30">
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200/40">
                          <span className="text-xs font-inter font-medium text-gray-800 uppercase tracking-wide">DIAMOND COLLECTIONS</span>
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="space-y-1 ml-4">
                          <Link
                            to="/diamonds/engagement"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md"
                            style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Diamond className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Diamond Engagement
                          </Link>
                          <Link
                            to="/diamonds/loose"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md"
                            style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Gem className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Loose Diamonds
                          </Link>
                          <Link
                            to="/diamonds/lab-grown"
                            className="flex items-center font-inter font-normal text-gray-800 hover:text-gray-900 hover:bg-white/70 hover:shadow-sm hover:scale-[1.02] transition-all duration-300 ease-out py-2 px-2 rounded-md"
                            style={{fontSize: '12.36px'}}
                            onClick={closeMobileMenu}
                          >
                            <Star className="w-4 h-4 text-gray-500 mr-3 flex-shrink-0" />
                            Lab Grown
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Jewellery Section */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setExpandedSection(expandedSection === 'jewellery' ? null : 'jewellery')}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/40 hover:shadow-sm transition-all duration-300 ease-out"
                  >
                    <span className="text-sm font-inter font-normal text-gray-800 uppercase tracking-wide">JEWELLERY</span>
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
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/40 hover:shadow-sm transition-all duration-300 ease-out"
                  >
                    <span className="text-sm font-inter font-normal text-gray-800 uppercase tracking-wide">GUIDES</span>
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
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gradient-to-r hover:from-white/60 hover:to-gray-50/40 hover:shadow-sm transition-all duration-300 ease-out"
                  >
                    <span className="text-sm font-inter font-normal text-gray-800 uppercase tracking-wide">ABOUT US</span>
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
                  className="flex items-center px-6 py-4 border-b border-gray-200/50 hover:bg-gray-50/60 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-inter font-normal text-gray-800">Book Appointment</div>
                    <div className="text-xs font-inter font-light text-gray-700">Schedule your free consultation</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Phone */}
                <Link
                  to="/contact"
                  className="flex items-center px-6 py-4 border-b border-gray-200/50 hover:bg-gray-50/60 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-inter font-normal text-gray-800">Phone</div>
                    <div className="text-xs font-inter font-light text-gray-700">Call on +44 207 831 1901</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Email */}
                <Link
                  to="/contact"
                  className="flex items-center px-6 py-4 border-b border-gray-200/50 hover:bg-gray-50/60 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <Mail className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-inter font-normal text-gray-800">Email</div>
                    <div className="text-xs font-inter font-light text-gray-700">Got any questions about rings? Send us an email</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-[-90deg]" />
                </Link>

                {/* Help & FAQs */}
                <Link
                  to="/faq"
                  className="flex items-center px-6 py-4 hover:bg-gray-50/60 transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                    <HelpCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-inter font-normal text-gray-800">Help & FAQs</div>
                    <div className="text-xs font-inter font-light text-gray-700">Phone lines available Mon-Fri 9:30am - 6pm</div>
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