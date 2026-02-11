import React, { useState, useEffect, useCallback } from 'react';
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
  brand_id: string;
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
  model_number?: string;
  description?: string;
  short_description?: string;
  sku?: string;
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
  warranty_years?: number;
  care_instructions?: string;
  is_featured: boolean;
  in_stock: boolean;
  stock_quantity: number;
  image?: {
    url: string;
    alt: string;
  };
  images?: Array<{
    id: string;
    url: string;
    alt: string;
    is_primary?: boolean;
  }>;
  videos?: Array<{
    id: string;
    url: string;
    title?: string;
  }>;
  specifications?: {
    movement?: string;
    case_material?: string;
    case_diameter?: string;
    water_resistance?: string;
  };
  technical_specs?: Record<string, any>;
  created_at: string;
}

const AdminWatches: React.FC = () => {
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'brands' | 'collections' | 'watches'>('brands');
  const [selectedBrandForCollections, setSelectedBrandForCollections] = useState<WatchBrand | null>(null);
  const [brands, setBrands] = useState<WatchBrand[]>([]);
  const [collections, setCollections] = useState<WatchCollection[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [allCollections, setAllCollections] = useState<WatchCollection[]>([]);
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
    launch_year: '',
    target_audience: ''
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
    stock_quantity: '0',
    technical_specs: {} as any,
    images: [] as any[],
    videos: [] as any[]
  });

  const [filteredCollections, setFilteredCollections] = useState<WatchCollection[]>([]);
  const [bristonTab, setBristonTab] = useState<'movement' | 'case' | 'dial' | 'strap'>('movement');
  const [festinaTab, setFestinaTab] = useState<'case' | 'dial' | 'strap' | 'movement' | 'functions' | 'features'>('case');

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
      // Use timestamp parameter for cache-busting without problematic headers
      const url = `${API_BASE_URL}/admin/watches/brands/${brandId}/collections?t=${Date.now()}`;

      console.log(`[fetchCollections] Fetching collections for brand: ${brandId}`);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`[fetchCollections] Response status: ${response.status}`);

      if (!response.ok) {
        console.error(`[fetchCollections] HTTP error! status: ${response.status}`);
        setAlert({ type: 'error', message: `Failed to fetch collections: HTTP ${response.status}` });
        setCollections([]);
        return;
      }

      const data = await response.json();
      console.log(`[fetchCollections] Response data:`, data);

      if (data.success) {
        const collectionsData = data.data || [];
        setCollections(collectionsData);
        console.log(`[fetchCollections] Successfully fetched ${collectionsData.length} collections for brand ${brandId}`);
      } else {
        console.error(`[fetchCollections] API returned success: false. Message:`, data.message);
        setAlert({ type: 'error', message: data.message || 'Failed to fetch collections' });
        setCollections([]);
      }
    } catch (error) {
      console.error('[fetchCollections] Error:', error);
      setAlert({ type: 'error', message: 'Failed to fetch collections' });
      setCollections([]);
    }
  };

  // Fetch all collections for the watches filter dropdown
  const fetchAllCollections = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/watches/collections/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllCollections(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching all collections:', error);
    }
  };

  const fetchWatches = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBrand) params.append('brand', selectedBrand);
      if (selectedCollection) params.append('collection', selectedCollection);
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

  const fetchWatchDetails = async (watchId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      console.log(`[fetchWatchDetails] Fetching details for watch ID: ${watchId}`);

      const response = await fetch(`${API_BASE_URL}/watches/admin/${watchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`[fetchWatchDetails] Response status: ${response.status}`);

      if (!response.ok) {
        console.error(`[fetchWatchDetails] HTTP error! status: ${response.status}`);
        setAlert({ type: 'error', message: `Failed to fetch watch details: HTTP ${response.status}` });
        return null;
      }

      const data = await response.json();
      console.log(`[fetchWatchDetails] Response data:`, data);

      if (data.success) {
        console.log(`[fetchWatchDetails] Successfully fetched watch details`);
        return data.data;
      } else {
        console.error(`[fetchWatchDetails] API returned success: false`);
        setAlert({ type: 'error', message: data.message || 'Failed to fetch watch details' });
        return null;
      }
    } catch (error) {
      console.error('Error fetching watch details:', error);
      setAlert({ type: 'error', message: 'Failed to fetch watch details' });
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      // Only show loading indicator for subsequent fetches, not full page loader
      if (!initialLoading) {
        setLoading(true);
      }
      await fetchBrands();
      if (activeTab === 'collections') {
        await fetchCollections(selectedBrandForCollections?.id);
      } else if (activeTab === 'watches') {
        await fetchAllCollections(); // Fetch all collections for the filter dropdown
        await fetchWatches();
      }
      setLoading(false);
      setInitialLoading(false);
    };

    loadData();
  }, [activeTab, selectedBrand, selectedCollection, searchTerm, selectedBrandForCollections]);

  // Filter collections based on selected brand
  useEffect(() => {
    console.log(`[useEffect-1] watchForm.brand_id changed to: ${watchForm.brand_id}`);
    if (watchForm.brand_id) {
      // Fetch collections for this brand
      console.log(`[useEffect-1] Calling fetchCollections with brand_id: ${watchForm.brand_id}`);
      fetchCollections(watchForm.brand_id);
    } else {
      console.log(`[useEffect-1] No brand_id, clearing collections`);
      setFilteredCollections([]);
      setCollections([]);
    }
  }, [watchForm.brand_id]); // Only depend on brand_id to avoid infinite loops

  // Update filtered collections whenever collections change
  useEffect(() => {
    console.log(`[useEffect-2] collections or brand_id changed. brand_id: ${watchForm.brand_id}, collections count: ${collections.length}`);
    if (watchForm.brand_id && collections.length > 0) {
      // API already filters by brand_id, so we can use collections directly
      console.log(`[useEffect-2] Using ${collections.length} collections (already filtered by API)`);
      setFilteredCollections(collections);
    } else if (!watchForm.brand_id) {
      console.log(`[useEffect-2] No brand_id, clearing filtered collections`);
      setFilteredCollections([]);
    } else {
      console.log(`[useEffect-2] Collections empty, clearing filtered collections`);
      setFilteredCollections([]);
    }
  }, [collections, watchForm.brand_id]);

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/watches/brands`, {
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
      const isUpdate = !!editingCollection;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate
        ? `${API_BASE_URL}/admin/watches/collections/${editingCollection.id}`
        : `${API_BASE_URL}/admin/watches/collections`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...collectionForm,
          launch_year: collectionForm.launch_year ? parseInt(collectionForm.launch_year) : null
        })
      });

      const data = await response.json();
      if (data.success) {
        setAlert({ type: 'success', message: `Collection ${isUpdate ? 'updated' : 'created'} successfully` });
        setShowCollectionModal(false);
        setCollectionForm({ name: '', description: '', brand_id: '', image_url: '', launch_year: '', target_audience: '' });
        setEditingCollection(null);
        fetchCollections(selectedBrandForCollections?.id);
      } else {
        setAlert({ type: 'error', message: data.message || `Failed to ${isUpdate ? 'update' : 'create'} collection` });
      }
    } catch (error) {
      setAlert({ type: 'error', message: `Failed to ${editingCollection ? 'update' : 'create'} collection` });
    }
  };

  const handleCreateWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('admin_token');
      const isUpdate = !!editingWatch;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate
        ? `${API_BASE_URL}/admin/watches/watches/${editingWatch.id}`
        : `${API_BASE_URL}/admin/watches/watches`;

      // Validate required fields
      if (!watchForm.brand_id || !watchForm.name || !watchForm.base_price) {
        setAlert({ type: 'error', message: 'Please fill in all required fields: Brand, Name, and Base Price' });
        return;
      }

      // Separate file objects from the rest of the data
      const imagesData = watchForm.images.map(img => {
        // Check if it's a File object or an object containing a file (from file input)
        if (img instanceof File || img?.file instanceof File) {
          // For File objects, we'll upload separately
          return null;
        }
        // Only include images that have an ID (from API) and valid image_url
        if (!img?.id || (!img?.image_url && !img?.url)) {
          // Skip images without ID or URL (incomplete data)
          return null;
        }
        // For existing images from API, return as-is
        return {
          id: img.id,
          url: img.url || img.image_url,
          alt: img.alt || img.alt_text,
          is_primary: img.is_primary,
          image_type: img.image_type
        };
      }).filter(Boolean);

      const videosData = watchForm.videos.map(vid => {
        // Check if it's a File object or an object containing a file
        if (vid instanceof File || vid?.file instanceof File) {
          // For File objects, we'll upload separately
          return null;
        }
        // Only include videos that have an ID (from API) and valid URL
        if (!vid?.id || (!vid?.video_url && !vid?.url)) {
          // Skip videos without ID or URL (incomplete data)
          return null;
        }
        // For existing videos
        return {
          id: vid.id,
          url: vid.url || vid.video_url,
          title: vid.title,
          video_type: vid.video_type
        };
      }).filter(Boolean);

      // Safe parsing functions with fallbacks
      const safeParseFloat = (val: string, fallback: number = 0) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
      };

      const safeParseInt = (val: string, fallback: number = 0) => {
        const parsed = parseInt(val);
        return isNaN(parsed) ? fallback : parsed;
      };

      const requestBody = {
        brand_id: watchForm.brand_id,
        collection_id: watchForm.collection_id || null,
        name: watchForm.name,
        model_number: watchForm.model_number || null,
        description: watchForm.description || null,
        short_description: watchForm.short_description || null,
        base_price: safeParseFloat(watchForm.base_price),
        sale_price: watchForm.sale_price ? safeParseFloat(watchForm.sale_price) : null,
        sku: watchForm.sku || null,
        gender: watchForm.gender || 'unisex',
        watch_type: watchForm.watch_type || 'analog',
        style: watchForm.style || 'casual',
        warranty_years: safeParseInt(watchForm.warranty_years, 2),
        care_instructions: watchForm.care_instructions || null,
        stock_quantity: safeParseInt(watchForm.stock_quantity, 0),
        technical_specs: watchForm.technical_specs || {},
        images: imagesData,
        videos: videosData
      };

      console.log('[handleCreateWatch] Request method:', method);
      console.log('[handleCreateWatch] Request URL:', url);
      console.log('[handleCreateWatch] Request body:', requestBody);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[handleCreateWatch] Response status:', response.status);
      const data = await response.json();
      console.log('[handleCreateWatch] Response data:', data);

      if (data.success) {
        const watchId = data.data.id;

        // Upload new image files if any
        const newImageFiles = watchForm.images.filter(img => {
          // Check if it's a File object or an object containing a file
          return img instanceof File || img?.file instanceof File;
        });

        for (const imgObj of newImageFiles) {
          try {
            // Handle both direct File objects and objects with file property
            const fileToUpload = imgObj instanceof File ? imgObj : imgObj?.file;

            if (!fileToUpload) continue;

            const formData = new FormData();
            formData.append('image_url', fileToUpload);
            formData.append('alt_text', fileToUpload.name);
            formData.append('is_primary', 'false');

            await fetch(`${API_BASE_URL}/admin/watches/watches/${watchId}/images`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
          } catch (imgError) {
            console.error('Error uploading image:', imgError);
          }
        }

        // Upload new video files if any
        const newVideoFiles = watchForm.videos.filter(vid => {
          // Check if it's a File object or an object containing a file
          return vid instanceof File || vid?.file instanceof File;
        });

        for (const vidObj of newVideoFiles) {
          try {
            // Handle both direct File objects and objects with file property
            const fileToUpload = vidObj instanceof File ? vidObj : vidObj?.file;

            if (!fileToUpload) continue;

            const formData = new FormData();
            formData.append('video_url', fileToUpload);
            formData.append('title', fileToUpload.name);

            await fetch(`${API_BASE_URL}/admin/watches/watches/${watchId}/videos`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
          } catch (vidError) {
            console.error('Error uploading video:', vidError);
          }
        }

        setAlert({
          type: 'success',
          message: isUpdate ? 'Watch updated successfully' : 'Watch created successfully'
        });
        setShowWatchModal(false);
        setEditingWatch(null);
        setWatchForm({
          brand_id: '', collection_id: '', name: '', model_number: '', description: '',
          short_description: '', base_price: '', sale_price: '', sku: '', gender: 'unisex',
          watch_type: 'analog', style: 'casual', warranty_years: '2', care_instructions: '',
          stock_quantity: '0', technical_specs: {}, images: [], videos: []
        });
        fetchWatches();
      } else {
        setAlert({ type: 'error', message: data.message || `Failed to ${isUpdate ? 'update' : 'create'} watch` });
      }
    } catch (error) {
      console.error('Error:', error);
      setAlert({ type: 'error', message: `Failed to ${editingWatch ? 'update' : 'create'} watch` });
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

  const collectionsForDisplay = (collections || []).filter(collection =>
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

  // Only show full-page loader on initial load
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AdminLayout>
      {/* Subtle loading overlay for subsequent fetches */}
      {loading && (
        <div className="fixed top-16 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
          <LoadingSpinner size="sm" />
          <span className="text-sm text-gray-600">Loading...</span>
        </div>
      )}
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
                launch_year: '',
                target_audience: ''
              });
              setShowCollectionModal(true);
            } else {
              setEditingWatch(null);
              setWatchForm({
                brand_id: '', collection_id: '', name: '', model_number: '', description: '',
                short_description: '', base_price: '', sale_price: '', sku: '', gender: 'unisex',
                watch_type: 'analog', style: 'casual', warranty_years: '2', care_instructions: '',
                stock_quantity: '0', technical_specs: {}, images: [], videos: []
              });
              setBristonTab('movement');
              setFestinaTab('case');
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
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  setSelectedCollection(''); // Reset collection when brand changes
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.slug}>{brand.name}</option>
                ))}
              </select>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="">All Collections</option>
                {(selectedBrand
                  ? allCollections.filter(c => c.brand?.slug === selectedBrand)
                  : allCollections
                ).map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.brand?.name ? `${collection.brand.name} - ` : ''}{collection.name}
                  </option>
                ))}
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
              {collectionsForDisplay.map((collection) => (
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
                            image_url: collection.image_url || '',
                            launch_year: collection.launch_year?.toString() || '',
                            target_audience: collection.target_audience || ''
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
                        onClick={async () => {
                          // Fetch full watch details with all fields using the watch ID
                          const fullWatchDetails = await fetchWatchDetails(watch.id);
                          if (fullWatchDetails) {
                            setEditingWatch(fullWatchDetails);
                            setWatchForm({
                              brand_id: fullWatchDetails.brand.id,
                              collection_id: fullWatchDetails.collection?.id || '',
                              name: fullWatchDetails.name,
                              model_number: fullWatchDetails.model_number || '',
                              description: fullWatchDetails.description || '',
                              short_description: fullWatchDetails.short_description || '',
                              base_price: fullWatchDetails.base_price.toString(),
                              sale_price: fullWatchDetails.sale_price?.toString() || '',
                              sku: fullWatchDetails.sku || '',
                              gender: fullWatchDetails.gender,
                              watch_type: fullWatchDetails.watch_type,
                              style: fullWatchDetails.style,
                              warranty_years: fullWatchDetails.warranty_years?.toString() || '2',
                              care_instructions: fullWatchDetails.care_instructions || '',
                              stock_quantity: fullWatchDetails.stock_quantity.toString(),
                              technical_specs: fullWatchDetails.technical_specs || {},
                              images: fullWatchDetails.images || [],
                              videos: fullWatchDetails.videos || []
                            });
                            setBristonTab('movement');
                            setFestinaTab('case');
                            setShowWatchModal(true);
                          }
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
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Launch Year</label>
              <input
                type="number"
                value={collectionForm.launch_year}
                onChange={(e) => setCollectionForm({ ...collectionForm, launch_year: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                min="1900"
                max="2030"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Target Audience</label>
              <input
                type="text"
                value={collectionForm.target_audience}
                onChange={(e) => setCollectionForm({ ...collectionForm, target_audience: e.target.value })}
                placeholder="e.g., Professional, Sports, Casual"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
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
        size="2xl"
      >
        <form onSubmit={handleCreateWatch} className="space-y-6 max-h-screen overflow-y-auto">
          {/* Basic Info Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-satoshi">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Brand *</label>
                <select
                  value={watchForm.brand_id}
                  onChange={(e) => {
                    setWatchForm({ ...watchForm, brand_id: e.target.value, collection_id: '' });
                    // useEffect will handle fetching collections
                  }}
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
                <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Collection</label>
                <select
                  value={watchForm.collection_id}
                  onChange={(e) => setWatchForm({ ...watchForm, collection_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                  disabled={!watchForm.brand_id}
                >
                  <option value="">Select Collection (Optional)</option>
                  {filteredCollections.map(coll => (
                    <option key={coll.id} value={coll.id}>{coll.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Watch Name *</label>
                <input
                  type="text"
                  value={watchForm.name}
                  onChange={(e) => setWatchForm({ ...watchForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Model Number</label>
                <input
                  type="text"
                  value={watchForm.model_number}
                  onChange={(e) => setWatchForm({ ...watchForm, model_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">SKU</label>
              <input
                type="text"
                value={watchForm.sku}
                onChange={(e) => setWatchForm({ ...watchForm, sku: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Short Description</label>
              <input
                type="text"
                value={watchForm.short_description}
                onChange={(e) => setWatchForm({ ...watchForm, short_description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              />
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
          </div>

          {/* Pricing & Inventory Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-satoshi">Pricing & Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Base Price (£) *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Stock Quantity *</label>
                <input
                  type="number"
                  value={watchForm.stock_quantity}
                  onChange={(e) => setWatchForm({ ...watchForm, stock_quantity: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Warranty (Years)</label>
                <input
                  type="number"
                  value={watchForm.warranty_years}
                  onChange={(e) => setWatchForm({ ...watchForm, warranty_years: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                />
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-satoshi">Specifications</h3>
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

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Care Instructions</label>
              <textarea
                value={watchForm.care_instructions}
                onChange={(e) => setWatchForm({ ...watchForm, care_instructions: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                rows={2}
                placeholder="Enter care instructions for this watch..."
              />
            </div>
          </div>

          {/* Brand-Specific Technical Specs Section */}
          {watchForm.brand_id && (
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 font-satoshi">Technical Specifications</h3>
              <p className="text-sm text-gray-600 mb-4 font-satoshi">
                Add brand-specific technical details for this watch (optional)
              </p>

              {/* ROAMER Brand Specs */}
              {brands.find(b => b.id === watchForm.brand_id)?.name.toLowerCase().includes('roamer') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Water Resistance</label>
                    <input
                      type="text"
                      value={watchForm.technical_specs?.waterResistance || ''}
                      onChange={(e) => setWatchForm({
                        ...watchForm,
                        technical_specs: { ...watchForm.technical_specs, waterResistance: e.target.value }
                      })}
                      placeholder="e.g., 5 ATM (50m)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="antimagnetism"
                      checked={watchForm.technical_specs?.antimagneticProtection || false}
                      onChange={(e) => setWatchForm({
                        ...watchForm,
                        technical_specs: { ...watchForm.technical_specs, antimagneticProtection: e.target.checked }
                      })}
                      className="h-4 w-4 text-gray-900 border-gray-300 rounded"
                    />
                    <label htmlFor="antimagnetism" className="ml-2 text-sm font-medium text-gray-700 font-satoshi">
                      Antimagnetic Protection
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="shockResistance"
                      checked={watchForm.technical_specs?.shockResistance || false}
                      onChange={(e) => setWatchForm({
                        ...watchForm,
                        technical_specs: { ...watchForm.technical_specs, shockResistance: e.target.checked }
                      })}
                      className="h-4 w-4 text-gray-900 border-gray-300 rounded"
                    />
                    <label htmlFor="shockResistance" className="ml-2 text-sm font-medium text-gray-700 font-satoshi">
                      Shock Resistance
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="luminosity"
                      checked={watchForm.technical_specs?.luminosity || false}
                      onChange={(e) => setWatchForm({
                        ...watchForm,
                        technical_specs: { ...watchForm.technical_specs, luminosity: e.target.checked }
                      })}
                      className="h-4 w-4 text-gray-900 border-gray-300 rounded"
                    />
                    <label htmlFor="luminosity" className="ml-2 text-sm font-medium text-gray-700 font-satoshi">
                      Luminosity
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Movement Accuracy</label>
                    <input
                      type="text"
                      value={watchForm.technical_specs?.movementAccuracy || ''}
                      onChange={(e) => setWatchForm({
                        ...watchForm,
                        technical_specs: { ...watchForm.technical_specs, movementAccuracy: e.target.value }
                      })}
                      placeholder="e.g., ±15 seconds/month"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="skinCompatibility"
                      checked={watchForm.technical_specs?.skinCompatibility || false}
                      onChange={(e) => setWatchForm({
                        ...watchForm,
                        technical_specs: { ...watchForm.technical_specs, skinCompatibility: e.target.checked }
                      })}
                      className="h-4 w-4 text-gray-900 border-gray-300 rounded"
                    />
                    <label htmlFor="skinCompatibility" className="ml-2 text-sm font-medium text-gray-700 font-satoshi">
                      Skin Compatibility
                    </label>
                  </div>
                </div>
              )}

              {/* BRISTON Brand Specs - Tabbed */}
              {brands.find(b => b.id === watchForm.brand_id)?.name.toLowerCase().includes('briston') && (
                <div>
                  <div className="flex space-x-2 mb-4 border-b border-gray-200">
                    {(['movement', 'case', 'dial', 'strap'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setBristonTab(tab)}
                        className={`px-4 py-2 font-satoshi capitalize ${
                          bristonTab === tab
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab === 'dial' ? 'Dial & Hands' : tab}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {bristonTab === 'movement' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Quartz Calibre</label>
                          <input type="text" value={watchForm.technical_specs?.movement?.quartz_calibre || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, quartz_calibre: e.target.value}}})} placeholder="e.g., Miyota OS21" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Functions</label>
                          <input type="text" value={watchForm.technical_specs?.movement?.functions || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, functions: e.target.value}}})} placeholder="e.g., 2-counter Chronograph & Date" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">60-Minute Counter Position</label>
                          <input type="text" value={watchForm.technical_specs?.movement?.counter_60_position || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, counter_60_position: e.target.value}}})} placeholder="e.g., 9 o'clock" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">24-Hour Counter Position</label>
                          <input type="text" value={watchForm.technical_specs?.movement?.counter_24_position || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, counter_24_position: e.target.value}}})} placeholder="e.g., 3 o'clock" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Date Position</label>
                          <input type="text" value={watchForm.technical_specs?.movement?.date_position || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, date_position: e.target.value}}})} placeholder="e.g., 6 o'clock" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Power Reserve</label>
                          <input type="text" value={watchForm.technical_specs?.movement?.power_reserve || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, power_reserve: e.target.value}}})} placeholder="e.g., 3-5 years" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                      </>
                    )}

                    {bristonTab === 'case' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Material</label>
                          <input type="text" value={watchForm.technical_specs?.case?.material || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, material: e.target.value}}})} placeholder="e.g., Stainless Steel" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Thickness</label>
                          <input type="text" value={watchForm.technical_specs?.case?.thickness || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, thickness: e.target.value}}})} placeholder="e.g., 6.65 mm" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Shape</label>
                          <input type="text" value={watchForm.technical_specs?.case?.shape || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, shape: e.target.value}}})} placeholder="e.g., Round" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Diameter</label>
                          <input type="text" value={watchForm.technical_specs?.case?.diameter || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, diameter: e.target.value}}})} placeholder="e.g., 26 mm" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Weight</label>
                          <input type="text" value={watchForm.technical_specs?.case?.weight || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, weight: e.target.value}}})} placeholder="e.g., 46.32 g" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                      </>
                    )}

                    {bristonTab === 'dial' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Colour</label>
                          <input type="text" value={watchForm.technical_specs?.dial_and_hands?.colour || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, dial_and_hands: {...watchForm.technical_specs?.dial_and_hands, colour: e.target.value}}})} placeholder="e.g., Nacre" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Crystal</label>
                          <input type="text" value={watchForm.technical_specs?.dial_and_hands?.crystal || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, dial_and_hands: {...watchForm.technical_specs?.dial_and_hands, crystal: e.target.value}}})} placeholder="e.g., Sapphire" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Number of Hands</label>
                          <input type="number" value={watchForm.technical_specs?.dial_and_hands?.number_of_hands || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, dial_and_hands: {...watchForm.technical_specs?.dial_and_hands, number_of_hands: e.target.value}}})} placeholder="e.g., 2" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                      </>
                    )}

                    {bristonTab === 'strap' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Material</label>
                          <input type="text" value={watchForm.technical_specs?.strap?.material || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, strap: {...watchForm.technical_specs?.strap, material: e.target.value}}})} placeholder="e.g., Stainless Steel" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Colour</label>
                          <input type="text" value={watchForm.technical_specs?.strap?.colour || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, strap: {...watchForm.technical_specs?.strap, colour: e.target.value}}})} placeholder="e.g., Silver" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Width</label>
                          <input type="text" value={watchForm.technical_specs?.strap?.width || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, strap: {...watchForm.technical_specs?.strap, width: e.target.value}}})} placeholder="e.g., 12 mm" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Clasp Type</label>
                          <input type="text" value={watchForm.technical_specs?.strap?.clasp_type || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, strap: {...watchForm.technical_specs?.strap, clasp_type: e.target.value}}})} placeholder="e.g., Double Pusher" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* FESTINA Brand Specs - Categorized Sections */}
              {brands.find(b => b.id === watchForm.brand_id)?.name.toLowerCase().includes('festina') && (
                <div>
                  <div className="flex space-x-2 mb-4 border-b border-gray-200 overflow-x-auto">
                    {(['case', 'dial', 'strap', 'movement', 'functions', 'features'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setFestinaTab(tab)}
                        className={`px-4 py-2 font-satoshi capitalize whitespace-nowrap ${
                          festinaTab === tab
                            ? 'border-b-2 border-gray-900 text-gray-900 font-semibold'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {festinaTab === 'case' && (
                      <>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Material</label><input type="text" value={watchForm.technical_specs?.case?.material || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, material: e.target.value}}})} placeholder="e.g., Stainless Steel" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Thickness</label><input type="text" value={watchForm.technical_specs?.case?.thickness || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, thickness: e.target.value}}})} placeholder="e.g., 6.65 mm" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Shape</label><input type="text" value={watchForm.technical_specs?.case?.shape || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, shape: e.target.value}}})} placeholder="e.g., Round" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Diameter</label><input type="text" value={watchForm.technical_specs?.case?.diameter || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, diameter: e.target.value}}})} placeholder="e.g., 26 mm" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Weight</label><input type="text" value={watchForm.technical_specs?.case?.weight || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, case: {...watchForm.technical_specs?.case, weight: e.target.value}}})} placeholder="e.g., 46.32 g" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                      </>
                    )}

                    {festinaTab === 'dial' && (
                      <>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Colour</label><input type="text" value={watchForm.technical_specs?.dial?.colour || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, dial: {...watchForm.technical_specs?.dial, colour: e.target.value}}})} placeholder="e.g., Nacre" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Crystal</label><input type="text" value={watchForm.technical_specs?.dial?.crystal || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, dial: {...watchForm.technical_specs?.dial, crystal: e.target.value}}})} placeholder="e.g., Sapphire" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Number of Hands</label><input type="number" value={watchForm.technical_specs?.dial?.number_of_hands || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, dial: {...watchForm.technical_specs?.dial, number_of_hands: e.target.value}}})} placeholder="e.g., 2" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                      </>
                    )}

                    {festinaTab === 'strap' && (
                      <>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Material</label><input type="text" value={watchForm.technical_specs?.strap?.material || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, strap: {...watchForm.technical_specs?.strap, material: e.target.value}}})} placeholder="e.g., Stainless Steel" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Colour</label><input type="text" value={watchForm.technical_specs?.strap?.colour || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, strap: {...watchForm.technical_specs?.strap, colour: e.target.value}}})} placeholder="e.g., Silver" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Width</label><input type="text" value={watchForm.technical_specs?.strap?.width || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, strap: {...watchForm.technical_specs?.strap, width: e.target.value}}})} placeholder="e.g., 12 mm" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Clasp Type</label><input type="text" value={watchForm.technical_specs?.strap?.clasp_type || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, strap: {...watchForm.technical_specs?.strap, clasp_type: e.target.value}}})} placeholder="e.g., Double Pusher" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                      </>
                    )}

                    {festinaTab === 'movement' && (
                      <>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Type</label><input type="text" value={watchForm.technical_specs?.movement?.type || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, type: e.target.value}}})} placeholder="e.g., Quartz" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Name</label><input type="text" value={watchForm.technical_specs?.movement?.name || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, name: e.target.value}}})} placeholder="e.g., Miyota GI22" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Manufacturing</label><input type="text" value={watchForm.technical_specs?.movement?.manufacturing || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, manufacturing: e.target.value}}})} placeholder="e.g., Japan" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Battery Type</label><input type="text" value={watchForm.technical_specs?.movement?.battery_type || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, movement: {...watchForm.technical_specs?.movement, battery_type: e.target.value}}})} placeholder="e.g., Sr621sw" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                      </>
                    )}

                    {festinaTab === 'functions' && (
                      <>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Main Function</label><input type="text" value={watchForm.technical_specs?.functions?.main_function || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, functions: {...watchForm.technical_specs?.functions, main_function: e.target.value}}})} placeholder="e.g., Hours And Minutes" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Calendar</label><select value={watchForm.technical_specs?.functions?.calendar || 'No'} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, functions: {...watchForm.technical_specs?.functions, calendar: e.target.value}}})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"><option value="Yes">Yes</option><option value="No">No</option></select></div>
                      </>
                    )}

                    {festinaTab === 'features' && (
                      <>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Watertightness</label><input type="text" value={watchForm.technical_specs?.features?.watertightness || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, features: {...watchForm.technical_specs?.features, watertightness: e.target.value}}})} placeholder="e.g., 5 ATM" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Additional Features</label><textarea value={watchForm.technical_specs?.features?.additional_features || ''} onChange={(e) => setWatchForm({...watchForm, technical_specs: {...watchForm.technical_specs, features: {...watchForm.technical_specs?.features, additional_features: e.target.value}}})} placeholder="Enter additional features..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi" rows={2} /></div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images Section */}
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-satoshi">Images</h3>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Image className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 font-satoshi mb-2">
                Drag and drop images here or click to upload
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                className="w-full"
                onChange={(e) => {
                  // Handle image upload
                  if (e.target.files) {
                    const files = Array.from(e.target.files);
                    setWatchForm({
                      ...watchForm,
                      images: [...watchForm.images, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]
                    });
                  }
                }}
              />
            </div>

            {watchForm.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {watchForm.images.map((img, idx) => {
                  // Determine image source based on what's available
                  let imageSrc = '';
                  if (img.preview) {
                    imageSrc = img.preview; // New uploaded file
                  } else if (img.image_url) {
                    imageSrc = img.image_url; // From API
                  } else if (img.url) {
                    imageSrc = img.url; // Alternative property name
                  } else if (typeof img === 'string') {
                    imageSrc = img; // String URL
                  }

                  return (
                    <div key={idx} className="relative bg-gray-100 rounded-lg overflow-hidden h-24">
                      <img
                        src={imageSrc}
                        alt={img.alt_text || img.alt || `Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setWatchForm({
                          ...watchForm,
                          images: watchForm.images.filter((_, i) => i !== idx)
                        })}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div className="pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-satoshi">Videos</h3>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Video URL (YouTube/Vimeo)</label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-satoshi">Or Upload Video File (MP4/WebM)</label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                  />
                </div>
              </div>
            </div>

            {watchForm.videos.length > 0 && (
              <div className="mt-4 space-y-2">
                {watchForm.videos.map((video, idx) => {
                  // Determine video URL and title
                  const videoUrl = video.url || video.video_url || '';
                  const videoTitle = video.title || videoUrl || `Video ${idx + 1}`;

                  return (
                    <div key={idx} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                      <span className="text-sm text-gray-700 font-satoshi truncate">{videoTitle}</span>
                      <button
                        type="button"
                        onClick={() => setWatchForm({
                          ...watchForm,
                          videos: watchForm.videos.filter((_, i) => i !== idx)
                        })}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
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