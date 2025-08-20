import React, { useState } from "react";
import { FooterSection } from "../components/FooterSection";
import StaticNavigation from "../components/StaticNavigation";

const Products = (): JSX.Element => {
  const [likedProducts, setLikedProducts] = useState<Set<number>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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

  // Filter options data
  const filterOptions = {
    price: [
      'Under £500',
      '£500 - £1,000',
      '£1,000 - £2,500',
      '£2,500 - £5,000',
      '£5,000 - £10,000',
      'Above £10,000'
    ],
    productType: [
      'Rings',
      'Necklaces',
      'Earrings',
      'Bracelets',
      'Brooches',
      'Timepieces',
      'Bespoke Designs'
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
    collection: [
      'Heritage Collection',
      'Royal Collection',
      'Signature Collection',
      'Bespoke Collection',
      'Limited Edition',
      'Vintage Collection'
    ]
  };
  return (
    <div className="flex flex-col w-full bg-white min-h-screen">
      <StaticNavigation />
      
      {/* Main Products Content */}
      <main className="flex-1 pt-44 pb-8">
        <div className="w-full px-[40px]">
          {/* Breadcrumb Navigation */}
          <nav className="mb-8">
            <div className="flex items-center text-sm text-gray-500 font-light">
              <span className="hover:text-gray-700 cursor-pointer">Home</span>
              <span className="mx-2">→</span>
              <span className="hover:text-gray-700 cursor-pointer">Jewellery</span>
              <span className="mx-2">→</span>
              <span className="text-gray-900">Products</span>
            </div>
          </nav>

          {/* Page Title and Description */}
          <div className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6 font-cormorant">
              Products
            </h1>
            <div className="max-w-2xl">
              <p className="text-base text-gray-700 leading-relaxed mb-4 font-cormorant">
                At McCulloch Jewellers we know that fine jewellery holds a very special meaning. We take 
                pride in our delicate craftsmanship, paying close attention to detail for 
                your special and one-of-a-kind piece. Celebrating stories of love, success and achievement.
              </p>
              <button className="text-gray-600 hover:text-gray-900 text-sm italic underline font-cormorant">
                Read More
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-8 pb-6 border-b border-gray-200 relative">
            <div className="flex flex-wrap items-center justify-between gap-4">
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

                {/* Product Type Filter */}
                <div className="relative">
                  <button 
                    onClick={() => toggleFilter('productType')}
                    className={`text-gray-700 hover:text-gray-900 uppercase tracking-wider font-light transition-colors flex items-center gap-1 ${
                      activeFilter === 'productType' ? 'text-gray-900' : ''
                    }`}
                  >
                    Product Type
                    <svg className={`w-3 h-3 transition-transform ${activeFilter === 'productType' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {activeFilter === 'productType' && (
                    <div className="absolute top-full left-0 mt-3 w-64 bg-white border border-gray-200 shadow-xl rounded-none z-50 animate-fade-in">
                      <div className="p-6">
                        <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wider mb-4 font-inter">Product Type</h3>
                        <div className="space-y-3">
                          {filterOptions.productType.map((option, index) => (
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
          
          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Product 1 */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
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
                  alt="Raindance Classic Platinum Diamond Ring"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                
                {/* Hover Image */}
                <img 
                  src="/images/Wedding.jpg" 
                  alt="Raindance Classic Platinum Diamond Ring - Alternative View"
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
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Raindance Classic Platinum Diamond Ring</h3>
                
                <p className="text-lg font-cormorant font-medium text-gray-600">£11,000</p>
              </div>
            </div>

            {/* Product 2 */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
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
                  alt="Eternity Wedding Band"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                
                {/* Hover Image */}
                <img 
                  src="/images/Diamonds.jpg" 
                  alt="Eternity Wedding Band - Alternative View"
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
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Eternity Wedding Band</h3>
                
                <p className="text-lg font-cormorant font-medium text-gray-600">£1,650</p>
              </div>
            </div>

            {/* Product 3 */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
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
                  alt="Diamond Tennis Necklace"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                
                {/* Hover Image */}
                <img 
                  src="/images/Jewellery.jpg" 
                  alt="Diamond Tennis Necklace - Alternative View"
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
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Diamond Tennis Necklace</h3>
                
                <p className="text-lg font-cormorant font-medium text-gray-600">£4,200</p>
              </div>
            </div>

            {/* Product 4 */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-4" style={{ aspectRatio: '0.8', height: 'auto' }}>
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
                  alt="Pearl Drop Earrings"
                  className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                />
                
                {/* Hover Image */}
                <img 
                  src="/images/Engagement.png" 
                  alt="Pearl Drop Earrings - Alternative View"
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
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Pearl Drop Earrings</h3>
                
                <p className="text-lg font-cormorant font-medium text-gray-600">£850</p>
              </div>
            </div>

            {/* Product 5 */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-4 flex items-center justify-center" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button 
                  onClick={() => toggleLike(5)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has(5) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                {/* Default Image */}
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12,6 12,12 16,14"/>
                  </svg>
                </div>
                
                {/* Hover Image */}
                <img 
                  src="/images/Wedding.jpg" 
                  alt="Luxury Timepiece - Alternative View"
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
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Luxury Timepiece</h3>
                
                <p className="text-lg font-cormorant font-medium text-gray-600">£8,500</p>
              </div>
            </div>

            {/* Product 6 */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-4 flex items-center justify-center" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button 
                  onClick={() => toggleLike(6)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has(6) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                {/* Default Image */}
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                
                {/* Hover Image */}
                <img 
                  src="/images/Diamonds.jpg" 
                  alt="Bespoke Design - Alternative View"
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
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Bespoke Design</h3>
                
                <p className="text-lg font-cormorant font-medium text-gray-600">From £1,200</p>
              </div>
            </div>

            {/* Product 7 */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-4 flex items-center justify-center" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button 
                  onClick={() => toggleLike(7)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has(7) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                {/* Default Image */}
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                
                {/* Hover Image */}
                <img 
                  src="/images/Engagement.png" 
                  alt="Statement Ring - Alternative View"
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
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Statement Ring</h3>
                
                <p className="text-lg font-cormorant font-medium text-gray-600">£3,200</p>
              </div>
            </div>

            {/* Product 8 */}
            <div className="group cursor-pointer bg-white transition-all duration-300">
              <div className="relative bg-gray-50 overflow-hidden mx-4 flex items-center justify-center" style={{ aspectRatio: '0.8', height: 'auto' }}>
                <button 
                  onClick={() => toggleLike(8)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <svg className={`w-4 h-4 transition-colors duration-200 ${
                    likedProducts.has(8) ? 'text-gray-700 fill-gray-700' : 'text-gray-400 group-hover:text-white fill-none'
                  }`} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                {/* Default Image */}
                <div className="w-full h-full flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
                
                {/* Hover Image */}
                <img 
                  src="/images/Jewellery.jpg" 
                  alt="Custom Pendant - Alternative View"
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
                <h3 className="text-base font-cormorant font-normal text-gray-700 mb-3 leading-tight">Custom Pendant</h3>
                
                <p className="text-lg font-cormorant font-medium text-gray-600">£950</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center bg-gray-50 rounded-lg p-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4 font-cormorant">
              Need Help Choosing?
            </h2>
            <p className="text-lg text-gray-600 mb-8 font-cormorant">
              Our expert team is here to guide you through our collections and help you find the perfect piece.
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

export default Products;