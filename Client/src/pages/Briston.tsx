import React from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigation from "../components/LuxuryNavigation";

const Briston = (): JSX.Element => {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigation />
      
      {/* Hero Section */}
      <div className="relative h-screen bg-black overflow-hidden">
        {/* Watch Background Video */}
        <video 
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/images/watch.mp4" type="video/mp4" />
        </video>
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-12 lg:px-16">
          <div className="max-w-xl">
            <h1 className="text-6xl md:text-7xl font-light text-white mb-6 tracking-wide">
              Briston
            </h1>
            <p className="text-xl md:text-2xl text-white font-light mb-8 leading-relaxed">
              French Elegance & British Spirit
            </p>
            <button className="inline-flex items-center px-8 py-3 border border-white text-white hover:bg-white hover:text-black transition-all duration-300 font-medium tracking-wide">
              BROWSE ALL WATCHES
            </button>
          </div>
        </div>
      </div>

      {/* Brand Story Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-light text-gray-900 mb-6">A Modern Classic</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Briston represents the perfect fusion of French sophistication and British heritage. 
              Founded with a vision to create contemporary timepieces that honor classic design 
              principles, Briston watches embody effortless elegance and refined craftsmanship.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our exclusive partnership with McCulloch Jewellers brings you the complete Briston 
              collection, featuring innovative materials and distinctive design elements that set 
              these timepieces apart.
            </p>
          </div>
          <div className="bg-gray-100 h-80 rounded flex items-center justify-center">
            <span className="text-gray-500">Briston Collection Image</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-2xl font-light text-center text-gray-900 mb-12">Briston Excellence</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">I</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Innovative Materials</h4>
              <p className="text-gray-600">Unique materials like acetate and premium textiles</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Distinctive Design</h4>
              <p className="text-gray-600">Recognizable aesthetic with contemporary flair</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Versatile Style</h4>
              <p className="text-gray-600">Perfect for both casual and formal occasions</p>
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
              <span className="text-gray-500">Briston Watch 1</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900">Clubmaster Collection</h4>
            <p className="text-gray-600">From £320</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 h-64 rounded mb-4 flex items-center justify-center">
              <span className="text-gray-500">Briston Watch 2</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900">Streamliner Collection</h4>
            <p className="text-gray-600">From £280</p>
          </div>
          <div className="text-center">
            <div className="bg-gray-100 h-64 rounded mb-4 flex items-center justify-center">
              <span className="text-gray-500">Briston Watch 3</span>
            </div>
            <h4 className="text-lg font-medium text-gray-900">Chic Collection</h4>
            <p className="text-gray-600">From £220</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-blue-900 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl font-light text-white mb-6">Discover Briston at McCulloch Jewellers</h3>
          <p className="text-xl text-blue-100 mb-8">
            Experience the perfect blend of French elegance and British heritage
          </p>
          <button className="bg-white text-blue-900 px-8 py-3 rounded hover:bg-gray-100 transition-colors font-medium">
            View Collection
          </button>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default Briston;