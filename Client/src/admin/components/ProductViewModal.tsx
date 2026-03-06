import React from 'react';
import Modal from './Modal';
import { Package, Star, CheckCircle, XCircle, Eye, Tag, Hash, TrendingUp, Layers, ExternalLink } from 'lucide-react';
import API_BASE_URL from '../../config/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  short_description?: string;
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
  weight?: number;
  dimensions?: string;
  care_instructions?: string;
  warranty_info?: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

/** Map a category slug to the correct public-facing URL prefix */
function getProductUrl(product: Product): string {
  const slug = product.category?.slug ?? '';
  const prefixMap: Record<string, string> = {
    'wedding-rings':    '/wedding-rings',
    'engagement-rings': '/engagement-rings',
    'rings':            '/rings',
    'earrings':         '/earrings',
    'necklaces':        '/necklaces',
    'bracelets':        '/bracelets',
    'watches':          '/watches',
    'diamonds':         '/diamonds',
  };
  const prefix = prefixMap[slug] ?? '/jewellery';
  return `${prefix}/${product.slug}`;
}

/** Prefix relative image paths with the API server origin */
function resolveImage(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const origin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Safe date formatter — returns '—' for null/undefined/invalid */
function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ProductViewModal: React.FC<ProductViewModalProps> = ({ isOpen, onClose, product }) => {
  if (!product) return null;

  const formatPrice = (price: number, currency: string = 'GBP') =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(price);

  const imageUrl = resolveImage(product.primary_image);
  const websiteUrl = getProductUrl(product);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Details" size="lg">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
          {/* Image */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-200">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <Package className="h-16 w-16 text-gray-400" />
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-light text-gray-900 font-cormorant">{product.name}</h3>
                <p className="text-gray-500 text-sm font-satoshi">SKU: {product.sku}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {product.is_featured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" /> Featured
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-satoshi uppercase tracking-wide">Category</p>
                <p className="text-sm font-medium text-gray-900 font-satoshi">{product.category.name}</p>
              </div>
              {product.collection && (
                <div>
                  <p className="text-xs text-gray-500 font-satoshi uppercase tracking-wide">Collection</p>
                  <p className="text-sm font-medium text-gray-900 font-satoshi">{product.collection.name}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-satoshi uppercase tracking-wide">Price</p>
                {product.sale_price ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-red-600 font-satoshi">
                      {formatPrice(product.sale_price, product.currency)}
                    </span>
                    <span className="text-sm text-gray-400 line-through font-satoshi">
                      {formatPrice(product.base_price, product.currency)}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-semibold text-gray-900 font-satoshi">
                    {formatPrice(product.base_price, product.currency)}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 font-satoshi uppercase tracking-wide">Stock</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  {product.variants_count > 0 ? ` · ${product.variants_count} variants` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="border-t border-gray-100 pt-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 font-satoshi uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Product Insights
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 font-satoshi">{product.variants_count}</p>
              <p className="text-xs text-gray-500 font-satoshi mt-0.5">Variants</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 font-satoshi">{product.stock_quantity}</p>
              <p className="text-xs text-gray-500 font-satoshi mt-0.5">In Stock</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${product.is_featured ? 'bg-yellow-50' : 'bg-gray-50'}`}>
              <p className={`text-2xl font-bold font-satoshi ${product.is_featured ? 'text-yellow-600' : 'text-gray-400'}`}>
                {product.is_featured ? '★' : '☆'}
              </p>
              <p className="text-xs text-gray-500 font-satoshi mt-0.5">Featured</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {(product.short_description || product.description) && (
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 font-satoshi uppercase tracking-wide">Description</h4>
            {product.short_description && (
              <p className="text-sm text-gray-700 mb-1 font-satoshi font-medium">{product.short_description}</p>
            )}
            {product.description && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap font-satoshi">{product.description}</p>
            )}
          </div>
        )}

        {/* Product Details */}
        <div className="border-t border-gray-100 pt-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 font-satoshi uppercase tracking-wide">Product Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {product.weight && (
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Weight</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.weight}g</p>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Dimensions</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.dimensions}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 font-satoshi">Created</p>
                <p className="text-sm text-gray-900 font-satoshi">{formatDate(product.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-satoshi">Last Updated</p>
                <p className="text-sm text-gray-900 font-satoshi">{formatDate(product.updated_at)}</p>
              </div>
            </div>
            <div className="space-y-2">
              {product.care_instructions && (
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Care Instructions</p>
                  <p className="text-sm text-gray-900 font-satoshi whitespace-pre-wrap">{product.care_instructions}</p>
                </div>
              )}
              {product.warranty_info && (
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Warranty</p>
                  <p className="text-sm text-gray-900 font-satoshi whitespace-pre-wrap">{product.warranty_info}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO */}
        {(product.meta_title || product.meta_description) && (
          <div className="border-t border-gray-100 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 font-satoshi uppercase tracking-wide">SEO</h4>
            <div className="space-y-2">
              {product.meta_title && (
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Meta Title</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.meta_title}</p>
                </div>
              )}
              {product.meta_description && (
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Meta Description</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.meta_description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical */}
        <div className="border-t border-gray-100 pt-5">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 font-satoshi uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4" /> Technical
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Product ID</p>
                  <p className="text-xs text-gray-900 font-mono break-all">{product.id}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">URL Slug</p>
                  <p className="text-xs text-gray-900 font-mono">{product.slug}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Currency</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.currency}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-satoshi">Variants</p>
                  <p className="text-sm text-gray-900 font-satoshi">
                    {product.variants_count > 0 ? `${product.variants_count} variants` : 'No variants'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
          <p className="text-xs text-gray-400 font-satoshi uppercase tracking-wide">Quick Links</p>
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-satoshi font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on Website
          </a>
        </div>

      </div>
    </Modal>
  );
};

export default ProductViewModal;
