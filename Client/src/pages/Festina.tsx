import React, { useState, useEffect, useRef } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigation from "../components/LuxuryNavigation";
import { Link } from "react-router-dom";
import API_BASE_URL, { getMediaUrl } from '../config/api';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  watches_count: number;
  preview_image?: string;
  preview_watch_name?: string;
  preview_description?: string;
}

const Festina = (): JSX.Element => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [collectionsHovered, setCollectionsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [careImageIndex, setCareImageIndex] = useState(0);
  const totalSlides = collections.length || 1;

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/watches/brands/slug/festina/collections`);
        const data = await response.json();
        if (data.success) {
          setCollections(data.data);
        }
      } catch (error) {
        console.error('Error fetching Festina collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  // Auto-swipe every 5 seconds, paused while hovering
  useEffect(() => {
    if (collections.length === 0 || collectionsHovered) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides, collections.length, collectionsHovered]);

  // Scroll to current slide
  useEffect(() => {
    if (scrollContainerRef.current && collections.length > 0) {
      const container = scrollContainerRef.current;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        container.scrollTo({ left: currentSlide * container.offsetWidth, behavior: 'smooth' });
      } else {
        const slideWidth = 288 + 24;
        const centerOffset = (container.offsetWidth - 288) / 2;
        container.scrollTo({ left: Math.max(0, currentSlide * slideWidth - centerOffset), behavior: 'smooth' });
      }
    }
  }, [currentSlide, collections.length]);

  // Daily-rotating featured collection
  const dailyIndex = collections.length > 0
    ? Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % collections.length
    : 0;
  const featuredCollection = collections.length > 0 ? collections[dailyIndex] : null;

  // Rotate care section image through collection previews
  useEffect(() => {
    if (collections.length === 0) return;
    const interval = setInterval(() => {
      setCareImageIndex(prev => (prev + 1) % collections.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [collections.length]);

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />

      {/* Hero Section */}
      <div className="relative h-screen bg-black overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover scale-125 animate-slow-zoom"
          autoPlay loop muted playsInline
        >
          <source src="/videos/festina.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-end h-full px-6 md:px-12 lg:px-16 pb-32">
          <div className="max-w-md">
            <div className="animate-fade-in-up opacity-0" style={{animationDelay: '0.5s', animationFillMode: 'forwards'}}>
              <h1 className="text-4xl md:text-5xl font-cormorant font-extralight text-white mb-6 tracking-[0.1em] leading-tight">
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
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-1/4 w-32 h-32 border border-[#003A63] rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-24 h-24 border border-[#003A63] rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#003A63] rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="mb-12 group">
            <div className="relative inline-block">
              <img
                src="/images/festina_black_en-GB.svg"
                alt="Festina Logo"
                className="h-32 md:h-40 mx-auto transition-all duration-700 group-hover:scale-110 animate-fade-in-up opacity-0"
                style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}
              />
              <div className="absolute inset-0 rounded-full bg-[#003A63]/10 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          </div>
          <div className="space-y-6 animate-fade-in-up opacity-0" style={{animationDelay: '0.8s', animationFillMode: 'forwards'}}>
            <div className="relative">
              <p className="text-sm md:text-base font-inter font-light text-[#003A63] uppercase tracking-[0.3em] mb-2">Since 1902</p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#003A63] to-transparent mx-auto"></div>
            </div>
            <p className="text-sm md:text-base font-inter font-light text-gray-700 uppercase tracking-[0.25em]">Official Authorized Retailer</p>
            <p className="text-xs md:text-sm font-inter font-light text-gray-600 tracking-[0.2em] max-w-2xl mx-auto leading-relaxed">
              Bringing Swiss precision and Spanish heritage to discerning timepiece enthusiasts
            </p>
          </div>
          <div className="mt-16 flex justify-center items-center space-x-8 animate-fade-in-up opacity-0" style={{animationDelay: '1.3s', animationFillMode: 'forwards'}}>
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-[#003A63]/30"></div>
            <div className="w-2 h-2 bg-[#003A63] rounded-full animate-pulse"></div>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-[#003A63]/30"></div>
          </div>
        </div>
      </div>

      {/* Collection Cards Section */}
      <div className="relative bg-gray-50 py-24 overflow-x-hidden">
        <div className="max-w-7xl mx-auto md:px-6">
          <h2 className="text-4xl md:text-5xl font-thin text-gray-900 font-cormorant mb-20 text-center px-6">
            Our Collections
          </h2>

          {loading ? (
            <div className="flex md:justify-center gap-6 overflow-x-auto pb-8 px-12">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-shrink-0 w-72 h-[450px] bg-white flex flex-col items-center justify-center gap-6 animate-pulse">
                  <div className="w-56 h-56 bg-gray-100 rounded-sm" />
                  <div className="w-32 h-4 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : collections.length > 0 ? (
            <div
              className="relative w-full px-12"
              onMouseEnter={() => setCollectionsHovered(true)}
              onMouseLeave={() => setCollectionsHovered(false)}
            >
              {/* Prev Arrow */}
              <button
                onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-opacity duration-200 ${collectionsHovered && currentSlide > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/>
                </svg>
              </button>

              {/* Next Arrow */}
              <button
                onClick={() => setCurrentSlide(prev => Math.min(totalSlides - 1, prev + 1))}
                className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-50 transition-opacity duration-200 ${collectionsHovered && currentSlide < totalSlides - 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              {/* Horizontal scrollable container */}
              <div
                ref={scrollContainerRef}
                className="flex md:gap-6 pb-8 md:justify-center"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="w-full md:w-auto flex-shrink-0 flex justify-center px-6 md:px-0"
                  >
                    <Link to={`/collections/${collection.slug}`} className="group">
                      <div className="bg-[#FAFAFA] w-full md:w-72 h-[450px] flex flex-col items-center justify-between py-6 px-8 transition-all duration-700 hover:shadow-xl hover:-translate-y-2">
                        <div className="w-64 h-64 flex items-center justify-center flex-grow">
                          {(collection.preview_image || collection.image_url) ? (
                            <img
                              src={getMediaUrl(collection.preview_image || collection.image_url || '')}
                              alt={collection.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-1000 ease-out"
                            />
                          ) : (
                            <svg className="w-40 h-40 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="0.5">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                          )}
                        </div>
                        <h3 className="text-lg font-cormorant text-gray-700 text-center leading-tight tracking-wide mt-6 pb-4">
                          {collection.name.replace('Festina ', '')}
                        </h3>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center py-20">
              <p className="text-gray-500 font-inter font-light">No collections available</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Featured Collection Section */}
      <div className="relative bg-white py-16 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6">
          {featuredCollection && (
          <div className="flex flex-col lg:flex-row gap-8 items-center">
            {/* Left — Text Content */}
            <div className="flex-1 space-y-6">
              <div>
                <p className="text-xs font-inter font-light text-[#003A63] uppercase tracking-[0.3em] mb-4">
                  Featured Collection
                </p>
                <h2 className="text-3xl md:text-4xl font-cormorant font-light text-gray-900 mb-4 leading-tight">
                  {featuredCollection.name}
                </h2>
                <p className="text-base font-inter font-light text-gray-600 leading-relaxed">
                  {featuredCollection.preview_description || featuredCollection.description || ''}
                </p>
              </div>
              <Link
                to={`/collections/${featuredCollection.slug}`}
                className="inline-block border border-gray-300 text-gray-700 px-8 py-3 font-inter font-light text-sm uppercase tracking-wider hover:bg-gray-50 transition-all duration-300"
              >
                View Collection
              </Link>
            </div>

            {/* Right — Watch Image */}
            <div className="relative w-full lg:w-96 h-96 flex-shrink-0 bg-white overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={featuredCollection.preview_image
                    ? getMediaUrl(featuredCollection.preview_image)
                    : '/images/sample-watch.avif'}
                  alt={featuredCollection.preview_watch_name || 'Festina Watch'}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
          )}

          {/* Second Row - Caring for your watch */}
          <div className="flex flex-col lg:flex-row gap-8 items-center mt-16">
            <div className="relative w-full lg:w-96 h-96 flex-shrink-0 bg-gray-100 overflow-hidden group order-1">
              <div className="absolute inset-0">
                <img
                  src={collections.length > 0 && collections[careImageIndex % collections.length]?.preview_image
                    ? getMediaUrl(collections[careImageIndex % collections.length]!.preview_image!)
                    : '/images/sample-watch.avif'}
                  alt="Festina Care"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="flex-1 space-y-6 order-2 text-center lg:text-left">
              <div>
                <h2 className="text-3xl md:text-4xl font-cormorant font-light text-gray-900 mb-6 leading-tight">
                  Caring for your watch
                </h2>
                <p className="text-base font-inter font-light text-gray-600 leading-relaxed">
                  We have put together a few tips and tricks in order to ensure that you always know exactly how to care for your watch, whether that be regular servicing by a Festina trained and certified watchmaker, or a little bit of gentle at-home maintenance.
                </p>
              </div>
              <div className="flex justify-center lg:justify-start">
                <button className="border border-gray-300 text-gray-700 px-8 py-3 font-inter font-light text-sm uppercase tracking-wider hover:bg-gray-50 transition-all duration-300">
                  Read More
                </button>
              </div>
            </div>
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
