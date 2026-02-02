import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp, Calendar, Phone, Mail, HelpCircle, Diamond, Gem, Circle, Layers, Star, Heart, Crown, ArrowRight, ArrowLeft } from "lucide-react";
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

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_count: number;
  parent_id?: string | null;
  children?: Category[];
}

interface NavigationItem {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  color_code?: string;
}

interface NavigationData {
  ring_types?: NavigationItem[];
  gemstones?: NavigationItem[];
  metals?: NavigationItem[];
  eternity_rings?: NavigationItem[];
}

const LuxuryNavigationWhite = (): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
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

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Navigation data state
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [loadingNavigation, setLoadingNavigation] = useState(false);

  // Jewelry types state
  const [earringTypes, setEarringTypes] = useState<NavigationItem[]>([]);
  const [necklaceTypes, setNecklaceTypes] = useState<NavigationItem[]>([]);
  const [braceletTypes, setBraceletTypes] = useState<NavigationItem[]>([]);

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
  const anyDropdownOpen = engagementHover || weddingHover || diamondsHover || jewelleryHover || watchesHover;

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

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch(`${API_BASE_URL}/products/categories`);
        const data = await response.json();

        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch navigation data on component mount
  useEffect(() => {
    const fetchNavigationData = async () => {
      try {
        setLoadingNavigation(true);
        const response = await fetch(`${API_BASE_URL}/products/navigation`);
        const data = await response.json();

        if (data.success) {
          setNavigationData(data.data);
        }
      } catch (error) {
        console.error('Error fetching navigation data:', error);
      } finally {
        setLoadingNavigation(false);
      }
    };

    fetchNavigationData();
  }, []);

  // Fetch jewelry types for navigation
  useEffect(() => {
    const fetchJewelryTypes = async () => {
      try {
        const [earringsRes, necklacesRes, braceletsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/filters/earring-types`),
          fetch(`${API_BASE_URL}/filters/necklace-types`),
          fetch(`${API_BASE_URL}/filters/bracelet-types`)
        ]);

        const [earringsData, necklacesData, braceletsData] = await Promise.all([
          earringsRes.json(),
          necklacesRes.json(),
          braceletsRes.json()
        ]);

        if (earringsData.success) {
          setEarringTypes(earringsData.data || []);
        }
        if (necklacesData.success) {
          setNecklaceTypes(necklacesData.data || []);
        }
        if (braceletsData.success) {
          setBraceletTypes(braceletsData.data || []);
        }
      } catch (error) {
        console.error('Error fetching jewelry types:', error);
      }
    };

    fetchJewelryTypes();
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
          className="relative transition-all duration-0 bg-white"
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
                  <span className="text-xs uppercase tracking-widest transition-colors duration-0 text-gray-600">UK</span>
                </div>

                {/* Center Logo */}
                <div className="flex-1 flex justify-center mx-12">
                  <Link to="/" className="flex flex-col items-center">
                    <div className="text-2xl font-serif font-light tracking-[0.3em] uppercase transition-colors duration-0 text-gray-900">
                      McCulloch
                    </div>
                    <div className="text-sm font-light tracking-[0.5em] uppercase transition-colors duration-0 text-gray-600">
                      Jewellers
                    </div>
                  </Link>
                </div>

                {/* Right Icons */}
                <div className="flex items-center space-x-4 min-w-[120px] justify-end">
                  <div className="relative group">
                    <button onClick={openSearch}>
                      <svg className="w-5 h-5 cursor-pointer transition-colors duration-0 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Search
                    </div>
                  </div>

                  <div className="relative group">
                    <svg className="w-5 h-5 cursor-pointer transition-colors duration-0 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <circle cx="12" cy="8" r="5"/>
                      <path d="M20 21a8 8 0 1 0-16 0"/>
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Account
                    </div>
                  </div>

                  <div className="relative group">
                    <svg className="w-5 h-5 cursor-pointer transition-colors duration-0 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Wishlist
                    </div>
                  </div>

                  <div className="relative group">
                    <button
                      onClick={openCart}
                      className="relative"
                    >
                      <svg className="w-5 h-5 cursor-pointer transition-colors duration-0 text-gray-600 hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                        <path d="M3 6h18"/>
                        <path d="M16 10a4 4 0 0 1-8 0"/>
                      </svg>
                      {getCartCount() > 0 && (
                        <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-xs flex items-center justify-center font-medium transition-colors duration-0 bg-gray-900 text-white">
                          {getCartCount()}
                        </span>
                      )}
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                      Cart {getCartCount() > 0 && `(${getCartCount()})`}
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
                      to="/engagement-rings"
                      className="text-xs uppercase tracking-[0.2em] transition-colors duration-0 text-gray-700 hover:text-gray-900"
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
                      className="text-xs uppercase tracking-[0.2em] transition-colors duration-0 text-gray-700 hover:text-gray-900"
                    >
                      Wedding
                    </Link>
                  </div>
                  {/* Diamonds link commented out - client deciding on content */}
                  {/* <div
                    className="relative"
                    onMouseEnter={handleHoverEnter(setDiamondsHover)}
                    onMouseLeave={handleHoverLeave(setDiamondsHover, setDiamondsClosing)}
                  >
                    <Link
                      to="/diamonds"
                      className="text-xs uppercase tracking-[0.2em] transition-colors duration-0 text-gray-700 hover:text-gray-900"
                    >
                      Diamonds
                    </Link>
                  </div> */}
                  <div 
                    className="relative"
                    onMouseEnter={handleHoverEnter(setJewelleryHover)}
                    onMouseLeave={handleHoverLeave(setJewelleryHover, setJewelleryClosing)}
                  >
                    <Link 
                      to="/jewellery" 
                      className="text-xs uppercase tracking-[0.2em] transition-colors duration-0 text-gray-700 hover:text-gray-900"
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
                      className="text-xs uppercase tracking-[0.2em] transition-colors duration-0 text-gray-700 hover:text-gray-900"
                    >
                      Watches
                    </Link>
                  </div>
                  <Link
                    to="/bespoke-design"
                    className="text-xs uppercase tracking-[0.2em] transition-colors duration-0 text-gray-700 hover:text-gray-900"
                  >
                    Bespoke Design
                  </Link>
                  <Link
                    to="/our-story"
                    className="text-xs uppercase tracking-[0.2em] transition-colors duration-0 text-gray-700 hover:text-gray-900"
                  >
                    Our Story
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
                {loadingNavigation ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm font-satoshi text-gray-500">Loading...</p>
                  </div>
                ) : navigationData ? (
                  <div className="grid grid-cols-4 gap-8">
                    {/* Ring Types Column */}
                    {navigationData?.ring_types && navigationData.ring_types.length > 0 && (
                      <div>
                        <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>RING TYPES</h3>
                        <div className="space-y-1">
                          {navigationData.ring_types.slice(0, 8).map((item) => (
                            <Link
                              key={item.id}
                              to={`/engagement-rings?ringType=${encodeURIComponent(item.name)}`}
                              className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                              style={{fontSize: '12px'}}
                            >
                              {item.name}
                            </Link>
                          ))}
                          <Link
                            to="/engagement-rings"
                            className="block font-satoshi font-bold text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                            style={{fontSize: '12px'}}
                          >
                            Shop All
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Gemstones Column */}
                    {navigationData?.gemstones && navigationData.gemstones.length > 0 && (
                      <div>
                        <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>GEMSTONES</h3>
                        <div className="space-y-1">
                          {navigationData.gemstones.slice(0, 8).map((item) => (
                            <Link
                              key={item.id}
                              to={`/engagement-rings?gemstone=${encodeURIComponent(item.name)}`}
                              className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                              style={{fontSize: '12px'}}
                            >
                              {item.name}
                            </Link>
                          ))}
                          <Link
                            to="/engagement-rings"
                            className="block font-satoshi font-bold text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                            style={{fontSize: '12px'}}
                          >
                            Shop All
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Eternity Rings Column */}
                    {navigationData?.eternity_rings && navigationData.eternity_rings.length > 0 && (
                      <div>
                        <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>ETERNITY RINGS</h3>
                        <div className="space-y-1">
                          {navigationData.eternity_rings.map((item) => (
                            <Link
                              key={item.id}
                              to={`/engagement-rings?collection=${encodeURIComponent(item.name)}`}
                              className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                              style={{fontSize: '12px'}}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metals Column */}
                    {navigationData?.metals && navigationData.metals.length > 0 && (
                      <div>
                        <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>METALS</h3>
                        <div className="space-y-1">
                          {navigationData.metals.map((item) => (
                            <Link
                              key={item.id}
                              to={`/engagement-rings?metal=${encodeURIComponent(item.name)}`}
                              className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                              style={{fontSize: '12px'}}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm font-satoshi text-gray-500">No navigation data available</p>
                  </div>
                )}
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
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>WEDDING RINGS</h3>
                    <div className="space-y-1">
                      <Link to="/wedding-bands" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Wedding Bands</Link>
                      <Link to="/his-hers-sets" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>His & Hers Sets</Link>
                      <Link to="/womens-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Women's Wedding Rings</Link>
                      <Link to="/mens-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Men's Wedding Rings</Link>
                      <Link to="/diamond-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Diamond Wedding Rings</Link>
                      <Link to="/plain-wedding-bands" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Plain Wedding Bands</Link>
                      <Link to="/vintage-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Vintage Wedding Rings</Link>
                      <Link to="/matching-wedding-sets" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Matching Wedding Sets</Link>
                    </div>
                  </div>

                  {/* STYLES Column */}
                  <div>
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>STYLES</h3>
                    <div className="space-y-1">
                      <Link to="/classic-wedding-bands" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Classic Bands</Link>
                      <Link to="/pavé-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Pavé Setting</Link>
                      <Link to="/channel-set-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Channel Set</Link>
                      <Link to="/eternity-wedding-bands" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Eternity Style</Link>
                      <Link to="/engraved-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Engraved</Link>
                      <Link to="/milgrain-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Milgrain Detail</Link>
                      <Link to="/twisted-wedding-bands" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Twisted Design</Link>
                      <Link to="/curved-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Curved Bands</Link>
                    </div>
                  </div>

                  {/* METALS Column */}
                  <div>
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>METALS</h3>
                    <div className="space-y-1">
                      <Link to="/platinum-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Platinum</Link>
                      <Link to="/white-gold-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>White Gold</Link>
                      <Link to="/yellow-gold-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Yellow Gold</Link>
                      <Link to="/rose-gold-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Rose Gold</Link>
                      <Link to="/titanium-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Titanium</Link>
                      <Link to="/mixed-metal-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Mixed Metals</Link>
                    </div>
                  </div>

                  {/* SERVICES & GUIDE Column */}
                  <div>
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>SERVICES & GUIDE</h3>
                    <div className="space-y-1">
                      <Link to="/wedding-ring-guide" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Wedding Ring Guide</Link>
                      <Link to="/ring-sizing" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Ring Sizing</Link>
                      <Link to="/custom-wedding-rings" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Custom Design</Link>
                      <Link to="/wedding-ring-engraving" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Engraving Services</Link>
                      <Link to="/wedding-ring-care" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Care & Maintenance</Link>
                    </div>
                    
                    {/* Explore Wedding Button */}
                    <div className="mt-4">
                      <Link 
                        to="/wedding" 
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-xs font-satoshi font-semibold uppercase tracking-wide hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all duration-200 ease-out rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                      >
                        EXPLORE WEDDING
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diamonds Dropdown - Commented out - client deciding on content */}
          {/* {diamondsHover && (
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
                  <div>
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>DIAMOND TYPES</h3>
                    <div className="space-y-1">
                      <Link to="/natural-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Natural Diamonds</Link>
                      <Link to="/lab-grown-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Lab Grown Diamonds</Link>
                      <Link to="/certified-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Certified Diamonds</Link>
                      <Link to="/loose-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Loose Diamonds</Link>
                      <Link to="/colored-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Colored Diamonds</Link>
                      <Link to="/vintage-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Vintage Diamonds</Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>DIAMOND SHAPES</h3>
                    <div className="space-y-1">
                      <Link to="/round-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Round</Link>
                      <Link to="/princess-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Princess</Link>
                      <Link to="/oval-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Oval</Link>
                      <Link to="/emerald-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Emerald</Link>
                      <Link to="/cushion-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Cushion</Link>
                      <Link to="/pear-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Pear</Link>
                      <Link to="/marquise-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Marquise</Link>
                      <Link to="/heart-diamonds" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Heart</Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>DIAMOND QUALITY</h3>
                    <div className="space-y-1">
                      <Link to="/diamond-cut" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Cut Quality</Link>
                      <Link to="/diamond-color" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Color Grades</Link>
                      <Link to="/diamond-clarity" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Clarity Grades</Link>
                      <Link to="/diamond-carat" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Carat Weight</Link>
                      <Link to="/diamond-certification" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Certification</Link>
                      <Link to="/diamond-grading" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Grading Reports</Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>EDUCATION & SERVICES</h3>
                    <div className="space-y-1">
                      <Link to="/diamond-education" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Diamond Education</Link>
                      <Link to="/4cs-guide" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>The 4 C's Guide</Link>
                      <Link to="/diamond-appraisal" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Diamond Appraisal</Link>
                      <Link to="/diamond-upgrade" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Diamond Upgrade</Link>
                      <Link to="/diamond-care" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Diamond Care</Link>
                    </div>

                    <div className="mt-4">
                      <Link
                        to="/diamonds"
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-xs font-satoshi font-semibold uppercase tracking-wide hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all duration-200 ease-out rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                      >
                        EXPLORE DIAMONDS
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}

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
                    <Link to="/earrings">
                      <h3 className="text-xs font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3 hover:text-gray-700 cursor-pointer transition-colors">EARRINGS</h3>
                    </Link>
                    <div className="space-y-1">
                      <Link to="/earrings" className="block font-satoshi font-medium text-gray-900 hover:text-gray-700 transition-colors duration-200 ease-out leading-relaxed py-0.5 mb-1" style={{fontSize: '12px'}}>Shop All Earrings</Link>
                      {earringTypes.map((type) => (
                        <Link
                          key={type.id}
                          to={`/earrings?type=${encodeURIComponent(type.name)}`}
                          className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                          style={{fontSize: '12px'}}
                        >
                          {type.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* NECKLACES Column */}
                  <div>
                    <Link to="/necklaces">
                      <h3 className="text-xs font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3 hover:text-gray-700 cursor-pointer transition-colors">NECKLACES</h3>
                    </Link>
                    <div className="space-y-1">
                      <Link to="/necklaces" className="block font-satoshi font-medium text-gray-900 hover:text-gray-700 transition-colors duration-200 ease-out leading-relaxed py-0.5 mb-1" style={{fontSize: '12px'}}>Shop All Necklaces</Link>
                      {necklaceTypes.map((type) => (
                        <Link
                          key={type.id}
                          to={`/necklaces?type=${encodeURIComponent(type.name)}`}
                          className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                          style={{fontSize: '12px'}}
                        >
                          {type.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* BRACELETS Column */}
                  <div>
                    <Link to="/bracelets">
                      <h3 className="text-xs font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3 hover:text-gray-700 cursor-pointer transition-colors">BRACELETS</h3>
                    </Link>
                    <div className="space-y-1">
                      <Link to="/bracelets" className="block font-satoshi font-medium text-gray-900 hover:text-gray-700 transition-colors duration-200 ease-out leading-relaxed py-0.5 mb-1" style={{fontSize: '12px'}}>Shop All Bracelets</Link>
                      {braceletTypes.map((type) => (
                        <Link
                          key={type.id}
                          to={`/bracelets?type=${encodeURIComponent(type.name)}`}
                          className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5"
                          style={{fontSize: '12px'}}
                        >
                          {type.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* GIFTS & OCCASIONS Column */}
                  <div>
                    <h3 className="text-base font-satoshi font-bold text-gray-950 uppercase tracking-wide mb-3" style={{fontSize: '16px', fontWeight: 600}}>GIFTS & OCCASIONS</h3>
                    <div className="space-y-1">
                      <Link to="/birthday-gifts" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Birthday Gifts</Link>
                      <Link to="/anniversary-gifts" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Anniversary Gifts</Link>
                      <Link to="/mothers-day-gifts" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Mother's Day</Link>
                      <Link to="/valentine-gifts" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Valentine's Day</Link>
                      <Link to="/graduation-gifts" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Graduation Gifts</Link>
                      <Link to="/gift-sets" className="block font-satoshi font-light text-gray-700 hover:text-gray-900 transition-colors duration-200 ease-out leading-relaxed py-0.5" style={{fontSize: '12px'}}>Gift Sets</Link>
                    </div>
                    
                    {/* Explore Jewellery Button */}
                    <div className="mt-4">
                      <Link 
                        to="/jewellery" 
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-900 text-white text-xs font-satoshi font-semibold uppercase tracking-wide hover:bg-gray-800 hover:shadow-md hover:scale-105 transition-all duration-200 ease-out rounded-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
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
                    <p className="text-sm font-satoshi text-gray-500">Loading collections...</p>
                  </div>
                ) : watchBrands.length > 0 ? (
                  <div className="grid grid-cols-3 gap-12">
                    {watchBrands.map((brand) => (
                      <div key={brand.id} className="space-y-4">
                        {/* Brand Header */}
                        <div className="border-b border-gray-200 pb-3">
                          <Link
                            to={`/${brand.slug}`}
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
                                    <p className="text-sm font-satoshi font-medium text-gray-900 group-hover:text-gray-600 transition-colors leading-snug">
                                      {collection.name}
                                      {collection.is_featured && (
                                        <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                      )}
                                    </p>
                                    {collection.launch_year && (
                                      <p className="text-xs font-satoshi text-gray-500 mt-0.5">
                                        Est. {collection.launch_year}
                                      </p>
                                    )}
                                    {collection.watches_count > 0 && (
                                      <p className="text-xs font-satoshi text-gray-400 mt-0.5">
                                        {collection.watches_count} {collection.watches_count === 1 ? 'watch' : 'watches'}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <p className="text-xs font-satoshi text-gray-400 italic">No collections available</p>
                          )}

                          {/* View All Link */}
                          <Link
                            to={`/${brand.slug}`}
                            className="inline-flex items-center text-xs font-satoshi font-medium text-gray-600 hover:text-gray-900 transition-colors mt-2"
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
                    <p className="text-sm font-satoshi text-gray-500">No watch collections available</p>
                  </div>
                )}

                {/* Explore All Watches Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
                  <Link
                    to="/watches"
                    className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white text-xs font-satoshi font-semibold uppercase tracking-wider hover:bg-gray-800 hover:shadow-lg hover:scale-105 transition-all duration-200 ease-out rounded-sm"
                  >
                    EXPLORE ALL WATCHES
                  </Link>
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
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5 transition-colors duration-300 text-gray-700" />
              </button>

              {/* Center - Minimal Logo/Brand */}
              <div className="flex-1 flex justify-center">
                <Link to="/" className="flex flex-col items-center">
                  <div className="text-lg font-cormorant tracking-[0.2em] uppercase transition-colors duration-300 text-gray-900">
                    McCulloch
                  </div>
                  <div className="text-[10px] font-cormorant tracking-[0.3em] uppercase transition-colors duration-300 text-gray-500">
                    Jewellers
                  </div>
                </Link>
              </div>

              {/* Right - Minimal Actions */}
              <div className="flex items-center space-x-2">
                {/* Search */}
                <button 
                  onClick={openSearch}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-4 h-4 transition-colors duration-300 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </button>

                {/* Shopping Bag */}
                <button 
                  onClick={openCart}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                >
                  <svg className="w-4 h-4 transition-colors duration-300 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  {getCartCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-medium bg-gray-900 text-white">
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

      {/* Mobile Menu - Premium Sliding Panel */}
      {mobileMenuVisible && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMobileMenu}
          />

          {/* Main Menu Panel */}
          <div
            className={`absolute left-0 top-0 h-full w-full bg-white transform transition-transform duration-300 ease-out ${
              mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="h-full flex flex-col">
              {/* Mobile Header - Centered Logo */}
              <div className="relative flex items-center justify-center px-6 py-6 border-b border-gray-100/80">
                {/* Back Button - Left positioned */}
                {activeSubmenu && (
                  <button
                    onClick={() => setActiveSubmenu(null)}
                    className="absolute left-4 flex items-center text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-xs font-light tracking-wide ml-1">Back</span>
                  </button>
                )}

                {/* Centered Logo */}
                <Link to="/" onClick={closeMobileMenu} className="flex flex-col items-center">
                  <span className="text-xl font-cormorant font-light tracking-[0.25em] uppercase text-gray-900">
                    McCulloch
                  </span>
                  <span className="text-[9px] font-light tracking-[0.4em] uppercase text-gray-400 mt-0.5">
                    Jewellers
                  </span>
                </Link>

                {/* Close Button - Right positioned */}
                <button
                  onClick={closeMobileMenu}
                  className="absolute right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-hidden relative">
                {/* Main Menu */}
                <div className={`h-full overflow-y-auto transition-transform duration-300 ease-out ${activeSubmenu ? '-translate-x-full' : 'translate-x-0'}`}>
                  <nav className="py-8 px-6 space-y-1">
                    {/* Engagement */}
                    <button
                      onClick={() => setActiveSubmenu('engagement')}
                      className="w-full flex items-center justify-between py-5 text-left group"
                    >
                      <span className="text-[15px] font-light text-gray-700 tracking-[0.12em] uppercase group-hover:text-gray-900 transition-colors">Engagement</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                    </button>
                    <div className="h-px bg-gray-100"></div>

                    {/* Wedding */}
                    <button
                      onClick={() => setActiveSubmenu('wedding')}
                      className="w-full flex items-center justify-between py-5 text-left group"
                    >
                      <span className="text-[15px] font-light text-gray-700 tracking-[0.12em] uppercase group-hover:text-gray-900 transition-colors">Wedding</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                    </button>
                    <div className="h-px bg-gray-100"></div>

                    {/* Jewellery */}
                    <button
                      onClick={() => setActiveSubmenu('jewellery')}
                      className="w-full flex items-center justify-between py-5 text-left group"
                    >
                      <span className="text-[15px] font-light text-gray-700 tracking-[0.12em] uppercase group-hover:text-gray-900 transition-colors">Jewellery</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                    </button>
                    <div className="h-px bg-gray-100"></div>

                    {/* Watches */}
                    <button
                      onClick={() => setActiveSubmenu('watches')}
                      className="w-full flex items-center justify-between py-5 text-left group"
                    >
                      <span className="text-[15px] font-light text-gray-700 tracking-[0.12em] uppercase group-hover:text-gray-900 transition-colors">Watches</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                    </button>
                    <div className="h-px bg-gray-100"></div>

                    {/* Bespoke Design */}
                    <Link
                      to="/bespoke-design"
                      className="w-full flex items-center justify-between py-5 text-left group"
                      onClick={closeMobileMenu}
                    >
                      <span className="text-[15px] font-light text-gray-700 tracking-[0.12em] uppercase group-hover:text-gray-900 transition-colors">Bespoke Design</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                    </Link>
                    <div className="h-px bg-gray-100"></div>

                    {/* Our Story */}
                    <Link
                      to="/our-story"
                      className="w-full flex items-center justify-between py-5 text-left group"
                      onClick={closeMobileMenu}
                    >
                      <span className="text-[15px] font-light text-gray-700 tracking-[0.12em] uppercase group-hover:text-gray-900 transition-colors">Our Story</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                    </Link>
                  </nav>
                </div>

                {/* Engagement Submenu */}
                <div className={`absolute inset-0 bg-white z-10 transition-transform duration-300 ease-out ${activeSubmenu === 'engagement' ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="pt-4 pb-24 overflow-y-auto h-full px-6">
                    <Link to="/engagement-rings" onClick={closeMobileMenu} className="block py-3 text-lg font-cormorant font-light text-gray-900 border-b border-gray-100 mb-4">
                      Shop All Engagement
                    </Link>
                    {navigationData?.ring_types && navigationData.ring_types.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em] mb-3">Ring Types</h3>
                        {navigationData.ring_types.slice(0, 8).map((item) => (
                          <Link key={item.id} to={`/engagement-rings?ringType=${encodeURIComponent(item.name)}`} onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">{item.name}</Link>
                        ))}
                      </div>
                    )}
                    {navigationData?.gemstones && navigationData.gemstones.length > 0 && (
                      <div className="mb-6 pt-4 border-t border-gray-50">
                        <h3 className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em] mb-3">Gemstones</h3>
                        {navigationData.gemstones.slice(0, 6).map((item) => (
                          <Link key={item.id} to={`/engagement-rings?gemstone=${encodeURIComponent(item.name)}`} onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">{item.name}</Link>
                        ))}
                      </div>
                    )}
                    {navigationData?.metals && navigationData.metals.length > 0 && (
                      <div className="pt-4 border-t border-gray-50">
                        <h3 className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em] mb-3">Metals</h3>
                        {navigationData.metals.map((item) => (
                          <Link key={item.id} to={`/engagement-rings?metal=${encodeURIComponent(item.name)}`} onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">{item.name}</Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Wedding Submenu */}
                <div className={`absolute inset-0 bg-white z-10 transition-transform duration-300 ease-out ${activeSubmenu === 'wedding' ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="pt-4 pb-24 overflow-y-auto h-full px-6">
                    <Link to="/wedding" onClick={closeMobileMenu} className="block py-3 text-lg font-cormorant font-light text-gray-900 border-b border-gray-100 mb-4">
                      Shop All Wedding
                    </Link>
                    <div className="mb-6">
                      <h3 className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em] mb-3">Collections</h3>
                      <Link to="/wedding-rings" onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">All Wedding Rings</Link>
                      <Link to="/wedding?gender=his" onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">His Wedding Rings</Link>
                      <Link to="/wedding?gender=hers" onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">Her Wedding Rings</Link>
                      <Link to="/wedding?type=matching" onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">Matching Sets</Link>
                    </div>
                  </div>
                </div>

                {/* Jewellery Submenu */}
                <div className={`absolute inset-0 bg-white z-10 transition-transform duration-300 ease-out ${activeSubmenu === 'jewellery' ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="pt-4 pb-24 overflow-y-auto h-full px-6">
                    <Link to="/jewellery" onClick={closeMobileMenu} className="block py-3 text-lg font-cormorant font-light text-gray-900 border-b border-gray-100 mb-4">
                      Shop All Jewellery
                    </Link>
                    <div className="mb-6">
                      <h3 className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em] mb-3">Earrings</h3>
                      <Link to="/earrings" onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">Shop All Earrings</Link>
                      {earringTypes.slice(0, 4).map((type) => (
                        <Link key={type.id} to={`/earrings?type=${encodeURIComponent(type.name)}`} onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">{type.name}</Link>
                      ))}
                    </div>
                    <div className="mb-6 pt-4 border-t border-gray-50">
                      <h3 className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em] mb-3">Necklaces</h3>
                      <Link to="/necklaces" onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">Shop All Necklaces</Link>
                      {necklaceTypes.slice(0, 4).map((type) => (
                        <Link key={type.id} to={`/necklaces?type=${encodeURIComponent(type.name)}`} onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">{type.name}</Link>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-gray-50">
                      <h3 className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em] mb-3">Bracelets</h3>
                      <Link to="/bracelets" onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">Shop All Bracelets</Link>
                      {braceletTypes.slice(0, 4).map((type) => (
                        <Link key={type.id} to={`/bracelets?type=${encodeURIComponent(type.name)}`} onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">{type.name}</Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Watches Submenu */}
                <div className={`absolute inset-0 bg-white z-10 transition-transform duration-300 ease-out ${activeSubmenu === 'watches' ? 'translate-x-0' : 'translate-x-full'}`}>
                  <div className="pt-4 pb-24 overflow-y-auto h-full px-6">
                    <Link to="/watches" onClick={closeMobileMenu} className="block py-3 text-lg font-cormorant font-light text-gray-900 border-b border-gray-100 mb-4">
                      Shop All Watches
                    </Link>
                    {loadingWatches ? (
                      <div className="py-8 text-center">
                        <p className="text-[13px] font-light text-gray-400">Loading...</p>
                      </div>
                    ) : watchBrands.length > 0 ? (
                      watchBrands.map((brand, index) => (
                        <div key={brand.id} className={`mb-6 ${index > 0 ? 'pt-4 border-t border-gray-50' : ''}`}>
                          <Link to={`/${brand.slug}`} onClick={closeMobileMenu} className="text-[10px] font-light text-gray-400 uppercase tracking-[0.2em] mb-3 block hover:text-gray-600 transition-colors">{brand.name}</Link>
                          {brand.collections.map((collection) => (
                            <Link key={collection.id} to={`/watches?brand=${brand.slug}&collection=${collection.slug}`} onClick={closeMobileMenu} className="block py-2.5 text-[13px] font-light text-gray-600 hover:text-gray-900 transition-colors">{collection.name}</Link>
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-[13px] font-light text-gray-400">No collections available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Contact Bar - Minimal & Elegant */}
              <div className="border-t border-gray-100 bg-white">
                <div className="flex items-center justify-center divide-x divide-gray-100">
                  <Link
                    to="/appointment"
                    onClick={closeMobileMenu}
                    className="flex-1 flex items-center justify-center py-5 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Calendar className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    <span className="text-[11px] font-light tracking-wider uppercase ml-2.5">Book</span>
                  </Link>
                  <a
                    href="tel:+442078311901"
                    className="flex-1 flex items-center justify-center py-5 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Phone className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    <span className="text-[11px] font-light tracking-wider uppercase ml-2.5">Call</span>
                  </a>
                  <Link
                    to="/contact"
                    onClick={closeMobileMenu}
                    className="flex-1 flex items-center justify-center py-5 text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Mail className="w-[18px] h-[18px]" strokeWidth={1.5} />
                    <span className="text-[11px] font-light tracking-wider uppercase ml-2.5">Email</span>
                  </Link>
                </div>
              </div>
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

export default LuxuryNavigationWhite;