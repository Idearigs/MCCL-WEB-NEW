import React, { useState, useEffect } from 'react';
import { Trash2, Edit, AlertCircle, CheckCircle, Star, Eye, EyeOff } from 'lucide-react';
import API_BASE_URL from '../../config/api';
import ConfirmDialog from '../../components/ui/confirm-dialog';
import AdminLayout from '../components/AdminLayout';

interface Review {
  id: string;
  author_name: string;
  location?: string;
  category?: string;
  rating: number;
  body: string;
  email?: string;
  source: 'admin' | 'visitor';
  status: 'pending' | 'published' | 'hidden';
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
}

type Filter = 'all' | 'pending' | 'published' | 'hidden';

const EMPTY = {
  author_name: '',
  location: '',
  category: '',
  rating: 5,
  body: '',
  status: 'published' as Review['status'],
  is_featured: false,
  sort_order: 0,
};

export default function AdminReviews(): JSX.Element {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const token = () => localStorage.getItem('admin_token');
  const authHeaders = () => (token() ? { Authorization: `Bearer ${token()}` } : {});

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/reviews/all`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setReviews(data.data.reviews);
    } catch (e) {
      console.error('Error fetching reviews:', e);
      setAlert({ type: 'error', message: 'Failed to fetch reviews' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ ...EMPTY });
  };

  const handleEdit = (r: Review) => {
    setEditingId(r.id);
    setFormData({
      author_name: r.author_name,
      location: r.location || '',
      category: r.category || '',
      rating: r.rating,
      body: r.body,
      status: r.status,
      is_featured: r.is_featured,
      sort_order: r.sort_order,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.author_name.trim() || !formData.body.trim()) {
      setAlert({ type: 'error', message: 'Author name and review text are required' });
      return;
    }
    try {
      const url = editingId ? `${API_BASE_URL}/reviews/${editingId}` : `${API_BASE_URL}/reviews/admin`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ ...formData, rating: parseInt(String(formData.rating), 10), sort_order: parseInt(String(formData.sort_order), 10) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: editingId ? 'Review updated' : 'Review created' });
        resetForm();
        fetchReviews();
      } else {
        setAlert({ type: 'error', message: data.message || 'Failed to save review' });
      }
    } catch (e) {
      console.error('Error saving review:', e);
      setAlert({ type: 'error', message: 'Failed to save review' });
    }
  };

  // Quick moderation — patch a single field without opening the form.
  const patch = async (id: string, updates: Partial<Review>) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) fetchReviews();
      else setAlert({ type: 'error', message: data.message || 'Update failed' });
    } catch (e) {
      console.error('Error updating review:', e);
      setAlert({ type: 'error', message: 'Update failed' });
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${confirmDialog.id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: 'Review deleted' });
        fetchReviews();
      } else {
        setAlert({ type: 'error', message: 'Failed to delete review' });
      }
    } catch (e) {
      console.error('Error deleting review:', e);
      setAlert({ type: 'error', message: 'Failed to delete review' });
    } finally {
      setConfirmDialog({ isOpen: false, id: null });
    }
  };

  const visible = reviews.filter((r) => (filter === 'all' ? true : r.status === filter));
  const pendingCount = reviews.filter((r) => r.status === 'pending').length;

  const statusBadge = (s: Review['status']) => {
    const map: Record<Review['status'], string> = {
      published: 'bg-green-100 text-green-800',
      pending: 'bg-amber-100 text-amber-800',
      hidden: 'bg-gray-200 text-gray-600',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s]}`}>{s}</span>;
  };

  // Source label — shown ONLY in the admin panel, never on the storefront.
  const sourceBadge = (src: Review['source']) =>
    src === 'visitor' ? (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Visitor review</span>
    ) : (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">Admin added</span>
    );

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          {pendingCount > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">
              {pendingCount} awaiting approval
            </span>
          )}
        </div>

        {alert && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${alert.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {alert.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            <p className={`flex-1 ${alert.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{alert.message}</p>
            <button onClick={() => setAlert(null)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{editingId ? 'Edit Review' : 'Add a Review'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author name *</label>
                <input type="text" name="author_name" value={formData.author_name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="e.g., Hannah W." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="e.g., Nottingham" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category (optional)</label>
                <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="e.g., Bespoke, Engagement, Servicing" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <select name="rating" value={formData.rating} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900">
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Review text *</label>
                <textarea name="body" value={formData.body} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="What the customer said…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option value="published">Published</option>
                  <option value="pending">Pending</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort order</label>
                <input type="number" name="sort_order" value={formData.sort_order} onChange={handleInputChange} min="0" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 mt-6">
                  <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleInputChange} className="w-4 h-4 border-gray-300 rounded" />
                  <span className="text-sm font-medium text-gray-700">Feature on homepage (“What clients say”)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors">{editingId ? 'Update Review' : 'Add Review'}</button>
              {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-300 text-gray-900 rounded-md hover:bg-gray-400 transition-colors">Cancel</button>}
            </div>
          </form>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'pending', 'published', 'hidden'] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
              {f}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Reviews</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No reviews{filter !== 'all' ? ` with status “${filter}”` : ' yet'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Review</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Source</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Featured</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {visible.map((r) => (
                    <tr key={r.id} className={`hover:bg-gray-50 ${r.status === 'pending' ? 'bg-amber-50/50' : ''}`}>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-md">
                        <div className="font-medium">{r.author_name}{r.category ? <span className="text-gray-400 font-normal"> · {r.category}</span> : ''}</div>
                        <div className="text-gray-600 line-clamp-2">{r.body}</div>
                        {r.email && <div className="text-xs text-gray-400 mt-1">{r.email}</div>}
                      </td>
                      <td className="px-4 py-4 text-sm text-amber-500 whitespace-nowrap">{'★'.repeat(r.rating)}<span className="text-gray-300">{'★'.repeat(5 - r.rating)}</span></td>
                      <td className="px-4 py-4 text-sm">{sourceBadge(r.source)}</td>
                      <td className="px-4 py-4 text-sm">{statusBadge(r.status)}</td>
                      <td className="px-4 py-4 text-sm">
                        <button onClick={() => patch(r.id, { is_featured: !r.is_featured })} title="Toggle homepage feature" className={r.is_featured ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}>
                          <Star className="w-5 h-5" fill={r.is_featured ? 'currentColor' : 'none'} />
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right text-sm whitespace-nowrap">
                        {r.status !== 'published' && (
                          <button onClick={() => patch(r.id, { status: 'published' })} className="inline-flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Approve / publish">
                            <Eye className="w-4 h-4" />Publish
                          </button>
                        )}
                        {r.status === 'published' && (
                          <button onClick={() => patch(r.id, { status: 'hidden' })} className="inline-flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Hide from site">
                            <EyeOff className="w-4 h-4" />Hide
                          </button>
                        )}
                        <button onClick={() => handleEdit(r)} className="inline-flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors ml-1"><Edit className="w-4 h-4" />Edit</button>
                        <button onClick={() => setConfirmDialog({ isOpen: true, id: r.id })} className="inline-flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors ml-1"><Trash2 className="w-4 h-4" />Delete</button>
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
            title="Delete Review"
            message="Are you sure you want to delete this review? This cannot be undone."
            onConfirm={handleDelete}
            onCancel={() => setConfirmDialog({ isOpen: false, id: null })}
          />
        )}
      </div>
    </AdminLayout>
  );
}
