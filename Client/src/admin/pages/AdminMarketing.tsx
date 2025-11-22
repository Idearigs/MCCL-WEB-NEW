import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';
import API_BASE_URL from '../../config/api';
import { Plus, Edit, Trash2, Eye, CheckCircle, AlertCircle } from 'lucide-react';

interface MarketingContent {
  id: string;
  title: string;
  description?: string;
  product_id?: string;
  video_url?: string;
  thumbnail_image?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
}

const AdminMarketing: React.FC = () => {
  const { admin } = useAdminAuth();
  const [marketingContents, setMarketingContents] = useState<MarketingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedContent, setSelectedContent] = useState<MarketingContent | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_id: '',
    video_url: '',
    thumbnail_image: '',
    is_active: true,
    is_featured: false,
    sort_order: 0,
  });

  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchMarketingContents();
    fetchProducts();
  }, []);

  const fetchMarketingContents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/marketing?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch marketing content');
      }

      const data = await response.json();
      if (data.success) {
        setMarketingContents(data.data.marketing_content || []);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading marketing content');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products?limit=1000`);
      const data = await response.json();
      if (data.success && data.data.products) {
        setProducts(data.data.products.map((p: any) => ({ id: p.id, name: p.name })));
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleAddNew = () => {
    setSelectedContent(null);
    setFormData({
      title: '',
      description: '',
      product_id: '',
      video_url: '',
      thumbnail_image: '',
      is_active: true,
      is_featured: false,
      sort_order: 0,
    });
    setShowForm(true);
  };

  const handleEdit = (content: MarketingContent) => {
    setSelectedContent(content);
    setFormData({
      title: content.title,
      description: content.description || '',
      product_id: content.product_id || '',
      video_url: content.video_url || '',
      thumbnail_image: content.thumbnail_image || '',
      is_active: content.is_active,
      is_featured: content.is_featured,
      sort_order: content.sort_order,
    });
    setShowForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.title) {
      setError('Title is required');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const method = selectedContent ? 'PUT' : 'POST';
      const url = selectedContent
        ? `${API_BASE_URL}/marketing/${selectedContent.id}`
        : `${API_BASE_URL}/marketing`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save marketing content');
      }

      setSuccess(selectedContent ? 'Content updated successfully' : 'Content created successfully');
      setShowForm(false);
      fetchMarketingContents();
    } catch (err: any) {
      setError(err.message || 'Error saving content');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/marketing/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete content');
      }

      setSuccess('Content deleted successfully');
      setShowConfirmDelete(null);
      fetchMarketingContents();
    } catch (err: any) {
      setError(err.message || 'Error deleting content');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Content</h1>
            <p className="text-gray-600 text-sm mt-1">Manage special product releases and design announcements</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Content
          </button>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

        {/* Form Section */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {selectedContent ? 'Edit Content' : 'New Content'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Spring Collection 2024"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe this release..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Product */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Featured Product</label>
                  <select
                    name="product_id"
                    value={formData.product_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Select a product (optional)</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Sort Order</label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Video URL</label>
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    placeholder="https://youtube.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>

                {/* Thumbnail Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Thumbnail Image URL</label>
                  <input
                    type="url"
                    name="thumbnail_image"
                    value={formData.thumbnail_image}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-900">Feature on home page</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-900">Active</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  {selectedContent ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Content List */}
        {!showForm && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : marketingContents.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No marketing content yet</p>
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  <Plus className="w-4 h-4" />
                  Create First Content
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketingContents.map((content) => (
                  <div key={content.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">{content.title}</h3>
                        {content.product && (
                          <p className="text-xs text-gray-600 mt-1">Product: {content.product.name}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {content.is_featured && (
                          <span className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded">Featured</span>
                        )}
                        {content.is_active && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>

                    {content.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{content.description}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(content)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowConfirmDelete(content.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          isOpen={showConfirmDelete !== null}
          title="Delete Content"
          message="Are you sure you want to delete this marketing content? This action cannot be undone."
          onConfirm={() => {
            if (showConfirmDelete) handleDelete(showConfirmDelete);
          }}
          onCancel={() => setShowConfirmDelete(null)}
          isDangerous
        />
      </div>
    </AdminLayout>
  );
};

export default AdminMarketing;
