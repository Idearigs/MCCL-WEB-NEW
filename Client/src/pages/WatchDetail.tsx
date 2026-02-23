import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, Clock, Droplet, Maximize2 } from 'lucide-react';
import LuxuryNavigationWhite from '@/components/LuxuryNavigationWhite';
import { FooterSection } from '@/components/FooterSection';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL, { getMediaUrl } from '../config/api';

interface WatchSpecification {
  // Case specifications
  case_material?: string;
  case_diameter?: string;
  case_thickness?: string;
  case_shape?: string;
  case_weight?: string;

  // Dial specifications
  dial_color?: string;
  dial_colour?: string;
  dial?: string;
  dial_crystal?: string;
  dial_hands_count?: string;

  // Strap specifications
  strap_material?: string;
  strap_color?: string;
  strap_width?: string;
  buckle_type?: string;

  // Movement specifications
  movement_type?: string;
  movement_name?: string;
  movement_battery_type?: string;
  movement_manufacturing?: string;
  battery_life?: string;

  // Glass/Crystal specifications
  glass_type?: string;

  // Water and durability
  water_resistance?: string;
  watertightness?: string;

  // Functions and features
  functions?: string;
  features?: string;
  additional_features?: string;

  // Roamer-specific
  antimagnetic_protection?: string;
  shock_resistance?: string;
  luminosity?: string;
  movement_accuracy?: string;

  // General
  gender?: string;
  style?: string;
}

interface Watch {
  id: string;
  name: string;
  slug: string;
  model_number: string;
  base_price: number;
  sale_price: number | null;
  short_description: string;
  description: string;
  warranty_years: number;
  care_instructions: string;
  watch_type: string;
  brand: {
    id: string;
    name: string;
    logo_url: string;
  };
  collection: {
    id: string;
    name: string;
  };
  images: Array<{
    id: string;
    image_url: string;
    alt_text: string;
  }>;
  specifications: WatchSpecification;
  in_stock: boolean;
  stock_quantity: number;
}

// Brand-specific specification display configuration
const BRAND_SPEC_CONFIG: { [key: string]: { sections: { [key: string]: { label: string; fields: Array<{ key: keyof WatchSpecification; label: string }> } } } } = {
  'Festina': {
    sections: {
      'case': {
        label: 'Case',
        fields: [
          { key: 'case_shape', label: 'Shape' },
          { key: 'case_material', label: 'Material' },
          { key: 'case_diameter', label: 'Diameter' },
          { key: 'case_thickness', label: 'Thickness' },
          { key: 'case_weight', label: 'Weight' }
        ]
      },
      'dial': {
        label: 'Dial',
        fields: [
          { key: 'dial_colour', label: 'Colour' },
          { key: 'dial_crystal', label: 'Crystal' },
          { key: 'dial_hands_count', label: 'Number of Hands' },
          { key: 'dial', label: 'Details' }
        ]
      },
      'strap': {
        label: 'Strap',
        fields: [
          { key: 'strap_material', label: 'Material' },
          { key: 'strap_color', label: 'Colour' },
          { key: 'strap_width', label: 'Width' },
          { key: 'buckle_type', label: 'Clasp Type' }
        ]
      },
      'movement': {
        label: 'Movement',
        fields: [
          { key: 'movement_name', label: 'Name' },
          { key: 'movement_type', label: 'Type' },
          { key: 'movement_battery_type', label: 'Battery Type' },
          { key: 'movement_manufacturing', label: 'Manufacturing' },
          { key: 'battery_life', label: 'Power Reserve' }
        ]
      },
      'functions': {
        label: 'Functions',
        fields: [
          { key: 'functions', label: 'Functions' }
        ]
      },
      'features': {
        label: 'Features',
        fields: [
          { key: 'features', label: 'Features' },
          { key: 'additional_features', label: 'Additional Features' }
        ]
      }
    }
  },
  'Briston': {
    sections: {
      'movement': {
        label: 'Movement',
        fields: [
          { key: 'movement_name', label: 'Name' },
          { key: 'movement_type', label: 'Type' },
          { key: 'movement_battery_type', label: 'Battery Type' },
          { key: 'battery_life', label: 'Power Reserve' }
        ]
      },
      'case': {
        label: 'Case',
        fields: [
          { key: 'case_shape', label: 'Shape' },
          { key: 'case_material', label: 'Material' },
          { key: 'case_diameter', label: 'Diameter' },
          { key: 'case_thickness', label: 'Thickness' },
          { key: 'case_weight', label: 'Weight' }
        ]
      },
      'dial': {
        label: 'Dial & Hands',
        fields: [
          { key: 'dial_colour', label: 'Colour' },
          { key: 'dial_crystal', label: 'Crystal' },
          { key: 'dial_hands_count', label: 'Number of Hands' },
          { key: 'dial', label: 'Details' }
        ]
      },
      'strap': {
        label: 'Strap',
        fields: [
          { key: 'strap_material', label: 'Material' },
          { key: 'strap_color', label: 'Colour' },
          { key: 'strap_width', label: 'Width' },
          { key: 'buckle_type', label: 'Clasp Type' }
        ]
      }
    }
  },
  'Roamer': {
    sections: {
      'movement': {
        label: 'Movement',
        fields: [
          { key: 'movement_name', label: 'Name' },
          { key: 'movement_type', label: 'Type' },
          { key: 'battery_life', label: 'Power Reserve' }
        ]
      },
      'water': {
        label: 'Water Resistance',
        fields: [
          { key: 'water_resistance', label: 'Water Resistance' },
          { key: 'watertightness', label: 'Watertightness' }
        ]
      },
      'antimagnetic': {
        label: 'Antimagnetic Protection',
        fields: [
          { key: 'antimagnetic_protection', label: 'Protection Level' }
        ]
      },
      'shock': {
        label: 'Shock Resistance',
        fields: [
          { key: 'shock_resistance', label: 'Shock Resistance' }
        ]
      },
      'luminosity': {
        label: 'Luminosity',
        fields: [
          { key: 'luminosity', label: 'Luminosity Level' }
        ]
      },
      'accuracy': {
        label: 'Movement Accuracy',
        fields: [
          { key: 'movement_accuracy', label: 'Accuracy' }
        ]
      }
    }
  }
};

// Brand-specific accent colors
const BRAND_COLOR_CONFIG: { [key: string]: string } = {
  'Festina': '#003a63',
  'Briston': '#0A5A8E',
  'Roamer': '#C3A473'
};

// Brand-specific showcase section content
const BRAND_SHOWCASE_CONFIG: { [key: string]: { col1: { title: string; text: string }; col2: { title: string; text: string }; col3: { title: string; text: string } } } = {
  'Festina': {
    col1: { title: 'Over 120 Years of Heritage', text: 'Born in 1902 in La Chaux-de-Fonds, Switzerland, Festina has spent over a century refining the art of watchmaking — official timekeeper of the Tour de France since 1983.' },
    col2: { title: 'Swiss Quality Standards', text: 'Every Festina timepiece undergoes rigorous testing to meet exacting Swiss quality benchmarks, ensuring precision timekeeping and lasting durability for everyday wear.' },
    col3: { title: 'Authorised Retailer Support', text: 'As an official Festina retailer, McCulloch Jewellers offers expert advice, genuine products, and dedicated after-sales support for your Festina timepiece.' },
  },
  'Roamer': {
    col1: { title: '135 Years of Swiss Tradition', text: 'Founded in 1888 in Solothurn, Switzerland, Roamer blends over 135 years of precision engineering with timeless design — a proud chapter in Swiss horological history.' },
    col2: { title: 'Sapphire Crystal & Swiss Movements', text: 'Every Roamer watch is built with sapphire crystal glass and reliable Swiss movements, delivering uncompromising accuracy and a lifetime of dependable performance.' },
    col3: { title: 'Authorised Retailer Support', text: 'As an authorised Roamer retailer, McCulloch Jewellers provides personalised guidance and comprehensive after-sales service to keep your Roamer watch in perfect condition.' },
  },
  'Briston': {
    col1: { title: 'Contemporary London Spirit', text: 'Founded in 2013 in London, Briston brings a bold, colourful vision to watchmaking — combining vibrant acetate cases with a fresh design language that stands apart from tradition.' },
    col2: { title: 'Colour, Quality & Versatility', text: 'Each Briston watch features a distinctive acetate case available in a spectrum of colours, reliable Japanese movements, and interchangeable straps for effortless personalisation.' },
    col3: { title: 'Authorised Retailer Support', text: 'As an official Briston retailer, McCulloch Jewellers is here to help you find your perfect colourful companion with expert personal service and genuine product guarantee.' },
  },
};

const WatchDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [watch, setWatch] = useState<Watch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [expandedSpecs, setExpandedSpecs] = useState<{ [key: string]: boolean }>({});
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [accessories, setAccessories] = useState<Array<{id:string;name:string;slug:string;strap_type:string;color:string;width_mm:number;price_gbp:number;image_url:string}>>([]);
  const [accessoryFilter, setAccessoryFilter] = useState<string>('all');
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Simple layout - no scroll effect needed

  // Fetch watch data
  useEffect(() => {
    const fetchWatch = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/watches/${productId}`);

        if (!response.ok) {
          throw new Error('Watch not found');
        }

        const data = await response.json();
        if (data.success) {
          const watchData = data.data;
          console.log('Watch loaded:', {
            name: watchData.name,
            brand: watchData.brand?.name,
            brandConfig: BRAND_SPEC_CONFIG[watchData.brand?.name || '']
          });
          setWatch(watchData);
          // Open all spec sections by default
          const config = BRAND_SPEC_CONFIG[watchData.brand?.name || ''];
          const allKeys: { [key: string]: boolean } = { care: true };
          if (config) Object.keys(config.sections).forEach(k => { allKeys[k] = true; });
          // Desktop fixed keys
          ['case', 'movement', 'water'].forEach(k => { allKeys[k] = true; });
          setExpandedSpecs(allKeys);
        } else {
          throw new Error(data.message || 'Failed to load watch');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load watch');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchWatch();
    }
  }, [productId]);

  // Fetch watch-specific compatible straps
  useEffect(() => {
    if (!watch?.id) return;
    fetch(`${API_BASE_URL}/watches/${watch.id}/straps`)
      .then(r => r.json())
      .then(d => { if (d.success) setAccessories(d.data); })
      .catch(() => {});
  }, [watch?.id]);


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading watch details...</p>
        </div>
      </div>
    );
  }

  if (error || !watch) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Watch not found'}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-900 text-white rounded hover:bg-gray-800">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayImages = watch.images && watch.images.length > 0 ? watch.images : [{ id: '1', image_url: '/placeholder.png', alt_text: watch.name }];
  const currentImage = displayImages[currentImageIndex];
  const price = watch.sale_price || watch.base_price;
  const discount = watch.sale_price ? Math.round(((watch.base_price - watch.sale_price) / watch.base_price) * 100) : 0;

  const handleAddToCart = () => {
    const selectedVariantData = selectedVariant && watch?.variants
      ? watch.variants.find(v => v.id === selectedVariant)
      : null;

    const cartPrice = selectedVariantData && selectedVariantData.price_adjustment
      ? price + selectedVariantData.price_adjustment
      : price;

    const selectedOptions: any = {
      brand: watch.brand.name
    };
    if (selectedVariantData?.name) {
      selectedOptions.variant_name = selectedVariantData.name;
    }

    addToCart({
      id: watch.id,
      name: watch.name,
      price: cartPrice,
      image: currentImage.image_url,
      brand: watch.brand.name,
      type: 'watch',
      variant_id: selectedVariant,
      variant_name: selectedVariantData?.name,
      selectedOptions: selectedOptions
    });
  };

  const toggleSpecSection = (section: string) => {
    setExpandedSpecs(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <LuxuryNavigationWhite />

      {/* Breadcrumb */}
      <nav className="hidden lg:block px-8 py-4 text-sm text-gray-600 border-b border-gray-100 mt-20">
        <button onClick={() => navigate('/')} className="hover:text-gray-900">Home</button>
        <span className="mx-2">›</span>
        <button onClick={() => navigate('/watches')} className="hover:text-gray-900">Watches</button>
        <span className="mx-2">›</span>
        {watch?.brand && (
          <>
            <button onClick={() => navigate(`/collections/${watch.collection?.name?.toLowerCase() || 'watches'}`)} className="hover:text-gray-900">
              {watch.brand.name}
            </button>
            <span className="mx-2">›</span>
          </>
        )}
        <span className="text-gray-900 font-medium">{watch?.name}</span>
      </nav>

      {/* Mobile Breadcrumb */}
      <nav className="block lg:hidden w-full px-4 py-3 bg-white border-b border-gray-200 relative z-30 overflow-x-auto" style={{marginTop: '120px'}}>
        <div className="flex items-center gap-2 text-xs text-gray-700 font-futura-pt whitespace-nowrap font-normal">
          <button onClick={() => navigate('/')} className="hover:text-gray-900 flex-shrink-0">Home</button>
          <span className="text-gray-500 flex-shrink-0">›</span>
          <button onClick={() => navigate('/watches')} className="hover:text-gray-900 flex-shrink-0">Watches</button>
          <span className="text-gray-500 flex-shrink-0">›</span>
          <span className="text-gray-900 font-medium flex-shrink-0">{watch.name}</span>
        </div>
      </nav>

      <div className="hidden lg:grid gap-0 mt-20" style={{ gridTemplateColumns: '65% 35%' }}>

          {/* Left Column - 2-column image grid (desktop, ring-page style) */}
          <div className="w-full px-2 pt-2">
            <div className="grid grid-cols-2 gap-2">
              {displayImages.map((img, index) => {
                const isLastOdd = displayImages.length % 2 === 1 && index === displayImages.length - 1;
                return (
                  <div
                    key={img.id}
                    className={`relative bg-[#f5f5f5] overflow-hidden group cursor-pointer${isLastOdd ? ' col-span-2' : ''}`}
                    style={{ height: '750px' }}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={getMediaUrl(img.image_url)}
                      alt={img.alt_text}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - sticky product info (desktop) */}
          <div className="flex flex-col py-10 bg-white space-y-6 sticky top-[120px] self-start" style={{ paddingLeft: '5.5rem', paddingRight: '5.5rem' }} data-product-details>

          {/* Brand & Model */}
          <div className="space-y-4">
            {watch?.brand?.name && (
              <p className="text-xs font-light text-gray-500 uppercase tracking-widest">{watch.brand.name}</p>
            )}
            <h1 className="text-3xl xl:text-4xl font-light text-gray-900 leading-tight tracking-tight">{watch?.name}</h1>
            {watch?.model_number && (
              <p className="text-sm text-gray-500 tracking-wide font-light">Ref. {watch.model_number}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-4">
              <span className="text-3xl font-light text-gray-900">£{price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              {watch?.sale_price && (
                <>
                  <span className="text-sm text-gray-400 line-through font-light">£{watch?.base_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  <span className="text-xs font-semibold text-red-600">{discount}% OFF</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-600 tracking-wide font-light">
              {watch?.in_stock ? (
                <span className="text-green-600 font-medium">In Stock ({watch?.stock_quantity} available)</span>
              ) : (
                <span className="text-red-600 font-medium">Out of Stock</span>
              )}
            </p>
          </div>

          {/* Quick Specs */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="bg-gray-50 px-4 py-4 space-y-2">
              <Clock className="w-3.5 h-3.5" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }}>Movement</p>
              <p className="text-xs text-gray-900 font-light leading-relaxed">{watch?.specifications?.movement_type || '—'}</p>
            </div>
            <div className="bg-gray-50 px-4 py-4 space-y-2">
              <Droplet className="w-3.5 h-3.5" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }}>Water Resist</p>
              <p className="text-xs text-gray-900 font-light leading-relaxed">{watch?.specifications?.water_resistance || '—'}</p>
            </div>
            <div className="bg-gray-50 px-4 py-4 space-y-2">
              <Maximize2 className="w-3.5 h-3.5" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }}>Case Size</p>
              <p className="text-xs text-gray-900 font-light leading-relaxed">{watch?.specifications?.case_diameter || '—'}</p>
            </div>
          </div>

          {watch?.short_description && (
            <div className="pt-2">
              <p className="text-sm text-gray-700 leading-relaxed font-light">{watch.short_description}</p>
            </div>
          )}

          {/* Add to Cart */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={!watch?.in_stock}
              className="w-full text-white py-3.5 px-6 font-light tracking-wide disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-sm shadow-sm hover:shadow-md"
              style={{
                backgroundColor: watch?.in_stock ? (BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#1a1a1a') : '#9ca3af',
                opacity: watch?.in_stock ? 1 : 0.7
              }}
            >
              {watch?.in_stock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <div className="flex items-center gap-3">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-900 transition-all duration-200"
                style={{ border: `1px solid ${BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#d1d5db'}` }}
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-gray-900' : ''}`} />
                <span className="text-xs font-light">Save</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-900 transition-all duration-200"
                style={{ border: `1px solid ${BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#d1d5db'}` }}
              >
                <Share2 className="w-4 h-4" />
                <span className="text-xs font-light">Share</span>
              </button>
            </div>
          </div>

          {/* Description */}
          {watch?.description && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">About This Piece</h3>
              <p className="text-gray-700 leading-relaxed text-sm font-light">{watch.description}</p>
            </div>
          )}

          {/* Specs accordion */}
          <div className="space-y-1 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">Technical Specifications</h3>
            {(() => {
              const brandName = watch?.brand?.name;
              const config = brandName && BRAND_SPEC_CONFIG[brandName];
              if (!config) return null;
              return Object.entries(config.sections).map(([sectionKey, section]) => {
                const fields = section.fields.filter(f => watch?.specifications?.[f.key]);
                if (!fields.length) return null;
                return (
                  <div key={sectionKey}>
                    <button onClick={() => toggleSpecSection(sectionKey)} className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors">
                      <span className="text-xs font-semibold text-gray-900">{section.label}</span>
                      <span className="text-gray-400 text-sm font-light">{expandedSpecs[sectionKey] ? '−' : '+'}</span>
                    </button>
                    {expandedSpecs[sectionKey] && (
                      <div className="pb-3 space-y-2">
                        {fields.map(f => (
                          <div key={f.key} className="flex justify-between text-xs py-1.5">
                            <span className="text-gray-600">{f.label}</span>
                            <span className="text-gray-900 font-light">{watch?.specifications?.[f.key]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
            <button onClick={() => toggleSpecSection('care')} className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors">
              <span className="text-xs font-semibold text-gray-900">Warranty & Care</span>
              <span className="text-gray-400 text-sm font-light">{expandedSpecs.care ? '−' : '+'}</span>
            </button>
            {expandedSpecs.care && (
              <div className="pb-3 space-y-2">
                <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Warranty</span><span className="text-gray-900 font-light">{watch?.warranty_years || 'N/A'} years</span></div>
                {watch?.care_instructions && <p className="text-xs text-gray-700 leading-relaxed font-light pt-1">{watch.care_instructions}</p>}
              </div>
            )}
          </div>

          {watch?.collection?.name && (
            <div className="border-t border-gray-200 pt-6 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Collection</p>
              <p className="text-sm text-gray-900 font-light">{watch.collection.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE LAYOUT ── */}
      <div className="lg:hidden flex flex-col">

        {/* Mobile: swipeable image gallery */}
        <div
          className="relative bg-white"
          style={{ minHeight: '100vw' }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as HTMLDivElement).dataset.touchStartX = String(touch.clientX);
          }}
          onTouchEnd={(e) => {
            const startX = Number((e.currentTarget as HTMLDivElement).dataset.touchStartX || 0);
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            if (Math.abs(diff) > 40) {
              if (diff > 0) {
                setCurrentImageIndex(i => Math.min(displayImages.length - 1, i + 1));
              } else {
                setCurrentImageIndex(i => Math.max(0, i - 1));
              }
            }
          }}
        >
          <img
            src={getMediaUrl(currentImage.image_url)}
            alt={currentImage.alt_text}
            className="absolute inset-0 w-full h-full object-contain p-4"
          />
          {/* Prev / Next tap zones */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                className="absolute left-0 top-0 h-full w-1/3 z-10"
                aria-label="Previous image"
              />
              <button
                onClick={() => setCurrentImageIndex(i => Math.min(displayImages.length - 1, i + 1))}
                className="absolute right-0 top-0 h-full w-1/3 z-10"
                aria-label="Next image"
              />
            </>
          )}
        </div>
        {/* Dot indicators — below image section */}
        {displayImages.length > 1 && (
          <div className="flex justify-center gap-1.5 py-3 bg-white">
            {displayImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentImageIndex ? 'w-4 h-1.5 bg-gray-700' : 'w-1.5 h-1.5 bg-gray-400/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Mobile: product info */}
          <div className="flex flex-col px-6 md:px-8 py-8 bg-white space-y-6 w-full" data-product-details>

            {/* Brand & Model - Elegant Header */}
            <div className="space-y-2">
              {watch?.brand?.name && (
                <p className="text-[10px] font-inter font-light text-gray-400 uppercase tracking-[0.25em]">{watch.brand.name}</p>
              )}
              <h1 className="text-2xl font-cormorant font-light text-gray-900 leading-snug">{watch?.name}</h1>
              {watch?.model_number && (
                <p className="text-xs text-gray-400 tracking-wide font-light">Ref. {watch.model_number}</p>
              )}
            </div>

            {/* Price Section - Clean & Minimal */}
            <div className="space-y-3">
              <div className="flex items-baseline gap-4">
                <span className="text-lg font-light text-gray-900">£{price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                {watch?.sale_price && (
                  <>
                    <span className="text-sm text-gray-400 line-through font-light">£{watch?.base_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs font-semibold text-red-600">{discount}% OFF</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-600 tracking-wide font-light">
                {watch?.in_stock ? (
                  <span className="text-green-600 font-medium">In Stock ({watch?.stock_quantity} available)</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </p>
            </div>

            {/* Quick Specs - Modern Cards */}
            <div className="hidden lg:grid grid-cols-3 gap-4 pt-2">
              <div className="bg-gray-50 px-4 py-4 space-y-2">
                <Clock className="w-3.5 h-3.5" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }}>Movement</p>
                <p className="text-xs text-gray-900 font-light leading-relaxed">{watch?.specifications?.movement_type || '—'}</p>
              </div>
              <div className="bg-gray-50 px-4 py-4 space-y-2">
                <Droplet className="w-3.5 h-3.5" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }}>Water Resist</p>
                <p className="text-xs text-gray-900 font-light leading-relaxed">{watch?.specifications?.water_resistance || '—'}</p>
              </div>
              <div className="bg-gray-50 px-4 py-4 space-y-2">
                <Maximize2 className="w-3.5 h-3.5" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#374151' }}>Case Size</p>
                <p className="text-xs text-gray-900 font-light leading-relaxed">{watch?.specifications?.case_diameter || '—'}</p>
              </div>
            </div>

            {/* Description */}
            {watch?.short_description && (
              <div className="pt-2">
                <p className={`text-sm text-gray-600 leading-relaxed font-light ${showFullDesc ? '' : 'line-clamp-3'}`}>
                  {watch.short_description}
                </p>
                {watch.short_description.length > 120 && (
                  <button
                    onClick={() => setShowFullDesc(v => !v)}
                    className="mt-1 text-xs text-gray-400 underline underline-offset-2 font-light"
                  >
                    {showFullDesc ? 'See less' : 'See more'}
                  </button>
                )}
              </div>
            )}

            {/* Variant Selector */}
            {watch?.variants && watch.variants.filter(v => v.name !== 'Default Title').length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-900 uppercase tracking-widest">Strap Options</p>
                <div className="flex flex-wrap gap-3">
                  {watch.variants.filter(v => v.name !== 'Default Title').map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      className={`flex flex-col items-center gap-1 p-3 border-2 transition-all ${
                        selectedVariant === variant.id
                          ? 'border-gray-900'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {variant.dial_variant && (
                        <div
                          className="w-8 h-8 rounded-full border border-gray-300"
                          style={{
                            backgroundColor: variant.dial_variant.toLowerCase().includes('white') ? '#f5f5f5' :
                                           variant.dial_variant.toLowerCase().includes('black') ? '#1a1a1a' :
                                           variant.dial_variant.toLowerCase().includes('blue') ? '#0066cc' :
                                           variant.dial_variant.toLowerCase().includes('gold') ? '#c3a473' :
                                           variant.dial_variant.toLowerCase().includes('rose') ? '#f4a4a4' :
                                           variant.dial_variant.toLowerCase().includes('silver') ? '#d3d3d3' :
                                           variant.dial_variant.toLowerCase().includes('green') ? '#2d5016' :
                                           '#d3d3d3'
                          }}
                          title={variant.dial_variant}
                        />
                      )}
                      <span className="text-xs text-gray-900 font-light text-center max-w-[60px]">{variant.name || variant.strap_type || 'Option'}</span>
                      {variant.price_adjustment && variant.price_adjustment !== 0 && (
                        <span className="text-xs text-gray-600">+£{variant.price_adjustment.toFixed(2)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons - Modern Minimal */}
            <div className="space-y-3 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={!watch?.in_stock}
                className="w-full text-white py-3.5 px-6 font-light tracking-wide disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                style={{
                  backgroundColor: watch?.in_stock ? (BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#1a1a1a') : '#9ca3af',
                  opacity: watch?.in_stock ? 1 : 0.7
                }}
              >
                {watch?.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <div className="flex items-center gap-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-900 transition-all duration-200"
                  style={{
                    borderColor: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#d1d5db',
                    border: `1px solid ${BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#d1d5db'}`
                  }}
                  onMouseEnter={(e) => {
                    const color = BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#1a1a1a';
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color + '08';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <Heart className="w-4 h-4" />
                  <span className="text-xs font-light">Save</span>
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-900 transition-all duration-200"
                  style={{
                    borderColor: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#d1d5db',
                    border: `1px solid ${BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#d1d5db'}`
                  }}
                  onMouseEnter={(e) => {
                    const color = BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#1a1a1a';
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = color + '08';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-xs font-light">Share</span>
                </button>
              </div>
            </div>

            {/* Full Description */}
            {watch?.description && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest">About This Piece</h3>
                <p className="text-gray-700 leading-relaxed text-sm font-light">{watch.description}</p>
              </div>
            )}

            {/* Expandable Specifications - Modern Minimal */}
            <div className="space-y-1 pt-4 border-t border-gray-200">
              <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-4">Technical Specifications</h3>

              {(() => {
                const brandName = watch?.brand?.name;
                const config = brandName && BRAND_SPEC_CONFIG[brandName];

                if (!config) {
                  // Fallback to default specifications if brand not in config
                  return (
                    <>
                      {/* Case & Design */}
                      <button
                        onClick={() => toggleSpecSection('case')}
                        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-900">Case & Design</span>
                        <span className="text-gray-400 text-sm font-light">{expandedSpecs.case ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs.case && (
                        <div className="pb-3 space-y-2 px-0">
                          {watch?.specifications?.case_material && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Material</span><span className="text-gray-900 font-light">{watch.specifications.case_material}</span></div>}
                          {watch?.specifications?.case_diameter && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Diameter</span><span className="text-gray-900 font-light">{watch.specifications.case_diameter}</span></div>}
                          {watch?.specifications?.case_thickness && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Thickness</span><span className="text-gray-900 font-light">{watch.specifications.case_thickness}</span></div>}
                          {watch?.specifications?.dial_color && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Dial Color</span><span className="text-gray-900 font-light">{watch.specifications.dial_color}</span></div>}
                          {watch?.specifications?.glass_type && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Glass</span><span className="text-gray-900 font-light">{watch.specifications.glass_type}</span></div>}
                        </div>
                      )}

                      {/* Movement */}
                      <button
                        onClick={() => toggleSpecSection('movement')}
                        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-900">Movement & Power</span>
                        <span className="text-gray-400 text-sm font-light">{expandedSpecs.movement ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs.movement && (
                        <div className="pb-3 space-y-2 px-0">
                          {watch?.specifications?.movement_type && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Type</span><span className="text-gray-900 font-light">{watch.specifications.movement_type}</span></div>}
                          {watch?.specifications?.battery_life && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Battery Life</span><span className="text-gray-900 font-light">{watch.specifications.battery_life}</span></div>}
                        </div>
                      )}

                      {/* Water Resistance */}
                      <button
                        onClick={() => toggleSpecSection('water')}
                        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-900">Water Resistance & Strap</span>
                        <span className="text-gray-400 text-sm font-light">{expandedSpecs.water ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs.water && (
                        <div className="pb-3 space-y-2 px-0">
                          {watch?.specifications?.water_resistance && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Water Resistance</span><span className="text-gray-900 font-light">{watch.specifications.water_resistance}</span></div>}
                          {watch?.specifications?.strap_material && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Strap Material</span><span className="text-gray-900 font-light">{watch.specifications.strap_material}</span></div>}
                          {watch?.specifications?.buckle_type && <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Buckle</span><span className="text-gray-900 font-light">{watch.specifications.buckle_type}</span></div>}
                        </div>
                      )}

                      {/* Warranty & Care */}
                      <button
                        onClick={() => toggleSpecSection('care')}
                        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-900">Warranty & Care</span>
                        <span className="text-gray-400 text-sm font-light">{expandedSpecs.care ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs.care && (
                        <div className="pb-3 space-y-2 px-0">
                          <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Warranty</span><span className="text-gray-900 font-light">{watch?.warranty_years || 'N/A'} years</span></div>
                          {watch?.care_instructions && (
                            <div className="text-xs space-y-2 pt-2">
                              <p className="text-gray-600">Care Instructions</p>
                              <p className="text-gray-700 leading-relaxed font-light">{watch.care_instructions}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                }

                // Render brand-specific specifications
                return Object.entries(config.sections).map(([sectionKey, section]) => {
                  // Get all fields that have values (configured + any additional fields)
                  const sectionFieldsWithValues: Array<{ key: keyof WatchSpecification; label: string; value: string }> = [];

                  // First add configured fields
                  section.fields.forEach(field => {
                    const value = watch?.specifications?.[field.key];
                    if (value) {
                      sectionFieldsWithValues.push({ ...field, value });
                    }
                  });

                  // Show this section only if it has fields with values
                  if (sectionFieldsWithValues.length === 0) return null;

                  return (
                    <div key={sectionKey}>
                      <button
                        onClick={() => toggleSpecSection(sectionKey)}
                        className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-900">{section.label}</span>
                        <span className="text-gray-400 text-sm font-light">{expandedSpecs[sectionKey] ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs[sectionKey] && (
                        <div className="pb-3 space-y-2 px-0">
                          {sectionFieldsWithValues.map(fieldData => (
                            <div key={fieldData.key} className="flex justify-between text-xs py-1.5">
                              <span className="text-gray-600">{fieldData.label}</span>
                              <span className="text-gray-900 font-light">{fieldData.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Warranty & Care (shown for all brands) */}
              <button
                onClick={() => toggleSpecSection('care')}
                className="w-full flex items-center justify-between py-3 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="text-xs font-semibold text-gray-900">Warranty & Care</span>
                <span className="text-gray-400 text-sm font-light">{expandedSpecs.care ? '−' : '+'}</span>
              </button>
              {expandedSpecs.care && (
                <div className="pb-3 space-y-2 px-0">
                  <div className="flex justify-between text-xs py-1.5"><span className="text-gray-600">Warranty</span><span className="text-gray-900 font-light">{watch?.warranty_years || 'N/A'} years</span></div>
                  {watch?.care_instructions && (
                    <div className="text-xs space-y-2 pt-2">
                      <p className="text-gray-600">Care Instructions</p>
                      <p className="text-gray-700 leading-relaxed font-light">{watch.care_instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collection Info - Elegant Footer */}
            {watch?.collection?.name && (
              <div className="border-t border-gray-200 pt-6 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Collection</p>
                <p className="text-sm text-gray-900 font-light">{watch.collection.name}</p>
              </div>
            )}
          </div>
        </div>

      {/* Full-Width Showcase Section - Outside Grid */}
      <div className="w-full bg-gradient-to-br from-gray-50 via-white to-gray-50 py-20 px-4 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {(() => {
            const brandName = watch?.brand?.name || '';
            const showcase = BRAND_SHOWCASE_CONFIG[brandName] || {
              col1: { title: 'Heritage & Craftsmanship', text: 'Each watch is crafted with precision and attention to detail, representing years of horological expertise and commitment to excellence.' },
              col2: { title: 'Quality Guaranteed', text: 'Every timepiece undergoes rigorous testing to ensure it meets our exacting standards for durability, accuracy, and performance.' },
              col3: { title: 'Expert Assistance', text: 'Our knowledgeable team is here to help you find the perfect timepiece and answer any questions about your purchase.' },
            };
            const cols = [
              { data: showcase.col1, icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/> },
              { data: showcase.col2, icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/> },
              { data: showcase.col3, icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/> },
            ];
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {cols.map((col, idx) => (
                  <div key={idx} className="space-y-4 flex flex-col items-center text-center md:items-start md:text-left">
                    <div className="w-12 h-12 rounded-full bg-gray-900/10 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">{col.icon}</svg>
                    </div>
                    <h3 className="text-lg font-light text-gray-900 tracking-tight">{col.data.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed font-light">{col.data.text}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Divider */}
          <div className="border-t border-gray-200 my-16"></div>

          {/* Key Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-light text-gray-900 tracking-tight">Why Choose {watch?.brand?.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md" style={{backgroundColor: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#1a1a1a'}}>
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-light">Precision Swiss Movement</p>
                  <p className="text-xs text-gray-500 mt-1">Accurate timekeeping for decades</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md" style={{backgroundColor: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#1a1a1a'}}>
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-light">Premium Materials</p>
                  <p className="text-xs text-gray-500 mt-1">Crafted with finest quality components</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md" style={{backgroundColor: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#1a1a1a'}}>
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-light">Lifetime Value</p>
                  <p className="text-xs text-gray-500 mt-1">Investment in timeless elegance</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-md" style={{backgroundColor: BRAND_COLOR_CONFIG[watch?.brand?.name || ''] || '#1a1a1a'}}>
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-900 font-light">Expert Service</p>
                  <p className="text-xs text-gray-500 mt-1">Professional maintenance & support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BRISTON YOUR STYLE – Compatible Straps ───────────────────────── */}
      {accessories.length > 0 && (
        <section className="bg-white border-t border-gray-100 py-16 px-4 lg:px-[40px]">
          <div className="max-w-screen-xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-inter mb-2">Personalise your watch</p>
              <h2 className="text-2xl lg:text-3xl font-cormorant font-light text-gray-900 mb-1">
                {watch?.brand?.name?.toUpperCase()} YOUR STYLE
              </h2>
              <div className="w-12 h-px bg-gray-300 mx-auto mt-4"></div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['all', ...Array.from(new Set(accessories.map(a => a.strap_type)))].map(type => (
                <button
                  key={type}
                  onClick={() => setAccessoryFilter(type)}
                  className={`px-4 py-1.5 text-xs uppercase tracking-widest font-inter transition-all ${
                    accessoryFilter === type
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                  }`}
                >
                  {type === 'all' ? 'All Straps' : type}
                </button>
              ))}
            </div>

            {/* Straps horizontal scroll grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {accessories
                .filter(a => accessoryFilter === 'all' || a.strap_type === accessoryFilter)
                .map(strap => (
                  <div key={strap.id} className="group cursor-pointer">
                    {/* Image */}
                    <div className="aspect-square bg-gray-50 overflow-hidden mb-3 rounded-sm">
                      {strap.image_url ? (
                        <img
                          src={getMediaUrl(strap.image_url)}
                          alt={strap.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-inter">
                          No Image
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <p className="text-xs font-inter font-light text-gray-900 leading-tight mb-1 line-clamp-2 uppercase tracking-wide">
                      {strap.name}
                    </p>
                    <p className="text-sm font-cormorant text-gray-700">
                      £{strap.price_gbp ? Number(strap.price_gbp).toFixed(2) : '—'}
                    </p>
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

export default WatchDetail;
