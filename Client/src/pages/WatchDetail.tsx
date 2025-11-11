import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Share2, ChevronLeft, ChevronRight, Clock, Droplet, Zap, Maximize2, Plus, Minus } from 'lucide-react';
import LuxuryNavigationWhite from '@/components/LuxuryNavigationWhite';
import { FooterSection } from '@/components/FooterSection';
import { useCart } from '../contexts/CartContext';
import API_BASE_URL from '../config/api';

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
    addToCart({
      id: watch.id,
      name: watch.name,
      price: price,
      quantity: quantity,
      image: currentImage.image_url,
      brand: watch.brand.name,
      type: 'watch'
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

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* Left Column - Image Gallery */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden aspect-square flex items-center justify-center">
              <img
                src={currentImage.image_url}
                alt={currentImage.alt_text}
                className="w-full h-full object-contain p-8"
              />

              {/* Navigation Arrows */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all z-10"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-900" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % displayImages.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all z-10"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-900" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-medium">
                {currentImageIndex + 1} / {displayImages.length}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="absolute top-4 left-4 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all z-10"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {displayImages.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative bg-gray-100 rounded overflow-hidden aspect-square border-2 transition-all ${
                      index === currentImageIndex ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img.image_url} alt={img.alt_text} className="w-full h-full object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-8 lg:pt-6">

            {/* Brand & Model */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                {watch?.brand?.logo_url && (
                  <img src={watch.brand.logo_url} alt={watch.brand?.name} className="h-8 object-contain" />
                )}
                {watch?.brand?.name && (
                  <span className="text-sm font-medium text-gray-600 uppercase tracking-wider">{watch.brand.name}</span>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-light text-gray-900 leading-tight">{watch?.name}</h1>
              {watch?.model_number && (
                <p className="text-sm text-gray-500 font-mono">Model: {watch.model_number}</p>
              )}
            </div>

            {/* Price Section */}
            <div className="border-t border-b border-gray-200 py-6 space-y-3">
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-light text-gray-900">£{price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                {watch?.sale_price && (
                  <>
                    <span className="text-lg text-gray-400 line-through">£{watch?.base_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    <span className="text-sm font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">{discount}% OFF</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {watch?.in_stock ? (
                  <span className="text-green-600 font-medium">✓ In Stock ({watch?.stock_quantity} available)</span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )}
              </p>
            </div>

            {/* Quick Specs */}
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-6 rounded-lg">
              <div className="text-center space-y-2">
                <Clock className="w-5 h-5 mx-auto text-gray-600" />
                <p className="text-xs text-gray-600 font-medium">MOVEMENT</p>
                <p className="text-sm font-medium text-gray-900">{watch?.specifications?.movement_type || 'N/A'}</p>
              </div>
              <div className="text-center space-y-2">
                <Droplet className="w-5 h-5 mx-auto text-gray-600" />
                <p className="text-xs text-gray-600 font-medium">WATER RESIST</p>
                <p className="text-sm font-medium text-gray-900">{watch?.specifications?.water_resistance || 'N/A'}</p>
              </div>
              <div className="text-center space-y-2">
                <Maximize2 className="w-5 h-5 mx-auto text-gray-600" />
                <p className="text-xs text-gray-600 font-medium">CASE SIZE</p>
                <p className="text-sm font-medium text-gray-900">{watch?.specifications?.case_diameter || 'N/A'}</p>
              </div>
            </div>

            {/* Description */}
            {watch?.short_description && (
              <div className="space-y-2">
                <p className="text-gray-700 leading-relaxed">{watch.short_description}</p>
              </div>
            )}

            {/* Add to Cart Section */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 text-center w-12 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={!watch?.in_stock}
                  className="flex-1 bg-gray-900 text-white py-3 px-6 rounded font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Add to Cart
                </button>
                <button
                  className="w-12 h-12 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50 transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Full Description */}
            {watch?.description && (
              <div className="space-y-3 border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">About This Watch</h3>
                <p className="text-gray-700 leading-relaxed text-sm">{watch.description}</p>
              </div>
            )}

            {/* Expandable Specifications */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Specifications</h3>

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
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                      >
                        <span className="font-medium text-gray-900">Case & Design</span>
                        <span className="text-gray-600">{expandedSpecs.case ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs.case && (
                        <div className="bg-gray-50 p-4 rounded space-y-3">
                          {watch?.specifications?.case_material && <div className="flex justify-between text-sm"><span className="text-gray-600">Material:</span><span className="font-medium">{watch.specifications.case_material}</span></div>}
                          {watch?.specifications?.case_diameter && <div className="flex justify-between text-sm"><span className="text-gray-600">Diameter:</span><span className="font-medium">{watch.specifications.case_diameter}</span></div>}
                          {watch?.specifications?.case_thickness && <div className="flex justify-between text-sm"><span className="text-gray-600">Thickness:</span><span className="font-medium">{watch.specifications.case_thickness}</span></div>}
                          {watch?.specifications?.dial_color && <div className="flex justify-between text-sm"><span className="text-gray-600">Dial Color:</span><span className="font-medium">{watch.specifications.dial_color}</span></div>}
                          {watch?.specifications?.glass_type && <div className="flex justify-between text-sm"><span className="text-gray-600">Glass:</span><span className="font-medium">{watch.specifications.glass_type}</span></div>}
                        </div>
                      )}

                      {/* Movement */}
                      <button
                        onClick={() => toggleSpecSection('movement')}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                      >
                        <span className="font-medium text-gray-900">Movement & Power</span>
                        <span className="text-gray-600">{expandedSpecs.movement ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs.movement && (
                        <div className="bg-gray-50 p-4 rounded space-y-3">
                          {watch?.specifications?.movement_type && <div className="flex justify-between text-sm"><span className="text-gray-600">Type:</span><span className="font-medium">{watch.specifications.movement_type}</span></div>}
                          {watch?.specifications?.battery_life && <div className="flex justify-between text-sm"><span className="text-gray-600">Battery Life:</span><span className="font-medium">{watch.specifications.battery_life}</span></div>}
                        </div>
                      )}

                      {/* Water Resistance */}
                      <button
                        onClick={() => toggleSpecSection('water')}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                      >
                        <span className="font-medium text-gray-900">Water Resistance & Strap</span>
                        <span className="text-gray-600">{expandedSpecs.water ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs.water && (
                        <div className="bg-gray-50 p-4 rounded space-y-3">
                          {watch?.specifications?.water_resistance && <div className="flex justify-between text-sm"><span className="text-gray-600">Water Resistance:</span><span className="font-medium">{watch.specifications.water_resistance}</span></div>}
                          {watch?.specifications?.strap_material && <div className="flex justify-between text-sm"><span className="text-gray-600">Strap Material:</span><span className="font-medium">{watch.specifications.strap_material}</span></div>}
                          {watch?.specifications?.buckle_type && <div className="flex justify-between text-sm"><span className="text-gray-600">Buckle:</span><span className="font-medium">{watch.specifications.buckle_type}</span></div>}
                        </div>
                      )}

                      {/* Warranty & Care */}
                      <button
                        onClick={() => toggleSpecSection('care')}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                      >
                        <span className="font-medium text-gray-900">Warranty & Care</span>
                        <span className="text-gray-600">{expandedSpecs.care ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs.care && (
                        <div className="bg-gray-50 p-4 rounded space-y-3">
                          <div className="flex justify-between text-sm"><span className="text-gray-600">Warranty:</span><span className="font-medium">{watch?.warranty_years || 'N/A'} years</span></div>
                          {watch?.care_instructions && (
                            <div className="text-sm">
                              <p className="text-gray-600 mb-2">Care Instructions:</p>
                              <p className="text-gray-700">{watch.care_instructions}</p>
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
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                      >
                        <span className="font-medium text-gray-900">{section.label}</span>
                        <span className="text-gray-600">{expandedSpecs[sectionKey] ? '−' : '+'}</span>
                      </button>
                      {expandedSpecs[sectionKey] && (
                        <div className="bg-gray-50 p-4 rounded space-y-3">
                          {sectionFieldsWithValues.map(fieldData => (
                            <div key={fieldData.key} className="flex justify-between text-sm">
                              <span className="text-gray-600">{fieldData.label}:</span>
                              <span className="font-medium">{fieldData.value}</span>
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
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded transition-colors"
              >
                <span className="font-medium text-gray-900">Warranty & Care</span>
                <span className="text-gray-600">{expandedSpecs.care ? '−' : '+'}</span>
              </button>
              {expandedSpecs.care && (
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Warranty:</span><span className="font-medium">{watch?.warranty_years || 'N/A'} years</span></div>
                  {watch?.care_instructions && (
                    <div className="text-sm">
                      <p className="text-gray-600 mb-2">Care Instructions:</p>
                      <p className="text-gray-700">{watch.care_instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collection Info */}
            {watch?.collection?.name && (
              <div className="border-t border-gray-200 pt-6 space-y-3">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">Collection</h3>
                <p className="text-lg font-medium text-gray-900">{watch.collection.name}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <FooterSection />
    </div>
  );
};

export default WatchDetail;
