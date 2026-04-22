import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import FavoriteButton from "../components/FavoriteButton";
import AuthModal from "../components/AuthModal";
import API_BASE_URL, { getMediaUrl } from '../config/api';

interface RingVariant {
  id: string;
  sku: string;
  variant_name: string;
  mm_width: number | null;
  price: number | null;
  size: string | null;
}

interface RingProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  base_price: number;
  sale_price?: number;
  currency: string;
  description?: string;
  category: { id: string; name: string; slug: string };
  images: Array<{ id: string; url: string; alt: string; is_primary: boolean }>;
  variants: RingVariant[];
  is_featured: boolean;
  in_stock: boolean;
}

// Parse metal from variant SKU: "DC115BC|9ct Yellow|3|Flat Court|Light" → "9ct Yellow"
const getVariantMetal = (sku: string): string => sku.split('|')[1] ?? '';
// Parse profile from variant_name: "Flat Court (Light)" → "Flat Court"
const getVariantProfile = (name: string): string => name.replace(/\s*\(.*\)$/, '').trim();

const WeddingRings = (): JSX.Element => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<{
    price: string[];
    metals: string[];
    widths: string[];
    profiles: string[];
  }>({
    price: [],
    metals: [],
    widths: [],
    profiles: [],
  });
  const [ringProducts, setRingProducts] = useState<RingProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileColumns, setMobileColumns] = useState<1 | 2>(2);

  // Fetch ring products only — filter options are derived from variant data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/products?category=wedding-rings&limit=200`);
        if (!response.ok) {
          setError('Unable to load wedding rings at the moment. Please try again later.');
          setRingProducts([]);
          return;
        }
        const data = await response.json();
        if (data.success) {
          setRingProducts(data.data.products || []);
        } else {
          setError(data.message || 'Failed to fetch ring products');
          setRingProducts([]);
        }
      } catch (err) {
        setError('Failed to fetch ring products');
        setRingProducts([]);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derive unique filter options from variants
  const availableMetals = Array.from(new Set(
    ringProducts.flatMap(p => p.variants.map(v => getVariantMetal(v.sku)).filter(Boolean))
  )).sort();

  const availableWidths = Array.from(new Set(
    ringProducts.flatMap(p => p.variants.map(v => v.sku.split('|')[2]).filter(Boolean))
  )).sort((a, b) => parseFloat(a) - parseFloat(b));

  const availableProfiles = Array.from(new Set(
    ringProducts.flatMap(p => p.variants.map(v => getVariantProfile(v.variant_name)).filter(Boolean))
  )).sort();

  const toggleFilter = (filterName: string) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  const handleFilterChange = (filterType: keyof typeof selectedFilters, value: string, checked: boolean) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({ price: [], metals: [], widths: [], profiles: [] });
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

  const priceOptions = [
    'Under £500',
    '£500 - £1,000',
    '£1,000 - £2,500',
    '£2,500 - £5,000',
    '£5,000 - £10,000',
    'Above £10,000'
  ];

  // Filter products: a product matches if it has at least one variant satisfying all active filters
  const filteredProducts = ringProducts.filter(product => {
    // Price filter (checked against product base_price)
    if (selectedFilters.price.length > 0) {
      if (!selectedFilters.price.some(r => isInPriceRange(product.base_price, r))) return false;
    }

    // Variant-based filters: product must have ≥1 variant matching all selected criteria
    const hasMatchingVariant = product.variants.length === 0
      ? (selectedFilters.metals.length === 0 && selectedFilters.widths.length === 0 && selectedFilters.profiles.length === 0)
      : product.variants.some(v => {
          const vMetal = getVariantMetal(v.sku);
          const vWidth = v.sku.split('|')[2] ?? '';
          const vProfile = getVariantProfile(v.variant_name);
          if (selectedFilters.metals.length > 0 && !selectedFilters.metals.includes(vMetal)) return false;
          if (selectedFilters.widths.length > 0 && !selectedFilters.widths.includes(vWidth)) return false;
          if (selectedFilters.profiles.length > 0 && !selectedFilters.profiles.includes(vProfile)) return false;
          return true;
        });

    return hasMatchingVariant;
  });

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
              <span className="text-gray-900">Wedding Rings</span>
            </div>
          </nav>

          {/* Page Title and Description */}
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl lg:text-5xl font-normal text-gray-900 mb-4 lg:mb-6 font-cormorant">
              Wedding Rings
            </h1>
            <div className="max-w-2xl">
              <p className="text-base lg:text-base text-gray-700 leading-relaxed mb-4 lg:mb-4 font-cormorant">
                Discover our exquisite collection of wedding rings, where timeless elegance meets exceptional craftsmanship.
                Each ring is meticulously designed to symbolize your eternal love and commitment, featuring the finest diamonds
                and gemstones set in precious metals with unparalleled artistry.
              </p>
              <button className="text-gray-600 hover:text-gray-900 text-sm italic underline font-cormorant">
                Read More
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-gray-200 relative">

            {/* Mobile: filter label + layout toggle */}
            <div className="flex lg:hidden items-center justify-between mb-4">
              <span className="text-[11px] font-inter font-light uppercase tracking-[0.2em] text-gray-700">
                Filter &amp; Sort
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileColumns(2)} className={mobileColumns === 2 ? 'text-gray-900' : 'text-gray-300'} aria-label="2-column grid">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/>
                    <rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>
                  </svg>
                </button>
                <button onClick={() => setMobileColumns(1)} className={mobileColumns === 1 ? 'text-gray-900' : 'text-gray-300'} aria-label="Single column">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="8"/><rect x="3" y="13" width="18" height="8"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm font-inter relative">

                {/* Price Filter */}
                {([
                  { key: 'price', label: 'Price', options: priceOptions },
                  { key: 'metals', label: 'Metal', options: availableMetals },
                  { key: 'widths', label: 'Width', options: availableWidths.map(w => w + 'mm'), rawOptions: availableWidths },
                  { key: 'profiles', label: 'Profile', options: availableProfiles },
                ] as Array<{ key: keyof typeof selectedFilters; label: string; options: string[]; rawOptions?: string[] }>).map(({ key, label, options, rawOptions }) => (
                  <div key={key} className="relative">
                    <button
                      onClick={() => toggleFilter(key)}
                      className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                        activeFilter === key ? 'text-gray-900' : ''
                      } ${selectedFilters[key].length > 0 ? 'font-medium' : ''}`}
                    >
                      {label}
                      {selectedFilters[key].length > 0 && (
                        <span className="ml-1 text-xs bg-gray-900 text-white rounded-full w-4 h-4 flex items-center justify-center">
                          {selectedFilters[key].length}
                        </span>
                      )}
                      <svg className={`w-3 h-3 transition-transform ${activeFilter === key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                      </svg>
                    </button>
                    {activeFilter === key && (
                      <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50">
                        <div className="p-6">
                          <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">{label}</h3>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {options.length === 0 ? (
                              <p className="text-sm text-gray-500 font-inter">Loading...</p>
                            ) : options.map((option, idx) => {
                              const rawValue = rawOptions ? rawOptions[idx] : option;
                              return (
                                <label key={option} className="flex items-center group cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedFilters[key].includes(rawValue)}
                                    onChange={(e) => handleFilterChange(key, rawValue, e.target.checked)}
                                    className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors"
                                  />
                                  <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                    {option}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                            <button
                              onClick={() => { setSelectedFilters(prev => ({ ...prev, [key]: [] })); setActiveFilter(null); }}
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
                ))}

                <button
                  onClick={clearFilters}
                  className="text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light"
                >
                  Clear All
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
                <div key={index} className="bg-white pb-2">
                  <div className="bg-gray-200 animate-pulse" style={{ aspectRatio: '1', height: 'auto' }}></div>
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
                  No wedding rings match your filters
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
                  Wedding Ring Products Coming Soon
                </h3>
                <p className="text-gray-600 mb-6">
                  We're currently setting up our wedding ring collection database. Please check back soon to see our beautiful selection of rings.
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
                  <div key={product.id} className="bg-white transition-all duration-300 pb-2">
                    <Link to={`/${product.category.slug}/${product.slug}`} className="group cursor-pointer block">
                      <div className="relative bg-white overflow-hidden" style={{ aspectRatio: '1', height: 'auto' }}>
                        <div className="absolute top-2 right-2 lg:top-3 lg:right-3 z-20">
                          <FavoriteButton
                            productId={product.id}
                            productName={product.name}
                            size="sm"
                          />
                        </div>

                        {/* Default Image */}
                        <img
                          src={primaryImage?.url ? getMediaUrl(primaryImage.url) : "/images/Rings.png"}
                          alt={primaryImage?.alt || product.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-0"
                        />

                        {/* Hover Image */}
                        <img
                          src={hoverImage?.url ? getMediaUrl(hoverImage.url) : (primaryImage?.url ? getMediaUrl(primaryImage.url) : "/images/Rings.png")}
                          alt={hoverImage?.alt || `${product.name} - Alternative View`}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300 opacity-0 group-hover:opacity-100"
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
                      <p className="text-base lg:text-lg font-cormorant font-light text-gray-600">{product.price}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gray-50 rounded-lg p-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4 font-cormorant">
              Find Your Perfect Wedding Ring
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-cormorant">
              Our expert jewellers are here to help you discover the wedding ring of your dreams, creating a symbol of your eternal love and commitment.
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
    </div>
  );
};

export default WeddingRings;
