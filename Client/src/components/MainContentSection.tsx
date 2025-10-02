
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import WatchBrandsShowcase from "./WatchBrandsShowcase";
import AddToCartButton from "./AddToCartButton";

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

const allProductsData = {
  'Rings': [] as Product[], // Will be populated from API
  'Earrings': [
    {
      id: "diamond-drop-earrings",
      name: "Classic Diamond Drop Earrings",
      image: "/images/prod1.png"
    },
    {
      id: "pearl-stud-earrings",
      name: "Elegant Pearl Stud Earrings",
      image: "/images/prod2.png"
    },
    {
      id: "gold-hoop-earrings",
      name: "Rose Gold Hoop Earrings",
      image: "/images/prod3.png"
    },
    {
      id: "sapphire-cluster-earrings",
      name: "Sapphire Cluster Drop Earrings",
      image: "/images/prod4.png"
    }
  ],
  'Necklaces': [
    {
      id: "diamond-tennis-necklace",
      name: "Classic Diamond Tennis Necklace",
      image: "/images/prod2.png"
    },
    {
      id: "pearl-strand-necklace",
      name: "Cultured Pearl Strand Necklace",
      image: "/images/prod3.png"
    },
    {
      id: "emerald-pendant-necklace",
      name: "Emerald Pendant Gold Necklace",
      image: "/images/prod4.png"
    },
    {
      id: "vintage-locket-necklace",
      name: "Vintage Rose Gold Locket Necklace",
      image: "/images/prod5.png"
    }
  ],
  'Bracelets': [
    {
      id: "diamond-tennis-bracelet",
      name: "Classic Diamond Tennis Bracelet",
      image: "/images/prod3.png"
    },
    {
      id: "charm-bracelet",
      name: "Sterling Silver Charm Bracelet",
      image: "/images/prod4.png"
    },
    {
      id: "gold-bangle-set",
      name: "Rose Gold Bangle Set",
      image: "/images/prod5.png"
    },
    {
      id: "vintage-link-bracelet",
      name: "Vintage Chain Link Bracelet",
      image: "/images/prod1.png"
    }
  ]
};



export default function MainContentSection(): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileCarouselIndex, setMobileCarouselIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('Rings');
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [ringProducts, setRingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);

  // Get current products based on active filter
  const currentProducts = activeFilter === 'Rings' ? ringProducts : allProductsData[activeFilter as keyof typeof allProductsData] || ringProducts;

  // Fetch ring products from API
  useEffect(() => {
    const fetchRingProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/v1/products/category/rings');
        const data = await response.json();

        if (data.success) {
          // Transform API data to match the expected structure
          const transformedProducts: Product[] = data.data.products.map((product: any) => ({
            id: product.slug,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.image
          }));
          setRingProducts(transformedProducts.slice(0, 6)); // Limit to 6 products for carousel
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
        const cardWidth = 320 + 32; // card width + gap (space-x-8 = 32px)
        const containerWidth = container.clientWidth;
        const cardsVisible = Math.floor(containerWidth / cardWidth);
        const maxIndex = Math.max(0, currentProducts.length - cardsVisible);
        
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
  }, [currentProductIndex, currentProducts.length]);

  // Navigation arrow handlers
  const handlePrevious = () => {
    if (desktopScrollRef.current) {
      const container = desktopScrollRef.current;
      const cardWidth = 320 + 32;
      const newIndex = Math.max(0, currentProductIndex - 1);
      container.scrollTo({ left: newIndex * cardWidth, behavior: 'smooth' });
      setCurrentProductIndex(newIndex);
    }
  };

  const handleNext = () => {
    if (desktopScrollRef.current) {
      const container = desktopScrollRef.current;
      const cardWidth = 320 + 32;
      const containerWidth = container.clientWidth;
      const cardsVisible = Math.floor(containerWidth / cardWidth);
      const maxIndex = Math.max(0, currentProducts.length - cardsVisible);
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
      const cardWidth = 200 + 12; // card width + gap
      const scrollLeft = container.scrollLeft;
      const index = Math.round(scrollLeft / cardWidth);
      setMobileCarouselIndex(Math.min(index, currentProducts.length - 1));
    }
  };

  // Reset carousels when filter changes
  useEffect(() => {
    setMobileCarouselIndex(0);
    setCurrentProductIndex(0);
    if (mobileScrollRef.current) {
      mobileScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    if (desktopScrollRef.current) {
      desktopScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [activeFilter]);

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
      <section className="relative h-screen overflow-hidden">
        {/* Video Background */}
        <video
          className="absolute inset-0 w-full h-full object-cover object-center md:object-[center_30%]"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/no-grade.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative flex flex-col items-center justify-center h-full text-center text-white px-4 max-w-none w-full pt-16">
          <h1 
            className="text-[40px] md:text-[56px] leading-[48px] md:leading-[64px] mb-4 md:mb-6 max-w-[700px] opacity-0 animate-fade-in-up" 
            style={{ 
              fontFamily: 'Dancing Script, cursive', 
              fontWeight: 400,
              animationDelay: '0.5s',
              animationFillMode: 'forwards'
            }}
          >
            The Celestial Collection
          </h1>
          <p 
            className="text-[14px] md:text-[16px] leading-6 font-normal mb-6 md:mb-8 max-w-[500px] tracking-wide opacity-0 animate-fade-in-up" 
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
            className="h-[45px] md:h-[50px] w-[240px] md:w-[280px] bg-white bg-opacity-95 border-0 text-gray-900 hover:bg-white hover:bg-opacity-100 hover:scale-105 transition-all duration-300 font-normal tracking-wider uppercase opacity-0 animate-fade-in-up"
            style={{
              animationDelay: '1.1s',
              animationFillMode: 'forwards'
            }}
          >
            <span className="text-[11px] md:text-[12px] font-normal tracking-[1.5px]" style={{ fontFamily: 'Inter, sans-serif' }}>
              EXPLORE THE COLLECTION
            </span>
          </Button>
        </div>
      </section>

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
                  height: '400px'
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
                  height: '350px'
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
      <section className="bg-white py-20 lg:py-24">
        <div className="max-w-full px-0">
          {/* Desktop Category Tabs */}
          <div className="hidden lg:flex items-center justify-between mb-12 px-6 lg:px-16">
            <div className="flex space-x-12">
              {['Rings', 'Earrings', 'Necklaces', 'Bracelets'].map((filter) => (
                <button 
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setCurrentProductIndex(0); // Reset to beginning when changing filter
                  }}
                  className={`text-sm font-serif font-medium uppercase tracking-[0.15em] transition-colors duration-300 pb-2 relative ${
                    activeFilter === filter 
                      ? 'text-gray-900 border-b border-gray-900' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            <div className="flex space-x-3">
              <button 
                onClick={handlePrevious}
                disabled={currentProductIndex === 0}
                className={`w-10 h-10 border transition-colors duration-300 flex items-center justify-center ${
                  currentProductIndex === 0 
                    ? 'border-gray-200 cursor-not-allowed' 
                    : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                <svg className={`w-4 h-4 ${currentProductIndex === 0 ? 'text-gray-300' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={handleNext}
                className="w-10 h-10 border border-gray-300 hover:border-gray-500 transition-colors duration-300 flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Category Tabs - Functional with Larger Font */}
          <div className="lg:hidden mb-6 px-4">
            <div className="flex justify-center space-x-6">
              {['Rings', 'Earrings', 'Necklaces', 'Bracelets'].map((filter) => (
                <button 
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`text-[15px] font-cormorant font-medium uppercase transition-colors duration-300 pb-2 relative ${
                    activeFilter === filter 
                      ? 'text-gray-900 border-b border-gray-900' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Product Carousel */}
          <div 
            ref={desktopScrollRef}
            className="hidden lg:block overflow-x-auto scrollbar-hide px-6 lg:px-16"
          >
            <div className="flex space-x-8 pb-8 transition-all duration-300">
              {/* Product Cards */}
              {loading && activeFilter === 'Rings' ? (
                // Loading skeleton for rings
                Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="flex-shrink-0 animate-pulse"
                    style={{ width: '320px', minHeight: '520px' }}
                  >
                    <div className="bg-gray-200 h-[28rem] mb-8 rounded"></div>
                    <div className="bg-gray-200 h-6 rounded mb-2"></div>
                    <div className="bg-gray-200 h-4 w-3/4 rounded"></div>
                  </div>
                ))
              ) : (
                currentProducts.map((product, index) => (
                <Link 
                  key={`${activeFilter}-${index}`}
                  to={`/product/${product.slug || product.id}`}
                  className="flex-shrink-0 group cursor-pointer block"
                  style={{ width: '320px', minHeight: '520px' }}
                >
                  <div className="relative mb-8 bg-white group">
                    <img
                      src={product.image?.url || product.image || ''}
                      alt={product.image?.alt || product.name}
                      className="w-full h-[28rem] object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Add to Cart Button - appears on hover */}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6">
                      <AddToCartButton
                        product={{
                          id: product.id,
                          name: product.name,
                          image: product.image?.url || product.image || ''
                        }}
                        className="px-6 py-2"
                      />
                    </div>
                  </div>
                  <h3 className="text-base font-cormorant font-normal text-gray-900 leading-7 px-2 mt-6">
                    {product.name}
                  </h3>
                </Link>
                ))
              )}
            </div>
          </div>

          {/* Mobile Product Layout - Clean White Background with Proper Margin */}
          <div className="lg:hidden bg-white py-6">
            <div className="ml-6 mr-4">
              <div 
                ref={mobileScrollRef}
                className="overflow-x-auto scrollbar-hide mb-8"
                style={{ 
                  scrollSnapType: 'x mandatory',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                  {loading && activeFilter === 'Rings' ? (
                    // Loading skeleton for mobile rings
                    Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={`mobile-loading-${index}`}
                        className="flex-shrink-0 animate-pulse"
                        style={{ width: '200px', scrollSnapAlign: 'start' }}
                      >
                        <div className="bg-gray-200 h-72 mb-6 rounded-lg"></div>
                        <div className="bg-gray-200 h-4 rounded mb-2"></div>
                        <div className="bg-gray-200 h-3 w-3/4 rounded"></div>
                      </div>
                    ))
                  ) : (
                    currentProducts.map((product, index) => (
                    <Link 
                      key={index}
                      to={`/product/${product.slug || product.id}`}
                      className="flex-shrink-0 group cursor-pointer block" 
                      style={{ 
                        width: '200px',
                        scrollSnapAlign: 'start'
                      }}
                    >
                      <div className="relative mb-6 bg-white p-6 shadow-sm rounded-lg transition-transform duration-300 group-hover:scale-[1.02] group">
                        <img
                          src={product.image?.url || product.image || ''}
                          alt={product.image?.alt || product.name}
                          className="w-full h-72 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                        {/* Add to Cart Button - appears on mobile tap/hover */}
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 rounded-lg">
                          <AddToCartButton
                            product={{
                              id: product.id,
                              name: product.name,
                              image: product.image?.url || product.image || ''
                            }}
                            className="px-4 py-2 text-xs"
                          />
                        </div>
                      </div>
                      <h3 className="text-sm font-cormorant font-normal text-gray-900 leading-6 text-left">
                        {product.name}
                      </h3>
                    </Link>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Reactive Scroll Indicator */}
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {currentProducts.map((_, index) => (
                  <div
                    key={index}
                    className={`h-0.5 rounded-full transition-all duration-300 ${
                      index === mobileCarouselIndex ? 'w-8 bg-gray-900' : 'w-3 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Scroll Indicator */}
          <div className="hidden lg:flex justify-center mt-12">
            <div className="flex space-x-2">
              {currentProducts.slice(0, Math.min(currentProducts.length, 4)).map((_, index) => (
                <div
                  key={`${activeFilter}-indicator-${index}`}
                  className={`h-0.5 rounded-full transition-all duration-500 ease-in-out ${
                    index === currentProductIndex 
                      ? 'w-8 bg-gray-900' 
                      : 'w-4 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Watch Brands Showcase Section */}
      <WatchBrandsShowcase />
      
       
    </main>

    
  );
}
