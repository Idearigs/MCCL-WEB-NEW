import React, { useState, useEffect } from 'react';
import { Trash2, Edit, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import AdminLayout from '../components/AdminLayout';

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface Promotion {
  id: string;
  title: string;
  description?: string;
  discount_percentage?: number;
  banner_text?: string;
  banner_text_1?: string;
  banner_text_2?: string;
  banner_text_3?: string;
  banner_text_4?: string;
  banner_text_5?: string;
  image_url?: string;
  is_active: boolean;
  show_popup: boolean;
  show_banner: boolean;
  sort_order: number;
}

export default function AdminPromotions(): JSX.Element {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    product_id: '',
    discount_percentage: '',
    banner_text: '',
    banner_text_1: '',
    banner_text_2: '',
    banner_text_3: '',
    banner_text_4: '',
    banner_text_5: '',
    image_url: '',
    is_active: true,
    show_popup: true,
    show_banner: true,
    sort_order: 0
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    fetchPromotions();
    fetchProducts();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/promotions?active_only=false`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setPromotions(data.data.promotions);
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setAlert({ type: 'error', message: 'Failed to fetch promotions' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/products?limit=1000`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingId(promotion.id);
    setFormData({
      title: promotion.title,
      description: promotion.description || '',
      product_id: '',
      discount_percentage: promotion.discount_percentage?.toString() || '',
      banner_text: promotion.banner_text || '',
      banner_text_1: (promotion as any).banner_text_1 || '',
      banner_text_2: (promotion as any).banner_text_2 || '',
      banner_text_3: (promotion as any).banner_text_3 || '',
      banner_text_4: (promotion as any).banner_text_4 || '',
      banner_text_5: (promotion as any).banner_text_5 || '',
      image_url: promotion.image_url || '',
      is_active: promotion.is_active,
      show_popup: promotion.show_popup,
      show_banner: promotion.show_banner,
      sort_order: promotion.sort_order
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setAlert({ type: 'error', message: 'Title is required' });
      return;
    }

    try {
      const url = editingId
        ? `${API_BASE_URL}/promotions/${editingId}`
        : `${API_BASE_URL}/promotions`;

      const method = editingId ? 'PUT' : 'POST';
      const token = localStorage.getItem('admin_token');

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...formData,
          discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
          sort_order: parseInt(formData.sort_order.toString())
        })
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ type: 'success', message: editingId ? 'Promotion updated successfully' : 'Promotion created successfully' });
        setFormData({
          title: '',
          description: '',
          product_id: '',
          discount_percentage: '',
          banner_text: '',
          banner_text_1: '',
          banner_text_2: '',
          banner_text_3: '',
          banner_text_4: '',
          banner_text_5: '',
          image_url: '',
          is_active: true,
          show_popup: true,
          show_banner: true,
          sort_order: 0
        });
        setEditingId(null);
        fetchPromotions();
      } else {
        setAlert({ type: 'error', message: data.message || 'Failed to save promotion' });
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      setAlert({ type: 'error', message: 'Failed to save promotion' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.id) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/promotions/${confirmDialog.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ type: 'success', message: 'Promotion deleted successfully' });
        fetchPromotions();
      } else {
        setAlert({ type: 'error', message: 'Failed to delete promotion' });
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      setAlert({ type: 'error', message: 'Failed to delete promotion' });
    } finally {
      setConfirmDialog({ isOpen: false, id: null });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Promotions & Special Deals</h1>
      </div>

      {alert && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            alert.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {alert.message}
            </p>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {editingId ? 'Edit Promotion' : 'Create New Promotion'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g., Summer Sale 2024"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount %
              </label>
              <input
                type="number"
                name="discount_percentage"
                value={formData.discount_percentage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g., 30"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product (Optional)
              </label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Select a product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Banner Text Items (for marquee - enter 5 separate items)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item 1</label>
                  <input
                    type="text"
                    name="banner_text_1"
                    value={formData.banner_text_1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g., 50% OFF on Diamond Rings"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item 2</label>
                  <input
                    type="text"
                    name="banner_text_2"
                    value={formData.banner_text_2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g., FREE SHIPPING on Orders"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item 3</label>
                  <input
                    type="text"
                    name="banner_text_3"
                    value={formData.banner_text_3}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g., Exclusive Collection"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item 4</label>
                  <input
                    type="text"
                    name="banner_text_4"
                    value={formData.banner_text_4}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g., New Summer Collection"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item 5</label>
                  <input
                    type="text"
                    name="banner_text_5"
                    value={formData.banner_text_5}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g., Limited Time Offer"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Promotion details..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="show_popup"
                  checked={formData.show_popup}
                  onChange={handleInputChange}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Show in Popup</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="show_banner"
                  checked={formData.show_banner}
                  onChange={handleInputChange}
                  className="w-4 h-4 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Show in Banner</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              {editingId ? 'Update Promotion' : 'Create Promotion'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    title: '',
                    description: '',
                    product_id: '',
                    discount_percentage: '',
                    banner_text: '',
                    banner_text_1: '',
                    banner_text_2: '',
                    banner_text_3: '',
                    banner_text_4: '',
                    banner_text_5: '',
                    image_url: '',
                    is_active: true,
                    show_popup: true,
                    show_banner: true,
                    sort_order: 0
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Promotions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Promotions</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : promotions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No promotions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Discount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Popup</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Banner</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {promotions.map(promotion => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{promotion.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {promotion.discount_percentage}%
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={promotion.show_popup ? 'text-green-600' : 'text-gray-400'}>
                        {promotion.show_popup ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={promotion.show_banner ? 'text-green-600' : 'text-gray-400'}>
                        {promotion.show_banner ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={promotion.is_active ? 'text-green-600' : 'text-red-600'}>
                        {promotion.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => handleEdit(promotion)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ isOpen: true, id: promotion.id })}
                        className="inline-flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title="Delete Promotion"
          message="Are you sure you want to delete this promotion?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDialog({ isOpen: false, id: null })}
        />
      )}
      </div>
    </AdminLayout>
  );
}
