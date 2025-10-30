import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FooterSection } from "../components/FooterSection";
import StaticNavigation from "../components/StaticNavigation";
import { Heart, Grid3X3, List } from "lucide-react";
import { API_BASE_URL } from "../config/api";

interface Watch {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  gender: string;
  watch_type: string;
  style: string;
  images?: Array<{
    id: string;
    image_url: string;
    alt_text: string;
    is_primary: boolean;
  }>;
  image?: {
    url: string;
    alt: string;
  };
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  collection?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
}

const WatchCollection = (): JSX.Element => {
  const { collectionSlug, brandSlug } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'newest'>('name');
  const [filterPrice, setFilterPrice] = useState<string | null>(null);
  const [filterStyle, setFilterStyle] = useState<string | null>(null);

  // Fetch collection and watches
  useEffect(() => {
    const fetchCollectionAndWatches = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch collection by slug
        const collectionResponse = await fetch(
          `${API_BASE_URL}/watches/collections/${collectionSlug}`
        );

        if (!collectionResponse.ok) {
          throw new Error('Collection not found');
        }

        const collectionData = await collectionResponse.json();
        if (!collectionData.success) {
          throw new Error(collectionData.message || 'Failed to load collection');
        }

        const collectionInfo = collectionData.data.collection;
        const collectionWatches = collectionData.data.watches || [];

        setCollection(collectionInfo);
        setWatches(collectionWatches);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load collection');
        console.error('Error loading collection:', err);
      } finally {
        setLoading(false);
      }
    };

    if (collectionSlug) {
      fetchCollectionAndWatches();
    }
  }, [collectionSlug]);

  const toggleLike = (watchId: string) => {
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(watchId)) {
        newSet.delete(watchId);
      } else {
        newSet.add(watchId);
      }
      return newSet;
    });
  };

  const sortWatches = (watchesToSort: Watch[]) => {
    const sorted = [...watchesToSort];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.base_price - b.base_price);
      case 'price-high':
        return sorted.sort((a, b) => b.base_price - a.base_price);
      case 'newest':
        return sorted; // Already in order from API
      case 'name':
      default:
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
  };

  const filterWatches = (watchesToFilter: Watch[]) => {
    return watchesToFilter.filter(watch => {
      if (filterPrice) {
        const [minStr, maxStr] = filterPrice.split('-');
        const min = parseInt(minStr);
        const max = maxStr ? parseInt(maxStr) : Infinity;
        if (watch.base_price < min || watch.base_price > max) return false;
      }
      if (filterStyle && watch.style !== filterStyle) return false;
      return true;
    });
  };

  const displayWatches = sortWatches(filterWatches(watches));

  if (loading) {
    return (
      <div className="flex flex-col w-full bg-white min-h-screen">
        <StaticNavigation />
        <main className="flex-1 pt-32 lg:pt-44 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600 font-cormorant">Loading collection...</p>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="flex flex-col w-full bg-white min-h-screen">
        <StaticNavigation />
        <main className="flex-1 pt-32 lg:pt-44">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
            <div className="text-center">
              <h1 className="text-4xl font-cormorant mb-4">Collection Not Found</h1>
              <p className="text-gray-600 mb-8">{error || 'The collection you are looking for does not exist.'}</p>
              <button
                onClick={() => navigate('/watches')}
                className="bg-gray-900 text-white px-8 py-3 font-inter font-light uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors"
              >
                Back to Watches
              </button>
            </div>
          </div>
        </main>
        <FooterSection />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <StaticNavigation />

      <main className="flex-1 pt-32 lg:pt-44 pb-8">
        <div className="w-full px-4 lg:px-[40px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 lg:mb-8">
            <div className="flex items-center text-sm text-gray-500 font-light">
              <span
                onClick={() => navigate('/')}
                className="hover:text-gray-700 cursor-pointer"
              >
                Home
              </span>
              <span className="mx-2">→</span>
              <span
                onClick={() => navigate('/watches')}
                className="hover:text-gray-700 cursor-pointer"
              >
                Watches
              </span>
              <span className="mx-2">→</span>
              {collection.brand && (
                <>
                  <span
                    onClick={() => navigate(`/${collection.brand.slug}`)}
                    className="hover:text-gray-700 cursor-pointer capitalize"
                  >
                    {collection.brand.name}
                  </span>
                  <span className="mx-2">→</span>
                </>
              )}
              <span className="text-gray-900">{collection.name}</span>
            </div>
          </nav>

          {/* Page Title and Description */}
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl lg:text-5xl font-normal text-gray-900 mb-4 lg:mb-6 font-cormorant">
              {collection.name}
            </h1>
            {collection.description && (
              <div className="max-w-2xl">
                <p className="text-base lg:text-base text-gray-700 leading-relaxed font-cormorant">
                  {collection.description}
                </p>
              </div>
            )}
          </div>

          {/* Filter and Sort Bar */}
          <div className="mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-inter focus:outline-none focus:border-gray-900"
              >
                <option value="name">Sort by Name</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600 font-inter">
                {displayWatches.length} {displayWatches.length === 1 ? 'watch' : 'watches'}
              </div>
            </div>
          </div>

          {/* Watches Grid/List */}
          {displayWatches.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg font-cormorant mb-6">
                No watches found in this collection.
              </p>
              <button
                onClick={() => navigate('/watches')}
                className="bg-gray-900 text-white px-8 py-3 font-inter font-light uppercase tracking-wider text-sm hover:bg-gray-800 transition-colors"
              >
                Explore Other Collections
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayWatches.map((watch) => {
                const primaryImage = watch.images?.find(img => img.is_primary) || watch.images?.[0];
                return (
                  <div
                    key={watch.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/watches/${watch.slug}`)}
                  >
                    {/* Image Container */}
                    <div className="relative overflow-hidden bg-gray-100 aspect-square mb-4 rounded-lg">
                      {primaryImage ? (
                        <img
                          src={primaryImage.image_url}
                          alt={primaryImage.alt_text || watch.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}

                      {/* Like Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(watch.id);
                        }}
                        className="absolute top-4 right-4 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${
                            likedProducts.has(watch.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Product Info */}
                    <div>
                      <h3 className="text-sm lg:text-base font-inter font-light text-gray-900 mb-2 line-clamp-2">
                        {watch.name}
                      </h3>

                      {/* Brand and Style */}
                      <p className="text-xs text-gray-500 font-inter mb-3">
                        {watch.brand?.name || collection?.brand?.name} • {watch.style}
                      </p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-cormorant text-gray-900">
                          £{watch.base_price.toFixed(2)}
                        </span>
                        {watch.sale_price && watch.sale_price < watch.base_price && (
                          <span className="text-sm line-through text-gray-400 font-inter">
                            £{watch.sale_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // List View
            <div className="space-y-4">
              {displayWatches.map((watch) => {
                const primaryImage = watch.images?.find(img => img.is_primary) || watch.images?.[0];
                return (
                  <div
                    key={watch.id}
                    className="flex gap-6 p-6 border border-gray-200 rounded-lg hover:border-gray-900 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/watches/${watch.slug}`)}
                  >
                    {/* Image */}
                    <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      {primaryImage ? (
                        <img
                          src={primaryImage.image_url}
                          alt={primaryImage.alt_text || watch.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-cormorant font-light text-gray-900 mb-2">
                          {watch.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-inter mb-2">
                          {watch.brand?.name || collection?.brand?.name} • {watch.style} • {watch.watch_type}
                        </p>
                        {watch.gender && (
                          <p className="text-xs text-gray-500 font-inter capitalize">
                            For {watch.gender}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-cormorant text-gray-900">
                            £{watch.base_price.toFixed(2)}
                          </span>
                          {watch.sale_price && watch.sale_price < watch.base_price && (
                            <span className="text-sm line-through text-gray-400 font-inter">
                              £{watch.sale_price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(watch.id);
                          }}
                          className="p-2"
                        >
                          <Heart
                            className={`w-5 h-5 transition-colors ${
                              likedProducts.has(watch.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-400 hover:text-gray-900'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default WatchCollection;
