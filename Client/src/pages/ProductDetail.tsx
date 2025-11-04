
import React, { useState, useEffect, useCallback } from 'react';
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

  // Nivoda Stone Selection States
  const [selectedStoneType, setSelectedStoneType] = useState<'natural' | 'lab-grown'>('natural');
  const [selectedCarat, setSelectedCarat] = useState('');
  const [selectedClarity, setSelectedClarity] = useState('');
  const [selectedColour, setSelectedColour] = useState('');
  const [selectedCut, setSelectedCut] = useState('');

  // Nivoda API price calculation
  const [nivodaPrice, setNivodaPrice] = useState<{ min: number; avg: number; max: number } | null>(null);
  const [nivodaPriceLoading, setNivodaPriceLoading] = useState(false);
  const [nivodaPriceError, setNivodaPriceError] = useState<string | null>(null);

  const [expandedStoneOptions, setExpandedStoneOptions] = useState<{ [key: string]: boolean }>({
    stoneType: true,
    carat: true,
    clarity: true,
    colour: true,
    cut: true
  });

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
    insurance: false,
    yourStone: true
  });

  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (sizeDropdownOpen && !target.closest('.size-dropdown-container')) {
        setSizeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sizeDropdownOpen]);

  // Helper function to filter images and videos by selected metal
  const getMetalSpecificMedia = (allImages: any[], selectedMetalId: string) => {
    if (!allImages || allImages.length === 0) return [];

    // First, try to get metal-specific images for the selected metal
    const metalSpecificImages = allImages.filter(img => img.metal_id === selectedMetalId);

    // If metal-specific images exist, return them
    if (metalSpecificImages.length > 0) {
      return metalSpecificImages;
    }

    // Otherwise, return general images (those with no metal_id)
    return allImages.filter(img => !img.metal_id);
  };

  // Helper function to get the primary image for a specific metal
  const getMetalThumbnail = (metalId: string) => {
    if (!productData || !productData.images) return null;

    // First try to get metal-specific image
    const metalSpecificImage = productData.images.find(img => img.metal_id === metalId);
    if (metalSpecificImage) return metalSpecificImage;

    // Fall back to general image
    const generalImage = productData.images.find(img => !img.metal_id);
    return generalImage || null;
  };

  // Helper function to build stone options from nivoda_options_config
  // Now using ranges and available options instead of individual selections with adjustments
  const buildStoneOptions = () => {
    // Common carat weights available from Nivoda
    const allCarats = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 5.0, 10.0];

    if (!productData?.nivoda_enabled || !productData?.nivoda_options_config) {
      return {
        stoneType: [
          { value: 'natural', label: 'Natural' },
          { value: 'lab-grown', label: 'Lab-Grown' }
        ],
        carat: allCarats.map(c => ({
          value: c.toFixed(2),
          label: c.toFixed(2)
        })),
        clarity: [],
        colour: [],
        cut: []
      };
    }

    const config = productData.nivoda_options_config;
    const caratRange = config.caratRange || { min: 0.5, max: 2.0 };

    // Filter carats to only those within the configured range
    const caratOptions = allCarats.filter(c => c >= caratRange.min && c <= caratRange.max);

    return {
      stoneType: [
        { value: 'natural', label: 'Natural' },
        { value: 'lab-grown', label: 'Lab-Grown' }
      ],
      carat: caratOptions.map(c => ({
        value: c.toFixed(2),
        label: c.toFixed(2)
      })),
      clarity: (config.clarityOptions || []).map(c => ({
        value: c,
        label: c
      })),
      colour: (config.colourOptions || []).map(c => ({
        value: c,
        label: c
      })),
      cut: (config.cutOptions || []).map(c => ({
        value: c,
        label: c
      }))
    };
  };

  const stoneOptions = buildStoneOptions();

  // Fetch price from Nivoda API based on selected specs
  const fetchNivodaPrice = useCallback(async (carat?: string, clarity?: string, colour?: string, cut?: string) => {
    if (!productData?.nivoda_enabled) return;

    // Only fetch if we have the key specs selected
    if (!carat || !clarity || !colour || !cut) return;

    setNivodaPriceLoading(true);
    setNivodaPriceError(null);

    try {
      const params = new URLSearchParams({
        carat,
        clarity,
        color: colour,
        cut
      });

      console.log('API URL:', `${API_BASE_URL}/nivoda/diamonds/price-suggestions?${params}`);
      const response = await fetch(`${API_BASE_URL}/nivoda/diamonds/price-suggestions?${params}`);
      const data = await response.json();

      console.log('API Response:', data);
      if (data.success && data.data?.prices) {
        console.log('Price updated:', data.data.prices);
        setNivodaPrice(data.data.prices);
      } else {
        setNivodaPriceError('Could not fetch price for this specification');
      }
    } catch (error) {
      console.error('Error fetching Nivoda price:', error);
      setNivodaPriceError('Error fetching price data');
    } finally {
      setNivodaPriceLoading(false);
    }
  }, [productData?.nivoda_enabled]);

  // Calculate total price - use Nivoda API price if available, otherwise use base price
  const calculateTotalPrice = () => {
    if (!productData?.price) return 0;

    if (productData.nivoda_enabled && nivodaPrice) {
      return nivodaPrice.avg; // Use average price from Nivoda
    }

    // Fallback to base price
    const priceString = productData.price.replace(/[^\d.,]/g, '').replace(/,/g, '');
    return parseFloat(priceString) || 0;
  };

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

  // Initialize stone options with default selections when product loads
  useEffect(() => {
    if (!productData?.nivoda_enabled || !productData?.nivoda_options_config) return;

    const config = productData.nivoda_options_config;

    // Set stone type default
    if (config.stoneType) {
      setSelectedStoneType(config.stoneType);
    }

    // Set default carat (middle of range)
    if (config.caratRange) {
      const midCarat = ((config.caratRange.min + config.caratRange.max) / 2).toFixed(2);
      setSelectedCarat(midCarat);
    }

    // Set default clarity (first available option)
    if (config.clarityOptions && config.clarityOptions.length > 0) {
      setSelectedClarity(config.clarityOptions[0]);
    }

    // Set default colour (first available option)
    if (config.colourOptions && config.colourOptions.length > 0) {
      setSelectedColour(config.colourOptions[0]);
    }

    // Set default cut (first available option)
    if (config.cutOptions && config.cutOptions.length > 0) {
      setSelectedCut(config.cutOptions[0]);
    }
  }, [productData?.nivoda_enabled, productData?.nivoda_options_config]);

  // Fetch price when any selection changes
  useEffect(() => {
    if (productData?.nivoda_enabled && selectedCarat && selectedClarity && selectedColour && selectedCut) {
      console.log('Fetching Nivoda price for:', { selectedCarat, selectedClarity, selectedColour, selectedCut });
      fetchNivodaPrice(selectedCarat, selectedClarity, selectedColour, selectedCut);
    }
  }, [selectedCarat, selectedClarity, selectedColour, selectedCut, productData?.nivoda_enabled, fetchNivodaPrice]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleStoneOption = (option: string) => {
    setExpandedStoneOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Handler functions for setting stone options
  // Price is calculated dynamically from Nivoda API when selections change
  const handleCaratSelect = (value: string) => {
    setSelectedCarat(value);
  };

  const handleClaritySelect = (value: string) => {
    setSelectedClarity(value);
  };

  const handleColourSelect = (value: string) => {
    setSelectedColour(value);
  };

  const handleCutSelect = (value: string) => {
    setSelectedCut(value);
  };

  const handleStoneTypeSelect = (value: 'natural' | 'lab-grown') => {
    setSelectedStoneType(value);
  };

  const handleAddToCart = () => {
    // Start loading animation
    setIsLoading(true);

    // Simulate adding to cart process
    setTimeout(() => {
      const newItem: any = {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        metal: selectedMetal,
        size: selectedSize,
        image: displayImages[0]?.url || productData.images[0]?.url
      };

      // Include Nivoda stone options if enabled
      if (productData?.nivoda_enabled) {
        newItem.nivodaOptions = {
          stoneType: selectedStoneType,
          carat: selectedCarat,
          clarity: selectedClarity,
          colour: selectedColour,
          cut: selectedCut
        };
        // Price is calculated from Nivoda API based on selected specs
        newItem.nivodaPrice = nivodaPrice; // { min, avg, max }
        newItem.totalPrice = calculateTotalPrice(); // Uses Nivoda API price (avg) when available
      }

      addToCart(newItem);
      setIsLoading(false);
    }, 1500); // 1.5 second loading animation
  };


  const nextImage = () => {
    if (!productData || !displayImages || displayImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = () => {
    if (!productData || !displayImages || displayImages.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
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

  // Get filtered images and videos based on selected metal
  const displayImages = productData ? getMetalSpecificMedia(productData.images || [], selectedMetal) : [];

  return (
    <div className="min-h-screen bg-white">
      <LuxuryNavigationWhite />

      {/* Mobile Breadcrumb - Above Image */}
      <nav className="block lg:hidden px-4 py-3 bg-white border-b border-gray-100 relative z-10 mt-20">
        <div className="flex items-center text-sm text-gray-700 font-futura-pt">
          <Link to="/" className="hover:text-gray-900">Home</Link>
          {productData.breadcrumbs && productData.breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className="mx-2 text-gray-400">›</span>
              <Link
                to={crumb.href}
                className={`hover:text-gray-900 ${index === productData.breadcrumbs.length - 1 ? 'text-gray-900 font-semibold' : ''}`}
              >
                {crumb.name}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Mobile Image Carousel - Full Width, Large & Clean */}
      <div className="block lg:hidden w-full bg-white">
        <div
          className="relative w-full cursor-pointer flex items-center justify-center"
          style={{ height: '550px' }}
          onClick={() => openLightbox(currentImageIndex)}
        >
          {isVideoFile(displayImages[currentImageIndex]?.url) ? (
            <video
              src={displayImages[currentImageIndex]?.url}
              controls
              autoPlay
              muted
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <img
              src={displayImages[currentImageIndex]?.url}
              alt={displayImages[currentImageIndex]?.alt || productData.name}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {/* Navigation Arrows - Subtle */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-amber-300/70 hover:bg-amber-400 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-amber-300/70 hover:bg-amber-400 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Dots Pagination */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex
                    ? 'bg-gray-900'
                    : 'bg-gray-300 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Product Details Section */}
      <div className="block lg:hidden px-4 py-6 bg-white border-t border-gray-200">
        <h1 className="text-3xl font-cormorant font-light text-gray-900 mb-2 leading-tight">
          {productData.name}
        </h1>
        <div className="text-xl font-futura-pt font-normal text-gray-900 mb-6">
          {productData.price}
        </div>

        {/* Mobile Metal Selection */}
        {productData.available_metals && productData.available_metals.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2">
              Metal: {productData.available_metals.find(metal => metal.id === selectedMetal)?.name || productData.available_metals[0]?.name}
            </h3>
            <div className="flex space-x-2">
              {productData.available_metals.map((metal) => {
                const metalImage = getMetalThumbnail(metal.id);
                return (
                  <button
                    key={metal.id}
                    onClick={() => setSelectedMetal(metal.id)}
                    className={`w-12 h-12 border-2 transition-all overflow-hidden flex items-center justify-center bg-gray-100 ${
                      selectedMetal === metal.id ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    title={metal.name}
                  >
                    {metalImage && metalImage.url ? (
                      <img
                        src={metalImage.url}
                        alt={metal.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: metal.color }}
                        title={metal.name}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Size Selection */}
        <div className="mb-4">
          <h3 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2">Size</h3>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="w-full border border-gray-300 px-3 py-2 font-futura-pt text-gray-900 text-xs bg-white"
          >
            {ringSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mobile YOUR STONE Section */}
        {productData?.nivoda_enabled && (
          <div className="mb-4 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider">
                YOUR STONE
              </h2>
              <button
                onClick={() => setExpandedSections({...expandedSections, yourStone: !expandedSections.yourStone})}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {expandedSections.yourStone ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {expandedSections.yourStone && (
              <div className="space-y-3">
                {/* Stone Type */}
                {productData?.show_stone_type && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Stone Type:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stoneOptions.stoneType.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStoneTypeSelect(option.value as 'natural' | 'lab-grown')}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${
                            selectedStoneType === option.value
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carat */}
                {productData?.show_carat && stoneOptions.carat && stoneOptions.carat.length > 0 && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Carat:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stoneOptions.carat.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleCaratSelect(option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${
                            selectedCarat === option.value
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clarity */}
                {productData?.show_clarity && stoneOptions.clarity && stoneOptions.clarity.length > 0 && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Clarity:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stoneOptions.clarity.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleClaritySelect(option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${
                            selectedClarity === option.value
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colour */}
                {productData?.show_colour && stoneOptions.colour && stoneOptions.colour.length > 0 && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Colour:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stoneOptions.colour.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleColourSelect(option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${
                            selectedColour === option.value
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cut */}
                {productData?.show_cut && stoneOptions.cut && stoneOptions.cut.length > 0 && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Cut:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stoneOptions.cut.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleCutSelect(option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${
                            selectedCut === option.value
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Action Buttons */}
        <div className="space-y-2 mb-4">
          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="w-full bg-amber-100 hover:bg-amber-200 text-gray-900 py-3 font-futura-pt font-light"
          >
            {isLoading ? 'Adding...' : 'ADD TO BAG'}
          </Button>
          <Button
            variant="outline"
            className="w-full border border-gray-900 text-gray-900 hover:bg-gray-50 py-3 font-futura-pt font-light"
          >
            ENQUIRE
          </Button>
        </div>
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
              {displayImages.map((image, index) => (
                <div
                  key={index}
                  className="relative bg-gray-50 overflow-hidden group cursor-pointer"
                  style={{ height: '700px' }}
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
                        autoPlay
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
          <div className="pt-0 sticky top-0 self-start bg-white max-w-md 2xl:max-w-lg mx-auto" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
            {/* Product Title and Price */}
            <div className="mb-4 2xl:mb-5 pt-2 pb-2">
              <h1 className="text-2xl 2xl:text-3xl font-cormorant font-light text-gray-900 mb-2 2xl:mb-3 leading-tight">
                {productData.name}
              </h1>
              <div className="mb-2 2xl:mb-2">
                <div className="text-base 2xl:text-lg font-futura-pt font-normal text-gray-900 mb-1">
                  {productData.nivoda_enabled && nivodaPrice
                    ? `£${nivodaPrice.avg.toLocaleString()}`
                    : productData.price}
                </div>
                {nivodaPriceLoading && (
                  <div className="text-xs text-gray-500 mb-1">Calculating price...</div>
                )}
                {userCountry && userCountry !== 'GB' && userCountryName && (
                  <div className="flex items-start space-x-1.5 text-[11px] 2xl:text-xs text-gray-500 leading-snug">
                    <svg className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>We've detected you are browsing from {userCountryName}, please note the UK price for this piece is {productData.nivoda_enabled && nivodaPrice ? `£${nivodaPrice.avg.toLocaleString()}` : productData.price}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Metal Selection */}
            {productData.available_metals && productData.available_metals.length > 0 && (
              <div className="mb-4 2xl:mb-5">
                <h3 className="text-[10px] 2xl:text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2 2xl:mb-2">
                  Metal: {productData.available_metals.find(metal => metal.id === selectedMetal)?.name || productData.available_metals[0]?.name || 'Not Selected'}
                </h3>
                <div className="flex space-x-2 2xl:space-x-3">
                  {productData.available_metals.map((metal) => {
                    const metalImage = getMetalThumbnail(metal.id);
                    return (
                      <button
                        key={metal.id}
                        onClick={() => setSelectedMetal(metal.id)}
                        className={`w-14 h-14 2xl:w-16 2xl:h-16 border-2 transition-all duration-200 overflow-hidden flex items-center justify-center bg-gray-100 ${
                          selectedMetal === metal.id
                            ? 'border-gray-800'
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        title={metal.name}
                      >
                        {metalImage && metalImage.url ? (
                          <img
                            src={metalImage.url}
                            alt={metal.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: metal.color }}
                            title={metal.name}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-4 2xl:mb-5 relative size-dropdown-container">
              <h3 className="text-[10px] 2xl:text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2 2xl:mb-2">
                Size
              </h3>

              {/* Custom Dropdown Trigger */}
              <button
                onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                className="w-full border border-gray-300 px-3 2xl:px-4 py-2 2xl:py-2.5 font-futura-pt text-gray-900 hover:border-gray-800 focus:outline-none focus:border-gray-800 bg-white text-xs 2xl:text-sm flex items-center justify-between transition-colors"
              >
                <span>{ringSizes.find(s => s.value === selectedSize)?.label || 'Select Size'}</span>
                <ChevronDown className={`w-4 h-4 2xl:w-5 2xl:h-5 transition-transform duration-200 ${sizeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Size Chart Dropdown */}
              {sizeDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 shadow-lg rounded-sm max-h-[400px] overflow-y-auto">
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {ringSizes.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => {
                            setSelectedSize(size.value);
                            setSizeDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-4 py-3 text-sm font-futura-pt font-medium transition-all rounded-sm ${
                            selectedSize === size.value
                              ? 'bg-amber-50 text-gray-900 border border-amber-200'
                              : 'bg-white hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <span className="font-medium">{size.label}</span>
                          {selectedSize === size.value && (
                            <svg className="w-4 h-4 text-amber-700" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* YOUR STONE Section */}
            {productData?.nivoda_enabled && (
              <div className="mb-5 2xl:mb-6 border-t border-b border-gray-200 py-4 2xl:py-5">
                <div className="flex items-center justify-between mb-3 2xl:mb-4">
                  <h2 className="text-[10px] 2xl:text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider">
                    YOUR STONE
                  </h2>
                  <button
                    onClick={() => setExpandedSections({...expandedSections, yourStone: !expandedSections.yourStone})}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {expandedSections.yourStone ? <ChevronUp className="w-4 h-4 2xl:w-5 2xl:h-5" /> : <ChevronDown className="w-4 h-4 2xl:w-5 2xl:h-5" />}
                  </button>
                </div>

                {expandedSections.yourStone && (
                <div>

                {/* Stone Type */}
                {productData?.show_stone_type && (
                  <div className="mb-3 2xl:mb-4">
                    <div className="flex items-center justify-between mb-2 2xl:mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs 2xl:text-sm font-futura-pt text-gray-900 font-medium">Stone Type:</span>
                        <span className="text-[10px] 2xl:text-xs font-futura-pt text-[#D4A574] font-normal">
                          {stoneOptions.stoneType.find(st => st.value === selectedStoneType)?.label}
                        </span>
                      </div>
                      <button onClick={() => toggleStoneOption('stoneType')} className="text-gray-600">
                        {expandedStoneOptions.stoneType ? <Minus className="w-4 h-4 2xl:w-5 2xl:h-5" /> : <Plus className="w-4 h-4 2xl:w-5 2xl:h-5" />}
                      </button>
                    </div>
                    {expandedStoneOptions.stoneType && (
                      <div className="flex space-x-2 2xl:space-x-2">
                        {stoneOptions.stoneType.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleStoneTypeSelect(option.value as 'natural' | 'lab-grown')}
                            className={`px-3 2xl:px-4 py-1.5 2xl:py-2 text-[10px] 2xl:text-xs font-futura-pt font-light border transition-all ${
                              selectedStoneType === option.value
                                ? 'bg-[#F5EFE6] border-gray-400 text-gray-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Carat */}
                {productData?.show_carat && (
                  <div className="mb-3 2xl:mb-4">
                    <div className="flex items-center justify-between mb-2 2xl:mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs 2xl:text-sm font-futura-pt text-gray-900 font-medium">Carat:</span>
                        <span className="text-[10px] 2xl:text-xs font-futura-pt text-[#D4A574] font-normal">{selectedCarat}</span>
                      </div>
                      <button onClick={() => toggleStoneOption('carat')} className="text-gray-600">
                        {expandedStoneOptions.carat ? <Minus className="w-4 h-4 2xl:w-5 2xl:h-5" /> : <Plus className="w-4 h-4 2xl:w-5 2xl:h-5" />}
                      </button>
                    </div>
                    {expandedStoneOptions.carat && (
                      <div className="flex space-x-2 2xl:space-x-2 flex-wrap gap-2 2xl:gap-2">
                        {stoneOptions.carat.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleCaratSelect(option.value)}
                            className={`px-3 2xl:px-4 py-1.5 2xl:py-2 text-[10px] 2xl:text-xs font-futura-pt font-light border transition-all ${
                              selectedCarat === option.value
                                ? 'bg-[#F5EFE6] border-gray-400 text-gray-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Clarity */}
                {productData?.show_clarity && (
                  <div className="mb-3 2xl:mb-4">
                    <div className="flex items-center justify-between mb-2 2xl:mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs 2xl:text-sm font-futura-pt text-gray-900 font-medium">Clarity:</span>
                        <span className="text-[10px] 2xl:text-xs font-futura-pt text-[#D4A574] font-normal">{selectedClarity}</span>
                      </div>
                      <button onClick={() => toggleStoneOption('clarity')} className="text-gray-600">
                        {expandedStoneOptions.clarity ? <Minus className="w-4 h-4 2xl:w-5 2xl:h-5" /> : <Plus className="w-4 h-4 2xl:w-5 2xl:h-5" />}
                      </button>
                    </div>
                    {expandedStoneOptions.clarity && (
                      <div className="flex space-x-2 2xl:space-x-2 flex-wrap gap-2 2xl:gap-2">
                        {stoneOptions.clarity.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleClaritySelect(option.value)}
                            className={`px-3 2xl:px-4 py-1.5 2xl:py-2 text-[10px] 2xl:text-xs font-futura-pt font-light border transition-all ${
                              selectedClarity === option.value
                                ? 'bg-[#F5EFE6] border-gray-400 text-gray-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Colour */}
                {productData?.show_colour && (
                  <div className="mb-3 2xl:mb-4">
                    <div className="flex items-center justify-between mb-2 2xl:mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs 2xl:text-sm font-futura-pt text-gray-900 font-medium">Colour:</span>
                        <span className="text-[10px] 2xl:text-xs font-futura-pt text-[#D4A574] font-normal">{selectedColour}</span>
                      </div>
                      <button onClick={() => toggleStoneOption('colour')} className="text-gray-600">
                        {expandedStoneOptions.colour ? <Minus className="w-4 h-4 2xl:w-5 2xl:h-5" /> : <Plus className="w-4 h-4 2xl:w-5 2xl:h-5" />}
                      </button>
                    </div>
                    {expandedStoneOptions.colour && (
                      <div className="flex space-x-2 2xl:space-x-2 flex-wrap gap-2 2xl:gap-2">
                        {stoneOptions.colour.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleColourSelect(option.value)}
                            className={`px-3 2xl:px-4 py-1.5 2xl:py-2 text-[10px] 2xl:text-xs font-futura-pt font-light border transition-all ${
                              selectedColour === option.value
                                ? 'bg-[#F5EFE6] border-gray-400 text-gray-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cut */}
                {productData?.show_cut && (
                  <div className="mb-3 2xl:mb-4">
                    <div className="flex items-center justify-between mb-2 2xl:mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs 2xl:text-sm font-futura-pt text-gray-900 font-medium">Cut:</span>
                        <span className="text-[10px] 2xl:text-xs font-futura-pt text-[#D4A574] font-normal">{selectedCut}</span>
                      </div>
                      <button onClick={() => toggleStoneOption('cut')} className="text-gray-600">
                        {expandedStoneOptions.cut ? <Minus className="w-4 h-4 2xl:w-5 2xl:h-5" /> : <Plus className="w-4 h-4 2xl:w-5 2xl:h-5" />}
                      </button>
                    </div>
                    {expandedStoneOptions.cut && (
                      <div className="flex space-x-2 2xl:space-x-3 flex-wrap gap-2 2xl:gap-3">
                        {stoneOptions.cut.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleCutSelect(option.value)}
                            className={`px-4 2xl:px-5 py-2 2xl:py-2.5 text-xs 2xl:text-sm font-futura-pt font-light border transition-all ${
                              selectedCut === option.value
                                ? 'bg-[#F5EFE6] border-gray-400 text-gray-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Dynamic Price Summary - Nivoda */}
                {productData?.nivoda_enabled && (
                  <div className="mb-4 2xl:mb-5 p-3 2xl:p-4 bg-amber-50 border border-amber-200 rounded">
                    {nivodaPriceLoading && (
                      <div className="text-sm 2xl:text-base font-futura-pt text-gray-700 animate-pulse">
                        Calculating price for your selection...
                      </div>
                    )}
                    {nivodaPrice && !nivodaPriceLoading && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs 2xl:text-sm font-futura-pt text-gray-700">Selected Price Range:</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs 2xl:text-sm font-futura-pt">
                            <span className="text-gray-600">Starting from:</span>
                            <span className="font-medium text-gray-900">£{nivodaPrice.min.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs 2xl:text-sm font-futura-pt">
                            <span className="text-gray-600">Average:</span>
                            <span className="font-medium text-[#D4A574]">£{nivodaPrice.avg.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs 2xl:text-sm font-futura-pt">
                            <span className="text-gray-600">Up to:</span>
                            <span className="font-medium text-gray-900">£{nivodaPrice.max.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {nivodaPriceError && (
                      <div className="text-xs 2xl:text-sm font-futura-pt text-red-600">
                        {nivodaPriceError}
                      </div>
                    )}
                  </div>
                )}

                {/* Certificate */}
                {productData?.show_certificate && productData?.certificate && (
                  <div className="mb-4 2xl:mb-5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs 2xl:text-sm font-futura-pt text-gray-700">Certificate:</span>
                      <span className="text-xs 2xl:text-sm font-futura-pt text-gray-900 font-medium">{productData.certificate}</span>
                    </div>
                  </div>
                )}
                </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 2xl:space-y-3 mb-5 2xl:mb-6">
              <Button
                onClick={handleAddToCart}
                disabled={isLoading}
                className={`w-full h-12 2xl:h-13 font-futura-pt font-normal uppercase tracking-wider text-sm 2xl:text-base border-0 transition-all duration-300 relative overflow-hidden ${
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
                className="w-full h-12 2xl:h-13 border border-gray-300 hover:border-gray-800 text-gray-900 font-futura-pt font-normal uppercase tracking-wider text-sm 2xl:text-base bg-white"
              >
                Enquire
              </Button>
            </div>

            {/* Add to Wishlist */}
            <div className="text-center mb-6 2xl:mb-8">
              <button className="flex items-center justify-center w-full text-gray-600 hover:text-gray-900 transition-colors">
                <Heart className="w-5 h-5 2xl:w-6 2xl:h-6 mr-2" />
                <span className="font-futura-pt text-base 2xl:text-lg">Add to Wishlist</span>
              </button>
            </div>

            {/* Contact Options */}
            <div className="grid grid-cols-3 gap-4 2xl:gap-6 pt-5 2xl:pt-7 border-t border-gray-200">
              <div className="text-center group cursor-pointer">
                <div className="w-14 h-14 2xl:w-16 2xl:h-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300 hover:shadow-md hover:scale-105 border border-amber-100">
                  <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-xs 2xl:text-sm font-futura-pt font-light text-gray-900 uppercase tracking-[0.15em] leading-tight">
                  Book An
                </div>
                <div className="text-xs 2xl:text-sm font-futura-pt font-light text-gray-900 uppercase tracking-[0.15em] leading-tight">
                  Appointment
                </div>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="w-14 h-14 2xl:w-16 2xl:h-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300 hover:shadow-md hover:scale-105 border border-amber-100">
                  <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="text-xs 2xl:text-sm font-futura-pt font-light text-gray-900 uppercase tracking-[0.15em] leading-tight">
                  Order By Phone
                </div>
              </div>

              <div className="text-center group cursor-pointer">
                <div className="w-14 h-14 2xl:w-16 2xl:h-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300 hover:shadow-md hover:scale-105 border border-amber-100">
                  <svg className="w-6 h-6 2xl:w-7 2xl:h-7 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="text-xs 2xl:text-sm font-futura-pt font-light text-gray-900 uppercase tracking-[0.15em] leading-tight">
                  Drop A Hint
                </div>
              </div>
            </div>

            {/* Expandable Information Sections */}
            <div className="space-y-0 pt-5 2xl:pt-6">
              {/* About This Piece */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('about')}
                  className="w-full flex items-center justify-between py-3 2xl:py-4 text-left group"
                >
                  <h3 className="text-xs 2xl:text-sm font-futura-pt font-normal text-gray-900 uppercase tracking-[0.2em]">
                    About This Piece
                  </h3>
                  <ChevronDown className={`w-4 h-4 2xl:w-5 2xl:h-5 text-amber-700 transition-all duration-300 ease-in-out group-hover:text-amber-900 ${
                    expandedSections.about ? 'rotate-180' : 'rotate-0'
                  }`} strokeWidth="2" />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSections.about
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-3 2xl:pb-4">
                    <p className="text-sm 2xl:text-base font-futura-pt font-light text-gray-700 leading-relaxed mb-3">
                      {productData.description}
                    </p>
                    <button className="text-xs 2xl:text-sm font-futura-pt text-amber-700 hover:text-amber-900 transition-colors">
                      Read More →
                    </button>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('delivery')}
                  className="w-full flex items-center justify-between py-3 2xl:py-4 text-left group"
                >
                  <h3 className="text-xs 2xl:text-sm font-futura-pt font-normal text-gray-900 uppercase tracking-[0.2em]">
                    Delivery Information
                  </h3>
                  <ChevronDown className={`w-4 h-4 2xl:w-5 2xl:h-5 text-amber-700 transition-all duration-300 ease-in-out group-hover:text-amber-900 ${
                    expandedSections.delivery ? 'rotate-180' : 'rotate-0'
                  }`} strokeWidth="2" />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSections.delivery
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-3 2xl:pb-4">
                    <p className="text-sm 2xl:text-base font-futura-pt font-light text-gray-700 leading-relaxed">
                      Free worldwide delivery on all orders. Express delivery options available.
                    </p>
                  </div>
                </div>
              </div>

              {/* Complimentary Insurance */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('insurance')}
                  className="w-full flex items-center justify-between py-3 2xl:py-4 text-left group"
                >
                  <h3 className="text-xs 2xl:text-sm font-futura-pt font-normal text-gray-900 uppercase tracking-[0.2em]">
                    Complimentary Insurance
                  </h3>
                  <ChevronDown className={`w-4 h-4 2xl:w-5 2xl:h-5 text-amber-700 transition-all duration-300 ease-in-out group-hover:text-amber-900 ${
                    expandedSections.insurance ? 'rotate-180' : 'rotate-0'
                  }`} strokeWidth="2" />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedSections.insurance
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-3 2xl:pb-4">
                    <p className="text-sm 2xl:text-base font-futura-pt font-light text-gray-700 leading-relaxed">
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
                      autoPlay
                      loop
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
              {isVideoFile(displayImages[lightboxImageIndex]?.url) ? (
                <video
                  src={displayImages[lightboxImageIndex]?.url}
                  controls
                  autoPlay
                  muted
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: '80vh', maxWidth: '80vw' }}
                />
              ) : (
                <img
                  src={displayImages[lightboxImageIndex]?.url}
                  alt={displayImages[lightboxImageIndex]?.alt || productData.name}
                  className="max-w-full max-h-full object-contain"
                  style={{ maxHeight: '80vh', maxWidth: '80vw' }}
                />
              )}
            </div>
          </div>

          {/* Navigation Arrows - Bottom Positioned */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
              <button
                onClick={() => goToLightboxImage((lightboxImageIndex - 1 + displayImages.length) % displayImages.length)}
                className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button
                onClick={() => goToLightboxImage((lightboxImageIndex + 1) % displayImages.length)}
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
                <h2 className="text-2xl lg:text-3xl font-futura-pt font-light text-gray-900 mb-2">
                  Experience McCulloch Excellence
                </h2>
                <p className="text-sm font-futura-pt text-gray-600 italic">
                  Where craftsmanship meets distinction since 1847
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="font-futura-pt text-sm text-gray-700">Private Consultation</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-yellow-600" />
                  <span className="font-futura-pt text-sm text-gray-700">+94 11 2 555 555</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-4 h-4 text-yellow-600" />
                  <span className="font-futura-pt text-sm text-gray-700">Live Consultation</span>
                </div>
              </div>
            </div>

            {/* Right Column - Clean Service List */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-futura-pt font-medium text-gray-900 mb-2">
                  Our Promise to You
                </h3>
                <div className="w-12 h-px bg-yellow-400"></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="font-futura-pt text-sm text-gray-700">WHITE GLOVE DELIVERY</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="font-futura-pt text-sm text-gray-700">SIGNATURE PRESENTATION</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="font-futura-pt text-sm text-gray-700">ETHICAL EXCELLENCE</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="font-futura-pt text-sm text-gray-700">SIZING EXPERTISE</span>
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
              <h2 className="text-2xl lg:text-3xl font-futura-pt font-light text-gray-900">
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
                    <h3 className="font-futura-pt text-gray-900 text-base lg:text-lg leading-tight">
                      {product.name}
                    </h3>
                    <p className="font-futura-pt text-gray-600 text-sm lg:text-base">
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