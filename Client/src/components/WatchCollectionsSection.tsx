
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

const watchCollections = [
  {
    title: "Classic Collection",
    description: "Timeless elegance for every occasion",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500&h=400&fit=crop",
  },
  {
    title: "Sport Collection",
    description: "Performance meets sophistication",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&h=400&fit=crop",
  },
  {
    title: "Limited Editions",
    description: "Exclusive timepieces for collectors",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=400&fit=crop",
  },
];

export const WatchCollectionsSection = (): JSX.Element => {
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
              <Card
                key={index}
                className="h-[432px] bg-[#00000033] overflow-hidden border-none"
              >
                <CardContent className="p-0 h-full">
                  <div className="relative h-[400px]">
                    <div
                      className="h-[276px] bg-cover bg-center"
                      style={{ backgroundImage: `url(${collection.image})` }}
                    />
                    <div className="h-[124px] bg-white p-8">
                      <h3 className="font-serif font-light text-black text-[20.4px] leading-8 mb-4">
                        {collection.title}
                      </h3>
                      <p className="font-serif font-normal text-black text-[11.9px] leading-5">
                        {collection.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
