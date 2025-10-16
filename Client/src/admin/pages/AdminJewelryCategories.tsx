import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import {
  Search, Plus, Edit, Trash2, Eye, Filter, Package, Gem, Palette, Star,
  Circle, Sparkles, Link2, Watch, ChevronRight, Settings
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import ToastContainer from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { LoadingState } from '../components/LoadingSpinner';
import JewelryCategoryFormModal from '../components/JewelryCategoryFormModal';
import API_BASE_URL from '../../config/api';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface JewelryType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  subTypes?: JewelrySubType[];
}

interface JewelrySubType {
  id: string;
  jewelry_type_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
}

interface EarringType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

interface NecklaceType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

interface BraceletType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

interface RingType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

interface StoneShape {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
}

interface StoneType {
  id: string;
  name: string;
  slug: string;
  description?: string;
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

type ViewMode = 'overview' | 'engagement' | 'wedding' | 'earrings' | 'necklaces' | 'bracelets';
type SubCategoryType = 'ringTypes' | 'stoneShapes' | 'stoneTypes' | 'metals' | 'collections' | 'earringTypes' | 'necklaceTypes' | 'braceletTypes';
type CategoryFormType = 'earringType' | 'necklaceType' | 'braceletType' | 'ringType' | 'stoneShape' | 'stoneType' | 'metal' | 'collection' | 'jewelryType' | 'jewelrySubType';

// =====================================================
// MAIN COMPONENT
// =====================================================

const AdminJewelryCategories: React.FC = () => {
  // Authentication
  const { isAuthenticated, isLoading: isAuthLoading } = useAdminAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Data state
  const [jewelryTypes, setJewelryTypes] = useState<JewelryType[]>([]);
  const [jewelrySubTypes, setJewelrySubTypes] = useState<JewelrySubType[]>([]);
  const [earringTypes, setEarringTypes] = useState<EarringType[]>([]);
  const [necklaceTypes, setNecklaceTypes] = useState<NecklaceType[]>([]);
  const [braceletTypes, setBraceletTypes] = useState<BraceletType[]>([]);

  // Existing attribute types (universal for rings)
  const [ringTypes, setRingTypes] = useState<RingType[]>([]);
  const [stoneShapes, setStoneShapes] = useState<StoneShape[]>([]);
  const [stoneTypes, setStoneTypes] = useState<StoneType[]>([]);
  const [metals, setMetals] = useState<ProductMetal[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Active sub-category type for ring management
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategoryType>('ringTypes');

  // Modal & selection states
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<CategoryFormType>('earringType');

  // Toast notifications
  const { toasts, showToast, removeToast } = useToast();

  // Confirmation dialogs
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);

  // =====================================================
  // DATA FETCHING
  // =====================================================

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

      const [
        jewelryTypesRes,
        jewelrySubTypesRes,
        earringTypesRes,
        necklaceTypesRes,
        braceletTypesRes,
        ringTypesRes,
        stoneShapesRes,
        stoneTypesRes,
        metalsRes,
        collectionsRes
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/jewelry-categories/jewelry-types`, { headers }),
        fetch(`${API_BASE_URL}/admin/jewelry-categories/jewelry-sub-types`, { headers }),
        fetch(`${API_BASE_URL}/admin/jewelry-categories/earring-types`, { headers }),
        fetch(`${API_BASE_URL}/admin/jewelry-categories/necklace-types`, { headers }),
        fetch(`${API_BASE_URL}/admin/jewelry-categories/bracelet-types`, { headers }),
        fetch(`${API_BASE_URL}/admin/categories/ring-types`, { headers }),
        fetch(`${API_BASE_URL}/admin/categories/stone-shapes`, { headers }),
        fetch(`${API_BASE_URL}/admin/categories/stone-types`, { headers }),
        fetch(`${API_BASE_URL}/admin/categories/metals`, { headers }),
        fetch(`${API_BASE_URL}/admin/categories/collections`, { headers })
      ]);

      if (!jewelryTypesRes.ok) throw new Error('Failed to fetch jewelry types');
      if (!jewelrySubTypesRes.ok) throw new Error('Failed to fetch jewelry sub types');
      if (!earringTypesRes.ok) throw new Error('Failed to fetch earring types');
      if (!necklaceTypesRes.ok) throw new Error('Failed to fetch necklace types');
      if (!braceletTypesRes.ok) throw new Error('Failed to fetch bracelet types');
      if (!ringTypesRes.ok) throw new Error('Failed to fetch ring types');
      if (!stoneShapesRes.ok) throw new Error('Failed to fetch stone shapes');
      if (!stoneTypesRes.ok) throw new Error('Failed to fetch stone types');
      if (!metalsRes.ok) throw new Error('Failed to fetch metals');
      if (!collectionsRes.ok) throw new Error('Failed to fetch collections');

      const jewelryTypesData = await jewelryTypesRes.json();
      const jewelrySubTypesData = await jewelrySubTypesRes.json();
      const earringTypesData = await earringTypesRes.json();
      const necklaceTypesData = await necklaceTypesRes.json();
      const braceletTypesData = await braceletTypesRes.json();

      setJewelryTypes(jewelryTypesData.data || []);
      setJewelrySubTypes(jewelrySubTypesData.data || []);
      setEarringTypes(earringTypesData.data || []);
      setNecklaceTypes(necklaceTypesData.data || []);
      setBraceletTypes(braceletTypesData.data || []);
      setRingTypes(await ringTypesRes.json());
      setStoneShapes(await stoneShapesRes.json());
      setStoneTypes(await stoneTypesRes.json());
      setMetals(await metalsRes.json());
      setCollections(await collectionsRes.json());

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('error', 'Failed to fetch category data');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, any> = {
      'Circle': Circle,
      'Sparkles': Sparkles,
      'Link': Link2,
      'Watch': Watch
    };
    return iconMap[iconName || 'Package'] || Package;
  };

  const getCurrentData = () => {
    let data: any[] = [];

    if (viewMode === 'overview') {
      data = jewelryTypes;
    } else if (viewMode === 'engagement' || viewMode === 'wedding') {
      // For ring sub-types, show the appropriate attribute category
      if (activeSubCategory === 'ringTypes') data = ringTypes;
      else if (activeSubCategory === 'stoneShapes') data = stoneShapes;
      else if (activeSubCategory === 'stoneTypes') data = stoneTypes;
      else if (activeSubCategory === 'metals') data = metals;
      else if (activeSubCategory === 'collections') data = collections;
    } else if (viewMode === 'earrings') {
      data = earringTypes;
    } else if (viewMode === 'necklaces') {
      data = necklaceTypes;
    } else if (viewMode === 'bracelets') {
      data = braceletTypes;
    }

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

  // =====================================================
  // DELETE HANDLERS
  // =====================================================

  const handleDelete = (item: any, type: string) => {
    setItemToDelete({ id: item.id, name: item.name, type });
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const token = localStorage.getItem('admin_token');
      const endpoints: Record<string, string> = {
        jewelryType: `jewelry-categories/jewelry-types/${itemToDelete.id}`,
        jewelrySubType: `jewelry-categories/jewelry-sub-types/${itemToDelete.id}`,
        earringType: `jewelry-categories/earring-types/${itemToDelete.id}`,
        necklaceType: `jewelry-categories/necklace-types/${itemToDelete.id}`,
        braceletType: `jewelry-categories/bracelet-types/${itemToDelete.id}`,
        ringType: `categories/ring-types/${itemToDelete.id}`,
        stoneShape: `categories/stone-shapes/${itemToDelete.id}`,
        stoneType: `categories/stone-types/${itemToDelete.id}`,
        metal: `categories/metals/${itemToDelete.id}`,
        collection: `categories/collections/${itemToDelete.id}`
      };

      const endpointPath = endpoints[itemToDelete.type];
      if (!endpointPath) {
        showToast('error', 'Invalid item type for deletion');
        setShowConfirmDialog(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/${endpointPath}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('success', `${itemToDelete.name} deleted successfully`);

        // Update state based on type
        if (itemToDelete.type === 'earringType') {
          setEarringTypes(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'necklaceType') {
          setNecklaceTypes(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'braceletType') {
          setBraceletTypes(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'ringType') {
          setRingTypes(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'stoneShape') {
          setStoneShapes(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'stoneType') {
          setStoneTypes(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'metal') {
          setMetals(prev => prev.filter(item => item.id !== itemToDelete.id));
        } else if (itemToDelete.type === 'collection') {
          setCollections(prev => prev.filter(item => item.id !== itemToDelete.id));
        }
      } else {
        showToast('error', 'Failed to delete item');
      }
    } catch (error) {
      showToast('error', 'Error deleting item');
    }

    setShowConfirmDialog(false);
    setItemToDelete(null);
  };

  // =====================================================
  // CRUD HANDLERS
  // =====================================================

  const getCurrentCategoryType = (): CategoryFormType => {
    if (viewMode === 'earrings') return 'earringType';
    if (viewMode === 'necklaces') return 'necklaceType';
    if (viewMode === 'bracelets') return 'braceletType';
    if (viewMode === 'engagement' || viewMode === 'wedding') {
      if (activeSubCategory === 'ringTypes') return 'ringType';
      if (activeSubCategory === 'stoneShapes') return 'stoneShape';
      if (activeSubCategory === 'stoneTypes') return 'stoneType';
      if (activeSubCategory === 'metals') return 'metal';
      if (activeSubCategory === 'collections') return 'collection';
    }
    return 'earringType';
  };

  const handleCreate = () => {
    const categoryType = getCurrentCategoryType();
    setModalType(categoryType);
    setModalMode('create');
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    const categoryType = getCurrentCategoryType();
    setModalType(categoryType);
    setModalMode('edit');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleView = (item: any) => {
    const categoryType = getCurrentCategoryType();
    setModalType(categoryType);
    setModalMode('view');
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleFormSuccess = (updatedItem: any) => {
    if (modalMode === 'create') {
      // Add new item to appropriate state
      if (modalType === 'earringType') {
        setEarringTypes(prev => [...prev, updatedItem]);
      } else if (modalType === 'necklaceType') {
        setNecklaceTypes(prev => [...prev, updatedItem]);
      } else if (modalType === 'braceletType') {
        setBraceletTypes(prev => [...prev, updatedItem]);
      } else if (modalType === 'ringType') {
        setRingTypes(prev => [...prev, updatedItem]);
      } else if (modalType === 'stoneShape') {
        setStoneShapes(prev => [...prev, updatedItem]);
      } else if (modalType === 'stoneType') {
        setStoneTypes(prev => [...prev, updatedItem]);
      } else if (modalType === 'metal') {
        setMetals(prev => [...prev, updatedItem]);
      } else if (modalType === 'collection') {
        setCollections(prev => [...prev, updatedItem]);
      } else if (modalType === 'jewelryType') {
        setJewelryTypes(prev => [...prev, updatedItem]);
      } else if (modalType === 'jewelrySubType') {
        setJewelrySubTypes(prev => [...prev, updatedItem]);
      }

      showToast('success', 'Created successfully!');
    } else if (modalMode === 'edit') {
      // Update existing item in appropriate state
      if (modalType === 'earringType') {
        setEarringTypes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'necklaceType') {
        setNecklaceTypes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'braceletType') {
        setBraceletTypes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'ringType') {
        setRingTypes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'stoneShape') {
        setStoneShapes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'stoneType') {
        setStoneTypes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'metal') {
        setMetals(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'collection') {
        setCollections(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'jewelryType') {
        setJewelryTypes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      } else if (modalType === 'jewelrySubType') {
        setJewelrySubTypes(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      }

      showToast('success', 'Updated successfully!');
    }
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderViewModeButtons = () => {
    const buttons = [
      { mode: 'overview' as ViewMode, label: 'Overview', icon: Settings },
      { mode: 'engagement' as ViewMode, label: 'Engagement Rings', icon: Circle },
      { mode: 'wedding' as ViewMode, label: 'Wedding Rings', icon: Circle },
      { mode: 'earrings' as ViewMode, label: 'Earrings', icon: Sparkles },
      { mode: 'necklaces' as ViewMode, label: 'Necklaces', icon: Link2 },
      { mode: 'bracelets' as ViewMode, label: 'Bracelets', icon: Watch }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {buttons.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => {
              setViewMode(mode);
              setSelectedItems([]);
              setSearchTerm('');
            }}
            className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
              viewMode === mode
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-blue-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon size={24} />
            <span className="text-sm font-medium text-center">{label}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderRingSubCategoryTabs = () => {
    if (viewMode !== 'engagement' && viewMode !== 'wedding') return null;

    const tabs = [
      { key: 'ringTypes' as SubCategoryType, label: 'Ring Styles', count: ringTypes.length },
      { key: 'stoneShapes' as SubCategoryType, label: 'Stone Shapes', count: stoneShapes.length },
      { key: 'stoneTypes' as SubCategoryType, label: 'Stone Types', count: stoneTypes.length },
      { key: 'metals' as SubCategoryType, label: 'Metals', count: metals.length },
      { key: 'collections' as SubCategoryType, label: 'Collections', count: collections.length }
    ];

    return (
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveSubCategory(tab.key);
                setSelectedItems([]);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeSubCategory === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  const renderOverviewCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {jewelryTypes.map((type) => {
          const Icon = getIconComponent(type.icon);
          const subTypes = jewelrySubTypes.filter(st => st.jewelry_type_id === type.id);

          return (
            <div key={type.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Icon className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    <p className="text-sm text-gray-500">{type.slug}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  type.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {type.description && (
                <p className="text-sm text-gray-600 mb-4">{type.description}</p>
              )}

              {subTypes.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Sub-categories:</p>
                  <div className="space-y-1">
                    {subTypes.map(subType => (
                      <div key={subType.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{subType.name}</span>
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDataTable = () => {
    const currentData = getCurrentData();
    const isRingAttributes = viewMode === 'engagement' || viewMode === 'wedding';

    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                {(viewMode === 'overview' || !isRingAttributes) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                )}
                {activeSubCategory === 'metals' && isRingAttributes && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                )}
                {(activeSubCategory === 'stoneShapes' || activeSubCategory === 'stoneTypes') && isRingAttributes && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
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
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="w-12 h-12 text-gray-300" />
                      <p>No items found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    {(viewMode === 'overview' || !isRingAttributes) && item.slug && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          {item.slug}
                        </span>
                      </td>
                    )}
                    {activeSubCategory === 'metals' && isRingAttributes && item.color_code && (
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
                    {(activeSubCategory === 'stoneShapes' || activeSubCategory === 'stoneTypes') && isRingAttributes && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{item.slug || '-'}</span>
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
                          onClick={() => handleView(item)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            let type = '';
                            if (viewMode === 'earrings') type = 'earringType';
                            else if (viewMode === 'necklaces') type = 'necklaceType';
                            else if (viewMode === 'bracelets') type = 'braceletType';
                            else if (activeSubCategory === 'ringTypes') type = 'ringType';
                            else if (activeSubCategory === 'stoneShapes') type = 'stoneShape';
                            else if (activeSubCategory === 'stoneTypes') type = 'stoneType';
                            else if (activeSubCategory === 'metals') type = 'metal';
                            else if (activeSubCategory === 'collections') type = 'collection';

                            handleDelete(item, type);
                          }}
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
    );
  };

  // =====================================================
  // MAIN RENDER
  // =====================================================

  if (loading) {
    return (
      <AdminLayout>
        <LoadingState message="Loading jewelry categories..." size="lg" />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-satoshi">Jewelry Category Management</h1>
            <p className="text-gray-600">Manage all jewelry categories, types, and attributes</p>
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* View Mode Selection */}
        {renderViewModeButtons()}

        {/* Ring Sub-Category Tabs (only show for engagement/wedding) */}
        {renderRingSubCategoryTabs()}

        {/* Search and Filter Controls */}
        {viewMode !== 'overview' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search..."
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

            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium"
            >
              <Plus size={16} />
              <span>Add New</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        {viewMode === 'overview' ? renderOverviewCards() : renderDataTable()}

        {/* Delete Confirmation Dialog */}
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

        {/* CRUD Form Modal */}
        <JewelryCategoryFormModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mode={modalMode}
          type={modalType}
          item={selectedItem}
          onSuccess={handleFormSuccess}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminJewelryCategories;
