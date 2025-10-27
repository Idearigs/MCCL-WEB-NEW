import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/api';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const popularSearches = [
    "Diamond Rings", "Engagement Rings", "Wedding Bands", "Pearl Earrings",
    "Gold Necklaces", "Tennis Bracelets", "Vintage Jewelry", "Platinum Rings"
  ];

  // Fetch all products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/products`);
        const data = await response.json();
        if (data.success) {
          setAllProducts(data.data.products);
        }
      } catch (error) {
        console.error('Error fetching products for search:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.collection && product.collection.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allProducts]);

  if (!isOpen) return null;

  // Mobile Full-Screen Search
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col lg:hidden animate-search-mobile-fade-up">
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-gray-100">
          <div className="relative max-w-full">
            <div className="text-xs font-cormorant font-bold text-gray-500 uppercase tracking-wider mb-2">
              What are you looking for?
            </div>
            <Search className="absolute left-5 bottom-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-14 py-3 text-lg font-cormorant bg-white border-0 border-b border-gray-300 focus:outline-none focus:border-gray-600 rounded-none"
              autoFocus
            />
            <button 
              onClick={onClose}
              className="absolute right-0 bottom-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.length > 0 && (
          <div className="flex-1 overflow-y-auto p-6 animate-search-content-stagger">
            <h3 className="text-sm font-cormorant font-medium text-gray-900 uppercase tracking-wider mb-4">
              Search Results ({searchResults.length})
            </h3>
            {searchResults.length > 0 ? (
              <div className="space-y-8">
                {searchResults.map((product, index) => (
                  <Link
                    key={product.id}
                    to={`/${product.category?.slug || 'product'}/${product.slug}`}
                    onClick={onClose}
                    className="block group opacity-0 animate-search-content-stagger"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    {/* Product Image */}
                    <div className="w-full h-80 bg-gray-50 mb-4 overflow-hidden flex items-center justify-center">
                      <img
                        src={product.image?.url || '/images/placeholder.png'}
                        alt={product.image?.alt || product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="text-center">
                      <h4 className="text-base font-cormorant font-normal text-gray-900 leading-tight mb-2">
                        {product.name}
                      </h4>
                      <p className="text-sm font-cormorant text-gray-600">
                        {product.price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-base font-cormorant text-gray-500">
                  No products found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop Dropdown Search
  return (
    <div className="hidden lg:block absolute top-0 left-0 right-0 bg-white shadow-xl z-50 animate-search-desktop-slide-down">
      <div className="px-[35px] py-8">
        {/* Search Input */}
        <div className="relative max-w-5xl mx-auto">
          <div className="text-xs font-cormorant font-bold text-gray-500 uppercase tracking-wider mb-2">
            What are you looking for?
          </div>
          <Search className="absolute left-5 bottom-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-14 py-3 text-lg font-cormorant bg-white border-0 border-b border-gray-300 focus:outline-none focus:border-gray-600 rounded-none"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="absolute right-0 bottom-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Results - Three Column Grid */}
        {searchQuery.length > 0 && (
          <div className="mt-8">
            <div className="grid grid-cols-3 gap-12 max-w-5xl mx-auto">
              {/* Suggestions Column */}
              <div>
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">
                  SUGGESTIONS
                </h3>
                <ul className="space-y-2">
                  {popularSearches.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((suggestion, index) => (
                    <li key={index}>
                      <button
                        className="text-sm text-gray-700 hover:text-gray-900 text-left transition-colors"
                        onClick={() => setSearchQuery(suggestion)}
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                  {popularSearches.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <>
                      <li><button className="text-sm text-gray-700 hover:text-gray-900 text-left">Eternity Rings</button></li>
                      <li><button className="text-sm text-gray-700 hover:text-gray-900 text-left">Rings</button></li>
                      <li><button className="text-sm text-gray-700 hover:text-gray-900 text-left">Oval Engagement Rings</button></li>
                      <li><button className="text-sm text-gray-700 hover:text-gray-900 text-left">Women's Rings</button></li>
                      <li><button className="text-sm text-gray-700 hover:text-gray-900 text-left">Heart Rings</button></li>
                    </>
                  )}
                </ul>
                <button className="text-sm text-gray-600 underline hover:text-gray-800 mt-4 block transition-colors">
                  Search for "{searchQuery}"
                </button>
              </div>

              {/* Products Column */}
              <div>
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">
                  PRODUCTS
                </h3>
                {searchResults.length > 0 ? (
                  <ul className="space-y-4">
                    {searchResults.slice(0, 3).map((product) => (
                      <li key={product.id}>
                        <Link
                          to={`/${product.category?.slug || 'product'}/${product.slug}`}
                          onClick={onClose}
                          className="text-left hover:opacity-70 transition-opacity block"
                        >
                          <div className="flex space-x-3">
                            <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                              <img
                                src={product.image?.url || product.featured_image || '/images/placeholder.png'}
                                alt={product.image?.alt || product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/placeholder.png';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 leading-tight">{product.name}</p>
                              <p className="text-xs text-blue-600 font-medium mt-1">
                                {product.price ? `£${product.price}` : 'Contact for price'}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">
                      No products found
                    </p>
                  </div>
                )}
              </div>

              {/* Pages Column */}
              <div>
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">
                  PAGES
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/engagement" className="text-sm text-gray-700 hover:text-gray-900 text-left transition-colors block">
                      Engagement Rings
                    </Link>
                  </li>
                  <li>
                    <Link to="/wedding" className="text-sm text-gray-700 hover:text-gray-900 text-left transition-colors block">
                      Wedding Rings
                    </Link>
                  </li>
                  <li>
                    <Link to="/eternity-rings" className="text-sm text-gray-700 hover:text-gray-900 text-left transition-colors block">
                      Eternity Rings
                    </Link>
                  </li>
                  <li>
                    <Link to="/diamonds" className="text-sm text-gray-700 hover:text-gray-900 text-left transition-colors block">
                      Diamonds
                    </Link>
                  </li>
                  <li>
                    <Link to="/resizing" className="text-sm text-gray-700 hover:text-gray-900 text-left transition-colors block">
                      Ring & Jewellery Resizing
                    </Link>
                  </li>
                  <li>
                    <Link to="/guides" className="text-sm text-gray-700 hover:text-gray-900 text-left transition-colors block">
                      Guides
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;