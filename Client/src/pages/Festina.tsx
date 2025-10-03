import React, { useState, useEffect, useRef } from "react";
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

const Festina = (): JSX.Element => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const totalSlides = collections.length || 1;

  // Fetch Festina collections on component mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        // Fetch brand collections - we need the brand ID first
        const brandsResponse = await fetch(`${API_BASE_URL}/watches/brands`);
        const brandsData = await brandsResponse.json();

        if (brandsData.success) {
          const festinaBrand = brandsData.data.find((b: any) => b.slug === 'festina');
          if (festinaBrand) {
            const collectionsResponse = await fetch(`${API_BASE_URL}/watches/brands/${festinaBrand.id}/collections`);
            const collectionsData = await collectionsResponse.json();

            if (collectionsData.success) {
              setCollections(collectionsData.data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Festina collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  // Auto-swipe effect every 3 seconds
  useEffect(() => {
    if (collections.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 3000);

    return () => clearInterval(interval);
  }, [totalSlides, collections.length]);

  // Scroll to current slide
  useEffect(() => {
    if (scrollContainerRef.current) {
      const slideWidth = 288 + 24; // 72 * 4 (w-72 = 288px) + 24px gap
      scrollContainerRef.current.scrollTo({
        left: currentSlide * slideWidth,
        behavior: 'smooth'
      });
    }
  }, [currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />
      
      {/* Hero Section */}
      <div className="relative h-screen bg-black overflow-hidden">
        {/* Festina Background Video */}
        <video 
          className="absolute inset-0 w-full h-full object-cover scale-125 animate-slow-zoom"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/festina.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full px-6 md:px-12 lg:px-16 pb-32">
          <div className="max-w-md">
            <div className="animate-fade-in-up opacity-0" style={{animationDelay: '0.5s', animationFillMode: 'forwards'}}>
              <h1 className="text-4xl md:text-5xl font-extralight text-white mb-6 tracking-[0.1em] leading-tight">
                Festina
              </h1>
            </div>
            <div className="animate-fade-in-up opacity-0" style={{animationDelay: '1.5s', animationFillMode: 'forwards'}}>
              <button className="bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-2.5 transition-all duration-300 font-inter font-light tracking-wider text-sm uppercase hover:bg-white/20 hover:border-white/50 hover:scale-105">
                Browse All Watches
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Retailer Section */}
      <div className="relative bg-white py-24 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-1/4 w-32 h-32 border border-[#003A63] rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-24 h-24 border border-[#003A63] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#003A63] rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Festina Logo */}
          <div className="mb-12 group">
            <div className="relative inline-block">
              <img 
                src="/images/festina_black_en-GB.svg" 
                alt="Festina Logo" 
                className="h-32 md:h-40 mx-auto transition-all duration-700 group-hover:scale-110 animate-fade-in-up opacity-0"
                style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-[#003A63]/10 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          </div>
          
          {/* Heritage Text */}
          <div className="space-y-6 animate-fade-in-up opacity-0" style={{animationDelay: '0.8s', animationFillMode: 'forwards'}}>
            <div className="relative">
              <p className="text-sm md:text-base font-inter font-light text-[#003A63] uppercase tracking-[0.3em] mb-2">
                Since 1902
              </p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#003A63] to-transparent mx-auto"></div>
            </div>
            
            <p className="text-sm md:text-base font-inter font-light text-gray-700 uppercase tracking-[0.25em]">
              Official Authorized Retailer
            </p>
            
            <p className="text-xs md:text-sm font-inter font-light text-gray-600 tracking-[0.2em] max-w-2xl mx-auto leading-relaxed">
              Bringing Swiss precision and Spanish heritage to discerning timepiece enthusiasts
            </p>
          </div>
          
          {/* Decorative Elements */}
          <div className="mt-16 flex justify-center items-center space-x-8 animate-fade-in-up opacity-0" style={{animationDelay: '1.3s', animationFillMode: 'forwards'}}>
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#003A63]/30"></div>
            <div className="w-2 h-2 bg-[#003A63] rounded-full animate-pulse"></div>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#003A63]/30"></div>
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
                            {collection.name.replace('Festina ', '')}
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

      {/* New Models 2025 Section - Completely New Design */}
      <div className="relative bg-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-3">
          <div className="absolute top-20 left-20 w-px h-40 bg-[#003A63]"></div>
          <div className="absolute top-20 left-20 w-40 h-px bg-[#003A63]"></div>
          <div className="absolute bottom-20 right-20 w-px h-40 bg-[#003A63]"></div>
          <div className="absolute bottom-20 right-20 w-40 h-px bg-[#003A63]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-block">
              <h2 className="text-5xl md:text-6xl font-thin text-gray-900 font-cormorant mb-4 tracking-tight">
                New Models
              </h2>
              <div className="flex items-center justify-center gap-4">
                <div className="w-16 h-px bg-[#003A63]"></div>
                <span className="text-lg font-cormorant text-[#003A63] tracking-[0.3em]">2025</span>
                <div className="w-16 h-px bg-[#003A63]"></div>
              </div>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Description */}
            <div className="group">
              <div className="bg-gray-50 h-80 flex flex-col justify-center p-12 hover:bg-[#003A63] transition-all duration-700 cursor-pointer">
                <div className="text-center">
                  <h3 className="text-2xl font-cormorant text-gray-900 mb-6 group-hover:text-white transition-colors duration-700">
                    Heritage
                  </h3>
                  <p className="text-base font-cormorant text-gray-700 leading-relaxed group-hover:text-white/90 transition-colors duration-700">
                    Festina's collection will delight connoisseurs and admirers of fine watchmaking with cutting-edge chronograph technology.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Feature 2 - Main Watch Display */}
            <div className="group">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 h-80 flex flex-col justify-center items-center p-12 hover:from-amber-100 hover:to-yellow-100 transition-all duration-700 cursor-pointer relative overflow-hidden">
                {/* Subtle geometric pattern */}
                <div className="absolute top-0 right-0 w-20 h-20 border-r border-t border-[#003A63]/10 group-hover:border-[#003A63]/20 transition-colors duration-700"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 border-l border-b border-[#003A63]/10 group-hover:border-[#003A63]/20 transition-colors duration-700"></div>
                
                <div className="text-center relative z-10">
                  <div className="w-32 h-32 mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-28 h-28 text-[#003A63]/30 group-hover:text-[#003A63]/50 group-hover:scale-110 transition-all duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="0.8">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <p className="text-sm font-cormorant text-gray-600 tracking-wider">Festina Chronograph</p>
                </div>
              </div>
            </div>
            
            {/* Feature 3 - Care Information */}
            <div className="group">
              <div className="bg-gray-50 h-80 flex flex-col justify-center p-12 hover:bg-[#003A63] transition-all duration-700 cursor-pointer">
                <div className="text-center">
                  <h3 className="text-2xl font-cormorant text-gray-900 mb-6 group-hover:text-white transition-colors duration-700">
                    Care
                  </h3>
                  <p className="text-base font-cormorant text-gray-700 leading-relaxed group-hover:text-white/90 transition-colors duration-700 mb-6">
                    Expert guidance for maintaining your timepiece with precision and care from certified watchmakers.
                  </p>
                  <div className="inline-block w-8 h-px bg-[#003A63] group-hover:bg-white group-hover:w-16 transition-all duration-700"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Action */}
          <div className="text-center mt-16">
            <button className="group inline-flex items-center bg-[#003A63] text-white px-12 py-4 font-cormorant text-sm uppercase tracking-[0.2em] hover:bg-gray-900 transition-all duration-500 relative overflow-hidden">
              <span className="relative z-10">Explore Collection</span>
              <svg className="w-4 h-4 ml-4 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="absolute inset-0 bg-gray-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Partnership Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-thin text-gray-900 font-cormorant mb-8 tracking-tight">A Special Partnership</h2>
          </div>
          
          <div className="space-y-8 text-gray-700 font-inter font-light leading-relaxed">
            <p className="text-lg">
              Two independent family businesses; shared values, shared passion. For thirty-two years, McCulloch Jewellers and Festina have enjoyed a long-standing partnership in the watch industry; unparalleled design and craftsmanship have formed the cornerstone of their shared philosophy.
            </p>
            
            <p className="text-lg">
              As a Festina authorised retailer, McCulloch Jewellers carry the masterpieces created by this most prestigious of Spanish watch brands. With a discerning clientele that appreciates unparalleled levels of customer service, the perfect accompaniment to the very finest timepieces, McCulloch Jewellers and Festina are proud to continue our harmonious journey through time...
            </p>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default Festina;