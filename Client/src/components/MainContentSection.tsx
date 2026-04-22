
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import WatchBrandsShowcase from "./WatchBrandsShowcase";
import MarketingSection from "./MarketingSection";
import PromotionBanner from "./PromotionBanner";
import ScrollReveal from "./ScrollReveal";
import API_BASE_URL, { getMediaUrl } from '../config/api';

const jewelryCategories = [
  {
    title: "Rings",
    image: "/images/fff.webp",
    href: "/engagement-rings",
    active: true,
  },
  {
    title: "Earrings",
    image: "/images/ggg.webp",
    href: null,
    active: false,
  },
  {
    title: "Necklaces",
    image: "/images/dddd.webp",
    href: null,
    active: false,
  },
  {
    title: "Bracelets",
    image: "/images/sddd.webp",
    href: null,
    active: false,
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
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);
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
        const response = await fetch(`${API_BASE_URL}/products/category/engagement-rings?sort=sort_order&order=asc&limit=20`);
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
          setRingProducts(transformedProducts.slice(0, 20));
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
          <Link
            to="/engagement-rings"
            className="inline-flex items-center justify-center h-11 sm:h-12 md:h-[52px] px-8 md:px-12 bg-white bg-opacity-95 hover:bg-opacity-100 hover:scale-105 transition-all duration-300 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}
          >
            <span className="text-[10px] sm:text-[11px] md:text-[12px] font-light tracking-[2px] md:tracking-[2.5px] text-gray-900 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Discover Our Engagement Rings
            </span>
          </Link>
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
              <ScrollReveal key={index} delay={index * 100} direction="up">
                {category.active ? (
                  <Link
                    to={category.href!}
                    className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 block"
                    style={{ height: '430px' }}
                  >
                    <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                      <h3 className="text-xl font-serif font-light text-white mb-2 tracking-wide">{category.title}</h3>
                      <div className="w-12 h-px bg-white/60 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </Link>
                ) : (
                  <div
                    className="group relative overflow-hidden shadow-lg block cursor-default"
                    style={{ height: '430px' }}
                  >
                    <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover" />
                    {/* Frosted overlay for coming soon */}
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                      <h3 className="text-xl font-serif font-light text-white mb-3 tracking-wide">{category.title}</h3>
                      <div className="w-8 h-px bg-white/50 mx-auto mb-3" />
                      <span className="text-[10px] font-inter font-light tracking-[0.3em] uppercase text-white/70">Coming Soon</span>
                    </div>
                  </div>
                )}
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Mobile Horizontal Scroll Layout */}
        <div className="lg:hidden">
          <div ref={scrollRef} className="flex overflow-x-auto px-6 gap-4 scrollbar-hide pb-6">
            {jewelryCategories.map((category, index) =>
              category.active ? (
                <Link
                  key={index}
                  to={category.href!}
                  className="group relative flex-shrink-0 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500"
                  style={{ width: '280px', height: '375px' }}
                >
                  <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
                    <h3 className="text-lg font-serif font-light text-white mb-2 tracking-wide">{category.title}</h3>
                    <div className="w-12 h-px bg-white/60 mx-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
              ) : (
                <div
                  key={index}
                  className="group relative flex-shrink-0 overflow-hidden shadow-lg cursor-default"
                  style={{ width: '280px', height: '375px' }}
                >
                  <img src={category.image} alt={category.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                    <h3 className="text-lg font-serif font-light text-white mb-3 tracking-wide">{category.title}</h3>
                    <div className="w-8 h-px bg-white/50 mx-auto mb-3" />
                    <span className="text-[10px] font-inter font-light tracking-[0.3em] uppercase text-white/70">Coming Soon</span>
                  </div>
                </div>
              )
            )}
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

      {/* Latest Designs & Engagement Rings — editorial two-column */}
      <section className="bg-white">

        {/* ── Desktop ── */}
        <div className="hidden lg:block py-16 xl:py-24">
          <div className="max-w-[1400px] mx-auto px-8">
            {/* Thin divider line centered between columns */}
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-500 -translate-x-1/2 z-10" />
              <div className="grid grid-cols-2 gap-20 xl:gap-24">

                {/* Left — Latest Designs: text top, image below */}
                <ScrollReveal direction="left" duration={800}>
                  <div className="flex flex-col">
                    <div className="mb-6">
                      <h2 className="text-[1.875rem] xl:text-[2.25rem] font-cormorant font-light text-gray-900 mb-2 leading-tight">
                        Latest Designs
                      </h2>
                      <p className="text-[12px] font-inter font-light text-gray-500 mb-4 leading-relaxed">
                        Explore the latest jewellery designs and collections
                      </p>
                      <Link
                        to="/rings"
                        className="inline-flex items-center gap-2 text-[10px] font-inter font-light tracking-[0.2em] uppercase text-gray-900 hover:text-gray-400 transition-colors duration-300 group"
                      >
                        <span>Discover More</span>
                        <svg className="w-2.5 h-2.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                    <div className="overflow-hidden" style={{ width: '100%', maxWidth: '576px', height: '720px' }}>
                      <img
                        src="/images/latest-designs.jpg"
                        alt="Latest Jewelry Designs"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop";
                        }}
                      />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Right — Engagement Rings: image top, text below */}
                <ScrollReveal direction="right" duration={800} delay={100}>
                  <div className="flex flex-col">
                    <div className="overflow-hidden mb-6" style={{ width: '100%', maxWidth: '576px', height: '720px' }}>
                      <img
                        src="/images/engagement-rings.jpg"
                        alt="Engagement Rings Collection"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=600&fit=crop";
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-[1.875rem] xl:text-[2.25rem] font-cormorant font-light text-gray-900 mb-2 leading-tight">
                        Engagement Rings
                      </h2>
                      <p className="text-[12px] font-inter font-light text-gray-500 mb-4 leading-relaxed">
                        Start your love story in style with an iconic McCulloch ring
                      </p>
                      <Link
                        to="/engagement-rings"
                        className="inline-flex items-center gap-2 text-[10px] font-inter font-light tracking-[0.2em] uppercase text-gray-900 hover:text-gray-400 transition-colors duration-300 group"
                      >
                        <span>Discover More</span>
                        <svg className="w-2.5 h-2.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>

              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile ── stacked, text above image */}
        <div className="lg:hidden">

          {/* Latest Designs */}
          <ScrollReveal direction="up">
            <div>
              <div className="px-6 pt-14 pb-8">
                <p className="text-[10px] font-inter font-light tracking-[0.4em] uppercase text-gray-400 mb-3">Collection</p>
                <h2 className="text-3xl font-cormorant font-light text-gray-900 mb-4 leading-tight">
                  Latest Designs
                </h2>
                <p className="text-sm font-inter font-light text-gray-500 mb-6 leading-relaxed">
                  Explore the latest jewellery designs and collections
                </p>
                <Link
                  to="/rings"
                  className="inline-flex items-center gap-2 text-[11px] font-inter font-light tracking-[0.25em] uppercase text-gray-900 hover:text-gray-400 transition-colors duration-300 group"
                >
                  <span>Discover More</span>
                  <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <img
                src="/images/latest-designs.jpg"
                alt="Latest Jewelry Designs"
                className="w-full object-cover"
                style={{ height: '70vw' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop";
                }}
              />
            </div>
          </ScrollReveal>

          {/* Engagement Rings */}
          <ScrollReveal direction="up" delay={100}>
            <div className="mt-2">
              <div className="px-6 pt-14 pb-8">
                <p className="text-[10px] font-inter font-light tracking-[0.4em] uppercase text-gray-400 mb-3">Our Focus</p>
                <h2 className="text-3xl font-cormorant font-light text-gray-900 mb-4 leading-tight">
                  Engagement Rings
                </h2>
                <p className="text-sm font-inter font-light text-gray-500 mb-6 leading-relaxed">
                  Start your love story in style with an iconic McCulloch ring
                </p>
                <Link
                  to="/engagement-rings"
                  className="inline-flex items-center gap-2 text-[11px] font-inter font-light tracking-[0.25em] uppercase text-gray-900 hover:text-gray-400 transition-colors duration-300 group"
                >
                  <span>Discover More</span>
                  <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <img
                src="/images/engagement-rings.jpg"
                alt="Engagement Rings Collection"
                className="w-full object-cover"
                style={{ height: '70vw' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=600&fit=crop";
                }}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Product Carousel Section */}
      <section className="bg-white pt-14 pb-12 lg:pt-16 lg:pb-16">

        {/* ── Tab navigation (matches reference screenshot) ── */}
        <div className="px-6 lg:px-8 mb-10">
          <div className="flex items-end justify-between">
            {/* Tabs */}
            <div className="flex items-end gap-0">
              {/* RINGS — active */}
              <button className="relative pb-3 text-[11px] font-inter font-normal tracking-[0.25em] uppercase text-gray-900 transition-colors duration-200">
                Rings
                <span className="absolute bottom-0 left-0 right-0 h-px bg-gray-900" />
              </button>
            </div>

            {/* Right: View All + Arrows */}
            <div className="flex items-center gap-3 pb-3">
              <Link
                to="/engagement-rings"
                className="hidden lg:inline text-[10px] font-inter font-light uppercase tracking-[0.25em] text-gray-400 hover:text-gray-900 transition-colors duration-300 mr-2"
              >
                View All
              </Link>
              <button
                onClick={handlePrevious}
                disabled={currentProductIndex === 0}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${
                  currentProductIndex === 0
                    ? 'border-gray-200 cursor-not-allowed'
                    : 'border-gray-300 hover:border-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className={`w-3 h-3 ${currentProductIndex === 0 ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="w-8 h-8 rounded-full border border-gray-300 hover:border-gray-600 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          {/* Full-width rule below tabs */}
          <div className="w-full h-px bg-gray-100 -mt-px" />
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
                    className="w-full bg-[#f0f0f0] overflow-hidden flex items-center justify-center"
                    style={{ aspectRatio: '1 / 1' }}
                  >
                    {product.image?.url ? (
                      <img
                        src={getMediaUrl(product.image.url)}
                        alt={product.image.alt || product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="text-xs font-cormorant text-gray-400 text-center px-2">{product.name}</span>
                    )}
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

        {/* Desktop: thin progress line at bottom */}
        <div className="hidden lg:block px-8 mt-8">
          <div className="w-full h-px bg-gray-100">
            <div
              className="h-px bg-gray-800 transition-all duration-500"
              style={{ width: ringProducts.length > 1 ? `${((currentProductIndex + 1) / ringProducts.length) * 100}%` : '100%' }}
            />
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
                      className="w-full bg-[#f5f5f5] overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: '4/3' }}
                    >
                      {product.image?.url ? (
                        <img
                          src={getMediaUrl(product.image.url)}
                          alt={product.image.alt || product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <span className="text-sm font-cormorant text-gray-400">{product.name}</span>
                      )}
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

          {/* Mobile progress line */}
          <div className="mx-6 mt-6 h-px bg-gray-100">
            <div
              className="h-px bg-gray-800 transition-all duration-500"
              style={{ width: ringProducts.length > 1 ? `${((mobileCarouselIndex + 1) / ringProducts.length) * 100}%` : '100%' }}
            />
          </div>

          {/* View All */}
          <div className="flex justify-center mt-6">
            <Link
              to="/engagement-rings"
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
