import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import API_BASE_URL from '../config/api';

interface RingProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  base_price: number;
  sale_price?: number;
  currency: string;
  description?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  collection?: {
    id: string;
    name: string;
    slug: string;
  };
  ringTypes?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  primary_metal?: {
    id: string;
    name: string;
    slug: string;
  };
  gemstones?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  image?: {
    url: string;
    alt: string;
  };
  images: Array<{
    id: string;
    url: string;
    alt: string;
    is_primary: boolean;
  }>;
  is_featured: boolean;
  in_stock: boolean;
}

const Rings = (): JSX.Element => {
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('rings');
  const [selectedFilters, setSelectedFilters] = useState<{
    price: string[];
    ringType: string[];
    gemstones: string[];
    metals: string[];
    collections: string[];
  }>({
    price: [],
    ringType: [],
    gemstones: [],
    metals: [],
    collections: []
  });
  const [ringProducts, setRingProducts] = useState<RingProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [ringTypes, setRingTypes] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [gemstones, setGemstones] = useState<Array<{id: string, name: string, slug: string, color?: string}>>([]);
  const [metals, setMetals] = useState<Array<{id: string, name: string, color_code: string}>>([]);

  // Fetch ring products and collections from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch ring products and all filter data in parallel
        const [
          productsResponse,
          collectionsResponse,
          ringTypesResponse,
          gemstonesResponse,
          metalsResponse
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/products/category/rings`),
          fetch(`${API_BASE_URL}/filters/collections`),
          fetch(`${API_BASE_URL}/filters/ring-types`),
          fetch(`${API_BASE_URL}/filters/gemstones`),
          fetch(`${API_BASE_URL}/filters/metals`)
        ]);

        // Handle products data
        const productsData = await productsResponse.json();
        if (productsData.success) {
          setRingProducts(productsData.data.products || []);
        } else {
          setError(productsData.message || 'Failed to fetch ring products');
        }

        // Handle collections data
        try {
          if (collectionsResponse && collectionsResponse.ok) {
            const collectionsData = await collectionsResponse.json();
            setCollections(Array.isArray(collectionsData) ? collectionsData : []);
          }
        } catch (collectionsErr) {
          console.warn('Failed to fetch collections:', collectionsErr);
          setCollections([]);
        }

        // Handle ring types data
        try {
          if (ringTypesResponse && ringTypesResponse.ok) {
            const ringTypesData = await ringTypesResponse.json();
            setRingTypes(Array.isArray(ringTypesData) ? ringTypesData : []);
          }
        } catch (ringTypesErr) {
          console.warn('Failed to fetch ring types:', ringTypesErr);
        }

        // Handle gemstones data
        try {
          if (gemstonesResponse && gemstonesResponse.ok) {
            const gemstonesData = await gemstonesResponse.json();
            setGemstones(Array.isArray(gemstonesData) ? gemstonesData : []);
          }
        } catch (gemstonesErr) {
          console.warn('Failed to fetch gemstones:', gemstonesErr);
        }

        // Handle metals data
        try {
          if (metalsResponse && metalsResponse.ok) {
            const metalsData = await metalsResponse.json();
            setMetals(Array.isArray(metalsData) ? metalsData : []);
          }
        } catch (metalsErr) {
          console.warn('Failed to fetch metals:', metalsErr);
        }

      } catch (err) {
        setError('Failed to fetch ring products');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleLike = (productId: string) => {
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleFilter = (filterName: string) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  // Filter handlers
  const handleFilterChange = (filterType: keyof typeof selectedFilters, value: string, checked: boolean) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      price: [],
      ringType: [],
      gemstones: [],
      metals: [],
      collections: []
    });
  };

  const parsePrice = (priceStr: string): number => {
    const match = priceStr.replace(/[£,]/g, '').match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  const isInPriceRange = (productPrice: number | string, priceRange: string): boolean => {
    const price = typeof productPrice === 'number' ? productPrice : parsePrice(productPrice);

    switch (priceRange) {
      case 'Under £500':
        return price < 500;
      case '£500 - £1,000':
        return price >= 500 && price <= 1000;
      case '£1,000 - £2,500':
        return price >= 1000 && price <= 2500;
      case '£2,500 - £5,000':
        return price >= 2500 && price <= 5000;
      case '£5,000 - £10,000':
        return price >= 5000 && price <= 10000;
      case 'Above £10,000':
        return price > 10000;
      default:
        return true;
    }
  };

  // Filter products based on selected filters
  const filteredProducts = ringProducts.filter(product => {
    // Price filter
    if (selectedFilters.price.length > 0) {
      const matchesPrice = selectedFilters.price.some(priceRange =>
        isInPriceRange(product.base_price, priceRange)
      );
      if (!matchesPrice) return false;
    }

    // Ring type filter
    if (selectedFilters.ringType.length > 0) {
      const matchesRingType = selectedFilters.ringType.some(ringTypeName => {
        if (!product.ringTypes || product.ringTypes.length === 0) return false;
        return product.ringTypes.some(ringType => ringType.name === ringTypeName);
      });
      if (!matchesRingType) return false;
    }

    // Gemstones filter
    if (selectedFilters.gemstones.length > 0) {
      const matchesGemstone = selectedFilters.gemstones.some(gemstoneName => {
        if (!product.gemstones || product.gemstones.length === 0) return false;
        return product.gemstones.some(gemstone => gemstone.name === gemstoneName);
      });
      if (!matchesGemstone) return false;
    }

    // Metals filter
    if (selectedFilters.metals.length > 0) {
      const matchesMetal = selectedFilters.metals.some(metalName => {
        if (!product.primary_metal) return false;
        return product.primary_metal.name === metalName;
      });
      if (!matchesMetal) return false;
    }


    // Collections filter
    if (selectedFilters.collections.length > 0) {
      const matchesCollection = selectedFilters.collections.some(collectionName => {
        if (!product.collection) return false;
        return product.collection.name === collectionName;
      });
      if (!matchesCollection) return false;
    }

    return true;
  });

  // Ring-specific filter options - using database data only
  const filterOptions = {
    price: [
      'Under £500',
      '£500 - £1,000',
      '£1,000 - £2,500',
      '£2,500 - £5,000',
      '£5,000 - £10,000',
      'Above £10,000'
    ],
    ringType: ringTypes.map(type => type.name),
    gemstones: gemstones.map(gemstone => gemstone.name),
    metals: metals.map(metal => metal.name),
    collections: collections.map(collection => collection.name)
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />
      
      {/* Main Rings Content */}
      <main className="flex-1 pt-40 lg:pt-52 pb-8">
        <div className="w-full px-4 lg:px-[40px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 lg:mb-8">
            <div className="flex items-center text-sm text-gray-500 font-light">
              <span className="hover:text-gray-700 cursor-pointer">Home</span>
              <span className="mx-2">→</span>
              <span className="hover:text-gray-700 cursor-pointer">Jewellery</span>
              <span className="mx-2">→</span>
              <span className="text-gray-900">Rings</span>
            </div>
          </nav>

          {/* Page Title and Description */}
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl lg:text-5xl font-normal text-gray-900 mb-4 lg:mb-6 font-cormorant">
              Rings
            </h1>
            <div className="max-w-2xl">
              <p className="text-base lg:text-base text-gray-700 leading-relaxed mb-4 lg:mb-4 font-cormorant">
                Discover our exquisite collection of rings, from timeless engagement rings to stunning 
                statement pieces. Each ring is meticulously crafted with the finest gemstones and precious 
                metals, representing love, commitment, and personal style with unparalleled elegance.
              </p>
              <button className="text-gray-600 hover:text-gray-900 text-sm italic underline font-cormorant">
                Read More
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-gray-200 relative">
            {/* Mobile Filter Bar - Horizontal Scroll */}
            <div className="lg:hidden">
              <div className="flex overflow-x-auto gap-6 pb-2 scrollbar-hide">
                <button 
                  onClick={() => setSelectedCategory('rings')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'rings' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Rings
                </button>
                <button 
                  onClick={() => setSelectedCategory('engagement')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'engagement' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Engagement Rings
                </button>
                <button 
                  onClick={() => setSelectedCategory('cocktail')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'cocktail' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Cocktail Rings
                </button>
                <button 
                  onClick={() => setSelectedCategory('high-jewellery')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'high-jewellery' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  High Jewellery
                </button>
                <button 
                  onClick={() => setSelectedCategory('wedding')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'wedding' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Wedding Rings
                </button>
              </div>
            </div>

            {/* Desktop Filter Bar - Original Layout */}
            <div className="hidden lg:flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm font-inter relative">
                {/* Price Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('price')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'price' ? 'text-gray-900' : ''
                    }`}
                  >
                    Price
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'price' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'price' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Price Range</h3>
                        <div className="space-y-3">
                          {filterOptions.price.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedFilters.price.includes(option)}
                                onChange={(e) => handleFilterChange('price', option, e.target.checked)}
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors"
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ring Type Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('ringType')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'ringType' ? 'text-gray-900' : ''
                    }`}
                  >
                    Ring Type
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'ringType' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'ringType' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Ring Type</h3>
                        <div className="space-y-3">
                          {filterOptions.ringType.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedFilters.ringType.includes(option)}
                                onChange={(e) => handleFilterChange('ringType', option, e.target.checked)}
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors"
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setSelectedFilters(prev => ({ ...prev, ringType: [] }));
                              setActiveFilter(null);
                            }}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gemstones Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('gemstones')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'gemstones' ? 'text-gray-900' : ''
                    }`}
                  >
                    Gemstones
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'gemstones' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'gemstones' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Gemstones</h3>
                        <div className="space-y-3">
                          {filterOptions.gemstones.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedFilters.gemstones.includes(option)}
                                onChange={(e) => handleFilterChange('gemstones', option, e.target.checked)}
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors"
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setSelectedFilters(prev => ({ ...prev, gemstones: [] }));
                              setActiveFilter(null);
                            }}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Metals Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('metals')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'metals' ? 'text-gray-900' : ''
                    }`}
                  >
                    Metals
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'metals' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'metals' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Metals</h3>
                        <div className="space-y-3">
                          {filterOptions.metals.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedFilters.metals.includes(option)}
                                onChange={(e) => handleFilterChange('metals', option, e.target.checked)}
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors"
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setSelectedFilters(prev => ({ ...prev, metals: [] }));
                              setActiveFilter(null);
                            }}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Collection Filter */}
                <div className="relative">
                  <button
                    onClick={() => toggleFilter('collections')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'collections' ? 'text-gray-900' : ''
                    }`}
                  >
                    Collection
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'collections' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'collections' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Collections</h3>
                        <div className="space-y-3">
                          {filterOptions.collections.length > 0 ? filterOptions.collections.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedFilters.collections.includes(option)}
                                onChange={(e) => handleFilterChange('collections', option, e.target.checked)}
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors"
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          )) : (
                            <p className="text-sm text-gray-500 font-inter">No collections available</p>
                          )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button
                            onClick={() => {
                              setSelectedFilters(prev => ({ ...prev, collections: [] }));
                              setActiveFilter(null);
                            }}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={clearFilters}
                  className="text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light"
                >
                  Clear All Filters
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm font-inter">
                <span className="text-gray-600 uppercase tracking-wider font-light">Sort By:</span>
                <select className="text-gray-900 bg-transparent border-none font-inter font-normal uppercase tracking-wider focus:outline-none">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Ring Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-white">
                  <div className="bg-gray-200 animate-pulse mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 animate-pulse rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                {error}
              </div>
            ) : filteredProducts.length === 0 && ringProducts.length > 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <h3 className="text-xl font-cormorant font-normal text-gray-700 mb-4">
                  No products match your filters
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filter selections to see more rings.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-gray-900 text-white px-6 py-2 hover:bg-gray-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            ) : ringProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <h3 className="text-xl font-cormorant font-normal text-gray-700 mb-4">
                  Ring Products Coming Soon
                </h3>
                <p className="text-gray-600 mb-6">
                  We're currently setting up our ring collection database. Please check back soon to see our beautiful selection of rings.
                </p>
                <div className="text-sm text-gray-500">
                  In the meantime, you can browse our other collections or contact us for assistance.
                </div>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
                const hoverImage = product.images?.[1] || primaryImage;

                return (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    className="group cursor-pointer bg-white transition-all duration-300 block"
                  >
                    <div className="relative bg-gray-50 overflow-hidden mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleLike(product.id);
                        }}
                        className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                      >
                        <svg className={`w-4 h-4 transition-colors duration-200 ${
                          likedProducts.has(product.id) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                        }`} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                      </button>

                      {/* Default Image */}
                      <img
                        src={primaryImage?.url || "/images/Rings.png"}
                        alt={primaryImage?.alt || product.name}
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                      />

                      {/* Hover Image */}
                      <img
                        src={hoverImage?.url || primaryImage?.url || "/images/Rings.png"}
                        alt={hoverImage?.alt || `${product.name} - Alternative View`}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                      />

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        {/* Arrow Icon */}
                        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>

                        {/* Add to Bag Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Add to bag logic here
                          }}
                          className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
                        >
                          ADD TO BAG
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">{product.name}</h3>
                      <p className="text-lg font-cormorant font-medium text-gray-600">{product.price}</p>
                      <p className="text-sm text-gray-500 font-cormorant">{product.description || 'Exquisite Ring'}</p>
                    </div>
                  </Link>
                );
              })
            )}

            {/* COMMENTED OUT - Original Dummy Ring Products as requested */}
            {/*
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button
                  onClick={() => toggleLike("dummy-2")}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has("dummy-2") ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                <img
                  src="/images/Wedding.jpg"
                  alt="Vintage Rose Gold Wedding Band"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                <img
                  src="/images/Diamonds.jpg"
                  alt="Vintage Rose Gold Wedding Band - Alternative View"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ADD TO BAG
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Vintage Rose Gold Wedding Band</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£1,250</p>
                <p className="text-sm text-gray-500 font-cormorant">18ct Rose Gold</p>
              </div>
            </div>

            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button
                  onClick={() => toggleLike("dummy-3")}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has("dummy-3") ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                <img
                  src="/images/Diamonds.jpg"
                  alt="Sapphire Halo Cocktail Ring"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                <img
                  src="/images/Jewellery.jpg"
                  alt="Sapphire Halo Cocktail Ring - Alternative View"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ADD TO BAG
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Sapphire Halo Cocktail Ring</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£2,800</p>
                <p className="text-sm text-gray-500 font-cormorant">White Gold & Sapphire</p>
              </div>
            </div>

            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button
                  onClick={() => toggleLike("dummy-4")}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has("dummy-4") ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                <img
                  src="/images/Jewellery.jpg"
                  alt="Diamond Eternity Ring"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                <img
                  src="/images/Engagement.png"
                  alt="Diamond Eternity Ring - Alternative View"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ADD TO BAG
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Diamond Eternity Ring</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£4,200</p>
                <p className="text-sm text-gray-500 font-cormorant">Platinum & Diamonds</p>
              </div>
            </div>
            */}
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gray-50 rounded-lg p-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4 font-cormorant">
              Find Your Perfect Ring
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-cormorant">
              Our expert jewellers are here to help you discover the ring of your dreams, whether it's for an engagement, wedding, or special occasion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-900 text-white px-8 py-3 hover:bg-gray-800 transition-colors font-medium">
                Book Consultation
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 hover:border-gray-400 hover:text-gray-900 transition-colors font-medium">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <FooterSection />
    </div>
  );
};

export default Rings;