import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { LoadingState } from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductFormModal from '../components/ProductFormModal';
import ProductViewModal from '../components/ProductViewModal';
import API_BASE_URL from '../../config/api';
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Star,
  ChevronDown,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  base_price: number;
  sale_price?: number;
  currency: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  collection?: {
    id: string;
    name: string;
    slug: string;
  };
  is_active: boolean;
  is_featured: boolean;
  in_stock: boolean;
  stock_quantity: number;
  variants_count: number;
  primary_image?: string;
  created_at: string;
  updated_at: string;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ProductOptions {
  categories: Array<{ id: string; name: string; slug: string }>;
  collections: Array<{ id: string; name: string; slug: string }>;
  jewelrySubTypes: Array<{ id: string; name: string; slug: string }>; // Engagement/Wedding
  metals: Array<{ id: string; name: string; color_code: string; price_multiplier: number }>;
  sizes: Array<{ id: string; size_name: string; size_value: string; category_id: string }>;
  ringTypes: Array<{ id: string; name: string; slug: string }>;
  stoneShapes: Array<{ id: string; name: string; slug: string }>;
  stoneTypes: Array<{ id: string; name: string; slug: string }>;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    collection: '',
    status: '',
    featured: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    limit: 10
  });
  const [sortBy, setSortBy] = useState('sku');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Modal states
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProductView, setShowProductView] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Alert states
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  } | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('admin_token');

      const queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        category: filters.category,
        collection: filters.collection,
        status: filters.status,
        featured: filters.featured,
        sortBy,
        sortOrder
      });

      const response = await fetch(`${API_BASE_URL}/admin/products?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products');
      }

      setProducts(data.data.products);
      setPagination(data.data.pagination);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductOptions = async () => {
    try {
      const token = localStorage.getItem('admin_token');

      // Fetch all product options in a single request
      const productsOptionsResponse = await fetch(`${API_BASE_URL}/admin/products/options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch all categories and their related data
      const [
        categoriesResponse,
        jewelrySubTypesResponse,
        ringTypesResponse,
        stoneShapesResponse,
        stoneTypesResponse,
        metalsResponse,
        collectionsResponse
      ] = await Promise.all([
        // Categories
        fetch(`${API_BASE_URL}/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Jewelry Sub Types (Engagement/Wedding)
        fetch(`${API_BASE_URL}/admin/jewelry-categories/jewelry-sub-types`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Ring types (now used for ring styles)
        fetch(`${API_BASE_URL}/admin/categories/ring-types`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Stone Shapes (renamed from Gemstones)
        fetch(`${API_BASE_URL}/admin/categories/stone-shapes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Stone Types (new)
        fetch(`${API_BASE_URL}/admin/categories/stone-types`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Metals
        fetch(`${API_BASE_URL}/admin/categories/metals`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        // Collections
        fetch(`${API_BASE_URL}/admin/categories/collections`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Parse all responses
      const [
        categoriesData,
        jewelrySubTypesData,
        ringTypesData,
        stoneShapesData,
        stoneTypesData,
        metalsData,
        collectionsData
      ] = await Promise.all([
        categoriesResponse.json(),
        jewelrySubTypesResponse.json(),
        ringTypesResponse.json(),
        stoneShapesResponse.json(),
        stoneTypesResponse.json(),
        metalsResponse.json(),
        collectionsResponse.json()
      ]);

      // Parse product options response
      const productsOptionsData = await productsOptionsResponse.json();

      // Combine all data
      const combinedOptions: ProductOptions = {
        categories: Array.isArray(categoriesData) ? categoriesData.filter(cat => cat.level === 0) : [],
        collections: Array.isArray(collectionsData) ? collectionsData : [],
        jewelrySubTypes: jewelrySubTypesData.success ? jewelrySubTypesData.data : [],
        ringTypes: Array.isArray(ringTypesData) ? ringTypesData : [],
        stoneShapes: Array.isArray(stoneShapesData) ? stoneShapesData : [],
        stoneTypes: Array.isArray(stoneTypesData) ? stoneTypesData : [],
        metals: Array.isArray(metalsData) ? metalsData : [],
        sizes: productsOptionsData.success ? productsOptionsData.data.sizes : []
      };

      setProductOptions(combinedOptions);
    } catch (error: any) {
      console.error('Failed to fetch product options:', error);
      // Fallback to empty data if API calls fail
      setProductOptions({
        categories: [],
        collections: [],
        jewelrySubTypes: [],
        ringTypes: [],
        stoneShapes: [],
        stoneTypes: [],
        metals: [],
        sizes: []
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.currentPage, pagination.limit, searchTerm, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchProductOptions();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleBulkAction = async (action: string, value?: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/products/bulk/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIds: selectedProducts,
          action,
          value
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Bulk action failed');
      }

      // Refresh products and clear selection
      fetchProducts();
      setSelectedProducts([]);
      setShowBulkActions(false);

      const actionNames = {
        activate: 'activated',
        deactivate: 'deactivated',
        feature: 'marked as featured',
        unfeature: 'unmarked as featured',
        set_category: 'category updated',
        set_collection: 'collection updated'
      };

      showAlert('success', 'Bulk action completed', `${selectedProducts.length} products ${actionNames[action as keyof typeof actionNames] || 'updated'}.`);
    } catch (error: any) {
      showAlert('error', 'Bulk action failed', error.message);
    }
  };

  const toggleProductStatus = async (productId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle status');
      }

      fetchProducts();
      showAlert('success', 'Product status updated successfully');
    } catch (error: any) {
      showAlert('error', 'Failed to toggle product status', error.message);
    }
  };

  const toggleFeaturedStatus = async (productId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/toggle-featured`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to toggle featured status');
      }

      fetchProducts();
      showAlert('success', 'Featured status updated successfully');
    } catch (error: any) {
      showAlert('error', 'Failed to toggle featured status', error.message);
    }
  };

  // Alert helper function
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    setAlert({ type, title, message });
  };

  // Create product
  const handleCreateProduct = async (productData: any) => {
    try {
      setFormLoading(true);
      const token = localStorage.getItem('admin_token');

      // Check if there are any files to upload
      const hasFiles = (productData.images && productData.images.some((img: any) => img.file)) ||
                      (productData.videos && productData.videos.some((vid: any) => vid.file));

      let response;

      if (hasFiles) {
        // Use FormData for file uploads
        const formData = new FormData();

        // Add basic product data
        const basicData = { ...productData };
        delete basicData.images;
        delete basicData.videos;

        Object.keys(basicData).forEach(key => {
          if (basicData[key] !== undefined && basicData[key] !== null) {
            if (Array.isArray(basicData[key])) {
              formData.append(key, JSON.stringify(basicData[key]));
            } else {
              formData.append(key, basicData[key].toString());
            }
          }
        });

        // Add image files
        if (productData.images) {
          productData.images.forEach((image: any, index: number) => {
            if (image.file) {
              formData.append('media', image.file);
              formData.append(`image_${index}_alt_text`, image.alt_text || '');
            }
          });
        }

        // Add video files
        if (productData.videos) {
          productData.videos.forEach((video: any, index: number) => {
            if (video.file) {
              formData.append('media', video.file);
              formData.append(`video_${index}_title`, video.title || '');
            }
          });
        }

        response = await fetch(`${API_BASE_URL}/admin/products/with-media`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        // Use JSON for products without files
        const cleanData = { ...productData };
        // Remove file objects and blob URLs
        if (cleanData.images) {
          cleanData.images = cleanData.images
            .filter((img: any) => img.url && !img.url.startsWith('blob:'))
            .map((img: any) => ({ url: img.url, alt_text: img.alt_text }));
        }
        if (cleanData.videos) {
          cleanData.videos = cleanData.videos
            .filter((vid: any) => vid.url && !vid.url.startsWith('blob:'))
            .map((vid: any) => ({ url: vid.url, title: vid.title }));
        }

        response = await fetch(`${API_BASE_URL}/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanData),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create product');
      }

      setShowProductForm(false);
      setEditingProduct(null);
      fetchProducts();
      showAlert('success', 'Product created successfully', `${productData.name} has been added to your catalog.`);
    } catch (error: any) {
      showAlert('error', 'Failed to create product', error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit product
  const handleEditProduct = async (productData: any) => {
    try {
      setFormLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/products/${editingProduct?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product');
      }

      setShowProductForm(false);
      setEditingProduct(null);
      fetchProducts();
      showAlert('success', 'Product updated successfully', `${productData.name} has been updated.`);
    } catch (error: any) {
      showAlert('error', 'Failed to update product', error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async () => {
    try {
      setFormLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/products/${deletingProduct?.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete product');
      }

      setShowDeleteConfirm(false);
      setDeletingProduct(null);
      fetchProducts();
      showAlert('success', 'Product deleted successfully', `${deletingProduct?.name} has been removed from your catalog.`);
    } catch (error: any) {
      showAlert('error', 'Failed to delete product', error.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Open modals
  const openCreateForm = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const openEditForm = async (product: Product) => {
    try {
      setFormLoading(true);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/products/${product.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch product details');
      }

      // Transform the product data to match the form format
      const transformedProduct = {
        ...data.data,
        // Transform relationship arrays to ID arrays
        ring_type_ids: data.data.ringTypes?.map((rt: any) => rt.id) || [],
        stone_shape_ids: data.data.stoneShapes?.map((ss: any) => ss.id) || [],
        metal_ids: data.data.metals?.map((m: any) => m.id) || [],
        // Transform single stone type relationship
        stone_type_id: data.data.stoneType?.id || '',
        // Transform 5 ring style relationships to arrays for multi-select
        ring_style_1_ids: data.data.ringStyle1?.id ? [data.data.ringStyle1.id] : [],
        ring_style_2_ids: data.data.ringStyle2?.id ? [data.data.ringStyle2.id] : [],
        ring_style_3_ids: data.data.ringStyle3?.id ? [data.data.ringStyle3.id] : [],
        ring_style_4_ids: data.data.ringStyle4?.id ? [data.data.ringStyle4.id] : [],
        ring_style_5_ids: data.data.ringStyle5?.id ? [data.data.ringStyle5.id] : [],
        // Transform images to include both url and alt_text with proper structure
        images: data.data.images?.map((img: any) => ({
          file: null,
          url: img.image_url,
          alt_text: img.alt_text || ''
        })) || [],
        // Transform videos to include proper structure
        videos: data.data.videos?.map((vid: any) => ({
          file: null,
          url: vid.video_url,
          title: vid.title || ''
        })) || [],
        // Ensure collection_id is string or empty string
        collection_id: data.data.collection?.id || ''
      };

      setEditingProduct(transformedProduct);
      setShowProductForm(true);
    } catch (error: any) {
      showAlert('error', 'Failed to load product', error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const openViewModal = (product: Product) => {
    setViewingProduct(product);
    setShowProductView(true);
  };

  const openDeleteConfirm = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteConfirm(true);
  };

  const formatPrice = (price: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading && products.length === 0) {
    return (
      <AdminLayout>
        <LoadingState message="Loading products..." size="lg" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900 font-cormorant">Products</h1>
            <p className="text-gray-600 mt-1 font-satoshi">
              Manage your jewelry collection and product catalog
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2 font-satoshi"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <div className="text-sm text-red-700 font-satoshi">{error}</div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 w-full font-satoshi"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="">All Categories</option>
                {productOptions?.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={filters.featured}
                onChange={(e) => handleFilterChange('featured', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="">All Products</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
              >
                <option value="sku">Sort by: SKU</option>
                <option value="name">Sort by: Name</option>
                <option value="base_price">Sort by: Price</option>
                <option value="created_at">Sort by: Date Created</option>
                <option value="updated_at">Sort by: Date Updated</option>
              </select>

              {/* Sort Order Toggle */}
              <button
                onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                className="border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 font-satoshi"
                title={sortOrder === 'ASC' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'ASC' ? '↑ A-Z' : '↓ Z-A'}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-blue-700 font-medium font-satoshi">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 font-satoshi"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 font-satoshi"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkAction('feature')}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 font-satoshi"
                >
                  Feature
                </button>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-satoshi"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onChange={selectAllProducts}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 font-satoshi"
                    onClick={() => handleSort('name')}
                  >
                    Product
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 font-satoshi"
                    onClick={() => handleSort('category')}
                  >
                    Category
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 font-satoshi"
                    onClick={() => handleSort('base_price')}
                  >
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                    Status
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 font-satoshi"
                    onClick={() => handleSort('created_at')}
                  >
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-satoshi">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.primary_image ? (
                            <img
                              src={product.primary_image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate font-satoshi">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate font-satoshi">
                            SKU: {product.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 font-satoshi">{product.category.name}</span>
                      {product.collection && (
                        <span className="block text-xs text-gray-500 font-satoshi">
                          {product.collection.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-satoshi">
                        {product.sale_price ? (
                          <div>
                            <span className="text-red-600 font-medium">
                              {formatPrice(product.sale_price, product.currency)}
                            </span>
                            <span className="text-gray-500 line-through ml-2 text-xs">
                              {formatPrice(product.base_price, product.currency)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium">
                            {formatPrice(product.base_price, product.currency)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-satoshi">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock_quantity} {product.variants_count > 0 ? `(+${product.variants_count} variants)` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        } font-satoshi`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {product.is_featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 font-satoshi">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-satoshi">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleProductStatus(product.id)}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            product.is_active ? 'text-green-600' : 'text-gray-400'
                          }`}
                          title="Toggle Status"
                        >
                          {product.is_active ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => toggleFeaturedStatus(product.id)}
                          className={`p-1 rounded hover:bg-gray-100 ${
                            product.is_featured ? 'text-yellow-500' : 'text-gray-400'
                          }`}
                          title="Toggle Featured"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openViewModal(product)}
                          className="p-1 text-blue-600 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            openEditForm(product).catch(console.error);
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(product)}
                          className="p-1 text-red-600 hover:bg-gray-100 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-500 font-satoshi">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalItems)} of{' '}
                {pagination.totalItems} products
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-satoshi"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 font-satoshi">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={!pagination.hasNext}
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-satoshi"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 font-cormorant">No products found</h3>
            <p className="text-gray-500 mb-4 font-satoshi">
              {searchTerm || Object.values(filters).some(f => f)
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first product'}
            </p>
            <button
              onClick={openCreateForm}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-satoshi"
            >
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* Modals and Dialogs */}
      <ProductFormModal
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? handleEditProduct : handleCreateProduct}
        initialData={editingProduct || undefined}
        mode={editingProduct ? 'edit' : 'create'}
        categories={productOptions?.categories || []}
        collections={productOptions?.collections || []}
        jewelrySubTypes={productOptions?.jewelrySubTypes || []}
        ringTypes={productOptions?.ringTypes || []}
        stoneShapes={productOptions?.stoneShapes || []}
        stoneTypes={productOptions?.stoneTypes || []}
        metals={productOptions?.metals || []}
        isLoading={formLoading}
      />

      <ProductViewModal
        isOpen={showProductView}
        onClose={() => {
          setShowProductView(false);
          setViewingProduct(null);
        }}
        product={viewingProduct}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleDeleteProduct}
        title="Delete Product"
        message={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
        type="danger"
        confirmText="Delete Product"
        isLoading={formLoading}
      />

      {/* Alert */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          isVisible={!!alert}
          onClose={() => setAlert(null)}
        />
      )}
    </AdminLayout>
  );
};

export default AdminProducts;