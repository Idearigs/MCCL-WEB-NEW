import React, { useState, useEffect } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigation from "../components/LuxuryNavigation";
import { Link } from "react-router-dom";
import API_BASE_URL from '../config/api';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  watches_count: number;
}

const Roamer = (): JSX.Element => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Roamer collections on component mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const brandsResponse = await fetch(`${API_BASE_URL}/watches/brands`);
        const brandsData = await brandsResponse.json();

        if (brandsData.success) {
          const roamerBrand = brandsData.data.find((b: any) => b.slug === 'roamer');
          if (roamerBrand) {
            const collectionsResponse = await fetch(`${API_BASE_URL}/watches/brands/${roamerBrand.id}/collections`);
            const collectionsData = await collectionsResponse.json();

            if (collectionsData.success) {
              setCollections(collectionsData.data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Roamer collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />
      
      {/* Hero Section */}
      <div className="relative h-screen bg-black overflow-hidden">
        {/* Watch Background Video */}
        <video 
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-slow-zoom"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/images/watch.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-12 lg:px-16">
          <div className="max-w-2xl">
            <div className="animate-fade-in-up opacity-0" style={{animationDelay: '0.5s', animationFillMode: 'forwards'}}>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-light text-white mb-6 tracking-wider font-serif">
                Roamer
              </h1>
            </div>
            <div className="animate-fade-in-up opacity-0" style={{animationDelay: '0.8s', animationFillMode: 'forwards'}}>
              <p className="text-xl md:text-3xl text-white/90 font-light mb-4 leading-relaxed tracking-wide">
                Swiss Precision Since 1888
              </p>
              <div className="w-24 h-1 bg-gray-400 mb-8 transform origin-left animate-scale-x" style={{animationDelay: '1.2s'}}></div>
            </div>
            <div className="animate-fade-in-up opacity-0" style={{animationDelay: '1.5s', animationFillMode: 'forwards'}}>
              <button className="group inline-flex items-center px-12 py-4 border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-500 font-medium tracking-widest text-sm uppercase relative overflow-hidden">
                <span className="relative z-10">Browse All Watches</span>
                <div className="absolute inset-0 bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                <svg className="w-5 h-5 ml-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center text-white/70">
            <span className="text-xs uppercase tracking-wider mb-2">Scroll</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Authorized Retailer Section */}
      <div className="relative bg-white py-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-1/4 w-32 h-32 border border-gray-900 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-24 h-24 border border-gray-900 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-gray-900 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Roamer Logo */}
          <div className="mb-12 group">
            <div className="relative inline-block">
              <img
                src="/images/roamer-logo-white.png"
                alt="Roamer Logo"
                className="h-32 md:h-40 mx-auto transition-all duration-700 group-hover:scale-110 animate-fade-in-up opacity-0 invert"
                style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-gray-900/10 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          </div>

          {/* Heritage Text */}
          <div className="space-y-6 animate-fade-in-up opacity-0" style={{animationDelay: '0.8s', animationFillMode: 'forwards'}}>
            <div className="relative">
              <p className="text-sm md:text-base font-inter font-light text-gray-900 uppercase tracking-[0.3em] mb-2">
                Since 1888
              </p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gray-900 to-transparent mx-auto"></div>
            </div>

            <p className="text-sm md:text-base font-inter font-light text-gray-700 uppercase tracking-[0.25em]">
              Official Authorized Retailer
            </p>

            <p className="text-xs md:text-sm font-inter font-light text-gray-600 tracking-[0.2em] max-w-2xl mx-auto leading-relaxed">
              Swiss precision and traditional craftsmanship for over 130 years of watchmaking excellence
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="mt-16 flex justify-center items-center space-x-8 animate-fade-in-up opacity-0" style={{animationDelay: '1.3s', animationFillMode: 'forwards'}}>
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gray-900/30"></div>
            <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gray-900/30"></div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-light text-center text-gray-900 mb-12">Why Choose Roamer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Swiss Movement</h4>
              <p className="text-gray-600">Precision Swiss movements ensure accuracy and reliability</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">Q</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Quality Materials</h4>
              <p className="text-gray-600">Premium materials including stainless steel and sapphire crystal</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Timeless Design</h4>
              <p className="text-gray-600">Classic designs that transcend trends and seasons</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Cards Section */}
      <div className="relative bg-white py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-thin text-gray-900 font-cormorant mb-16 text-center">
            Our Collections
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-gray-500">Loading collections...</p>
            </div>
          ) : collections.length > 0 ? (
            <div className="flex justify-center">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.slug}`}
                    className="group"
                  >
                    <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 aspect-[3/4] overflow-hidden transition-all duration-500 group-hover:shadow-2xl">
                      {collection.image_url ? (
                        <img
                          src={collection.image_url}
                          alt={collection.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="0.5"/>
                            <polyline points="12,6 12,12 16,14" strokeWidth="0.5"/>
                          </svg>
                        </div>
                      )}

                      {/* Overlay with Collection Name */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center p-8">
                        <div className="text-center transform transition-transform duration-300 group-hover:-translate-y-2">
                          <h3 className="text-2xl md:text-3xl font-cormorant text-white mb-3 leading-tight">
                            {collection.name.replace('Roamer ', '')}
                          </h3>
                          {collection.watches_count > 0 && (
                            <p className="text-sm text-white/80 font-inter uppercase tracking-wider">
                              {collection.watches_count} {collection.watches_count === 1 ? 'Timepiece' : 'Timepieces'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center py-20">
              <p className="text-gray-500">No collections available</p>
            </div>
          )}
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default Roamer;