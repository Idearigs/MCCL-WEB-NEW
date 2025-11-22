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

export default function MarketingSection(): JSX.Element {
  const [marketingContent, setMarketingContent] = useState<MarketingContent | null>(null);
  const [loading, setLoading] = useState(true);

  const getVideoEmbedUrl = (url: string): string => {
    if (!url) return '';

    console.log('Processing URL:', url);

    // If it's already an embed URL, return as is
    if (url.includes('/embed/')) {
      console.log('Already embed URL, returning:', url);
      return url;
    }

    let videoId = '';

    // Extract video ID from YouTube formats
    if (url.includes('youtube.com/watch')) {
      const match = url.match(/[?&]v=([^&]+)/);
      videoId = match ? match[1] : '';
      console.log('YouTube watch format, videoId:', videoId);
    } else if (url.includes('youtu.be/')) {
      const match = url.match(/youtu\.be\/([^?&]+)/);
      videoId = match ? match[1] : '';
      console.log('YouTube short format, videoId:', videoId);
    } else if (url.includes('youtube.com') && url.includes('v=')) {
      const match = url.match(/v=([^&]+)/);
      videoId = match ? match[1] : '';
      console.log('YouTube generic format, videoId:', videoId);
    }

    if (videoId) {
      // Use youtube-nocookie domain like hero section - no controls will show
      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&fs=0&rel=0&iv_load_policy=3`;
      console.log('Returning embed URL:', embedUrl);
      return embedUrl;
    }

    console.log('Not a YouTube URL, returning original:', url);
    // For other video sources, return as is
    return url;
  };

  useEffect(() => {
    const fetchMarketingContent = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/marketing?featured_only=true&limit=1`
        );
        const data = await response.json();

        console.log('Marketing API response:', data);

        if (data.success && data.data.marketing_content && data.data.marketing_content.length > 0) {
          const content = data.data.marketing_content[0];
          console.log('Marketing content found:', content);
          console.log('Video URL:', content.video_url);
          setMarketingContent(content);
        } else {
          console.log('No marketing content found');
        }
      } catch (error) {
        console.error('Error fetching marketing content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketingContent();
  }, []);

  if (loading || !marketingContent) {
    return <div />;
  }

  return (
    <section className="relative w-full" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="flex flex-col lg:flex-row">

        {/* Left Side - Video - Full Height */}
        <div className="w-full lg:w-2/3 h-64 sm:h-96 lg:h-screen order-2 lg:order-1 bg-black relative overflow-hidden">
          {marketingContent.video_url && (
            <iframe
              src={getVideoEmbedUrl(marketingContent.video_url)}
              title={marketingContent.title}
              allow="autoplay"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '150vw',
                height: '150vh',
                transform: 'translate(-50%, -50%)',
                border: 'none',
                pointerEvents: 'none'
              }}
            />
          )}
          {!marketingContent.video_url && marketingContent.thumbnail_image && (
            <img
              src={marketingContent.thumbnail_image}
              alt={marketingContent.title}
              className="w-full h-full object-cover"
            />
          )}
          {!marketingContent.video_url && !marketingContent.thumbnail_image && (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <p className="text-gray-400">Media content</p>
            </div>
          )}
        </div>

        {/* Right Side - Content - Full Height */}
        <div className="w-full lg:w-1/3 h-auto lg:h-screen flex flex-col justify-center items-center px-6 sm:px-10 lg:px-16 py-12 lg:py-0 order-1 lg:order-2 text-center">
          {/* Product Name */}
          {marketingContent.product && (
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-cormorant font-light text-gray-900 mb-6 lg:mb-8">
              {marketingContent.product.name}
            </h3>
          )}

          {/* Description */}
          {marketingContent.description && (
            <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-12 lg:mb-16 leading-relaxed max-w-md font-light">
              {marketingContent.description}
            </p>
          )}

          {/* CTA Button */}
          {marketingContent.product && (
            <div>
              <Link
                to={`/products/${marketingContent.product.slug}`}
                className="inline-block px-8 py-3 bg-white text-gray-900 border border-gray-900 font-serif font-medium text-xs uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all duration-300"
              >
                Start a Chat
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
