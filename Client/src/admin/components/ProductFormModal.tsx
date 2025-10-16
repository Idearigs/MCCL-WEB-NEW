import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import MultiSelect from './MultiSelect';
import { Package, Upload, Plus, X, Loader2 } from 'lucide-react';

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
  stone_shape_ids: string[];
  stone_type_id: string;
  ring_style_1_ids: string[];
  ring_style_2_ids: string[];
  ring_style_3_ids: string[];
  ring_style_4_ids: string[];
  ring_style_5_ids: string[];
  metal_ids: string[];
  is_active: boolean;
  is_featured: boolean;
  in_stock: boolean;
  stock_quantity: string;
  weight: string;
  dimensions: string;
  care_instructions: string;
  warranty_info: string;
  meta_title: string;
  meta_description: string;
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
    stone_shape_ids: [],
    stone_type_id: '',
    ring_style_1_ids: [],
    ring_style_2_ids: [],
    ring_style_3_ids: [],
    ring_style_4_ids: [],
    ring_style_5_ids: [],
    metal_ids: [],
    is_active: true,
    is_featured: false,
    in_stock: true,
    stock_quantity: '0',
    weight: '',
    dimensions: '',
    care_instructions: '',
    warranty_info: '',
    meta_title: '',
    meta_description: '',
    images: [],
    videos: [],
    variants: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData,
        base_price: initialData.base_price?.toString() || '',
        sale_price: initialData.sale_price?.toString() || '',
        stock_quantity: initialData.stock_quantity?.toString() || '0',
        weight: initialData.weight?.toString() || '',
        images: initialData.images || [],
        videos: initialData.videos || [],
        variants: initialData.variants || []
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
        stone_shape_ids: [],
        stone_type_id: '',
        ring_style_1_ids: [],
        ring_style_2_ids: [],
        ring_style_3_ids: [],
        ring_style_4_ids: [],
        ring_style_5_ids: [],
        metal_ids: [],
        is_active: true,
        is_featured: false,
        in_stock: true,
        stock_quantity: '0',
        weight: '',
        dimensions: '',
        care_instructions: '',
        warranty_info: '',
        meta_title: '',
        meta_description: '',
        images: [],
        videos: [],
        variants: []
      });
    }
    setErrors({});
    setActiveTab('basic');
  }, [initialData, isOpen]);

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
      await onSubmit(formData);
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
    { id: 'media', label: 'Media' },
    { id: 'variants', label: 'Variants' },
    { id: 'details', label: 'Details' },
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

                  {/* Ring Styles - 5 Separate Multi-Select Fields */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 font-satoshi">
                      Ring Styles
                      <span className="text-xs text-gray-500 ml-2 font-normal">(You can select multiple styles for each field)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Ring Style 1 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 font-satoshi">
                          Ring Style 1
                        </label>
                        <MultiSelect
                          options={ringTypes}
                          selectedIds={formData.ring_style_1_ids}
                          onChange={(selectedIds) => handleInputChange('ring_style_1_ids', selectedIds)}
                          placeholder="Select styles for field 1..."
                          className="font-satoshi text-sm"
                        />
                      </div>

                      {/* Ring Style 2 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 font-satoshi">
                          Ring Style 2
                        </label>
                        <MultiSelect
                          options={ringTypes}
                          selectedIds={formData.ring_style_2_ids}
                          onChange={(selectedIds) => handleInputChange('ring_style_2_ids', selectedIds)}
                          placeholder="Select styles for field 2..."
                          className="font-satoshi text-sm"
                        />
                      </div>

                      {/* Ring Style 3 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 font-satoshi">
                          Ring Style 3
                        </label>
                        <MultiSelect
                          options={ringTypes}
                          selectedIds={formData.ring_style_3_ids}
                          onChange={(selectedIds) => handleInputChange('ring_style_3_ids', selectedIds)}
                          placeholder="Select styles for field 3..."
                          className="font-satoshi text-sm"
                        />
                      </div>

                      {/* Ring Style 4 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 font-satoshi">
                          Ring Style 4
                        </label>
                        <MultiSelect
                          options={ringTypes}
                          selectedIds={formData.ring_style_4_ids}
                          onChange={(selectedIds) => handleInputChange('ring_style_4_ids', selectedIds)}
                          placeholder="Select styles for field 4..."
                          className="font-satoshi text-sm"
                        />
                      </div>

                      {/* Ring Style 5 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1 font-satoshi">
                          Ring Style 5
                        </label>
                        <MultiSelect
                          options={ringTypes}
                          selectedIds={formData.ring_style_5_ids}
                          onChange={(selectedIds) => handleInputChange('ring_style_5_ids', selectedIds)}
                          placeholder="Select styles for field 5..."
                          className="font-satoshi text-sm"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-satoshi">
                      Each field can have multiple ring style selections. Assign styles based on priority or grouping.
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
                    Base Price * (£)
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
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Images Section */}
              <div className="space-y-4">
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
                                  src={image.url}
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
                                  src={video.url}
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