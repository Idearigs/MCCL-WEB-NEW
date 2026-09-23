
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Heart, Phone, MessageCircle, ChevronDown, ChevronUp, Plus, X, Minus, ZoomIn, ZoomOut, Play, Pause, Volume2, VolumeX, Check } from 'lucide-react';
import LuxuryNavigationWhite from '@/components/LuxuryNavigationWhite';
import { FooterSection } from '@/components/FooterSection';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL, { getMediaUrl } from '../config/api';
import NavigationV2 from '../components/home-v2/NavigationV2';
import FooterV2 from '../components/home-v2/FooterV2';
import { T, FONT_DISPLAY, FONT_BODY } from '../components/home-v2/tokens';
import { trackViewContent, trackAddToCart } from '../services/pixelService';
import { useCountry } from '../hooks/useCountry';
import DiamondHelpNudge from '../components/DiamondHelpNudge';

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
  const [priceEstimated, setPriceEstimated] = useState(false); // indicative made-to-order price

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
  const [playingTiles, setPlayingTiles] = useState<Record<number, boolean>>({});
  const mosaicRef = useRef<HTMLDivElement>(null); // mobile carousel scroller
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

    // Films tied to a diamond size show ONLY when that size is selected; films with
    // no size (the normal turntable clips) always show. Metal is ignored for films.
    const videos = allImages.filter(img =>
      img.type === 'video' && (!img.diamond_size_id || img.diamond_size_id === selectedDiamondSizeId)
    );

    const stills = allImages.filter(img => img.type !== 'video');

    // Choose the most specific set of stills, always falling back so the gallery
    // never blanks out (e.g. a diamond size that has no photos of its own).
    let chosen: any[] = [];
    if (selectedDiamondSizeId && selectedMetalId)
      chosen = stills.filter(img => img.metal_id === selectedMetalId && img.diamond_size_id === selectedDiamondSizeId);
    if (chosen.length === 0 && selectedDiamondSizeId)
      chosen = stills.filter(img => img.diamond_size_id === selectedDiamondSizeId);        // this size, any metal
    if (chosen.length === 0 && selectedMetalId)
      chosen = stills.filter(img => img.metal_id === selectedMetalId);                     // this metal, any size
    if (chosen.length === 0) {
      const firstMetalId = stills.find(img => img.metal_id)?.metal_id;                     // first metal that has photos
      chosen = firstMetalId ? stills.filter(img => img.metal_id === firstMetalId) : stills;
    }
    return [...chosen, ...videos];
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
  // Per-clarity diamond prices (for the "+£" deltas on the clarity cards). Fetched for
  // the current carat/colour/type; deltas are shown relative to the cheapest grade.
  const [clarityPrices, setClarityPrices] = useState<Record<string, number>>({});
  const fetchClarityDeltas = useCallback(async () => {
    if (!productData?.nivoda_enabled || !selectedCarat || !selectedColour) return;
    const config = productData.nivoda_options_config;
    const clarities: string[] = (config?.clarityOptions && config.clarityOptions.length ? config.clarityOptions : ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']);
    const shapeName = productData.stone_shapes?.[0]?.name;
    try {
      const results = await Promise.all(clarities.map(async (cl) => {
        try {
          const params = new URLSearchParams({ carat: selectedCarat, clarity: cl, color: selectedColour, stoneType: selectedStoneType });
          if (shapeName) params.set('shape', shapeName);
          const r = await fetch(`${API_BASE_URL}/nivoda/diamonds/price-suggestions?${params}`);
          const d = await r.json();
          return [cl, d?.data?.prices?.avg || 0] as [string, number];
        } catch { return [cl, 0] as [string, number]; }
      }));
      const map: Record<string, number> = {};
      results.forEach(([cl, avg]) => { if (avg > 0) map[cl] = avg; });
      setClarityPrices(map);
    } catch { /* ignore */ }
  }, [productData, selectedCarat, selectedColour, selectedStoneType]);
  useEffect(() => { fetchClarityDeltas(); }, [fetchClarityDeltas]);

  // Single source of truth for the gallery: the IMAGE metal always follows the selected
  // metal TYPE. However the type gets set (load, family/colour/carat pick), the photo
  // re-syncs here — so we can never show e.g. a white ring while "Yellow Gold" is chosen.
  // We only shoot three colours (white/yellow/rose); silver & platinum share the white render.
  useEffect(() => {
    const metals = productData?.available_metals;
    if (!metals || metals.length === 0 || !selectedMetalType) return;
    const imgs = productData?.images || [];
    const hasImg = (m: any) => imgs.some((img: any) => img.metal_id === m.id);
    const base = getMetalBase(selectedMetalType);
    const colour = (base === 'platinum' || base === 'silver' || base.includes('white')) ? 'white'
      : base.includes('yellow') ? 'yellow' : base.includes('rose') ? 'rose' : '';
    const match =
      (colour && metals.find((m: any) => (m.name || '').toLowerCase().includes(colour) && hasImg(m))) ||
      metals.find((m: any) => hasImg(m)) ||
      metals[0];
    if (match && match.id !== selectedMetal) setSelectedMetal(match.id);
  }, [selectedMetalType, productData]);

  // Arriving from search with a metal intent (e.g. …?metal=yellow&karat=14ct): pre-select
  // that metal so the ring opens already switched to the searched option. Applied once,
  // after the product loads, and only to a metal the product actually offers.
  const appliedMetalParam = useRef(false);
  useEffect(() => {
    if (appliedMetalParam.current || !productData) return;
    const sp = new URLSearchParams(location.search);
    const metal = (sp.get('metal') || '').toLowerCase();
    const karat = (sp.get('karat') || '').toLowerCase();
    if (!metal) return;
    const overrides = productData.ring_price_overrides;
    const purchasable = (v: string) => { const opt = metalTypeOptions.find(m => m.value === v); return !!(opt && overrides?.[opt.overrideKey]); };
    let desired: string | undefined;
    if (metal === 'platinum' || metal === 'silver') { if (purchasable(metal)) desired = metal; }
    else if (['yellow', 'white', 'rose'].includes(metal)) {
      desired = [karat, '18ct', '14ct', '9ct'].filter(Boolean).map(k => `${k}-${metal}-gold`).find(purchasable);
    }
    if (desired) { setSelectedMetalType(desired); appliedMetalParam.current = true; }
  }, [productData, location.search]);

  // When the metal changes, keep the SAME angle/view the customer was looking at (the
  // renders are ordered by a consistent angle sequence across metals), only clamping if
  // the new metal happens to have fewer views. This is what makes switching metal show
  // the same angle rather than jumping back to the first shot.
  useEffect(() => {
    const media = getMetalSpecificMedia(productData?.images || [], selectedMetal, selectedDiamondSize);
    const len = Math.max(1, media.length);
    setCurrentImageIndex(i => {
      const clamped = Math.min(i, len - 1);
      const el = mosaicRef.current;
      if (el) el.scrollTo({ left: clamped * el.clientWidth, behavior: 'auto' });
      return clamped;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMetal]);

  // Colour grades we have diamond imagery for (D–H); the colour selector shows only these.
  const COLOUR_IMG = ['D', 'E', 'F', 'G', 'H'];

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

      if (data.success && data.data?.prices && data.data.prices.avg > 0) {
        // The server returns an exact live price where stock exists, otherwise an
        // indicative made-to-order price (data.estimated) — either way we always
        // show a price so the customer is never left at a dead end.
        setNivodaPrice(data.data.prices);
        setPriceEstimated(!!data.data.estimated);
        setNivodaPriceError(null);
      } else {
        // Truly nothing to price from — reassure rather than alarm.
        setNivodaPrice(null);
        setPriceEstimated(false);
        setNivodaPriceError('We hand-source this combination — contact us for a tailored quote.');
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

          // Choose the default metal TYPE first (price/selector) — prefer 18ct white gold,
          // then fall back through the other karats/colours that actually have a price.
          const overrides = data.data.product.ring_price_overrides;
          let defaultType = '';
          if (overrides) {
            const preferred = ['18ct-white-gold', '18ct-yellow-gold', '18ct-rose-gold', '14ct-white-gold', '14ct-yellow-gold', '14ct-rose-gold', '9ct-white-gold', '9ct-yellow-gold', '9ct-rose-gold', 'platinum', 'silver'];
            defaultType = preferred.find(v => { const opt = metalTypeOptions.find(m => m.value === v); return opt && overrides[opt.overrideKey]; }) || '';
            if (defaultType) setSelectedMetalType(defaultType);
          }

          // Sync the initial IMAGE metal to that default type's colour, so the photo shown
          // matches the selected metal (silver/platinum share the white-gold render). Fall
          // back to any metal that has images, then the first metal.
          if (data.data.product.available_metals && data.data.product.available_metals.length > 0) {
            const imgs = data.data.product.images || [];
            const hasImg = (m: any) => imgs.some((img: any) => img.metal_id === m.id);
            const base = getMetalBase(defaultType); // white-gold | yellow-gold | rose-gold | platinum | silver
            const colour = (base === 'platinum' || base === 'silver' || base.includes('white')) ? 'white' : base.includes('yellow') ? 'yellow' : base.includes('rose') ? 'rose' : '';
            const match =
              (colour && data.data.product.available_metals.find((m: any) => (m.name || '').toLowerCase().includes(colour) && hasImg(m))) ||
              data.data.product.available_metals.find((m: any) => hasImg(m)) ||
              data.data.product.available_metals[0];
            if (match) setSelectedMetal(match.id);
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
        productUrl: location.pathname,
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

  // Mobile carousel: track the active slide from scroll, and step with the arrow.
  const onMosaicScroll = () => { const el = mosaicRef.current; if (!el || el.scrollWidth <= el.clientWidth + 4) return; setCurrentImageIndex(Math.round(el.scrollLeft / el.clientWidth)); };
  const goToSlide = (i: number) => { const el = mosaicRef.current; if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); };

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
  // Ring-only UI (size selector, ring-size spec) is shown only for ring categories.
  // Earrings / necklaces / bracelets reuse this template without the ring size step.
  const isRingCat = /ring/i.test(productData.category?.name || '');
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
  const isVid = (m: any) => !!m && (m.type === 'video' || isVideoFile(m.url));
  // Gallery = up to 5 stills, then EVERY film. Films are appended last in
  // displayImages, so on a product with many metal renders a plain slice(0,5)
  // dropped them off the end and they never showed. Keep them explicitly.
  const media = (() => {
    const src = displayImages || [];
    const stills = src.filter((m: any) => !isVid(m)).slice(0, 5);
    const films = src.filter(isVid);
    return [...stills, ...films];
  })();
  const activeMedia = media[currentImageIndex] || media[0];
  const gallery = media;
  const angleLabels = ['Three-quarter', 'Top', 'Front', 'Profile', 'Detail'];
  const chip = (on: boolean): React.CSSProperties => ({ padding: '9px 14px', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 12.5, border: `1px solid ${on ? T.ink : T.ruleSoft}`, background: on ? T.ink : '#FFFFFF', color: on ? T.paper : T.body });
  const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.gold };
  const stepLabel: React.CSSProperties = { fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 14 };
  const subLabel: React.CSSProperties = { fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, margin: '4px 0 8px' };
  const metalName = productData?.available_metals?.find((m: any) => m.id === selectedMetal)?.name || (metalTypeOptions.find(m => m.value === selectedMetalType)?.label) || '';
  const sizeLabel = ringSizes.find(s => s.value === selectedSize)?.label || selectedSize;
  const diamondName = productData?.available_diamond_sizes?.find((d: any) => d.id === selectedDiamondSize)?.display_name || productData?.available_diamond_sizes?.find((d: any) => d.id === selectedDiamondSize)?.name || '';
  const configSummary = [metalTypeOptions.find(m => m.value === selectedMetalType)?.label || metalName, isRingCat && selectedSize && ('Size ' + selectedSize), productData?.nivoda_enabled && selectedCarat && (selectedCarat + 'ct ' + selectedColour + ' ' + selectedClarity)].filter(Boolean).join('  ·  ');

  // Guided-step helpers (redesigned buy flow)
  const subHelp: React.CSSProperties = { fontSize: 12.5, color: T.muted, margin: '-2px 0 16px 38px', lineHeight: 1.5 };
  const metalBtn = (on: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 15px', minHeight: 44, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, border: `1px solid ${on ? T.ink : T.ruleSoft}`, background: on ? T.tint : '#FFFFFF', color: T.ink });
  const StepHead = ({ n, title, right }: { n: string; title: string; right?: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
      <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, flex: 'none', border: `1px solid ${T.ruleStrong}`, color: T.ink }}>{n}</span>
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: 24, color: T.ink, lineHeight: 1, flex: 1 }}>{title}</span>
      {right}
    </div>
  );
  // Minimal, separated option rows for the diamond step (each divided by a hairline)
  const optRow: React.CSSProperties = { padding: '18px 0', borderTop: `1px solid ${T.rule}` };
  const optHeadRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 };
  const optName: React.CSSProperties = { fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink, fontWeight: 500 };
  const optRecTag: React.CSSProperties = { fontSize: 10.5, letterSpacing: '0.06em', color: T.gold };
  const optCurVal: React.CSSProperties = { marginLeft: 'auto', fontSize: 12.5, color: T.body };
  const infoBtn: React.CSSProperties = { width: 16, height: 16, borderRadius: '50%', border: `1px solid ${T.ruleStrong}`, color: T.muted, fontSize: 10, cursor: 'pointer', background: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', lineHeight: 1, flex: 'none' };
  const helpLine: React.CSSProperties = { fontSize: 12, color: T.muted, lineHeight: 1.55, margin: '-4px 0 12px' };
  const scaleRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 500, color: T.body, marginTop: 10, letterSpacing: '0.02em' };
  const InfoI = ({ k, label }: { k: string; label: string }) => (
    <button onClick={() => toggleSection(k)} aria-label={label} title={label} style={infoBtn}>i</button>
  );
  const useRecommendation = () => { handleStoneTypeSelect('natural'); handleCaratSelect('1.00'); handleColourSelect('G'); handleClaritySelect('VS2'); };
  // Round-brilliant diamond illustration; inclusion dots increase as clarity drops.
  const CLARITY_INCL: Record<string, number> = { FL: 0, IF: 0, VVS1: 1, VVS2: 2, VS1: 3, VS2: 4, SI1: 7, SI2: 9, I1: 12, I2: 15 };
  // Relative clarity price multipliers (VS2 = 1.00 baseline), tuned to real Nivoda
  // ratios. Used to derive a clean, complete, monotonic clarity delta from the live
  // price of the SELECTED stone — so every grade shows a sensible figure even where
  // live per-grade stock is thin (e.g. lab-grown) and would otherwise read blank.
  const CLARITY_MULT: Record<string, number> = { FL: 1.36, IF: 1.24, VVS1: 1.15, VVS2: 1.08, VS1: 1.05, VS2: 1.00, SI1: 0.90, SI2: 0.82, I1: 0.70, I2: 0.62 };
  const DiamondIcon = ({ grade }: { grade: string }) => {
    const inclusions = CLARITY_INCL[grade] ?? 3;
    const isIF = grade === 'IF'; // Internally Flawless — clean inside, one tiny surface blemish at the edge
    const c = 50, Rg = 46, rA = 36, rt = 15, g = '#C6A24C';
    const A = (d: number) => (Math.PI / 180) * d;
    const P = (r: number, d: number): [number, number] => [+(c + r * Math.cos(A(d))).toFixed(2), +(c + r * Math.sin(A(d))).toFixed(2)];
    const tv = Array.from({ length: 8 }, (_, i) => P(rt, i * 45));        // table vertices (main dirs)
    const kite = Array.from({ length: 8 }, (_, i) => P(rA, i * 45));      // crown ring at main dirs
    const star = Array.from({ length: 8 }, (_, i) => P(rA, i * 45 + 22.5)); // crown ring at half dirs
    const crown16: [number, number][] = [];
    for (let i = 0; i < 8; i++) { crown16.push(kite[i]); crown16.push(star[i]); }
    const lines: [[number, number], [number, number]][] = [];
    for (let i = 0; i < 8; i++) {
      lines.push([tv[i], kite[i]]);            // kite ridge (table corner → girdle)
      lines.push([tv[i], star[i]]);            // kite side +
      lines.push([tv[i], star[(i + 7) % 8]]);  // kite side −
    }
    // Imperfection marks — a spread of dots and tiny "feather" lines so grades read at a glance.
    const marks: { x: number; y: number; t: 'dot' | 'line'; s?: number; a?: number }[] = [
      { x: 46, y: 47, t: 'dot', s: 2.3 }, { x: 57, y: 43, t: 'line', a: 35 }, { x: 50, y: 58, t: 'dot', s: 2 },
      { x: 41, y: 52, t: 'dot', s: 1.9 }, { x: 59, y: 54, t: 'line', a: -20 }, { x: 48, y: 41, t: 'dot', s: 2.2 },
      { x: 55, y: 50, t: 'dot', s: 1.8 }, { x: 43, y: 60, t: 'line', a: 60 }, { x: 61, y: 47, t: 'dot', s: 2 },
      { x: 39, y: 46, t: 'dot', s: 1.9 }, { x: 52, y: 62, t: 'line', a: 10 }, { x: 45, y: 55, t: 'dot', s: 2.1 },
      { x: 58, y: 60, t: 'dot', s: 1.8 }, { x: 50, y: 38, t: 'line', a: 80 }, { x: 36, y: 55, t: 'dot', s: 2 },
    ];
    const ink = '#3D3A36';
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }} aria-hidden="true">
        <circle cx={c} cy={c} r={Rg} fill="#FFFFFF" stroke={g} strokeWidth="1.4" />
        {crown16.map((p, i) => { const o = P(Rg, i * 22.5); return <line key={'g' + i} x1={p[0]} y1={p[1]} x2={o[0]} y2={o[1]} stroke={g} strokeWidth="0.6" opacity="0.8" />; })}
        <polygon points={crown16.map(p => p.join(',')).join(' ')} fill="none" stroke={g} strokeWidth="0.9" opacity="0.9" />
        {lines.map((l, i) => <line key={'l' + i} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke={g} strokeWidth="0.7" opacity="0.85" />)}
        <polygon points={tv.map(p => p.join(',')).join(' ')} fill="none" stroke={g} strokeWidth="1" opacity="0.9" />
        {isIF && <circle cx={66} cy={38} r={1.7} fill="none" stroke={ink} strokeWidth="1.1" />}
        {marks.slice(0, inclusions).map((m, i) => m.t === 'dot'
          ? <circle key={'i' + i} cx={m.x} cy={m.y} r={m.s || 2} fill={ink} />
          : <line key={'i' + i} x1={m.x - 2.6 * Math.cos((m.a || 0) * Math.PI / 180)} y1={m.y - 2.6 * Math.sin((m.a || 0) * Math.PI / 180)} x2={m.x + 2.6 * Math.cos((m.a || 0) * Math.PI / 180)} y2={m.y + 2.6 * Math.sin((m.a || 0) * Math.PI / 180)} stroke={ink} strokeWidth="1.4" strokeLinecap="round" />
        )}
      </svg>
    );
  };

  return (
    <div style={{ background: '#FFFFFF', color: T.ink, fontFamily: FONT_BODY, minHeight: '100vh' }}>
      <style>{`
        .pdpv2 a{color:inherit;text-decoration:none}
        .pdpv2-tile{border:1px solid ${T.rule};cursor:pointer;transition:border-color .2s}
        .pdpv2-tile:hover,.pdpv2-tile[data-on="1"]{border-color:${T.ink}}
        .pdpv2-chip:hover{border-color:${T.ink}}
        .pdpv2-sizeopt{transition:background-color .12s}
        .pdpv2-sizeopt:hover[data-on="0"]{background:${T.paper}}
        .pdpv2-sizemenu{scrollbar-width:thin;scrollbar-color:${T.ruleStrong} transparent}
        .pdpv2-sizemenu::-webkit-scrollbar{width:8px}
        .pdpv2-sizemenu::-webkit-scrollbar-thumb{background:${T.ruleStrong};border-radius:4px;border:2px solid #fff}
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
          {/* Gallery — mosaic showing every render + film at once; sticks while the
              details column scrolls, so no white space opens up on the left. */}
          <div className="pdpv2-gallery" style={{ top: NAV_H + 12 }}>
            {gallery.length === 1 ? (
              <div style={{ position: 'relative', aspectRatio: '1', background: '#FFFFFF', border: `1px solid ${T.rule}`, overflow: 'hidden' }}>
                {isVid(gallery[0])
                  ? <FilmVideo url={getMediaUrl(gallery[0].url)} poster={undefined} />
                  : <img src={getMediaUrl(gallery[0].url)} alt={productData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
            ) : (
              // Desktop: masonry (2 balanced columns), full images never cropped.
              // Mobile: the same items become a swipeable single-image carousel (CSS).
              <div style={{ position: 'relative' }}>
                <div className="pdpv2-mosaic" ref={mosaicRef} onScroll={onMosaicScroll} style={{ columnCount: 2, columnGap: 8 }}>
                  {gallery.map((m: any, i: number) => (
                    <div key={i} className="pdpv2-tile2" style={{ breakInside: 'avoid', WebkitColumnBreakInside: 'avoid', marginBottom: 8, position: 'relative', overflow: 'hidden', background: '#FFFFFF', border: `1px solid ${T.rule}` }}>
                      {isVid(m)
                        ? <><video src={getMediaUrl(m.url)} autoPlay muted loop playsInline preload="auto" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            <span style={{ position: 'absolute', bottom: 8, left: 8, padding: '2px 7px', background: 'rgba(28,26,23,0.72)', color: '#fff', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', pointerEvents: 'none' }}>Film</span></>
                        : <img src={getMediaUrl(m.url)} alt={productData.name} style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" />}
                    </div>
                  ))}
                </div>
                {/* Mobile carousel controls */}
                <button className="pdpv2-galnav" aria-label="Next image" onClick={() => goToSlide((currentImageIndex + 1) % gallery.length)}>
                  <ChevronRight size={20} />
                </button>
                <div className="pdpv2-galdots">
                  {gallery.map((_: any, i: number) => (
                    <button key={i} aria-label={`Image ${i + 1}`} onClick={() => goToSlide(i)} className="pdpv2-galdot" data-on={i === currentImageIndex ? '1' : '0'} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Buy column */}
          <div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(34px,3.6vw,54px)', lineHeight: 1.02, margin: '0 0 16px' }}>{productData.name}</h1>

            {/* Simple header: name (above), small live price, then the current spec.
                The prominent live total + Add to bag live in the fixed bottom bar. */}
            <div style={{ padding: '4px 0 22px', marginBottom: 28, borderBottom: `1px solid ${T.rule}` }}>
              <div className="pdpv2-price" style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 400, fontSize: 26, lineHeight: 1.2, letterSpacing: '0.005em', fontVariantNumeric: 'tabular-nums', color: T.ink, padding: '2px 0' }}>{money(totalPrice)}<span style={{ fontFamily: FONT_BODY, fontWeight: 400, fontSize: 11, color: T.muted, marginLeft: 8 }}>incl. VAT</span></div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 8 }}>{configSummary}{nivodaPriceLoading ? '  ·  updating…' : ''}</div>
              {priceEstimated && !nivodaPriceLoading && (
                <div style={{ fontSize: 11.5, color: T.gold, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.gold, flex: 'none' }} />
                  Made to order — indicative price, hand-sourced and confirmed before payment
                </div>
              )}
            </div>

            {(purchasableMetals.length > 0 || (productData.available_metals || []).length > 0) && (
              <div style={{ marginBottom: 30 }}>
                <StepHead n="1" title="Choose your metal" />
                <div style={subHelp}>The band. Pick a metal{purchasableMetals.some(o => getMetalKarat(o.value)) ? ', then a colour and carat.' : '.'}</div>
                {purchasableMetals.length > 0 ? (() => {
                  const golds = purchasableMetals.filter(o => getMetalKarat(o.value));
                  const families = [
                    golds.length > 0 && { k: 'gold', label: 'Gold', dot: 'linear-gradient(135deg,#F4DFA6,#E3B85E)' },
                    purchasableMetals.some(o => o.value === 'platinum') && { k: 'platinum', label: 'Platinum', dot: '#E5E4E2' },
                    purchasableMetals.some(o => o.value === 'silver') && { k: 'silver', label: 'Silver', dot: '#C7C7C7' },
                  ].filter(Boolean) as { k: string; label: string; dot: string }[];
                  const curBase = getMetalBase(selectedMetalType);
                  const curKarat = getMetalKarat(selectedMetalType) || '18ct';
                  const curFamily = selectedMetalType === 'platinum' ? 'platinum' : selectedMetalType === 'silver' ? 'silver' : (curBase.endsWith('gold') ? 'gold' : (families[0]?.k || 'gold'));
                  const colourLabel: Record<string, string> = { 'white-gold': 'White', 'yellow-gold': 'Yellow', 'rose-gold': 'Rose' };
                  const availColours = ['white-gold', 'yellow-gold', 'rose-gold'].filter(c => golds.some(o => getMetalBase(o.value) === c));
                  const availKarats = ['9ct', '14ct', '18ct'].filter(k => golds.some(o => getMetalKarat(o.value) === k));
                  const comboValid = (c: string, k: string) => golds.some(o => o.value === `${k}-${c}`);
                  const dotOf = (c: string) => c === 'yellow-gold' ? 'linear-gradient(135deg,#F4DFA6,#E3B85E)' : c === 'rose-gold' ? 'linear-gradient(135deg,#F1D2C4,#DCA98E)' : 'linear-gradient(135deg,#F1F0F2,#DCDBDE)';
                  const pickFamily = (fk: string) => {
                    if (fk === 'platinum') return handleMetalTypeClick('platinum');
                    if (fk === 'silver') return handleMetalTypeClick('silver');
                    const pref = golds.find(o => o.value === '18ct-white-gold') || golds.find(o => getMetalBase(o.value) === 'white-gold') || golds[0];
                    if (pref) handleMetalTypeClick(pref.value);
                  };
                  const pickColour = (c: string) => { let k = curKarat; if (!comboValid(c, k)) k = availKarats.find(kk => comboValid(c, kk)) || availKarats[0]; handleMetalTypeClick(`${k}-${c}`); };
                  const pickKarat = (k: string) => { let c = curBase.endsWith('gold') ? curBase : 'white-gold'; if (!comboValid(c, k)) c = availColours.find(cc => comboValid(cc, k)) || availColours[0]; handleMetalTypeClick(`${k}-${c}`); };
                  return (
                    <>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {families.map(f => <button key={f.k} onClick={() => pickFamily(f.k)} style={metalBtn(curFamily === f.k)}><span style={{ width: 16, height: 16, borderRadius: '50%', background: f.dot, border: '1px solid rgba(0,0,0,0.15)' }} />{f.label}</button>)}
                      </div>
                      {curFamily === 'gold' && (
                        <>
                          <div style={{ ...subLabel, marginTop: 18 }}>Colour</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {availColours.map(c => <button key={c} onClick={() => pickColour(c)} style={metalBtn(curBase === c)}><span style={{ width: 16, height: 16, borderRadius: '50%', background: dotOf(c), border: '1px solid rgba(0,0,0,0.15)' }} />{colourLabel[c]} Gold</button>)}
                          </div>
                          <div style={{ ...subLabel, marginTop: 18 }}>Carat</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {availKarats.map(k => <button key={k} onClick={() => pickKarat(k)} style={metalBtn(curKarat === k)}>{k}</button>)}
                          </div>
                        </>
                      )}
                    </>
                  );
                })() : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {(productData.available_metals || []).map((m: any) => {
                      const on = selectedMetal === m.id;
                      return <button key={m.id} onClick={() => handleMetalThumbnailClick(m.id)} style={metalBtn(on)}><span style={{ width: 16, height: 16, borderRadius: '50%', background: m.color_code || '#D8D2C6', border: '1px solid rgba(0,0,0,0.15)' }} />{m.name}</button>;
                    })}
                  </div>
                )}
              </div>
            )}

            {productData.nivoda_enabled && (
              <div style={{ marginBottom: 30, borderTop: `1px solid ${T.rule}`, paddingTop: 26 }}>
                <StepHead n="2" title="Choose your diamond" />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: T.tint, border: `1px solid ${T.rule}`, padding: '11px 14px', marginBottom: 4, marginTop: 6 }}>
                  <div style={{ fontSize: 12.5, color: T.body }}>Recommended: <strong style={{ color: T.ink, fontWeight: 500 }}>1ct · G · VS2</strong></div>
                  <button onClick={useRecommendation} style={{ border: `1px solid ${T.ink}`, background: 'transparent', color: T.ink, padding: '8px 13px', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Use recommendation</button>
                </div>

                <div style={optRow}>
                  <div style={optHeadRow}><span style={optName}>Type</span></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {stoneOptions.stoneType.map((o: any) => { const on = selectedStoneType === o.value; return <button key={o.value} onClick={() => handleStoneTypeSelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}
                  </div>
                </div>
                {stoneOptions.carat.length > 0 && (() => {
                  const carats = stoneOptions.carat;
                  const n = carats.length;
                  const idx = Math.max(0, carats.findIndex((o: any) => o.value === selectedCarat));
                  const at = (i: number) => `calc(11px + ${n > 1 ? i / (n - 1) : 0} * (100% - 22px))`;
                  return (
                    <div style={optRow}>
                      <div style={optHeadRow}><span style={optName}>Total carat</span><InfoI k="help-carat" label="What is carat?" /><span style={{ ...optCurVal, color: T.gold, fontWeight: 600 }}>{carats[idx]?.value}ct</span></div>
                      {expandedSections['help-carat'] && <div style={helpLine}>Carat is the diamond's size — bigger looks more impressive and costs more. 1 carat is the most popular.</div>}
                      <div className="carat-slider" style={{ position: 'relative', height: 30, marginTop: 12 }}>
                        <div className="carat-track" />
                        {carats.map((o: any, i: number) => <div key={'t' + o.value} className="carat-tick" style={{ left: at(i) }} />)}
                        <div className="carat-handle" style={{ left: at(idx) }} />
                        <input type="range" className="carat-input" min={0} max={n - 1} step={1} value={idx} onChange={e => handleCaratSelect(carats[+e.target.value].value)} aria-label="Total carat" />
                      </div>
                      <div style={{ position: 'relative', height: 16, marginTop: 6 }}>
                        {carats.map((o: any, i: number) => (
                          <span key={'l' + o.value} onClick={() => handleCaratSelect(o.value)} style={{ position: 'absolute', left: at(i), transform: 'translateX(-50%)', fontSize: 10.5, cursor: 'pointer', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: i === idx ? T.ink : T.muted, fontWeight: i === idx ? 700 : 400 }}>{parseFloat(o.value).toFixed(2)}</span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {stoneOptions.colour.length > 0 && (() => {
                  const avail = COLOUR_IMG.filter(col => stoneOptions.colour.some((o: any) => o.value === col));
                  const colours = avail.length ? avail : COLOUR_IMG;
                  return (
                    <div style={optRow}>
                      <div style={optHeadRow}><span style={optName}>Colour</span><span style={optRecTag}>G recommended</span><InfoI k="help-colour" label="What is colour?" /><span style={optCurVal}>{selectedColour}</span></div>
                      {expandedSections['help-colour'] && <div style={helpLine}>How icy-white the diamond is. D is the most colourless (and priciest); G still looks bright white for far less.</div>}
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }} className="pdpv2-nobar">
                        {colours.map((col) => {
                          const on = selectedColour === col;
                          return (
                            <button key={col} onClick={() => handleColourSelect(col)} style={{ flex: '0 0 auto', width: 92, padding: '10px 8px 9px', cursor: 'pointer', background: on ? T.tint : '#FFFFFF', border: `1px solid ${on ? T.ink : T.ruleSoft}`, boxShadow: on ? `inset 0 0 0 1px ${T.ink}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <img src={`/diamond-colours/${col}.webp`} alt={`${col} colour diamond`} style={{ width: 64, height: 64, objectFit: 'cover' }} loading="lazy" />
                              <span style={{ fontSize: 11.5, fontWeight: on ? 600 : 500, color: T.ink }}>{col}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div style={scaleRow}><span>◀ Icy white (pricier)</span><span>Warmer ▶</span></div>
                    </div>
                  );
                })()}
                {stoneOptions.clarity.length > 0 && (() => {
                  // Build one stable VS2-baseline diamond price from EVERY grade that currently
                  // has live stock (each normalised by its clarity multiplier, then median-ed so
                  // a thin-stock outlier can't skew it). Every grade's price is then derived from
                  // that baseline — so the preview is always complete and monotonic, even when the
                  // SELECTED grade itself is out of stock (its narrow spec returns nothing).
                  const baseVS2 = (() => {
                    // Primary anchor: the live price of the SELECTED stone (the server always
                    // returns one — exact or indicative), normalised to the VS2 base.
                    if (nivodaPrice?.avg && CLARITY_MULT[selectedClarity]) return nivodaPrice.avg / CLARITY_MULT[selectedClarity];
                    // Fallback: median of whatever per-grade previews we have.
                    const xs = Object.keys(clarityPrices)
                      .map(g => (clarityPrices[g] > 0 && CLARITY_MULT[g]) ? clarityPrices[g] / CLARITY_MULT[g] : 0)
                      .filter(x => x > 0)
                      .sort((a, b) => a - b);
                    return xs.length ? xs[Math.floor((xs.length - 1) / 2)] : 0;
                  })();
                  const selPrice = baseVS2 * (CLARITY_MULT[selectedClarity] ?? 1);
                  return (
                    <div style={optRow}>
                      <div style={optHeadRow}><span style={optName}>Clarity</span><span style={optRecTag}>VS2 recommended</span><InfoI k="help-clarity" label="What is clarity?" /><span style={optCurVal}>{selectedClarity}</span></div>
                      {expandedSections['help-clarity'] && <div style={helpLine}>How clean the diamond looks inside. From VS2 up, no marks are visible to the naked eye.</div>}
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }} className="pdpv2-nobar">
                        {stoneOptions.clarity.map((o: any) => {
                          const on = selectedClarity === o.value;
                          const gMult = CLARITY_MULT[o.value] ?? 1;
                          const delta = baseVS2 ? Math.round(baseVS2 * gMult - selPrice) : 0;
                          const priceText = on ? 'Included' : !baseVS2 ? '' : delta > 0 ? '+' + money(delta) : delta < 0 ? '−' + money(-delta) : '±£0';
                          return (
                            <button key={o.value} onClick={() => handleClaritySelect(o.value)} style={{ flex: '0 0 auto', width: 92, padding: '12px 8px 10px', cursor: 'pointer', background: on ? T.tint : '#FFFFFF', border: `1px solid ${on ? T.ink : T.ruleSoft}`, boxShadow: on ? `inset 0 0 0 1px ${T.ink}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                              <span style={{ width: 64, height: 64 }}><DiamondIcon grade={o.value} /></span>
                              <span style={{ fontSize: 11.5, fontWeight: on ? 600 : 500, color: T.ink }}>{o.value}</span>
                              <span style={{ fontSize: 10, fontWeight: 500, color: delta > 0 ? T.gold : T.muted, minHeight: 12, fontVariantNumeric: 'tabular-nums' }}>{priceText}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div style={scaleRow}><span>◀ Cleaner (pricier)</span><span>More marks ▶</span></div>
                    </div>
                  );
                })()}
                {stoneOptions.cut && stoneOptions.cut.length > 0 && (
                  <div style={optRow}>
                    <div style={optHeadRow}><span style={optName}>Cut</span><span style={optCurVal}>{selectedCut}</span></div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{stoneOptions.cut.map((o: any) => { const on = selectedCut === o.value; return <button key={o.value} onClick={() => handleCutSelect(o.value)} className="pdpv2-chip" style={chip(on)}>{o.label}</button>; })}</div>
                  </div>
                )}

                {(((stoneOptions as any).polish && (stoneOptions as any).polish.length) || ((stoneOptions as any).symmetry && (stoneOptions as any).symmetry.length) || ((stoneOptions as any).certificate && (stoneOptions as any).certificate.length)) ? (
                  <div style={optRow}>
                    <button onClick={() => toggleStoneOption('advanced')} style={{ display: 'flex', justifyContent: 'space-between', width: '100%', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink, padding: 0, fontWeight: 500 }}>
                      <span>Grading &amp; certification</span><span style={{ color: T.muted, fontSize: 16, lineHeight: 1 }}>{expandedStoneOptions.advanced ? '−' : '+'}</span>
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

            {isRingCat && (
            <div style={{ marginBottom: 30 }}>
              <StepHead n={productData.nivoda_enabled ? '3' : '2'} title="Ring size" right={<Link to="/customer-service" style={{ fontSize: 11, color: T.gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Size guide</Link>} />
              <div style={subHelp}>Not sure of the size? Order anyway — we offer complimentary resizing.</div>
              {(() => {
                const splitLbl = (l: string) => { const m = l.match(/^(.*?)\s*\((.*)\)\s*$/); return { uk: m ? m[1] : l, conv: m ? m[2] : '' }; };
                const cur = splitLbl(sizeLabel);
                return (
                  <div className="size-dropdown-container" style={{ position: 'relative' }}>
                    <button type="button" onClick={() => setSizeDropdownOpen(o => !o)} aria-haspopup="listbox" aria-expanded={sizeDropdownOpen}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', fontFamily: FONT_BODY, background: '#FFFFFF', border: `1px solid ${sizeDropdownOpen ? T.ink : T.ruleStrong}`, cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}>
                      <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{cur.uk}</span>
                        {cur.conv && <span style={{ fontSize: 12, color: T.muted }}>{cur.conv}</span>}
                      </span>
                      <ChevronDown size={16} style={{ color: T.muted, transform: sizeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform .18s', flex: 'none' }} />
                    </button>
                    {sizeDropdownOpen && (
                      <div role="listbox" className="pdpv2-sizemenu" style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, maxHeight: 288, overflowY: 'auto', background: '#FFFFFF', border: `1px solid ${T.ruleStrong}`, boxShadow: '0 14px 36px rgba(20,18,15,0.16)', zIndex: 40, padding: 5 }}>
                        {ringSizes.map(s => {
                          const on = s.value === selectedSize; const p = splitLbl(s.label);
                          return (
                            <button key={s.value} type="button" role="option" aria-selected={on} onClick={() => { setSelectedSize(s.value); setSizeDropdownOpen(false); }} className="pdpv2-sizeopt" data-on={on ? '1' : '0'}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', border: 'none', borderLeft: `2px solid ${on ? T.gold : 'transparent'}`, background: on ? T.tint : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                              <span style={{ fontSize: 13.5, fontWeight: on ? 600 : 500, color: T.ink }}>{p.uk}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, color: T.muted, fontVariantNumeric: 'tabular-nums' }}>{p.conv}</span>
                                {on && <Check size={14} style={{ color: T.gold, flex: 'none' }} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
              {(productData.available_diamond_sizes || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {productData.available_diamond_sizes.map((d: any) => {
                    const on = selectedDiamondSize === d.id;
                    return <button key={d.id} onClick={() => setSelectedDiamondSize(d.id)} className="pdpv2-chip" style={chip(on)}>{d.display_name || d.name}</button>;
                  })}
                </div>
              )}
            </div>
            )}

            {/* Primary CTA lives in the fixed bottom bar (always in view). */}
            <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.muted, padding: '18px 0', borderBottom: `1px solid ${T.rule}`, borderTop: `1px solid ${T.rule}`, margin: '4px 0 18px' }}>Free insured delivery</div>

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
              {([(metalTypeOptions.find(m => m.value === selectedMetalType)?.label || metalName) && ['Metal', metalTypeOptions.find(m => m.value === selectedMetalType)?.label || metalName], isRingCat && ['Size', sizeLabel], diamondName && ['Diamond', diamondName], productData.nivoda_enabled && selectedCarat && ['Carat', selectedCarat + ' ct'], productData.nivoda_enabled && selectedClarity && ['Clarity', selectedClarity], productData.nivoda_enabled && selectedColour && ['Colour', selectedColour]].filter(Boolean) as any[]).map((row: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: `1px solid ${T.rule}`, fontSize: 13 }}>
                  <span style={{ color: T.muted }}>{row[0]}</span><span>{row[1]}</span>
                </div>
              ))}
            </div>

            {/* Price bar — aligned to this column, pinned to the viewport bottom while the
                customer scrolls the options (Diamond-Heaven style). */}
            <div className="pdpv2-pricebar" style={{ position: 'sticky', bottom: 0, zIndex: 30, marginTop: 30, background: T.tint, border: `1px solid ${T.rule}`, boxShadow: '0 -8px 24px rgba(33,30,25,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 18px calc(15px + env(safe-area-inset-bottom))' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{configSummary}{nivodaPriceLoading ? '  ·  updating…' : ''}</div>
                  <div className="pdpv2-price" style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 400, fontSize: 25, lineHeight: 1.15, letterSpacing: '0.005em', fontVariantNumeric: 'tabular-nums', color: T.ink }}>{money(totalPrice)}<span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 400, color: T.muted, marginLeft: 8 }}>incl. VAT</span></div>
                </div>
                <button onClick={handleAddToCart} disabled={isLoading} className="pdpv2-addbtn" style={{ padding: '16px clamp(24px,3vw,44px)', cursor: isLoading ? 'default' : 'pointer', background: T.ink, color: T.paper, border: 0, fontFamily: FONT_BODY, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{isLoading ? 'Adding…' : 'Add to bag'}</button>
              </div>
            </div>
          </div>
        </main>

        {/* Our promise */}
        <section style={{ background: T.ink, color: T.onDarkSoft, padding: 'clamp(60px,5.5vw,100px) clamp(24px,3vw,52px)' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'end', paddingBottom: 36, borderBottom: `1px solid ${T.ruleDark}` }} className="pdpv2-promise-top">
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 'clamp(30px,3.4vw,52px)', lineHeight: 1.08, margin: 0, maxWidth: '15ch', color: '#fff' }}>Where craftsmanship meets distinction.</h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>Every piece is cut, set and finished by hand in our own workshop — the same bench, the same care, for generations.</p>
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
          <section style={{ padding: 'clamp(48px,5vw,80px) clamp(24px,3vw,52px)', background: T.paper }}>
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

      <FooterV2 />

      <style>{`
        .pdpv2-gallery{ position: sticky; align-self: start; }
        .pdpv2-galnav, .pdpv2-galdots{ display:none; }
        .pdpv2-galnav{ position:absolute; top:50%; right:12px; transform:translateY(-50%); width:40px; height:40px; border-radius:50%; background:rgba(255,255,255,0.94); border:1px solid ${T.rule}; align-items:center; justify-content:center; cursor:pointer; color:${T.ink}; box-shadow:0 2px 12px rgba(28,26,23,0.16); z-index:4; }
        .pdpv2-galdots{ position:absolute; bottom:14px; left:0; right:0; justify-content:center; gap:7px; z-index:4; }
        .pdpv2-galdot{ width:7px; height:7px; border-radius:50%; border:0; padding:0; background:rgba(28,26,23,0.28); cursor:pointer; transition:background .2s,width .2s; }
        .pdpv2-galdot[data-on="1"]{ background:${T.gold}; }
        .pdpv2-nobar{ scrollbar-width:thin; }
        .pdpv2-nobar::-webkit-scrollbar{ height:5px; }
        .pdpv2-nobar::-webkit-scrollbar-thumb{ background:${T.ruleStrong}; border-radius:3px; }
        .carat-track{ position:absolute; left:11px; right:11px; top:50%; height:5px; transform:translateY(-50%); background:${T.ink}; border-radius:3px; }
        .carat-tick{ position:absolute; top:50%; width:2px; height:13px; transform:translate(-50%,-50%); background:${T.ink}; border-radius:1px; z-index:2; }
        .carat-handle{ position:absolute; top:50%; width:13px; height:26px; transform:translate(-50%,-50%); border-radius:4px; background:linear-gradient(180deg,#F7EFD8,#E7D3A2); border:1.5px solid ${T.gold}; box-shadow:0 1px 5px rgba(33,30,25,0.32); pointer-events:none; z-index:3; }
        .carat-handle::after{ content:''; position:absolute; left:50%; top:5px; bottom:5px; width:1px; transform:translateX(-50%); background:rgba(184,146,63,0.75); }
        .carat-input{ position:absolute; inset:0; width:100%; height:100%; margin:0; opacity:0; cursor:grab; z-index:4; -webkit-appearance:none; appearance:none; background:transparent; }
        .carat-input:active{ cursor:grabbing; }
        .carat-input::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:26px; height:26px; cursor:grab; }
        .carat-input::-moz-range-thumb{ width:26px; height:26px; border:0; background:transparent; cursor:grab; }
        @media (max-width:900px){
          .pdpv2-main{ grid-template-columns:minmax(0,1fr) !important; padding-left:16px !important; padding-right:16px !important }
          .pdpv2-gallery{ position:static !important; min-width:0; margin:0 -16px 30px; width:calc(100% + 32px) }
          /* on mobile the price bar is fixed to the viewport bottom so it's never cut off */
          .pdpv2-pricebar{ position:fixed !important; left:0; right:0; bottom:0; margin:0 !important; border-left:0 !important; border-right:0 !important; z-index:55 }
          .pdpv2{ padding-bottom:92px }
          /* gallery becomes a full-bleed, borderless, swipeable single-image carousel */
          .pdpv2-mosaic{ column-count:1 !important; display:flex !important; overflow-x:auto; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; scrollbar-width:none; gap:0 !important; }
          .pdpv2-mosaic::-webkit-scrollbar{ display:none }
          .pdpv2-tile2{ flex:0 0 100% !important; margin:0 !important; scroll-snap-align:center; aspect-ratio:1/1; border:0 !important; }
          .pdpv2-tile2 img, .pdpv2-tile2 video{ width:100% !important; height:100% !important; }
          .pdpv2-tile2 img{ object-fit:contain !important; }
          .pdpv2-tile2 video{ object-fit:cover !important; }
          .pdpv2-galnav{ display:flex !important }
          .pdpv2-galdots{ display:flex !important }
          .pdpv2-price{ font-size:20px !important }
          .pdpv2-promise-top,.pdpv2-promise-grid{ grid-template-columns:1fr !important }
          .pdpv2-rec{ grid-template-columns:repeat(2,1fr) !important }
          .pdpv2-spec{ grid-template-columns:1fr !important }
        }
      `}</style>
      {productData?.nivoda_enabled && <DiamondHelpNudge productName={productData?.name} />}
    </div>
  );
};

export default ProductDetail;
