import React from 'react';
import Modal from './Modal';
import { Package, Star, CheckCircle, XCircle, Eye, Calendar, Tag, Hash } from 'lucide-react';

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

const ProductViewModal: React.FC<ProductViewModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  if (!product) return null;

  const formatPrice = (price: number, currency: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Product Details" size="lg">
      <div className="space-y-6">
        {/* Header with Image and Basic Info */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {product.primary_image ? (
                <img
                  src={product.primary_image}
                  alt={product.name}
                  className="w-full h-full object-cover"
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
                <h3 className="text-2xl font-light text-gray-900 font-cormorant">
                  {product.name}
                </h3>
                <p className="text-gray-600 font-satoshi">SKU: {product.sku}</p>
              </div>
              <div className="flex items-center space-x-2">
                {product.is_featured && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.is_active ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <XCircle className="w-3 h-3 mr-1" />
                  )}
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-satoshi">Category</p>
                <p className="text-sm font-medium text-gray-900 font-satoshi">{product.category.name}</p>
              </div>
              {product.collection && (
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Collection</p>
                  <p className="text-sm font-medium text-gray-900 font-satoshi">{product.collection.name}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-satoshi">Price</p>
                <div className="flex items-center space-x-2">
                  {product.sale_price ? (
                    <>
                      <span className="text-lg font-semibold text-red-600 font-satoshi">
                        {formatPrice(product.sale_price, product.currency)}
                      </span>
                      <span className="text-sm text-gray-500 line-through font-satoshi">
                        {formatPrice(product.base_price, product.currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-gray-900 font-satoshi">
                      {formatPrice(product.base_price, product.currency)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-satoshi">Stock</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stock_quantity} {product.variants_count > 0 ? `(+${product.variants_count} variants)` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {(product.short_description || product.description) && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3 font-cormorant">Description</h4>
            {product.short_description && (
              <p className="text-sm text-gray-700 mb-2 font-satoshi font-medium">
                {product.short_description}
              </p>
            )}
            {product.description && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap font-satoshi">
                {product.description}
              </p>
            )}
          </div>
        )}

        {/* Product Details */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 font-cormorant">Product Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              {product.weight && (
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Weight</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.weight}g</p>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Dimensions</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.dimensions}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 font-satoshi">Created</p>
                <p className="text-sm text-gray-900 font-satoshi">{formatDate(product.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-satoshi">Last Updated</p>
                <p className="text-sm text-gray-900 font-satoshi">{formatDate(product.updated_at)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {product.care_instructions && (
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Care Instructions</p>
                  <p className="text-sm text-gray-900 font-satoshi whitespace-pre-wrap">
                    {product.care_instructions}
                  </p>
                </div>
              )}
              {product.warranty_info && (
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Warranty</p>
                  <p className="text-sm text-gray-900 font-satoshi whitespace-pre-wrap">
                    {product.warranty_info}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO Information */}
        {(product.meta_title || product.meta_description) && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4 font-cormorant">SEO Information</h4>
            <div className="space-y-3">
              {product.meta_title && (
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Meta Title</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.meta_title}</p>
                </div>
              )}
              {product.meta_description && (
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Meta Description</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.meta_description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Information */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4 font-cormorant">Technical Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Product ID</p>
                  <p className="text-sm text-gray-900 font-mono">{product.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">URL Slug</p>
                  <p className="text-sm text-gray-900 font-mono">{product.slug}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Currency</p>
                  <p className="text-sm text-gray-900 font-satoshi">{product.currency}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500 font-satoshi">Variants</p>
                  <p className="text-sm text-gray-900 font-satoshi">
                    {product.variants_count > 0 ? `${product.variants_count} variants` : 'No variants'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 font-satoshi">
              Quick Links
            </div>
            <div className="flex space-x-3">
              <a
                href={`/products/${product.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 font-satoshi"
              >
                View on Website →
              </a>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductViewModal;