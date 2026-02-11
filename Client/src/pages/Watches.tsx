
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ChevronDown } from "lucide-react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import API_BASE_URL from "../config/api";

interface Watch {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  collection: {
    id: string;
    name: string;
    slug: string;
  } | null;
  image: {
    url: string;
    alt: string;
  } | null;
  in_stock: boolean;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
}

const ITEMS_PER_ROW = 4;
const INITIAL_ROWS = 4;

const Watches = (): JSX.Element => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Filter states
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Dropdown states
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

  // Price ranges
  const priceRanges = [
    { label: 'Under £200', min: 0, max: 200 },
    { label: '£200 - £500', min: 200, max: 500 },
    { label: '£500 - £1,000', min: 500, max: 1000 },
    { label: '£1,000 - £2,000', min: 1000, max: 2000 },
    { label: 'Above £2,000', min: 2000, max: 999999 }
  ];

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/watches/brands`);
      const data = await response.json();
      if (data.success) {
        setBrands(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Fetch all collections
  const fetchCollections = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/watches/collections/all`);
      const data = await response.json();
      if (data.success) {
        setCollections(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  // Fetch watches
  const fetchWatches = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedBrand) params.append('brand', selectedBrand);
      if (selectedCollection) params.append('collection', selectedCollection);
      if (sortBy) params.append('sort', sortBy === 'price-low' ? 'price' : sortBy === 'price-high' ? 'price' : sortBy);
      if (sortBy === 'price-high') params.append('order', 'desc');
      if (sortBy === 'price-low') params.append('order', 'asc');
      params.append('limit', '100'); // Fetch more to filter client-side

      const response = await fetch(`${API_BASE_URL}/watches?${params}`);
      const data = await response.json();
      if (data.success) {
        let watchesData = data.data?.watches || [];

        // Client-side price filtering
        if (selectedPrice) {
          const range = priceRanges.find(r => r.label === selectedPrice);
          if (range) {
            watchesData = watchesData.filter((w: Watch) => {
              const price = w.sale_price || w.base_price;
              return price >= range.min && price <= range.max;
            });
          }
        }

        setWatches(watchesData);
      }
    } catch (error) {
      console.error('Error fetching watches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchCollections();
  }, []);

  useEffect(() => {
    fetchWatches();
    setShowAll(false); // Reset show all when filters change
  }, [selectedBrand, selectedCollection, selectedPrice, sortBy]);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeFilter && !(e.target as Element).closest('.filter-dropdown')) {
        setActiveFilter(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeFilter]);

  // Get filtered collections based on selected brand
  const filteredCollections = selectedBrand
    ? collections.filter(c => c.brand?.slug === selectedBrand)
    : collections;

  // Determine how many items to show
  const displayedWatches = showAll
    ? watches
    : watches.slice(0, ITEMS_PER_ROW * INITIAL_ROWS);

  const hasMoreWatches = watches.length > ITEMS_PER_ROW * INITIAL_ROWS;

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />

      {/* Main Watch Products Content */}
      <main className="flex-1 pt-32 lg:pt-44 pb-8">
        <div className="w-full px-4 lg:px-[40px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 lg:mb-8">
            <div className="flex items-center text-sm text-gray-500 font-light">
              <Link to="/" className="hover:text-gray-700">Home</Link>
              <span className="mx-2">→</span>
              <span className="text-gray-900">Watches</span>
            </div>
          </nav>

          {/* Page Title and Description */}
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl lg:text-5xl font-normal text-gray-900 mb-4 lg:mb-6 font-cormorant">
              Luxury Timepieces
            </h1>
            <div className="max-w-2xl">
              <p className="text-base lg:text-base text-gray-700 leading-relaxed mb-4 lg:mb-4 font-cormorant">
                Discover our exquisite collection of luxury watches from renowned brands including Festina,
                Roamer, and Briston. Each timepiece represents the pinnacle of Swiss and European
                craftsmanship, combining traditional techniques with contemporary design.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-gray-100 relative">
            {/* Mobile Filter Bar - Modern Luxury Design */}
            <div className="lg:hidden space-y-4">
              {/* Filter Buttons Row */}
              <div className="flex gap-2">
                {/* Brand Filter Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFilter('mobile-brand'); }}
                  className={`flex-1 flex items-center justify-between px-4 py-3 text-xs tracking-widest uppercase transition-all duration-300 ${
                    selectedBrand
                      ? 'bg-gray-900 text-white'
                      : 'bg-[#f5f5f5] text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{selectedBrand ? brands.find(b => b.slug === selectedBrand)?.name : 'Brand'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${activeFilter === 'mobile-brand' ? 'rotate-180' : ''}`} />
                </button>

                {/* Collection Filter Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFilter('mobile-collection'); }}
                  className={`flex-1 flex items-center justify-between px-4 py-3 text-xs tracking-widest uppercase transition-all duration-300 ${
                    selectedCollection
                      ? 'bg-gray-900 text-white'
                      : 'bg-[#f5f5f5] text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">{selectedCollection ? collections.find(c => c.id === selectedCollection)?.name : 'Collection'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 ml-1 transition-transform duration-300 ${activeFilter === 'mobile-collection' ? 'rotate-180' : ''}`} />
                </button>

                {/* Price Filter Button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFilter('mobile-price'); }}
                  className={`flex-1 flex items-center justify-between px-4 py-3 text-xs tracking-widest uppercase transition-all duration-300 ${
                    selectedPrice
                      ? 'bg-gray-900 text-white'
                      : 'bg-[#f5f5f5] text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">{selectedPrice || 'Price'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 ml-1 transition-transform duration-300 ${activeFilter === 'mobile-price' ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Mobile Brand Dropdown Panel */}
              {activeFilter === 'mobile-brand' && (
                <div className="absolute left-0 right-0 top-full mt-2 mx-4 bg-white border border-gray-100 shadow-lg z-50 animate-fade-in">
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedBrand(''); setSelectedCollection(''); setActiveFilter(null); }}
                      className={`w-full text-left px-5 py-3 text-sm tracking-wide transition-colors border-b border-gray-50 ${
                        !selectedBrand ? 'bg-gray-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All Brands
                    </button>
                    {brands.map(brand => (
                      <button
                        key={brand.id}
                        onClick={() => { setSelectedBrand(brand.slug); setSelectedCollection(''); setActiveFilter(null); }}
                        className={`w-full text-left px-5 py-3 text-sm tracking-wide transition-colors border-b border-gray-50 last:border-0 ${
                          selectedBrand === brand.slug ? 'bg-gray-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Collection Dropdown Panel */}
              {activeFilter === 'mobile-collection' && (
                <div className="absolute left-0 right-0 top-full mt-2 mx-4 bg-white border border-gray-100 shadow-lg z-50 animate-fade-in">
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedCollection(''); setActiveFilter(null); }}
                      className={`w-full text-left px-5 py-3 text-sm tracking-wide transition-colors border-b border-gray-50 ${
                        !selectedCollection ? 'bg-gray-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All Collections
                    </button>
                    {filteredCollections.map(collection => (
                      <button
                        key={collection.id}
                        onClick={() => { setSelectedCollection(collection.id); setActiveFilter(null); }}
                        className={`w-full text-left px-5 py-3 text-sm tracking-wide transition-colors border-b border-gray-50 last:border-0 ${
                          selectedCollection === collection.id ? 'bg-gray-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {collection.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Price Dropdown Panel */}
              {activeFilter === 'mobile-price' && (
                <div className="absolute left-0 right-0 top-full mt-2 mx-4 bg-white border border-gray-100 shadow-lg z-50 animate-fade-in">
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedPrice(''); setActiveFilter(null); }}
                      className={`w-full text-left px-5 py-3 text-sm tracking-wide transition-colors border-b border-gray-50 ${
                        !selectedPrice ? 'bg-gray-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All Prices
                    </button>
                    {priceRanges.map(range => (
                      <button
                        key={range.label}
                        onClick={() => { setSelectedPrice(range.label); setActiveFilter(null); }}
                        className={`w-full text-left px-5 py-3 text-sm tracking-wide transition-colors border-b border-gray-50 last:border-0 ${
                          selectedPrice === range.label ? 'bg-gray-50 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters - Mobile */}
              {(selectedBrand || selectedCollection || selectedPrice) && (
                <div className="flex justify-center">
                  <button
                    onClick={() => { setSelectedBrand(''); setSelectedCollection(''); setSelectedPrice(''); }}
                    className="text-xs text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    Clear filters ×
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Filter Bar */}
            <div className="hidden lg:flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm font-inter relative">

                {/* Brand Filter */}
                <div className="relative filter-dropdown">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFilter('brand'); }}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'brand' || selectedBrand ? 'text-gray-900 font-medium' : ''
                    }`}
                  >
                    Brand {selectedBrand && `(${brands.find(b => b.slug === selectedBrand)?.name})`}
                    <ChevronDown className={`w-3 h-3 transition-transform ${activeFilter === 'brand' ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFilter === 'brand' && (
                    <div className="absolute top-full left-0 mt-3 w-56 bg-white border border-gray-200 shadow-xl z-50">
                      <div className="p-4">
                        <button
                          onClick={() => { setSelectedBrand(''); setSelectedCollection(''); setActiveFilter(null); }}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            !selectedBrand ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          All Brands
                        </button>
                        {brands.map(brand => (
                          <button
                            key={brand.id}
                            onClick={() => { setSelectedBrand(brand.slug); setSelectedCollection(''); setActiveFilter(null); }}
                            className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                              selectedBrand === brand.slug ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {brand.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Collection Filter */}
                <div className="relative filter-dropdown">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFilter('collection'); }}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'collection' || selectedCollection ? 'text-gray-900 font-medium' : ''
                    }`}
                  >
                    Collection {selectedCollection && `(${collections.find(c => c.id === selectedCollection)?.name})`}
                    <ChevronDown className={`w-3 h-3 transition-transform ${activeFilter === 'collection' ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFilter === 'collection' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl z-50 max-h-80 overflow-y-auto">
                      <div className="p-4">
                        <button
                          onClick={() => { setSelectedCollection(''); setActiveFilter(null); }}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            !selectedCollection ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          All Collections
                        </button>
                        {filteredCollections.map(collection => (
                          <button
                            key={collection.id}
                            onClick={() => { setSelectedCollection(collection.id); setActiveFilter(null); }}
                            className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                              selectedCollection === collection.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {collection.brand?.name && !selectedBrand ? `${collection.brand.name} - ` : ''}{collection.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Filter */}
                <div className="relative filter-dropdown">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFilter('price'); }}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'price' || selectedPrice ? 'text-gray-900 font-medium' : ''
                    }`}
                  >
                    Price {selectedPrice && `(${selectedPrice})`}
                    <ChevronDown className={`w-3 h-3 transition-transform ${activeFilter === 'price' ? 'rotate-180' : ''}`} />
                  </button>
                  {activeFilter === 'price' && (
                    <div className="absolute top-full left-0 mt-3 w-56 bg-white border border-gray-200 shadow-xl z-50">
                      <div className="p-4">
                        <button
                          onClick={() => { setSelectedPrice(''); setActiveFilter(null); }}
                          className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                            !selectedPrice ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          All Prices
                        </button>
                        {priceRanges.map(range => (
                          <button
                            key={range.label}
                            onClick={() => { setSelectedPrice(range.label); setActiveFilter(null); }}
                            className={`block w-full text-left px-3 py-2 text-sm transition-colors ${
                              selectedPrice === range.label ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear Filters */}
                {(selectedBrand || selectedCollection || selectedPrice) && (
                  <button
                    onClick={() => { setSelectedBrand(''); setSelectedCollection(''); setSelectedPrice(''); }}
                    className="text-gray-500 hover:text-gray-900 uppercase tracking-wider font-light text-xs underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 text-sm font-inter">
                <span className="text-gray-600 uppercase tracking-wider font-light">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-gray-900 bg-transparent border-none font-inter font-normal uppercase tracking-wider focus:outline-none cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                  <option value="created_at">Newest</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-500 font-light">
            {loading ? 'Loading...' : `${watches.length} watches found`}
          </div>

          {/* Watch Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[0.8] mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : watches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg font-cormorant">No watches found matching your criteria.</p>
              <button
                onClick={() => { setSelectedBrand(''); setSelectedCollection(''); setSelectedPrice(''); }}
                className="mt-4 text-gray-900 underline font-cormorant"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
                {displayedWatches.map((watch) => (
                  <Link
                    key={watch.id}
                    to={`/watches/${watch.slug}`}
                    className="group cursor-pointer bg-white transition-all duration-300"
                  >
                    <div className="relative bg-[#f8f8f8] overflow-hidden" style={{ aspectRatio: '0.85' }}>
                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleLike(watch.id); }}
                        className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors duration-200 ${
                            likedProducts.has(watch.id) ? 'text-gray-900 fill-gray-900' : 'text-gray-400 hover:text-gray-600'
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>

                      {/* Product Image */}
                      {watch.image?.url ? (
                        <img
                          src={watch.image.url}
                          alt={watch.image.alt || watch.name}
                          className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth={1}/>
                            <polyline points="12,6 12,12 16,14" strokeWidth={1}/>
                          </svg>
                        </div>
                      )}

                      {/* Sale Badge */}
                      {watch.sale_price && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 font-inter">
                          SALE
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      {watch.brand?.name && (
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-inter">{watch.brand.name}</p>
                      )}
                      <h3 className="text-sm lg:text-base font-cormorant font-normal text-gray-800 mb-2 leading-tight line-clamp-2">
                        {watch.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-base lg:text-lg font-cormorant font-medium text-gray-900">
                          £{(watch.sale_price || watch.base_price).toLocaleString()}
                        </p>
                        {watch.sale_price && (
                          <p className="text-sm font-cormorant text-gray-400 line-through">
                            £{watch.base_price.toLocaleString()}
                          </p>
                        )}
                      </div>
                      {watch.collection?.name && (
                        <p className="text-xs text-gray-500 font-cormorant mt-1">{watch.collection.name}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Show All Button */}
              {hasMoreWatches && !showAll && (
                <div className="text-center mb-16">
                  <button
                    onClick={() => setShowAll(true)}
                    className="inline-flex items-center gap-2 px-8 py-3 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors duration-300 font-inter text-sm uppercase tracking-wider"
                  >
                    Show All ({watches.length} watches)
                  </button>
                </div>
              )}

              {/* Showing count */}
              {!showAll && hasMoreWatches && (
                <p className="text-center text-sm text-gray-500 mb-8">
                  Showing {displayedWatches.length} of {watches.length} watches
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default Watches;
