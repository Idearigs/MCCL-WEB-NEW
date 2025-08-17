import React, { useState, useEffect } from 'react';
import { Star, Calendar } from 'lucide-react';

// Interface for custom reviews from backend
interface CustomReview {
  id: string;
  name: string;
  role?: string;
  content: string;
  rating: number;
  image?: string;
  date: string;
  featured?: boolean;
}

// Mock Custom Reviews (These will be fetched from your backend)
const mockCustomReviews: CustomReview[] = [
  {
    id: "custom_1",
    name: "Sarah Johnson",
    role: "Engagement Ring Customer", 
    content: "The craftsmanship of my engagement ring is beyond stunning. The attention to detail and personalized service made the experience truly special.",
    rating: 5,
    image: "/images/testimonials/sarah.jpg",
    date: "2024-07-15",
    featured: true
  },
  {
    id: "custom_2",
    name: "Michael Chen",
    role: "Anniversary Gift",
    content: "Exceptional quality and timeless design. The necklace I bought for our anniversary took her breath away. Worth every penny!",
    rating: 5, 
    image: "/images/testimonials/michael.jpg",
    date: "2024-06-20",
    featured: false
  },
  {
    id: "custom_3",
    name: "Emma Williams",
    role: "Custom Wedding Set",
    content: "Andrew created the most beautiful custom wedding set for us. The attention to detail and craftsmanship exceeded our expectations. Absolutely stunning!",
    rating: 5,
    image: "/images/testimonials/emma.jpg",
    date: "2024-08-01",
    featured: false
  }
];

// Hook for fetching reviews from backend
const useReviews = () => {
  const [reviews, setReviews] = useState<CustomReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        // Simulate API call (replace with actual backend API call)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // TODO: Replace with actual backend API call  
        // const customReviews = await fetch('/api/reviews').then(res => res.json());
        const customReviews = mockCustomReviews;
        
        // Sort reviews (featured first, then by date - newest first)
        const sortedReviews = customReviews.sort((a, b) => {
          // Featured reviews first
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          
          // Then by date (newest first)
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setReviews(sortedReviews);
        setError(null);
      } catch (err) {
        setError('Failed to load reviews');
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return { reviews, loading, error };
};

const TestimonialsSection = () => {
  const { reviews, loading, error } = useReviews();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-swipe every 2 seconds
  useEffect(() => {
    if (reviews.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [reviews.length]);


  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const formatDate = (review: CustomReview) => {
    return new Date(review.date).toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAvatarUrl = (review: CustomReview) => {
    return review.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=8b7d65&color=fff`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-light text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <div className="w-20 h-0.5 bg-[#8b7d65] mx-auto mb-6"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover the experiences of those who have entrusted us with their most precious moments.
            </p>
          </div>

        {/* Reviews - Horizontal Auto-Swipe Carousel */}
        <div className="relative max-w-2xl mx-auto overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {reviews.map((review) => (
              <div 
                key={review.id}
                className="w-full flex-shrink-0 px-4"
              >
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center max-w-lg mx-auto">
                  {/* Review Content */}
                  <p className="text-base text-gray-700 leading-relaxed italic mb-4 font-light">
                    "{review.content}"
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {renderStars(review.rating)}
                  </div>
                  
                  {/* Author Info */}
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      <img 
                        src={getAvatarUrl(review)} 
                        alt={review.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.name)}&background=8b7d65&color=fff`;
                        }}
                      />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900 text-sm">{review.name}</h4>
                      {review.role && (
                        <p className="text-xs text-gray-500">{review.role}</p>
                      )}
                    </div>
                    {review.featured && (
                      <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
                        Featured
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 gap-2">
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentIndex ? 'bg-[#8b7d65]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
