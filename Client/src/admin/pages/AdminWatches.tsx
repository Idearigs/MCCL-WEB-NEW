import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Watch as WatchIcon,
  Search,
  Filter,
  ChevronDown,
  Image,
  Settings,
  Building2,
  FolderOpen,
  Star,
  ArrowLeft
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import API_BASE_URL from '../../config/api';

interface WatchBrand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url?: string;
  collections_count: number;
  watches_count: number;
  is_active: boolean;
}

interface WatchCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  is_featured: boolean;
  is_active: boolean;
  launch_year?: number;
  target_audience: string;
  watches_count: number;
}

interface Watch {
  id: string;
  name: string;
  slug: string;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
  collection?: {
    id: string;
    name: string;
    slug: string;
  };
  price: string;
  base_price: number;
  sale_price?: number;
  currency: string;
  gender: string;
  watch_type: string;
  style: string;
  is_featured: boolean;
  in_stock: boolean;
  stock_quantity: number;
  image?: {
    url: string;
    alt: string;
  };
  specifications?: {
    movement?: string;
    case_material?: string;
    case_diameter?: string;
    water_resistance?: string;
  };
  created_at: string;
}

const AdminWatches: React.FC = () => {
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'brands' | 'collections' | 'watches'>('brands');
  const [selectedBrandForCollections, setSelectedBrandForCollections] = useState<WatchBrand | null>(null);
  const [brands, setBrands] = useState<WatchBrand[]>([]);
  const [collections, setCollections] = useState<WatchCollection[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<WatchBrand | null>(null);
  const [editingCollection, setEditingCollection] = useState<WatchCollection | null>(null);
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'brand' | 'collection' | 'watch'; id: string; name: string } | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [brandForm, setBrandForm] = useState({
    name: '',
    description: '',
    logo_url: '',
    website_url: '',
    founded_year: '',
    country_origin: ''
  });

  const [collectionForm, setCollectionForm] = useState({
    name: '',
    description: '',
    brand_id: '',
    image_url: '',
    season: '',
    year: ''
  });

  const [watchForm, setWatchForm] = useState({
    brand_id: '',
    collection_id: '',
    name: '',
    model_number: '',
    description: '',
    short_description: '',
    base_price: '',
    sale_price: '',
    sku: '',
    gender: 'unisex',
    watch_type: 'analog',
    style: 'casual',
    warranty_years: '2',
    care_instructions: '',
    stock_quantity: '0'
  });

  const fetchBrands = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/watches/brands`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setBrands(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
      setAlert({ type: 'error', message: 'Failed to fetch brands' });
      setBrands([]);
    }
  };

  const fetchCollections = async (brandId?: string) => {
    try {
      if (!brandId) {
        setCollections([]);
        return;
      }

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/watches/brands/${brandId}/collections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setCollections(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setAlert({ type: 'error', message: 'Failed to fetch collections' });
    }
  };

  const fetchWatches = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBrand) params.append('brand', selectedBrand);
      if (searchTerm) params.append('search', searchTerm);

      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/watches/watches?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setWatches(data.data.watches);
      }
    } catch (error) {
      console.error('Error fetching watches:', error);
      setAlert({ type: 'error', message: 'Failed to fetch watches' });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBrands();
      if (activeTab === 'collections') {
        await fetchCollections(selectedBrandForCollections?.id);
      } else if (activeTab === 'watches') {
        await fetchWatches();
      }
      setLoading(false);
    };

    loadData();
  }, [activeTab, selectedBrand, searchTerm, selectedBrandForCollections]);

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(import.meta.env.VITE_API_URL || `${API_BASE_URL}/admin/watches/brands`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...brandForm,
          founded_year: brandForm.founded_year ? parseInt(brandForm.founded_year) : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', message: 'Brand created successfully' });
        setShowBrandModal(false);
        setBrandForm({ name: '', description: '', logo_url: '', website_url: '', founded_year: '', country_origin: '' });
        fetchBrands();
      } else {
        setAlert({ type: 'error', message: data.message || 'Failed to create brand' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to create brand' });
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(import.meta.env.VITE_API_URL || `${API_BASE_URL}/admin/watches/collections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...collectionForm,
          year: collectionForm.year ? parseInt(collectionForm.year) : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', message: 'Collection created successfully' });
        setShowCollectionModal(false);
        setCollectionForm({ name: '', description: '', brand_id: '', image_url: '', season: '', year: '' });
        fetchCollections(selectedBrandForCollections?.id);
      } else {
        setAlert({ type: 'error', message: data.message || 'Failed to create collection' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to create collection' });
    }
  };

  const handleCreateWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(import.meta.env.VITE_API_URL || `${API_BASE_URL}/admin/watches/watches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...watchForm,
          base_price: parseFloat(watchForm.base_price),
          sale_price: watchForm.sale_price ? parseFloat(watchForm.sale_price) : null,
          warranty_years: parseInt(watchForm.warranty_years),
          stock_quantity: parseInt(watchForm.stock_quantity)
        })
      });

      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', message: 'Watch created successfully' });
        setShowWatchModal(false);
        setWatchForm({
          brand_id: '', collection_id: '', name: '', model_number: '', description: '',
          short_description: '', base_price: '', sale_price: '', sku: '', gender: 'unisex',
          watch_type: 'analog', style: 'casual', warranty_years: '2', care_instructions: '', stock_quantity: '0'
        });
        fetchWatches();
      } else {
        setAlert({ type: 'error', message: data.message || 'Failed to create watch' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to create watch' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      let endpoint = '';
      if (deleteConfirm.type === 'brand') {
        endpoint = `${API_BASE_URL}/admin/watches/brands/${deleteConfirm.id}`;
      } else if (deleteConfirm.type === 'collection') {
        endpoint = `${API_BASE_URL}/admin/watches/collections/${deleteConfirm.id}`;
      } else {
        endpoint = `${API_BASE_URL}/admin/watches/watches/${deleteConfirm.id}`;
      }

      const token = localStorage.getItem('admin_token');
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setAlert({ type: 'success', message: `${deleteConfirm.type} deleted successfully` });
        setDeleteConfirm(null);

        if (deleteConfirm.type === 'brand') {
          fetchBrands();
        } else if (deleteConfirm.type === 'collection') {
          fetchCollections(selectedBrandForCollections?.id);
        } else {
          fetchWatches();
        }
      } else {
        setAlert({ type: 'error', message: data.message || `Failed to delete ${deleteConfirm.type}` });
      }
    } catch (error) {
      setAlert({ type: 'error', message: `Failed to delete ${deleteConfirm.type}` });
    }
  };

  const filteredBrands = (brands || []).filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCollections = (collections || []).filter(collection =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewCollections = (brand: WatchBrand) => {
    setSelectedBrandForCollections(brand);
    setActiveTab('collections');
  };

  const handleBackToBrands = () => {
    setSelectedBrandForCollections(null);
    setActiveTab('brands');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            {selectedBrandForCollections && (
              <button
                onClick={handleBackToBrands}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 font-cormorant">
              {selectedBrandForCollections ? `${selectedBrandForCollections.name} Collections` : 'Watches'}
            </h1>
          </div>
          <p className="text-gray-600 font-satoshi">
            {selectedBrandForCollections
              ? `Manage collections for ${selectedBrandForCollections.name}`
              : 'Manage your watch collection and brands'
            }
          </p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'brands') {
              setEditingBrand(null);
              setBrandForm({ name: '', description: '', logo_url: '', website_url: '', founded_year: '', country_origin: '' });
              setShowBrandModal(true);
            } else if (activeTab === 'collections') {
              setEditingCollection(null);
              setCollectionForm({
                name: '',
                description: '',
                brand_id: selectedBrandForCollections?.id || '',
                image_url: '',
                season: '',
                year: ''
              });
              setShowCollectionModal(true);
            } else {
              setEditingWatch(null);
              setWatchForm({
                brand_id: '', collection_id: '', name: '', model_number: '', description: '',
                short_description: '', base_price: '', sale_price: '', sku: '', gender: 'unisex',
                watch_type: 'analog', style: 'casual', warranty_years: '2', care_instructions: '', stock_quantity: '0'
              });
              setShowWatchModal(true);
            }
          }}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2 font-satoshi"
        >
          <Plus className="w-4 h-4" />
          <span>Add {activeTab === 'brands' ? 'Brand' : activeTab === 'collections' ? 'Collection' : 'Watch'}</span>
        </button>
      </div>

      {/* Tabs */}
      {!selectedBrandForCollections && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('brands')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-satoshi ${
                activeTab === 'brands'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Brands ({brands.length})
            </button>
            <button
              onClick={() => setActiveTab('watches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors font-satoshi ${
                activeTab === 'watches'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <WatchIcon className="w-4 h-4 inline mr-2" />
              Watches ({watches.length})
            </button>
          </nav>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi w-80"
            />
          </div>

          {activeTab === 'watches' && (
            <>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.slug}>{brand.name}</option>
                ))}
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi">
                <option value="">All {activeTab === 'brands' ? 'Brands' : 'Watches'}</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'brands' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Collections
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Watches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 rounded-lg object-cover mr-3" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          <Building2 className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-satoshi">{brand.name}</div>
                        <div className="text-sm text-gray-500 font-satoshi">{brand.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-satoshi">
                    <button
                      onClick={() => handleViewCollections(brand)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {brand.collections_count} collections
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-satoshi">
                    {brand.watches_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-satoshi ${
                      brand.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingBrand(brand);
                          setBrandForm({
                            name: brand.name,
                            description: brand.description || '',
                            logo_url: brand.logo_url || '',
                            website_url: '',
                            founded_year: '',
                            country_origin: ''
                          });
                          setShowBrandModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'brand', id: brand.id, name: brand.name })}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'collections' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Watches
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                        <FolderOpen className="w-5 h-5 text-gray-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-satoshi">{collection.name}</div>
                        <div className="text-sm text-gray-500 font-satoshi">{collection.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-satoshi">
                    {selectedBrandForCollections?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-satoshi">
                    {collection.watches_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-satoshi ${
                        collection.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {collection.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {collection.is_featured && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 font-satoshi">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-satoshi">
                    {new Date(collection.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingCollection(collection);
                          setCollectionForm({
                            name: collection.name,
                            description: collection.description || '',
                            brand_id: collection.brand_id,
                            image_url: '',
                            season: '',
                            year: ''
                          });
                          setShowCollectionModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'collection', id: collection.id, name: collection.name })}
                        className="text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Watch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Brand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {watches.map((watch) => (
                <tr key={watch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {watch.image?.url ? (
                          <img
                            src={watch.image.url}
                            alt={watch.image.alt}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <WatchIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 font-satoshi">
                          {watch.name}
                        </div>
                        <div className="text-sm text-gray-500 font-satoshi">
                          SKU: {watch.sku || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-satoshi">{watch.brand.name}</div>
                    {watch.collection && (
                      <div className="text-sm text-gray-500 font-satoshi">{watch.collection.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-satoshi">
                      {watch.price}
                    </div>
                    {watch.sale_price && (
                      <div className="text-sm text-gray-500 line-through font-satoshi">
                        £{watch.base_price.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-satoshi">
                    {watch.stock_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-satoshi ${
                      watch.in_stock
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {watch.in_stock ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-satoshi">
                    Invalid Date
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          // View watch details
                        }}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Add to favorites
                        }}
                        className="text-gray-600 hover:text-yellow-500 transition-colors"
                        title="Favorite"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          // View watch info
                        }}
                        className="text-gray-600 hover:text-blue-500 transition-colors"
                        title="Info"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                          setEditingWatch(watch);
                          setWatchForm({
                            brand_id: watch.brand.id,
                            collection_id: watch.collection?.id || '',
                            name: watch.name,
                            model_number: '',
                            description: '',
                            short_description: '',
                            base_price: watch.base_price.toString(),
                            sale_price: watch.sale_price?.toString() || '',
                            sku: '',
                            gender: watch.gender,
                            watch_type: watch.watch_type,
                            style: watch.style,
                            warranty_years: '2',
                            care_instructions: '',
                            stock_quantity: watch.stock_quantity.toString()
                          });
                          setShowWatchModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'watch', id: watch.id, name: watch.name })}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Brand Modal */}
      <Modal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        title={editingBrand ? 'Edit Brand' : 'Add New Brand'}
      >
        <form onSubmit={handleCreateBrand} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Brand Name</label>
            <input
              type="text"
              value={brandForm.name}
              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Description</label>
            <textarea
              value={brandForm.description}
              onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Logo URL</label>
            <input
              type="url"
              value={brandForm.logo_url}
              onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Founded Year</label>
              <input
                type="number"
                value={brandForm.founded_year}
                onChange={(e) => setBrandForm({ ...brandForm, founded_year: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Country</label>
              <input
                type="text"
                value={brandForm.country_origin}
                onChange={(e) => setBrandForm({ ...brandForm, country_origin: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowBrandModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-satoshi"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-satoshi"
            >
              {editingBrand ? 'Update' : 'Create'} Brand
            </button>
          </div>
        </form>
      </Modal>

      {/* Collection Modal */}
      <Modal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        title={editingCollection ? 'Edit Collection' : 'Add New Collection'}
      >
        <form onSubmit={handleCreateCollection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Collection Name</label>
            <input
              type="text"
              value={collectionForm.name}
              onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Brand</label>
            <select
              value={collectionForm.brand_id}
              onChange={(e) => setCollectionForm({ ...collectionForm, brand_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              required
              disabled={!!selectedBrandForCollections}
            >
              <option value="">Select Brand</option>
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Description</label>
            <textarea
              value={collectionForm.description}
              onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Season</label>
              <select
                value={collectionForm.season}
                onChange={(e) => setCollectionForm({ ...collectionForm, season: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="">Select Season</option>
                <option value="spring">Spring</option>
                <option value="summer">Summer</option>
                <option value="autumn">Autumn</option>
                <option value="winter">Winter</option>
                <option value="all-season">All Season</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Year</label>
              <input
                type="number"
                value={collectionForm.year}
                onChange={(e) => setCollectionForm({ ...collectionForm, year: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                min="1900"
                max="2030"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Image URL</label>
            <input
              type="url"
              value={collectionForm.image_url}
              onChange={(e) => setCollectionForm({ ...collectionForm, image_url: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCollectionModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-satoshi"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-satoshi"
            >
              {editingCollection ? 'Update' : 'Create'} Collection
            </button>
          </div>
        </form>
      </Modal>

      {/* Watch Modal */}
      <Modal
        isOpen={showWatchModal}
        onClose={() => setShowWatchModal(false)}
        title={editingWatch ? 'Edit Watch' : 'Add New Watch'}
      >
        <form onSubmit={handleCreateWatch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Brand</label>
              <select
                value={watchForm.brand_id}
                onChange={(e) => setWatchForm({ ...watchForm, brand_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                required
              >
                <option value="">Select Brand</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Watch Name</label>
              <input
                type="text"
                value={watchForm.name}
                onChange={(e) => setWatchForm({ ...watchForm, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Base Price (£)</label>
              <input
                type="number"
                step="0.01"
                value={watchForm.base_price}
                onChange={(e) => setWatchForm({ ...watchForm, base_price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Sale Price (£)</label>
              <input
                type="number"
                step="0.01"
                value={watchForm.sale_price}
                onChange={(e) => setWatchForm({ ...watchForm, sale_price: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Stock Quantity</label>
              <input
                type="number"
                value={watchForm.stock_quantity}
                onChange={(e) => setWatchForm({ ...watchForm, stock_quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Gender</label>
              <select
                value={watchForm.gender}
                onChange={(e) => setWatchForm({ ...watchForm, gender: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="unisex">Unisex</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="children">Children</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Type</label>
              <select
                value={watchForm.watch_type}
                onChange={(e) => setWatchForm({ ...watchForm, watch_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="analog">Analog</option>
                <option value="digital">Digital</option>
                <option value="hybrid">Hybrid</option>
                <option value="smart">Smart</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Style</label>
              <select
                value={watchForm.style}
                onChange={(e) => setWatchForm({ ...watchForm, style: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="casual">Casual</option>
                <option value="dress">Dress</option>
                <option value="sport">Sport</option>
                <option value="luxury">Luxury</option>
                <option value="diving">Diving</option>
                <option value="aviation">Aviation</option>
                <option value="military">Military</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Description</label>
            <textarea
              value={watchForm.description}
              onChange={(e) => setWatchForm({ ...watchForm, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowWatchModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-satoshi"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-satoshi"
            >
              {editingWatch ? 'Update' : 'Create'} Watch
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title={`Delete ${deleteConfirm?.type}`}
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        destructive
      />

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminWatches;