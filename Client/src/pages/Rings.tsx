import React, { useState } from "react";
import { FooterSection } from "../components/FooterSection";
import StaticNavigation from "../components/StaticNavigation";

const Rings = (): JSX.Element => {
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('rings');

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

  // Ring-specific filter options
  const filterOptions = {
    price: [
      'Under £500',
      '£500 - £1,000',
      '£1,000 - £2,500',
      '£2,500 - £5,000',
      '£5,000 - £10,000',
      'Above £10,000'
    ],
    ringType: [
      'Engagement Rings',
      'Wedding Rings',
      'Eternity Rings',
      'Cocktail Rings',
      'Statement Rings',
      'Signet Rings',
      'Anniversary Rings'
    ],
    gemstones: [
      'Diamond',
      'Ruby',
      'Sapphire',
      'Emerald',
      'Pearl',
      'Aquamarine',
      'Tanzanite',
      'Opal'
    ],
    metals: [
      'Platinum',
      'White Gold',
      'Yellow Gold',
      'Rose Gold',
      'Sterling Silver',
      'Palladium'
    ],
    setting: [
      'Solitaire',
      'Halo',
      'Three Stone',
      'Vintage',
      'Modern',
      'Art Deco',
      'Cluster'
    ]
  };

  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <StaticNavigation />
      
      {/* Main Rings Content */}
      <main className="flex-1 pt-32 lg:pt-44 pb-8">
        <div className="w-full px-4 lg:px-[40px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-3 lg:mb-8">
            <div className="flex items-center text-sm text-gray-500 font-light">
              <span className="hover:text-gray-700 cursor-pointer">Home</span>
              <span className="mx-2">→</span>
              <span className="hover:text-gray-700 cursor-pointer">Jewellery</span>
              <span className="mx-2">→</span>
              <span className="text-gray-900">Rings</span>
            </div>
          </nav>

          {/* Page Title and Description */}
          <div className="mb-10 lg:mb-12">
            <h1 className="text-3xl lg:text-5xl font-normal text-gray-900 mb-4 lg:mb-6 font-cormorant">
              Rings
            </h1>
            <div className="max-w-2xl">
              <p className="text-base lg:text-base text-gray-700 leading-relaxed mb-4 lg:mb-4 font-cormorant">
                Discover our exquisite collection of rings, from timeless engagement rings to stunning 
                statement pieces. Each ring is meticulously crafted with the finest gemstones and precious 
                metals, representing love, commitment, and personal style with unparalleled elegance.
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
                  onClick={() => setSelectedCategory('rings')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'rings' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Rings
                </button>
                <button 
                  onClick={() => setSelectedCategory('engagement')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'engagement' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Engagement Rings
                </button>
                <button 
                  onClick={() => setSelectedCategory('cocktail')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'cocktail' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Cocktail Rings
                </button>
                <button 
                  onClick={() => setSelectedCategory('high-jewellery')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'high-jewellery' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  High Jewellery
                </button>
                <button 
                  onClick={() => setSelectedCategory('wedding')}
                  className={`flex-shrink-0 text-sm font-inter uppercase tracking-wider whitespace-nowrap transition-colors ${
                    selectedCategory === 'wedding' 
                      ? 'font-medium text-gray-900' 
                      : 'font-light text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Wedding Rings
                </button>
              </div>
            </div>

            {/* Desktop Filter Bar - Original Layout */}
            <div className="hidden lg:flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 text-sm font-inter relative">
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

                {/* Ring Type Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('ringType')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'ringType' ? 'text-gray-900' : ''
                    }`}
                  >
                    Ring Type
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'ringType' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'ringType' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Ring Type</h3>
                        <div className="space-y-3">
                          {filterOptions.ringType.map((option, index) => (
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

                {/* Gemstones Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('gemstones')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'gemstones' ? 'text-gray-900' : ''
                    }`}
                  >
                    Gemstones
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'gemstones' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'gemstones' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Gemstones</h3>
                        <div className="space-y-3">
                          {filterOptions.gemstones.map((option, index) => (
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

                {/* Metals Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('metals')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'metals' ? 'text-gray-900' : ''
                    }`}
                  >
                    Metals
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'metals' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'metals' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Metals</h3>
                        <div className="space-y-3">
                          {filterOptions.metals.map((option, index) => (
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

                {/* Setting Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('setting')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'setting' ? 'text-gray-900' : ''
                    }`}
                  >
                    Setting
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'setting' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'setting' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Setting Style</h3>
                        <div className="space-y-3">
                          {filterOptions.setting.map((option, index) => (
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
                  <option>Newest</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Ring Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-16">
            {/* Ring Product 1 */}
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
                <img 
                  src="/images/Engagement.png" 
                  alt="Diamond Solitaire Engagement Ring"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                
                {/* Hover Image */}
                <img 
                  src="/images/Wedding.jpg" 
                  alt="Diamond Solitaire Engagement Ring - Alternative View"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {/* Arrow Icon */}
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  
                  {/* Add to Bag Button */}
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ADD TO BAG
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Diamond Solitaire Engagement Ring</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£3,500</p>
                <p className="text-sm text-gray-500 font-cormorant">Platinum Setting</p>
              </div>
            </div>

            {/* Ring Product 2 */}
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
                {/* Default Image */}
                <img 
                  src="/images/Wedding.jpg" 
                  alt="Vintage Rose Gold Wedding Band"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                
                {/* Hover Image */}
                <img 
                  src="/images/Diamonds.jpg" 
                  alt="Vintage Rose Gold Wedding Band - Alternative View"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {/* Arrow Icon */}
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  
                  {/* Add to Bag Button */}
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ADD TO BAG
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Vintage Rose Gold Wedding Band</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£1,250</p>
                <p className="text-sm text-gray-500 font-cormorant">18ct Rose Gold</p>
              </div>
            </div>

            {/* Ring Product 3 */}
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
                {/* Default Image */}
                <img 
                  src="/images/Diamonds.jpg" 
                  alt="Sapphire Halo Cocktail Ring"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                
                {/* Hover Image */}
                <img 
                  src="/images/Jewellery.jpg" 
                  alt="Sapphire Halo Cocktail Ring - Alternative View"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {/* Arrow Icon */}
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  
                  {/* Add to Bag Button */}
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ADD TO BAG
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Sapphire Halo Cocktail Ring</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£2,800</p>
                <p className="text-sm text-gray-500 font-cormorant">White Gold & Sapphire</p>
              </div>
            </div>

            {/* Ring Product 4 */}
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
                {/* Default Image */}
                <img 
                  src="/images/Jewellery.jpg" 
                  alt="Diamond Eternity Ring"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                
                {/* Hover Image */}
                <img 
                  src="/images/Engagement.png" 
                  alt="Diamond Eternity Ring - Alternative View"
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {/* Arrow Icon */}
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                  
                  {/* Add to Bag Button */}
                  <button className="w-full bg-white/95 backdrop-blur-sm text-gray-700 hover:text-white hover:bg-black py-3 px-4 font-inter font-light text-sm tracking-wider uppercase transition-all duration-200 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                    ADD TO BAG
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Diamond Eternity Ring</h3>
                <p className="text-lg font-cormorant font-medium text-gray-600">£4,200</p>
                <p className="text-sm text-gray-500 font-cormorant">Platinum & Diamonds</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gray-50 rounded-lg p-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4 font-cormorant">
              Find Your Perfect Ring
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-cormorant">
              Our expert jewellers are here to help you discover the ring of your dreams, whether it's for an engagement, wedding, or special occasion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gray-900 text-white px-8 py-3 hover:bg-gray-800 transition-colors font-medium">
                Book Consultation
              </button>
              <button className="border border-gray-300 text-gray-700 px-8 py-3 hover:border-gray-400 hover:text-gray-900 transition-colors font-medium">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <FooterSection />
    </div>
  );
};

export default Rings;