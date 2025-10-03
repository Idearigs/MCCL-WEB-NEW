import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Search, Plus, Edit, Trash2, Eye, Filter, Package, Gem, Palette, Star } from 'lucide-react';
import CategoryFormModal from '../components/CategoryFormModal';
import AdminLayout from '../components/AdminLayout';
import ToastContainer from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { LoadingState } from '../components/LoadingSpinner';
import API_BASE_URL from '../../config/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface RingType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

interface Gemstone {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  hardness?: number;
  price_per_carat?: number;
  is_active: boolean;
  sort_order: number;
}

interface ProductMetal {
  id: string;
  name: string;
  color_code: string;
  price_multiplier: number;
  is_active: boolean;
  sort_order: number;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

type CategoryType = 'categories' | 'ringTypes' | 'gemstones' | 'metals' | 'collections';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [ringTypes, setRingTypes] = useState<RingType[]>([]);
  const [gemstones, setGemstones] = useState<Gemstone[]>([]);
  const [metals, setMetals] = useState<ProductMetal[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<CategoryType>('categories');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Bulk selection states
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Toast notifications
  const { toasts, showToast, removeToast } = useToast();

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAdminAuth();

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthLoading, isAuthenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [categoriesRes, ringTypesRes, gemstonesRes, metalsRes, collectionsRes] = await Promise.all([
        fetch(import.meta.env.VITE_API_URL || `${API_BASE_URL}/admin/categories`, { 
          headers: new Headers(headers) 
        }),
        fetch(import.meta.env.VITE_API_URL || `${API_BASE_URL}/admin/categories/ring-types`, { 
          headers: new Headers(headers) 
        }),
        fetch(import.meta.env.VITE_API_URL || `${API_BASE_URL}/admin/categories/gemstones`, { 
          headers: new Headers(headers) 
        }),
        fetch(import.meta.env.VITE_API_URL || `${API_BASE_URL}/admin/categories/metals`, { 
          headers: new Headers(headers) 
        }),
        fetch(import.meta.env.VITE_API_URL || `${API_BASE_URL}/admin/categories/collections`, { 
          headers: new Headers(headers) 
        })
      ]);

      if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
      if (!ringTypesRes.ok) throw new Error('Failed to fetch ring types');
      if (!gemstonesRes.ok) throw new Error('Failed to fetch gemstones');
      if (!metalsRes.ok) throw new Error('Failed to fetch metals');
      if (!collectionsRes.ok) throw new Error('Failed to fetch collections');

      setCategories(await categoriesRes.json());
      setRingTypes(await ringTypesRes.json());
      setGemstones(await gemstonesRes.json());
      setMetals(await metalsRes.json());
      setCollections(await collectionsRes.json());

    } catch (error) {
      console.error('Error fetching data:', error);

      // Enhanced error logging to diagnose the issue
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        // This block will execute for the specific error we're seeing
        try {
          const response = (error as any).response as Response;
          if (response) {
            const errorBody = await response.text();
            console.error(`Response Status: ${response.status} ${response.statusText}`);
            console.error('Response Body:', errorBody);
            showAlert('error', `API Error: ${response.status} - Check console for details.`);
          } else {
            showAlert('error', 'Failed to fetch data. The server may be down or a CORS issue might be present.');
          }
        } catch (e) {
          console.error('Could not parse error response:', e);
          showAlert('error', 'An unexpected error occurred. Check the console.');
        }
      } else {
        showAlert('error', 'Failed to fetch data. Please check your connection and try again.');
      }

    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    showToast(type, message);
  };

  const handleCreate = (type: CategoryType) => {
    setModalMode('create');
    setSelectedItem(null);
    setActiveTab(type);
    setShowModal(true);
  };

  const handleEdit = (item: any, type: CategoryType) => {
    setModalMode('edit');
    setSelectedItem(item);
    setActiveTab(type);
    setShowModal(true);
  };

  const handleView = (item: any, type: CategoryType) => {
    setModalMode('view');
    setSelectedItem(item);
    setActiveTab(type);
    setShowModal(true);
  };

  const handleDelete = (item: any, type: CategoryType) => {
    setItemToDelete({ id: item.id, name: item.name, type });
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const token = localStorage.getItem('admin_token');
      const endpoints = {
        categories: `categories/${itemToDelete.id}`,
        ringTypes: `categories/ring-types/${itemToDelete.id}`,
        gemstones: `categories/gemstones/${itemToDelete.id}`,
        metals: `categories/metals/${itemToDelete.id}`,
        collections: `categories/collections/${itemToDelete.id}`
      };

      const endpointPath = endpoints[itemToDelete.type as keyof typeof endpoints];

      if (!endpointPath) {
        showAlert('error', 'Invalid category type for deletion.');
        setShowConfirmDialog(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/${endpointPath}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showAlert('success', `${itemToDelete.name} deleted successfully`);

        // Update state immediately without refetching all data
        const typeKey = itemToDelete.type;
        if (typeKey === 'categories') {
          setCategories(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (typeKey === 'ringTypes') {
          setRingTypes(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (typeKey === 'gemstones') {
          setGemstones(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (typeKey === 'metals') {
          setMetals(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (typeKey === 'collections') {
          setCollections(prev => prev.filter(item => item.id !== itemToDelete.id));
        }
      } else {
        showAlert('error', 'Failed to delete item');
      }
    } catch (error) {
      showAlert('error', 'Error deleting item');
    }

    setShowConfirmDialog(false);
    setItemToDelete(null);
  };

  // Bulk selection handlers
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    const currentData = getCurrentData();
    const allIds = currentData.map((item: any) => item.id);

    if (selectedItems.length === allIds.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allIds);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return;
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      const token = localStorage.getItem('admin_token');
      const endpoints = {
        categories: 'categories',
        ringTypes: 'categories/ring-types',
        gemstones: 'categories/gemstones',
        metals: 'categories/metals',
        collections: 'categories/collections'
      };

      const endpointBase = endpoints[activeTab as keyof typeof endpoints];

      // Delete all selected items
      const deletePromises = selectedItems.map(itemId =>
        fetch(`${API_BASE_URL}/admin/${endpointBase}/${itemId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(response => response.ok).length;

      if (successCount > 0) {
        // Update state immediately by removing deleted items
        if (activeTab === 'categories') {
          setCategories(prev => prev.filter(item => !selectedItems.includes(item.id)));
        } else if (activeTab === 'ringTypes') {
          setRingTypes(prev => prev.filter(item => !selectedItems.includes(item.id)));
        } else if (activeTab === 'gemstones') {
          setGemstones(prev => prev.filter(item => !selectedItems.includes(item.id)));
        } else if (activeTab === 'metals') {
          setMetals(prev => prev.filter(item => !selectedItems.includes(item.id)));
        } else if (activeTab === 'collections') {
          setCollections(prev => prev.filter(item => !selectedItems.includes(item.id)));
        }

        showAlert('success', `Successfully deleted ${successCount} item${successCount > 1 ? 's' : ''}`);
        setSelectedItems([]);
      }

      if (successCount < selectedItems.length) {
        showAlert('error', `Failed to delete ${selectedItems.length - successCount} item(s)`);
      }
    } catch (error) {
      showAlert('error', 'Error deleting items');
    }

    setShowBulkDeleteDialog(false);
  };

  // Clear selections when tab changes
  const handleTabChange = (tab: CategoryType) => {
    setActiveTab(tab);
    setSelectedItems([]);
  };

  // Get current data based on active tab
  const getCurrentData = () => {
    const dataMap = {
      categories,
      ringTypes,
      gemstones,
      metals,
      collections
    };

    let data: (Category | RingType | Gemstone | ProductMetal | Collection)[] = dataMap[activeTab];

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      data = data.filter(item => {
        if (filterStatus === 'active') return item.is_active;
        if (filterStatus === 'inactive') return !item.is_active;
        return true;
      });
    }

    return data;
  };

  const tabs = [
    { key: 'categories' as CategoryType, label: 'Categories', icon: Package, count: categories.length },
    { key: 'ringTypes' as CategoryType, label: 'Ring Types', icon: Star, count: ringTypes.length },
    { key: 'gemstones' as CategoryType, label: 'Gemstones', icon: Gem, count: gemstones.length },
    { key: 'metals' as CategoryType, label: 'Metals', icon: Palette, count: metals.length },
    { key: 'collections' as CategoryType, label: 'Collections', icon: Package, count: collections.length }
  ];

  const getTabConfig = (type: CategoryType) => {
    const configs = {
      categories: { singular: 'Category', plural: 'Categories' },
      ringTypes: { singular: 'Ring Type', plural: 'Ring Types' },
      gemstones: { singular: 'Gemstone', plural: 'Gemstones' },
      metals: { singular: 'Metal', plural: 'Metals' },
      collections: { singular: 'Collection', plural: 'Collections' }
    };
    return configs[type];
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingState message="Loading categories..." size="lg" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-satoshi">Category Management</h1>
            <p className="text-gray-600">Manage categories, ring types, gemstones, and metals</p>
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={`Search ${getTabConfig(activeTab).plural.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{
                  selectedItems.length === 1
                    ? '1 item selected'
                    : `${selectedItems.length} items selected`
                }</span>
                <button
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center space-x-1 text-sm font-medium"
                >
                  <Trash2 size={14} />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}
            <button
              onClick={() => handleCreate(activeTab)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium"
            >
              <Plus size={16} />
              <span>Add {getTabConfig(activeTab).singular}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={getCurrentData().length > 0 && selectedItems.length === getCurrentData().length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  {(activeTab === 'categories' || activeTab === 'ringTypes' || activeTab === 'gemstones' || activeTab === 'collections') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                  )}
                  {activeTab === 'metals' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                  )}
                  {activeTab === 'gemstones' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                  )}
                  {activeTab === 'metals' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price Multiplier
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentData().length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="w-12 h-12 text-gray-300" />
                        <p>No {getTabConfig(activeTab).plural.toLowerCase()} found</p>
                        <button
                          onClick={() => handleCreate(activeTab)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Create your first {getTabConfig(activeTab).singular.toLowerCase()}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getCurrentData().map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap w-12">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => handleSelectItem(item.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </td>
                      {(activeTab === 'categories' || activeTab === 'ringTypes' || activeTab === 'gemstones' || activeTab === 'collections') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                            {item.slug}
                          </span>
                        </td>
                      )}
                      {activeTab === 'metals' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: item.color_code }}
                            ></div>
                            <span className="text-sm text-gray-900 font-mono">{item.color_code}</span>
                          </div>
                        </td>
                      )}
                      {activeTab === 'gemstones' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{item.color || '-'}</span>
                        </td>
                      )}
                      {activeTab === 'metals' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{item.price_multiplier}x</span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.sort_order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleView(item, activeTab)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEdit(item, activeTab)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item, activeTab)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category Form Modal */}
        <CategoryFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mode={modalMode}
          type={activeTab}
          item={selectedItem}
          onSuccess={(updatedItem) => {
            // Update state instantly without full data refetch
            if (modalMode === 'create') {
              if (activeTab === 'categories') {
                setCategories(prev => [...prev, updatedItem]);
              } else if (activeTab === 'ringTypes') {
                setRingTypes(prev => [...prev, updatedItem]);
              } else if (activeTab === 'gemstones') {
                setGemstones(prev => [...prev, updatedItem]);
              } else if (activeTab === 'metals') {
                setMetals(prev => [...prev, updatedItem]);
              } else if (activeTab === 'collections') {
                setCollections(prev => [...prev, updatedItem]);
              }
            } else {
              // Update existing item
              if (activeTab === 'categories') {
                setCategories(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
              } else if (activeTab === 'ringTypes') {
                setRingTypes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
              } else if (activeTab === 'gemstones') {
                setGemstones(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
              } else if (activeTab === 'metals') {
                setMetals(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
              } else if (activeTab === 'collections') {
                setCollections(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
              }
            }
            showAlert('success', `${modalMode === 'create' ? 'Created' : 'Updated'} successfully!`);
          }}
        />

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Dialog */}
        {showBulkDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Bulk Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete {selectedItems.length} selected {selectedItems.length === 1 ? 'item' : 'items'}? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowBulkDeleteDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;