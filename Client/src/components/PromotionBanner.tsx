import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';

interface Promotion {
  id: string;
  banner_text?: string;
  banner_text_1?: string;
  banner_text_2?: string;
  banner_text_3?: string;
  banner_text_4?: string;
  banner_text_5?: string;
  discount_percentage?: number;
}

export default function PromotionBanner(): JSX.Element {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/promotions?type=banner&active_only=true`
        );
        const data = await response.json();

        if (data.success && data.data.promotions) {
          setPromotions(data.data.promotions);
        }
      } catch (error) {
        console.error('Error fetching promotions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  if (loading || promotions.length === 0) {
    return <div />;
  }

  // Collect all banner texts from all promotions
  const allBannerTexts: string[] = [];

  promotions.forEach(p => {
    if (p.banner_text_1) allBannerTexts.push(p.banner_text_1);
    if (p.banner_text_2) allBannerTexts.push(p.banner_text_2);
    if (p.banner_text_3) allBannerTexts.push(p.banner_text_3);
    if (p.banner_text_4) allBannerTexts.push(p.banner_text_4);
    if (p.banner_text_5) allBannerTexts.push(p.banner_text_5);
    // Fallback to old banner_text field if new fields are empty
    if (allBannerTexts.length === 0 && p.banner_text) {
      allBannerTexts.push(p.banner_text);
    }
  });

  // If no individual items, use the combined text
  const itemsToDisplay = allBannerTexts.length > 0 ? allBannerTexts : ['Special Offer'];

  return (
    <div className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden py-3">
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50% - 2rem));
          }
        }
        .marquee-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .marquee-container {
          display: flex;
          animation: marquee 50s linear infinite;
          white-space: nowrap;
          will-change: transform;
        }
        .marquee-container:hover {
          animation-play-state: paused;
        }
        .marquee-item {
          display: inline-flex;
          align-items: center;
          padding: 0 2rem;
          flex-shrink: 0;
          min-width: max-content;
        }
        .marquee-separator {
          display: inline-block;
          margin: 0 1rem;
          color: rgba(255, 255, 255, 0.5);
          flex-shrink: 0;
        }
      `}</style>

      <div className="marquee-wrapper">
        <div className="marquee-container text-sm sm:text-base font-medium tracking-wide">
          {/* Create truly seamless loop by duplicating items 3x */}
          {[...itemsToDisplay, ...itemsToDisplay, ...itemsToDisplay].map((text, index) => (
            <React.Fragment key={index}>
              <div className="marquee-item">
                <span>{text}</span>
              </div>
              {(index + 1) % itemsToDisplay.length !== 0 && (
                <span className="marquee-separator">•</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
