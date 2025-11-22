import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import API_BASE_URL from '../config/api';

interface Promotion {
  id: string;
  title: string;
  description?: string;
  discount_percentage?: number;
  image_url?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price?: number;
    currency: string;
  };
}

interface PromotionPopupProps {
  delay?: number;
}

export default function PromotionPopup({ delay = 3000 }: PromotionPopupProps): JSX.Element {
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/promotions?type=popup&active_only=true`
        );
        const data = await response.json();

        if (data.success && data.data.promotions && data.data.promotions.length > 0) {
          setPromotion(data.data.promotions[0]);
        }
      } catch (error) {
        console.error('Error fetching promotion:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, []);

  // Show popup after delay
  useEffect(() => {
    if (promotion && !loading) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [promotion, loading, delay]);

  if (!promotion || !isOpen) {
    return <div />;
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 cursor-pointer"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-2xl w-full mx-4">
        <div
          className="bg-white rounded-lg shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image Section */}
            {promotion.image_url && (
              <div className="bg-gray-200 h-64 md:h-auto overflow-hidden">
                <img
                  src={promotion.image_url}
                  alt={promotion.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content Section */}
            <div className={`flex flex-col justify-center p-8 ${!promotion.image_url ? 'col-span-2' : ''}`}>
              {promotion.discount_percentage && (
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-4">
                  <span className="text-white text-2xl font-bold">
                    {promotion.discount_percentage}%
                  </span>
                </div>
              )}

              <h2 className="text-3xl md:text-4xl font-cormorant font-light text-gray-900 mb-3">
                {promotion.title}
              </h2>

              {promotion.description && (
                <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
                  {promotion.description}
                </p>
              )}

              {promotion.product && (
                <div className="mb-6">
                  <p className="text-gray-500 text-sm mb-2">Featured Product</p>
                  <h3 className="text-xl font-cormorant font-light text-gray-900 mb-2">
                    {promotion.product.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-cormorant font-semibold text-gray-900">
                      {promotion.product.currency} {promotion.product.sale_price || promotion.product.base_price}
                    </span>
                    {promotion.product.sale_price && (
                      <span className="text-lg font-cormorant text-gray-400 line-through">
                        {promotion.product.currency} {promotion.product.base_price}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {promotion.product ? (
                <Link
                  to={`/products/${promotion.product.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="inline-block px-6 py-3 bg-gray-900 text-white font-serif font-medium text-sm uppercase tracking-widest hover:bg-gray-800 transition-all duration-300 self-start"
                >
                  Shop Now
                </Link>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="inline-block px-6 py-3 bg-gray-900 text-white font-serif font-medium text-sm uppercase tracking-widest hover:bg-gray-800 transition-all duration-300 self-start"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
