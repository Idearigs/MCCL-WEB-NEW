import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import API_BASE_URL from '../../config/api';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit' | 'view';
  type: 'categories' | 'ringTypes' | 'gemstones' | 'metals' | 'collections';
  item?: any;
  onSuccess: (updatedItem: any) => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  type,
  item,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    sort_order: 0,
    color_code: '#000000',
    price_multiplier: 1.0,
    color: '',
    hardness: 0,
    price_per_carat: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',
        image_url: item.image_url || '',
        is_active: item.is_active ?? true,
        is_featured: item.is_featured ?? false,
        sort_order: item.sort_order || 0,
        color_code: item.color_code || '#000000',
        price_multiplier: item.price_multiplier || 1.0,
        color: item.color || '',
        hardness: item.hardness || 0,
        price_per_carat: item.price_per_carat || 0
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        is_active: true,
        is_featured: false,
        sort_order: 0,
        color_code: '#000000',
        price_multiplier: 1.0,
        color: '',
        hardness: 0,
        price_per_carat: 0
      });
    }
  }, [item, isOpen]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (mode === 'view') return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('admin_token');
      const endpoints = {
        categories: 'categories',
        ringTypes: 'categories/ring-types',
        gemstones: 'categories/gemstones',
        metals: 'categories/metals',
        collections: 'categories/collections'
      };

      const endpoint = endpoints[type];
      const url = mode === 'create'
        ? `${API_BASE_URL}/admin/${endpoint}`
        : `${API_BASE_URL}/admin/${endpoint}/${item.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      // Prepare data based on type
      let submitData: any = {
        name: formData.name,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order.toString())
      };

      if (type === 'categories' || type === 'ringTypes' || type === 'gemstones' || type === 'collections') {
        submitData.slug = formData.slug;
        submitData.description = formData.description;
      }

      if (type === 'categories') {
        submitData.image_url = formData.image_url;
      }

      if (type === 'metals') {
        submitData.color_code = formData.color_code;
        submitData.price_multiplier = parseFloat(formData.price_multiplier.toString());
      }

      if (type === 'gemstones') {
        submitData.color = formData.color;
        if (formData.hardness) submitData.hardness = parseFloat(formData.hardness.toString());
        if (formData.price_per_carat) submitData.price_per_carat = parseFloat(formData.price_per_carat.toString());
      }

      if (type === 'collections') {
        submitData.is_featured = formData.is_featured;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const savedItem = await response.json();
        onSuccess(savedItem);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save item');
      }
    } catch (error) {
      setError('Error saving item');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const typeNames = {
      categories: 'Category',
      ringTypes: 'Ring Type',
      gemstones: 'Gemstone',
      metals: 'Metal',
      collections: 'Collection'
    };

    const modeNames = {
      create: 'Create',
      edit: 'Edit',
      view: 'View'
    };

    return `${modeNames[mode]} ${typeNames[type]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={mode === 'view'}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Slug (for categories, ring types, gemstones) */}
          {(type === 'categories' || type === 'ringTypes' || type === 'gemstones' || type === 'collections') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                disabled={mode === 'view'}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          )}

          {/* Description (for categories, ring types, gemstones) */}
          {(type === 'categories' || type === 'ringTypes' || type === 'gemstones' || type === 'collections') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                disabled={mode === 'view'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          )}

          {/* is_featured (for collections only) */}
          {type === 'collections' && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                checked={formData.is_featured}
                onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                disabled={mode === 'view'}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
              />
              <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-900">
                Featured
              </label>
            </div>
          )}

          {/* Image URL (for categories only) */}
          {type === 'categories' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          )}

          {/* Color Code (for metals) */}
          {type === 'metals' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Code *
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.color_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_code: e.target.value }))}
                  disabled={mode === 'view'}
                  className="w-12 h-10 border border-gray-300 rounded-lg disabled:bg-gray-100"
                />
                <input
                  type="text"
                  value={formData.color_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, color_code: e.target.value }))}
                  disabled={mode === 'view'}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>
          )}

          {/* Price Multiplier (for metals) */}
          {type === 'metals' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Multiplier
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={formData.price_multiplier}
                onChange={(e) => setFormData(prev => ({ ...prev, price_multiplier: parseFloat(e.target.value) || 0 }))}
                disabled={mode === 'view'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>
          )}

          {/* Gemstone specific fields */}
          {type === 'gemstones' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hardness (Mohs Scale)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.hardness}
                  onChange={(e) => setFormData(prev => ({ ...prev, hardness: parseFloat(e.target.value) || 0 }))}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Carat (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_per_carat}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_per_carat: parseFloat(e.target.value) || 0 }))}
                  disabled={mode === 'view'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </>
          )}

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort Order
            </label>
            <input
              type="number"
              min="0"
              value={formData.sort_order}
              onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
              disabled={mode === 'view'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              disabled={mode === 'view'}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          {/* Action Buttons */}
          {mode !== 'view' && (
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : (mode === 'create' ? 'Create' : 'Update')}
              </button>
            </div>
          )}

          {mode === 'view' && (
            <div className="pt-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CategoryFormModal;