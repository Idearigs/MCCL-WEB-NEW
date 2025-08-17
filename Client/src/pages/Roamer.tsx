import React from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigation from "../components/LuxuryNavigation";

const Roamer = (): JSX.Element => {
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

      {/* Brand Story Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-light text-gray-900 mb-6">Heritage & Innovation</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              For over 130 years, Roamer has been synonymous with Swiss watchmaking excellence. 
              Founded in 1888, Roamer combines traditional Swiss craftsmanship with innovative 
              design to create timepieces that embody precision and elegance.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our collaboration with McCulloch Jewellers brings you the finest selection of 
              Roamer watches, each piece representing the pinnacle of Swiss horological artistry.
            </p>
          </div>
          <div className="bg-gray-100 h-80 rounded flex items-center justify-center">
            <span className="text-gray-500">Roamer Collection Image</span>
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

      {/* Collection Showcase */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-light text-center text-gray-900 mb-12">Featured Collection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-gray-100 h-64 rounded mb-4 flex items-center justify-center">
              <span className="text-gray-500">Roamer Watch 1</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900">Classic Collection</h4>
            <p className="text-gray-600">From £450</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 h-64 rounded mb-4 flex items-center justify-center">
              <span className="text-gray-500">Roamer Watch 2</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900">Sport Collection</h4>
            <p className="text-gray-600">From £650</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 h-64 rounded mb-4 flex items-center justify-center">
              <span className="text-gray-500">Roamer Watch 3</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900">Dress Collection</h4>
            <p className="text-gray-600">From £850</p>
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default Roamer;