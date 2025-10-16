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

const Roamer = (): JSX.Element => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const totalSlides = collections.length || 1;

  // Fetch Roamer collections on component mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setLoading(true);
        // Fetch brand collections - we need the brand ID first
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

  // Auto-swipe effect every 5 seconds (slower)
  useEffect(() => {
    if (collections.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalSlides, collections.length]);

  // Smooth scroll to current slide with slower transition
  useEffect(() => {
    if (scrollContainerRef.current && collections.length > 0) {
      const container = scrollContainerRef.current;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // On mobile, each card takes full width
        const targetScroll = currentSlide * container.offsetWidth;
        container.scrollTo({
          left: targetScroll,
          behavior: 'smooth'
        });
      } else {
        // On desktop, calculate based on card width
        const slideWidth = 288 + 24; // w-72 (288px) + 24px gap
        const containerWidth = container.offsetWidth;
        const centerOffset = (containerWidth - 288) / 2;
        const targetScroll = currentSlide * slideWidth - centerOffset;

        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth'
        });
      }
    }
  }, [currentSlide, collections.length]);

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />

      {/* Hero Section */}
      <div className="relative h-screen bg-black overflow-hidden">
        {/* Roamer Background Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover scale-125 animate-slow-zoom"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/videos/roamer.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-end h-full px-6 md:px-12 lg:px-16 pb-32">
          <div className="max-w-md">
            <div className="animate-fade-in-up opacity-0" style={{animationDelay: '0.5s', animationFillMode: 'forwards'}}>
              <h1 className="text-4xl md:text-5xl font-cormorant font-extralight text-white mb-6 tracking-[0.1em] leading-tight">
                Roamer
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
          <div className="absolute top-20 left-1/4 w-32 h-32 border border-red-900 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-24 h-24 border border-red-900 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-red-900 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Roamer Logo */}
          <div className="mb-12 group">
            <div className="relative inline-block">
              <img
                src="/images/roamer-logo.svg"
                alt="Roamer Logo"
                className="h-32 md:h-40 mx-auto transition-all duration-700 group-hover:scale-110 animate-fade-in-up opacity-0"
                style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 rounded-full bg-red-900/10 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            </div>
          </div>

          {/* Heritage Text */}
          <div className="space-y-6 animate-fade-in-up opacity-0" style={{animationDelay: '0.8s', animationFillMode: 'forwards'}}>
            <div className="relative">
              <p className="text-sm md:text-base font-inter font-light text-red-900 uppercase tracking-[0.3em] mb-2">
                Since 1888
              </p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-red-900 to-transparent mx-auto"></div>
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
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-red-900/30"></div>
            <div className="w-2 h-2 bg-red-900 rounded-full animate-pulse"></div>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-red-900/30"></div>
          </div>
        </div>
      </div>

      {/* Collection Cards Section */}
      <div className="relative bg-gray-50 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto md:px-6">
          <h2 className="text-4xl md:text-5xl font-thin text-gray-900 font-cormorant mb-20 text-center px-6">
            Our Collections
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-gray-500 font-inter font-light">Loading collections...</p>
            </div>
          ) : collections.length > 0 ? (
            <div className="relative overflow-hidden w-full">
              {/* Horizontal scrollable container */}
              <div
                ref={scrollContainerRef}
                className="flex md:gap-6 pb-8 md:justify-center"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  overflow: 'hidden',
                  scrollBehavior: 'smooth',
                  transition: 'scroll 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {collections.map((collection, index) => (
                  <div
                    key={collection.id}
                    className="w-full md:w-auto flex-shrink-0 flex justify-center px-6 md:px-0"
                  >
                    <Link
                      to={`/collections/${collection.slug}`}
                      className="group"
                    >
                      <div className="bg-white w-full md:w-72 h-[450px] flex flex-col items-center justify-between py-6 px-8 transition-all duration-700 hover:shadow-xl hover:-translate-y-2">
                      {/* Watch Image */}
                      <div className="w-64 h-64 flex items-center justify-center flex-grow">
                        {collection.image_url ? (
                          <img
                            src={collection.image_url}
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

                      {/* Collection Name */}
                      <h3 className="text-lg font-cormorant text-gray-700 text-center leading-tight tracking-wide mt-6 pb-4">
                        {collection.name.replace('Roamer ', '')}
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

      {/* Luxury Feature Section - 2 Column Layout */}
      <div className="relative bg-white py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left Column - Text Content */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-cormorant font-light text-gray-900 mb-6 leading-tight">
                  New Models 2025
                </h2>
                <p className="text-base font-inter font-light text-gray-600 leading-relaxed">
                  Roamer's collection showcases Swiss watchmaking excellence with over 130 years of heritage, combining traditional craftsmanship with modern innovation and timeless design.
                </p>
              </div>

              <button className="border border-gray-300 text-gray-700 px-8 py-3 font-inter font-light text-sm uppercase tracking-wider hover:bg-gray-50 transition-all duration-300">
                View Range
              </button>
            </div>

            {/* Right Column - Watch Image */}
            <div className="relative h-[500px] bg-gradient-to-br from-red-50 to-rose-100 overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <img
                  src="/images/sample-watch.avif"
                  alt="Roamer Watch"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>

          {/* Second Row - Reversed Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mt-32">

            {/* Left Column - Watch Image */}
            <div className="relative h-[500px] bg-gray-100 overflow-hidden group order-2 lg:order-1">
              <div className="absolute inset-0 flex items-center justify-center p-12">
                <img
                  src="/images/sample-watch.avif"
                  alt="Roamer Care"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            {/* Right Column - Text Content */}
            <div className="space-y-8 order-1 lg:order-2">
              <div>
                <h2 className="text-3xl md:text-4xl font-cormorant font-light text-gray-900 mb-6 leading-tight">
                  Caring for your watch
                </h2>
                <p className="text-base font-inter font-light text-gray-600 leading-relaxed">
                  We have put together a few tips and tricks in order to ensure that you always know exactly how to care for your watch, whether that be regular servicing by a Roamer trained and certified watchmaker, or a little bit of gentle at-home maintenance.
                </p>
              </div>

              <button className="border border-gray-300 text-gray-700 px-8 py-3 font-inter font-light text-sm uppercase tracking-wider hover:bg-gray-50 transition-all duration-300">
                Read More
              </button>
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
              McCulloch Jewellers and Roamer share over a century of commitment to excellence in watchmaking. As an authorized retailer, we're proud to showcase Roamer's Swiss precision and timeless designs.
            </p>

            <p className="text-lg">
              As a Roamer authorised retailer, McCulloch Jewellers carry the exceptional timepieces created by this historic Swiss brand. With a dedication to traditional craftsmanship and lasting quality, McCulloch Jewellers and Roamer continue to honor the art of fine watchmaking.
            </p>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default Roamer;
