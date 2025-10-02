import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";
import { Heart } from "lucide-react";

interface Watch {
  id: string;
  name: string;
  slug: string;
  price: string;
  base_price: number;
  sale_price: number | null;
  description: string;
  image: {
    url: string;
    alt: string;
  } | null;
  in_stock: boolean;
  is_featured: boolean;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
}

const RoamerSwissTradition = (): JSX.Element => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    const fetchCollectionData = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/v1/watches/collections/roamer-swiss-tradition');
        const data = await response.json();

        if (data.success) {
          setCollection(data.data.collection);
          setWatches(data.data.watches);
        }
      } catch (error) {
        console.error('Error fetching collection data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionData();
  }, []);

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />

      {/* Main Content */}
      <main className="flex-1 pt-32 lg:pt-44 pb-8">
        <div className="w-full px-4 lg:px-[40px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 lg:mb-8">
            <div className="flex items-center text-sm text-gray-500 font-light justify-center">
              <Link to="/" className="hover:text-gray-700">Home</Link>
              <span className="mx-2">→</span>
              <Link to="/watches" className="hover:text-gray-700">Watches</Link>
              <span className="mx-2">→</span>
              <span className="text-gray-900">{collection?.name || 'Collection'}</span>
            </div>
          </nav>

          {/* Page Title and Description - Centered */}
          <div className="mb-10 lg:mb-16 text-center max-w-3xl mx-auto">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <h1 className="text-4xl lg:text-6xl font-normal text-gray-900 mb-6 font-cormorant">
                  {collection?.name}
                </h1>
                <p className="text-lg lg:text-xl text-gray-700 leading-relaxed font-cormorant">
                  {collection?.description}
                </p>
              </>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-gray-500">Loading watches...</p>
            </div>
          ) : watches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {watches.map((watch) => (
                <div key={watch.id} className="group">
                  <div className="relative mb-4 overflow-hidden bg-gray-50">
                    <Link to={`/watches/${watch.slug}`}>
                      <div className="aspect-[3/4] flex items-center justify-center">
                        {watch.image?.url ? (
                          <img
                            src={watch.image.url}
                            alt={watch.image.alt}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <svg className="w-20 h-20 mx-auto opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Like Button */}
                    <button
                      onClick={() => toggleLike(watch.id)}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all duration-200 shadow-sm"
                    >
                      <Heart
                        className={`w-5 h-5 transition-colors ${
                          likedProducts.has(watch.id)
                            ? 'fill-red-500 stroke-red-500'
                            : 'stroke-gray-600'
                        }`}
                      />
                    </button>

                    {/* Out of Stock Overlay */}
                    {!watch.in_stock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-inter uppercase tracking-wider">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="text-center space-y-2">
                    <Link to={`/watches/${watch.slug}`}>
                      <h3 className="text-base font-medium text-gray-900 hover:text-gray-600 transition-colors font-cormorant">
                        {watch.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium text-gray-900 font-inter">
                        {watch.price}
                      </span>
                      {watch.sale_price && (
                        <span className="text-sm text-gray-500 line-through font-inter">
                          £{watch.base_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-500 text-lg mb-4">No watches available in this collection</p>
              <Link to="/watches" className="text-gray-900 underline hover:text-gray-600">
                Browse all watches
              </Link>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-16 text-center bg-gray-50 rounded-lg p-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4 font-cormorant">
              Expert Watch Consultation
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-cormorant">
              Our specialists are here to help you find the perfect timepiece
            </p>
            <Link
              to="/contact"
              className="inline-block bg-gray-900 text-white px-8 py-3 hover:bg-gray-800 transition-colors font-inter text-sm uppercase tracking-wider"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default RoamerSwissTradition;
