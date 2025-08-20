import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Sample search data - replace with actual product data
  const sampleProducts = [
    { id: 1, name: "Ashoka Five Stone Half Platinum Diamond Eternity Ring", category: "Rings", image: "/images/prod1.png" },
    { id: 2, name: "Classic Diamond Drop Earrings", category: "Earrings", image: "/images/prod2.png" },
    { id: 3, name: "Diamond Tennis Necklace", category: "Necklaces", image: "/images/prod3.png" },
    { id: 4, name: "Rose Gold Hoop Earrings", category: "Earrings", image: "/images/prod4.png" },
    { id: 5, name: "Vintage Rose Gold Locket Necklace", category: "Necklaces", image: "/images/prod5.png" },
    { id: 6, name: "Engagement Ring Collection", category: "Engagement", image: "/images/Engagement.png" },
  ];

  const popularSearches = [
    "Diamond Rings", "Engagement Rings", "Wedding Bands", "Pearl Earrings", 
    "Gold Necklaces", "Tennis Bracelets", "Vintage Jewelry", "Platinum Rings"
  ];

  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = sampleProducts.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className="block group opacity-0 animate-search-content-stagger"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    {/* Product Image */}
                    <div className="w-full h-80 bg-gray-50 mb-4 overflow-hidden flex items-center justify-center">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    {/* Product Details */}
                    <div className="text-center">
                      <h4 className="text-base font-cormorant font-normal text-gray-900 leading-tight mb-2">
                        {product.name}
                      </h4>
                      <p className="text-sm font-cormorant text-gray-600">
                        £2,500
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

        {/* Search Results */}
        {searchQuery.length > 0 && (
          <div className="mt-6 animate-search-content-stagger">
            <h3 className="text-sm font-cormorant font-medium text-gray-900 uppercase tracking-wider mb-4">
              Search Results ({searchResults.length})
            </h3>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {searchResults.map((product, index) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className="group p-3 hover:bg-gray-50 rounded-lg transition-all opacity-0 animate-search-content-stagger"
                    style={{ animationDelay: `${0.05 * index}s` }}
                  >
                    <div className="w-full h-20 bg-gray-50 rounded mb-3 overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-xs font-cormorant font-medium text-gray-900 leading-tight mb-1">
                      {product.name}
                    </h4>
                    <p className="text-xs font-cormorant text-gray-500">
                      {product.category}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-cormorant text-gray-500">
                  No products found for "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;