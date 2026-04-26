
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Heart, Phone, MessageCircle, ChevronDown, ChevronUp, Plus, X, Minus, ZoomIn, ZoomOut, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import LuxuryNavigationWhite from '@/components/LuxuryNavigationWhite';
import { FooterSection } from '@/components/FooterSection';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL, { getMediaUrl } from '../config/api';
import { trackViewContent, trackAddToCart } from '../services/pixelService';
import { useCountry } from '../hooks/useCountry';

const metalTypeOptions = [
  { value: 'silver',           label: 'Silver',           overrideKey: 'silver'          },
  { value: '9ct-white-gold',   label: '9ct White Gold',   overrideKey: 'gold_9kt'        },
  { value: '9ct-yellow-gold',  label: '9ct Yellow Gold',  overrideKey: 'gold_9kt_yellow' },
  { value: '9ct-rose-gold',    label: '9ct Rose Gold',    overrideKey: 'gold_9kt_rose'   },
  { value: '14ct-white-gold',  label: '14ct White Gold',  overrideKey: 'gold_14kt'       },
  { value: '14ct-yellow-gold', label: '14ct Yellow Gold', overrideKey: 'gold_14kt_yellow'},
  { value: '14ct-rose-gold',   label: '14ct Rose Gold',   overrideKey: 'gold_14kt_rose'  },
  { value: '18ct-white-gold',  label: '18ct White Gold',  overrideKey: 'gold_18kt'       },
  { value: '18ct-yellow-gold', label: '18ct Yellow Gold', overrideKey: 'gold_18kt_yellow'},
  { value: '18ct-rose-gold',   label: '18ct Rose Gold',   overrideKey: 'gold_18kt_rose'  },
  { value: 'platinum',         label: 'Platinum',         overrideKey: 'platinum'        },
];

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

const ProductDetail = () => {
  const { productId } = useParams();
  const location = useLocation();
  const isEngagementRing = location.pathname.includes('engagement-ring');
  const [selectedMetal, setSelectedMetal] = useState('platinum');
  const [selectedMetalType, setSelectedMetalType] = useState('');
  const [selectedDiamondSize, setSelectedDiamondSize] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState('L');
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { countryCode: userCountry, countryName: userCountryName } = useCountry();

  // Nivoda Stone Selection States
  const [selectedStoneType, setSelectedStoneType] = useState<'natural' | 'lab-grown'>('natural');
  const [selectedCarat, setSelectedCarat] = useState('');
  const [selectedClarity, setSelectedClarity] = useState('');
  const [selectedColour, setSelectedColour] = useState('');
  const [selectedCut, setSelectedCut] = useState('');
  const [selectedPolish, setSelectedPolish] = useState('');
  const [selectedSymmetry, setSelectedSymmetry] = useState('');
  const [selectedFluorescence, setSelectedFluorescence] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState('');

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

  // Use global cart context
  const { addToCart } = useCart();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Custom video player states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showVideoControls, setShowVideoControls] = useState(true);

  // Track if ViewContent pixel event has been fired
  const viewContentFired = useRef(false);

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
  // Carousel swipe state
  const [carouselDragStart, setCarouselDragStart] = useState<number | null>(null);
  const [carouselDragOffset, setCarouselDragOffset] = useState(0);
  const [carouselDragging, setCarouselDragging] = useState(false);
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

  // Helper function to filter images and videos by selected metal AND diamond size
  const getMetalSpecificMedia = (allImages: any[], selectedMetalId: string, selectedDiamondSizeId?: string) => {
    if (!allImages || allImages.length === 0) return [];

    // Videos always show regardless of metal selection
    const videos = allImages.filter(img => img.type === 'video');

    // If diamond size is selected, try to get images for both metal AND diamond size
    if (selectedDiamondSizeId) {
      const metalAndDiamondImages = allImages.filter(img =>
        img.metal_id === selectedMetalId && img.diamond_size_id === selectedDiamondSizeId
      );
      if (metalAndDiamondImages.length > 0) return [...metalAndDiamondImages, ...videos];

      // Fallback: try diamond size only (no specific metal)
      const diamondOnlyImages = allImages.filter(img =>
        !img.metal_id && img.diamond_size_id === selectedDiamondSizeId
      );
      if (diamondOnlyImages.length > 0) return [...diamondOnlyImages, ...videos];
    }

    // Try metal-specific images (exclude videos and diamond-size specific)
    const metalSpecificImages = allImages.filter(img =>
      img.metal_id === selectedMetalId && !img.diamond_size_id && img.type !== 'video'
    );
    if (metalSpecificImages.length > 0) return [...metalSpecificImages, ...videos];

    // Fallback: show first available metal's images + videos (never show only the video)
    const firstMetalId = allImages.find(img => img.metal_id && !img.diamond_size_id && img.type !== 'video')?.metal_id;
    const fallbackImages = firstMetalId
      ? allImages.filter(img => img.metal_id === firstMetalId && !img.diamond_size_id && img.type !== 'video')
      : [];
    return [...fallbackImages, ...videos];
  };

  // Helper function to get the primary image for a specific metal
  const getMetalThumbnail = (metalId: string) => {
    if (!productData || !productData.images) return null;

    // First try to get metal-specific image marked as preview
    const metalPreviewImage = productData.images.find((img: any) => img.metal_id === metalId && img.is_metal_preview);
    if (metalPreviewImage) return metalPreviewImage;

    // Fall back to first metal-specific image for this metal (prefer non-diamond-size images)
    const metalGeneralImage = productData.images.find((img: any) => img.metal_id === metalId && !img.diamond_size_id);
    if (metalGeneralImage) return metalGeneralImage;

    // Fall back to first metal-specific image (including diamond size images)
    const metalAnyImage = productData.images.find((img: any) => img.metal_id === metalId);
    if (metalAnyImage) return metalAnyImage;

    // No metal-specific image found — return null so this metal is hidden from the thumbnail strip
    return null;
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
        carat: allCarats.map(c => ({ value: c.toFixed(2), label: `${c.toFixed(2)} ct` })),
        clarity: ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2'].map(c => ({ value: c, label: c })),
        colour: ['D','E','F','G','H','I','J','K'].map(c => ({ value: c, label: c })),
        cut: ['Excellent','Very Good','Good','Fair'].map(c => ({ value: c, label: c }))
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
      })),
      polish: (config.polishOptions || []).map(p => ({ value: p, label: p })),
      symmetry: (config.symmetryOptions || []).map(s => ({ value: s, label: s })),
      fluorescence: (config.fluorescenceOptions || []).map(f => ({
        value: f,
        label: f === 'NONE' ? 'None' : f === 'VERY_STRONG' ? 'Very Strong' : f.charAt(0) + f.slice(1).toLowerCase()
      })),
      certificate: (config.certificateOptions || []).map((c: string) => ({ value: c, label: c })),
    };
  };

  const stoneOptions = buildStoneOptions();

  // Fetch price from Nivoda API based on selected specs
  const fetchNivodaPrice = useCallback(async (carat?: string, clarity?: string, colour?: string, cut?: string) => {
    if (!productData?.nivoda_enabled) return;
    if (!carat || !clarity || !colour || !cut) return;

    setNivodaPriceLoading(true);
    setNivodaPriceError(null);

    try {
      const config = productData.nivoda_options_config;
      const params = new URLSearchParams({ carat, clarity, color: colour, cut });

      params.set('stoneType', selectedStoneType);
      const shapeName = productData.stone_shapes?.[0]?.name;
      if (shapeName) params.set('shape', shapeName);
      if (selectedPolish) params.set('polish', selectedPolish);
      if (selectedSymmetry) params.set('symmetry', selectedSymmetry);
      if (selectedFluorescence) params.set('fluorescence', selectedFluorescence);
      // Use customer-selected cert if available, else fall back to all configured certs
      const certs = config?.certificateOptions || [];
      if (selectedCertificate) params.set('certificate', selectedCertificate);
      else if (certs.length) params.set('certificate', certs.join(','));

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
  }, [productData, selectedStoneType, selectedPolish, selectedSymmetry, selectedFluorescence, selectedCertificate]);

  // Mount price parsed from base_price field (the ring without diamond)
  const mountPrice = (() => {
    if (!productData?.price) return 0;
    return parseFloat(productData.price.replace(/[^\d.,]/g, '').replace(/,/g, '')) || 0;
  })();

  // Live price from ring price overrides based on selected metal type
  const liveMountPrice = (() => {
    const overrides = productData?.ring_price_overrides;
    if (!overrides || !selectedMetalType) return null;
    const opt = metalTypeOptions.find(m => m.value === selectedMetalType);
    if (!opt) return null;
    const v = overrides[opt.overrideKey];
    return v ? parseFloat(v) : null;
  })();

  // Calculate total price = mount price + diamond price
  const calculateTotalPrice = () => {
    const base = liveMountPrice ?? mountPrice;
    if (productData?.nivoda_enabled && nivodaPrice) {
      return base + nivodaPrice.min;
    }
    return base;
  };

  // Display price for non-Nivoda products (updates when metal type changes)
  const displayPrice = (() => {
    if (liveMountPrice !== null) {
      return `£${liveMountPrice.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return productData?.price || '';
  })();

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

          // Set initial metal selection to first metal that has images, else first available
          if (data.data.product.available_metals && data.data.product.available_metals.length > 0) {
            const imgs = data.data.product.images || [];
            const firstWithImages = data.data.product.available_metals.find((m: any) =>
              imgs.some((img: any) => img.metal_id === m.id)
            );
            setSelectedMetal(firstWithImages ? firstWithImages.id : data.data.product.available_metals[0].id);
          }

          // Set initial metal type to first option that has a price override (preferring 18kt gold)
          const overrides = data.data.product.ring_price_overrides;
          if (overrides) {
            const preferred = ['18ct-white-gold', '14ct-white-gold', '9ct-white-gold', 'platinum', 'silver'];
            const first = preferred.find(v => {
              const opt = metalTypeOptions.find(m => m.value === v);
              return opt && overrides[opt.overrideKey];
            });
            if (first) setSelectedMetalType(first);
          }

          // Set initial diamond size selection to first available diamond size (for Engagement Rings)
          if (data.data.product.available_diamond_sizes && data.data.product.available_diamond_sizes.length > 0) {
            setSelectedDiamondSize(data.data.product.available_diamond_sizes[0].id);
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
    if (!productData) return;

    const config = productData.nivoda_options_config;
    const defaults = config?.defaultSpecs;

    if (productData.nivoda_enabled && config) {
      if (config.stoneType) setSelectedStoneType(config.stoneType);

      // Prefer admin-configured defaultSpecs, fall back to first/middle option
      const carat = defaults?.carat || (config.caratRange
        ? config.caratRange.min.toFixed(2)
        : '');
      if (carat) setSelectedCarat(carat);

      const clarity = defaults?.clarity || (config.clarityOptions?.[0] ?? '');
      if (clarity) setSelectedClarity(clarity);

      const colour = defaults?.colour || (config.colourOptions?.[0] ?? '');
      if (colour) setSelectedColour(colour);

      const cut = defaults?.cut || (config.cutOptions?.[0] ?? '');
      if (cut) setSelectedCut(cut);

      const polish = (defaults as any)?.polish || (config.polishOptions?.[0] ?? '');
      if (polish) setSelectedPolish(polish);
      const symmetry = (defaults as any)?.symmetry || (config.symmetryOptions?.[0] ?? '');
      if (symmetry) setSelectedSymmetry(symmetry);
      const fluorescence = (defaults as any)?.fluorescence || (config.fluorescenceOptions?.[0] ?? '');
      if (fluorescence) setSelectedFluorescence(fluorescence);
    } else if (isEngagementRing) {
      // Non-Nivoda engagement ring: initialise with lowest-cost defaults so section isn't blank
      setSelectedCarat('0.50');
      setSelectedClarity('SI2');
      setSelectedColour('J');
      setSelectedCut('Good');
    }
  }, [productData?.id, productData?.nivoda_enabled, isEngagementRing]);

  // Fetch price when any selection changes
  useEffect(() => {
    if (productData?.nivoda_enabled && selectedCarat && selectedClarity && selectedColour && selectedCut) {
      console.log('Fetching Nivoda price for:', { selectedCarat, selectedClarity, selectedColour, selectedCut });
      fetchNivodaPrice(selectedCarat, selectedClarity, selectedColour, selectedCut);
    }
  }, [selectedCarat, selectedClarity, selectedColour, selectedCut, selectedPolish, selectedSymmetry, selectedFluorescence, selectedCertificate, selectedStoneType, productData?.nivoda_enabled, fetchNivodaPrice]);

  // Facebook Pixel: Track ViewContent when product loads
  useEffect(() => {
    if (productData && !viewContentFired.current) {
      // Parse price value from string (e.g., "£2,500" -> 2500)
      const priceString = productData.price?.replace(/[^\d.,]/g, '').replace(/,/g, '') || '0';
      const priceValue = parseFloat(priceString) || 0;

      trackViewContent({
        content_name: productData.name,
        content_ids: [productData.id],
        content_type: 'product',
        value: priceValue,
        currency: 'GBP',
      });

      viewContentFired.current = true;
    }
  }, [productData]);

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

  const handlePolishSelect = (value: string) => setSelectedPolish(value);
  const handleSymmetrySelect = (value: string) => setSelectedSymmetry(value);
  const handleFluorescenceSelect = (value: string) => setSelectedFluorescence(value);

  const handleAddToCart = () => {
    // Start loading animation
    setIsLoading(true);

    // Simulate adding to cart process
    setTimeout(() => {
      // Get the metal name from selected metal ID
      const selectedMetalName = productData?.available_metals?.find(
        (metal: any) => metal.id === selectedMetal
      )?.name || 'Platinum';

      // Get the size label from selected size code
      const selectedSizeLabel = ringSizes.find(
        (size) => size.value === selectedSize
      )?.label || selectedSize;

      // Get diamond size name if selected
      const selectedDiamondSizeName = productData?.available_diamond_sizes?.find(
        (ds: any) => ds.id === selectedDiamondSize
      )?.name || null;

      // Build selected options object with all customizations
      const selectedOptions: any = {
        metal: selectedMetalName,
        size: selectedSizeLabel
      };

      if (selectedDiamondSizeName) {
        selectedOptions.diamondSize = selectedDiamondSizeName;
      }

      // Include Nivoda stone options if enabled
      if (productData?.nivoda_enabled) {
        selectedOptions.stoneType = selectedStoneType;
        selectedOptions.carat = selectedCarat;
        selectedOptions.clarity = selectedClarity;
        selectedOptions.colour = selectedColour;
        selectedOptions.cut = selectedCut;
      }

      const imageUrl = displayImages[0]?.url || productData.images[0]?.url;

      const newItem: any = {
        id: productData.id,
        slug: productData.slug,
        name: productData.name,
        price: productData.price,
        metal: selectedMetalName,
        size: selectedSizeLabel,
        diamondSize: selectedDiamondSizeName,
        image: imageUrl ? getMediaUrl(imageUrl) : '',
        type: 'jewelry',  // Mark as jewelry product for order ID system
        selectedOptions: selectedOptions
      };

      // Include Nivoda price information if available
      if (productData?.nivoda_enabled) {
        newItem.nivodaPrice = nivodaPrice; // { min, avg, max }
        newItem.totalPrice = calculateTotalPrice(); // Uses Nivoda API price (avg) when available
      }

      // Calculate price for pixel tracking
      const priceForTracking = productData?.nivoda_enabled && nivodaPrice
        ? nivodaPrice.avg
        : parseFloat(productData.price?.replace(/[^\d.,]/g, '').replace(/,/g, '') || '0');

      // Facebook Pixel: Track AddToCart event
      trackAddToCart({
        content_name: productData.name,
        content_ids: [productData.id],
        content_type: 'product',
        value: priceForTracking,
        currency: 'GBP',
        contents: [{
          id: productData.id,
          quantity: 1,
          item_price: priceForTracking,
        }],
      });

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

  // Video player control functions
  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleVideoMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted;
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleVideoSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
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

  // Touch handlers for swipe functionality (recommendations)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextRecommendation();
    if (distance < -50) prevRecommendation();
  };

  // Carousel swipe handlers
  const handleCarouselTouchStart = (e: React.TouchEvent) => {
    setCarouselDragStart(e.targetTouches[0].clientX);
    setCarouselDragOffset(0);
    setCarouselDragging(true);
  };

  const handleCarouselTouchMove = (e: React.TouchEvent) => {
    if (carouselDragStart === null) return;
    setCarouselDragOffset(e.targetTouches[0].clientX - carouselDragStart);
  };

  const handleCarouselTouchEnd = () => {
    if (carouselDragOffset < -50) nextImage();
    else if (carouselDragOffset > 50) prevImage();
    setCarouselDragOffset(0);
    setCarouselDragStart(null);
    setCarouselDragging(false);
  };

  // Sync metal thumbnail → metal type (price)
  const handleMetalThumbnailClick = (metalId: string) => {
    setSelectedMetal(metalId);
    const metal = productData?.available_metals?.find((m: any) => m.id === metalId);
    if (!metal) return;
    const overrides = productData?.ring_price_overrides;
    if (!overrides) return;
    const nameLower = (metal.name || '').toLowerCase();
    let color: string | null = null;
    if (nameLower.includes('yellow')) color = 'yellow';
    else if (nameLower.includes('rose')) color = 'rose';
    else if (nameLower.includes('white')) color = 'white';
    let newValue: string | null = null;
    if (nameLower === 'silver') {
      newValue = 'silver';
    } else if (nameLower === 'platinum') {
      newValue = 'platinum';
    } else if (color) {
      // Keep same karat, swap color
      const currentOpt = metalTypeOptions.find(m => m.value === selectedMetalType);
      const karat = currentOpt?.value.replace(/-white-gold|-yellow-gold|-rose-gold/, '') || '18ct';
      const candidate = `${karat}-${color}-gold`;
      const candidateOpt = metalTypeOptions.find(m => m.value === candidate);
      if (candidateOpt && overrides[candidateOpt.overrideKey]) {
        newValue = candidate;
      } else {
        // Fall back to any option for this color that has a price
        const fallback = metalTypeOptions.find(m => m.value.includes(`-${color}-gold`) && overrides[m.overrideKey]);
        newValue = fallback?.value || null;
      }
    }
    if (newValue) setSelectedMetalType(newValue);
  };

  // Sync metal type button → metal thumbnail (image)
  const handleMetalTypeClick = (value: string) => {
    setSelectedMetalType(value);
    if (!productData?.available_metals) return;
    let colorKeyword: string | null = null;
    if (value.includes('yellow')) colorKeyword = 'yellow';
    else if (value.includes('rose')) colorKeyword = 'rose';
    else if (value.includes('white')) colorKeyword = 'white';
    else if (value === 'silver') colorKeyword = 'silver';
    else if (value === 'platinum') colorKeyword = 'platinum';
    if (!colorKeyword) return;
    const match = productData.available_metals.find((m: any) => {
      const name = (m.name || '').toLowerCase();
      return name.includes(colorKeyword!);
    });
    if (match) {
      const img = getMetalThumbnail(match.id);
      if (img?.url) setSelectedMetal(match.id);
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
  const displayImages = productData ? getMetalSpecificMedia(productData.images || [], selectedMetal, selectedDiamondSize || undefined) : [];

  return (
    <div className="min-h-screen bg-white">
      <LuxuryNavigationWhite />

      {/* Mobile Breadcrumb - Above Image */}
      <nav className="block lg:hidden w-full px-4 py-3 bg-white border-b border-gray-200 relative z-30 overflow-x-auto" style={{marginTop: '120px'}}>
        <div className="flex items-center gap-2 text-xs text-gray-700 font-futura-pt whitespace-nowrap font-normal">
          <Link to="/" className="hover:text-gray-900 flex-shrink-0">Home</Link>
          {productData.breadcrumbs && productData.breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span className="text-gray-500 flex-shrink-0">›</span>
              <Link
                to={crumb.href}
                className={`hover:text-gray-900 flex-shrink-0 ${index === productData.breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-700'}`}
              >
                {crumb.name}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </nav>

      {/* Mobile Image Carousel - Full Width, Large & Clean */}
      <div className="block lg:hidden w-full bg-white">
        <div className="relative w-full overflow-hidden" style={{ height: '450px' }}>

          {/* Sliding strip — all images side by side */}
          <div
            className="flex h-full"
            style={{
              transform: `translateX(calc(-${currentImageIndex * 100}% + ${carouselDragOffset}px))`,
              transition: carouselDragging ? 'none' : 'transform 0.3s ease-out',
              willChange: 'transform',
            }}
            onTouchStart={handleCarouselTouchStart}
            onTouchMove={handleCarouselTouchMove}
            onTouchEnd={handleCarouselTouchEnd}
          >
            {displayImages.map((img, idx) => (
              <div key={idx} className="w-full flex-shrink-0 h-full">
                {isVideoFile(img?.url) ? (
                  <div
                    className="relative w-full h-full bg-black"
                    onClick={toggleVideoPlay}
                    onMouseEnter={() => setShowVideoControls(true)}
                    onMouseLeave={() => setShowVideoControls(false)}
                  >
                    <video
                      ref={idx === currentImageIndex ? videoRef : undefined}
                      src={getMediaUrl(img?.url || '')}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="w-full h-full object-cover"
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                    />
                    <div className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showVideoControls ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="flex-1 flex items-center justify-center">
                        <button
                          onClick={toggleVideoPlay}
                          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/30 hover:scale-110"
                        >
                          {isVideoPlaying ? (
                            <Pause className="w-8 h-8 text-white" fill="white" />
                          ) : (
                            <Play className="w-8 h-8 text-white ml-1" fill="white" />
                          )}
                        </button>
                      </div>
                      <div className="px-4 pb-4">
                        <div className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3" onClick={handleVideoSeek}>
                          <div className="h-full bg-white rounded-full transition-all duration-100" style={{ width: `${videoProgress}%` }} />
                        </div>
                        <div className="flex justify-end">
                          <button onClick={toggleVideoMute} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white/30">
                            {isVideoMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={getMediaUrl(img?.url || '')}
                    alt={img?.alt || productData.name}
                    className="w-full h-full object-cover cursor-pointer"
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    onClick={() => openLightbox(idx)}
                    draggable={false}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && !isVideoFile(displayImages[currentImageIndex]?.url) && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors z-10 shadow-md"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors z-10 shadow-md"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1.5 z-10">
            {displayImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-gray-900' : 'bg-gray-300 hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="w-full border-b border-gray-200" />
      </div>

      {/* Mobile Product Details Section */}
      <div className="block lg:hidden px-4 py-6 bg-white">
        <h1 className="text-3xl font-cormorant font-light text-gray-900 mb-2 leading-tight">
          {productData.name}
        </h1>
        <div className="text-xl font-futura-pt font-normal text-gray-900 mb-6">
          {displayPrice}
        </div>

        {/* Mobile Metal Selection */}
        {productData.available_metals && productData.available_metals.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2">
              Metal: {productData.available_metals.find(metal => metal.id === selectedMetal)?.name || productData.available_metals[0]?.name}
            </h3>
            <div className="flex space-x-2">
              {productData.available_metals.filter((metal) => {
                const img = getMetalThumbnail(metal.id);
                return img && img.url;
              }).map((metal) => {
                const metalImage = getMetalThumbnail(metal.id);
                return (
                  <button
                    key={metal.id}
                    onClick={() => handleMetalThumbnailClick(metal.id)}
                    className={`w-12 h-12 border transition-all overflow-hidden flex items-center justify-center bg-gray-100 ${
                      selectedMetal === metal.id ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    title={metal.name}
                  >
                    <img
                      src={getMediaUrl(metalImage!.url)}
                      alt={metal.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Metal Type Selection */}
        {(() => {
          const overrides = productData?.ring_price_overrides;
          const visibleOptions = overrides
            ? metalTypeOptions.filter((o, idx, arr) =>
                overrides[o.overrideKey] && arr.findIndex(x => x.overrideKey === o.overrideKey) === idx
              )
            : metalTypeOptions;
          if (visibleOptions.length === 0) return null;
          return (
        <div className="mb-4">
          <h3 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2">
            Metal Type: {metalTypeOptions.find(m => m.value === selectedMetalType)?.label || 'Select'}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {visibleOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleMetalTypeClick(option.value)}
                className={`flex-shrink-0 px-4 py-2 border transition-all font-futura-pt text-xs font-light ${
                  selectedMetalType === option.value
                    ? 'border-gray-800 bg-gray-100'
                    : 'border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
          );
        })()}

        {/* Mobile Diamond Size Selection - Only for Engagement Rings */}
        {productData.available_diamond_sizes && productData.available_diamond_sizes.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2">
              Diamond Size: {productData.available_diamond_sizes.find(ds => ds.id === selectedDiamondSize)?.display_name || productData.available_diamond_sizes.find(ds => ds.id === selectedDiamondSize)?.name || 'Select'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {productData.available_diamond_sizes.map((diamondSize) => (
                <button
                  key={diamondSize.id}
                  onClick={() => setSelectedDiamondSize(diamondSize.id)}
                  className={`px-4 py-2 border transition-all font-futura-pt text-sm font-medium ${
                    selectedDiamondSize === diamondSize.id
                      ? 'border-gray-800 bg-gray-100'
                      : 'border-gray-300 hover:border-gray-500'
                  }`}
                  title={diamondSize.display_name || `Size ${diamondSize.name}`}
                >
                  {diamondSize.name}
                </button>
              ))}
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
        {(productData?.nivoda_enabled || isEngagementRing) && (
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
                {(productData?.show_stone_type || isEngagementRing) && (
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
                        <button key={option.value} onClick={() => handleCutSelect(option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${selectedCut === option.value ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Polish */}
                {(stoneOptions as any).polish?.length > 0 && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Polish:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(stoneOptions as any).polish.map((option: any) => (
                        <button key={option.value} onClick={() => handlePolishSelect(option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${selectedPolish === option.value ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symmetry */}
                {(stoneOptions as any).symmetry?.length > 0 && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Symmetry:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(stoneOptions as any).symmetry.map((option: any) => (
                        <button key={option.value} onClick={() => handleSymmetrySelect(option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${selectedSymmetry === option.value ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fluorescence */}
                {(stoneOptions as any).fluorescence?.length > 0 && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Fluorescence:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(stoneOptions as any).fluorescence.map((option: any) => (
                        <button key={option.value} onClick={() => handleFluorescenceSelect(option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${selectedFluorescence === option.value ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificate */}
                {(stoneOptions as any).certificate?.length > 1 && (
                  <div>
                    <span className="text-xs font-futura-pt font-medium text-gray-900">Certificate Lab:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(stoneOptions as any).certificate.map((option: any) => (
                        <button key={option.value} onClick={() => setSelectedCertificate(prev => prev === option.value ? '' : option.value)}
                          className={`px-3 py-1 text-xs font-futura-pt border rounded transition-all ${selectedCertificate === option.value ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
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

        {/* Mobile Total Price — shown when diamond specs are selected */}
        {productData?.nivoda_enabled && (
          <div
            className={`mb-4 overflow-hidden transition-all duration-500 ease-out ${
              nivodaPrice && !nivodaPriceLoading ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {nivodaPrice && (
              <div className="p-4 bg-[#F5EFE6] border border-[#e8d5b7]">
                <p className="text-[10px] font-futura-pt uppercase tracking-wider text-gray-500 mb-3">Price Breakdown</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-futura-pt">
                    <span className="text-gray-500">Ring ({metalTypeOptions.find(m => m.value === selectedMetalType)?.label || 'Ring'})</span>
                    <span className="text-gray-700">£{(liveMountPrice ?? mountPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-futura-pt">
                    <span className="text-gray-500">Diamond (your specs)</span>
                    <span className="text-gray-700">£{nivodaPrice.min.toLocaleString()} – £{nivodaPrice.max.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-[#e8d5b7] pt-2 mt-1">
                    <div className="flex justify-between text-sm font-futura-pt font-medium">
                      <span className="text-gray-900">Total (from)</span>
                      <span className="text-[#D4A574]">£{((liveMountPrice ?? mountPrice) + nivodaPrice.min).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {nivodaPriceLoading && (
          <div className="mb-4 px-4 py-3 bg-[#F5EFE6] border border-[#e8d5b7]">
            <p className="text-xs font-futura-pt text-gray-500 animate-pulse uppercase tracking-wider">Calculating price…</p>
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

        {/* Mobile Expandable Information Sections */}
        <div className="space-y-0 pt-4">
          {/* About This Piece */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('about')}
              className="w-full flex items-center justify-between py-3 text-left group"
            >
              <h3 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-[0.2em]">
                About This Piece
              </h3>
              <ChevronDown className={`w-4 h-4 text-amber-700 transition-all duration-300 ease-in-out group-hover:text-amber-900 ${
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
              <div className="pb-3">
                <p className="text-sm font-futura-pt font-light text-gray-700 leading-relaxed mb-3">
                  {productData.description}
                </p>
                {productData.is_made_on_request && (
                  <div className="mt-4 mb-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-futura-pt font-medium text-amber-800 uppercase tracking-wider mb-1">
                          Made to Order
                        </h4>
                        <p className="text-sm font-futura-pt font-light text-amber-700 leading-relaxed">
                          This exquisite piece is crafted specially for you. Please allow approximately{' '}
                          <span className="font-medium">{productData.made_on_request_lead_time || '4-6 weeks'}</span>{' '}
                          for creation and delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <button className="text-xs font-futura-pt text-amber-700 hover:text-amber-900 transition-colors">
                  Read More →
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('delivery')}
              className="w-full flex items-center justify-between py-3 text-left group"
            >
              <h3 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-[0.2em]">
                Delivery Information
              </h3>
              <ChevronDown className={`w-4 h-4 text-amber-700 transition-all duration-300 ease-in-out group-hover:text-amber-900 ${
                expandedSections.delivery ? 'rotate-180' : 'rotate-0'
              }`} strokeWidth="2" />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedSections.delivery
                  ? 'max-h-[500px] opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pb-3 space-y-4">
                {productData.is_made_on_request && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-futura-pt font-medium text-amber-800 mb-1">Made to Order</h4>
                        <p className="text-sm font-futura-pt font-light text-amber-700 leading-relaxed">
                          Please allow approximately{' '}
                          <span className="font-medium">{productData.made_on_request_lead_time || '4-6 weeks'}</span>{' '}
                          for creation and delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm font-futura-pt font-light text-gray-700 leading-relaxed">
                  {productData.is_made_on_request
                    ? 'Once your piece is ready, we offer free worldwide delivery. Express shipping available upon request.'
                    : 'Free worldwide delivery on all orders. Express delivery options available.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Complimentary Insurance */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => toggleSection('insurance')}
              className="w-full flex items-center justify-between py-3 text-left group"
            >
              <h3 className="text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-[0.2em]">
                Complimentary Insurance
              </h3>
              <ChevronDown className={`w-4 h-4 text-amber-700 transition-all duration-300 ease-in-out group-hover:text-amber-900 ${
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
              <div className="pb-3">
                <p className="text-sm font-futura-pt font-light text-gray-700 leading-relaxed">
                  All pieces come with complimentary insurance coverage for the first year.
                </p>
              </div>
            </div>
          </div>
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
                  style={{ height: '750px' }}
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
                        src={getMediaUrl(image?.url || '')}
                        muted
                        loop
                        autoPlay
                        playsInline
                        preload="metadata"
                        className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105`}
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
                      src={getMediaUrl(image?.url || '')}
                      alt={image?.alt || `${productData.name} - Image ${index + 1}`}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105`}
                      loading="lazy"
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
                {productData.nivoda_enabled ? (
                  <div>
                    {nivodaPriceLoading ? (
                      <div className="text-base 2xl:text-lg font-futura-pt font-normal text-gray-400 animate-pulse mb-1">
                        Calculating…
                      </div>
                    ) : nivodaPrice ? (
                      <div>
                        <div className="text-base 2xl:text-lg font-futura-pt font-normal text-gray-900 mb-1">
                          From £{((liveMountPrice ?? mountPrice) + nivodaPrice.min).toLocaleString()}
                        </div>
                        <div className="flex flex-col gap-0.5 text-[10px] 2xl:text-xs font-futura-pt text-gray-500"></div>
                      </div>
                    ) : (
                      <div className="text-base 2xl:text-lg font-futura-pt font-normal text-gray-900 mb-1">
                        {displayPrice}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-base 2xl:text-lg font-futura-pt font-normal text-gray-900 mb-1">
                    {displayPrice}
                  </div>
                )}
                {userCountry && userCountry !== 'GB' && userCountryName && (
                  <div className="flex items-start space-x-1.5 text-[11px] 2xl:text-xs text-gray-500 leading-snug mt-1">
                    <svg className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>We've detected you are browsing from {userCountryName}, please note the UK price for this piece is {productData.nivoda_enabled && nivodaPrice ? `from £${((liveMountPrice ?? mountPrice) + nivodaPrice.min).toLocaleString()}` : displayPrice}</span>
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
                  {productData.available_metals.filter((metal) => {
                    const img = getMetalThumbnail(metal.id);
                    return img && img.url;
                  }).map((metal) => {
                    const metalImage = getMetalThumbnail(metal.id);
                    return (
                      <button
                        key={metal.id}
                        onClick={() => handleMetalThumbnailClick(metal.id)}
                        className={`w-14 h-14 2xl:w-16 2xl:h-16 border transition-all duration-200 overflow-hidden flex items-center justify-center bg-gray-100 ${
                          selectedMetal === metal.id
                            ? 'border-gray-800'
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        title={metal.name}
                      >
                        <img
                          src={getMediaUrl(metalImage!.url)}
                          alt={metal.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Metal Type Selection */}
            {(() => {
              const overrides = productData?.ring_price_overrides;
              const visibleOptions = overrides
                ? metalTypeOptions.filter(o => overrides[o.overrideKey])
                : metalTypeOptions;
              if (visibleOptions.length === 0) return null;
              return (
            <div className="mb-4 2xl:mb-5">
              <h3 className="text-[10px] 2xl:text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2 2xl:mb-2">
                Metal Type: {metalTypeOptions.find(m => m.value === selectedMetalType)?.label || 'Select'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {visibleOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleMetalTypeClick(option.value)}
                    className={`px-4 py-2 border transition-all duration-200 font-futura-pt text-sm font-light ${
                      selectedMetalType === option.value
                        ? 'border-gray-800 bg-gray-100'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
              );
            })()}

            {/* Diamond Size Selection - Only for Engagement Rings */}
            {productData.available_diamond_sizes && productData.available_diamond_sizes.length > 0 && (
              <div className="mb-4 2xl:mb-5">
                <h3 className="text-[10px] 2xl:text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-2 2xl:mb-2">
                  Diamond Size: {productData.available_diamond_sizes.find(ds => ds.id === selectedDiamondSize)?.display_name || productData.available_diamond_sizes.find(ds => ds.id === selectedDiamondSize)?.name || 'Select'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {productData.available_diamond_sizes.map((diamondSize) => (
                    <button
                      key={diamondSize.id}
                      onClick={() => setSelectedDiamondSize(diamondSize.id)}
                      className={`px-4 py-2 border transition-all duration-200 font-futura-pt text-sm font-medium ${
                        selectedDiamondSize === diamondSize.id
                          ? 'border-gray-800 bg-gray-100'
                          : 'border-gray-300 hover:border-gray-500'
                      }`}
                      title={diamondSize.display_name || `Size ${diamondSize.name}`}
                    >
                      {diamondSize.name}
                    </button>
                  ))}
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
            {(productData?.nivoda_enabled || isEngagementRing) && (
              <div className="mb-5 2xl:mb-6 border-t border-gray-200 pt-4 2xl:pt-5">
                <h2 className="text-[10px] 2xl:text-xs font-futura-pt font-normal text-gray-900 uppercase tracking-wider mb-4 2xl:mb-5">
                  Customise Your Stone
                </h2>

                {/* Stone Type — large pill toggles */}
                {(productData?.show_stone_type || isEngagementRing) && stoneOptions.stoneType.length > 0 && (
                  <div className="mb-4 2xl:mb-5">
                    <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-2">Stone Type</p>
                    <div className="flex gap-2">
                      {stoneOptions.stoneType.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStoneTypeSelect(option.value as 'natural' | 'lab-grown')}
                          className={`flex-1 py-2.5 2xl:py-3 text-xs 2xl:text-sm font-futura-pt font-normal uppercase tracking-wider border transition-all duration-200 ${
                            selectedStoneType === option.value
                              ? 'bg-[#F5EFE6] border-[#D4A574] text-gray-900'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carat — range slider */}
                {(productData?.show_carat || isEngagementRing) && stoneOptions.carat.length > 0 && (
                  <div className="mb-5 2xl:mb-6">
                    <div className="flex items-baseline justify-between mb-3">
                      <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500">Carat</p>
                      <span className="text-sm 2xl:text-base font-futura-pt font-normal text-gray-900">
                        {selectedCarat ? `${selectedCarat} ct` : `${stoneOptions.carat[0]?.value} ct`}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={stoneOptions.carat.length - 1}
                        step={1}
                        value={stoneOptions.carat.findIndex(c => c.value === selectedCarat) < 0 ? 0 : stoneOptions.carat.findIndex(c => c.value === selectedCarat)}
                        onChange={(e) => handleCaratSelect(stoneOptions.carat[Number(e.target.value)].value)}
                        className="w-full h-0.5 appearance-none rounded-full outline-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #D4A574 0%, #D4A574 ${(Math.max(0, stoneOptions.carat.findIndex(c => c.value === selectedCarat)) / Math.max(1, stoneOptions.carat.length - 1)) * 100}%, #e5e7eb ${(Math.max(0, stoneOptions.carat.findIndex(c => c.value === selectedCarat)) / Math.max(1, stoneOptions.carat.length - 1)) * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-[10px] 2xl:text-xs font-futura-pt text-gray-400">{stoneOptions.carat[0]?.value} ct</span>
                        <span className="text-[10px] 2xl:text-xs font-futura-pt text-gray-400">{stoneOptions.carat[stoneOptions.carat.length - 1]?.value} ct</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Clarity — compact chip row */}
                {(productData?.show_clarity || isEngagementRing) && stoneOptions.clarity.length > 0 && (
                  <div className="mb-4 2xl:mb-5">
                    <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-2">Clarity</p>
                    <div className="flex flex-wrap gap-2 2xl:gap-2">
                      {stoneOptions.clarity.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleClaritySelect(option.value)}
                          className={`px-3 2xl:px-3.5 py-1.5 2xl:py-2 text-xs 2xl:text-xs font-futura-pt not-italic border transition-all duration-200 ${
                            selectedClarity === option.value
                              ? 'bg-[#F5EFE6] border-[#D4A574] text-gray-900 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colour — compact chip row */}
                {(productData?.show_colour || isEngagementRing) && stoneOptions.colour.length > 0 && (
                  <div className="mb-4 2xl:mb-5">
                    <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-2">Colour</p>
                    <div className="flex flex-wrap gap-2 2xl:gap-2">
                      {stoneOptions.colour.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleColourSelect(option.value)}
                          className={`px-3 2xl:px-3.5 py-1.5 2xl:py-2 text-xs 2xl:text-xs font-futura-pt not-italic border transition-all duration-200 ${
                            selectedColour === option.value
                              ? 'bg-[#F5EFE6] border-[#D4A574] text-gray-900 font-medium'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cut — compact chip row */}
                {(productData?.show_cut || isEngagementRing) && stoneOptions.cut.length > 0 && (
                  <div className="mb-4 2xl:mb-5">
                    <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-2">Cut</p>
                    <div className="flex flex-wrap gap-2 2xl:gap-2">
                      {stoneOptions.cut.map((option) => (
                        <button key={option.value} onClick={() => handleCutSelect(option.value)}
                          className={`px-3 2xl:px-3.5 py-1.5 2xl:py-2 text-xs 2xl:text-xs font-futura-pt border transition-all duration-200 ${selectedCut === option.value ? 'bg-[#F5EFE6] border-[#D4A574] text-gray-900 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Polish */}
                {(stoneOptions as any).polish?.length > 0 && (
                  <div className="mb-4 2xl:mb-5">
                    <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-2">Polish</p>
                    <div className="flex flex-wrap gap-2">
                      {(stoneOptions as any).polish.map((option: any) => (
                        <button key={option.value} onClick={() => handlePolishSelect(option.value)}
                          className={`px-3 2xl:px-3.5 py-1.5 2xl:py-2 text-xs font-futura-pt border transition-all duration-200 ${selectedPolish === option.value ? 'bg-[#F5EFE6] border-[#D4A574] text-gray-900 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symmetry */}
                {(stoneOptions as any).symmetry?.length > 0 && (
                  <div className="mb-4 2xl:mb-5">
                    <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-2">Symmetry</p>
                    <div className="flex flex-wrap gap-2">
                      {(stoneOptions as any).symmetry.map((option: any) => (
                        <button key={option.value} onClick={() => handleSymmetrySelect(option.value)}
                          className={`px-3 2xl:px-3.5 py-1.5 2xl:py-2 text-xs font-futura-pt border transition-all duration-200 ${selectedSymmetry === option.value ? 'bg-[#F5EFE6] border-[#D4A574] text-gray-900 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fluorescence */}
                {(stoneOptions as any).fluorescence?.length > 0 && (
                  <div className="mb-4 2xl:mb-5">
                    <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-2">Fluorescence</p>
                    <div className="flex flex-wrap gap-2">
                      {(stoneOptions as any).fluorescence.map((option: any) => (
                        <button key={option.value} onClick={() => handleFluorescenceSelect(option.value)}
                          className={`px-3 2xl:px-3.5 py-1.5 2xl:py-2 text-xs font-futura-pt border transition-all duration-200 ${selectedFluorescence === option.value ? 'bg-[#F5EFE6] border-[#D4A574] text-gray-900 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificate Lab */}
                {(stoneOptions as any).certificate?.length > 1 && (
                  <div className="mb-4 2xl:mb-5">
                    <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-2">Certificate Lab</p>
                    <div className="flex flex-wrap gap-2">
                      {(stoneOptions as any).certificate.map((option: any) => (
                        <button key={option.value} onClick={() => setSelectedCertificate(prev => prev === option.value ? '' : option.value)}
                          className={`px-3 2xl:px-3.5 py-1.5 2xl:py-2 text-xs font-futura-pt border transition-all duration-200 ${selectedCertificate === option.value ? 'bg-[#F5EFE6] border-[#D4A574] text-gray-900 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Price Summary - Nivoda */}
                {productData?.nivoda_enabled && (
                  <div className="mb-4 2xl:mb-5 p-3 2xl:p-4 bg-[#F5EFE6] border border-[#e8d5b7]">
                    {nivodaPriceLoading && (
                      <div className="text-xs 2xl:text-sm font-futura-pt text-gray-500 animate-pulse uppercase tracking-wider">
                        Calculating price…
                      </div>
                    )}
                    {nivodaPrice && !nivodaPriceLoading && (
                      <div className="space-y-1.5 2xl:space-y-2">
                        <p className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500 mb-3">Price Breakdown</p>
                        {/* Ring mount price */}
                        <div className="flex justify-between text-xs 2xl:text-sm font-futura-pt">
                          <span className="text-gray-500">Ring ({metalTypeOptions.find(m => m.value === selectedMetalType)?.label || 'Ring'})</span>
                          <span className="text-gray-700">£{(liveMountPrice ?? mountPrice).toLocaleString()}</span>
                        </div>
                        {/* Diamond price range */}
                        <div className="flex justify-between text-xs 2xl:text-sm font-futura-pt">
                          <span className="text-gray-500">Diamond (your specs)</span>
                          <span className="text-gray-700">£{nivodaPrice.min.toLocaleString()} – £{nivodaPrice.max.toLocaleString()}</span>
                        </div>
                        {/* Divider */}
                        <div className="border-t border-[#e8d5b7] pt-1.5 mt-1.5">
                          <div className="flex justify-between text-xs 2xl:text-sm font-futura-pt font-medium">
                            <span className="text-gray-900">Total (from)</span>
                            <span className="text-[#D4A574]">£{((liveMountPrice ?? mountPrice) + nivodaPrice.min).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {nivodaPriceError && (
                      <div className="text-xs 2xl:text-sm font-futura-pt text-red-500">
                        {nivodaPriceError}
                      </div>
                    )}
                  </div>
                )}

                {/* Certificate */}
                {productData?.show_certificate && productData?.certificate && (
                  <div className="mb-4 2xl:mb-5 flex items-center justify-between">
                    <span className="text-[10px] 2xl:text-xs font-futura-pt uppercase tracking-wider text-gray-500">Certificate</span>
                    <span className="text-xs 2xl:text-sm font-futura-pt text-gray-900">{productData.certificate}</span>
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

              {/* Made on Request Notice - Below Buttons */}
              {productData.is_made_on_request && (
                <div className="flex items-center justify-center space-x-2 mt-3 py-2 px-3 bg-amber-50/80 rounded border border-amber-100">
                  <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-futura-pt text-amber-700">
                    Made to order • Delivery in {productData.made_on_request_lead_time || '4-6 weeks'}
                  </span>
                </div>
              )}
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

                    {/* Made on Request Notice */}
                    {productData.is_made_on_request && (
                      <div className="mt-4 mb-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-futura-pt font-medium text-amber-800 uppercase tracking-wider mb-1">
                              Made to Order
                            </h4>
                            <p className="text-sm font-futura-pt font-light text-amber-700 leading-relaxed">
                              This exquisite piece is crafted specially for you. Please allow approximately{' '}
                              <span className="font-medium">{productData.made_on_request_lead_time || '4-6 weeks'}</span>{' '}
                              for creation and delivery.
                            </p>
                            {productData.made_on_request_message && (
                              <p className="text-sm font-futura-pt font-light text-amber-700 leading-relaxed mt-2">
                                {productData.made_on_request_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

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
                      ? 'max-h-[500px] opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="pb-3 2xl:pb-4 space-y-4">
                    {/* Made on Request Notice */}
                    {productData.is_made_on_request && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-futura-pt font-medium text-amber-800 mb-1">
                              Made to Order
                            </h4>
                            <p className="text-sm font-futura-pt font-light text-amber-700 leading-relaxed">
                              This exquisite piece is crafted specially for you. Please allow approximately{' '}
                              <span className="font-medium">{productData.made_on_request_lead_time || '4-6 weeks'}</span>{' '}
                              for creation and delivery.
                            </p>
                            {productData.made_on_request_message && (
                              <p className="text-sm font-futura-pt font-light text-amber-700 leading-relaxed mt-2">
                                {productData.made_on_request_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Standard Delivery Info */}
                    <p className="text-sm 2xl:text-base font-futura-pt font-light text-gray-700 leading-relaxed">
                      {productData.is_made_on_request
                        ? 'Once your piece is ready, we offer free worldwide delivery. Express shipping available upon request.'
                        : 'Free worldwide delivery on all orders. Express delivery options available.'
                      }
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
        <div className="fixed inset-0 z-50 bg-white flex flex-col lg:flex-row lg:items-center lg:justify-center">

          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center z-20 transition-colors"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>

          {/* ── DESKTOP: left thumbnail sidebar ── */}
          <div className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 flex-col space-y-3 z-10 max-h-[90vh] overflow-y-auto">
            {productData.images.map((image, index) => (
              <button
                key={index}
                onClick={() => goToLightboxImage(index)}
                className={`w-16 h-16 bg-white rounded overflow-hidden border-2 transition-all flex-shrink-0 ${
                  index === lightboxImageIndex ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-600'
                }`}
              >
                {isVideoFile(image.url) ? (
                  <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
                    <video src={getMediaUrl(image.url || '')} className="w-full h-full object-cover" muted autoPlay loop playsInline preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-gray-600 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={getMediaUrl(image.url || '')} alt={image.alt || `View ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                )}
              </button>
            ))}
          </div>

          {/* ── DESKTOP: zoom controls ── */}
          <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col space-y-4 z-10">
            <button onClick={zoomIn} disabled={zoomLevel >= 3} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors disabled:opacity-40">
              <ZoomIn className="w-6 h-6 text-gray-700" />
            </button>
            <button onClick={zoomOut} disabled={zoomLevel <= 0.5} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors disabled:opacity-40">
              <ZoomOut className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          {/* ── Main image (mobile: flex-1 full width; desktop: centred with padding) ── */}
          <div className="flex-1 flex items-center justify-center lg:p-20 overflow-hidden">
            <div
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.3s ease-out' }}
              className="w-full h-full lg:w-auto lg:h-auto flex items-center justify-center"
            >
              {isVideoFile(displayImages[lightboxImageIndex]?.url) ? (
                <video
                  src={getMediaUrl(displayImages[lightboxImageIndex]?.url || '')}
                  controls autoPlay muted playsInline preload="auto"
                  className="w-full h-full object-contain lg:max-h-[80vh] lg:max-w-[80vw]"
                />
              ) : (
                <img
                  src={getMediaUrl(displayImages[lightboxImageIndex]?.url || '')}
                  alt={displayImages[lightboxImageIndex]?.alt || productData.name}
                  className="w-full h-full object-contain lg:max-h-[80vh] lg:max-w-[80vw]"
                  loading="eager"
                />
              )}
            </div>
          </div>

          {/* ── MOBILE: bottom thumbnail strip + nav arrows ── */}
          <div className="lg:hidden flex-shrink-0 pb-4">
            {/* Nav arrows */}
            {displayImages.length > 1 && (
              <div className="flex justify-center space-x-4 mb-3">
                <button onClick={() => goToLightboxImage((lightboxImageIndex - 1 + displayImages.length) % displayImages.length)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button onClick={() => goToLightboxImage((lightboxImageIndex + 1) % displayImages.length)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            )}
            {/* Horizontal thumbnail strip */}
            <div className="flex space-x-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
              {productData.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => goToLightboxImage(index)}
                  className={`w-14 h-14 flex-shrink-0 bg-white rounded overflow-hidden border-2 transition-all ${
                    index === lightboxImageIndex ? 'border-gray-800' : 'border-gray-300'
                  }`}
                >
                  {isVideoFile(image.url) ? (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-l-gray-600 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-1" />
                    </div>
                  ) : (
                    <img src={getMediaUrl(image.url || '')} alt={image.alt || `View ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── DESKTOP: bottom nav arrows ── */}
          {displayImages.length > 1 && (
            <div className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 space-x-4 z-10">
              <button onClick={() => goToLightboxImage((lightboxImageIndex - 1 + displayImages.length) % displayImages.length)} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <button onClick={() => goToLightboxImage((lightboxImageIndex + 1) % displayImages.length)} className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors">
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
                        loading="lazy"
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

      <FooterSection />
    </div>
  );
};

export default ProductDetail;