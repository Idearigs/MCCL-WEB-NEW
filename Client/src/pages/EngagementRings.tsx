import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import FavoriteButton from "../components/FavoriteButton";
import AuthModal from "../components/AuthModal";
import API_BASE_URL, { getMediaUrl } from '../config/api';

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
    metal_id?: string | null;
    is_metal_preview?: boolean;
    diamond_size_id?: string | null;
    is_diamond_size_preview?: boolean;
  }>;
  available_metals?: Array<{
    id: string;
    name: string;
    color_code: string;
  }>;
  is_featured: boolean;
  in_stock: boolean;
}

// Product card with per-card metal selection — memoised to prevent re-renders when parent filters change
const ProductCard = React.memo(({ product, onAuthRequired }: { product: RingProduct; onAuthRequired: () => void }) => {
  const [selectedMetalId, setSelectedMetalId] = useState<string | null>(null);
  const metals = product.available_metals || [];

  const activeMetalId = selectedMetalId
    || (product.images?.find(img => img.is_primary)?.metal_id)
    || (product.images?.[0]?.metal_id)
    || null;

  const metalImages = activeMetalId
    ? (product.images?.filter(img => img.metal_id === activeMetalId) || [])
        .sort((a, b) => {
          if (a.is_metal_preview && !b.is_metal_preview) return -1;
          if (!a.is_metal_preview && b.is_metal_preview) return 1;
          return 0;
        })
    : product.images || [];

  const primaryImage = metalImages[0] || product.images?.[0];
  const hoverImage = metalImages.length > 1 ? metalImages[1] : primaryImage;

  return (
    <div className="bg-white transition-all duration-300 pb-2">
      <Link to={`/${product.category.slug}/${product.slug}`} className="group cursor-pointer block">
        <div className="relative bg-white overflow-hidden" style={{ aspectRatio: '1', height: 'auto' }}>
          <div className="absolute top-2 right-2 lg:top-3 lg:right-3 z-20">
            <FavoriteButton productId={product.id} productName={product.name} imageUrl={primaryImage?.url} productUrl={`/${product.category.slug}/${product.slug}`} size="sm" />
          </div>

          {/* Default Image */}
          <img
            src={primaryImage?.url ? getMediaUrl(primaryImage.url) : "/images/Rings.png"}
            alt={primaryImage?.alt || product.name}
            className="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-0"
            loading="lazy"
            decoding="async"
          />

          {/* Hover Image */}
          <img
            src={hoverImage?.url ? getMediaUrl(hoverImage.url) : (primaryImage?.url ? getMediaUrl(primaryImage.url) : "/images/Rings.png")}
            alt={hoverImage?.alt || `${product.name} - Alternative View`}
            className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            loading="lazy"
            decoding="async"
          />

          {/* Hover Overlay — desktop only */}
          <div className="hidden lg:flex absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col justify-end p-4">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 delay-75"
            >
              ADD TO BAG
            </button>
          </div>
        </div>
      </Link>

      {/* Card info */}
      <div className="pt-3 pb-4 px-1 lg:px-2">
        <Link to={`/${product.category.slug}/${product.slug}`}>
          <h3 className="text-base lg:text-lg font-cormorant font-normal text-gray-800 mb-1 leading-snug">{product.name}</h3>
        </Link>
        <p className="text-base lg:text-lg font-cormorant font-light text-gray-600 mb-2 lg:mb-3">{product.price}</p>

        {/* Metal swatches — desktop only */}
        {metals.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5">
            {metals.map((metal) => {
              const thumbImg = product.images?.find(
                img => img.is_metal_preview === true && img.metal_id === metal.id
              ) || product.images?.find(img => img.is_primary) || product.images?.[0];
              const isActive = activeMetalId === metal.id;
              return (
                <button
                  key={metal.id}
                  onClick={() => setSelectedMetalId(metal.id)}
                  title={metal.name}
                  className={`flex-shrink-0 overflow-hidden transition-all duration-200 w-10 h-10 ${
                    isActive ? 'ring-2 ring-gray-800 ring-offset-1' : 'ring-1 ring-gray-200 opacity-50 hover:opacity-100 hover:ring-gray-400'
                  }`}
                >
                  {thumbImg ? (
                    <img src={getMediaUrl(thumbImg.url)} alt={metal.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundColor: metal.color_code || '#ccc' }} />
                  )}
                </button>
              );
            })}
            <span className="ml-1 text-[9px] font-inter font-light tracking-widest text-gray-400 uppercase">
              {(metals.find(m => m.id === activeMetalId) || metals[0])?.name || ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

const EngagementRings = (): JSX.Element => {
  const [searchParams] = useSearchParams();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('engagement');
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
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileColumns, setMobileColumns] = useState<1 | 2>(2);
  const [mobilePanelSection, setMobilePanelSection] = useState<string | null>(null);
  const [ringProducts, setRingProducts] = useState<RingProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [ringTypes, setRingTypes] = useState<Array<{id: string, name: string, slug: string}>>([]);
  const [gemstones, setGemstones] = useState<Array<{id: string, name: string, slug: string, color?: string}>>([]);
  const [metals, setMetals] = useState<Array<{id: string, name: string, color_code: string}>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Save shopping category for post-purchase redirect
  useEffect(() => {
    localStorage.setItem('lastShoppingCategory', 'engagement-rings');
  }, []);

  // Initialize filters from URL parameters
  useEffect(() => {
    const ringType = searchParams.get('ringType');
    const gemstone = searchParams.get('gemstone');
    const metal = searchParams.get('metal');
    const collection = searchParams.get('collection');

    setSelectedFilters(prev => ({
      ...prev,
      ringType: ringType ? [ringType] : [],
      gemstones: gemstone ? [gemstone] : [],
      metals: metal ? [metal] : [],
      collections: collection ? [collection] : []
    }));
  }, [searchParams]);

  // Fetch filter reference data once on mount
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [collectionsResponse, ringTypesResponse, gemstonesResponse, metalsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/filters/collections`),
          fetch(`${API_BASE_URL}/filters/ring-types`),
          fetch(`${API_BASE_URL}/filters/gemstones`),
          fetch(`${API_BASE_URL}/filters/metals`)
        ]);

        try {
          if (collectionsResponse && collectionsResponse.ok) {
            const data = await collectionsResponse.json();
            setCollections(Array.isArray(data) ? data : []);
          }
        } catch (e) { console.warn('Failed to fetch collections:', e); }

        try {
          if (ringTypesResponse && ringTypesResponse.ok) {
            const data = await ringTypesResponse.json();
            setRingTypes(Array.isArray(data) ? data : []);
          }
        } catch (e) { console.warn('Failed to fetch ring types:', e); }

        try {
          if (gemstonesResponse && gemstonesResponse.ok) {
            const data = await gemstonesResponse.json();
            setGemstones(Array.isArray(data) ? data : []);
          }
        } catch (e) { console.warn('Failed to fetch gemstones:', e); }

        try {
          if (metalsResponse && metalsResponse.ok) {
            const data = await metalsResponse.json();
            setMetals(Array.isArray(data) ? data : []);
          }
        } catch (e) { console.warn('Failed to fetch metals:', e); }
      } catch (err) {
        console.error('Error fetching filter data:', err);
      }
    };
    fetchFilterData();
  }, []);

  // Fetch ring products — re-runs when page or filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // Build server-side filter params
        const params = new URLSearchParams();
        params.set('category', 'engagement-rings');
        params.set('sort', 'sort_order');
        params.set('order', 'asc');
        params.set('page', String(currentPage));
        params.set('limit', '24');

        if (selectedFilters.metals.length > 0) {
          params.set('metal', selectedFilters.metals[0]);
        }
        if (selectedFilters.ringType.length > 0) {
          params.set('ringType', selectedFilters.ringType[0]);
        }
        if (selectedFilters.gemstones.length > 0) {
          params.set('gemstone', selectedFilters.gemstones[0]);
        }
        if (selectedFilters.collections.length > 0) {
          params.set('collection', selectedFilters.collections[0]);
        }
        // Price range → server-side min/max
        if (selectedFilters.price.length > 0) {
          const priceRangeMap: Record<string, { min?: number; max?: number }> = {
            'Under £500': { max: 500 },
            '£500 - £1,000': { min: 500, max: 1000 },
            '£1,000 - £2,500': { min: 1000, max: 2500 },
            '£2,500 - £5,000': { min: 2500, max: 5000 },
            '£5,000 - £10,000': { min: 5000, max: 10000 },
            'Above £10,000': { min: 10000 }
          };
          const mins: number[] = [];
          const maxs: number[] = [];
          selectedFilters.price.forEach(range => {
            const r = priceRangeMap[range];
            if (r?.min !== undefined) mins.push(r.min);
            if (r?.max !== undefined) maxs.push(r.max);
          });
          if (mins.length > 0) params.set('price_min', String(Math.min(...mins)));
          if (maxs.length > 0) params.set('price_max', String(Math.max(...maxs)));
        }

        const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setRingProducts(data.data.products || []);
          setTotalPages(data.data.pagination?.total_pages || 1);
        } else {
          setError(data.message || 'Failed to fetch ring products');
        }
      } catch (err) {
        setError('Failed to fetch ring products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, selectedFilters]);

  const toggleFilter = useCallback((filterName: string) => {
    setActiveFilter(prev => prev === filterName ? null : filterName);
  }, []);

  // Filter handlers — reset to page 1 on any filter change
  const handleFilterChange = useCallback((filterType: keyof typeof selectedFilters, value: string, checked: boolean) => {
    setCurrentPage(1);
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setCurrentPage(1);
    setSelectedFilters({
      price: [],
      ringType: [],
      gemstones: [],
      metals: [],
      collections: []
    });
  }, []);

  // Server handles all filters except the dev search term
  const filteredProducts = ringProducts.filter(product => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = product.name?.toLowerCase().includes(term);
      const skuMatch = (product as any).sku?.toLowerCase().includes(term);
      if (!nameMatch && !skuMatch) return false;
    }
    return true;
  }).sort((a, b) => {
    const aHasImage = !!(a.image?.url);
    const bHasImage = !!(b.image?.url);
    if (aHasImage === bHasImage) return 0;
    return aHasImage ? -1 : 1;
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

      {/* Main Engagement Rings Content */}
      <main className="flex-1 pt-40 lg:pt-52 pb-8">
        <div className="w-full px-4 lg:px-[40px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 lg:mb-8">
            <div className="flex items-center text-sm text-gray-500 font-light">
              <span className="hover:text-gray-700 cursor-pointer">Home</span>
              <span className="mx-2">→</span>
              <span className="hover:text-gray-700 cursor-pointer">Jewellery</span>
              <span className="mx-2">→</span>
              <span className="text-gray-900">Engagement Rings</span>
            </div>
          </nav>

          {/* Page Title and Description */}
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl lg:text-5xl font-normal text-gray-900 mb-4 lg:mb-6 font-cormorant">
              Engagement Rings
            </h1>
            <div className="max-w-2xl">
              <p className="text-base lg:text-base text-gray-700 leading-relaxed mb-4 lg:mb-4 font-cormorant">
                Discover our exquisite collection of engagement rings, where timeless elegance meets exceptional craftsmanship.
                Each ring is meticulously designed to symbolize your eternal love and commitment, featuring the finest diamonds
                and gemstones set in precious metals with unparalleled artistry.
              </p>
              <button className="text-gray-600 hover:text-gray-900 text-sm italic underline font-cormorant">
                Read More
              </button>
            </div>
          </div>

          {/* Dev Search Bar */}
          <div className="mb-4 flex items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or SKU (e.g. BJ-103)..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm font-inter focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-gray-500 hover:text-gray-800 underline font-inter"
              >
                Clear
              </button>
            )}
            <span className="text-xs text-gray-400 font-inter">
              {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}{totalPages > 1 ? ` (page ${currentPage}/${totalPages})` : ''}
            </span>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-gray-200 relative">

            {/* ── Mobile filter bar ── */}
            {(() => {
              const totalActive = selectedFilters.price.length + selectedFilters.ringType.length + selectedFilters.gemstones.length + selectedFilters.metals.length + selectedFilters.collections.length;
              return (
                <div className="flex lg:hidden items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setMobileFilterOpen(true)}
                      className="text-[11px] font-inter font-light uppercase tracking-[0.2em] text-gray-700"
                    >
                      Filter &amp; Sort{totalActive > 0 ? ` (${totalActive})` : ''}
                    </button>
                    {totalActive > 0 && (
                      <>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={clearFilters}
                          className="flex items-center gap-1 text-[11px] font-inter font-light uppercase tracking-[0.2em] text-gray-500 hover:text-gray-900"
                        >
                          Clear
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                  {/* Layout toggle icons */}
                  <div className="flex items-center gap-3">
                    {/* 2-col icon */}
                    <button onClick={() => setMobileColumns(2)} className={mobileColumns === 2 ? 'text-gray-900' : 'text-gray-300'} aria-label="2-column grid">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/>
                        <rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>
                      </svg>
                    </button>
                    {/* 1-col icon */}
                    <button onClick={() => setMobileColumns(1)} className={mobileColumns === 1 ? 'text-gray-900' : 'text-gray-300'} aria-label="Single column">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="8"/><rect x="3" y="13" width="18" height="8"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── Desktop Filter Bar ── */}
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
                            onClick={() => {
                              setSelectedFilters(prev => ({ ...prev, price: [] }));
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

                {/* Ring Styles Filter */}
                <div className="relative">
                  <button
                    onClick={() => toggleFilter('ringType')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'ringType' ? 'text-gray-900' : ''
                    }`}
                  >
                    Ring Styles
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'ringType' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'ringType' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Ring Styles</h3>
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

          {/* Engagement Ring Product Grid */}
          <div className={`grid gap-3 lg:gap-6 mb-16 ${mobileColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'} md:grid-cols-2 lg:grid-cols-4`}>
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
                  No engagement rings match your filters
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
                  Engagement Ring Products Coming Soon
                </h3>
                <p className="text-gray-600 mb-6">
                  We're currently setting up our engagement ring collection database. Please check back soon to see our beautiful selection of rings.
                </p>
                <div className="text-sm text-gray-500">
                  In the meantime, you can browse our other collections or contact us for assistance.
                </div>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-10">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-5 py-2 border border-gray-300 text-sm font-inter text-gray-700 hover:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-inter text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-5 py-2 border border-gray-300 text-sm font-inter text-gray-700 hover:border-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center bg-gray-50 rounded-lg p-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4 font-cormorant">
              Find Your Perfect Engagement Ring
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-cormorant">
              Our expert jewellers are here to help you discover the engagement ring of your dreams, creating a symbol of your eternal love and commitment.
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

      {/* Auth Modal for Wishlist */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView="login"
      />

      {/* ── Mobile Filter Side Panel ── */}
      <div className={`lg:hidden fixed inset-0 z-[200] flex transition-opacity duration-300 ${mobileFilterOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => { setMobileFilterOpen(false); setMobilePanelSection(null); }}
          />

          {/* Panel — slides from right */}
          <div className={`w-4/5 max-w-sm bg-white h-full flex flex-col shadow-2xl overflow-hidden transform transition-transform duration-300 ease-in-out ${mobileFilterOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-8 pb-6">
              <h2 className="text-2xl font-cormorant font-light text-gray-900">Filter &amp; Sort</h2>
              <button onClick={() => { setMobileFilterOpen(false); setMobilePanelSection(null); }} className="p-1">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Filter sections */}
            <div className="flex-1 overflow-y-auto">
              {([
                { key: 'price',       label: 'Price',       options: filterOptions.price },
                { key: 'ringType',    label: 'Ring Styles', options: filterOptions.ringType },
                { key: 'gemstones',   label: 'Gemstones',   options: filterOptions.gemstones },
                { key: 'metals',      label: 'Metals',      options: filterOptions.metals },
                { key: 'collections', label: 'Collection',  options: filterOptions.collections },
              ] as const).map(({ key, label, options }) => {
                const count = selectedFilters[key].length;
                const isOpen = mobilePanelSection === key;
                return (
                  <div key={key}>
                    <button
                      className="w-full flex items-center justify-between px-6 py-4"
                      onClick={() => setMobilePanelSection(isOpen ? null : key)}
                    >
                      <span className="text-xs font-inter font-light uppercase tracking-[0.2em] text-gray-800">
                        {label}{count > 0 && <span className="ml-1.5 text-gray-400">({count})</span>}
                      </span>
                      <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 space-y-4">
                        {options.length === 0 ? (
                          <p className="text-sm text-gray-400 font-inter">No options available</p>
                        ) : options.map((option) => (
                          <label key={option} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 transition-colors ${
                              selectedFilters[key].includes(option) ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                            }`}>
                              {selectedFilters[key].includes(option) && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                                </svg>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={selectedFilters[key].includes(option)}
                              onChange={(e) => handleFilterChange(key, option, e.target.checked)}
                            />
                            <span className="text-sm font-cormorant text-gray-700 group-hover:text-gray-900 leading-snug">
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sort By */}
              <div>
                <button
                  className="w-full flex items-center justify-between px-6 py-4"
                  onClick={() => setMobilePanelSection(mobilePanelSection === 'sort' ? null : 'sort')}
                >
                  <span className="text-xs font-inter font-light uppercase tracking-[0.2em] text-gray-800">Sort By</span>
                  <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${mobilePanelSection === 'sort' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                {mobilePanelSection === 'sort' && (
                  <div className="px-6 pb-5 space-y-4">
                    {['Featured', 'Price: Low to High', 'Price: High to Low', 'Newest'].map(opt => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-cormorant text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-gray-200 px-6 py-5 flex gap-3">
              <button
                onClick={() => { clearFilters(); setMobileFilterOpen(false); setMobilePanelSection(null); }}
                className="flex-1 border border-gray-300 text-gray-700 text-xs font-inter font-light uppercase tracking-wider py-3 hover:border-gray-500 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => { setMobileFilterOpen(false); setMobilePanelSection(null); }}
                className="flex-1 bg-gray-900 text-white text-xs font-inter font-light uppercase tracking-wider py-3 hover:bg-gray-800 transition-colors"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default EngagementRings;
