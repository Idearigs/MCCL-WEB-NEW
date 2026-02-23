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

  useEffect(() => {
    if (promotion && !loading) {
      const timer = setTimeout(() => setIsOpen(true), delay);
      return () => clearTimeout(timer);
    }
  }, [promotion, loading, delay]);

  if (!promotion || !isOpen) return <div />;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-75 z-40 cursor-pointer"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[88vw] max-w-sm">
        <div
          className="bg-white relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all duration-200"
          >
            <X className="w-4 h-4 text-gray-700" strokeWidth={2} />
          </button>

          {/* Image */}
          {promotion.image_url && (
            <div className="h-48 overflow-hidden">
              <img
                src={promotion.image_url}
                alt={promotion.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="px-10 py-10 text-center">

            {/* Top ornament */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-px bg-gray-300" />
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <div className="w-10 h-px bg-gray-300" />
            </div>

            {/* Discount — elegant label instead of red badge */}
            {promotion.discount_percentage && (
              <p className="text-xs font-inter font-light uppercase tracking-[0.35em] text-gray-400 mb-3">
                Up to {promotion.discount_percentage}% Off
              </p>
            )}

            {/* Title */}
            <h2 className="text-3xl font-cormorant font-light text-gray-900 mb-5 leading-tight">
              {promotion.title}
            </h2>

            {/* Description */}
            {promotion.description && (
              <p className="text-sm font-inter font-light text-gray-500 leading-relaxed mb-7 max-w-[220px] mx-auto">
                {promotion.description}
              </p>
            )}

            {/* Featured Product */}
            {promotion.product && (
              <div className="mb-7 border-t border-gray-100 pt-5">
                <p className="text-xs font-inter font-light uppercase tracking-[0.3em] text-gray-400 mb-2">
                  Featured
                </p>
                <h3 className="text-base font-cormorant font-light text-gray-900 mb-2 leading-snug">
                  {promotion.product.name}
                </h3>
                <div className="flex items-baseline justify-center gap-3">
                  <span className="text-lg font-cormorant text-gray-900">
                    £{(promotion.product.sale_price || promotion.product.base_price).toLocaleString()}
                  </span>
                  {promotion.product.sale_price && (
                    <span className="text-sm font-cormorant text-gray-400 line-through">
                      £{promotion.product.base_price.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* CTA */}
            {promotion.product ? (
              <Link
                to={`/products/${promotion.product.slug}`}
                onClick={() => setIsOpen(false)}
                className="inline-block px-10 py-3 border border-gray-900 text-gray-900 font-inter font-light text-xs uppercase tracking-[0.2em] hover:bg-gray-900 hover:text-white transition-all duration-300"
              >
                Shop Now
              </Link>
            ) : (
              <button
                onClick={() => setIsOpen(false)}
                className="px-10 py-3 border border-gray-400 text-gray-600 font-inter font-light text-xs uppercase tracking-[0.2em] hover:border-gray-900 hover:text-gray-900 transition-all duration-300"
              >
                Discover More
              </button>
            )}

            {/* Bottom ornament */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="w-10 h-px bg-gray-200" />
              <div className="w-1 h-1 bg-gray-300 rounded-full" />
              <div className="w-10 h-px bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
