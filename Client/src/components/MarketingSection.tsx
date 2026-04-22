import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/api';

interface MarketingContent {
  id: string;
  title: string;
  description?: string;
  product_id?: string;
  video_url?: string;
  thumbnail_image?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    sale_price?: number;
    currency: string;
  };
}

const getVideoEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('/embed/')) return url;

  let videoId = '';
  if (url.includes('youtube.com/watch')) {
    const m = url.match(/[?&]v=([^&]+)/);
    videoId = m ? m[1] : '';
  } else if (url.includes('youtu.be/')) {
    const m = url.match(/youtu\.be\/([^?&]+)/);
    videoId = m ? m[1] : '';
  } else if (url.includes('youtube.com') && url.includes('v=')) {
    const m = url.match(/v=([^&]+)/);
    videoId = m ? m[1] : '';
  }

  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&fs=0&rel=0&iv_load_policy=3&vq=hd1080&loop=1&playlist=${videoId}`;
  }
  return url;
};

export default function MarketingSection(): JSX.Element {
  const [marketingContent, setMarketingContent] = useState<MarketingContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketingContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/marketing?featured_only=true&limit=1`);
        const data = await response.json();
        if (data.success && data.data.marketing_content?.length > 0) {
          setMarketingContent(data.data.marketing_content[0]);
        }
      } catch (error) {
        console.error('Error fetching marketing content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketingContent();
  }, []);

  if (loading || !marketingContent) return <div />;

  const hasVideo = !!marketingContent.video_url;
  const hasThumbnail = !!marketingContent.thumbnail_image;

  return (
    <section className="w-full bg-[#F5F3EE] overflow-hidden">
      {/* Two-column editorial: media left (65%), text right (35%) */}
      <div className="flex flex-col lg:flex-row" style={{ minHeight: 'calc(80vh - 20px)' }}>

        {/* ── Left: Media ── */}
        <div className="relative w-full lg:w-[65%] order-2 lg:order-1 bg-black overflow-hidden" style={{ minHeight: '60vw', maxHeight: 'calc(90vh - 20px)' }}>
          {hasVideo && (
            <iframe
              src={getVideoEmbedUrl(marketingContent.video_url!)}
              title={marketingContent.title}
              allow="autoplay; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '160%',
                height: '160%',
                transform: 'translate(-50%, -50%)',
                border: 'none',
                pointerEvents: 'none',
              }}
            />
          )}
          {!hasVideo && hasThumbnail && (
            <img
              src={marketingContent.thumbnail_image}
              alt={marketingContent.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {!hasVideo && !hasThumbnail && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
          )}
        </div>

        {/* ── Right: Text ── */}
        <div className="w-full lg:w-[35%] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-16 lg:py-24 order-1 lg:order-2">

          {/* Eyebrow label */}
          <p className="text-[10px] font-inter font-light tracking-[0.4em] uppercase text-gray-400 mb-6">
            Featured Collection
          </p>

          {/* Title — always shown */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-cormorant font-light text-gray-900 leading-tight mb-6">
            {marketingContent.title}
          </h2>

          {/* Thin rule */}
          <div className="w-10 h-px bg-gray-300 mb-6" />

          {/* Product name (if separate from title) */}
          {marketingContent.product && marketingContent.product.name !== marketingContent.title && (
            <p className="text-base font-cormorant font-light text-gray-600 mb-4 tracking-wide">
              {marketingContent.product.name}
            </p>
          )}

          {/* Description */}
          {marketingContent.description && (
            <p className="text-sm font-inter font-light text-gray-600 leading-relaxed mb-10 max-w-xs">
              {marketingContent.description}
            </p>
          )}

          {/* CTA */}
          {marketingContent.product ? (
            <Link
              to={`/rings/${marketingContent.product.slug}`}
              className="inline-flex items-center gap-3 text-[11px] font-inter font-light tracking-[0.25em] uppercase text-gray-900 hover:text-gray-500 transition-colors duration-300 group"
            >
              <span>View Piece</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link
              to="/engagement-rings"
              className="inline-flex items-center gap-3 text-[11px] font-inter font-light tracking-[0.25em] uppercase text-gray-900 hover:text-gray-500 transition-colors duration-300 group"
            >
              <span>Explore Collection</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
