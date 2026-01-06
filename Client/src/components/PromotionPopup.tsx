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
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[85vw] max-w-xs sm:max-w-sm md:max-w-xl max-h-[80vh] overflow-y-auto">
        <div
          className="bg-white rounded-md sm:rounded-lg shadow-2xl overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 z-10 p-1.5 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex flex-col gap-0">
            {/* Image Section */}
            {promotion.image_url && (
              <div className="bg-gray-200 h-40 sm:h-44 overflow-hidden">
                <img
                  src={promotion.image_url}
                  alt={promotion.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content Section */}
            <div className={`flex flex-col justify-center items-center p-5 sm:p-6 text-center ${!promotion.image_url ? '' : ''}`}>
              {promotion.discount_percentage && (
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-500 rounded-full mb-3">
                  <span className="text-white text-lg sm:text-xl font-bold">
                    {promotion.discount_percentage}%
                  </span>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-cormorant font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {promotion.title}
              </h2>

              {promotion.description && (
                <p className="text-gray-600 mb-4 text-xs sm:text-sm leading-relaxed" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {promotion.description}
                </p>
              )}

              {promotion.product && (
                <div className="mb-4">
                  <p className="text-gray-500 text-xs mb-1">Featured Product</p>
                  <h3 className="text-sm sm:text-base font-cormorant font-light text-gray-900 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {promotion.product.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-cormorant font-semibold text-gray-900" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      {promotion.product.currency} {promotion.product.sale_price || promotion.product.base_price}
                    </span>
                    {promotion.product.sale_price && (
                      <span className="text-sm font-cormorant text-gray-400 line-through" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
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
                  className="inline-block px-6 py-2.5 sm:px-7 sm:py-3 bg-gray-900 text-white font-medium text-xs uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 text-center"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Shop Now
                </Link>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="inline-block px-6 py-2.5 sm:px-7 sm:py-3 bg-gray-900 text-white font-medium text-xs uppercase tracking-wider hover:bg-gray-800 transition-all duration-300"
                  style={{ fontFamily: 'Inter, sans-serif' }}
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
