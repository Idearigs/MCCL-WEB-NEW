
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, getMediaUrl } from "../config/api";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_featured: boolean;
  brand: {
    id: string;
    name: string;
    slug: string;
  };
}

export const WatchCollectionsSection = (): JSX.Element => {
  const navigate = useNavigate();
  const [watchCollections, setWatchCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/watches/featured-collections`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Get first 3 featured collections
            setWatchCollections(data.data.slice(0, 3));
          }
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
        // Fall back to empty array - section will still render
        setWatchCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);
  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative h-[366px] bg-black">
        <div className="h-full bg-[#00000066] bg-[url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&fit=crop)] bg-cover bg-center">
          <div className="w-full h-full bg-[#00000099] flex items-center justify-center">
            <div className="text-center">
              <h1 className="font-serif font-light text-white text-[51px] leading-[60px] mb-6">
                Timepieces
              </h1>
              <p className="font-serif font-light text-white text-[17px] leading-7">
                Discover our collection of sophisticated timepieces
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Watch Collections Section */}
      <section className="py-24 px-4">
        <div className="max-w-[988px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-[148px]">
            <h2 className="font-serif font-light text-gray-900 text-[25.5px] leading-9 mb-[60px]">
              Watch Collections
            </h2>
            <p className="font-serif font-normal text-gray-600 text-[13.6px] leading-6">
              Each collection represents the pinnacle of watchmaking excellence
            </p>
          </div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {watchCollections.map((collection, index) => (
              <div
                key={collection.id}
                onClick={() => navigate(`/collections/${collection.slug}`)}
                className="group cursor-pointer"
              >
                <Card
                  className="h-[432px] bg-[#00000033] overflow-hidden border-none hover:shadow-lg transition-shadow duration-300"
                >
                  <CardContent className="p-0 h-full">
                    <div className="relative h-[400px]">
                      <div
                        className="h-[276px] bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{ backgroundImage: `url(${collection.image_url ? getMediaUrl(collection.image_url) : 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=400&fit=crop'})` }}
                      />
                      <div className="h-[124px] bg-white p-8 group-hover:bg-gray-50 transition-colors duration-300">
                        <h3 className="font-serif font-light text-black text-[20.4px] leading-8 mb-4">
                          {collection.name}
                        </h3>
                        <p className="font-serif font-normal text-black text-[11.9px] leading-5">
                          {collection.description || `Discover ${collection.brand.name} ${collection.name}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Watch Care Service Section */}
      <section className="h-96 bg-gray-50 flex items-center justify-center">
        <div className="max-w-[768px] mx-auto text-center px-4">
          <h2 className="font-serif font-light text-gray-900 text-[25.5px] leading-9 mb-[60px]">
            Watch Care Service
          </h2>

          <div className="mb-[80px]">
            <p className="font-serif font-normal text-gray-600 text-[13.6px] leading-6 mb-[26px]">
              Our expert watchmakers provide comprehensive care and maintenance
              services to ensure your timepiece
            </p>
            <p className="font-serif font-normal text-gray-600 text-[13.6px] leading-6">
              maintains its precision and beauty for generations to come.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-[246px] h-[52px] bg-white border-[0.25px] border-black font-serif font-normal text-black text-[11.9px] leading-5 h-auto"
          >
            Schedule Service
          </Button>
        </div>
      </section>
    </div>
  );
};

export default WatchCollectionsSection;
