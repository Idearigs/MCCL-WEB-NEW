import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import API_BASE_URL from '../../config/api';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

type CategoryType =
  | 'earringType'
  | 'necklaceType'
  | 'braceletType'
  | 'ringType'
  | 'gemstone'
  | 'metal'
  | 'collection'
  | 'jewelryType'
  | 'jewelrySubType';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  type: CategoryType;
  item?: any;
  onSuccess: (item: any) => void;
  jewelryTypeId?: string; // For jewelry sub types
}

// =====================================================
// FORM FIELD CONFIGURATIONS
// =====================================================

const getFieldConfig = (type: CategoryType) => {
  const baseFields = {
    name: { label: 'Name', type: 'text', required: true, placeholder: 'Enter name' },
    slug: { label: 'Slug', type: 'text', required: true, placeholder: 'enter-slug' },
    description: { label: 'Description', type: 'textarea', required: false, placeholder: 'Enter description' },
    is_active: { label: 'Active', type: 'checkbox', required: false },
    sort_order: { label: 'Sort Order', type: 'number', required: false, placeholder: '0' }
  };

  const typeSpecificFields: Record<CategoryType, any> = {
    metal: {
      ...baseFields,
      color_code: { label: 'Color Code', type: 'color', required: true, placeholder: '#000000' },
      price_multiplier: { label: 'Price Multiplier', type: 'number', required: false, placeholder: '1.0000', step: '0.0001' }
    },
    gemstone: {
      ...baseFields,
      color: { label: 'Color', type: 'text', required: false, placeholder: 'Blue' },
      hardness: { label: 'Hardness (Mohs)', type: 'number', required: false, placeholder: '9.0', step: '0.1' },
      price_per_carat: { label: 'Price per Carat', type: 'number', required: false, placeholder: '0.00', step: '0.01' }
    },
    collection: {
      ...baseFields,
      image_url: { label: 'Image URL', type: 'text', required: false, placeholder: 'https://...' },
      is_featured: { label: 'Featured', type: 'checkbox', required: false }
    },
    jewelryType: {
      name: { label: 'Name', type: 'text', required: true, placeholder: 'Enter name' },
      slug: { label: 'Slug', type: 'text', required: true, placeholder: 'enter-slug' },
      description: { label: 'Description', type: 'textarea', required: false, placeholder: 'Enter description' },
      icon: { label: 'Icon', type: 'text', required: false, placeholder: 'Circle, Sparkles, Link, Watch' },
      is_active: { label: 'Active', type: 'checkbox', required: false },
      sort_order: { label: 'Sort Order', type: 'number', required: false, placeholder: '0' }
    },
    jewelrySubType: {
      name: { label: 'Name', type: 'text', required: true, placeholder: 'Enter name' },
      slug: { label: 'Slug', type: 'text', required: true, placeholder: 'enter-slug' },
      description: { label: 'Description', type: 'textarea', required: false, placeholder: 'Enter description' },
      image_url: { label: 'Image URL', type: 'text', required: false, placeholder: 'https://...' },
      is_active: { label: 'Active', type: 'checkbox', required: false },
      sort_order: { label: 'Sort Order', type: 'number', required: false, placeholder: '0' }
    },
    earringType: baseFields,
    necklaceType: baseFields,
    braceletType: baseFields,
    ringType: baseFields
  };

  return typeSpecificFields[type] || baseFields;
};

const getEndpoint = (type: CategoryType, id?: string): string => {
  const endpoints: Record<CategoryType, string> = {
    earringType: 'jewelry-categories/earring-types',
    necklaceType: 'jewelry-categories/necklace-types',
    braceletType: 'jewelry-categories/bracelet-types',
    jewelryType: 'jewelry-categories/jewelry-types',
    jewelrySubType: 'jewelry-categories/jewelry-sub-types',
    ringType: 'categories/ring-types',
    gemstone: 'categories/gemstones',
    metal: 'categories/metals',
    collection: 'categories/collections'
  };

  const baseEndpoint = endpoints[type];
  return id ? `${baseEndpoint}/${id}` : baseEndpoint;
};

const getTypeLabel = (type: CategoryType): string => {
  const labels: Record<CategoryType, string> = {
    earringType: 'Earring Type',
    necklaceType: 'Necklace Type',
    braceletType: 'Bracelet Type',
    ringType: 'Ring Type',
    gemstone: 'Gemstone',
    metal: 'Metal',
    collection: 'Collection',
    jewelryType: 'Jewelry Type',
    jewelrySubType: 'Jewelry Sub Type'
  };
  return labels[type] || 'Item';
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const JewelryCategoryFormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  mode,
  type,
  item,
  onSuccess,
  jewelryTypeId
}) => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = getFieldConfig(type);
  const typeLabel = getTypeLabel(type);

  // Initialize form data
  useEffect(() => {
    if (item && (mode === 'edit' || mode === 'view')) {
      setFormData(item);
    } else {
      // Initialize with default values
      const defaultData: any = {};
      Object.keys(fields).forEach(key => {
        if (fields[key].type === 'checkbox') {
          defaultData[key] = true;
        } else if (fields[key].type === 'number') {
          defaultData[key] = fields[key].placeholder || 0;
        } else {
          defaultData[key] = '';
        }
      });

      // Add jewelry_type_id for sub types
      if (type === 'jewelrySubType' && jewelryTypeId) {
        defaultData.jewelry_type_id = jewelryTypeId;
      }

      setFormData(defaultData);
    }
    setError(null);
  }, [item, mode, type, jewelryTypeId]);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      name: value,
      slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }));
  };

  const handleChange = (field: string, value: any) => {
    if (field === 'name') {
      handleNameChange(value);
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      const endpoint = getEndpoint(type, mode === 'edit' ? item?.id : undefined);

      // Prepare data based on type
      const payload = { ...formData };

      // Convert numeric fields
      if (payload.sort_order !== undefined) {
        payload.sort_order = parseInt(payload.sort_order) || 0;
      }
      if (payload.price_multiplier !== undefined) {
        payload.price_multiplier = parseFloat(payload.price_multiplier) || 1.0;
      }
      if (payload.hardness !== undefined) {
        payload.hardness = parseFloat(payload.hardness) || null;
      }
      if (payload.price_per_carat !== undefined) {
        payload.price_per_carat = parseFloat(payload.price_per_carat) || null;
      }

      const response = await fetch(`${API_BASE_URL}/admin/${endpoint}`, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save item');
      }

      onSuccess(data.data || data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 font-satoshi">
            {mode === 'create' && `Create ${typeLabel}`}
            {mode === 'edit' && `Edit ${typeLabel}`}
            {mode === 'view' && `View ${typeLabel}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="px-6 py-4 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {Object.keys(fields).map((fieldKey) => {
              const field = fields[fieldKey];

              if (field.type === 'checkbox') {
                return (
                  <div key={fieldKey} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={fieldKey}
                      checked={formData[fieldKey] || false}
                      onChange={(e) => handleChange(fieldKey, e.target.checked)}
                      disabled={mode === 'view'}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={fieldKey} className="text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                  </div>
                );
              }

              if (field.type === 'textarea') {
                return (
                  <div key={fieldKey}>
                    <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      id={fieldKey}
                      rows={3}
                      value={formData[fieldKey] || ''}
                      onChange={(e) => handleChange(fieldKey, e.target.value)}
                      disabled={mode === 'view'}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                );
              }

              if (field.type === 'color') {
                return (
                  <div key={fieldKey}>
                    <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        id={`${fieldKey}-color`}
                        value={formData[fieldKey] || '#000000'}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                        disabled={mode === 'view'}
                        className="h-10 w-20 border border-gray-300 rounded cursor-pointer disabled:cursor-not-allowed"
                      />
                      <input
                        type="text"
                        id={fieldKey}
                        value={formData[fieldKey] || ''}
                        onChange={(e) => handleChange(fieldKey, e.target.value)}
                        disabled={mode === 'view'}
                        required={field.required}
                        placeholder={field.placeholder}
                        pattern="^#[0-9A-Fa-f]{6}$"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono"
                      />
                    </div>
                  </div>
                );
              }

              return (
                <div key={fieldKey}>
                  <label htmlFor={fieldKey} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <input
                    type={field.type}
                    id={fieldKey}
                    value={formData[fieldKey] || ''}
                    onChange={(e) => handleChange(fieldKey, e.target.value)}
                    disabled={mode === 'view'}
                    required={field.required}
                    placeholder={field.placeholder}
                    step={field.step}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-satoshi"
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-satoshi"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{mode === 'create' ? 'Create' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default JewelryCategoryFormModal;
