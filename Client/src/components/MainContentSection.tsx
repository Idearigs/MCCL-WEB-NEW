
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import WatchBrandsShowcase from "./WatchBrandsShowcase";
import MarketingSection from "./MarketingSection";
import PromotionBanner from "./PromotionBanner";
import API_BASE_URL, { getMediaUrl } from '../config/api';

const jewelryCategories = [
  {
    title: "Rings",
    image: "/images/fff.webp",
    href: "/rings"
  },
  {
    title: "Earrings", 
    image: "/images/ggg.webp",
    href: "/earrings"
  },
  {
    title: "Necklaces",
    image: "/images/dddd.webp", 
    href: "/necklaces"
  },
  {
    title: "Bracelets",
    image: "/images/sddd.webp",
    href: "/bracelets"
  },
];

// Interface for product data structure
interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: {
    url: string;
    alt: string;
  } | null;
}




export default function MainContentSection(): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileCarouselIndex, setMobileCarouselIndex] = useState(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [ringProducts, setRingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  // Handle window resize for mobile/desktop detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch ring products from API
  useEffect(() => {
    const fetchRingProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/products/category/rings`);
        const data = await response.json();

        if (data.success && data.data && data.data.products) {
          // Transform API data to match the expected structure
          const transformedProducts: Product[] = data.data.products.map((product: any) => ({
            id: product.slug,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.image
          }));
          // Only show products that have images; fetch up to 20
          const withImages = transformedProducts.filter((p: Product) => p.image?.url);
          setRingProducts(withImages.slice(0, 20));
        }
      } catch (error) {
        console.error('Error fetching ring products:', error);
        // Keep empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchRingProducts();
  }, []);

  // Auto-slide functionality - every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (desktopScrollRef.current) {
        const container = desktopScrollRef.current;
        const firstCard = container.querySelector('a') as HTMLElement | null;
        const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 216; // measured card + gap
        const containerWidth = container.clientWidth;
        const cardsVisible = Math.floor(containerWidth / cardWidth);
        const maxIndex = Math.max(0, ringProducts.length - cardsVisible);

        if (currentProductIndex >= maxIndex) {
          // Reset to beginning
          container.scrollTo({ left: 0, behavior: 'smooth' });
          setCurrentProductIndex(0);
        } else {
          // Move to next slide
          const nextIndex = currentProductIndex + 1;
          container.scrollTo({ left: nextIndex * cardWidth, behavior: 'smooth' });
          setCurrentProductIndex(nextIndex);
        }
      }
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [currentProductIndex, ringProducts.length]);

  // Navigation arrow handlers
  const handlePrevious = () => {
    if (desktopScrollRef.current) {
      const container = desktopScrollRef.current;
      const firstCard = container.querySelector('a') as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 216;
      const newIndex = Math.max(0, currentProductIndex - 1);
      container.scrollTo({ left: newIndex * cardWidth, behavior: 'smooth' });
      setCurrentProductIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (desktopScrollRef.current) {
      const container = desktopScrollRef.current;
      const firstCard = container.querySelector('a') as HTMLElement | null;
      const cardWidth = firstCard ? firstCard.offsetWidth + 16 : 216;
      const containerWidth = container.clientWidth;
      const cardsVisible = Math.floor(containerWidth / cardWidth);
      const maxIndex = Math.max(0, ringProducts.length - cardsVisible);
      const newIndex = Math.min(maxIndex, currentProductIndex + 1);
      container.scrollTo({ left: newIndex * cardWidth, behavior: 'smooth' });
      setCurrentProductIndex(newIndex);
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const cardWidth = 280 + 16; // card width + gap
      const scrollLeft = container.scrollLeft;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(index, jewelryCategories.length - 1));
    }
  };

  const handleMobileCarouselScroll = () => {
    if (mobileScrollRef.current) {
      const container = mobileScrollRef.current;
      const cardWidth = container.offsetWidth; // full width = 1 card
      const scrollLeft = container.scrollLeft;
      const index = Math.round(scrollLeft / cardWidth);
      setMobileCarouselIndex(Math.min(index, ringProducts.length - 1));
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    const mobileContainer = mobileScrollRef.current;
    if (mobileContainer) {
      mobileContainer.addEventListener('scroll', handleMobileCarouselScroll);
      return () => mobileContainer.removeEventListener('scroll', handleMobileCarouselScroll);
    }
  }, []);

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="relative w-full overflow-hidden" style={{ height: '100vh', minHeight: '100vh' }}>
        {/* YouTube Video Background - Fullscreen */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
          <iframe
            src="https://www.youtube-nocookie.com/embed/m9K10HyJIe4?autoplay=1&mute=1&controls=0&modestbranding=1&fs=0&loop=1&playlist=m9K10HyJIe4&rel=0&iv_load_policy=3&vq=hd1080"
            title="McCulloch Jewelry Collection Video"
            allow="autoplay"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: isMobile ? '500vw' : '120vw',
              height: isMobile ? '500vh' : '120vh',
              transform: 'translate(-50%, -50%)',
              border: 'none',
              pointerEvents: 'none'
            }}
          />
        </div>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40 z-10" />

        {/* Content Container */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center text-white px-4 w-full">
          <h1
            className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight sm:leading-snug md:leading-tight lg:leading-tight mb-4 md:mb-8 max-w-full opacity-0 animate-fade-in-up font-cormorant font-semibold"
            style={{
              animationDelay: '0.5s',
              animationFillMode: 'forwards'
            }}
          >
            THE CELESTIAL <span className="italic block sm:inline">COLLECTION</span>
          </h1>
          <p
            className="text-sm sm:text-base md:text-base lg:text-lg leading-6 md:leading-7 font-normal mb-6 md:mb-10 max-w-full tracking-wide opacity-0 animate-fade-in-up px-2"
            style={{
              fontFamily: 'Inter, sans-serif',
              animationDelay: '0.8s',
              animationFillMode: 'forwards'
            }}
          >
            Forever yours.
          </p>
          <Button
            variant="outline"
            className="h-11 sm:h-12 md:h-[50px] w-48 sm:w-56 md:w-[280px] bg-white bg-opacity-95 border-0 text-gray-900 hover:bg-white hover:bg-opacity-100 hover:scale-105 transition-all duration-300 font-normal tracking-wider uppercase opacity-0 animate-fade-in-up text-xs sm:text-sm"
            style={{
              animationDelay: '1.1s',
              animationFillMode: 'forwards'
            }}
          >
            <span className="text-[10px] sm:text-xs md:text-[12px] font-normal tracking-[1px] md:tracking-[1.5px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              EXPLORE THE COLLECTION
            </span>
          </Button>
        </div>
      </section>

      {/* Promotion Banner - Below Hero */}
      <PromotionBanner />

      {/* Jewelry Categories Section */}
      <section className="bg-white py-20 lg:py-24">
        {/* Desktop Grid Layout */}
        <div className="hidden lg:block max-w-7xl mx-auto px-6 lg:px-1">
          <div className="grid grid-cols-4 gap-7">
            {jewelryCategories.map((category, index) => (
              <Link
                key={index}
                to={category.href}
                className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500"
                style={{
                  height: '430px'
                }}
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-serif font-light text-white mb-2 tracking-wide">
                      {category.title}
                    </h3>
                    <div className="w-12 h-px bg-white/60 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Horizontal Scroll Layout */}
        <div className="lg:hidden">
          <div ref={scrollRef} className="flex overflow-x-auto px-6 gap-4 scrollbar-hide pb-6">
            {jewelryCategories.map((category, index) => (
              <Link
                key={index}
                to={category.href}
                className="group relative flex-shrink-0 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500"
                style={{
                  width: '280px',
                  height: '375px'
                }}
              >
                <img
                  src={category.image}
                  alt={category.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-serif font-light text-white mb-2 tracking-wide">
                      {category.title}
                    </h3>
                    <div className="w-12 h-px bg-white/60 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Custom Scroll Indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex gap-2">
              {jewelryCategories.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === activeIndex ? 'w-8 bg-black' : 'w-4 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marketing Section - Bespoke Collection */}
      <MarketingSection />

      {/* Latest Designs & Engagement Rings Showcase */}
      <section className="bg-gray-50 py-20 lg:py-24">
        {/* Desktop Layout */}
        <div className="hidden lg:block max-w-7xl mx-auto px-8 relative">
          <div className="grid grid-cols-2 gap-28">
            
            {/* Latest Designs */}
            <div className="flex flex-col">
              <div className="mb-10">
                <h2 className="text-3xl font-serif font-normal text-gray-900 mb-4 tracking-normal leading-tight">
                  Latest Designs
                </h2>
                <p className="text-base font-cormorant font-normal text-gray-700 mb-6 leading-relaxed">
                  Explore the latest jewellery designs and collections
                </p>
                <button className="group flex items-center text-xs font-serif font-medium text-gray-800 uppercase tracking-[0.15em] hover:text-gray-600 transition-colors duration-300">
                  <span>Discover More</span>
                  <svg className="ml-2 w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 relative group overflow-hidden rounded-lg shadow-lg">
                <img
                  src="/images/latest-designs.jpg"
                  alt="Latest Jewelry Designs"
                  className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=500&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </div>
            </div>

            {/* Vertical Divider Line */}
            <div className="absolute left-1/2 top-8 bottom-8 w-px bg-gray-200 transform -translate-x-1/2"></div>

            {/* Engagement Rings */}
            <div className="flex flex-col">
              <div className="flex-1 relative group overflow-hidden rounded-lg shadow-lg mb-10">
                <img
                  src="/images/engagement-rings.jpg"
                  alt="Engagement Rings Collection"
                  className="w-full h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=500&fit=crop";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </div>
              
              <div>
                <h2 className="text-3xl font-serif font-normal text-gray-900 mb-4 tracking-normal leading-tight">
                  Engagement Rings
                </h2>
                <p className="text-base font-cormorant font-normal text-gray-700 mb-6 leading-relaxed">
                  Start your love story in style with an iconic McCulloch ring
                </p>
                <button className="group flex items-center text-xs font-serif font-medium text-gray-800 uppercase tracking-[0.15em] hover:text-gray-600 transition-colors duration-300">
                  <span>Discover More</span>
                  <svg className="ml-2 w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Layout - Full Width Images */}
        <div className="lg:hidden">
          {/* Latest Designs */}
          <div>
            <div className="px-6 lg:px-0 mx-5 lg:mx-0 mb-10">
              <h2 className="text-2xl font-serif font-normal text-gray-900 mb-4 tracking-normal leading-tight">
                Latest Designs
              </h2>
              <p className="text-sm font-cormorant font-normal text-gray-700 mb-6 leading-relaxed">
                Explore the latest jewellery designs and collections
              </p>
              <button className="group flex items-center text-xs font-serif font-medium text-gray-800 uppercase tracking-[0.15em] hover:text-gray-600 transition-colors duration-300">
                <span>Discover More</span>
                <svg className="ml-2 w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="relative group">
              <img
                src="/images/latest-designs.jpg"
                alt="Latest Jewelry Designs"
                className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=500&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>

          {/* Engagement Rings */}
          <div>
            <div className="relative group">
              <img
                src="/images/engagement-rings.jpg"
                alt="Engagement Rings Collection"
                className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=500&fit=crop";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            <div className="px-6 lg:px-0 mx-5 lg:mx-0 mt-8 lg:mt-0 text-center lg:text-left">
              <h2 className="text-2xl font-serif font-normal text-gray-900 mb-4 tracking-normal leading-tight">
                Engagement Rings
              </h2>
              <p className="text-sm font-cormorant font-normal text-gray-700 mb-6 leading-relaxed">
                Start your love story in style with an iconic McCulloch ring
              </p>
              <div className="flex justify-center lg:justify-start">
                <button className="group flex items-center text-xs font-serif font-medium text-gray-800 uppercase tracking-[0.15em] hover:text-gray-600 transition-colors duration-300">
                  <span>Discover More</span>
                  <svg className="ml-2 w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Carousel Section */}
      <section className="bg-white py-12 lg:py-16">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8 px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-inter font-light uppercase tracking-[0.35em] text-gray-400 mb-1">
              Our Collection
            </p>
            <h2 className="text-3xl lg:text-4xl font-cormorant font-light text-gray-900 leading-tight">
              Rings
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/rings"
              className="hidden lg:inline text-[10px] font-inter font-light uppercase tracking-[0.25em] text-gray-400 hover:text-gray-900 transition-colors duration-300 mr-2"
            >
              View All
            </Link>
            {/* Circular Navigation Arrows */}
            <button
              onClick={handlePrevious}
              disabled={currentProductIndex === 0}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200 ${
                currentProductIndex === 0
                  ? 'border-gray-200 cursor-not-allowed'
                  : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${currentProductIndex === 0 ? 'text-gray-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-full border border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Product Carousel */}
        <div
          ref={desktopScrollRef}
          className="hidden lg:block overflow-x-auto pl-6 lg:pl-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflow: 'hidden' }}
        >
          <div className="flex gap-4">
            {loading ? (
              Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="flex-shrink-0 animate-pulse"
                  style={{ width: 'calc((100vw - 4rem - 6 * 1rem) / 7)' }}
                >
                  <div className="bg-gray-100 w-full" style={{ aspectRatio: '1 / 1.1' }} />
                  <div className="bg-gray-100 h-3 mt-3 w-3/4 rounded" />
                </div>
              ))
            ) : (
              ringProducts.map((product, index) => (
                <Link
                  key={index}
                  to={`/rings/${product.slug || product.id}`}
                  className="flex-shrink-0 group"
                  style={{ width: 'calc((100vw - 4rem - 6 * 1rem) / 7)' }}
                >
                  {/* Image tile */}
                  <div
                    className="w-full bg-[#f0f0f0] overflow-hidden"
                    style={{ aspectRatio: '1 / 1' }}
                  >
                    <img
                      src={getMediaUrl(product.image?.url || '')}
                      alt={product.image?.alt || product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  {/* Name below on white */}
                  <div className="pt-3 pb-1">
                    <h3 className="text-sm font-cormorant font-light text-gray-800 leading-snug">
                      {product.name}
                    </h3>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Desktop scroll indicator */}
        <div className="hidden lg:flex justify-center mt-8">
          <div className="flex gap-2">
            {ringProducts.slice(0, Math.min(ringProducts.length, 4)).map((_, index) => (
              <div
                key={index}
                className={`h-0.5 rounded-full transition-all duration-500 ease-in-out ${
                  index === currentProductIndex ? 'w-10 bg-gray-800' : 'w-4 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Product Carousel — 1 card at a time */}
        <div className="lg:hidden">
          <div
            ref={mobileScrollRef}
            className="overflow-x-auto"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <div className="flex">
              {loading ? (
                <div className="flex-shrink-0 w-full px-6 animate-pulse">
                  <div className="bg-gray-100 w-full" style={{ aspectRatio: '4/3' }} />
                  <div className="bg-gray-100 h-4 mt-4 w-1/2 rounded mx-auto" />
                </div>
              ) : (
                ringProducts.map((product, index) => (
                  <Link
                    key={index}
                    to={`/rings/${product.slug || product.id}`}
                    className="flex-shrink-0 w-full px-6 group"
                    style={{ scrollSnapAlign: 'start' }}
                  >
                    {/* Image tile */}
                    <div
                      className="w-full bg-[#f5f5f5] overflow-hidden"
                      style={{ aspectRatio: '4/3' }}
                    >
                      <img
                        src={getMediaUrl(product.image?.url || '')}
                        alt={product.image?.alt || product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Centered name */}
                    <div className="mt-4 text-center">
                      <h3 className="text-lg font-cormorant font-light text-gray-900 tracking-wide">
                        {product.name}
                      </h3>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Elegant dot indicator */}
          <div className="flex justify-center mt-6 gap-1.5">
            {ringProducts.map((_, index) => (
              <div
                key={index}
                className={`rounded-full transition-all duration-300 ${
                  index === mobileCarouselIndex
                    ? 'w-5 h-[3px] bg-gray-800'
                    : 'w-[6px] h-[3px] bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* View All */}
          <div className="flex justify-center mt-6">
            <Link
              to="/rings"
              className="text-[10px] font-inter font-light uppercase tracking-[0.3em] text-gray-400 hover:text-gray-800 transition-colors duration-300"
            >
              View All Rings
            </Link>
          </div>
        </div>
      </section>

      {/* Watch Brands Showcase Section */}
      <WatchBrandsShowcase />


    </main>

    
  );
}
