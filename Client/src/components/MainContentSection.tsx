
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import WatchBrandsShowcase from "./WatchBrandsShowcase";

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

const productCarouselData = [
  {
    id: "ashoka-five-stone-platinum-diamond-eternity-ring",
    name: "Ashoka Five Stone Half Platinum Diamond Eternity Ring",
    image: "/images/12045CFRDOP_450x.webp"
  },
  {
    id: "classic-evermore-half-hoop-platinum-diamond-eternity-ring",
    name: "Classic Evermore Half Hoop Platinum Diamond Eternity Ring", 
    image: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop"
  },
  {
    id: "national-gallery-play-of-light-chelsea-flower-show-ng200-ring",
    name: "The National Gallery Play of Light Chelsea Flower Show NG200 Ring",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop"
  },
  {
    id: "blossom-triple-rose-gold-diamond-ring",
    name: "Blossom Triple Rose Gold Diamond Ring",
    image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop"
  }
];


export default function MainContentSection(): JSX.Element {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileCarouselIndex, setMobileCarouselIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('Rings');
  const scrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

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
      setMobileCarouselIndex(Math.min(index, productCarouselData.length - 1));
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
        <div className="relative flex flex-col items-center md:items-start justify-end pb-24 h-full text-center md:text-left text-white px-4 md:pl-32 md:pr-16 max-w-none w-full">
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
            className="h-[45px] md:h-[50px] w-[240px] md:w-[280px] bg-white bg-opacity-95 border-0 text-gray-900 hover:bg-white hover:bg-opacity-100 transition-all duration-300 font-normal tracking-wider uppercase opacity-0 animate-fade-in-up"
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
            
            <div className="px-6 lg:px-0 mx-5 lg:mx-0">
              <h2 className="text-2xl font-serif font-normal text-gray-900 mb-4 tracking-normal leading-tight">
                Engagement Rings
              </h2>
              <p className="text-sm font-cormorant font-normal text-gray-700 mb-6 leading-relaxed">
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
      </section>

      {/* Product Carousel Section */}
      <section className="bg-white py-20 lg:py-24">
        <div className="max-w-full px-0">
          {/* Desktop Category Tabs */}
          <div className="hidden lg:flex items-center justify-between mb-12 px-6 lg:px-16">
            <div className="flex space-x-12">
              <button className="text-xs font-serif font-medium text-gray-900 uppercase tracking-[0.15em] border-b border-gray-900 pb-2 relative">
                Rings
              </button>
              <button className="text-xs font-serif font-medium text-gray-500 uppercase tracking-[0.15em] hover:text-gray-900 transition-colors duration-300 pb-2">
                Earrings
              </button>
              <button className="text-xs font-serif font-medium text-gray-500 uppercase tracking-[0.15em] hover:text-gray-900 transition-colors duration-300 pb-2">
                Necklaces
              </button>
              <button className="text-xs font-serif font-medium text-gray-500 uppercase tracking-[0.15em] hover:text-gray-900 transition-colors duration-300 pb-2">
                Bracelets
              </button>
            </div>
            
            {/* Navigation Arrows */}
            <div className="flex space-x-3">
              <button className="w-10 h-10 border border-gray-300 hover:border-gray-500 transition-colors duration-300 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-10 h-10 border border-gray-300 hover:border-gray-500 transition-colors duration-300 flex items-center justify-center">
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
                  className={`text-[13px] font-cormorant font-medium uppercase transition-colors duration-300 pb-2 relative ${
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
          <div className="hidden lg:block overflow-x-auto scrollbar-hide px-6 lg:px-16">
            <div className="flex space-x-8 pb-8">
              {/* Product Cards */}
              {[
                {
                  name: "Ashoka Five Stone Half Platinum Diamond Eternity Ring",
                  image: "/images/12045CFRDOP_450x.webp"
                },
                {
                  name: "Classic Evermore Half Hoop Platinum Diamond Eternity Ring",
                  image: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop"
                },
                {
                  name: "The National Gallery Play of Light Chelsea Flower Show NG200 Ring",
                  image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop"
                },
                {
                  name: "Blossom Triple Rose Gold Diamond Ring",
                  image: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop"
                },
                {
                  name: "Beach Yellow Gold Diamond Ring",
                  image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop"
                },
                {
                  name: "Florentine Dolce Vita Cushion Aquamarine French Yellow Gold Ring",
                  image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&h=400&fit=crop"
                }
              ].map((product, index) => (
                <Link 
                  key={index}
                  to={`/product/${product.id || 'ashoka-five-stone-platinum-diamond-eternity-ring'}`}
                  className="flex-shrink-0 group cursor-pointer block"
                  style={{ width: '320px', minHeight: '520px' }}
                >
                  <div className="relative mb-8 bg-white">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-[28rem] object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-base font-cormorant font-normal text-gray-900 leading-7 px-2 mt-6">
                    {product.name}
                  </h3>
                </Link>
              ))}
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
                  {productCarouselData.map((product, index) => (
                    <Link 
                      key={index}
                      to={`/product/${product.id}`}
                      className="flex-shrink-0 group cursor-pointer block" 
                      style={{ 
                        width: '200px',
                        scrollSnapAlign: 'start'
                      }}
                    >
                      <div className="relative mb-6 bg-white p-6 shadow-sm rounded-lg transition-transform duration-300 group-hover:scale-[1.02]">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-72 object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <h3 className="text-sm font-cormorant font-normal text-gray-900 leading-6 text-left">
                        {product.name}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Mobile Reactive Scroll Indicator */}
            <div className="flex justify-center">
              <div className="flex space-x-2">
                {productCarouselData.map((_, index) => (
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
              <div className="w-8 h-0.5 bg-gray-900"></div>
              <div className="w-4 h-0.5 bg-gray-300"></div>
              <div className="w-4 h-0.5 bg-gray-300"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Watch Brands Showcase Section */}
      <WatchBrandsShowcase />
      
       
    </main>

    
  );
}
