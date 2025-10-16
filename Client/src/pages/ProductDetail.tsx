
import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Heart, Phone, MessageCircle, ChevronDown, ChevronUp, Plus, X, Minus, ZoomIn, ZoomOut } from 'lucide-react';
import LuxuryNavigationWhite from '@/components/LuxuryNavigationWhite';
import { FooterSection } from '@/components/FooterSection';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL from '../config/api';

const ProductDetail = () => {
  const { productId } = useParams();
  const [selectedMetal, setSelectedMetal] = useState('platinum');
  const [selectedSize, setSelectedSize] = useState('L');
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [userCountryName, setUserCountryName] = useState<string | null>(null);

  // Hardcoded ring sizes for all rings with UK/US/EU equivalents
  const ringSizes = [
    { value: 'A', label: 'UK Size A (US 0, EU 37.5)' },
    { value: 'B', label: 'UK Size B (US 0.5, EU 38.2)' },
    { value: 'C', label: 'UK Size C (US 1, EU 38.8)' },
    { value: 'D', label: 'UK Size D (US 1.5, EU 39.5)' },
    { value: 'E', label: 'UK Size E (US 2, EU 40.1)' },
    { value: 'F', label: 'UK Size F (US 2.5, EU 40.8)' },
    { value: 'G', label: 'UK Size G (US 3, EU 41.4)' },
    { value: 'H', label: 'UK Size H (US 3.5, EU 42.1)' },
    { value: 'I', label: 'UK Size I (US 4, EU 42.8)' },
    { value: 'J', label: 'UK Size J (US 4.5, EU 43.4)' },
    { value: 'K', label: 'UK Size K (US 5, EU 44.1)' },
    { value: 'L', label: 'UK Size L (US 5.5, EU 44.8)' },
    { value: 'M', label: 'UK Size M (US 6, EU 45.4)' },
    { value: 'N', label: 'UK Size N (US 6.5, EU 46.1)' },
    { value: 'O', label: 'UK Size O (US 7, EU 46.8)' },
    { value: 'P', label: 'UK Size P (US 7.5, EU 47.4)' },
    { value: 'Q', label: 'UK Size Q (US 8, EU 48.1)' },
    { value: 'R', label: 'UK Size R (US 8.5, EU 48.7)' },
    { value: 'S', label: 'UK Size S (US 9, EU 49.4)' },
    { value: 'T', label: 'UK Size T (US 9.5, EU 50.1)' },
    { value: 'U', label: 'UK Size U (US 10, EU 50.7)' },
    { value: 'V', label: 'UK Size V (US 10.5, EU 51.4)' },
    { value: 'W', label: 'UK Size W (US 11, EU 52.1)' },
    { value: 'X', label: 'UK Size X (US 11.5, EU 52.7)' },
    { value: 'Y', label: 'UK Size Y (US 12, EU 53.4)' },
    { value: 'Z', label: 'UK Size Z (US 12.5, EU 54.1)' }
  ];
  
  // Use global cart context
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Helper function to check if file is video
  const isVideoFile = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    about: false,
    delivery: false,
    insurance: false
  });

  // Fetch user's country based on IP
  useEffect(() => {
    const fetchUserCountry = async () => {
      try {
        // Using ipapi.co for geolocation - free tier allows 1000 requests/day
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.country_code && data.country_name) {
          setUserCountry(data.country_code);
          setUserCountryName(data.country_name);
          console.log('User country detected:', data.country_name, data.country_code);
        }
      } catch (err) {
        console.log('Could not detect user country:', err);
        // Fallback: don't show the message if we can't detect
        setUserCountry('GB'); // Default to GB (no message shown)
      }
    };

    fetchUserCountry();
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const data = await response.json();

        if (data.success) {
          console.log('Product data received:', data.data.product);
          console.log('Number of images:', data.data.product.images?.length);
          console.log('Images array:', data.data.product.images);
          setProductData(data.data.product);
          setRecommendedProducts(data.data.recommended_products || []);

          // Set initial metal selection to first available metal
          if (data.data.product.available_metals && data.data.product.available_metals.length > 0) {
            setSelectedMetal(data.data.product.available_metals[0].id);
          }
        } else {
          setError(data.message || 'Failed to fetch product');
        }
      } catch (err) {
        setError('Failed to fetch product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddToCart = () => {
    // Start loading animation
    setIsLoading(true);
    
    // Simulate adding to cart process
    setTimeout(() => {
      const newItem = {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        metal: selectedMetal,
        size: selectedSize,
        image: productData.images[0]?.url
      };
      
      addToCart(newItem);
      setIsLoading(false);
    }, 1500); // 1.5 second loading animation
  };


  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productData.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productData.images.length) % productData.images.length);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const openLightbox = (imageIndex: number) => {
    setLightboxImageIndex(imageIndex);
    setIsLightboxOpen(true);
    setZoomLevel(1);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setZoomLevel(1);
  };

  const goToLightboxImage = (index: number) => {
    setLightboxImageIndex(index);
    setZoomLevel(1);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const nextRecommendation = () => {
    setCurrentRecommendationIndex(prev => 
      prev + 4 >= recommendedProducts.length ? 0 : prev + 4
    );
  };

  const prevRecommendation = () => {
    setCurrentRecommendationIndex(prev => 
      prev === 0 ? Math.max(0, recommendedProducts.length - 4) : prev - 4
    );
  };

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextRecommendation();
    }
    if (isRightSwipe) {
      prevRecommendation();
    }
  };

  // Static fallback data will be replaced by API data
  // const staticProductData = { ... }; // Removed - using dynamic productData from API

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle case where product not found
  if (!productData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Product not found</p>
          <Link
            to="/rings"
            className="mt-4 inline-block px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Back to Rings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LuxuryNavigationWhite />
      
      {/* Mobile Breadcrumb */}
      <nav className="block lg:hidden px-4 py-3 mb-4 pt-24">
        <div className="flex items-center text-xs text-gray-500 font-light">
          <Link to="/" className="hover:text-gray-700">Home</Link>
          {productData.breadcrumbs && productData.breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className="mx-2">→</span>
              <Link
                to={crumb.href}
                className={`hover:text-gray-700 ${index === productData.breadcrumbs.length - 1 ? 'text-gray-900' : ''}`}
              >
                {crumb.name}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Mobile Image Carousel - Full Width */}
      <div className="block lg:hidden w-full">
        <div
          className="relative w-full h-[50vh] bg-gray-50 cursor-pointer"
          onClick={() => openLightbox(currentImageIndex)}
        >
          {isVideoFile(productData.images[currentImageIndex]?.url) ? (
            <video
              src={productData.images[currentImageIndex]?.url}
              controls
              autoPlay
              muted
              className="w-full h-full object-contain p-4"
            />
          ) : (
            <img
              src={productData.images[currentImageIndex]?.url}
              alt={productData.images[currentImageIndex]?.alt || productData.name}
              className="w-full h-full object-contain p-4"
            />
          )}

          {/* Navigation Arrows */}
          {productData.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Dots Pagination */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
            {productData.images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'bg-gray-900'
                    : 'bg-gray-400 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Product Details */}
      <div className="block lg:hidden px-6 py-4 bg-white">
        {/* Mobile content will be added here if needed */}
      </div>

      <main className="max-w-full mx-auto px-0 pt-0 lg:pt-44 pb-8">
        {/* Breadcrumb - Desktop Only */}
        <nav className="hidden lg:flex items-center space-x-2 text-sm text-gray-600 mb-8 px-8">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          {productData.breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4" />
              <Link
                to={crumb.href}
                className={`hover:text-gray-900 ${index === productData.breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}`}
              >
                {crumb.name}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-[60%,40%] gap-0">
          {/* Left Side - Dynamic Image Grid */}
          <div className="w-full px-4">
            {/* Fixed 2-Column Grid for all media */}
            <div className="grid grid-cols-2 gap-2">
              {productData.images.map((image, index) => (
                <div
                  key={index}
                  className="relative bg-gray-50 overflow-hidden group cursor-pointer"
                  style={{ height: '950px' }}
                  onClick={() => openLightbox(index)}
                >
                  {/* Loading skeleton for videos */}
                  {isVideoFile(image?.url) && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    </div>
                  )}

                  {isVideoFile(image?.url) ? (
                    <div className="relative w-full h-full">
                      <video
                        src={image?.url}
                        muted
                        loop
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105`}
                        onLoadedData={(e) => {
                          // Hide loading skeleton when video loads
                          const loadingDiv = e.target.parentElement.previousElementSibling;
                          if (loadingDiv) loadingDiv.style.display = 'none';
                        }}
                      />
                      {/* Play button overlay for videos */}
                      <div className="absolute bottom-4 left-4 w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white">
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 5v10l8-5-8-5z"/>
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={image?.url}
                      alt={image?.alt || `${productData.name} - Image ${index + 1}`}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                        index === 0 ? 'p-8' : ''
                      }`}
                    />
                  )}

                  {/* Zoom Button - only on first image and not videos */}
                  {index === 0 && !isVideoFile(image?.url) && (
                    <>
                      <button className="absolute top-8 left-8 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-110">
                        <Plus className="w-6 h-6 text-gray-700" />
                      </button>
                      <span className="absolute top-24 left-8 text-base text-gray-700 bg-white/90 px-4 py-2 rounded font-serif">
                        Zoom
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Product Information */}
          <div className="pt-0 sticky top-8 self-start bg-white" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
            {/* Product Title and Price */}
            <div className="mb-8">
              <h1 className="text-3xl font-cormorant font-light text-gray-900 mb-6 leading-tight">
                {productData.name}
              </h1>
              <div className="mb-4">
                <div className="text-lg font-cormorant text-gray-900 mb-3">
                  {productData.price}
                </div>
                {userCountry && userCountry !== 'GB' && userCountryName && (
                  <div className="flex items-start space-x-2 text-xs text-gray-500 leading-relaxed">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>We've detected you are browsing from {userCountryName}, please note the UK price for this piece is {productData.price}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metal Selection */}
            {productData.available_metals && productData.available_metals.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-cormorant font-medium text-gray-900 uppercase tracking-wider mb-4">
                  Metal: {productData.available_metals.find(metal => metal.id === selectedMetal)?.name || productData.available_metals[0]?.name || 'Not Selected'}
                </h3>
                <div className="flex space-x-2">
                  {productData.available_metals.map((metal) => (
                    <button
                      key={metal.id}
                      onClick={() => setSelectedMetal(metal.id)}
                      className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                        selectedMetal === metal.id
                          ? 'border-gray-800'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: metal.color }}
                      title={metal.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-8">
              <h3 className="text-xs font-cormorant font-medium text-gray-900 uppercase tracking-wider mb-4">
                Size
              </h3>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full border border-gray-300 px-4 py-3 font-cormorant text-gray-900 focus:outline-none focus:border-gray-800 bg-white text-sm"
              >
                {ringSizes.map((size) => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-8">
              <Button 
                onClick={handleAddToCart}
                disabled={isLoading}
                className={`w-full h-12 font-cormorant font-medium uppercase tracking-wider text-xs border-0 transition-all duration-300 relative overflow-hidden ${
                  isLoading 
                    ? 'bg-gray-900 text-white cursor-not-allowed' 
                    : 'bg-[#f4e6c8] hover:bg-[#f0ddb0] text-gray-900'
                }`}
              >
                {isLoading && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <div className="w-24 h-0.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full w-full animate-pulse"></div>
                    </div>
                  </div>
                )}
                <span className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
                  Add to Bag
                </span>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-12 border border-gray-300 hover:border-gray-800 text-gray-900 font-cormorant font-medium uppercase tracking-wider text-xs bg-white"
              >
                Enquire
              </Button>
            </div>

            {/* Add to Wishlist */}
            <div className="text-center mb-8">
              <button className="flex items-center justify-center w-full text-gray-600 hover:text-gray-900 transition-colors">
                <Heart className="w-4 h-4 mr-2" />
                <span className="font-cormorant text-sm">Add to Wishlist</span>
              </button>
            </div>

            {/* Contact Options */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 9l6-6" />
                  </svg>
                </div>
                <div className="text-xs font-serif font-medium text-gray-900 uppercase tracking-wider">
                  Book An
                </div>
                <div className="text-xs font-serif font-medium text-gray-900 uppercase tracking-wider">
                  Appointment
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Phone className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-xs font-serif font-medium text-gray-900 uppercase tracking-wider">
                  Order By Phone
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <MessageCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-xs font-serif font-medium text-gray-900 uppercase tracking-wider">
                  Drop A Hint
                </div>
              </div>
            </div>

            {/* Expandable Information Sections */}
            <div className="space-y-4 pt-6">
              {/* About This Piece */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('about')}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <h3 className="text-sm font-serif font-medium text-gray-900 uppercase tracking-wider">
                    About This Piece
                  </h3>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-300 ease-in-out ${
                    expandedSections.about ? 'rotate-180' : 'rotate-0'
                  }`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSections.about 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-4">
                    <p className="text-sm font-cormorant text-gray-700 leading-relaxed mb-4">
                      {productData.description}
                    </p>
                    <button className="text-sm font-serif text-gray-900 underline hover:no-underline">
                      Read More
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('delivery')}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <h3 className="text-sm font-serif font-medium text-gray-900 uppercase tracking-wider">
                    Delivery Information
                  </h3>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-300 ease-in-out ${
                    expandedSections.delivery ? 'rotate-180' : 'rotate-0'
                  }`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSections.delivery 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-4">
                    <p className="text-sm font-cormorant text-gray-700 leading-relaxed">
                      Free worldwide delivery on all orders. Express delivery options available.
                    </p>
                  </div>
                </div>
              </div>

              {/* Complimentary Insurance */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('insurance')}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <h3 className="text-sm font-serif font-medium text-gray-900 uppercase tracking-wider">
                    Complimentary Insurance
                  </h3>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-300 ease-in-out ${
                    expandedSections.insurance ? 'rotate-180' : 'rotate-0'
                  }`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSections.insurance 
                      ? 'max-h-96 opacity-100' 
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-4">
                    <p className="text-sm font-cormorant text-gray-700 leading-relaxed">
                      All pieces come with complimentary insurance coverage for the first year.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
          {/* Close Button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center z-10 transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>

          {/* Left Sidebar - Thumbnails */}
          <div className="absolute left-6 top-1/2 transform -translate-y-1/2 flex flex-col space-y-3 z-10">
            {productData.images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToLightboxImage(index)}
                className={`w-16 h-16 bg-white rounded overflow-hidden border-2 transition-all ${
                  index === lightboxImageIndex 
                    ? 'border-gray-800 scale-110' 
                    : 'border-gray-300 hover:border-gray-600'
                }`}
              >
                {isVideoFile(image.url) ? (
                  <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                    <video
                      src={image.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-gray-600 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={image.url}
                    alt={image.alt || `Product view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Right Sidebar - Zoom Controls */}
          <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4 z-10">
            <button 
              onClick={zoomIn}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="w-6 h-6 text-gray-700" />
            </button>
            <button 
              onClick={zoomOut}
              className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* Main Image */}
          <div className="flex-1 flex items-center justify-center p-20">
            <div 
              className="relative overflow-hidden"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.3s ease-out'
              }}
            >
              {isVideoFile(productData.images[lightboxImageIndex]?.url) ? (
                <video
                  src={productData.images[lightboxImageIndex]?.url}
                  controls
                  autoPlay
                  muted
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: '80vh', maxWidth: '80vw' }}
                />
              ) : (
                <img
                  src={productData.images[lightboxImageIndex]?.url}
                  alt={productData.images[lightboxImageIndex]?.alt || productData.name}
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: '80vh', maxWidth: '80vw' }}
                />
              )}
            </div>
          </div>

          {/* Navigation Arrows - Bottom Positioned */}
          {productData.images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
              <button
                onClick={() => goToLightboxImage((lightboxImageIndex - 1 + productData.images.length) % productData.images.length)}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={() => goToLightboxImage((lightboxImageIndex + 1) % productData.images.length)}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          )}
        </div>
      )}


      {/* Experience McCulloch Excellence Section */}
      <section className="bg-[#f9f5e8] py-16">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            
            {/* Left Column - Simple & Clean */}
            <div className="space-y-8">
              <div className="border-l border-yellow-400 pl-6">
                <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-2">
                  Experience McCulloch Excellence
                </h2>
                <p className="text-sm font-cormorant text-gray-600 italic">
                  Where craftsmanship meets distinction since 1847
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="font-cormorant text-sm text-gray-700">Private Consultation</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-yellow-600" />
                  <span className="font-cormorant text-sm text-gray-700">+94 11 2 555 555</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-cormorant text-sm text-gray-700">Live Consultation</span>
                </div>
              </div>
            </div>

            {/* Right Column - Clean Service List */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-cormorant font-medium text-gray-900 mb-2">
                  Our Promise to You
                </h3>
                <div className="w-12 h-px bg-yellow-400"></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="font-cormorant text-sm text-gray-700">WHITE GLOVE DELIVERY</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="font-cormorant text-sm text-gray-700">SIGNATURE PRESENTATION</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="font-cormorant text-sm text-gray-700">ETHICAL EXCELLENCE</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="font-cormorant text-sm text-gray-700">SIZING EXPERTISE</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* You May Also Like Section - Only show if there are recommendations */}
      {recommendedProducts && recommendedProducts.length > 0 && (
        <section className="py-16 px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900">
                You may also like
              </h2>

              {/* Navigation Arrows */}
              {recommendedProducts.length > 4 && (
                <div className="flex space-x-2">
                  <button
                    onClick={prevRecommendation}
                    disabled={currentRecommendationIndex === 0}
                    className="w-8 h-8 lg:w-10 lg:h-10 border border-gray-300 hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={nextRecommendation}
                    disabled={currentRecommendationIndex + 4 >= recommendedProducts.length}
                    className="w-8 h-8 lg:w-10 lg:h-10 border border-gray-300 hover:border-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                  </button>
                </div>
              )}
            </div>

            {/* Products Horizontal Layout */}
            <div className="flex space-x-8 lg:space-x-12 overflow-x-auto scrollbar-hide pb-4">
              {recommendedProducts.slice(currentRecommendationIndex, currentRecommendationIndex + 4).map((product, index) => (
                <div key={product.id} className="group cursor-pointer flex-shrink-0 w-80 lg:w-96">
                  {/* Product Image */}
                  <div className="relative bg-gray-50 mb-6 overflow-hidden">
                    <div className="aspect-square">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-6 lg:p-8 transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-cormorant text-gray-900 text-base lg:text-lg leading-tight">
                      {product.name}
                    </h3>
                    <p className="font-cormorant text-gray-600 text-sm lg:text-base">
                      {product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-[#f4e6c8] hover:bg-[#f0ddb0] text-gray-900 px-6 py-3 rounded-full shadow-lg font-serif text-sm transition-colors flex items-center space-x-2">
          <MessageCircle className="w-4 h-4" />
          <span>Welcome to Rosalies</span>
          <span className="text-xs">START A CHAT</span>
        </button>
      </div>

      <FooterSection />
    </div>
  );
};

export default ProductDetail;