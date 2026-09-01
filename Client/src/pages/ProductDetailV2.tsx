
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Heart, Phone, MessageCircle, ChevronDown, ChevronUp, Plus, X, Minus, ZoomIn, ZoomOut, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import LuxuryNavigationWhite from '@/components/LuxuryNavigationWhite';
import { FooterSection } from '@/components/FooterSection';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL, { getMediaUrl } from '../config/api';
import NavigationV2 from '../components/home-v2/NavigationV2';
import FooterV2 from '../components/home-v2/FooterV2';
import { T, FONT_DISPLAY, FONT_BODY } from '../components/home-v2/tokens';
import { trackViewContent, trackAddToCart } from '../services/pixelService';
import { useCountry } from '../hooks/useCountry';

/**
 * The primary product film.
 *
 * iOS/WebKit only plays a <video> whose server answers HTTP Range requests with
 * 206 Partial Content. Cloudflare (in front of api.buymediamonds.co.uk) buffers
 * cacheable `.mp4` responses and answers ranges with a rangeless 200 that iOS
 * refuses to play (Android Chrome tolerates it — hence "plays on Android, black
 * on iPhone"). The server exposes the same files on an extensionless path
 * (/media/videos/<sku>) that Cloudflare treats as dynamic and passes byte ranges
 * through, so native playback gets its required 206 everywhere. See Server/index.js.
 */
function toStreamUrl(url: string): string {
  return url.replace(/\/uploads\/videos\/(.+?)\.mp4(\?.*)?$/i, '/media/videos/$1');
}

function FilmVideo({ url, poster }: { url: string; poster?: string }) {
  return (
    <video
      src={toStreamUrl(url)}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
}

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

function getMetalBase(value: string): string {
  if (!value || value === 'silver') return 'silver';
  if (value === 'platinum') return 'platinum';
  if (value.includes('white')) return 'white-gold';
  if (value.includes('yellow')) return 'yellow-gold';
  if (value.includes('rose')) return 'rose-gold';
  return '';
}
function getMetalKarat(value: string): string {
  if (value.startsWith('9ct')) return '9ct';
  if (value.startsWith('14ct')) return '14ct';
  if (value.startsWith('18ct')) return '18ct';
  return '';
}
function buildMetalValue(base: string, karat: string): string {
  if (base === 'silver' || base === 'platinum') return base;
  return karat ? `${karat}-${base}` : `18ct-${base}`;
}
const METAL_BASE_LABELS: Record<string, string> = {
  'silver': 'Silver',
  'white-gold': 'White Gold',
  'yellow-gold': 'Yellow Gold',
  'rose-gold': 'Rose Gold',
  'platinum': 'Platinum',
};

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

const renderDescription = (text: string | undefined) => {
  if (!text) return null;

  const isSectionHeader = (line: string) =>
    line.length < 65 &&
    !line.endsWith('.') &&
    !line.endsWith(':') &&
    /^[A-Z]/.test(line) &&
    line.split(' ').length >= 2;

  const blocks: { type: 'title' | 'header' | 'body'; text: string }[] = [];
  let bodyAccum = '';

  const flushBody = () => {
    const t = bodyAccum.trim();
    if (t) { blocks.push({ type: 'body', text: t }); bodyAccum = ''; }
  };

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) { flushBody(); continue; }
    if (line.includes('–') && line.length < 120) { flushBody(); blocks.push({ type: 'title', text: line }); continue; }
    if (isSectionHeader(line)) { flushBody(); blocks.push({ type: 'header', text: line }); continue; }
    bodyAccum += (bodyAccum ? ' ' : '') + line;
  }
  flushBody();

  return (
    <div>
      {blocks.map((block, i) => {
        if (block.type === 'title') return (
          <p key={i} className="font-medium text-gray-900 text-sm leading-snug mb-4">
            {block.text}
          </p>
        );
        if (block.type === 'header') return (
          <p key={i} className="font-medium text-gray-800 text-[11px] uppercase tracking-[0.14em] mt-5 mb-2">
            {block.text}
          </p>
        );
        return (
          <p key={i} className="text-sm font-futura-pt font-light text-gray-600 leading-[1.75] mb-3">
            {block.text}
          </p>
        );
      })}
    </div>
  );
};

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
    if (firstMetalId) {
      const fallbackImages = allImages.filter(img =>
        img.metal_id === firstMetalId && !img.diamond_size_id && img.type !== 'video'
      );
      return [...fallbackImages, ...videos];
    }

    // Products whose images aren't tied to a metal at all (e.g. live stock uploads)
    const generalImages = allImages.filter(img =>
      !img.metal_id && !img.diamond_size_id && img.type !== 'video'
    );
    return [...generalImages, ...videos];
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
    if (!carat || !clarity || !colour) return; // cut is optional — many products have no cut options

    setNivodaPriceLoading(true);
    setNivodaPriceError(null);

    try {
      const config = productData.nivoda_options_config;
      const params = new URLSearchParams({ carat, clarity, color: colour });
      if (cut) params.set('cut', cut);

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
      if (data.success && data.data?.prices && data.data.prices.avg > 0) {
        console.log('Price updated:', data.data.prices);
        setNivodaPrice(data.data.prices);
      } else if (data.success && data.data?.count === 0) {
        setNivodaPrice(null);
        setNivodaPriceError('No diamonds available for this specification — try adjusting clarity or colour');
      } else {
        setNivodaPrice(null);
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
      return base + nivodaPrice.avg;
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

      // Default to G VS2 — the base quality standard used for all product pricing.
      // Customers see the lowest realistic price first and can upgrade clarity/colour.
      // If G/VS2 isn't in the configured options, fall back to the middle of the list.
      const mid = (arr: string[] | undefined) => arr?.[Math.floor(((arr?.length || 1) - 1) / 2)] ?? '';
      const clarity = defaults?.clarity || (config.clarityOptions?.includes('VS2') ? 'VS2' : mid(config.clarityOptions));
      if (clarity) setSelectedClarity(clarity);

      const colour = defaults?.colour || (config.colourOptions?.includes('G') ? 'G' : mid(config.colourOptions));
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

  // Fetch price when any selection changes — cut is optional (may not be configured)
  useEffect(() => {
    if (productData?.nivoda_enabled && selectedCarat && selectedClarity && selectedColour) {
      fetchNivodaPrice(selectedCarat, selectedClarity, selectedColour, selectedCut || undefined);
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

      // Persist the exact pricing key so the server can authoritatively re-verify the
      // mount price for this configuration (used by the payment amount guard).
      const priceOpt = metalTypeOptions.find(m => m.value === selectedMetalType);
      if (priceOpt) selectedOptions.priceKey = priceOpt.overrideKey;

      const imageUrl = displayImages[0]?.url || productData.images[0]?.url;

      // Use the fully calculated price (mount + diamond) as the cart price
      const cartPrice = calculateTotalPrice();

      const newItem: any = {
        id: productData.id,
        slug: productData.slug,
        name: productData.name,
        price: cartPrice,
        metal: selectedMetalName,
        size: selectedSizeLabel,
        diamondSize: selectedDiamondSizeName,
        image: imageUrl ? getMediaUrl(imageUrl) : '',
        type: 'jewelry',
        selectedOptions: selectedOptions
      };

      // Include Nivoda price breakdown for reference
      if (productData?.nivoda_enabled) {
        newItem.nivodaPrice = nivodaPrice;
        newItem.totalPrice = cartPrice;
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

  // Sync metal type button → gallery image. We only shoot renders for three metal
  // colours (yellow / rose / white), so every pricing option maps to the nearest
  // colour we have a photo of: silver and platinum share the white-gold render
  // (visually identical), and if the exact colour has no image we still land on a
  // metal that does — the gallery never blanks out.
  const handleMetalTypeClick = (value: string) => {
    setSelectedMetalType(value);
    const metals = productData?.available_metals;
    if (!metals || metals.length === 0) return;

    let colorKeywords: string[];
    if (value.includes('yellow')) colorKeywords = ['yellow'];
    else if (value.includes('rose')) colorKeywords = ['rose'];
    else if (value.includes('white')) colorKeywords = ['white'];
    else if (value === 'silver' || value === 'platinum') colorKeywords = ['white', 'platinum', 'silver'];
    else return;

    const hasImage = (m: any) => !!getMetalThumbnail(m.id);
    const nameHits = (m: any) => colorKeywords.some(k => (m.name || '').toLowerCase().includes(k));
    const match =
      metals.find((m: any) => nameHits(m) && hasImage(m)) ||   // exact colour with a photo
      metals.find((m: any) => nameHits(m)) ||                  // exact colour (any)
      metals.find((m: any) => hasImage(m)) ||                  // any metal that has a photo
      metals[0];
    if (match) setSelectedMetal(match.id);
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

  // ---- v2 render helpers ----
  const NAV_H = 96;
  const money = (n: number) => '£' + Math.round(n || 0).toLocaleString('en-GB');
  const priceOverrides = productData?.ring_price_overrides;
  const purchasableMetals = priceOverrides ? metalTypeOptions.filter(o => priceOverrides[o.overrideKey]) : [];
  const metalDot = (v: string) => v.includes('yellow') ? '#E6C15A' : v.includes('rose') ? '#DCA79A' : v.includes('white') ? '#E5E4E2' : v === 'platinum' ? '#E5E4E2' : v === 'silver' ? '#C7C7C7' : '#D8D2C6';
  // Organise the purchasable metals into tidy rows: base metals (silver / platinum)
  // first, then each gold karat with its colours. Inside a karat group the label
  // drops the karat prefix (the caption carries it) so the pills read cleanly.
  const metalGroups: { key: string; caption: string; options: { value: string; label: string }[] }[] = (() => {
    const groups: { key: string; caption: string; options: { value: string; label: string }[] }[] = [];
    const base = purchasableMetals.filter(o => o.value === 'silver' || o.value === 'platinum');
    if (base.length) groups.push({ key: 'base', caption: '', options: base.map(o => ({ value: o.value, label: o.label })) });
    ['9ct', '14ct', '18ct'].forEach(k => {
      const opts = purchasableMetals.filter(o => o.value.startsWith(k));
      if (opts.length) groups.push({ key: k, caption: `${k} gold`, options: opts.map(o => ({ value: o.value, label: o.label.replace(`${k} `, '') })) });
    });
    return groups;
  })();
  const totalPrice = calculateTotalPrice();
  const media = displayImages || [];
  const activeMedia = media[currentImageIndex] || media[0];
  const gallery = media.slice(0, 5);
  const angleLabels = ['Three-quarter', 'Top', 'Front', 'Profile', 'Detail'];
  const chip = (on: boolean): React.CSSProperties => ({ padding: '9px 14px', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12.5, border: `1px solid ${on ? T.ink : T.ruleSoft}`, background: on ? T.ink : T.paper, color: on ? T.paper : T.body });
  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gold };
  const stepLabel: React.CSSProperties = { fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 14 };
  const subLabel: React.CSSProperties = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, margin: '4px 0 8px' };
  const metalName = productData?.available_metals?.find((m: any) => m.id === selectedMetal)?.name || (metalTypeOptions.find(m => m.value === selectedMetalType)?.label) || '';
  const sizeLabel = ringSizes.find(s => s.value === selectedSize)?.label || selectedSize;
  const diamondName = productData?.available_diamond_sizes?.find((d: any) => d.id === selectedDiamondSize)?.display_name || productData?.available_diamond_sizes?.find((d: any) => d.id === selectedDiamondSize)?.name || '';
  const configSummary = [metalTypeOptions.find(m => m.value === selectedMetalType)?.label || metalName, selectedSize && ('Size ' + selectedSize), productData?.nivoda_enabled && selectedCarat && (selectedCarat + 'ct ' + selectedColour + ' ' + selectedClarity)].filter(Boolean).join('  ·  ');
  const isVid = (m: any) => !!m && (m.type === 'video' || isVideoFile(m.url));

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: '100vh' }}>
      <style>{`
        .pdpv2 a{color:inherit;text-decoration:none}
        .pdpv2-tile{border:1px solid ${T.rule};cursor:pointer;transition:border-color .2s}
        .pdpv2-tile:hover,.pdpv2-tile[data-on="1"]{border-color:${T.ink}}
        .pdpv2-chip:hover{border-color:${T.ink}}
        .pdpv2-card img{transition:transform .5s}
        .pdpv2-card:hover img{transform:scale(1.04)}
        .pdpv2-addbtn:not(:disabled):hover{background:${T.gold}}
      `}</style>

      <NavigationV2 solid />

      <div className="pdpv2" style={{ paddingTop: NAV_H }}>
        <div style={{ display: 'flex', gap: 10, padding: '18px clamp(24px,3vw,52px)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A8377' }}>
          <Link to="/">Home</Link><span>/</span><Link to={`/${productData.category?.slug || 'engagement-rings'}`}>{productData.category?.name || 'Engagement rings'}</Link><span>/</span><span style={{ color: T.ink }}>{productData.name}</span>
        </div>

        <main style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(430px, 0.75fr)', gap: 'clamp(32px,4vw,72px)', padding: 'clamp(8px,2vw,24px) clamp(24px,3vw,52px) clamp(56px,5vw,88px)', alignItems: 'start' }} className="pdpv2-main">
          {/* Gallery */}
          <div style={{ position: 'sticky', top: NAV_H + 12 }} className="pdpv2-gallery">
            <div className="pdpv2-primary" style={{ position: 'relative', aspectRatio: '4 / 3', background: '#FFFFFF', overflow: 'hidden' }}>
              {activeMedia && isVid(activeMedia)
                ? <FilmVideo url={getMediaUrl(activeMedia.url)} poster={(() => { const im = media.find(m => !isVid(m)); return im ? getMediaUrl(im.url) : undefined; })()} />
                : activeMedia ? <img src={getMediaUrl(activeMedia.url)} alt={productData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
              <span style={{ position: 'absolute', top: 12, left: 12, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted }}>{isVid(activeMedia) ? 'Film' : (angleLabels[currentImageIndex] || '')}</span>
              {gallery.length > 1 && <span style={{ position: 'absolute', bottom: 12, right: 12, padding: '3px 9px', background: 'rgba(248,246,240,0.85)', fontSize: 10.5, letterSpacing: '0.08em', color: T.ink }}>{currentImageIndex + 1} / {gallery.length}</span>}
            </div>
            {gallery.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gallery.length}, 1fr)`, gap: 10, marginTop: 10 }}>
                {gallery.map((m: any, i: number) => (
                  <button key={i} onClick={() => setCurrentImageIndex(i)} className="pdpv2-tile" data-on={i === currentImageIndex ? '1' : '0'} style={{ position: 'relative', aspectRatio: '1', background: '#FFFFFF', padding: 0, overflow: 'hidden' }}>
                    {isVid(m)
                      ? <><img src={(() => { const im = media.find(x => !isVid(x)); return im ? getMediaUrl(im.url) : undefined; })()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><Play size={18} color="#fff" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} /></span><span style={{ position: 'absolute', bottom: 6, left: 6, padding: '2px 6px', background: 'rgba(28,26,23,0.72)', color: '#fff', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Film</span></>
                      : <img src={getMediaUrl(m.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buy column */}
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(38px,3.6vw,54px)', lineHeight: 1.02, margin: '0 0 8px' }}>{productData.name}</h1>
            <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8A8377', marginBottom: 22 }}>{productData.category?.name || 'Engagement'}{productData.sku ? ' — ' + productData.sku : ''}</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, paddingBottom: 18, borderBottom: `1px solid ${T.rule}`, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 38, lineHeight: 1 }}>{money(totalPrice)}</span>
              <span style={{ fontSize: 12.5, color: T.muted }}>Includes VAT · Free insured UK delivery</span>
            </div>
            <div style={{ fontSize: 12, color: T.muted, margin: '10px 0 26px' }}>{configSummary}{nivodaPriceLoading ? '  ·  updating price…' : ''}</div>

            {productData.description && <p style={{ fontSize: 15, lineHeight: 1.75, color: T.body, maxWidth: '52ch', margin: '0 0 30px', whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{String(productData.description)}</p>}

            {(purchasableMetals.length > 0 || (productData.available_metals || []).length > 0) && (
              <div style={{ marginBottom: 28 }}>
                <div style={stepLabel}>01 — Metal</div>
                {(() => {
                  const swatches = (productData.available_metals || []).filter((m: any) => { const img = getMetalThumbnail(m.id); return img && img.url; });
                  if (swatches.length === 0) return null;
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {swatches.map((m: any) => {
                        const img = getMetalThumbnail(m.id);
                        const on = selectedMetal === m.id;
                        return (
                          <button key={m.id} onClick={() => handleMetalThumbnailClick(m.id)} title={m.name} aria-label={m.name}
                            style={{ width: 58, height: 58, padding: 0, cursor: 'pointer', overflow: 'hidden', background: '#FFFFFF', border: `1px solid ${on ? T.ink : T.ruleSoft}`, boxShadow: on ? `inset 0 0 0 1px ${T.ink}` : 'none' }}>
                            <img src={getMediaUrl(img!.url)} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
                {purchasableMetals.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {metalGroups.map(group => (
                      <div key={group.key}>
                        {group.caption && <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>{group.caption}</div>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {group.options.map(o => {
                            const on = selectedMetalType === o.value;
                            return <button key={o.value} onClick={() => handleMetalTypeClick(o.value)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12.5, border: `1px solid ${on ? T.ink : T.ruleSoft}`, background: on ? T.tint : T.paper, color: T.ink }}><span style={{ width: 15, height: 15, borderRadius: '50%', background: metalDot(o.value), border: '1px solid rgba(0,0,0,0.15)' }} />{o.label}</button>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {(productData.available_metals || []).map((m: any) => {
                      const on = selectedMetal === m.id;
                      return <button key={m.id} onClick={() => handleMetalThumbnailClick(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12.5, border: `1px solid ${on ? T.ink : T.ruleSoft}`, background: on ? T.tint : T.paper, color: T.ink }}><span style={{ width: 16, height: 16, borderRadius: '50%', background: m.color_code || '#D8D2C6', border: '1px solid rgba(0,0,0,0.15)' }} />{m.name}</button>;
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <div style={stepLabel}>02 — Size</div>
                <Link to="/customer-service" style={{ fontSize: 11, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Size guide</Link>
              </div>
              <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)} style={{ width: '100%', padding: '12px 14px', fontFamily: FONT_BODY, fontSize: 14, color: T.ink, background: T.paper, border: `1px solid ${T.ruleStrong}`, borderRadius: 0, cursor: 'pointer' }}>
                {ringSizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {(productData.available_diamond_sizes || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {productData.available_diamond_sizes.map((d: any) => {
                    const on = selectedDiamondSize === d.id;
                    return <button key={d.id} onClick={() => setSelectedDiamondSize(d.id)} className="pdpv2-chip" style={chip(on)}>{d.display_name || d.name}</button>;
                  })}
                </div>
              )}
            </div>

            {productData.nivoda_enabled && (
              <div style={{ background: T.tint, padding: 26, marginBottom: 28 }}>
                <div style={stepLabel}>03 — Centre stone</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                  {stoneOptions.stoneType.map((o: any) => { const on = selectedStoneType === o.value; return <button key={o.value} onClick={() => handleStoneTypeSelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}
                </div>
                {stoneOptions.carat.length > 0 && <><div style={subLabel}>Carat</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>{stoneOptions.carat.map((o: any) => { const on = selectedCarat === o.value; return <button key={o.value} onClick={() => handleCaratSelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}</div></>}
                {stoneOptions.clarity.length > 0 && <><div style={subLabel}>Clarity</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>{stoneOptions.clarity.map((o: any) => { const on = selectedClarity === o.value; return <button key={o.value} onClick={() => handleClaritySelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}</div></>}
                {stoneOptions.colour.length > 0 && <><div style={subLabel}>Colour</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{stoneOptions.colour.map((o: any) => { const on = selectedColour === o.value; return <button key={o.value} onClick={() => handleColourSelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}</div></>}
                {stoneOptions.cut && stoneOptions.cut.length > 0 && <><div style={{ ...subLabel, marginTop: 18 }}>Cut</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{stoneOptions.cut.map((o: any) => { const on = selectedCut === o.value; return <button key={o.value} onClick={() => handleCutSelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}</div></>}

                {(((stoneOptions as any).polish && (stoneOptions as any).polish.length) || ((stoneOptions as any).symmetry && (stoneOptions as any).symmetry.length) || ((stoneOptions as any).certificate && (stoneOptions as any).certificate.length)) ? (
                  <div style={{ marginTop: 18, borderTop: `1px solid ${T.rule}`, paddingTop: 14 }}>
                    <button onClick={() => toggleStoneOption('advanced')} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.ink, padding: 0 }}>
                      <span>Grading &amp; certification</span><span>{expandedStoneOptions.advanced ? '−' : '+'}</span>
                    </button>
                    {expandedStoneOptions.advanced && (
                      <div style={{ marginTop: 14 }}>
                        {(stoneOptions as any).polish && (stoneOptions as any).polish.length > 0 && <><div style={subLabel}>Polish</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>{(stoneOptions as any).polish.map((o: any) => { const on = selectedPolish === o.value; return <button key={o.value} onClick={() => handlePolishSelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}</div></>}
                        {(stoneOptions as any).symmetry && (stoneOptions as any).symmetry.length > 0 && <><div style={subLabel}>Symmetry</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>{(stoneOptions as any).symmetry.map((o: any) => { const on = selectedSymmetry === o.value; return <button key={o.value} onClick={() => handleSymmetrySelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}</div></>}
                        {(stoneOptions as any).certificate && (stoneOptions as any).certificate.length > 0 && <><div style={subLabel}>Certificate lab</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{(stoneOptions as any).certificate.map((o: any) => { const on = selectedCertificate === o.value; return <button key={o.value} onClick={() => setSelectedCertificate(on ? '' : o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}</div></>}
                      </div>
                    )}
                  </div>
                ) : null}
                {nivodaPriceError && <div style={{ marginTop: 14, fontSize: 12, color: '#9A6A4A' }}>{nivodaPriceError}</div>}
              </div>
            )}

            <button onClick={handleAddToCart} disabled={isLoading} className="pdpv2-addbtn" style={{ width: '100%', padding: 17, cursor: isLoading ? 'default' : 'pointer', background: T.ink, color: T.paper, border: 0, fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', transition: 'background .3s' }}>
              {isLoading ? 'Adding…' : `Add to bag — ${money(totalPrice)}`}
            </button>
            <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, padding: '18px 0', borderBottom: `1px solid ${T.rule}`, borderTop: `1px solid ${T.rule}`, margin: '18px 0' }}>Free insured delivery</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: T.rule, marginBottom: 8 }}>
              {[['01', 'Book an appointment', '/contact'], ['02', 'Order by phone', '/contact'], ['03', 'Drop a hint', '/contact']].map(([n, l, href]) => (
                <Link key={n} to={href} style={{ background: T.paper, padding: '18px 14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: FONT_DISPLAY, color: T.gold, fontSize: 18 }}>{n}</div>
                  <div style={{ fontSize: 12, color: T.body, marginTop: 6 }}>{l}</div>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: 22 }}>
              {[['about', 'About this piece', productData.description ? String(productData.description) : 'Made to order in our own workshop, cut and set by hand.'], ['delivery', 'Delivery information', 'Free insured UK delivery. Made to order — please allow around 3–4 weeks. 30-day returns.'], ['insurance', 'Complimentary insurance', 'Every piece includes complimentary insurance for the first year and a 1-year warranty.']].map(([key, title, body]) => (
                <div key={key} style={{ borderTop: `1px solid ${T.rule}` }}>
                  <button onClick={() => toggleSection(key)} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '16px 0', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.ink }}>
                    <span>{title}</span><span>{expandedSections[key] ? '−' : '+'}</span>
                  </button>
                  {expandedSections[key] && <div style={{ paddingBottom: 18, fontSize: 14, lineHeight: 1.7, color: T.body, whiteSpace: 'pre-line' }}>{body}</div>}
                </div>
              ))}
            </div>

            <div className="pdpv2-spec" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 24, marginTop: 22, borderTop: `1px solid ${T.rule}` }}>
              {([['Metal', metalTypeOptions.find(m => m.value === selectedMetalType)?.label || metalName], ['Size', sizeLabel], diamondName && ['Diamond', diamondName], productData.nivoda_enabled && selectedCarat && ['Carat', selectedCarat + ' ct'], productData.nivoda_enabled && selectedClarity && ['Clarity', selectedClarity], productData.nivoda_enabled && selectedColour && ['Colour', selectedColour], productData.sku && ['SKU', productData.sku]].filter(Boolean) as any[]).map((row: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: `1px solid ${T.rule}`, fontSize: 13 }}>
                  <span style={{ color: T.muted }}>{row[0]}</span><span>{row[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Our promise */}
        <section style={{ background: T.ink, color: T.onDarkSoft, padding: 'clamp(60px,5.5vw,100px) clamp(24px,3vw,52px)' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'end', paddingBottom: 36, borderBottom: `1px solid ${T.ruleDark}` }} className="pdpv2-promise-top">
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(30px,3.4vw,52px)', lineHeight: 1.08, margin: 0, maxWidth: '15ch', color: '#fff' }}>Where craftsmanship meets distinction.</h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>Every ring is cut, set and finished by hand in our own workshop — the same bench, the same care, for generations.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }} className="pdpv2-promise-grid">
              {[['I', 'White glove delivery', 'Insured, tracked and hand-delivered to your door.'], ['II', 'Signature presentation', 'Every piece arrives in our signature box, ready to give.'], ['III', 'Ethical excellence', 'Responsibly sourced stones and metals, hallmarked in the UK.'], ['IV', 'Sizing expertise', 'Complimentary resizing to get the fit exactly right.']].map(([n, t, d], i) => (
                <div key={n} style={{ padding: 34, borderRight: i < 3 ? `1px solid ${T.ruleDark}` : undefined }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: T.gold, marginBottom: 14 }}>{n}</div>
                  <div style={{ fontSize: 14.5, color: '#fff', marginBottom: 8 }}>{t}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.6, color: T.onDarkMuted }}>{d}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 40, paddingTop: 32, borderTop: `1px solid ${T.ruleDark}` }}>
              <Link to="/contact" style={{ padding: '14px 30px', background: T.paper, color: T.ink, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Book a private consultation</Link>
              <Link to="/contact" style={{ padding: '14px 30px', border: `1px solid ${T.ruleDarkStrong}`, color: '#fff', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Order by phone</Link>
            </div>
          </div>
        </section>

        {(recommendedProducts || []).length > 0 && (
          <section style={{ padding: 'clamp(48px,5vw,80px) clamp(24px,3vw,52px)' }}>
            <div style={{ ...eyebrow, marginBottom: 14 }}>You may also like</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'clamp(16px,1.6vw,28px)', marginTop: 20 }} className="pdpv2-rec">
              {recommendedProducts.slice(0, 4).map((r: any) => {
                // The recommendations API returns `image` as a plain URL string
                // (rec.images[0].image_url), not an object — handle both shapes.
                const rimg = (typeof r.image === 'string' ? r.image : r.image?.url) || r.images?.[0]?.url;
                return (
                  <Link key={r.id} to={`/${r.category?.slug || 'engagement-rings'}/${r.slug}`} className="pdpv2-card" style={{ display: 'block' }}>
                    <div style={{ position: 'relative', aspectRatio: '4 / 5', background: '#FFFFFF', overflow: 'hidden' }}>
                      {rimg ? <img src={getMediaUrl(rimg)} alt={r.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : null}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 14, fontSize: 14 }}><span>{r.name}</span><span style={{ color: '#56534D' }}>{r.price}</span></div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky price + add-to-bag bar */}
      <div className="pdpv2-bottombar" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 55, gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 14, background: 'rgba(248,246,240,0.96)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: `1px solid ${T.rule}`, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, lineHeight: 1 }}>{money(totalPrice)}</div>
          <div style={{ fontSize: 10.5, color: T.muted, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{configSummary}{nivodaPriceLoading ? '  ·  updating…' : ''}</div>
        </div>
        <button onClick={handleAddToCart} disabled={isLoading} className="pdpv2-addbtn" style={{ padding: '16px 26px', cursor: isLoading ? 'default' : 'pointer', background: T.ink, color: T.paper, border: 0, fontFamily: FONT_BODY, fontSize: 11.5, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{isLoading ? 'Adding…' : 'Add to bag'}</button>
      </div>

      <FooterV2 />

      <style>{`
        .pdpv2-bottombar { display: none; }
        @media (max-width:900px){
          .pdpv2-main{ grid-template-columns:1fr !important }
          .pdpv2-gallery{ position:static !important }
          .pdpv2-primary{ aspect-ratio:1 !important }
          .pdpv2-promise-top,.pdpv2-promise-grid{ grid-template-columns:1fr !important }
          .pdpv2-rec{ grid-template-columns:repeat(2,1fr) !important }
          .pdpv2-spec{ grid-template-columns:1fr !important }
          .pdpv2-bottombar{ display:grid !important }
          .pdpv2{ padding-bottom: 84px; }
        }
      `}</style>
    </div>
  );
};

export default ProductDetail;
