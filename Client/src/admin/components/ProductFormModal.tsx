import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import MultiSelect from './MultiSelect';
import { Package, Upload, Plus, X, Loader2 } from 'lucide-react';
import API_BASE_URL, { getMediaUrl } from '../../config/api';

interface ProductFormData {
  name: string;
  description: string;
  short_description: string;
  sku: string;
  base_price: string;
  sale_price: string;
  currency: string;
  category_id: string;
  collection_id: string;
  jewelry_sub_type_id: string; // Engagement or Wedding rings
  ring_type_ids: string[];
  ring_styles: string[];
  stone_shape_ids: string[];
  stone_type_id: string;
  metal_ids: string[];
  diamond_size_ids: string[]; // Diamond sizes for Engagement Rings
  is_active: boolean;
  is_featured: boolean;
  in_stock: boolean;
  stock_quantity: string;
  // Made on Request fields
  is_made_on_request: boolean;
  made_on_request_lead_time: string;
  made_on_request_message: string;
  weight: string;
  dimensions: string;
  care_instructions: string;
  warranty_info: string;
  meta_title: string;
  meta_description: string;
  // Nivoda Integration Fields
  nivoda_enabled: boolean;
  show_stone_type: boolean;
  show_carat: boolean;
  show_clarity: boolean;
  show_colour: boolean;
  show_cut: boolean;
  show_certificate: boolean;
  certificate: string;
  // Nivoda Options Configuration - CUSTOMER-SELECTABLE RANGES & OPTIONS
  nivoda_options_config?: {
    stoneType?: 'natural' | 'lab-grown';
    caratRange?: { min: number; max: number };
    clarityOptions?: string[];
    colourOptions?: string[];
    cutOptions?: string[];
    defaultSpecs?: {
      carat?: string;
      clarity?: string;
      colour?: string;
      cut?: string;
    };
  };
  metalMountPrices: Record<string, string>;
  images: Array<{ file: File | null; url: string; alt_text: string }>;
  videos: Array<{ file: File | null; url: string; title: string }>;
  variants: Array<{
    variant_name: string;
    price_adjustment: string;
    stock_quantity: string;
    metal_type?: string;
    metal_color?: string;
    size?: string;
    gemstone_type?: string;
    gemstone_carat?: string;
  }>;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialData?: Partial<ProductFormData>;
  mode: 'create' | 'edit';
  categories: Array<{ id: string; name: string; slug: string }>;
  collections: Array<{ id: string; name: string; slug: string }>;
  jewelrySubTypes: Array<{ id: string; name: string; slug: string }>; // Engagement/Wedding
  ringTypes: Array<{ id: string; name: string; slug: string }>;
  stoneShapes: Array<{ id: string; name: string; slug: string }>;
  stoneTypes: Array<{ id: string; name: string; slug: string }>;
  metals: Array<{ id: string; name: string; color_code: string; price_multiplier?: number }>;
  diamondSizes: Array<{ id: string; name: string; display_name?: string; sort_order?: number }>; // Diamond sizes
  isLoading?: boolean;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  categories,
  collections,
  jewelrySubTypes,
  ringTypes,
  stoneShapes,
  stoneTypes,
  diamondSizes = [],
  metals,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    short_description: '',
    sku: '',
    base_price: '',
    sale_price: '',
    currency: 'GBP',
    category_id: '',
    collection_id: '',
    jewelry_sub_type_id: '',
    ring_type_ids: [],
    ring_styles: [],
    stone_shape_ids: [],
    stone_type_id: '',
    metal_ids: [],
    diamond_size_ids: [],
    is_active: true,
    is_featured: false,
    in_stock: true,
    stock_quantity: '0',
    // Made on Request defaults
    is_made_on_request: false,
    made_on_request_lead_time: '4-6 weeks',
    made_on_request_message: '',
    weight: '',
    dimensions: '',
    care_instructions: '',
    warranty_info: '',
    meta_title: '',
    meta_description: '',
    // Nivoda Integration Fields
    nivoda_enabled: false,
    show_stone_type: false,
    show_carat: false,
    show_clarity: false,
    show_colour: false,
    show_cut: false,
    show_certificate: false,
    certificate: '',
    // Nivoda Options Configuration
    nivoda_options_config: {
      stoneType: 'natural',
      caratRange: { min: 0.5, max: 2.0 },
      clarityOptions: [],
      colourOptions: [],
      cutOptions: [],
      defaultSpecs: { carat: '', clarity: '', colour: '', cut: '' }
    },
    metalMountPrices: {},
    images: [],
    videos: [],
    variants: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  // Metal-specific media state
  const [metalMediaState, setMetalMediaState] = useState<Record<string, {
    images: Array<{ file: File | null; url: string; alt_text: string }>;
    videos: Array<{ file: File | null; url: string; title: string }>;
  }>>({});

  // Nivoda Integration State
  const [nivodaAvailableOptions, setNivodaAvailableOptions] = useState<{
    carats: string[];
    clarities: string[];
    colours: string[];
    cuts: string[];
    stoneTypes: string[];
  } | null>(null);
  const [nivodaLoading, setNivodaLoading] = useState(false);
  const [nivodaError, setNivodaError] = useState<string | null>(null);

  // Live market price state
  const [marketPrice, setMarketPrice] = useState<{
    min: number; avg: number; max: number; count: number;
    specs: Record<string, string>;
  } | null>(null);
  const [marketPriceLoading, setMarketPriceLoading] = useState(false);
  const [marketPriceError, setMarketPriceError] = useState<string | null>(null);

  const checkMarketPrice = async () => {
    const cfg = formData.nivoda_options_config;
    const ds = cfg?.defaultSpecs;
    const carat     = ds?.carat   || (cfg?.caratRange ? cfg.caratRange.min.toFixed(2) : '1.00');
    const clarity   = ds?.clarity || cfg?.clarityOptions?.[0] || 'VS1';
    const color     = ds?.colour  || cfg?.colourOptions?.[0]  || 'G';
    const cut       = ds?.cut     || cfg?.cutOptions?.[0]     || 'Excellent';
    const stoneType = cfg?.stoneType || 'natural';

    // Get first selected stone shape name (if any)
    const shapeObj = stoneShapes.find(s => formData.stone_shape_ids.includes(s.id));
    const shape = shapeObj?.name || '';

    const params = new URLSearchParams({ carat, clarity, color, cut, stoneType });
    if (shape) params.set('shape', shape);

    setMarketPriceLoading(true);
    setMarketPriceError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/nivoda/diamonds/price-suggestions?${params.toString()}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server error ${res.status}: ${errText.slice(0, 200)}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch prices');
      setMarketPrice({
        min: json.data.prices.min,
        avg: json.data.prices.avg,
        max: json.data.prices.max,
        count: json.data.count,
        specs: json.data.specs,
      });
    } catch (e: any) {
      setMarketPriceError(e.message);
    } finally {
      setMarketPriceLoading(false);
    }
  };

  // Function to fetch available Nivoda options
  const fetchNivodaOptions = async () => {
    setNivodaLoading(true);
    setNivodaError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/nivoda/available-options`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Nivoda options');
      }

      const data = await response.json();
      setNivodaAvailableOptions({
        carats: data.data?.carats || [],
        clarities: data.data?.clarities || [],
        colours: data.data?.colours || [],
        cuts: data.data?.cuts || [],
        stoneTypes: data.data?.stoneTypes || []
      });
    } catch (error: any) {
      setNivodaError(error.message || 'Failed to load Nivoda options');
    } finally {
      setNivodaLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        base_price: initialData.base_price?.toString() || '',
        sale_price: initialData.sale_price?.toString() || '',
        stock_quantity: initialData.stock_quantity?.toString() || '0',
        weight: initialData.weight?.toString() || '',
        // Convert null to empty string for select/textarea fields to prevent React warnings
        category_id: initialData.category_id || '',
        collection_id: initialData.collection_id || '',
        jewelry_sub_type_id: initialData.jewelry_sub_type_id || '',
        ring_styles: initialData.ring_styles || [],
        stone_type_id: initialData.gemstones?.[0]?.id || '',
        certificate: initialData.certificate || '',
        description: initialData.description || '',
        short_description: initialData.short_description || '',
        care_instructions: initialData.care_instructions || '',
        warranty_info: initialData.warranty_info || '',
        meta_title: initialData.meta_title || '',
        meta_description: initialData.meta_description || '',
        made_on_request_message: initialData.made_on_request_message || '',
        made_on_request_lead_time: initialData.made_on_request_lead_time || '4-6 weeks',
        dimensions: initialData.dimensions || '',
        currency: initialData.currency || 'GBP',
        name: initialData.name || '',
        sku: initialData.sku || '',
        images: initialData.images || [],
        videos: initialData.videos || [],
        variants: initialData.variants || [],
        // Load Nivoda configuration with proper defaults
        nivoda_options_config: {
          stoneType: initialData.nivoda_options_config?.stoneType || 'natural',
          caratRange: initialData.nivoda_options_config?.caratRange || { min: 0.5, max: 2.0 },
          clarityOptions: initialData.nivoda_options_config?.clarityOptions || [],
          colourOptions: initialData.nivoda_options_config?.colourOptions || [],
          cutOptions: initialData.nivoda_options_config?.cutOptions || [],
          defaultSpecs: initialData.nivoda_options_config?.defaultSpecs || { carat: '', clarity: '', colour: '', cut: '' }
        },
        // Load per-metal mount prices from junction data
        metalMountPrices: (() => {
          const prices: Record<string, string> = {};
          (initialData.metals || initialData.available_metals || []).forEach((m: any) => {
            const mp = m.ProductMetalsJunction?.mount_price ?? m.mount_price ?? null;
            if (mp !== null && mp !== undefined) prices[m.id] = String(mp);
          });
          return prices;
        })()
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        short_description: '',
        sku: '',
        base_price: '',
        sale_price: '',
        currency: 'GBP',
        category_id: '',
        collection_id: '',
        jewelry_sub_type_id: '',
        ring_type_ids: [],
        ring_styles: [],
        stone_shape_ids: [],
        stone_type_id: '',
        metal_ids: [],
        diamond_size_ids: [],
        is_active: true,
        is_featured: false,
        in_stock: true,
        stock_quantity: '0',
        is_made_on_request: false,
        made_on_request_lead_time: '4-6 weeks',
        made_on_request_message: '',
        weight: '',
        dimensions: '',
        care_instructions: '',
        warranty_info: '',
        meta_title: '',
        meta_description: '',
        nivoda_enabled: false,
        show_stone_type: false,
        show_carat: false,
        show_clarity: false,
        show_colour: false,
        show_cut: false,
        show_certificate: false,
        certificate: '',
        nivoda_options_config: {
          stoneType: 'natural',
          caratRange: { min: 0.5, max: 2.0 },
          clarityOptions: [],
          colourOptions: [],
          cutOptions: []
        },
        images: [],
        videos: [],
        variants: []
      });
    }

    // Load existing metal-specific images and videos during edit mode
    if (initialData && mode === 'edit') {
      const newMetalMediaState: Record<string, any> = {};

      // Use allImages if available (contains metal_id info), otherwise fallback to images
      const imagesToProcess = (initialData as any).allImages || initialData.images || [];

      if (imagesToProcess && Array.isArray(imagesToProcess)) {
        // Group images by metal_id
        const imagesByMetal = imagesToProcess.reduce((acc: any, img: any) => {
          if (img.metal_id) {
            if (!acc[img.metal_id]) {
              acc[img.metal_id] = [];
            }
            acc[img.metal_id].push({
              file: null,
              url: img.url,
              alt_text: img.alt_text || img.alt || '',
              is_metal_preview: img.is_metal_preview || false,
              diamond_size_id: img.diamond_size_id || null,
              is_diamond_size_preview: img.is_diamond_size_preview || false,
              id: img.id
            });
          }
          return acc;
        }, {});

        Object.keys(imagesByMetal).forEach(metalId => {
          newMetalMediaState[metalId] = {
            ...newMetalMediaState[metalId],
            images: imagesByMetal[metalId]
          };
        });
      }

      // Use allVideos if available (contains metal_id info), otherwise fallback to videos
      const videosToProcess = (initialData as any).allVideos || initialData.videos || [];

      if (videosToProcess && Array.isArray(videosToProcess)) {
        // Group videos by metal_id
        const videosByMetal = videosToProcess.reduce((acc: any, vid: any) => {
          if (vid.metal_id) {
            if (!acc[vid.metal_id]) {
              acc[vid.metal_id] = [];
            }
            acc[vid.metal_id].push({
              file: null,
              url: vid.url,
              title: vid.title || '',
              id: vid.id
            });
          }
          return acc;
        }, {});

        Object.keys(videosByMetal).forEach(metalId => {
          newMetalMediaState[metalId] = {
            ...newMetalMediaState[metalId],
            videos: videosByMetal[metalId]
          };
        });
      }

      setMetalMediaState(newMetalMediaState);
    } else {
      // Reset metal media state for create mode
      setMetalMediaState({});
    }

    setErrors({});
    setActiveTab('basic');
  }, [initialData, isOpen, mode]);

  // Fetch Nivoda options when Nivoda is enabled
  useEffect(() => {
    if (formData.nivoda_enabled && !nivodaAvailableOptions) {
      fetchNivodaOptions();
    }
  }, [formData.nivoda_enabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.base_price) newErrors.base_price = 'Base price is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';

    if (formData.sale_price && parseFloat(formData.sale_price) >= parseFloat(formData.base_price)) {
      newErrors.sale_price = 'Sale price must be less than base price';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Include metal-specific media in the submission
      const formDataWithMetal = {
        ...formData,
        metalMediaState
      } as any;

      await onSubmit(formDataWithMetal);
    }
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addImage = () => {
    if (formData.images.length >= 4) return; // Limit to 4 images
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { file: null, url: '', alt_text: '' }]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImage = (index: number, field: 'file' | 'alt_text', value: File | string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => {
        if (i === index) {
          if (field === 'file' && value instanceof File) {
            return { ...img, file: value, url: URL.createObjectURL(value) };
          }
          return { ...img, [field]: value };
        }
        return img;
      })
    }));
  };

  const addVideo = () => {
    if (formData.videos.length >= 2) return; // Limit to 2 videos
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, { file: null, url: '', title: '' }]
    }));
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const updateVideo = (index: number, field: 'file' | 'title', value: File | string) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.map((video, i) => {
        if (i === index) {
          if (field === 'file' && value instanceof File) {
            return { ...video, file: value, url: URL.createObjectURL(value) };
          }
          return { ...video, [field]: value };
        }
        return video;
      })
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        variant_name: '',
        price_adjustment: '0',
        stock_quantity: '0'
      }]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing & Stock' },
    { id: 'metals', label: 'Metals' },
    { id: 'media', label: 'Media' },
    { id: 'variants', label: 'Variants' },
    { id: 'details', label: 'Details' },
    { id: 'nivoda', label: 'Nivoda Integration' },
    { id: 'seo', label: 'SEO' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Add New Product' : 'Edit Product'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm font-satoshi ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="min-h-[400px]">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-satoshi">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi ${
                      errors.category_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <p className="text-red-500 text-xs mt-1 font-satoshi">{errors.category_id}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                  Collection
                </label>
                <select
                  value={formData.collection_id}
                  onChange={(e) => handleInputChange('collection_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                >
                  <option value="">Select Collection (Optional)</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ring-specific fields - only show when Rings category is selected */}
              {categories.find(cat => cat.id === formData.category_id)?.name?.toLowerCase().includes('ring') && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 font-cormorant">Ring Specifications</h3>

                  {/* Jewelry Sub Type - Engagement or Wedding */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                      Ring Type *
                      <span className="text-xs text-gray-500 ml-2">(Engagement or Wedding Ring)</span>
                    </label>
                    <select
                      value={formData.jewelry_sub_type_id}
                      onChange={(e) => handleInputChange('jewelry_sub_type_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                    >
                      <option value="">Select Ring Type...</option>
                      {jewelrySubTypes.map((subType) => (
                        <option key={subType.id} value={subType.id}>
                          {subType.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1 font-satoshi">
                      Choose whether this is an Engagement Ring or Wedding Ring. This determines which categories are available.
                    </p>
                  </div>

                  {/* Stone Type, Stone Shapes, and Metals Group */}
                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 font-satoshi">
                      Materials & Specifications
                    </h4>

                    {/* Stone Type (Single Select) */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                        Stone Type
                      </label>
                      <select
                        value={formData.stone_type_id}
                        onChange={(e) => handleInputChange('stone_type_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                      >
                        <option value="">Select Stone Type...</option>
                        {stoneTypes.map((stoneType) => (
                          <option key={stoneType.id} value={stoneType.id}>
                            {stoneType.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1 font-satoshi">
                        Choose the primary stone material (e.g., Natural Diamond, Sapphire, etc.)
                      </p>
                    </div>

                    {/* Ring Styles */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                        Ring Styles
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['Solitaire', 'Halo', 'Vintage', 'Modern/Contemporary', 'Bridal Set', 'Shoulder Set', 'Cross Over', 'Wed-fit', '5 Stones', 'Three Stone', 'Cluster', 'Pavé'].map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => {
                              const current = formData.ring_styles || [];
                              const updated = current.includes(style)
                                ? current.filter(s => s !== style)
                                : [...current, style];
                              handleInputChange('ring_styles', updated);
                            }}
                            className={`px-3 py-1.5 text-xs font-satoshi rounded-full border transition-all ${
                              (formData.ring_styles || []).includes(style)
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-satoshi">Select all ring style categories that apply</p>
                    </div>

                    {/* Stone Shapes and Metals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                          Stone Shapes
                        </label>
                        <MultiSelect
                          options={stoneShapes}
                          selectedIds={formData.stone_shape_ids}
                          onChange={(selectedIds) => handleInputChange('stone_shape_ids', selectedIds)}
                          placeholder="Select stone shapes..."
                          className="font-satoshi"
                        />
                        <p className="text-xs text-gray-500 mt-1 font-satoshi">
                          Select the stone cut shapes available for this ring
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                          Metals
                        </label>
                        <MultiSelect
                          options={metals}
                          selectedIds={formData.metal_ids}
                          onChange={(selectedIds) => handleInputChange('metal_ids', selectedIds)}
                          placeholder="Select metals..."
                          className="font-satoshi"
                          showColorIndicator={true}
                        />
                        <p className="text-xs text-gray-500 mt-1 font-satoshi">
                          Select the metal options available for this ring
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                  Short Description
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                  placeholder="Brief product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                  Full Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                  placeholder="Detailed product description"
                />
              </div>
            </div>
          )}

          {/* Pricing & Stock Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                    {formData.nivoda_enabled ? 'Mount Price — Ring Only (£)' : 'Base Price * (£)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.base_price}
                    onChange={(e) => handleInputChange('base_price', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi ${
                      errors.base_price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {formData.nivoda_enabled && (
                    <p className="text-xs text-blue-600 mt-1 font-satoshi">Default mount price (used when no per-metal price is set)</p>
                  )}
                  {errors.base_price && <p className="text-red-500 text-xs mt-1 font-satoshi">{errors.base_price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                    Sale Price (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sale_price}
                    onChange={(e) => handleInputChange('sale_price', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi ${
                      errors.sale_price ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors.sale_price && <p className="text-red-500 text-xs mt-1 font-satoshi">{errors.sale_price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Metal Mount Prices — only shown when Nivoda is enabled */}
              {formData.nivoda_enabled && formData.metal_ids.length > 0 && (
                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 font-satoshi">Mount Price per Metal</h4>
                  <p className="text-xs text-gray-600 mb-4 font-satoshi">
                    Set the ring mount price for each metal type. This is added to the Nivoda diamond price to calculate the total. Leave blank to use the default mount price above.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {metals.filter(m => formData.metal_ids.includes(m.id)).map((metal) => (
                      <div key={metal.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <div
                          className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: metal.color_code || '#cccccc' }}
                        />
                        <label className="text-sm text-gray-700 font-satoshi flex-1">{metal.name}</label>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500 font-satoshi">£</span>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.metalMountPrices[metal.id] || ''}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              metalMountPrices: { ...prev.metalMountPrices, [metal.id]: e.target.value }
                            }))}
                            className="w-28 px-2 py-1 border border-gray-300 rounded text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder={formData.base_price || '0.00'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                  placeholder="Enter SKU manually (optional)"
                />
                <p className="text-xs text-gray-500 mt-1 font-satoshi">
                  Leave empty to auto-generate SKU based on product name
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 font-satoshi">
                    Active Product
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_featured"
                    checked={formData.is_featured}
                    onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                  />
                  <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700 font-satoshi">
                    Featured Product
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="in_stock"
                    checked={formData.in_stock}
                    onChange={(e) => handleInputChange('in_stock', e.target.checked)}
                    className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                  />
                  <label htmlFor="in_stock" className="ml-2 block text-sm text-gray-700 font-satoshi">
                    In Stock
                  </label>
                </div>
              </div>

              {/* Made on Request Section */}
              <div className="mt-6 p-4 border border-amber-200 rounded-lg bg-amber-50/50">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="is_made_on_request"
                    checked={formData.is_made_on_request}
                    onChange={(e) => handleInputChange('is_made_on_request', e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="is_made_on_request" className="block text-sm font-medium text-gray-900 font-satoshi">
                      Made on Request
                    </label>
                    <p className="text-xs text-gray-600 mt-1 font-satoshi">
                      Enable this for products that are custom-made by our partner craftsmen and require additional production time.
                    </p>
                  </div>
                </div>

                {formData.is_made_on_request && (
                  <div className="mt-4 space-y-4 pl-7">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                        Lead Time
                      </label>
                      <select
                        value={formData.made_on_request_lead_time}
                        onChange={(e) => handleInputChange('made_on_request_lead_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-satoshi"
                      >
                        <option value="2-3 weeks">2-3 weeks</option>
                        <option value="3-4 weeks">3-4 weeks</option>
                        <option value="4-6 weeks">4-6 weeks</option>
                        <option value="6-8 weeks">6-8 weeks</option>
                        <option value="8-10 weeks">8-10 weeks</option>
                        <option value="10-12 weeks">10-12 weeks</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                        Custom Message (Optional)
                      </label>
                      <textarea
                        value={formData.made_on_request_message}
                        onChange={(e) => handleInputChange('made_on_request_message', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-satoshi"
                        placeholder="e.g., This exquisite piece is handcrafted by our master jewellers..."
                      />
                      <p className="text-xs text-gray-500 mt-1 font-satoshi">
                        Leave empty to use the default message on the product page.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metals Tab */}
          {activeTab === 'metals' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 font-cormorant">
                  Available Metals for this Product
                </h3>
                <p className="text-sm text-gray-600 mb-6 font-satoshi">
                  Select which metal types/materials this product is available in. You can upload different images and videos for each metal variation.
                </p>

                {metals.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <p className="text-gray-500 font-satoshi">No metals available in the system</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {metals.map((metal) => (
                      <label
                        key={metal.id}
                        className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-900 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.metal_ids.includes(metal.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                metal_ids: [...prev.metal_ids, metal.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                metal_ids: prev.metal_ids.filter(id => id !== metal.id)
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900"
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <div
                            className="w-6 h-6 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: metal.color_code || '#cccccc' }}
                            title={metal.color_code}
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 font-satoshi">{metal.name}</span>
                            {metal.price_multiplier && metal.price_multiplier !== 1 && (
                              <span className="text-xs text-gray-500 block font-satoshi">
                                ×{parseFloat(metal.price_multiplier).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {formData.metal_ids.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2 font-satoshi">
                      ✓ Selected Metals ({formData.metal_ids.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.metal_ids.map((metalId) => {
                        const metal = metals.find(m => m.id === metalId);
                        return metal ? (
                          <div
                            key={metalId}
                            className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-blue-300"
                          >
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: metal.color_code || '#cccccc' }}
                            />
                            <span className="text-sm text-gray-900 font-satoshi">{metal.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                    <p className="text-xs text-blue-700 mt-3 font-satoshi">
                      Go to the <strong>Media</strong> tab to upload images and videos for each metal type.
                    </p>
                  </div>
                )}
              </div>

              {/* Diamond Sizes Section - Only for Engagement Rings */}
              {jewelrySubTypes.find(jst => jst.slug === 'engagement-rings')?.id === formData.jewelry_sub_type_id && diamondSizes.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 font-cormorant">
                    Diamond Sizes for this Product
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 font-satoshi">
                    Select which diamond sizes this engagement ring is available in. Different diamond sizes may have different images.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {diamondSizes.map((diamondSize) => (
                      <label
                        key={diamondSize.id}
                        className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-900 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.diamond_size_ids.includes(diamondSize.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                diamond_size_ids: [...prev.diamond_size_ids, diamondSize.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                diamond_size_ids: prev.diamond_size_ids.filter(id => id !== diamondSize.id)
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900"
                        />
                        <div className="text-center">
                          <span className="text-lg font-semibold text-gray-900 font-satoshi">{diamondSize.name}</span>
                          {diamondSize.display_name && (
                            <span className="text-xs text-gray-500 block font-satoshi">{diamondSize.display_name}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {formData.diamond_size_ids.length > 0 && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="text-sm font-medium text-purple-900 mb-2 font-satoshi">
                        ✓ Selected Diamond Sizes ({formData.diamond_size_ids.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.diamond_size_ids.map((sizeId) => {
                          const size = diamondSizes.find(s => s.id === sizeId);
                          return size ? (
                            <span
                              key={sizeId}
                              className="bg-white px-3 py-1 rounded-full border border-purple-300 text-sm text-gray-900 font-satoshi"
                            >
                              Size {size.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {formData.metal_ids.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-satoshi">
                    <strong>💡 Tip:</strong> To upload metal-specific images and videos, go to the <strong>Metals</strong> tab and select at least one metal type first.
                  </p>
                </div>
              )}

              {/* General Images Section (applicable to all metals) */}
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-3 mb-4 border border-gray-300">
                  <h4 className="text-sm font-medium text-gray-900 font-satoshi">General Product Images</h4>
                  <p className="text-xs text-gray-600 font-satoshi">These images apply to all metal variations</p>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 font-cormorant">
                    Product Images ({formData.images.length}/4)
                  </h3>
                  <div className="flex space-x-2">
                    <label className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-satoshi cursor-pointer ${
                      formData.images.length >= 4
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}>
                      <Upload className="h-4 w-4" />
                      <span>Upload Multiple Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const remainingSlots = 4 - formData.images.length;
                          const filesToAdd = files.slice(0, remainingSlots);

                          const newImages = filesToAdd.map(file => ({
                            file,
                            url: URL.createObjectURL(file),
                            alt_text: file.name.replace(/\.[^/.]+$/, "")
                          }));

                          setFormData(prev => ({
                            ...prev,
                            images: [...prev.images, ...newImages]
                          }));

                          // Reset the input
                          e.target.value = '';
                        }}
                        className="hidden"
                        disabled={formData.images.length >= 4}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={addImage}
                      disabled={formData.images.length >= 4}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-satoshi ${
                        formData.images.length >= 4
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Single</span>
                    </button>
                  </div>
                </div>

                {formData.images.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 font-satoshi">No images added yet</p>
                    <p className="text-sm text-gray-400 font-satoshi mb-3">Upload up to 4 high-quality images</p>
                    <button
                      type="button"
                      onClick={addImage}
                      className="mt-2 text-gray-900 hover:underline font-satoshi"
                    >
                      Add your first image
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 font-satoshi">
                            Image {index + 1}
                            {index === 0 && <span className="text-blue-600 ml-1">(Primary)</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            {image.url ? (
                              <div className="relative">
                                <img
                                  src={getMediaUrl(image.url)}
                                  alt={image.alt_text || `Product image ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <label className="cursor-pointer bg-white bg-opacity-90 px-3 py-1 rounded text-sm font-satoshi">
                                    Change Image
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => e.target.files?.[0] && updateImage(index, 'file', e.target.files[0])}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-6 h-6 mb-2 text-gray-400" />
                                  <p className="text-xs text-gray-500 font-satoshi">Click to upload image</p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && updateImage(index, 'file', e.target.files[0])}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          <input
                            type="text"
                            value={image.alt_text}
                            onChange={(e) => updateImage(index, 'alt_text', e.target.value)}
                            placeholder="Alt text (required for SEO)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Videos Section */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 font-cormorant">
                    Product Videos ({formData.videos.length}/2)
                  </h3>
                  <div className="flex space-x-2">
                    <label className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-satoshi cursor-pointer ${
                      formData.videos.length >= 2
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}>
                      <Package className="h-4 w-4" />
                      <span>Upload Multiple Videos</span>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const remainingSlots = 2 - formData.videos.length;
                          const filesToAdd = files.slice(0, remainingSlots);

                          const newVideos = filesToAdd.map(file => ({
                            file,
                            url: URL.createObjectURL(file),
                            title: file.name.replace(/\.[^/.]+$/, "")
                          }));

                          setFormData(prev => ({
                            ...prev,
                            videos: [...prev.videos, ...newVideos]
                          }));

                          // Reset the input
                          e.target.value = '';
                        }}
                        className="hidden"
                        disabled={formData.videos.length >= 2}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={addVideo}
                      disabled={formData.videos.length >= 2}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-satoshi ${
                        formData.videos.length >= 2
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Single</span>
                    </button>
                  </div>
                </div>

                {formData.videos.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500 font-satoshi">No videos added yet</p>
                    <p className="text-sm text-gray-400 font-satoshi mb-3">Upload up to 2 high-quality videos</p>
                    <button
                      type="button"
                      onClick={addVideo}
                      className="mt-2 text-gray-900 hover:underline font-satoshi"
                    >
                      Add your first video
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.videos.map((video, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700 font-satoshi">
                            Video {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVideo(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            {video.url ? (
                              <div className="relative">
                                <video
                                  src={getMediaUrl(video.url)}
                                  className="w-full h-32 object-cover rounded-lg border"
                                  controls
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <label className="cursor-pointer bg-white bg-opacity-90 px-3 py-1 rounded text-sm font-satoshi">
                                    Change Video
                                    <input
                                      type="file"
                                      accept="video/*"
                                      onChange={(e) => e.target.files?.[0] && updateVideo(index, 'file', e.target.files[0])}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Package className="w-6 h-6 mb-2 text-gray-400" />
                                  <p className="text-xs text-gray-500 font-satoshi">Click to upload video</p>
                                </div>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => e.target.files?.[0] && updateVideo(index, 'file', e.target.files[0])}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>

                          <div>
                            <input
                              type="text"
                              value={video.title}
                              onChange={(e) => updateVideo(index, 'title', e.target.value)}
                              placeholder="Video title (optional)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Metal-Specific Images and Videos */}
              {formData.metal_ids.length > 0 && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 font-cormorant mb-4">
                    Metal-Specific Media
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 font-satoshi">
                    Upload different images and videos for each metal type. Customers will see these when they select the metal variation.
                  </p>

                  <div className="space-y-6">
                    {formData.metal_ids.map((metalId) => {
                      const metal = metals.find(m => m.id === metalId);
                      if (!metal) return null;

                      return (
                        <div
                          key={metalId}
                          className="border border-gray-300 rounded-lg overflow-hidden"
                        >
                          {/* Metal Header */}
                          <div
                            className="px-4 py-3 flex items-center space-x-3"
                            style={{ backgroundColor: metal.color_code ? `${metal.color_code}15` : '#f3f4f6' }}
                          >
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-400"
                              style={{ backgroundColor: metal.color_code || '#cccccc' }}
                            />
                            <h4 className="font-semibold text-gray-900 font-satoshi">{metal.name}</h4>
                          </div>

                          {/* Images for this metal */}
                          <div className="p-4 bg-gray-50">
                            <h5 className="text-sm font-medium text-gray-900 mb-3 font-satoshi">
                              Images for {metal.name} ({(metalMediaState[metalId]?.images?.length || 0)})
                            </h5>
                            <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg cursor-pointer w-fit mb-3 font-satoshi transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                              <Upload className="h-4 w-4" />
                              <span>Upload {metal.name} Images</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  const newImages = files.map(file => ({
                                    file,
                                    url: URL.createObjectURL(file),
                                    alt_text: file.name.replace(/\.[^/.]+$/, "")
                                  }));

                                  setMetalMediaState(prev => ({
                                    ...prev,
                                    [metalId]: {
                                      ...prev[metalId],
                                      images: [...(prev[metalId]?.images || []), ...newImages]
                                    }
                                  }));

                                  e.target.value = '';
                                }}
                              />
                            </label>

                            {/* Display images - grouped by diamond size if any */}
                            {(metalMediaState[metalId]?.images?.length || 0) > 0 && (() => {
                              const allImgs = metalMediaState[metalId]?.images || [];
                              const hasDiamondSizes = allImgs.some((img: any) => img.diamond_size_id);

                              if (hasDiamondSizes) {
                                // Group images by diamond_size_id
                                const grouped: Record<string, any[]> = {};
                                const noDs: any[] = [];
                                allImgs.forEach((img: any, idx: number) => {
                                  const imgWithIdx = { ...img, _originalIdx: idx };
                                  if (img.diamond_size_id) {
                                    if (!grouped[img.diamond_size_id]) grouped[img.diamond_size_id] = [];
                                    grouped[img.diamond_size_id].push(imgWithIdx);
                                  } else {
                                    noDs.push(imgWithIdx);
                                  }
                                });

                                // Sort diamond size groups by name
                                const sortedGroups = Object.entries(grouped).sort(([aId], [bId]) => {
                                  const aDs = diamondSizes.find(d => d.id === aId);
                                  const bDs = diamondSizes.find(d => d.id === bId);
                                  return (aDs?.sort_order || 0) - (bDs?.sort_order || 0);
                                });

                                return (
                                  <div className="space-y-4 mt-3">
                                    {/* Images without diamond size */}
                                    {noDs.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-gray-600 mb-2 font-satoshi">General Images</p>
                                        <div className="grid grid-cols-3 gap-2">
                                          {noDs.map((img: any) => (
                                            <div key={img._originalIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                                              <div className="relative bg-gray-100">
                                                <img src={getMediaUrl(img.url)} alt={img.alt_text || ''} className="w-full h-20 object-cover" />
                                                <button type="button" onClick={() => {
                                                  setMetalMediaState(prev => ({ ...prev, [metalId]: { ...prev[metalId], images: prev[metalId]?.images?.filter((_: any, i: number) => i !== img._originalIdx) || [] } }));
                                                }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                                                  <X className="h-3 w-3" />
                                                </button>
                                              </div>
                                              <div className="p-1 border-t border-gray-200">
                                                <label className="flex items-center space-x-1 cursor-pointer">
                                                  <input type="checkbox" checked={img.is_metal_preview || false} onChange={(e) => {
                                                    setMetalMediaState(prev => ({ ...prev, [metalId]: { ...prev[metalId], images: prev[metalId]?.images?.map((image: any, i: number) => i === img._originalIdx ? { ...image, is_metal_preview: e.target.checked } : { ...image, is_metal_preview: false }) || [] } }));
                                                  }} className="w-3 h-3 rounded" />
                                                  <span className="text-[10px] text-gray-700 font-satoshi">{img.is_metal_preview ? 'Preview' : 'Set Preview'}</span>
                                                </label>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {/* Images grouped by diamond size */}
                                    {sortedGroups.map(([dsId, imgs]) => {
                                      const ds = diamondSizes.find(d => d.id === dsId);
                                      return (
                                        <div key={dsId} className="border border-indigo-200 rounded-lg overflow-hidden">
                                          <div className="bg-indigo-50 px-3 py-1.5 border-b border-indigo-200">
                                            <span className="text-xs font-semibold text-indigo-800 font-satoshi">
                                              Diamond Size {ds?.name || dsId} {ds?.display_name ? `- ${ds.display_name}` : ''}
                                            </span>
                                            <span className="text-[10px] text-indigo-500 ml-2">({imgs.length} images)</span>
                                          </div>
                                          <div className="p-2 grid grid-cols-3 gap-2">
                                            {imgs.map((img: any) => (
                                              <div key={img._originalIdx} className="border border-gray-200 rounded-lg overflow-hidden">
                                                <div className="relative bg-gray-100">
                                                  <img src={getMediaUrl(img.url)} alt={img.alt_text || ''} className="w-full h-20 object-cover" />
                                                  <button type="button" onClick={() => {
                                                    setMetalMediaState(prev => ({ ...prev, [metalId]: { ...prev[metalId], images: prev[metalId]?.images?.filter((_: any, i: number) => i !== img._originalIdx) || [] } }));
                                                  }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                                                    <X className="h-3 w-3" />
                                                  </button>
                                                </div>
                                                <div className="p-1 border-t border-gray-200">
                                                  <label className="flex items-center space-x-1 cursor-pointer">
                                                    <input type="checkbox" checked={img.is_metal_preview || false} onChange={(e) => {
                                                      setMetalMediaState(prev => ({ ...prev, [metalId]: { ...prev[metalId], images: prev[metalId]?.images?.map((image: any, i: number) => i === img._originalIdx ? { ...image, is_metal_preview: e.target.checked } : { ...image, is_metal_preview: false }) || [] } }));
                                                    }} className="w-3 h-3 rounded" />
                                                    <span className="text-[10px] text-gray-700 font-satoshi">{img.is_metal_preview ? 'Preview' : 'Set Preview'}</span>
                                                  </label>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }

                              // No diamond sizes - show flat grid (original behavior)
                              return (
                                <div className="space-y-3 mt-3">
                                  <p className="text-xs text-gray-500 font-satoshi">Check the checkbox to mark this image as the preview for metal selection</p>
                                  <div className="grid grid-cols-2 gap-3">
                                    {allImgs.map((img: any, idx: number) => (
                                      <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="relative bg-gray-100">
                                          <img
                                            src={getMediaUrl(img.url)}
                                            alt={img.alt_text || `${metal.name} image ${idx + 1}`}
                                            className="w-full h-24 object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMetalMediaState(prev => ({
                                                ...prev,
                                                [metalId]: {
                                                  ...prev[metalId],
                                                  images: prev[metalId]?.images?.filter((_: any, i: number) => i !== idx) || []
                                                }
                                              }));
                                            }}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                        <div className="p-2 border-t border-gray-200">
                                          <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={img.is_metal_preview || false}
                                              onChange={(e) => {
                                                setMetalMediaState(prev => ({
                                                  ...prev,
                                                  [metalId]: {
                                                    ...prev[metalId],
                                                    images: prev[metalId]?.images?.map((image: any, i: number) =>
                                                      i === idx
                                                        ? { ...image, is_metal_preview: e.target.checked }
                                                        : { ...image, is_metal_preview: false }
                                                    ) || []
                                                  }
                                                }));
                                              }}
                                              className="w-4 h-4 rounded"
                                            />
                                            <span className="text-xs text-gray-700 font-satoshi">
                                              {img.is_metal_preview ? '✓ Preview Image' : 'Set as Preview'}
                                            </span>
                                          </label>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Videos for this metal */}
                          <div className="p-4 border-t border-gray-200">
                            <h5 className="text-sm font-medium text-gray-900 mb-3 font-satoshi">
                              Videos for {metal.name} ({(metalMediaState[metalId]?.videos?.length || 0)}/2)
                            </h5>
                            <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg cursor-pointer w-fit mb-3 font-satoshi transition-colors"
                              style={{
                                pointerEvents: (metalMediaState[metalId]?.videos?.length || 0) >= 2 ? 'none' : 'auto',
                                opacity: (metalMediaState[metalId]?.videos?.length || 0) >= 2 ? 0.6 : 1
                              }}>
                              <Package className="h-4 w-4" />
                              <span>Upload {metal.name} Videos</span>
                              <input
                                type="file"
                                accept="video/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  const remainingSlots = 2 - (metalMediaState[metalId]?.videos?.length || 0);
                                  const filesToAdd = files.slice(0, remainingSlots);

                                  const newVideos = filesToAdd.map(file => ({
                                    file,
                                    url: URL.createObjectURL(file),
                                    title: file.name.replace(/\.[^/.]+$/, "")
                                  }));

                                  setMetalMediaState(prev => ({
                                    ...prev,
                                    [metalId]: {
                                      ...prev[metalId],
                                      videos: [...(prev[metalId]?.videos || []), ...newVideos]
                                    }
                                  }));

                                  e.target.value = '';
                                }}
                                disabled={(metalMediaState[metalId]?.videos?.length || 0) >= 2}
                              />
                            </label>
                            <div className="text-xs text-gray-500 font-satoshi">
                              You can upload up to 2 videos per metal type
                            </div>

                            {/* Display uploaded metal-specific videos */}
                            {(metalMediaState[metalId]?.videos?.length || 0) > 0 && (
                              <div className="grid grid-cols-1 gap-2 mt-3">
                                {metalMediaState[metalId]?.videos?.map((vid, idx) => (
                                  <div key={idx} className="relative border border-gray-200 rounded-lg overflow-hidden">
                                    <video
                                      src={getMediaUrl(vid.url)}
                                      className="w-full h-24 object-cover bg-black"
                                      controls
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMetalMediaState(prev => ({
                                          ...prev,
                                          [metalId]: {
                                            ...prev[metalId],
                                            videos: prev[metalId]?.videos?.filter((_, i) => i !== idx) || []
                                          }
                                        }));
                                      }}
                                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-satoshi">
                      <strong>✓ Media Upload Ready:</strong> Metal-specific media upload will be fully functional once you save the product.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 font-cormorant">Product Variants</h3>
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-satoshi"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Variant</span>
                </button>
              </div>

              {formData.variants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500 font-satoshi">No variants added yet</p>
                  <p className="text-gray-400 text-sm font-satoshi">Add variants for different sizes, colors, or materials</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 font-satoshi">
                          Variant {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={variant.variant_name}
                          onChange={(e) => updateVariant(index, 'variant_name', e.target.value)}
                          placeholder="Variant name (e.g., Size L, Gold)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={variant.price_adjustment}
                          onChange={(e) => updateVariant(index, 'price_adjustment', e.target.value)}
                          placeholder="Price adjustment (£)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                        />
                        <input
                          type="number"
                          value={variant.stock_quantity}
                          onChange={(e) => updateVariant(index, 'stock_quantity', e.target.value)}
                          placeholder="Stock quantity"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <input
                          type="text"
                          value={variant.size || ''}
                          onChange={(e) => updateVariant(index, 'size', e.target.value)}
                          placeholder="Size (optional)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                        />
                        <input
                          type="text"
                          value={variant.metal_type || ''}
                          onChange={(e) => updateVariant(index, 'metal_type', e.target.value)}
                          placeholder="Metal type (optional)"
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                    Weight (grams)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                    placeholder="Product weight"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange('dimensions', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                    placeholder="e.g., 20mm diameter, Size N"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                  Care Instructions
                </label>
                <textarea
                  value={formData.care_instructions}
                  onChange={(e) => handleInputChange('care_instructions', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                  placeholder="How to care for this product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                  Warranty Information
                </label>
                <textarea
                  value={formData.warranty_info}
                  onChange={(e) => handleInputChange('warranty_info', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                  placeholder="Warranty details and coverage"
                />
              </div>
            </div>
          )}

          {/* Nivoda Integration Tab — fully self-contained */}
          {activeTab === 'nivoda' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 font-satoshi mb-1">Nivoda Integration</h4>
                    <p className="text-xs text-blue-700 font-satoshi">
                      Enable Nivoda integration to show dynamic diamond specifications and pricing on the product detail page.
                      Prices will update automatically based on Nivoda API data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Enable Nivoda Integration */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-900 font-satoshi">Enable Nivoda Diamond Pricing</label>
                  <p className="text-xs text-gray-500 mt-1 font-satoshi">
                    Show live Nivoda diamond prices on the product page (engagement rings)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.nivoda_enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        nivoda_enabled: enabled,
                        show_stone_type: enabled ? true : prev.show_stone_type,
                        show_carat: enabled ? true : prev.show_carat,
                        show_clarity: enabled ? true : prev.show_clarity,
                        show_colour: enabled ? true : prev.show_colour,
                        show_cut: enabled ? true : prev.show_cut,
                      }));
                      if (enabled && !nivodaAvailableOptions) fetchNivodaOptions();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.nivoda_enabled && (
                <>
                  {/* Diamond Specifications Configuration */}
                  <div className="border-t border-gray-200 pt-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 font-satoshi">Diamond Specifications</h4>
                        <p className="text-xs text-gray-500 mt-0.5 font-satoshi">Configure what customers can select and which options are available</p>
                      </div>
                      {!nivodaAvailableOptions && !nivodaLoading && (
                        <button type="button" onClick={fetchNivodaOptions} className="text-xs text-blue-600 underline font-satoshi">
                          Load options from Nivoda
                        </button>
                      )}
                      {nivodaLoading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    </div>

                    {nivodaError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-xs text-red-700 font-satoshi flex justify-between">
                        <span>Error: {nivodaError}</span>
                        <button onClick={fetchNivodaOptions} className="underline">Retry</button>
                      </div>
                    )}

                    {/* Always-visible config form */}
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        {/* Stone Type Selection */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <label className="text-sm font-medium text-gray-900 mb-3 block font-satoshi">
                            Stone Type
                          </label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="stoneType"
                                value="natural"
                                checked={formData.nivoda_options_config?.stoneType === 'natural'}
                                onChange={() => {
                                  setFormData({
                                    ...formData,
                                    nivoda_options_config: {
                                      ...formData.nivoda_options_config!,
                                      stoneType: 'natural'
                                    }
                                  });
                                }}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-700 font-satoshi">Natural</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="stoneType"
                                value="lab-grown"
                                checked={formData.nivoda_options_config?.stoneType === 'lab-grown'}
                                onChange={() => {
                                  setFormData({
                                    ...formData,
                                    nivoda_options_config: {
                                      ...formData.nivoda_options_config!,
                                      stoneType: 'lab-grown'
                                    }
                                  });
                                }}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-700 font-satoshi">Lab-Grown</span>
                            </label>
                          </div>
                        </div>

                        {/* Carat Range */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <label className="text-sm font-medium text-gray-900 mb-4 block font-satoshi">
                            Carat Weight Range
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-600 font-satoshi">Minimum</label>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.nivoda_options_config?.caratRange?.min || 0.5}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    nivoda_options_config: {
                                      ...formData.nivoda_options_config!,
                                      caratRange: {
                                        ...formData.nivoda_options_config?.caratRange!,
                                        min: parseFloat(e.target.value)
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 font-satoshi">Maximum</label>
                              <input
                                type="number"
                                step="0.01"
                                value={formData.nivoda_options_config?.caratRange?.max || 2.0}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    nivoda_options_config: {
                                      ...formData.nivoda_options_config!,
                                      caratRange: {
                                        ...formData.nivoda_options_config?.caratRange!,
                                        max: parseFloat(e.target.value)
                                      }
                                    }
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 font-satoshi">
                            Customers can select carat weight between {formData.nivoda_options_config?.caratRange?.min || 0.5} and {formData.nivoda_options_config?.caratRange?.max || 2.0} carats
                          </p>
                        </div>

                        {/* Clarities */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <label className="text-sm font-medium text-gray-900 mb-4 block font-satoshi">
                            Available Clarity Grades
                          </label>
                          {(nivodaAvailableOptions?.clarities || []).length === 0 ? (
                            <p className="text-xs text-gray-400 italic font-satoshi">Load options from Nivoda to see available clarity grades</p>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {(nivodaAvailableOptions?.clarities || []).map((clarity) => {
                                const isSelected = (formData.nivoda_options_config?.clarityOptions || []).includes(clarity);
                                return (
                                  <label key={clarity} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        setFormData({
                                          ...formData,
                                          nivoda_options_config: {
                                            ...formData.nivoda_options_config!,
                                            clarityOptions: e.target.checked
                                              ? [...(formData.nivoda_options_config?.clarityOptions || []), clarity]
                                              : (formData.nivoda_options_config?.clarityOptions || []).filter(c => c !== clarity)
                                          }
                                        });
                                      }}
                                      className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 font-satoshi">{clarity}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-3 font-satoshi">
                            Customers can choose from the clarity grades you select above
                          </p>
                        </div>

                        {/* Colours */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <label className="text-sm font-medium text-gray-900 mb-4 block font-satoshi">
                            Available Colours
                          </label>
                          {(nivodaAvailableOptions?.colours || []).length === 0 ? (
                            <p className="text-xs text-gray-400 italic font-satoshi">Load options from Nivoda to see available colour grades</p>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {(nivodaAvailableOptions?.colours || []).map((colour) => {
                                const isSelected = (formData.nivoda_options_config?.colourOptions || []).includes(colour);
                                return (
                                  <label key={colour} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        setFormData({
                                          ...formData,
                                          nivoda_options_config: {
                                            ...formData.nivoda_options_config!,
                                            colourOptions: e.target.checked
                                              ? [...(formData.nivoda_options_config?.colourOptions || []), colour]
                                              : (formData.nivoda_options_config?.colourOptions || []).filter(c => c !== colour)
                                          }
                                        });
                                      }}
                                      className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 font-satoshi">{colour}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-3 font-satoshi">
                            Customers can choose from the colours you select above
                          </p>
                        </div>

                        {/* Cuts */}
                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <label className="text-sm font-medium text-gray-900 mb-4 block font-satoshi">
                            Available Cut Grades
                          </label>
                          {(nivodaAvailableOptions?.cuts || []).length === 0 ? (
                            <p className="text-xs text-gray-400 italic font-satoshi">Load options from Nivoda to see available cut grades</p>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {(nivodaAvailableOptions?.cuts || []).map((cut) => {
                                const isSelected = (formData.nivoda_options_config?.cutOptions || []).includes(cut);
                                return (
                                  <label key={cut} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        setFormData({
                                          ...formData,
                                          nivoda_options_config: {
                                            ...formData.nivoda_options_config!,
                                            cutOptions: e.target.checked
                                              ? [...(formData.nivoda_options_config?.cutOptions || []), cut]
                                              : (formData.nivoda_options_config?.cutOptions || []).filter(c => c !== cut)
                                          }
                                        });
                                      }}
                                      className="rounded"
                                    />
                                    <span className="text-sm text-gray-700 font-satoshi">{cut}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-3 font-satoshi">
                            Customers can choose from the cut grades you select above
                          </p>
                        </div>


                        {/* Default Diamond Specs — Base Price Configuration */}
                        <div className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                          <label className="text-sm font-semibold text-gray-900 mb-1 block font-satoshi">
                            Base Price Configuration
                          </label>
                          <p className="text-xs text-gray-600 mb-4 font-satoshi">
                            Choose the default diamond specs shown to customers before they customise. Pick the lowest-priced combination (e.g. Good cut, J colour, SI2 clarity, smallest carat) — this sets the "starting from" price on the product page.
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 font-satoshi mb-1 block">Default Carat</label>
                              <select
                                value={formData.nivoda_options_config?.defaultSpecs?.carat || ''}
                                onChange={(e) => setFormData({ ...formData, nivoda_options_config: { ...formData.nivoda_options_config!, defaultSpecs: { ...formData.nivoda_options_config?.defaultSpecs, carat: e.target.value } } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                <option value="">Select carat</option>
                                {[0.5,0.75,1.0,1.25,1.5,1.75,2.0,2.5,3.0,5.0,10.0]
                                  .filter(c => {
                                    const r = formData.nivoda_options_config?.caratRange;
                                    return r ? c >= r.min && c <= r.max : true;
                                  })
                                  .map(c => (
                                    <option key={c} value={c.toFixed(2)}>{c.toFixed(2)} ct</option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 font-satoshi mb-1 block">Default Clarity</label>
                              <select
                                value={formData.nivoda_options_config?.defaultSpecs?.clarity || ''}
                                onChange={(e) => setFormData({ ...formData, nivoda_options_config: { ...formData.nivoda_options_config!, defaultSpecs: { ...formData.nivoda_options_config?.defaultSpecs, clarity: e.target.value } } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                <option value="">Select clarity</option>
                                {((formData.nivoda_options_config?.clarityOptions || []).length > 0
                                  ? formData.nivoda_options_config!.clarityOptions!
                                  : ['IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3']
                                ).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 font-satoshi mb-1 block">Default Colour</label>
                              <select
                                value={formData.nivoda_options_config?.defaultSpecs?.colour || ''}
                                onChange={(e) => setFormData({ ...formData, nivoda_options_config: { ...formData.nivoda_options_config!, defaultSpecs: { ...formData.nivoda_options_config?.defaultSpecs, colour: e.target.value } } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                <option value="">Select colour</option>
                                {((formData.nivoda_options_config?.colourOptions || []).length > 0
                                  ? formData.nivoda_options_config!.colourOptions!
                                  : ['D','E','F','G','H','I','J','K','L','M']
                                ).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 font-satoshi mb-1 block">Default Cut</label>
                              <select
                                value={formData.nivoda_options_config?.defaultSpecs?.cut || ''}
                                onChange={(e) => setFormData({ ...formData, nivoda_options_config: { ...formData.nivoda_options_config!, defaultSpecs: { ...formData.nivoda_options_config?.defaultSpecs, cut: e.target.value } } })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-satoshi focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                <option value="">Select cut</option>
                                {((formData.nivoda_options_config?.cutOptions || []).length > 0
                                  ? formData.nivoda_options_config!.cutOptions!
                                  : ['Ideal','Excellent','Very Good','Good','Fair','Poor']
                                ).map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          {formData.nivoda_options_config?.defaultSpecs?.carat && (
                            <p className="text-xs text-amber-700 mt-3 font-satoshi">
                              Base price will be: Ring price + Nivoda price for {formData.nivoda_options_config.defaultSpecs.carat}ct / {formData.nivoda_options_config.defaultSpecs.clarity || '—'} / {formData.nivoda_options_config.defaultSpecs.colour || '—'} / {formData.nivoda_options_config.defaultSpecs.cut || '—'}
                            </p>
                          )}
                        </div>

                      </div>
                  </div>

                  {/* Certificate Input */}
                  {formData.show_certificate && (
                    <div className="border-t border-gray-200 pt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                        Certificate Information
                      </label>
                      <input
                        type="text"
                        value={formData.certificate}
                        onChange={(e) => handleInputChange('certificate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-satoshi"
                        placeholder="e.g., GIA, IGI, or certificate number"
                      />
                      <p className="text-xs text-gray-500 mt-1 font-satoshi">
                        Enter the certification authority or certificate number
                      </p>
                    </div>
                  )}

                  {/* Live Market Price */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 font-satoshi">Live Market Price</h4>
                        <p className="text-xs text-gray-500 font-satoshi mt-0.5">
                          Check current Nivoda prices using this ring's configured specs
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={checkMarketPrice}
                        disabled={marketPriceLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-satoshi rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {marketPriceLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        )}
                        {marketPriceLoading ? 'Fetching...' : 'Check Live Price'}
                      </button>
                    </div>

                    {marketPriceError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-satoshi">
                        {marketPriceError}
                      </div>
                    )}

                    {marketPrice && !marketPriceLoading && (
                      <div className="space-y-3">
                        {/* Specs used */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(marketPrice.specs).map(([k, v]) => (
                            <span key={k} className="px-2 py-1 bg-gray-100 rounded text-xs font-satoshi text-gray-600 capitalize">
                              {k}: <strong>{v}</strong>
                            </span>
                          ))}
                          <span className="px-2 py-1 bg-blue-50 rounded text-xs font-satoshi text-blue-700">
                            {marketPrice.count} matching diamond{marketPrice.count !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Price cards */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-xs text-gray-500 font-satoshi mb-1">From</p>
                            <p className="text-xl font-bold text-gray-900 font-satoshi">£{marketPrice.min.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-900 border border-gray-900 rounded-xl p-4 text-center">
                            <p className="text-xs text-gray-400 font-satoshi mb-1">Average</p>
                            <p className="text-xl font-bold text-white font-satoshi">£{marketPrice.avg.toLocaleString()}</p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                            <p className="text-xs text-gray-500 font-satoshi mb-1">Up to</p>
                            <p className="text-xl font-bold text-gray-900 font-satoshi">£{marketPrice.max.toLocaleString()}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 font-satoshi">
                          Prices converted from USD · Updated live from Nivoda production API
                        </p>
                      </div>
                    )}

                    {!marketPrice && !marketPriceLoading && !marketPriceError && (
                      <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center">
                        <p className="text-sm text-gray-400 font-satoshi">
                          Click "Check Live Price" to see current market prices for this ring's diamond specs
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                  placeholder="SEO title (leave empty to auto-generate)"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1 font-satoshi">
                  {formData.meta_title.length}/60 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 font-satoshi">
                  Meta Description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-satoshi"
                  placeholder="SEO description (leave empty to auto-generate)"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1 font-satoshi">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 font-satoshi"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 font-satoshi flex items-center space-x-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{mode === 'create' ? 'Create Product' : 'Update Product'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductFormModal;