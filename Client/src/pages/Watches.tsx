
import React, { useState } from "react";
import { FooterSection } from "../components/FooterSection";
import LuxuryNavigationWhite from "../components/LuxuryNavigationWhite";

const Watches = (): JSX.Element => {
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('watches');

  const toggleLike = (productId: number) => {
    setLikedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleFilter = (filterName: string) => {
    setActiveFilter(activeFilter === filterName ? null : filterName);
  };

  // Watch-specific filter options
  const filterOptions = {
    brand: [
      'Festina',
      'Roamer',
      'Briston'
    ],
    collection: [
      'Chronograph',
      'Classic',
      'Sport',
      'Ladies',
      'Limited Edition',
      'Heritage'
    ],
    movement: [
      'Quartz',
      'Automatic',
      'Manual',
      'Chronometer'
    ],
    materials: [
      'Stainless Steel',
      'Gold Plated',
      'Titanium',
      'Ceramic',
      'Leather Strap',
      'Metal Bracelet'
    ],
    features: [
      'Chronograph',
      'Date Display',
      'Water Resistant',
      'Luminous Hands',
      'Sapphire Crystal',
      'Anti-Magnetic'
    ],
    price: [
      'Under £200',
      '£200 - £500',
      '£500 - £1,000',
      '£1,000 - £2,000',
      '£2,000 - £5,000',
      'Above £5,000'
    ]
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <LuxuryNavigationWhite />
      
      {/* Main Watch Products Content */}
      <main className="flex-1 pt-32 lg:pt-44 pb-8">
        <div className="w-full px-4 lg:px-[40px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 lg:mb-8">
            <div className="flex items-center text-sm text-gray-500 font-light">
              <span className="hover:text-gray-700 cursor-pointer">Home</span>
              <span className="mx-2">→</span>
              <span className="text-gray-900">Watches</span>
            </div>
          </nav>

          {/* Page Title and Description */}
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl lg:text-5xl font-normal text-gray-900 mb-4 lg:mb-6 font-cormorant">
              Luxury Timepieces
            </h1>
            <div className="max-w-2xl">
              <p className="text-base lg:text-base text-gray-700 leading-relaxed mb-4 lg:mb-4 font-cormorant">
                Discover our exquisite collection of luxury watches from renowned brands including Festina, 
                Roamer, and Briston. Each timepiece represents the pinnacle of Swiss and European 
                craftsmanship, combining traditional techniques with contemporary design.
              </p>
              <button className="text-gray-600 hover:text-gray-900 text-sm italic underline font-cormorant">
                Read More
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 lg:mb-8 pb-4 lg:pb-6 border-b border-gray-200 relative">
            {/* Mobile Filter Bar - Horizontal Scroll */}
            <div className="lg:hidden">
              <div className="flex overflow-x-auto gap-6 pb-2 scrollbar-hide">
                <button 
                  onClick={() => setSelectedCategory('watches')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'watches' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Watches
                </button>
                <button 
                  onClick={() => setSelectedCategory('festina')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'festina' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Festina
                </button>
                <button 
                  onClick={() => setSelectedCategory('briston')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'briston' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Briston
                </button>
                <button 
                  onClick={() => setSelectedCategory('roamer')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'roamer' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Roamer
                </button>
                <button 
                  onClick={() => setSelectedCategory('chronograph')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'chronograph' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Chronograph
                </button>
              </div>
            </div>

            {/* Desktop Filter Bar - Original Layout */}
            <div className="hidden lg:flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm font-inter relative">
                {/* Brand Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('brand')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'brand' ? 'text-gray-900' : ''
                    }`}
                  >
                    Brand
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'brand' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'brand' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Brand</h3>
                        <div className="space-y-3">
                          {filterOptions.brand.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors" 
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collection Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('collection')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'collection' ? 'text-gray-900' : ''
                    }`}
                  >
                    Collection
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'collection' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'collection' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Collection</h3>
                        <div className="space-y-3">
                          {filterOptions.collection.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors" 
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Movement Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('movement')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'movement' ? 'text-gray-900' : ''
                    }`}
                  >
                    Movement
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'movement' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'movement' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Movement</h3>
                        <div className="space-y-3">
                          {filterOptions.movement.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors" 
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Materials Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('materials')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'materials' ? 'text-gray-900' : ''
                    }`}
                  >
                    Materials
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'materials' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'materials' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Materials</h3>
                        <div className="space-y-3">
                          {filterOptions.materials.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors" 
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Features Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('features')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'features' ? 'text-gray-900' : ''
                    }`}
                  >
                    Features
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'features' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'features' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Features</h3>
                        <div className="space-y-3">
                          {filterOptions.features.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors" 
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('price')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'price' ? 'text-gray-900' : ''
                    }`}
                  >
                    Price
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'price' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'price' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Price Range</h3>
                        <div className="space-y-3">
                          {filterOptions.price.map((option, index) => (
                            <label key={index} className="flex items-center group cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="w-3 h-3 border border-gray-300 rounded-none bg-white checked:bg-gray-900 checked:border-gray-900 transition-colors" 
                              />
                              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 font-inter font-light transition-colors">
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="text-xs text-gray-600 hover:text-gray-900 uppercase tracking-wider font-inter font-light transition-colors"
                          >
                            Clear
                          </button>
                          <button 
                            onClick={() => setActiveFilter(null)}
                            className="bg-gray-900 text-white px-4 py-2 text-xs uppercase tracking-wider font-inter font-light hover:bg-gray-800 transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button className="text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light">More Filters +</button>
              </div>
              <div className="flex items-center gap-2 text-sm font-inter">
                <span className="text-gray-600 uppercase tracking-wider font-light">Sort By:</span>
                <select className="text-gray-900 bg-transparent border-none font-inter font-normal uppercase tracking-wider focus:outline-none">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Brand A-Z</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Watch Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
            {/* Watch Product 1 - Festina */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button 
                  onClick={() => toggleLike(1)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has(1) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                
                {/* Default Image */}
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <svg className="w-16 h-16 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                {/* Hover Image */}
                <div className="absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {/* Arrow Icon */}
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  
                  {/* Enquire Button */}
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ENQUIRE
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Festina Chronograph F20374/3</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£285</p>
                <p className="text-sm text-gray-500 font-cormorant">Sport Collection</p>
              </div>
            </div>

            {/* Watch Product 2 - Roamer */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button 
                  onClick={() => toggleLike(2)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has(2) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <svg className="w-16 h-16 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                <div className="absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ENQUIRE
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Roamer Swiss Made Superior 3H</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£425</p>
                <p className="text-sm text-gray-500 font-cormorant">Swiss Made Collection</p>
              </div>
            </div>

            {/* Watch Product 3 - Briston */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button 
                  onClick={() => toggleLike(3)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has(3) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <svg className="w-16 h-16 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                <div className="absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ENQUIRE
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Briston Clubmaster Classic</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£195</p>
                <p className="text-sm text-gray-500 font-cormorant">Classic Collection</p>
              </div>
            </div>

            {/* Watch Product 4 - Festina Ladies */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-2 lg:mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button 
                  onClick={() => toggleLike(4)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has(4) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <svg className="w-16 h-16 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                <div className="absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ENQUIRE
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Festina Ladies F20234/2</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£165</p>
                <p className="text-sm text-gray-500 font-cormorant">Ladies Collection</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gray-50 rounded-lg p-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4 font-cormorant">
              Expert Watch Consultation
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-cormorant">
              Our certified horologists are here to guide you through our luxury timepiece collections and help you find the perfect watch for your lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-900 text-white px-8 py-3 hover:bg-gray-800 transition-colors font-medium">
                Book Consultation
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 hover:border-gray-400 hover:text-gray-900 transition-colors font-medium">
                Contact Expert
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <FooterSection />
    </div>
  );
};

export default Watches;
